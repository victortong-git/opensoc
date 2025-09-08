const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MitreProcedure = sequelize.define('MitreProcedure', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  mitreId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'mitre_id',
    comment: 'MITRE ATT&CK Procedure ID if available (some procedures may not have official IDs)',
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
    comment: 'Brief summary of the procedure',
  },
  techniqueId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'technique_id',
    references: {
      model: 'mitre_techniques',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Reference to parent MITRE technique',
  },
  threatActorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'threat_actor_id',
    references: {
      model: 'threat_actors',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Threat actor associated with this procedure (if known)',
  },
  malwareFamily: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'malware_family',
    comment: 'Malware family that uses this procedure',
  },
  toolName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tool_name',
    comment: 'Specific tool or software used in this procedure',
  },
  platforms: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Applicable platforms (Windows, Linux, macOS, etc.)',
  },
  procedureSteps: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'procedure_steps',
    comment: 'Detailed step-by-step procedure instructions',
  },
  commandsUsed: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'commands_used',
    comment: 'Specific commands or code snippets used',
  },
  artifactsCreated: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'artifacts_created',
    comment: 'Files, registry keys, or other artifacts created by this procedure',
  },
  networkIndicators: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'network_indicators',
    comment: 'Network-based indicators of compromise',
  },
  detectiveControls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'detective_controls',
    comment: 'Detective controls that can identify this procedure',
  },
  preventiveControls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'preventive_controls',
    comment: 'Preventive controls that can block this procedure',
  },
  confidence: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Confidence level in this procedure attribution',
  },
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: {
      min: 1,
      max: 5,
    },
    comment: 'Severity level of this procedure (1-5)',
  },
  complexity: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Technical complexity required to execute this procedure',
  },
  privileges: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Required privilege levels (user, admin, system, etc.)',
  },
  dataSource: {
    type: DataTypes.STRING,
    defaultValue: 'custom',
    field: 'data_source',
    comment: 'Source of this procedure data (mitre, custom, intel, etc.)',
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Original source or reference for this procedure',
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
    comment: 'URL to additional information about this procedure',
  },
  firstObserved: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'first_observed',
    comment: 'When this procedure was first observed',
  },
  lastObserved: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_observed',
    comment: 'When this procedure was last observed',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether this procedure is currently active/relevant',
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
    comment: 'Organization ID for organization-specific procedures',
  },
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/generated data',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Tags for categorization and filtering',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional flexible metadata including IOCs, references, etc.',
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
  tableName: 'mitre_procedures',
  timestamps: true,
  indexes: [
    {
      fields: ['mitre_id'],
    },
    {
      fields: ['technique_id'],
    },
    {
      fields: ['threat_actor_id'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['name'],
    },
    {
      fields: ['malware_family'],
    },
    {
      fields: ['tool_name'],
    },
    {
      fields: ['confidence'],
    },
    {
      fields: ['severity'],
    },
    {
      fields: ['complexity'],
    },
    {
      fields: ['data_source'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['first_observed'],
    },
    {
      fields: ['last_observed'],
    },
    {
      using: 'gin',
      fields: ['platforms'],
    },
    {
      using: 'gin',
      fields: ['procedure_steps'],
    },
    {
      using: 'gin',
      fields: ['commands_used'],
    },
    {
      using: 'gin',
      fields: ['artifacts_created'],
    },
    {
      using: 'gin',
      fields: ['network_indicators'],
    },
    {
      using: 'gin',
      fields: ['detective_controls'],
    },
    {
      using: 'gin',
      fields: ['preventive_controls'],
    },
    {
      using: 'gin',
      fields: ['privileges'],
    },
    {
      using: 'gin',
      fields: ['tags'],
    },
    {
      using: 'gin',
      fields: ['metadata'],
    },
  ],
  comment: 'MITRE ATT&CK procedures - specific implementation details and examples',
});

module.exports = MitreProcedure;