'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_agents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('soc_analyst', 'incident_response', 'threat_intelligence', 'report_generation'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      capabilities: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      configuration: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('online', 'processing', 'maintenance', 'offline'),
        defaultValue: 'online'
      },
      model_version: {
        type: Sequelize.STRING(50)
      },
      accuracy_score: {
        type: Sequelize.DECIMAL(5, 2),
        validate: {
          min: 0.0,
          max: 100.0
        }
      },
      total_tasks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      successful_tasks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      failed_tasks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_activity: {
        type: Sequelize.DATE
      },
      performance_metrics: {
        type: Sequelize.JSONB,
        defaultValue: {}
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('ai_agents', ['organization_id']);
    await queryInterface.addIndex('ai_agents', ['type']);
    await queryInterface.addIndex('ai_agents', ['status']);
    await queryInterface.addIndex('ai_agents', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_agents');
  }
};