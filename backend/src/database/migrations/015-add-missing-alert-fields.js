'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add asset_name field 
    await queryInterface.addColumn('alerts', 'asset_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    
    // Add enrichment_data field
    await queryInterface.addColumn('alerts', 'enrichment_data', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });
    
    // Add assigned_agent field
    await queryInterface.addColumn('alerts', 'assigned_agent', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('alerts', 'asset_name');
    await queryInterface.removeColumn('alerts', 'enrichment_data');
    await queryInterface.removeColumn('alerts', 'assigned_agent');
  }
};