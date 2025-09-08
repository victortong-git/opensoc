'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_generation_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id'
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'organization_id'
      },
      dataType: {
        type: Sequelize.ENUM('alert', 'incident', 'asset', 'ioc', 'playbook'),
        allowNull: false,
        field: 'data_type'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      scenario: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      aiResponse: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'ai_response'
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'error_message'
      },
      executionTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Execution time in milliseconds',
        field: 'execution_time'
      },
      aiModel: {
        type: Sequelize.STRING(100),
        allowNull: true,
        field: 'ai_model'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional generation metadata'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('ai_generation_logs', ['organization_id']);
    await queryInterface.addIndex('ai_generation_logs', ['user_id']);
    await queryInterface.addIndex('ai_generation_logs', ['data_type']);
    await queryInterface.addIndex('ai_generation_logs', ['created_at']);
    await queryInterface.addIndex('ai_generation_logs', ['success']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_generation_logs');
  }
};