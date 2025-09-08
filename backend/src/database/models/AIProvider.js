const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIProvider = sequelize.define('AIProvider', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  type: {
    type: DataTypes.ENUM('ollama', 'vllm', 'lmstudio'),
    allowNull: false,
    validate: {
      isIn: [['ollama', 'vllm', 'lmstudio']],
    },
  },
  host: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'localhost',
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 65535,
    },
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_enabled',
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_connected',
  },
  lastHealthCheck: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_health_check',
  },
  responseTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
    },
    field: 'response_time',
  },
  availableModels: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Available models must be an array');
        }
      },
    },
    field: 'available_models',
  },
  selectedModel: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
    field: 'selected_model',
  },
  maxTokens: {
    type: DataTypes.INTEGER,
    defaultValue: 4096,
    allowNull: false,
    validate: {
      min: 1024,
      max: 32768,
    },
    field: 'max_tokens',
  },
  maxTokenWindow: {
    type: DataTypes.INTEGER,
    defaultValue: 8192,
    allowNull: false,
    validate: {
      min: 2048,
      max: 65536,
    },
    field: 'max_token_window',
  },
  temperature: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.7,
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
}, {
  tableName: 'ai_providers',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['is_enabled'],
    },
    {
      fields: ['organization_id', 'is_enabled'],
    },
  ],
  hooks: {
    beforeValidate: (provider) => {
      // Set default port based on provider type if not specified
      if (!provider.port) {
        if (provider.type === 'ollama') {
          provider.port = 11434;
        } else if (provider.type === 'lmstudio') {
          provider.port = 1234;
        } else {
          provider.port = 8000; // vllm and others
        }
      }
      
      // Ensure selected model is in available models
      if (provider.selectedModel && provider.availableModels?.length > 0) {
        if (!provider.availableModels.includes(provider.selectedModel)) {
          provider.selectedModel = provider.availableModels[0];
        }
      }
    },
  },
});

// Class methods
AIProvider.getDefaultPort = function(type) {
  if (type === 'ollama') return 11434;
  if (type === 'lmstudio') return 1234;
  return 8000; // vllm and others
};

// Instance methods
AIProvider.prototype.getConnectionUrl = function() {
  return `http://${this.host}:${this.port}`;
};

AIProvider.prototype.isHealthy = function() {
  if (!this.isEnabled || !this.isConnected) {
    return false;
  }
  
  // Consider healthy if checked within last 5 minutes
  if (this.lastHealthCheck) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastHealthCheck > fiveMinutesAgo;
  }
  
  return false;
};

AIProvider.prototype.updateHealthStatus = function(isConnected, responseTime = 0) {
  return this.update({
    isConnected,
    responseTime,
    lastHealthCheck: new Date(),
  });
};

module.exports = AIProvider;