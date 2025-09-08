const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertRule = sequelize.define('AlertRule', {
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
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_enabled',
  },
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  conditions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },
  actions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },
  timeWindow: {
    type: DataTypes.INTEGER,
    defaultValue: 300, // 5 minutes in seconds
    field: 'time_window',
  },
  threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  triggerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'trigger_count',
  },
  lastTriggered: {
    type: DataTypes.DATE,
    field: 'last_triggered',
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
}, {
  tableName: 'alert_rules',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['category'],
    },
    {
      fields: ['is_enabled'],
    },
    {
      fields: ['severity'],
    },
    {
      fields: ['created_by'],
    },
  ],
});

module.exports = AlertRule;