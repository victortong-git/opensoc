'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add source_system field to track notification origin
    await queryInterface.addColumn('notifications', 'source_system', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'System or service that generated this notification'
    });
    
    // Add notification_channel enum for delivery methods
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_notifications_channel AS ENUM ('web', 'email', 'webhook', 'websocket');
    `);
    
    await queryInterface.addColumn('notifications', 'notification_channel', {
      type: Sequelize.ENUM('web', 'email', 'webhook', 'websocket'),
      defaultValue: 'web',
      allowNull: false,
      comment: 'Channel through which notification will be delivered'
    });
    
    // Add archived_at timestamp for soft deletion
    await queryInterface.addColumn('notifications', 'archived_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when notification was archived'
    });
    
    // Add read_at timestamp to track when notifications were read
    await queryInterface.addColumn('notifications', 'read_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when notification was marked as read'
    });
    
    // Add notification_settings JSONB field for additional metadata
    await queryInterface.addColumn('notifications', 'notification_settings', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: false,
      comment: 'Additional settings and metadata for the notification'
    });
    
    // Add additional indexes for efficient querying
    await queryInterface.addIndex('notifications', ['priority', 'is_read'], {
      name: 'idx_notifications_priority_read'
    });
    
    await queryInterface.addIndex('notifications', ['source_system'], {
      name: 'idx_notifications_source_system'
    });
    
    await queryInterface.addIndex('notifications', ['archived_at'], {
      name: 'idx_notifications_archived'
    });
    
    await queryInterface.addIndex('notifications', ['read_at'], {
      name: 'idx_notifications_read_at'
    });
    
    await queryInterface.addIndex('notifications', ['notification_channel'], {
      name: 'idx_notifications_channel'
    });
    
    // Composite index for common filtering scenarios
    await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'priority'], {
      name: 'idx_notifications_user_read_priority'
    });
    
    await queryInterface.addIndex('notifications', ['organization_id', 'type', 'created_at'], {
      name: 'idx_notifications_org_type_created'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('notifications', 'idx_notifications_priority_read');
    await queryInterface.removeIndex('notifications', 'idx_notifications_source_system');
    await queryInterface.removeIndex('notifications', 'idx_notifications_archived');
    await queryInterface.removeIndex('notifications', 'idx_notifications_read_at');
    await queryInterface.removeIndex('notifications', 'idx_notifications_channel');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_read_priority');
    await queryInterface.removeIndex('notifications', 'idx_notifications_org_type_created');
    
    // Remove columns
    await queryInterface.removeColumn('notifications', 'source_system');
    await queryInterface.removeColumn('notifications', 'notification_channel');
    await queryInterface.removeColumn('notifications', 'archived_at');
    await queryInterface.removeColumn('notifications', 'read_at');
    await queryInterface.removeColumn('notifications', 'notification_settings');
    
    // Drop enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_notifications_channel;
    `);
  }
};