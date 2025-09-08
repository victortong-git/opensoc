'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update alert status enum to include new triage-focused statuses
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_alerts_status ADD VALUE 'incident_likely';
      ALTER TYPE enum_alerts_status ADD VALUE 'analysis_uncertain';
      ALTER TYPE enum_alerts_status ADD VALUE 'review_required';
    `);

    // Add triage remarks field for SOC Manager notes and AI triage reasoning
    await queryInterface.addColumn('alerts', 'triage_remarks', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Structured triage notes including AI confidence, incident likelihood assessment, and SOC manager notes',
    });

    // Add triage timestamp field
    await queryInterface.addColumn('alerts', 'triage_timestamp', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when triage status was last updated',
    });

    // Add indexes for new triage fields
    await queryInterface.addIndex('alerts', {
      fields: ['triage_remarks'],
      using: 'gin',
    });

    await queryInterface.addIndex('alerts', ['triage_timestamp']);

    await queryInterface.addIndex('alerts', ['status', 'triage_timestamp']);
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('alerts', ['status', 'triage_timestamp']);
    await queryInterface.removeIndex('alerts', ['triage_timestamp']);
    await queryInterface.removeIndex('alerts', {
      fields: ['triage_remarks'],
      using: 'gin',
    });

    // Remove triage columns
    await queryInterface.removeColumn('alerts', 'triage_timestamp');
    await queryInterface.removeColumn('alerts', 'triage_remarks');

    // Note: PostgreSQL doesn't support removing enum values directly
    // Manual intervention would be required to revert the enum changes
    // This would involve creating a new enum type and updating the column
  }
};
