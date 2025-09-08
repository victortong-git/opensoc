'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add incidentConfirmationDetails JSONB field to alerts table
    await queryInterface.addColumn('alerts', 'incident_confirmation_details', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Structured incident verification criteria, assessment results, and confirmation artifacts for SOC managers',
    });

    // Add GIN index for efficient JSON queries on incident confirmation details
    await queryInterface.addIndex('alerts', ['incident_confirmation_details'], {
      using: 'gin',
      name: 'idx_alerts_incident_confirmation_details_gin'
    });

    // Add composite index for status and incident confirmation details for filtering
    await queryInterface.addIndex('alerts', ['status', 'incident_confirmation_details'], {
      name: 'idx_alerts_status_incident_confirmation'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('alerts', 'idx_alerts_incident_confirmation_details_gin');
    await queryInterface.removeIndex('alerts', 'idx_alerts_status_incident_confirmation');

    // Remove the column
    await queryInterface.removeColumn('alerts', 'incident_confirmation_details');
  }
};