const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  assetType: {
    type: DataTypes.ENUM('server', 'workstation', 'network_device', 'mobile_device', 'iot_device', 'virtual_machine', 'container', 'cloud_service'),
    allowNull: false,
    field: 'asset_type',
  },
  ipAddress: {
    type: DataTypes.INET,
    field: 'ip_address',
  },
  hostname: {
    type: DataTypes.STRING(255),
  },
  macAddress: {
    type: DataTypes.STRING(17),
    field: 'mac_address',
  },
  osType: {
    type: DataTypes.STRING(100),
    field: 'os_type',
  },
  osVersion: {
    type: DataTypes.STRING(100),
    field: 'os_version',
  },
  criticality: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  location: {
    type: DataTypes.STRING(255),
  },
  department: {
    type: DataTypes.STRING(100),
  },
  owner: {
    type: DataTypes.STRING(255),
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'decommissioned'),
    defaultValue: 'active',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  lastSeen: {
    type: DataTypes.DATE,
    field: 'last_seen',
  },
  firstDiscovered: {
    type: DataTypes.DATE,
    field: 'first_discovered',
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
  // Vector embedding for RAG similarity searches
  embedding: {
    type: 'vector(384)',
    allowNull: true,
    comment: 'Vector embedding for RAG similarity search (384-dimensional)',
  },
}, {
  tableName: 'assets',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['asset_type'],
    },
    {
      fields: ['ip_address'],
    },
    {
      fields: ['hostname'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['criticality'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['organization_id', 'is_test_data'],
    },
  ],
});

module.exports = Asset;