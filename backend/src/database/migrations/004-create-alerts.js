'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      status: {
        type: Sequelize.ENUM('new', 'investigating', 'resolved', 'false_positive'),
        defaultValue: 'new'
      },
      source_system: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      rule_name: {
        type: Sequelize.STRING(255)
      },
      raw_data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      indicators: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      mitre_tactics: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      mitre_techniques: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        validate: {
          min: 0.0,
          max: 1.0
        }
      },
      assigned_to: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_agent: {
        type: Sequelize.STRING(100)
      },
      is_test_data: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      embedding: {
        type: Sequelize.ARRAY(Sequelize.REAL)
      },
      asset_id: {
        type: Sequelize.UUID,
        references: {
          model: 'assets',
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
    await queryInterface.addIndex('alerts', ['organization_id']);
    await queryInterface.addIndex('alerts', ['severity', 'status']);
    await queryInterface.addIndex('alerts', ['asset_id']);
    await queryInterface.addIndex('alerts', ['assigned_to']);
    await queryInterface.addIndex('alerts', ['is_test_data']);
    await queryInterface.addIndex('alerts', ['created_at']);
    await queryInterface.addIndex('alerts', ['source_system']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('alerts');
  }
};