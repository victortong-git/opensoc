'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add protocol field to distinguish between NAT API and MCP orchestration
    await queryInterface.addColumn('alert_orchestration_results', 'protocol', {
      type: Sequelize.ENUM('NAT_API', 'MCP'),
      allowNull: false,
      defaultValue: 'NAT_API',
      comment: 'Protocol used for orchestration (NAT_API or MCP)'
    });

    // Add index for protocol field for efficient filtering
    await queryInterface.addIndex('alert_orchestration_results', ['protocol']);
    
    // Add composite index for alert_id + protocol for fast lookups
    await queryInterface.addIndex('alert_orchestration_results', ['alert_id', 'protocol']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('alert_orchestration_results', ['alert_id', 'protocol']);
    await queryInterface.removeIndex('alert_orchestration_results', ['protocol']);
    
    // Remove the protocol column
    await queryInterface.removeColumn('alert_orchestration_results', 'protocol');
  }
};