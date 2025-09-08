const { models } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const axios = require('axios');

/**
 * Get all AI providers for the organization
 * GET /api/ai-providers
 */
const getAIProviders = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const providers = await models.AIProvider.findAll({
    where: { organizationId },
    order: [['createdAt', 'ASC']],
  });

  // Get active provider setting
  const activeProviderSetting = await models.SystemSettings.findOne({
    where: {
      organizationId,
      category: 'AI_Provider',
      name: 'Active Provider ID'
    }
  });

  const activeProviderId = activeProviderSetting?.value || null;

  // Get global settings
  const globalSettings = await models.SystemSettings.findAll({
    where: {
      organizationId,
      category: 'AI_Provider'
    }
  });

  const globalConfig = globalSettings.reduce((acc, setting) => {
    const key = setting.name.replace(/\s+/g, '').replace(/^./, str => str.toLowerCase());
    acc[key] = setting.value;
    return acc;
  }, {});

  res.status(200).json({
    providers,
    activeProviderId,
    globalSettings: {
      timeout: globalConfig.globalTimeout || 300,
      retryAttempts: globalConfig.globalRetryAttempts || 3,
      enableLogging: globalConfig.enableRequestLogging || false,
      enableMetrics: globalConfig.enableMetricsCollection || false,
      healthCheckInterval: globalConfig.healthCheckInterval || 300,
    }
  });
});

/**
 * Get active AI provider
 * GET /api/ai-providers/active
 */
const getActiveAIProvider = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  // Get active provider setting
  const activeProviderSetting = await models.SystemSettings.findOne({
    where: {
      organizationId,
      category: 'AI_Provider',
      name: 'Active Provider ID'
    }
  });

  if (!activeProviderSetting?.value) {
    return res.status(200).json({ activeProvider: null });
  }

  const activeProvider = await models.AIProvider.findOne({
    where: {
      id: activeProviderSetting.value,
      organizationId,
      isEnabled: true
    }
  });

  res.status(200).json({ activeProvider });
});

/**
 * Create new AI provider
 * POST /api/ai-providers
 */
const createAIProvider = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const providerData = {
    ...req.body,
    organizationId
  };

  const provider = await models.AIProvider.create(providerData);

  res.status(201).json({
    message: 'AI provider created successfully',
    provider
  });
});

/**
 * Update AI provider
 * PUT /api/ai-providers/:id
 */
const updateAIProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const provider = await models.AIProvider.findOne({
    where: { id, organizationId }
  });

  if (!provider) {
    throw new NotFoundError('AI provider not found');
  }

  await provider.update(req.body);

  res.status(200).json({
    message: 'AI provider updated successfully',
    provider
  });
});

/**
 * Delete AI provider
 * DELETE /api/ai-providers/:id
 */
const deleteAIProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const provider = await models.AIProvider.findOne({
    where: { id, organizationId }
  });

  if (!provider) {
    throw new NotFoundError('AI provider not found');
  }

  // Check if this is the active provider
  const activeProviderSetting = await models.SystemSettings.findOne({
    where: {
      organizationId,
      category: 'AI_Provider',
      name: 'Active Provider ID'
    }
  });

  if (activeProviderSetting?.value === id) {
    throw new ValidationError('Cannot delete the active AI provider. Set another provider as active first.');
  }

  await provider.destroy();

  res.status(200).json({
    message: 'AI provider deleted successfully'
  });
});

/**
 * Set active AI provider
 * PUT /api/ai-providers/:id/set-active
 */
const setActiveAIProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const provider = await models.AIProvider.findOne({
    where: { id, organizationId, isEnabled: true }
  });

  if (!provider) {
    throw new NotFoundError('AI provider not found or not enabled');
  }

  // Update or create the active provider setting
  const [activeProviderSetting] = await models.SystemSettings.findOrCreate({
    where: {
      organizationId,
      category: 'AI_Provider',
      name: 'Active Provider ID'
    },
    defaults: {
      value: id,
      type: 'string',
      description: 'The ID of the currently active AI provider',
      isEditable: true,
      organizationId,
      updatedBy: req.user.id,
    }
  });

  await activeProviderSetting.update({
    value: id,
    updatedBy: req.user.id
  });

  res.status(200).json({
    message: 'Active AI provider updated successfully',
    activeProvider: provider
  });
});

/**
 * Test AI provider connection
 * POST /api/ai-providers/:id/test
 */
const testAIProviderConnection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const provider = await models.AIProvider.findOne({
    where: { id, organizationId }
  });

  if (!provider) {
    throw new NotFoundError('AI provider not found');
  }

  const startTime = Date.now();
  let connectionResult = {
    isConnected: false,
    responseTime: 0,
    error: null,
    availableModels: []
  };

  try {
    const baseUrl = `http://${provider.host}:${provider.port}`;
    
    if (provider.type === 'ollama') {
      // Test Ollama connection
      const response = await axios.get(`${baseUrl}/api/tags`, {
        timeout: 60000 // 1 minute for connection tests
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        const models = response.data.models?.map(model => model.name) || [];
        connectionResult = {
          isConnected: true,
          responseTime,
          error: null,
          availableModels: models
        };

        // Update provider with new available models if found
        if (models.length > 0) {
          await provider.update({ 
            availableModels: models,
            selectedModel: models.includes(provider.selectedModel) ? provider.selectedModel : models[0]
          });
        }
      }
    } else if (provider.type === 'vllm') {
      // Test vLLM connection
      const response = await axios.get(`${baseUrl}/v1/models`, {
        timeout: 60000 // 1 minute for connection tests
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        const models = response.data.data?.map(model => model.id) || [];
        connectionResult = {
          isConnected: true,
          responseTime,
          error: null,
          availableModels: models
        };

        // Update provider with new available models if found
        if (models.length > 0) {
          await provider.update({ 
            availableModels: models,
            selectedModel: models.includes(provider.selectedModel) ? provider.selectedModel : models[0]
          });
        }
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    connectionResult = {
      isConnected: false,
      responseTime,
      error: error.message,
      availableModels: []
    };
  }

  // Update provider status
  await provider.updateHealthStatus(connectionResult.isConnected, connectionResult.responseTime);

  res.status(200).json({
    message: 'Connection test completed',
    result: connectionResult,
    provider: await models.AIProvider.findOne({ where: { id } })
  });
});

/**
 * Update global AI provider settings
 * PUT /api/ai-providers/global-settings
 */
const updateGlobalSettings = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { timeout, retryAttempts, enableLogging, enableMetrics, healthCheckInterval } = req.body;

  const settingsToUpdate = [
    { name: 'Global Timeout', value: timeout },
    { name: 'Global Retry Attempts', value: retryAttempts },
    { name: 'Enable Request Logging', value: enableLogging },
    { name: 'Enable Metrics Collection', value: enableMetrics },
    { name: 'Health Check Interval', value: healthCheckInterval },
  ];

  const updatedSettings = [];

  for (const { name, value } of settingsToUpdate) {
    if (value !== undefined) {
      const [setting] = await models.SystemSettings.findOrCreate({
        where: {
          organizationId,
          category: 'AI_Provider',
          name
        },
        defaults: {
          value,
          type: typeof value === 'boolean' ? 'boolean' : 'number',
          description: `AI Provider ${name}`,
          isEditable: true,
          organizationId,
          updatedBy: req.user.id,
        }
      });

      await setting.update({
        value,
        updatedBy: req.user.id
      });

      updatedSettings.push(setting);
    }
  }

  res.status(200).json({
    message: 'Global AI provider settings updated successfully',
    settings: updatedSettings
  });
});

/**
 * Test AI provider with custom message
 * POST /api/ai-providers/:id/test-message
 */
const testAIProviderMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const organizationId = req.user.organizationId;

  const provider = await models.AIProvider.findOne({
    where: { id, organizationId }
  });

  if (!provider) {
    throw new NotFoundError('AI provider not found');
  }

  if (!provider.isEnabled) {
    throw new ValidationError('AI provider is disabled. Please enable it first.');
  }

  const startTime = Date.now();
  let testResult = {
    success: false,
    message: message || 'Hello',
    response: null,
    responseTime: 0,
    error: null,
    provider: {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      model: provider.selectedModel
    }
  };

  try {
    // Import AIGenerationService
    const aiGenerationService = require('../services/aiGenerationService');
    
    // Generate AI response using test method (no fallbacks)
    const aiResult = await aiGenerationService.generateTestResponse({
      prompt: message || 'Hello',
      organizationId,
      model: provider.selectedModel,
      maxTokens: provider.maxTokens || 2000,
      temperature: provider.temperature || 0.7
    });

    const responseTime = Date.now() - startTime;

    testResult = {
      success: true,
      message: message || 'Hello',
      response: aiResult.response || aiResult.content,
      responseTime,
      error: null,
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        model: provider.selectedModel
      },
      aiProvider: aiResult.provider || null,
      usage: aiResult.usage || null
    };

    // Update provider health status
    await provider.updateHealthStatus(true, responseTime);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    testResult = {
      success: false,
      message: message || 'Hello',
      response: null,
      responseTime,
      error: error.message,
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        model: provider.selectedModel
      }
    };

    // Update provider health status
    await provider.updateHealthStatus(false, responseTime);
  }

  res.status(200).json({
    message: 'AI provider message test completed',
    result: testResult
  });
});

/**
 * Get AI provider statistics
 * GET /api/ai-providers/stats
 */
const getAIProviderStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [totalProviders, enabledProviders, connectedProviders, providers] = await Promise.all([
    models.AIProvider.count({ where: { organizationId } }),
    models.AIProvider.count({ where: { organizationId, isEnabled: true } }),
    models.AIProvider.count({ where: { organizationId, isConnected: true } }),
    models.AIProvider.findAll({ where: { organizationId, isConnected: true } })
  ]);

  const avgResponseTime = providers.length > 0 
    ? Math.round(providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length)
    : 0;

  const availableModels = [...new Set(
    providers.flatMap(p => p.availableModels || [])
  )];

  res.status(200).json({
    totalProviders,
    enabledProviders,
    connectedProviders,
    avgResponseTime,
    availableModels: availableModels.length,
    modelsList: availableModels
  });
});

module.exports = {
  getAIProviders,
  getActiveAIProvider,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  setActiveAIProvider,
  testAIProviderConnection,
  testAIProviderMessage,
  updateGlobalSettings,
  getAIProviderStats,
};