const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIAgentLog = sequelize.define('AIAgentLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  agentName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'agent_name',
    comment: 'Name of the AI agent (e.g. "Alert and Incident Specialist Agent")',
  },
  taskName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'task_name',
    comment: 'Type of task performed (e.g. "classify alert", "analyze alert")',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed description of the activity performed',
  },
  inputTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'input_tokens',
    comment: 'Number of input tokens used',
  },
  outputTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'output_tokens',
    comment: 'Number of output tokens generated',
  },
  totalTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_tokens',
    comment: 'Total tokens consumed (input + output)',
  },
  executionTimeMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'execution_time_ms',
    comment: 'Processing time in milliseconds',
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the operation succeeded',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Error details if the operation failed',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'User who triggered the AI action',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    comment: 'Organization context',
  },
  alertId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'alert_id',
    comment: 'Related alert ID if applicable',
  },
  incidentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'incident_id',
    comment: 'Related incident ID if applicable',
  },
  aiProvider: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ai_provider',
    comment: 'AI service provider used (e.g., Ollama, OpenAI)',
  },
  aiModel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ai_model',
    comment: 'AI model used for the task',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional context data and parameters',
  },
}, {
  tableName: 'ai_agent_logs',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['agent_name'],
    },
    {
      fields: ['task_name'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['success'],
    },
    {
      fields: ['agent_name', 'created_at'],
    },
    {
      fields: ['organization_id', 'created_at'],
    },
    {
      fields: ['alert_id'],
    },
    {
      fields: ['incident_id'],
    },
  ],
});

// Define associations
AIAgentLog.associate = (models) => {
  AIAgentLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  AIAgentLog.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization',
  });
  
  AIAgentLog.belongsTo(models.Alert, {
    foreignKey: 'alertId',
    as: 'alert',
  });
  
  AIAgentLog.belongsTo(models.Incident, {
    foreignKey: 'incidentId',
    as: 'incident',
  });
  
  AIAgentLog.hasMany(models.AIAgentInteraction, {
    foreignKey: 'agentLogId',
    as: 'interactions',
  });
};

module.exports = AIAgentLog;