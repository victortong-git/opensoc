const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecurityEvent = sequelize.define('SecurityEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  eventTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'event_time',
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'event_type',
  },
  severity: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  },
  sourceIp: {
    type: DataTypes.INET,
    field: 'source_ip',
  },
  destinationIp: {
    type: DataTypes.INET,
    field: 'destination_ip',
  },
  userName: {
    type: DataTypes.STRING(255),
    field: 'user_name',
  },
  assetId: {
    type: DataTypes.UUID,
    field: 'asset_id',
  },
  assetName: {
    type: DataTypes.STRING(255),
    field: 'asset_name',
  },
  rawLog: {
    type: DataTypes.TEXT,
    field: 'raw_log',
  },
  parsedData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'parsed_data',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
}, {
  tableName: 'security_events',
  indexes: [
    {
      fields: ['event_time'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['source_ip'],
    },
    {
      fields: ['asset_id'],
    },
    {
      fields: ['event_type'],
    },
    {
      fields: ['severity'],
    },
  ],
});

module.exports = SecurityEvent;