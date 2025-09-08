'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mitre_tactics', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      mitre_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      short_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      aliases: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      platforms: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      data_source: {
        type: Sequelize.STRING,
        defaultValue: 'mitre',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_test_data: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes
    await queryInterface.addIndex('mitre_tactics', {
      fields: ['mitre_id'],
      unique: true,
    });
    await queryInterface.addIndex('mitre_tactics', ['organization_id']);
    await queryInterface.addIndex('mitre_tactics', ['name']);
    await queryInterface.addIndex('mitre_tactics', ['is_active']);
    await queryInterface.addIndex('mitre_tactics', ['data_source']);
    await queryInterface.addIndex('mitre_tactics', ['is_test_data']);
    await queryInterface.addIndex('mitre_tactics', ['order']);
    await queryInterface.addIndex('mitre_tactics', ['version']);

    // Add GIN indexes for array and JSONB fields
    await queryInterface.addIndex('mitre_tactics', {
      fields: ['aliases'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_tactics', {
      fields: ['platforms'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_tactics', {
      fields: ['metadata'],
      using: 'gin',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mitre_tactics');
  },
};