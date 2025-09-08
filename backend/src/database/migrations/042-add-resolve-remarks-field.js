'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add resolve remarks field to alerts table
    await queryInterface.addColumn('alerts', 'resolve_remarks', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Structured resolve remarks data including resolution type, timestamp, source, and detailed explanation'
    });

    // Add index for querying resolved alerts by resolution type and source
    await queryInterface.addIndex('alerts', ['resolve_remarks'], {
      name: 'idx_alerts_resolve_remarks',
      using: 'gin' // GIN index for JSONB field
    });

    // Add composite index for status and resolve_remarks for efficient filtering
    await queryInterface.addIndex('alerts', ['status', 'resolve_remarks'], {
      name: 'idx_alerts_status_resolve_remarks'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('alerts', 'idx_alerts_status_resolve_remarks');
    await queryInterface.removeIndex('alerts', 'idx_alerts_resolve_remarks');
    
    // Remove column
    await queryInterface.removeColumn('alerts', 'resolve_remarks');
  }
};