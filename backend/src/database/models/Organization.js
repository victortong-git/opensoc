const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  domain: {
    type: DataTypes.STRING(255),
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'organizations',
  indexes: [
    {
      fields: ['name'],
    },
    {
      fields: ['domain'],
    },
  ],
});

module.exports = Organization;