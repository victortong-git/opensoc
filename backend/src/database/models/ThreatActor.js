const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ThreatActor = sequelize.define('ThreatActor', {
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
    aliases: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Alternative names for the threat actor',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 5000],
      },
    },
    motivation: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Primary motivations: espionage, financial-gain, sabotage, etc.',
    },
    sophistication: {
      type: DataTypes.ENUM('basic', 'intermediate', 'advanced', 'expert'),
      allowNull: false,
      defaultValue: 'intermediate',
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Country or region of origin',
    },
    targetSectors: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Industries/sectors typically targeted',
    },
    techniques: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'MITRE ATT&CK technique IDs',
    },
    campaigns: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Known campaign names associated with this actor',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the threat actor is currently active',
    },
    firstSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when this threat actor was first observed',
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when this threat actor was last observed',
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
      comment: 'Additional flexible metadata for the threat actor',
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
    tableName: 'threat_actors',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId'],
      },
      {
        fields: ['name'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['sophistication'],
      },
      {
        fields: ['isTestData'],
      },
      {
        fields: ['firstSeen'],
      },
      {
        fields: ['lastSeen'],
      },
      {
        fields: ['origin'],
      },
      {
        using: 'gin',
        fields: ['aliases'],
      },
      {
        using: 'gin',
        fields: ['motivation'],
      },
      {
        using: 'gin',
        fields: ['targetSectors'],
      },
      {
        using: 'gin',
        fields: ['techniques'],
      },
      {
        using: 'gin',
        fields: ['campaigns'],
      },
      {
        using: 'gin',
        fields: ['metadata'],
      },
    ],
    comment: 'Threat actor entities for threat intelligence tracking',
  });

module.exports = ThreatActor;