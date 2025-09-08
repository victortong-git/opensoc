'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mitre_techniques', {
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
      tactic_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'mitre_tactics',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      parent_technique_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'mitre_techniques',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_sub_technique: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      kill_chain_phases: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      platforms: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      data_sources: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      defenses: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      impact_type: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      network_requirements: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      remote_support: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      system_requirements: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
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
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['mitre_id'],
      unique: true,
    });
    await queryInterface.addIndex('mitre_techniques', ['tactic_id']);
    await queryInterface.addIndex('mitre_techniques', ['parent_technique_id']);
    await queryInterface.addIndex('mitre_techniques', ['organization_id']);
    await queryInterface.addIndex('mitre_techniques', ['name']);
    await queryInterface.addIndex('mitre_techniques', ['is_sub_technique']);
    await queryInterface.addIndex('mitre_techniques', ['is_active']);
    await queryInterface.addIndex('mitre_techniques', ['data_source']);
    await queryInterface.addIndex('mitre_techniques', ['is_test_data']);
    await queryInterface.addIndex('mitre_techniques', ['version']);

    // Add GIN indexes for array and JSONB fields
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['kill_chain_phases'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['platforms'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['data_sources'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['defenses'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['permissions'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['impact_type'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['network_requirements'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['system_requirements'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['aliases'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_techniques', {
      fields: ['metadata'],
      using: 'gin',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mitre_techniques');
  },
};