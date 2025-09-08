const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'category',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('boolean', 'string', 'number', 'object'),
    allowNull: false,
    field: 'data_type',
  },
  description: {
    type: DataTypes.TEXT,
  },
  isEditable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_editable',
  },
  updatedBy: {
    type: DataTypes.UUID,
    field: 'updated_by',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
}, {
  tableName: 'system_settings',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['category'],
    },
    {
      unique: true,
      fields: ['organization_id', 'category', 'name'],
    },
  ],
});

module.exports = SystemSettings;