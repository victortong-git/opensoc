const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const AILLMLog = sequelize.define('AILLMLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id'
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'provider_id'
  },
  providerName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Provider name from ai_providers.name at time of request'
  },
  providerType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Provider type (ollama, vllm, etc.)'
  },
  providerUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Full endpoint URL used for the request'
  },
  modelName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'AI model name used for generation'
  },
  maxTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum tokens requested for output'
  },
  tokenWindow: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Context window size of the model'
  },
  temperature: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: 'Sampling temperature used'
  },
  requestTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the actual AI request was initiated'
  },
  responseTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the actual AI response was received'
  },
  durationMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total request duration in milliseconds'
  },
  inputTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated or actual input token count'
  },
  outputTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated or actual output token count'
  },
  rawPrompt: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Exact prompt sent to the AI provider'
  },
  rawResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Exact response received from AI provider'
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'True only if actual AI response was received'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Actual error message from AI provider'
  },
  httpStatusCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'HTTP status code from provider response'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id'
  },
  contextType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Type of operation (chat, incident_draft, alert_analysis, etc.)'
  },
  contextId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of related entity (conversation_id, incident_id, etc.)'
  },
  requestHeaders: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'HTTP headers sent to AI provider'
  },
  responseHeaders: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'HTTP headers received from AI provider'
  },
  providerMetadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Provider-specific metadata (eval_count, timing data, etc.)'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ai_llm_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['provider_id']
    },
    {
      fields: ['provider_name']
    },
    {
      fields: ['success']
    },
    {
      fields: ['request_timestamp']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['context_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['organization_id', 'success', 'request_timestamp']
    },
    {
      fields: ['organization_id', 'provider_name', 'request_timestamp']
    }
  ]
});

// Define associations
AILLMLog.associate = function(models) {
  // Belongs to organization
  AILLMLog.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  // Belongs to AI provider (nullable)
  AILLMLog.belongsTo(models.AIProvider, {
    foreignKey: 'providerId',
    as: 'provider'
  });

  // Belongs to user (nullable)
  AILLMLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

// Instance methods
AILLMLog.prototype.calculateDuration = function() {
  if (this.responseTimestamp && this.requestTimestamp) {
    return new Date(this.responseTimestamp) - new Date(this.requestTimestamp);
  }
  return null;
};

AILLMLog.prototype.getTotalTokens = function() {
  const input = this.inputTokens || 0;
  const output = this.outputTokens || 0;
  return input + output;
};

AILLMLog.prototype.getEstimatedCost = function(costPerToken = 0.0001) {
  const totalTokens = this.getTotalTokens();
  return totalTokens * costPerToken;
};

// Class methods
AILLMLog.getSuccessRate = async function(organizationId, timeRange = '24h') {
  const { Op } = require('sequelize');
  const whereClause = { organizationId };
  
  if (timeRange) {
    const hours = parseInt(timeRange.replace('h', ''));
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    whereClause.requestTimestamp = {
      [Op.gte]: startTime
    };
  }

  const total = await this.count({ where: whereClause });
  const successful = await this.count({ 
    where: { ...whereClause, success: true } 
  });

  return total > 0 ? (successful / total) * 100 : 0;
};

AILLMLog.getProviderStats = async function(organizationId, timeRange = '24h') {
  const { Op } = require('sequelize');
  const sequelize = require('../config/database');
  const whereClause = { organizationId };
  
  if (timeRange) {
    const hours = parseInt(timeRange.replace('h', ''));
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    whereClause.requestTimestamp = {
      [Op.gte]: startTime
    };
  }

  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      'provider_name',
      'provider_type',
      [sequelize.fn('COUNT', '*'), 'totalRequests'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = true THEN 1 END')), 'successfulRequests'],
      [sequelize.fn('AVG', sequelize.col('duration_ms')), 'avgDuration'],
      [sequelize.fn('SUM', sequelize.col('input_tokens')), 'totalInputTokens'],
      [sequelize.fn('SUM', sequelize.col('output_tokens')), 'totalOutputTokens']
    ],
    group: ['provider_name', 'provider_type']
  });

  return stats.map(stat => ({
    providerName: stat.provider_name,
    providerType: stat.provider_type,
    totalRequests: parseInt(stat.dataValues.totalRequests),
    successfulRequests: parseInt(stat.dataValues.successfulRequests),
    successRate: stat.dataValues.totalRequests > 0 
      ? (stat.dataValues.successfulRequests / stat.dataValues.totalRequests) * 100 
      : 0,
    avgDuration: parseFloat(stat.dataValues.avgDuration) || 0,
    totalInputTokens: parseInt(stat.dataValues.totalInputTokens) || 0,
    totalOutputTokens: parseInt(stat.dataValues.totalOutputTokens) || 0
  }));
};

module.exports = AILLMLog;