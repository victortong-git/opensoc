const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertTimelineEvent = sequelize.define('AlertTimelineEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('alert_created', 'ai_analysis_completed', 'ai_auto_resolved', 'ai_triage_assigned', 'ai_false_positive_resolved', 'status_change', 'user_action', 'note'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  userName: {
    type: DataTypes.STRING(255),
    field: 'user_name',
  },
  alertId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'alert_id',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  // AI-specific fields to highlight AI value
  aiSource: {
    type: DataTypes.STRING(100),
    field: 'ai_source',
    comment: 'AI system that performed the action (e.g., SOC_ANALYST_AGENT)',
  },
  aiConfidence: {
    type: DataTypes.INTEGER,
    field: 'ai_confidence',
    comment: 'AI confidence level (0-100) for AI-generated events',
    validate: {
      min: 0,
      max: 100,
    },
  },
  // Test data flag for cleanup and filtering
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/demo data for cleanup purposes',
  },
}, {
  tableName: 'alert_timeline_events',
  indexes: [
    {
      fields: ['alert_id', 'timestamp'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['ai_source'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['timestamp'],
    },
  ],
});

module.exports = AlertTimelineEvent;