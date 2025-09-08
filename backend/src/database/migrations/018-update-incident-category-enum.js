'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new values to the incidents category enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'phishing';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'dos_attack';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'privilege_escalation';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'data_loss';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'exploit';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'network_security';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'endpoint_security';
      ALTER TYPE enum_incidents_category ADD VALUE IF NOT EXISTS 'application_security';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum and updating all references
    console.log('Reverting incident category enum changes requires manual intervention');
  }
};