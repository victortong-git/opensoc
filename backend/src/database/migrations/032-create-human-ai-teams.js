'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('human_ai_teams', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      specialization: {
        type: Sequelize.ENUM('incident_response', 'threat_hunting', 'vulnerability_management', 'compliance', 'forensics'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      human_analysts: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      ai_agents: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
        allowNull: false,
      },
      performance_metrics: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
      },
      current_workload: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      max_workload: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        allowNull: false,
      },
      team_lead: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      last_activity: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('human_ai_teams', ['organization_id']);
    await queryInterface.addIndex('human_ai_teams', ['specialization']);
    await queryInterface.addIndex('human_ai_teams', ['current_workload']);
    await queryInterface.addIndex('human_ai_teams', ['last_activity']);
    await queryInterface.addIndex('human_ai_teams', ['organization_id', 'specialization']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('human_ai_teams');
  }
};