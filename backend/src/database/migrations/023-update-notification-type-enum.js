'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update notifications type enum to include new values
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_notifications_type ADD VALUE IF NOT EXISTS 'alert';
      ALTER TYPE enum_notifications_type ADD VALUE IF NOT EXISTS 'incident';
      ALTER TYPE enum_notifications_type ADD VALUE IF NOT EXISTS 'system';
      ALTER TYPE enum_notifications_type ADD VALUE IF NOT EXISTS 'security';
    `);
    
    // Also update priority enum to include 'critical'
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_notifications_priority ADD VALUE IF NOT EXISTS 'critical';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    console.log('Reverting notification type enum changes requires manual intervention');
  }
};