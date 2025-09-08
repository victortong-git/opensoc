const { models } = require('../database/models');
const { providerRegistry } = require('./providers');

class AIProviderService {
  constructor() {
    this.activeProviderCache = new Map(); // Cache by organizationId
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get the active AI provider for an organization
   */
  async getActiveProvider(organizationId) {
    try {
      console.log(`🔍 DEBUG: Looking for active AI provider for organization ${organizationId}`);
      
      // Check cache first
      const cached = this.activeProviderCache.get(organizationId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('✅ DEBUG: Found cached AI provider:', cached.provider.name);
        return cached.provider;
      }

      // Get active provider setting from database
      console.log('🔍 DEBUG: Querying database for active provider setting...');
      const activeProviderSetting = await models.SystemSettings.findOne({
        where: {
          organizationId,
          category: 'AI_Provider',
          name: 'Active Provider ID'
        }
      });

      console.log('🔍 DEBUG: Active provider setting result:', activeProviderSetting?.value || 'not found');

      if (!activeProviderSetting?.value) {
        console.warn(`❌ DEBUG: No active AI provider set for organization ${organizationId}`);
        return null;
      }

      // Get the actual provider details
      console.log(`🔍 DEBUG: Looking for AI provider with ID: ${activeProviderSetting.value}`);
      const provider = await models.AIProvider.findOne({
        where: {
          id: activeProviderSetting.value,
          organizationId,
          isEnabled: true
        }
      });

      console.log('🔍 DEBUG: AI provider query result:', provider ? `Found: ${provider.name} (${provider.type})` : 'not found');

      if (!provider) {
        console.warn(`❌ DEBUG: Active AI provider ${activeProviderSetting.value} not found or disabled for organization ${organizationId}`);
        return null;
      }

      // Cache the result
      this.activeProviderCache.set(organizationId, {
        provider,
        timestamp: Date.now()
      });

      console.log('✅ DEBUG: Successfully found and cached AI provider:', provider.name);
      return provider;
    } catch (error) {
      console.error('❌ DEBUG: Error getting active AI provider:', error);
      return null;
    }
  }

  /**
   * Get AI provider configuration for making API calls
   */
  async getProviderConfig(organizationId) {
    const provider = await this.getActiveProvider(organizationId);
    
    if (!provider) {
      // Fail fast - no fallback configuration per coding_practice.md
      throw new Error(`No active AI provider configured for organization ${organizationId}. Please configure an AI provider in the system settings.`);
    }

    return {
      type: provider.type,
      host: provider.host,
      port: provider.port,
      model: provider.selectedModel,
      maxTokens: parseInt(provider.maxTokens) || 2000,
      maxTokenWindow: parseInt(provider.maxTokenWindow) || 8192,
      temperature: parseFloat(provider.temperature) || 0.7,
      isConnected: provider.isConnected,
      isFallback: false,
      providerId: provider.id,
      providerName: provider.name
    };
  }

  /**
   * Get global AI settings for an organization
   */
  async getGlobalSettings(organizationId) {
    try {
      const globalSettings = await models.SystemSettings.findAll({
        where: {
          organizationId,
          category: 'AI_Provider'
        }
      });

      const config = globalSettings.reduce((acc, setting) => {
        const key = setting.name.replace(/\s+/g, '').replace(/^./, str => str.toLowerCase());
        acc[key] = setting.value;
        return acc;
      }, {});

      return {
        timeout: config.globalTimeout || 300,
        retryAttempts: config.globalRetryAttempts || 3,
        enableLogging: config.enableRequestLogging || false,
        enableMetrics: config.enableMetricsCollection || false,
        healthCheckInterval: config.healthCheckInterval || 300,
        connectionTimeout: 5000,
        generationTimeout: 300000
      };
    } catch (error) {
      console.error('Error getting global AI settings:', error);
      // Return default settings
      return {
        timeout: 300,
        retryAttempts: 3,
        enableLogging: false,
        enableMetrics: false,
        healthCheckInterval: 300,
        connectionTimeout: 5000,
        generationTimeout: 300000
      };
    }
  }

  /**
   * Build API URL for the active provider
   */
  buildApiUrl(config, endpoint) {
    try {
      return providerRegistry.buildApiUrl(config.type, config, endpoint);
    } catch (error) {
      // Fallback to basic URL building
      const baseUrl = `http://${config.host}:${config.port}`;
      return `${baseUrl}/${endpoint}`;
    }
  }

  /**
   * Clear cache for an organization
   */
  clearCache(organizationId) {
    this.activeProviderCache.delete(organizationId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.activeProviderCache.clear();
  }

  /**
   * Update provider health status
   */
  async updateProviderHealth(organizationId, isConnected, responseTime, availableModels = null) {
    const provider = await this.getActiveProvider(organizationId);
    if (!provider) return;

    try {
      const updateData = {
        isConnected,
        responseTime,
        lastHealthCheck: new Date()
      };

      // Update available models if provided
      if (availableModels && Array.isArray(availableModels) && availableModels.length > 0) {
        updateData.availableModels = availableModels;
        // Update selected model if current one is not available
        if (!availableModels.includes(provider.selectedModel) && availableModels.length > 0) {
          updateData.selectedModel = availableModels[0];
        }
      }

      await provider.update(updateData);
      
      // Clear cache to force refresh
      this.clearCache(organizationId);
    } catch (error) {
      console.error('Error updating provider health:', error);
    }
  }

  /**
   * Format provider info for logging
   */
  formatProviderInfo(config) {
    return {
      type: config.type,
      host: config.host,
      port: config.port,
      model: config.model,
      providerName: config.providerName || 'Unknown',
      isFallback: config.isFallback || false
    };
  }
}

module.exports = new AIProviderService();