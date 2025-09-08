'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add action_required field
    await queryInterface.addColumn('notifications', 'action_required', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    // Add related_id field
    await queryInterface.addColumn('notifications', 'related_id', {
      type: Sequelize.UUID,
      allowNull: true
    });
    
    // Add related_type field
    await queryInterface.addColumn('notifications', 'related_type', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    
    // Add expires_at field
    await queryInterface.addColumn('notifications', 'expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifications', 'action_required');
    await queryInterface.removeColumn('notifications', 'related_id');
    await queryInterface.removeColumn('notifications', 'related_type');
    await queryInterface.removeColumn('notifications', 'expires_at');
  }
};