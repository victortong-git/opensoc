'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User these preferences belong to'
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Organization for multi-tenancy'
      },
      notification_type: {
        type: Sequelize.ENUM('alert', 'incident', 'system', 'security', 'info'),
        allowNull: false,
        comment: 'Type of notification this preference applies to'
      },
      priority_threshold: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low',
        allowNull: false,
        comment: 'Minimum priority level to receive notifications'
      },
      enabled_channels: {
        type: Sequelize.JSONB,
        defaultValue: ['web'],
        allowNull: false,
        comment: 'Array of enabled notification channels (web, email, webhook, websocket)'
      },
      quiet_hours_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether quiet hours are enabled'
      },
      quiet_hours_start: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Start time for quiet hours (no non-critical notifications)'
      },
      quiet_hours_end: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'End time for quiet hours'
      },
      quiet_hours_timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'UTC',
        allowNull: false,
        comment: 'Timezone for quiet hours calculation'
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether email notifications are enabled for this type'
      },
      email_priority_threshold: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'high',
        allowNull: false,
        comment: 'Minimum priority for email notifications'
      },
      webhook_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether webhook notifications are enabled'
      },
      webhook_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
        comment: 'Custom webhook URL for this notification type'
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
        comment: 'Additional settings and configuration options'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this preference is currently active'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for efficient querying
    await queryInterface.addIndex('notification_preferences', ['user_id'], {
      name: 'idx_notification_preferences_user'
    });
    
    await queryInterface.addIndex('notification_preferences', ['organization_id'], {
      name: 'idx_notification_preferences_org'
    });
    
    await queryInterface.addIndex('notification_preferences', ['notification_type'], {
      name: 'idx_notification_preferences_type'
    });
    
    await queryInterface.addIndex('notification_preferences', ['is_active'], {
      name: 'idx_notification_preferences_active'
    });
    
    // Unique constraint to prevent duplicate preferences per user/type/org
    await queryInterface.addIndex('notification_preferences', ['user_id', 'notification_type', 'organization_id'], {
      unique: true,
      name: 'unique_user_type_org_preference'
    });
    
    // Composite indexes for common queries
    await queryInterface.addIndex('notification_preferences', ['user_id', 'is_active', 'notification_type'], {
      name: 'idx_preferences_user_active_type'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_preferences');
  }
};