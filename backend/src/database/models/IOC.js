const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IOC = sequelize.define('IOC', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('ip', 'domain', 'url', 'file_hash', 'email', 'registry_key'),
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  confidence: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  firstSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'first_seen',
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_seen',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  relatedCampaign: {
    type: DataTypes.UUID,
    field: 'related_campaign',
  },
  mitreAttack: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'mitre_attack',
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
  tableName: 'iocs',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['value'],
    },
    {
      fields: ['confidence'],
    },
    {
      fields: ['severity'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['organization_id', 'is_test_data'],
    },
  ],
});

module.exports = IOC;