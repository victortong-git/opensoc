const axios = require('axios');

class AIGenerator {
  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || '192.168.8.21';
    this.ollamaPort = process.env.OLLAMA_PORT || 11434;
    this.model = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
    
    // Handle full URL in OLLAMA_HOST or construct from host:port
    if (this.ollamaHost.startsWith('http://') || this.ollamaHost.startsWith('https://')) {
      this.baseURL = this.ollamaHost.replace(/\/$/, ''); // Remove trailing slash if present
    } else {
      this.baseURL = `http://${this.ollamaHost}:${this.ollamaPort}`;
    }
    
    this.connectionTimeout = parseInt(process.env.OLLAMA_CONNECTION_TIMEOUT || '5000');
    this.generationTimeout = parseInt(process.env.OLLAMA_GENERATION_TIMEOUT || '120000');
  }

  /**
   * Check if Ollama is available and model is loaded
   */
  async checkConnection() {
    const startTime = Date.now();
    
    try {
      // Check basic connectivity
      const versionResponse = await axios.get(`${this.baseURL}/api/version`, {
        timeout: this.connectionTimeout,
      });
      
      const serverVersion = versionResponse.data?.version || 'Unknown';
      
      // Check available models
      const modelsResponse = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: this.connectionTimeout,
      });
      
      const availableModels = modelsResponse.data.models || [];
      const modelExists = availableModels.some(model => model.name.includes(this.model.split(':')[0]));
      const targetModel = availableModels.find(model => model.name === this.model);
      
      const connectionTime = Date.now() - startTime;
      
      return {
        connected: true,
        modelAvailable: modelExists,
        serverVersion,
        connectionTime,
        totalModels: availableModels.length,
        availableModels: availableModels.map(m => m.name),
        targetModelInfo: targetModel ? {
          name: targetModel.name,
          size: targetModel.size,
          modified: targetModel.modified_at,
          family: targetModel.details?.family || 'unknown'
        } : null,
        endpoint: this.baseURL,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      console.error('Ollama connection check failed:', error.message);
      
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
        endpoint: this.baseURL,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Call Ollama API with prompt
   */
  async generate(prompt, options = {}) {
    const startTime = Date.now();
    
    // Check connection first
    const status = await this.checkConnection();
    if (!status.connected || !status.modelAvailable) {
      throw new Error(`AI service unavailable: ${!status.connected ? 'Cannot connect to Ollama' : 'Model not available'}`);
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          ...options
        }
      }, {
        timeout: this.generationTimeout,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        response: response.data.response,
        executionTime,
        model: this.model,
        provider: 'Ollama',
        endpoint: this.baseURL,
        modelVersion: response.data.model || this.model,
        metadata: {
          eval_count: response.data.eval_count,
          eval_duration: response.data.eval_duration,
          load_duration: response.data.load_duration,
          prompt_eval_count: response.data.prompt_eval_count,
          prompt_eval_duration: response.data.prompt_eval_duration,
          total_duration: response.data.total_duration
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('AI generation failed:', error.message);
      
      throw new Error(`AI generation failed: ${error.message} (${executionTime}ms)`);
    }
  }

  /**
   * Parse JSON response from AI with error handling
   */
  parseJsonResponse(response) {
    try {
      // Clean up the response - remove any markdown formatting
      let cleanResponse = response.trim();
      
      console.log('🔍 Parsing AI response (first 200 chars):', cleanResponse.substring(0, 200));
      
      // Remove code block markers if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON array or object
      const jsonMatch = cleanResponse.match(/(\[.*\]|\{.*\})/s);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1];
      }
      
      const parsed = JSON.parse(cleanResponse);
      console.log('✅ JSON parsed successfully, type:', typeof parsed, 'isArray:', Array.isArray(parsed));
      
      // Handle different response structures
      let finalArray = [];
      
      if (Array.isArray(parsed)) {
        // Direct array - but check for nested arrays
        finalArray = parsed.flat(); // Flatten any nested arrays
        console.log('📊 Direct array found, items after flattening:', finalArray.length);
      } else if (parsed && typeof parsed === 'object') {
        // Object wrapper - extract array from common properties
        if (parsed.data && Array.isArray(parsed.data)) {
          finalArray = parsed.data.flat();
          console.log('📊 Found data array, items after flattening:', finalArray.length);
        } else if (parsed.items && Array.isArray(parsed.items)) {
          finalArray = parsed.items.flat();
          console.log('📊 Found items array, items after flattening:', finalArray.length);
        } else if (parsed.results && Array.isArray(parsed.results)) {
          finalArray = parsed.results.flat();
          console.log('📊 Found results array, items after flattening:', finalArray.length);
        } else {
          // Single object, wrap in array
          finalArray = [parsed];
          console.log('📊 Single object wrapped in array');
        }
      } else {
        throw new Error('Parsed response is not an object or array');
      }
      
      // Additional validation: ensure we have valid objects
      finalArray = finalArray.filter(item => 
        item && typeof item === 'object' && !Array.isArray(item)
      );
      
      console.log('✅ Final array length after filtering:', finalArray.length);
      return finalArray;
      
    } catch (error) {
      console.error('❌ Failed to parse AI response as JSON:', error.message);
      console.error('Raw response (first 500 chars):', response.substring(0, 500));
      throw new Error(`Invalid JSON response from AI: ${error.message}`);
    }
  }

  /**
   * Validate AI generated data structure
   */
  validateGeneratedData(data, dataType) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('AI generated no valid data');
    }

    // Basic validation per data type
    const requiredFields = {
      alert: ['title', 'description', 'severity'],
      incident: ['title', 'description', 'severity', 'category'],
      asset: ['name', 'assetType'],
      ioc: ['type', 'value', 'confidence', 'severity', 'source'],
      playbook: ['name', 'description', 'category'],
      threat_actor: ['name', 'description', 'sophistication'],
      threat_campaign: ['name', 'description', 'severity', 'confidence']
    };

    const required = requiredFields[dataType] || [];
    const invalidItems = [];

    data.forEach((item, index) => {
      const missingFields = required.filter(field => !item[field]);
      if (missingFields.length > 0) {
        invalidItems.push(`Item ${index + 1}: missing ${missingFields.join(', ')}`);
      }
    });

    if (invalidItems.length > 0) {
      throw new Error(`Invalid AI generated data: ${invalidItems.join('; ')}`);
    }

    return data;
  }
}

module.exports = AIGenerator;