const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'User these preferences belong to',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    comment: 'Organization for multi-tenancy',
  },
  notificationType: {
    type: DataTypes.ENUM('alert', 'incident', 'system', 'security', 'info'),
    allowNull: false,
    field: 'notification_type',
    comment: 'Type of notification this preference applies to',
  },
  priorityThreshold: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low',
    allowNull: false,
    field: 'priority_threshold',
    comment: 'Minimum priority level to receive notifications',
  },
  enabledChannels: {
    type: DataTypes.JSONB,
    defaultValue: ['web'],
    allowNull: false,
    field: 'enabled_channels',
    comment: 'Array of enabled notification channels',
    validate: {
      isValidChannels(value) {
        const validChannels = ['web', 'email', 'webhook', 'websocket'];
        if (!Array.isArray(value)) {
          throw new Error('enabledChannels must be an array');
        }
        const invalidChannels = value.filter(channel => !validChannels.includes(channel));
        if (invalidChannels.length > 0) {
          throw new Error(`Invalid notification channels: ${invalidChannels.join(', ')}`);
        }
      }
    },
  },
  quietHoursEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'quiet_hours_enabled',
    comment: 'Whether quiet hours are enabled',
  },
  quietHoursStart: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'quiet_hours_start',
    comment: 'Start time for quiet hours (no non-critical notifications)',
  },
  quietHoursEnd: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'quiet_hours_end',
    comment: 'End time for quiet hours',
  },
  quietHoursTimezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'UTC',
    allowNull: false,
    field: 'quiet_hours_timezone',
    comment: 'Timezone for quiet hours calculation',
  },
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'email_enabled',
    comment: 'Whether email notifications are enabled for this type',
  },
  emailPriorityThreshold: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'high',
    allowNull: false,
    field: 'email_priority_threshold',
    comment: 'Minimum priority for email notifications',
  },
  webhookEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'webhook_enabled',
    comment: 'Whether webhook notifications are enabled',
  },
  webhookUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true,
    field: 'webhook_url',
    comment: 'Custom webhook URL for this notification type',
    validate: {
      isUrl: {
        args: true,
        msg: 'Webhook URL must be a valid URL'
      }
    },
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false,
    comment: 'Additional settings and configuration options',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active',
    comment: 'Whether this preference is currently active',
  },
}, {
  tableName: 'notification_preferences',
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_notification_preferences_user'
    },
    {
      fields: ['organization_id'],
      name: 'idx_notification_preferences_org'
    },
    {
      fields: ['notification_type'],
      name: 'idx_notification_preferences_type'
    },
    {
      fields: ['is_active'],
      name: 'idx_notification_preferences_active'
    },
    {
      fields: ['user_id', 'notification_type', 'organization_id'],
      unique: true,
      name: 'unique_user_type_org_preference'
    },
    {
      fields: ['user_id', 'is_active', 'notification_type'],
      name: 'idx_preferences_user_active_type'
    },
  ],
  validate: {
    quietHoursValidation() {
      if (this.quietHoursEnabled) {
        if (!this.quietHoursStart || !this.quietHoursEnd) {
          throw new Error('Quiet hours start and end times are required when quiet hours are enabled');
        }
      }
    },
    webhookValidation() {
      if (this.webhookEnabled && !this.webhookUrl) {
        throw new Error('Webhook URL is required when webhook notifications are enabled');
      }
    },
  },
  hooks: {
    beforeValidate: (preference, options) => {
      // Ensure webhook is in enabled channels if webhook is enabled
      if (preference.webhookEnabled && !preference.enabledChannels.includes('webhook')) {
        preference.enabledChannels = [...preference.enabledChannels, 'webhook'];
      }
      
      // Ensure email is in enabled channels if email is enabled
      if (preference.emailEnabled && !preference.enabledChannels.includes('email')) {
        preference.enabledChannels = [...preference.enabledChannels, 'email'];
      }
    },
  },
  scopes: {
    active: {
      where: {
        isActive: true,
      },
    },
    forUser: (userId) => ({
      where: {
        userId,
        isActive: true,
      },
    }),
    forNotificationType: (type) => ({
      where: {
        notificationType: type,
        isActive: true,
      },
    }),
    emailEnabled: {
      where: {
        emailEnabled: true,
        isActive: true,
      },
    },
    webhookEnabled: {
      where: {
        webhookEnabled: true,
        isActive: true,
      },
    },
  },
});

// Instance methods
NotificationPreference.prototype.shouldReceiveNotification = function(notification) {
  // Check if notification meets the priority threshold
  const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
  if (priorityOrder[notification.priority] < priorityOrder[this.priorityThreshold]) {
    return false;
  }
  
  // Check if notification type matches
  if (notification.type !== this.notificationType) {
    return false;
  }
  
  // Check if preference is active
  if (!this.isActive) {
    return false;
  }
  
  // Check quiet hours if enabled
  if (this.quietHoursEnabled && notification.priority !== 'critical') {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS format
    
    if (this.quietHoursStart && this.quietHoursEnd) {
      if (this.quietHoursStart <= this.quietHoursEnd) {
        // Same day range
        if (currentTime >= this.quietHoursStart && currentTime <= this.quietHoursEnd) {
          return false;
        }
      } else {
        // Overnight range
        if (currentTime >= this.quietHoursStart || currentTime <= this.quietHoursEnd) {
          return false;
        }
      }
    }
  }
  
  return true;
};

NotificationPreference.prototype.shouldReceiveEmail = function(notification) {
  if (!this.emailEnabled) return false;
  if (!this.shouldReceiveNotification(notification)) return false;
  
  const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
  return priorityOrder[notification.priority] >= priorityOrder[this.emailPriorityThreshold];
};

NotificationPreference.prototype.shouldReceiveWebhook = function(notification) {
  if (!this.webhookEnabled || !this.webhookUrl) return false;
  return this.shouldReceiveNotification(notification);
};

module.exports = NotificationPreference;