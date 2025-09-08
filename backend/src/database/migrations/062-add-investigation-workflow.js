'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('threat_hunting_events', 'investigation_workflow', {
      type: Sequelize.JSONB,
      defaultValue: {},
      comment: 'Structured investigation workflow with phases, procedures, and steps'
    });

    // Add GIN index for efficient JSONB queries
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['investigation_workflow'],
      using: 'gin',
      name: 'idx_threat_hunting_events_investigation_workflow'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('threat_hunting_events', 'idx_threat_hunting_events_investigation_workflow');
    
    // Remove the column
    await queryInterface.removeColumn('threat_hunting_events', 'investigation_workflow');
  }
};