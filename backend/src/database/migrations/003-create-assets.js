'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assets', {
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
      ip_address: {
        type: Sequelize.INET
      },
      hostname: {
        type: Sequelize.STRING(255)
      },
      mac_address: {
        type: Sequelize.STRING(17)
      },
      asset_type: {
        type: Sequelize.ENUM('server', 'workstation', 'network_device', 'mobile_device', 'iot_device', 'virtual_machine', 'container', 'cloud_service'),
        allowNull: false
      },
      os_type: {
        type: Sequelize.STRING(100)
      },
      os_version: {
        type: Sequelize.STRING(100)
      },
      criticality: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      location: {
        type: Sequelize.STRING(255)
      },
      department: {
        type: Sequelize.STRING(100)
      },
      owner: {
        type: Sequelize.STRING(255)
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'maintenance', 'decommissioned'),
        defaultValue: 'active'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      last_seen: {
        type: Sequelize.DATE
      },
      first_discovered: {
        type: Sequelize.DATE
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
    await queryInterface.addIndex('assets', ['organization_id']);
    await queryInterface.addIndex('assets', ['asset_type']);
    await queryInterface.addIndex('assets', ['criticality']);
    await queryInterface.addIndex('assets', ['status']);
    await queryInterface.addIndex('assets', ['ip_address']);
    await queryInterface.addIndex('assets', ['hostname']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assets');
  }
};