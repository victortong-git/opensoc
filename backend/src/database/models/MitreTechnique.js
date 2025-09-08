const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MitreTechnique = sequelize.define('MitreTechnique', {
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
    comment: 'MITRE ATT&CK Technique ID (e.g., T1055)',
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
    comment: 'Brief summary of the technique',
  },
  tacticId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tactic_id',
    references: {
      model: 'mitre_tactics',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Reference to parent MITRE tactic',
  },
  parentTechniqueId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_technique_id',
    references: {
      model: 'mitre_techniques',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Parent technique ID for sub-techniques',
  },
  isSubTechnique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_sub_technique',
    comment: 'Whether this is a sub-technique of another technique',
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
    comment: 'URL to official MITRE ATT&CK page for this technique',
  },
  killChainPhases: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'kill_chain_phases',
    comment: 'Kill chain phases this technique belongs to',
  },
  platforms: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Applicable platforms (Windows, Linux, macOS, etc.)',
  },
  dataSources: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'data_sources',
    comment: 'Data sources that can detect this technique',
  },
  defenses: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Defensive measures against this technique',
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Required permissions to execute this technique',
  },
  impactType: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'impact_type',
    comment: 'Types of impact this technique can have',
  },
  networkRequirements: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'network_requirements',
    comment: 'Network requirements for this technique',
  },
  remoteSupport: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'remote_support',
    comment: 'Whether technique can be executed remotely',
  },
  systemRequirements: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'system_requirements',
    comment: 'System requirements for this technique',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether this technique is currently active in MITRE framework',
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'MITRE ATT&CK framework version this technique belongs to',
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_updated',
    comment: 'When this technique was last updated in MITRE framework',
  },
  aliases: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Alternative names for this technique',
  },
  dataSource: {
    type: DataTypes.STRING,
    defaultValue: 'mitre',
    field: 'data_source',
    comment: 'Source of this technique data (mitre, custom, etc.)',
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
    comment: 'Organization ID for custom techniques, null for standard MITRE techniques',
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
    comment: 'Additional flexible metadata including examples, references, etc.',
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
  tableName: 'mitre_techniques',
  timestamps: true,
  indexes: [
    {
      fields: ['mitre_id'],
      unique: true,
    },
    {
      fields: ['tactic_id'],
    },
    {
      fields: ['parent_technique_id'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['name'],
    },
    {
      fields: ['is_sub_technique'],
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
      fields: ['version'],
    },
    {
      using: 'gin',
      fields: ['kill_chain_phases'],
    },
    {
      using: 'gin',
      fields: ['platforms'],
    },
    {
      using: 'gin',
      fields: ['data_sources'],
    },
    {
      using: 'gin',
      fields: ['defenses'],
    },
    {
      using: 'gin',
      fields: ['permissions'],
    },
    {
      using: 'gin',
      fields: ['impact_type'],
    },
    {
      using: 'gin',
      fields: ['network_requirements'],
    },
    {
      using: 'gin',
      fields: ['system_requirements'],
    },
    {
      using: 'gin',
      fields: ['aliases'],
    },
    {
      using: 'gin',
      fields: ['metadata'],
    },
  ],
  comment: 'MITRE ATT&CK techniques - specific methods used by adversaries',
});

module.exports = MitreTechnique;