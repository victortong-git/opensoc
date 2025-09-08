const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('alert', 'incident', 'system', 'security', 'info'),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
  actionRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'action_required',
  },
  relatedId: {
    type: DataTypes.UUID,
    field: 'related_id',
  },
  relatedType: {
    type: DataTypes.ENUM('alert', 'incident', 'asset', 'user'),
    field: 'related_type',
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at',
  },
  // New fields from migration 045
  sourceSystem: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'source_system',
    comment: 'System or service that generated this notification',
  },
  notificationChannel: {
    type: DataTypes.ENUM('web', 'email', 'webhook', 'websocket'),
    defaultValue: 'web',
    allowNull: false,
    field: 'notification_channel',
    comment: 'Channel through which notification will be delivered',
  },
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'archived_at',
    comment: 'Timestamp when notification was archived',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
    comment: 'Timestamp when notification was marked as read',
  },
  notificationSettings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false,
    field: 'notification_settings',
    comment: 'Additional settings and metadata for the notification',
  },
}, {
  tableName: 'notifications',
  hooks: {
    beforeUpdate: (notification, options) => {
      // Automatically set readAt timestamp when isRead changes to true
      if (notification.changed('isRead') && notification.isRead && !notification.readAt) {
        notification.readAt = new Date();
      }
    },
  },
  indexes: [
    {
      fields: ['user_id', 'is_read'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['priority'],
    },
    {
      fields: ['created_at'],
    },
    // New indexes from migration 045
    {
      fields: ['priority', 'is_read'],
      name: 'idx_notifications_priority_read'
    },
    {
      fields: ['source_system'],
      name: 'idx_notifications_source_system'
    },
    {
      fields: ['archived_at'],
      name: 'idx_notifications_archived'
    },
    {
      fields: ['read_at'],
      name: 'idx_notifications_read_at'
    },
    {
      fields: ['notification_channel'],
      name: 'idx_notifications_channel'
    },
  ],
  scopes: {
    unread: {
      where: {
        isRead: false,
        archivedAt: null,
      },
    },
    active: {
      where: {
        archivedAt: null,
      },
    },
    byPriority: (priority) => ({
      where: {
        priority,
        archivedAt: null,
      },
    }),
    byType: (type) => ({
      where: {
        type,
        archivedAt: null,
      },
    }),
    forUser: (userId) => ({
      where: {
        userId,
        archivedAt: null,
      },
    }),
  },
});

module.exports = Notification;