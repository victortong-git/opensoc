'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_agent_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      agent_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the AI agent (e.g. "Alert and Incident Specialist Agent")',
      },
      task_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Type of task performed (e.g. "classify alert", "analyze alert")',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Detailed description of the activity performed',
      },
      input_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Number of input tokens used',
      },
      output_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Number of output tokens generated',
      },
      total_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Total tokens consumed (input + output)',
      },
      execution_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Processing time in milliseconds',
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the operation succeeded',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if the operation failed',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who triggered the AI action',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Organization context',
      },
      alert_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'alerts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related alert ID if applicable',
      },
      incident_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'incidents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related incident ID if applicable',
      },
      ai_provider: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'AI service provider used (e.g., Ollama, OpenAI)',
      },
      ai_model: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'AI model used for the task',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional context data and parameters',
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
      },
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('ai_agent_logs', ['agent_name']);
    await queryInterface.addIndex('ai_agent_logs', ['task_name']);
    await queryInterface.addIndex('ai_agent_logs', ['user_id']);
    await queryInterface.addIndex('ai_agent_logs', ['organization_id']);
    await queryInterface.addIndex('ai_agent_logs', ['created_at']);
    await queryInterface.addIndex('ai_agent_logs', ['success']);
    await queryInterface.addIndex('ai_agent_logs', ['agent_name', 'created_at']);
    await queryInterface.addIndex('ai_agent_logs', ['organization_id', 'created_at']);
    await queryInterface.addIndex('ai_agent_logs', ['alert_id']);
    await queryInterface.addIndex('ai_agent_logs', ['incident_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_agent_logs');
  }
};