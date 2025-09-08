const axios = require('axios');
const aiLlmLogService = require('../aiLlmLogService');

class OllamaProvider {
  constructor() {
    this.providerType = 'ollama';
  }

  /**
   * Check Ollama connectivity and model availability
   */
  async checkConnection(config, organizationId) {
    const startTime = Date.now();
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      // Check Ollama connectivity
      const versionResponse = await axios.get(`${baseUrl}/api/version`, {
        timeout: config.connectionTimeout,
      });
      
      const serverVersion = versionResponse.data?.version || 'Unknown';
      
      // Then check available models
      const modelsResponse = await axios.get(`${baseUrl}/api/tags`, {
        timeout: config.connectionTimeout,
      });
      
      const availableModels = modelsResponse.data.models || [];
      const modelNames = availableModels.map(m => m.name);
      const modelExists = modelNames.includes(config.model);
      const targetModel = availableModels.find(model => model.name === config.model);
      
      const connectionTime = Date.now() - startTime;
      
      return {
        connected: true,
        modelAvailable: modelExists,
        serverVersion,
        connectionTime,
        totalModels: availableModels.length,
        availableModels: modelNames,
        targetModelInfo: targetModel ? {
          name: targetModel.name,
          size: targetModel.size,
          modified: targetModel.modified_at,
          family: targetModel.details?.family || 'unknown'
        } : null,
        endpoint: baseUrl,
        providerType: this.providerType,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      console.error('Ollama connection check failed:', error.message);
      
      // Categorize the error
      let errorCategory = 'unknown';
      if (error.code === 'ECONNREFUSED') {
        errorCategory = 'connection_refused';
      } else if (error.code === 'ETIMEDOUT') {
        errorCategory = 'timeout';
      } else if (error.code === 'ENOTFOUND') {
        errorCategory = 'dns_error';
      }
      
      return {
        connected: false,
        modelAvailable: false,
        error: error.message,
        errorCategory,
        connectionTime,
        endpoint: baseUrl,
        providerType: this.providerType,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate text using Ollama API
   */
  async generateText(config, prompt, options = {}) {
    const { model, maxTokens, temperature, timeout, organizationId, userId, contextType, contextId } = options;
    const baseUrl = `http://${config.host}:${config.port}`;
    
    const payload = {
      model: model || config.model,
      prompt,
      stream: false,
      options: {
        temperature: parseFloat(temperature || config.temperature || 0.7),
        num_predict: parseInt(maxTokens || config.maxTokens || 2000),
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
      },
    };

    // Create log entry for this request
    let logId = null;
    if (organizationId) {
      try {
        console.log('🔍 DEBUG OLLAMA: Creating LLM log entry with context:', { userId, contextType, contextId });
        // Get provider information for logging
        const providerInfo = await aiLlmLogService.getProviderInfo(organizationId, config.providerId);
        
        logId = await aiLlmLogService.createLogEntry({
          organizationId,
          providerId: config.providerId || null,
          providerName: providerInfo.name,
          providerType: this.providerType,
          providerUrl: `${baseUrl}/api/generate`,
          modelName: payload.model,
          maxTokens: payload.options.num_predict,
          tokenWindow: config.maxTokenWindow || null,
          temperature: payload.options.temperature,
          rawPrompt: prompt,
          userId,
          contextType,
          contextId,
          requestHeaders: {
            'Content-Type': 'application/json'
          }
        });
      } catch (logError) {
        console.error('Failed to create AI LLM log entry:', logError);
        // Continue with request even if logging fails
      }
    }

    const requestTimeout = timeout || config.generationTimeout || 120000;
    console.log('🧪 Ollama request payload:', JSON.stringify(payload, null, 2));
    console.log('⏱️ Ollama request timeout:', requestTimeout, 'ms');

    try {
      const response = await axios.post(`${baseUrl}/api/generate`, payload, {
        timeout: requestTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🧪 Ollama response status:', response.status);
      console.log('🧪 Ollama response data keys:', Object.keys(response.data || {}));
      console.log('🧪 Ollama hasResponse check:', !!(response.data && response.data.response));
      
      // Check if we have content in either response or thinking field
      const actualResponse = response.data?.response?.trim() || response.data?.thinking?.trim() || '';
      const responseSource = response.data?.response?.trim() ? 'response' : 'thinking';
      
      if (actualResponse.length > 0) {
        console.log(`🧪 Ollama content found in ${responseSource} field, length:`, actualResponse.length);
        console.log('🧪 Ollama content preview:', JSON.stringify(actualResponse.substring(0, 100)));
      } else {
        console.log('🧪 Ollama NO CONTENT IN RESPONSE OR THINKING FIELDS');
        console.log('🧪 response.data:', !!response.data);
        console.log('🧪 response.data.response type:', typeof response.data?.response);
        console.log('🧪 response.data.response value:', JSON.stringify(response.data?.response));
        console.log('🧪 response.data.response length:', response.data?.response?.length || 0);
        console.log('🧪 response.data.thinking type:', typeof response.data?.thinking);
        console.log('🧪 response.data.thinking length:', response.data?.thinking?.length || 0);
        console.log('🧪 response.data keys:', Object.keys(response.data || {}));
      }

      if (actualResponse.length > 0) {
        // Log successful response
        if (logId) {
          try {
            await aiLlmLogService.logSuccess(logId, {
              rawResponse: actualResponse,
              inputTokens: response.data.prompt_eval_count || aiLlmLogService.estimateTokens(prompt),
              outputTokens: response.data.eval_count || aiLlmLogService.estimateTokens(actualResponse),
              responseHeaders: response.headers,
              httpStatusCode: response.status,
              providerMetadata: {
                eval_count: response.data.eval_count,
                eval_duration: response.data.eval_duration,
                load_duration: response.data.load_duration,
                prompt_eval_count: response.data.prompt_eval_count,
                prompt_eval_duration: response.data.prompt_eval_duration,
                total_duration: response.data.total_duration,
                model: response.data.model,
                created_at: response.data.created_at,
                done: response.data.done,
                response_source: responseSource // Track which field was used
              }
            });
          } catch (logError) {
            console.error('Failed to log successful AI response:', logError);
          }
        }

        console.log(`✅ Ollama successful response from ${responseSource} field`);
        return actualResponse;
      } else if (response.data && response.data.error) {
        const errorMsg = `Ollama error: ${response.data.error}`;
        
        // Log failure
        if (logId) {
          try {
            await aiLlmLogService.logFailure(logId, {
              errorMessage: errorMsg,
              httpStatusCode: response.status,
              responseHeaders: response.headers
            });
          } catch (logError) {
            console.error('Failed to log AI failure:', logError);
          }
        }
        
        throw new Error(errorMsg);
      } else {
        const errorMsg = 'Invalid response from Ollama - no response content received';
        
        // Log failure
        if (logId) {
          try {
            await aiLlmLogService.logFailure(logId, {
              errorMessage: errorMsg,
              httpStatusCode: response.status,
              responseHeaders: response.headers
            });
          } catch (logError) {
            console.error('Failed to log AI failure:', logError);
          }
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Ollama generation error:', error.message);
      
      let errorMessage = error.message;
      let httpStatusCode = null;
      let responseHeaders = null;

      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to Ollama at ${baseUrl}. Please ensure Ollama is running and accessible.`;
        httpStatusCode = null;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `Ollama generation timed out after ${requestTimeout / 1000}s. The model may be too large or the server overloaded.`;
        httpStatusCode = null;
      } else if (error.response) {
        // HTTP error response from server
        const status = error.response.status;
        const data = error.response.data;
        httpStatusCode = status;
        responseHeaders = error.response.headers;
        
        console.error('❌ Ollama HTTP error:', status, data);
        
        if (status === 500) {
          if (data && data.error) {
            if (data.error.includes('model') && data.error.includes('not found')) {
              errorMessage = `Model '${payload.model}' not found on Ollama server. Available models can be checked with 'ollama list' command.`;
            } else if (data.error.includes('out of memory') || data.error.includes('OOM')) {
              errorMessage = `Ollama server ran out of memory while processing the request. Try reducing max tokens or using a smaller model.`;
            } else {
              errorMessage = `Ollama server error: ${data.error}`;
            }
          } else {
            errorMessage = `Ollama server returned 500 error. This usually means the model is not found or the server encountered an internal error.`;
          }
        } else if (status === 404) {
          errorMessage = `Ollama API endpoint not found. Please check if Ollama is running on ${baseUrl} and the API is accessible.`;
        } else if (status === 400) {
          errorMessage = `Bad request to Ollama API: ${data?.error || 'Invalid request parameters'}`;
        } else {
          errorMessage = `Ollama API returned ${status}: ${data?.error || error.message}`;
        }
      }

      // Log failure
      if (logId) {
        try {
          await aiLlmLogService.logFailure(logId, {
            errorMessage,
            httpStatusCode,
            responseHeaders
          });
        } catch (logError) {
          console.error('Failed to log AI failure:', logError);
        }
      }

      // Re-throw the error
      throw new Error(errorMessage);
    }
  }

  /**
   * Get available models from Ollama
   */
  async getAvailableModels(config) {
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      const response = await axios.get(`${baseUrl}/api/tags`, {
        timeout: config.connectionTimeout || 30000,
      });
      
      const models = response.data.models || [];
      return models.map(model => ({
        id: model.name,
        name: model.name,
        size: model.size,
        modified: model.modified_at,
        family: model.details?.family || 'unknown',
        provider: this.providerType
      }));
    } catch (error) {
      console.error('Failed to get Ollama models:', error.message);
      return [];
    }
  }

  /**
   * Build API URL for Ollama endpoints
   */
  buildApiUrl(config, endpoint) {
    const baseUrl = `http://${config.host}:${config.port}`;
    return `${baseUrl}/api/${endpoint}`;
  }

  /**
   * Validate Ollama configuration
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config.host) {
      errors.push('Host is required for Ollama provider');
    }
    
    if (!config.port) {
      errors.push('Port is required for Ollama provider');
    }
    
    if (!config.model) {
      errors.push('Model is required for Ollama provider');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get provider-specific settings schema
   */
  getSettingsSchema() {
    return {
      host: {
        type: 'string',
        required: true,
        description: 'Ollama server hostname or IP address'
      },
      port: {
        type: 'number',
        required: true,
        default: 11434,
        description: 'Ollama server port'
      },
      model: {
        type: 'string',
        required: true,
        description: 'Model name to use for generation'
      },
      maxTokens: {
        type: 'number',
        default: 2000,
        description: 'Maximum tokens to generate'
      },
      temperature: {
        type: 'number',
        default: 0.7,
        min: 0,
        max: 2,
        description: 'Sampling temperature'
      }
    };
  }
}

module.exports = OllamaProvider;