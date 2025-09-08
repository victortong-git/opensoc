const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  keyHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  keyPrefix: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 20],
    },
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      isUUID: 4,
    },
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      isUUID: 4,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString().split('T')[0], // Must be in the future
    },
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: ['create_alerts'],
    validate: {
      isValidPermissions(value) {
        if (!Array.isArray(value)) {
          throw new Error('Permissions must be an array');
        }
        const validPermissions = ['create_alerts', 'read_alerts', 'update_alerts'];
        const invalidPerms = value.filter(p => !validPermissions.includes(p));
        if (invalidPerms.length > 0) {
          throw new Error(`Invalid permissions: ${invalidPerms.join(', ')}`);
        }
      },
    },
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
}, {
  tableName: 'api_keys',
  underscored: false, // Keep camelCase as defined in database
  indexes: [
    {
      fields: ['organizationId'],
    },
    {
      fields: ['keyHash'],
      unique: true,
    },
    {
      fields: ['isActive'],
    },
    {
      fields: ['createdBy'],
    },
    {
      fields: ['expiresAt'],
    },
  ],
  scopes: {
    active: {
      where: {
        isActive: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    }
  },
  hooks: {
    beforeCreate: (apiKey) => {
      // Ensure metadata is an object
      if (!apiKey.metadata) {
        apiKey.metadata = {};
      }
      
      // Add creation metadata
      apiKey.metadata.createdAt = new Date();
      apiKey.metadata.version = '1.0';
    },
    
    beforeUpdate: (apiKey) => {
      // Update metadata on changes
      if (!apiKey.metadata) {
        apiKey.metadata = {};
      }
      apiKey.metadata.lastUpdated = new Date();
    }
  }
});

// Instance methods
ApiKey.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

ApiKey.prototype.canPerform = function(permission) {
  return this.permissions.includes(permission);
};

ApiKey.prototype.updateLastUsed = async function() {
  await this.update({
    lastUsedAt: new Date(),
    metadata: {
      ...this.metadata,
      lastUsed: new Date(),
      usageCount: (this.metadata.usageCount || 0) + 1
    }
  });
};

// Static methods
ApiKey.findActiveByHash = async function(keyHash) {
  return this.scope('active').findOne({
    where: { keyHash },
    include: [
      {
        model: sequelize.models.Organization,
        as: 'organization'
      },
      {
        model: sequelize.models.User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }
    ]
  });
};

ApiKey.findByOrganization = async function(organizationId, includeInactive = false) {
  const where = { organizationId };
  if (!includeInactive) {
    where.isActive = true;
  }
  
  return this.findAll({
    where,
    include: [
      {
        model: sequelize.models.User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

module.exports = ApiKey;