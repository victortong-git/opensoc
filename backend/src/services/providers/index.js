const OllamaProvider = require('./ai_provider_ollama');
const VLLMProvider = require('./ai_provider_vllm');
const LMStudioProvider = require('./ai_provider_lmstudio');

/**
 * AI Provider Registry
 * Central registry for all AI providers with factory pattern
 */
class AIProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.instances = new Map();
    
    // Register built-in providers
    this.registerProvider('ollama', OllamaProvider);
    this.registerProvider('vllm', VLLMProvider);
    this.registerProvider('lmstudio', LMStudioProvider);
  }

  /**
   * Register a new provider class
   */
  registerProvider(type, ProviderClass) {
    if (!type || typeof type !== 'string') {
      throw new Error('Provider type must be a non-empty string');
    }
    
    if (!ProviderClass || typeof ProviderClass !== 'function') {
      throw new Error('Provider class must be a constructor function');
    }
    
    this.providers.set(type.toLowerCase(), ProviderClass);
    console.log(`✅ Registered AI provider: ${type}`);
  }

  /**
   * Get provider instance (singleton pattern)
   */
  getProvider(type) {
    const normalizedType = type?.toLowerCase();
    
    if (!normalizedType) {
      throw new Error('Provider type is required');
    }
    
    // Return cached instance if exists
    if (this.instances.has(normalizedType)) {
      return this.instances.get(normalizedType);
    }
    
    // Get provider class
    const ProviderClass = this.providers.get(normalizedType);
    if (!ProviderClass) {
      const availableTypes = Array.from(this.providers.keys()).join(', ');
      throw new Error(`Unsupported provider type: ${type}. Available types: ${availableTypes}`);
    }
    
    // Create and cache new instance
    const instance = new ProviderClass();
    this.instances.set(normalizedType, instance);
    
    return instance;
  }

  /**
   * Check if provider type is supported
   */
  isSupported(type) {
    return this.providers.has(type?.toLowerCase());
  }

  /**
   * Get list of all supported provider types
   */
  getSupportedTypes() {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider information
   */
  getProviderInfo(type) {
    const provider = this.getProvider(type);
    return {
      type: type.toLowerCase(),
      settingsSchema: provider.getSettingsSchema(),
      features: {
        textGeneration: true,
        modelListing: true,
        connectionCheck: true,
        configValidation: true
      }
    };
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(type, config) {
    const provider = this.getProvider(type);
    return provider.validateConfig(config);
  }

  /**
   * Universal method to check connection for any provider
   */
  async checkConnection(type, config, organizationId) {
    const provider = this.getProvider(type);
    return await provider.checkConnection(config, organizationId);
  }

  /**
   * Universal method to generate text with any provider
   */
  async generateText(type, config, prompt, options = {}) {
    const provider = this.getProvider(type);
    return await provider.generateText(config, prompt, options);
  }

  /**
   * Universal method to get available models from any provider
   */
  async getAvailableModels(type, config) {
    const provider = this.getProvider(type);
    return await provider.getAvailableModels(config);
  }

  /**
   * Universal method to build API URLs for any provider
   */
  buildApiUrl(type, config, endpoint) {
    const provider = this.getProvider(type);
    return provider.buildApiUrl(config, endpoint);
  }

  /**
   * Get comprehensive provider status
   */
  async getProviderStatus(type, config, organizationId) {
    try {
      const connectionResult = await this.checkConnection(type, config, organizationId);
      const validation = this.validateProviderConfig(type, config);
      
      return {
        type: type.toLowerCase(),
        valid: validation.valid,
        connected: connectionResult.connected,
        modelAvailable: connectionResult.modelAvailable,
        details: {
          validation,
          connection: connectionResult
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        type: type.toLowerCase(),
        valid: false,
        connected: false,
        modelAvailable: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear provider instance cache
   */
  clearCache(type = null) {
    if (type) {
      this.instances.delete(type.toLowerCase());
    } else {
      this.instances.clear();
    }
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      registeredProviders: this.providers.size,
      activeInstances: this.instances.size,
      supportedTypes: this.getSupportedTypes(),
      lastUpdated: new Date().toISOString()
    };
  }
}

// Create singleton instance
const providerRegistry = new AIProviderRegistry();

/**
 * Convenience functions for backward compatibility
 */
const getProvider = (type) => providerRegistry.getProvider(type);
const isSupported = (type) => providerRegistry.isSupported(type);
const getSupportedTypes = () => providerRegistry.getSupportedTypes();

module.exports = {
  providerRegistry,
  getProvider,
  isSupported,
  getSupportedTypes,
  OllamaProvider,
  VLLMProvider,
  LMStudioProvider
};