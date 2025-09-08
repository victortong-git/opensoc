'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alert_rules', {
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
      rule_type: {
        type: Sequelize.ENUM('threshold', 'anomaly', 'correlation', 'signature'),
        allowNull: false
      },
      conditions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      threshold_value: {
        type: Sequelize.DECIMAL(10, 2)
      },
      time_window: {
        type: Sequelize.INTEGER // in minutes
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_by: {
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

    // Add indexes (only if they don't exist)
    try {
      const indexes = await queryInterface.showIndex('alert_rules');
      const existingIndexNames = indexes.map(idx => idx.name);
      
      if (!existingIndexNames.includes('alert_rules_organization_id')) {
        await queryInterface.addIndex('alert_rules', ['organization_id']);
      }
      if (!existingIndexNames.includes('alert_rules_rule_type')) {
        await queryInterface.addIndex('alert_rules', ['rule_type']);
      }
      if (!existingIndexNames.includes('alert_rules_is_enabled')) {
        await queryInterface.addIndex('alert_rules', ['is_enabled']);
      }
      if (!existingIndexNames.includes('alert_rules_severity')) {
        await queryInterface.addIndex('alert_rules', ['severity']);
      }
      if (!existingIndexNames.includes('alert_rules_created_by')) {
        await queryInterface.addIndex('alert_rules', ['created_by']);
      }
      if (!existingIndexNames.includes('alert_rules_created_at')) {
        await queryInterface.addIndex('alert_rules', ['created_at']);
      }
    } catch (error) {
      console.log('Some indexes may already exist, skipping index creation errors');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('alert_rules');
  }
};