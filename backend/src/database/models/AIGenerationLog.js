const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');

const AIGenerationLog = sequelize.define('AIGenerationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
  dataType: {
    type: DataTypes.ENUM('alert', 'incident', 'asset', 'ioc', 'playbook'),
    allowNull: false,
    field: 'data_type',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  scenario: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_response',
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  validation: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'Pending',
    validate: {
      isIn: [['Pass', 'Fail', 'Pending', 'Unknown']]
    },
    comment: 'Validation status of AI-generated data creation in database',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
  },
  executionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'execution_time',
    comment: 'Execution time in milliseconds',
  },
  aiModel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ai_model',
  },
  aiProvider: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ai_provider',
    comment: 'AI service provider (e.g., Ollama, OpenAI, Azure)'
  },
  aiEndpoint: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'ai_endpoint',
    comment: 'AI service endpoint URL'
  },
  modelVersion: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'model_version',
    comment: 'Detailed model version information'
  },
  providerMetadata: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'provider_metadata',
    comment: 'Additional provider-specific metadata'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'ai_generation_logs',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['data_type'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['success'],
    },
    {
      fields: ['ai_provider'],
    },
    {
      fields: ['validation'],
    },
  ],
});

module.exports = AIGenerationLog;