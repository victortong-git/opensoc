const axios = require('axios');
const aiLlmLogService = require('../aiLlmLogService');

class VLLMProvider {
  constructor() {
    this.providerType = 'vllm';
  }

  /**
   * Check vLLM connectivity and model availability
   */
  async checkConnection(config, organizationId) {
    const startTime = Date.now();
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      // Check vLLM connectivity by getting available models
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
        serverVersion: 'vLLM',
        connectionTime,
        totalModels: availableModels.length,
        availableModels: modelNames,
        endpoint: baseUrl,
        providerType: this.providerType,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      console.error('vLLM connection check failed:', error.message);
      
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
   * Generate text using vLLM API
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

    try {
      const response = await axios.post(`${baseUrl}/v1/chat/completions`, payload, {
        timeout: timeout || config.generationTimeout || 120000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        const responseContent = response.data.choices[0].message.content;
        
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

        return responseContent;
      } else {
        const errorMsg = 'Invalid response from vLLM';
        
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
      let errorMessage = error.message;
      let httpStatusCode = null;
      let responseHeaders = null;

      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to vLLM at ${baseUrl}. Please ensure vLLM is running.`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'vLLM generation timed out. Please try again.';
      } else if (error.response) {
        httpStatusCode = error.response.status;
        responseHeaders = error.response.headers;
        errorMessage = `vLLM API error: ${error.response.data?.error?.message || error.message}`;
      } else {
        errorMessage = `vLLM API error: ${error.message}`;
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

      throw new Error(errorMessage);
    }
  }

  /**
   * Get available models from vLLM
   */
  async getAvailableModels(config) {
    const baseUrl = `http://${config.host}:${config.port}`;
    
    try {
      const response = await axios.get(`${baseUrl}/v1/models`, {
        timeout: config.connectionTimeout || 30000,
      });
      
      const models = response.data.data || [];
      return models.map(model => ({
        id: model.id,
        name: model.id,
        object: model.object,
        created: model.created,
        owned_by: model.owned_by,
        provider: this.providerType
      }));
    } catch (error) {
      console.error('Failed to get vLLM models:', error.message);
      return [];
    }
  }

  /**
   * Build API URL for vLLM endpoints
   */
  buildApiUrl(config, endpoint) {
    const baseUrl = `http://${config.host}:${config.port}`;
    return `${baseUrl}/v1/${endpoint}`;
  }

  /**
   * Validate vLLM configuration
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config.host) {
      errors.push('Host is required for vLLM provider');
    }
    
    if (!config.port) {
      errors.push('Port is required for vLLM provider');
    }
    
    if (!config.model) {
      errors.push('Model is required for vLLM provider');
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
        description: 'vLLM server hostname or IP address'
      },
      port: {
        type: 'number',
        required: true,
        default: 8000,
        description: 'vLLM server port'
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

module.exports = VLLMProvider;