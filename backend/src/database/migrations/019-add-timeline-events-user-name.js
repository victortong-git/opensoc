'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add user_name field to timeline_events
    await queryInterface.addColumn('timeline_events', 'user_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('timeline_events', 'user_name');
  }
};