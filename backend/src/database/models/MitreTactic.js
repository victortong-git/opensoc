const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MitreTactic = sequelize.define('MitreTactic', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  mitreId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'mitre_id',
    validate: {
      notEmpty: true,
    },
    comment: 'MITRE ATT&CK Tactic ID (e.g., TA0001)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  shortDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'short_description',
    comment: 'Brief summary of the tactic',
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
    comment: 'URL to official MITRE ATT&CK page for this tactic',
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order in the kill chain',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether this tactic is currently active in MITRE framework',
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'MITRE ATT&CK framework version this tactic belongs to',
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_updated',
    comment: 'When this tactic was last updated in MITRE framework',
  },
  aliases: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Alternative names for this tactic',
  },
  platforms: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Applicable platforms (Windows, Linux, macOS, etc.)',
  },
  dataSource: {
    type: DataTypes.STRING,
    defaultValue: 'mitre',
    field: 'data_source',
    comment: 'Source of this tactic data (mitre, custom, etc.)',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Organization ID for custom tactics, null for standard MITRE tactics',
  },
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/generated data',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional flexible metadata',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  },
}, {
  tableName: 'mitre_tactics',
  timestamps: true,
  indexes: [
    {
      fields: ['mitre_id'],
      unique: true,
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['name'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['data_source'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['order'],
    },
    {
      fields: ['version'],
    },
    {
      using: 'gin',
      fields: ['aliases'],
    },
    {
      using: 'gin',
      fields: ['platforms'],
    },
    {
      using: 'gin',
      fields: ['metadata'],
    },
  ],
  comment: 'MITRE ATT&CK tactics - high-level goals of adversary behavior',
});

module.exports = MitreTactic;