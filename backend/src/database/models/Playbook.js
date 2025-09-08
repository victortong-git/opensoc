const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Playbook = sequelize.define('Playbook', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  triggerType: {
    type: DataTypes.ENUM('manual', 'automatic'),
    defaultValue: 'manual',
    field: 'trigger_type',
  },
  steps: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'execution_count',
  },
  successRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
    field: 'success_rate',
  },
  averageExecutionTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'average_execution_time',
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
  // Test data flag for cleanup and filtering
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/demo data for cleanup purposes',
  },
  // Alert-specific fields
  sourceAlertId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'source_alert_id',
    references: {
      model: 'alerts',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Source alert ID if this playbook was generated from an alert',
  },
  playbookType: {
    type: DataTypes.ENUM('general', 'immediate_action', 'investigation'),
    defaultValue: 'general',
    allowNull: false,
    field: 'playbook_type',
    comment: 'Type of playbook: general, immediate_action, or investigation',
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'ai_generated',
    comment: 'Flag indicating if this playbook was AI-generated',
  },
  // Vector embedding for RAG similarity searches
  embedding: {
    type: 'vector(384)',
    allowNull: true,
    comment: 'Vector embedding for RAG similarity search (384-dimensional)',
  },
  // Metadata field for storing additional information
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata including AI generation context and asset information',
  },
}, {
  tableName: 'playbooks',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['category'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['created_by'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['organization_id', 'is_test_data'],
    },
  ],
});

module.exports = Playbook;