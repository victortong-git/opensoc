'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playbooks', {
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
      description: {
        type: Sequelize.TEXT
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      trigger_type: {
        type: Sequelize.ENUM('manual', 'alert_based', 'scheduled', 'api_triggered'),
        defaultValue: 'manual'
      },
      trigger_conditions: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      steps: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      input_parameters: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      output_format: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      estimated_time: {
        type: Sequelize.INTEGER
      },
      complexity_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'intermediate'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      version: {
        type: Sequelize.STRING(20),
        defaultValue: '1.0.0'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      execution_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      success_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0
      },
      average_execution_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_executed: {
        type: Sequelize.DATE
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('playbooks', ['organization_id']);
    await queryInterface.addIndex('playbooks', ['category']);
    await queryInterface.addIndex('playbooks', ['trigger_type']);
    await queryInterface.addIndex('playbooks', ['is_active']);
    await queryInterface.addIndex('playbooks', ['created_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('playbooks');
  }
};