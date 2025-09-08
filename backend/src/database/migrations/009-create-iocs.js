'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('iocs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('ip_address', 'domain', 'url', 'file_hash', 'email', 'registry_key', 'mutex', 'user_agent', 'certificate'),
        allowNull: false
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      source: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      confidence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        }
      },
      threat_types: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      first_seen: {
        type: Sequelize.DATE,
        allowNull: false
      },
      last_seen: {
        type: Sequelize.DATE,
        allowNull: false
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      description: {
        type: Sequelize.TEXT
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      false_positive: {
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
    await queryInterface.addIndex('iocs', ['organization_id']);
    await queryInterface.addIndex('iocs', ['type']);
    await queryInterface.addIndex('iocs', ['value']);
    await queryInterface.addIndex('iocs', ['is_active']);
    await queryInterface.addIndex('iocs', ['type', 'value'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('iocs');
  }
};