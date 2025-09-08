'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new values to the alert_timeline_events type enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_alert_timeline_events_type ADD VALUE IF NOT EXISTS 'ai_triage_assigned';
      ALTER TYPE enum_alert_timeline_events_type ADD VALUE IF NOT EXISTS 'ai_false_positive_resolved';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type and updating all references
    console.log('Reverting alert timeline event type enum changes requires manual intervention');
    console.log('The enum values ai_triage_assigned and ai_false_positive_resolved have been added');
  }
};