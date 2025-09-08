'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing fields for frontend compatibility
    await queryInterface.addColumn('agent_activities', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('agent_activities', 'activity_type', {
      type: Sequelize.ENUM('task_completed', 'learning_update', 'collaboration', 'error', 'maintenance'),
      allowNull: true,
    });

    await queryInterface.addColumn('agent_activities', 'impact', {
      type: Sequelize.ENUM('high', 'medium', 'low'),
      allowNull: true,
      defaultValue: 'medium',
    });

    await queryInterface.addColumn('agent_activities', 'agent_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('agent_activities', 'agent_type', {
      type: Sequelize.ENUM('soc_analyst', 'incident_response', 'threat_intel', 'report_generation'),
      allowNull: true,
    });

    await queryInterface.addColumn('agent_activities', 'human_involved', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('agent_activities', ['activity_type']);
    await queryInterface.addIndex('agent_activities', ['impact']);
    await queryInterface.addIndex('agent_activities', ['agent_type']);
    await queryInterface.addIndex('agent_activities', ['timestamp', 'activity_type']);
    await queryInterface.addIndex('agent_activities', ['agent_id', 'activity_type', 'timestamp']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('agent_activities', ['activity_type']);
    await queryInterface.removeIndex('agent_activities', ['impact']);
    await queryInterface.removeIndex('agent_activities', ['agent_type']);
    await queryInterface.removeIndex('agent_activities', ['timestamp', 'activity_type']);
    await queryInterface.removeIndex('agent_activities', ['agent_id', 'activity_type', 'timestamp']);

    // Remove columns
    await queryInterface.removeColumn('agent_activities', 'title');
    await queryInterface.removeColumn('agent_activities', 'activity_type');
    await queryInterface.removeColumn('agent_activities', 'impact');
    await queryInterface.removeColumn('agent_activities', 'agent_name');
    await queryInterface.removeColumn('agent_activities', 'agent_type');
    await queryInterface.removeColumn('agent_activities', 'human_involved');
  }
};