'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new values to the timeline_events type enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_timeline_events_type ADD VALUE IF NOT EXISTS 'alert';
      ALTER TYPE enum_timeline_events_type ADD VALUE IF NOT EXISTS 'note';
      ALTER TYPE enum_timeline_events_type ADD VALUE IF NOT EXISTS 'action';
      ALTER TYPE enum_timeline_events_type ADD VALUE IF NOT EXISTS 'investigation';
      ALTER TYPE enum_timeline_events_type ADD VALUE IF NOT EXISTS 'containment';
      ALTER TYPE enum_timeline_events_type ADD VALUE IF NOT EXISTS 'analysis';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    console.log('Reverting timeline event type enum changes requires manual intervention');
  }
};