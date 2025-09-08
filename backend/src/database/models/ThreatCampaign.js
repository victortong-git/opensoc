const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ThreatCampaign = sequelize.define('ThreatCampaign', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
        len: [10, 5000],
      },
    },
    threatActorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'threat_actors',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Associated threat actor (if known)',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the campaign began',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the campaign ended (if applicable)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the campaign is currently active',
    },
    targetSectors: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Industries/sectors targeted by this campaign',
    },
    targetGeographies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Countries/regions targeted by this campaign',
    },
    techniques: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'MITRE ATT&CK technique IDs used in this campaign',
    },
    objectives: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Primary objectives of the campaign',
    },
    severity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Severity level of the campaign (1-5)',
    },
    confidence: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Confidence level in the campaign attribution',
    },
    victimCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
      comment: 'Estimated number of victims',
    },
    estimatedImpact: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Estimated financial or operational impact',
    },
    associatedIOCs: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Array of IOC IDs associated with this campaign',
    },
    relatedIncidents: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Array of incident IDs related to this campaign',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Tags for categorization and search',
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    isTestData: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Flag to identify test/generated data',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional flexible metadata for the campaign',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'threat_campaigns',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId'],
      },
      {
        fields: ['threatActorId'],
      },
      {
        fields: ['name'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['severity'],
      },
      {
        fields: ['confidence'],
      },
      {
        fields: ['isTestData'],
      },
      {
        fields: ['startDate'],
      },
      {
        fields: ['endDate'],
      },
      {
        using: 'gin',
        fields: ['targetSectors'],
      },
      {
        using: 'gin',
        fields: ['targetGeographies'],
      },
      {
        using: 'gin',
        fields: ['techniques'],
      },
      {
        using: 'gin',
        fields: ['objectives'],
      },
      {
        using: 'gin',
        fields: ['associatedIOCs'],
      },
      {
        using: 'gin',
        fields: ['relatedIncidents'],
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
    comment: 'Threat campaigns for tracking coordinated cyber operations',
  });

module.exports = ThreatCampaign;