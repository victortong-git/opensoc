'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'automatic' as an alias for 'alert_based' to fix seeder compatibility
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_playbooks_trigger_type ADD VALUE IF NOT EXISTS 'automatic';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    console.log('Reverting playbook trigger type enum changes requires manual intervention');
  }
};