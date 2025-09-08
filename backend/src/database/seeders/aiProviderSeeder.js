const { models } = require('../models/index');

const seedAIProviders = async (organizationId) => {
  try {
    // Check if AI providers already exist for this organization
    const existingProviders = await models.AIProvider.findAll({
      where: { organizationId }
    });

    if (existingProviders.length > 0) {
      console.log('AI providers already exist for this organization, skipping seeding.');
      return existingProviders;
    }

    const aiProvidersData = [
      {
        name: 'Ollama',
        type: 'ollama',
        host: 'localhost',
        port: 11434,
        isEnabled: true,
        isConnected: false,
        lastHealthCheck: null,
        responseTime: 0,
        availableModels: ['gpt-oss:20b', 'gpt-oss:120b'],
        selectedModel: 'gpt-oss:20b',
        maxTokens: 4096,
        maxTokenWindow: 8192,
        temperature: 0.7,
        description: 'Local Ollama instance for AI-powered security analysis and automation',
        organizationId,
      },
      {
        name: 'vLLM Cluster',
        type: 'vllm',
        host: 'localhost',
        port: 8000,
        isEnabled: false,
        isConnected: false,
        lastHealthCheck: null,
        responseTime: 0,
        availableModels: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
        selectedModel: 'openai/gpt-oss-20b',
        maxTokens: 4096,
        maxTokenWindow: 16384,
        temperature: 0.7,
        description: 'High-performance vLLM cluster for large-scale security operations',
        organizationId,
      },
      {
        name: 'LM Studio',
        type: 'lmstudio',
        host: 'localhost',
        port: 1234,
        isEnabled: false,
        isConnected: false,
        lastHealthCheck: null,
        responseTime: 0,
        availableModels: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
        selectedModel: 'openai/gpt-oss-20b',
        maxTokens: 4096,
        maxTokenWindow: 8192,
        temperature: 0.7,
        description: 'Local LM Studio instance for AI-powered security analysis and automation',
        organizationId,
      }
    ];

    const providers = await models.AIProvider.bulkCreate(aiProvidersData);

    console.log(`✅ Successfully seeded ${providers.length} AI providers`);
    return providers;
  } catch (error) {
    console.error('Error seeding AI providers:', error);
    throw error;
  }
};

const seedActiveAIProviderSettings = async (organizationId, adminUserId) => {
  try {
    // Get the Ollama provider (should be the first one)
    const ollamaProvider = await models.AIProvider.findOne({
      where: { 
        organizationId,
        type: 'ollama'
      }
    });

    if (!ollamaProvider) {
      console.log('No Ollama provider found, skipping active provider setting.');
      return;
    }

    // Add AI provider configuration to system settings
    const aiProviderSettings = [
      {
        category: 'AI_Provider',
        name: 'Active Provider ID',
        value: ollamaProvider.id,
        type: 'string',
        description: 'The ID of the currently active AI provider',
        isEditable: true,
        organizationId,
        updatedBy: adminUserId,
      },
      {
        category: 'AI_Provider',
        name: 'Global Timeout',
        value: 30,
        type: 'number',
        description: 'Global timeout in seconds for AI provider requests',
        isEditable: true,
        organizationId,
        updatedBy: adminUserId,
      },
      {
        category: 'AI_Provider',
        name: 'Global Retry Attempts',
        value: 3,
        type: 'number',
        description: 'Number of retry attempts for failed AI provider requests',
        isEditable: true,
        organizationId,
        updatedBy: adminUserId,
      },
      {
        category: 'AI_Provider',
        name: 'Enable Request Logging',
        value: true,
        type: 'boolean',
        description: 'Enable logging of AI provider requests and responses',
        isEditable: true,
        organizationId,
        updatedBy: adminUserId,
      },
      {
        category: 'AI_Provider',
        name: 'Enable Metrics Collection',
        value: true,
        type: 'boolean',
        description: 'Enable collection of AI provider performance metrics',
        isEditable: true,
        organizationId,
        updatedBy: adminUserId,
      },
      {
        category: 'AI_Provider',
        name: 'Health Check Interval',
        value: 300,
        type: 'number',
        description: 'Health check interval in seconds for AI providers',
        isEditable: true,
        organizationId,
        updatedBy: adminUserId,
      }
    ];

    // Check if these settings already exist
    const existingSettings = await models.SystemSettings.findAll({
      where: { 
        organizationId,
        category: 'AI_Provider'
      }
    });

    if (existingSettings.length === 0) {
      await models.SystemSettings.bulkCreate(aiProviderSettings);
      console.log('✅ Successfully seeded AI provider system settings');
    } else {
      console.log('AI provider settings already exist, skipping seeding.');
    }

  } catch (error) {
    console.error('Error seeding AI provider settings:', error);
    throw error;
  }
};

module.exports = {
  seedAIProviders,
  seedActiveAIProviderSettings,
};