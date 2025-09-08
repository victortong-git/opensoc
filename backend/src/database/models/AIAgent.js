const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIAgent = sequelize.define('AIAgent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('soc_analyst', 'incident_response', 'threat_intel', 'report_generation'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('online', 'processing', 'maintenance', 'offline'),
    defaultValue: 'online',
  },
  description: {
    type: DataTypes.TEXT,
  },
  capabilities: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  configuration: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  modelVersion: {
    type: DataTypes.STRING(50),
    field: 'model_version',
  },
  accuracyScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'accuracy_score',
  },
  totalTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_tasks',
  },
  successfulTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'successful_tasks',
  },
  failedTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'failed_tasks',
  },
  lastActivity: {
    type: DataTypes.DATE,
    field: 'last_activity',
  },
  performanceMetrics: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'performance_metrics',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
  // Social media fields
  profileImageUrl: {
    type: DataTypes.STRING(500),
    field: 'profile_image_url',
  },
  bio: {
    type: DataTypes.TEXT,
  },
  specialties: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  socialMetrics: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'social_metrics',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active',
  },
  firstActivityAt: {
    type: DataTypes.DATE,
    field: 'first_activity_at',
  },
  lastInteractionAt: {
    type: DataTypes.DATE,
    field: 'last_interaction_at',
  },
  totalActivities: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'total_activities',
  },
  totalLikesReceived: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'total_likes_received',
  },
  totalCommentsReceived: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'total_comments_received',
  },
  avgExecutionTimeMs: {
    type: DataTypes.INTEGER,
    field: 'avg_execution_time_ms',
  },
  successRatePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'success_rate_percentage',
  },
}, {
  tableName: 'ai_agents',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['organization_id', 'is_active'],
    },
    {
      fields: ['total_activities'],
    },
    {
      fields: ['total_likes_received'],
    },
    {
      fields: ['success_rate_percentage'],
    },
    {
      fields: ['last_interaction_at'],
    },
  ],
});

module.exports = AIAgent;