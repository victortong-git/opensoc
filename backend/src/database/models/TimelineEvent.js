const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimelineEvent = sequelize.define('TimelineEvent', {
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
    type: DataTypes.ENUM('alert', 'action', 'note', 'status_change'),
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
  incidentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'incident_id',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  // Test data flag for cleanup and filtering
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/demo data for cleanup purposes',
  },
}, {
  tableName: 'timeline_events',
  indexes: [
    {
      fields: ['incident_id', 'timestamp'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['is_test_data'],
    },
  ],
});

module.exports = TimelineEvent;