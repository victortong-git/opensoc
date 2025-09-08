'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      data_type: {
        type: Sequelize.ENUM('boolean', 'string', 'number', 'object'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_editable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      validation_rules: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      default_value: {
        type: Sequelize.JSONB
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
      updated_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('system_settings', ['organization_id']);
    await queryInterface.addIndex('system_settings', ['category']);
    await queryInterface.addIndex('system_settings', ['name']);
    await queryInterface.addIndex('system_settings', ['category', 'name'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('system_settings');
  }
};