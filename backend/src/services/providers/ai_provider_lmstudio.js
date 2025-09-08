const axios = require('axios');
const aiLlmLogService = require('../aiLlmLogService');

class LMStudioProvider {
  constructor() {
    this.providerType = 'lmstudio';
  }

  /**
   * Check LM Studio connectivity and model availability
   */
  async checkConnection(config, organizationId) {
    const startTime = Date.now();
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      // Check LM Studio connectivity by getting available models
      const modelsResponse = await axios.get(`${baseUrl}/v1/models`, {
        timeout: config.connectionTimeout,
      });
      
      const availableModels = modelsResponse.data.data || [];
      const modelNames = availableModels.map(m => m.id);
      const modelExists = modelNames.includes(config.model);
      
      const connectionTime = Date.now() - startTime;
      
      return {
        connected: true,
        modelAvailable: modelExists,
        serverVersion: 'LM Studio',
        connectionTime,
        totalModels: availableModels.length,
        availableModels: modelNames,
        endpoint: baseUrl,
        providerType: this.providerType,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      console.error('LM Studio connection check failed:', error.message);
      
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
   * Generate text using LM Studio API
   */
  async generateText(config, prompt, options = {}) {
    const { model, maxTokens, temperature, timeout, organizationId, userId, contextType, contextId } = options;
    const baseUrl = `http://${config.host}:${config.port}`;
    
    const payload = {
      model: model || config.model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: maxTokens || config.maxTokens || 2000,
      temperature: temperature || config.temperature || 0.7,
      stream: false
    };

    // Create log entry for this request
    let logId = null;
    if (organizationId) {
      try {
        console.log('🔍 DEBUG LMSTUDIO: Creating LLM log entry with context:', { userId, contextType, contextId });
        // Get provider information for logging
        const providerInfo = await aiLlmLogService.getProviderInfo(organizationId, config.providerId);
        
        logId = await aiLlmLogService.createLogEntry({
          organizationId,
          providerId: config.providerId || null,
          providerName: providerInfo.name,
          providerType: this.providerType,
          providerUrl: `${baseUrl}/v1/chat/completions`,
          modelName: payload.model,
          maxTokens: payload.max_tokens,
          tokenWindow: config.maxTokenWindow || null,
          temperature: payload.temperature,
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
    console.log('🧪 LM Studio request payload:', JSON.stringify(payload, null, 2));
    console.log('⏱️ LM Studio request timeout:', requestTimeout, 'ms');

    try {
      const response = await axios.post(`${baseUrl}/v1/chat/completions`, payload, {
        timeout: requestTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🧪 LM Studio response status:', response.status);
      console.log('🧪 LM Studio response data keys:', Object.keys(response.data || {}));

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        const responseContent = response.data.choices[0].message.content;
        
        if (responseContent && responseContent.trim().length > 0) {
          console.log('🧪 LM Studio content found, length:', responseContent.length);
          
          // Log successful response
          if (logId) {
            try {
              await aiLlmLogService.logSuccess(logId, {
                rawResponse: responseContent,
                inputTokens: response.data.usage?.prompt_tokens || aiLlmLogService.estimateTokens(prompt),
                outputTokens: response.data.usage?.completion_tokens || aiLlmLogService.estimateTokens(responseContent),
                responseHeaders: response.headers,
                httpStatusCode: response.status,
                providerMetadata: {
                  usage: response.data.usage,
                  model: response.data.model,
                  created: response.data.created,
                  object: response.data.object,
                  choices: response.data.choices.map(choice => ({
                    index: choice.index,
                    finish_reason: choice.finish_reason
                  }))
                }
              });
            } catch (logError) {
              console.error('Failed to log successful AI response:', logError);
            }
          }

          console.log('✅ LM Studio successful response');
          return responseContent;
        }
      }

      const errorMsg = 'Invalid response from LM Studio - no response content received';
      
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
    } catch (error) {
      console.error('❌ LM Studio generation error:', error.message);
      
      let errorMessage = error.message;
      let httpStatusCode = null;
      let responseHeaders = null;

      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to LM Studio at ${baseUrl}. Please ensure LM Studio is running and the server is accessible.`;
        httpStatusCode = null;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `LM Studio generation timed out after ${requestTimeout / 1000}s. The model may be too large or the server overloaded.`;
        httpStatusCode = null;
      } else if (error.response) {
        // HTTP error response from server
        const status = error.response.status;
        const data = error.response.data;
        httpStatusCode = status;
        responseHeaders = error.response.headers;
        
        console.error('❌ LM Studio HTTP error:', status, data);
        
        if (status === 500) {
          if (data && data.error) {
            if (data.error.message && data.error.message.includes('model') && data.error.message.includes('not found')) {
              errorMessage = `Model '${payload.model}' not found on LM Studio server. Please ensure the model is loaded in LM Studio.`;
            } else if (data.error.message && (data.error.message.includes('out of memory') || data.error.message.includes('OOM'))) {
              errorMessage = `LM Studio server ran out of memory while processing the request. Try reducing max tokens or using a smaller model.`;
            } else {
              errorMessage = `LM Studio server error: ${data.error.message || data.error}`;
            }
          } else {
            errorMessage = `LM Studio server returned 500 error. This usually means the model is not loaded or the server encountered an internal error.`;
          }
        } else if (status === 404) {
          errorMessage = `LM Studio API endpoint not found. Please check if LM Studio is running on ${baseUrl} and the server is enabled.`;
        } else if (status === 400) {
          errorMessage = `Bad request to LM Studio API: ${data?.error?.message || 'Invalid request parameters'}`;
        } else {
          errorMessage = `LM Studio API returned ${status}: ${data?.error?.message || error.message}`;
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
   * Get available models from LM Studio
   */
  async getAvailableModels(config) {
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      const response = await axios.get(`${baseUrl}/v1/models`, {
        timeout: config.connectionTimeout || 30000,
      });
      
      const models = response.data.data || [];
      // Filter to only return supported gpt-oss models
      const supportedModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
      
      return models
        .filter(model => supportedModels.includes(model.id))
        .map(model => ({
          id: model.id,
          name: model.id,
          object: model.object,
          created: model.created,
          owned_by: model.owned_by,
          provider: this.providerType
        }));
    } catch (error) {
      console.error('Failed to get LM Studio models:', error.message);
      // Return default supported models if API call fails
      return [
        {
          id: 'openai/gpt-oss-20b',
          name: 'openai/gpt-oss-20b',
          provider: this.providerType
        },
        {
          id: 'openai/gpt-oss-120b',
          name: 'openai/gpt-oss-120b',
          provider: this.providerType
        }
      ];
    }
  }

  /**
   * Build API URL for LM Studio endpoints
   */
  buildApiUrl(config, endpoint) {
    const baseUrl = `http://${config.host}:${config.port}`;
    return `${baseUrl}/v1/${endpoint}`;
  }

  /**
   * Validate LM Studio configuration
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config.host) {
      errors.push('Host is required for LM Studio provider');
    }
    
    if (!config.port) {
      errors.push('Port is required for LM Studio provider');
    }
    
    if (!config.model) {
      errors.push('Model is required for LM Studio provider');
    }
    
    // Validate that the selected model is supported
    const supportedModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
    if (config.model && !supportedModels.includes(config.model)) {
      errors.push(`Model '${config.model}' is not supported. Supported models: ${supportedModels.join(', ')}`);
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
        description: 'LM Studio server hostname or IP address'
      },
      port: {
        type: 'number',
        required: true,
        default: 1234,
        description: 'LM Studio server port'
      },
      model: {
        type: 'string',
        required: true,
        description: 'Model name to use for generation (must be openai/gpt-oss-20b or openai/gpt-oss-120b)'
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

  /**
   * Test chat completions endpoint specifically
   */
  async testChatCompletions(config) {
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      const testPayload = {
        model: config.model,
        messages: [{
          role: 'user',
          content: 'Hello, this is a test message.'
        }],
        max_tokens: 10,
        temperature: 0.1
      };

      const response = await axios.post(`${baseUrl}/v1/chat/completions`, testPayload, {
        timeout: config.connectionTimeout || 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = LMStudioProvider;