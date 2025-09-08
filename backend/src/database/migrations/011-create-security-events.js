'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('security_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      event_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      source: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      severity: {
        type: Sequelize.INTEGER,
        validate: {
          min: 1,
          max: 5
        }
      },
      source_ip: {
        type: Sequelize.INET
      },
      destination_ip: {
        type: Sequelize.INET
      },
      user_name: {
        type: Sequelize.STRING(255)
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
      asset_name: {
        type: Sequelize.STRING(255)
      },
      raw_log: {
        type: Sequelize.TEXT
      },
      parsed_data: {
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
    await queryInterface.addIndex('security_events', ['event_time']);
    await queryInterface.addIndex('security_events', ['organization_id']);
    await queryInterface.addIndex('security_events', ['source_ip']);
    await queryInterface.addIndex('security_events', ['asset_id']);
    await queryInterface.addIndex('security_events', ['event_type']);
    await queryInterface.addIndex('security_events', ['severity']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('security_events');
  }
};