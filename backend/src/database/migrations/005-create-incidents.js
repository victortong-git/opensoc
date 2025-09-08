'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidents', {
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
        type: Sequelize.ENUM('open', 'investigating', 'contained', 'resolved'),
        defaultValue: 'open'
      },
      category: {
        type: Sequelize.ENUM('malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat'),
        allowNull: false
      },
      source: {
        type: Sequelize.ENUM('manual', 'alert_correlation', 'external_report', 'automated_detection'),
        defaultValue: 'manual'
      },
      impact_assessment: {
        type: Sequelize.TEXT
      },
      containment_actions: {
        type: Sequelize.TEXT
      },
      eradication_actions: {
        type: Sequelize.TEXT
      },
      recovery_actions: {
        type: Sequelize.TEXT
      },
      lessons_learned: {
        type: Sequelize.TEXT
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
      resolved_at: {
        type: Sequelize.DATE
      },
      is_test_data: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('incidents', ['organization_id']);
    await queryInterface.addIndex('incidents', ['severity', 'status']);
    await queryInterface.addIndex('incidents', ['assigned_to']);
    await queryInterface.addIndex('incidents', ['is_test_data']);
    await queryInterface.addIndex('incidents', ['created_at']);
    await queryInterface.addIndex('incidents', ['category']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('incidents');
  }
};