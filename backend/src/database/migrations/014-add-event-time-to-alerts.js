'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column exists first
    const tableInfo = await queryInterface.describeTable('alerts');
    if (!tableInfo.event_time) {
      await queryInterface.addColumn('alerts', 'event_time', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }
    
    // Add index for event_time if not already present
    try {
      await queryInterface.addIndex('alerts', ['event_time']);
    } catch (error) {
      // Index might already exist, ignore error
      console.log('Index for event_time already exists or could not be created');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('alerts', 'event_time');
  }
};