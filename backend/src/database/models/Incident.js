const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  status: {
    type: DataTypes.ENUM('open', 'investigating', 'contained', 'resolved'),
    defaultValue: 'open',
  },
  category: {
    type: DataTypes.ENUM('malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat'),
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
  },
  assignedToName: {
    type: DataTypes.STRING(255),
    field: 'assigned_to_name',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
  alertIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'alert_ids',
  },
  alertCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'alert_count',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  resolvedAt: {
    type: DataTypes.DATE,
    field: 'resolved_at',
  },
  // Test data flag for cleanup and filtering
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/demo data for cleanup purposes',
  },
  // Vector embedding for RAG similarity searches
  embedding: {
    type: 'vector(384)',
    allowNull: true,
    comment: 'Vector embedding for RAG similarity search (384-dimensional)',
  },
}, {
  tableName: 'incidents',
  indexes: [
    {
      fields: ['severity', 'status'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['assigned_to'],
    },
    {
      fields: ['category'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['is_test_data'],
    },
  ],
});

module.exports = Incident;