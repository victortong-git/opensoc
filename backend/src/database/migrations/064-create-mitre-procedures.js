'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mitre_procedures', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      mitre_id: {
        type: Sequelize.STRING,
        allowNull: true,
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
      technique_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'mitre_techniques',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      threat_actor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'threat_actors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      malware_family: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tool_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      platforms: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      procedure_steps: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      commands_used: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      artifacts_created: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      network_indicators: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      detective_controls: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      preventive_controls: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      confidence: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'very_high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: {
          min: 1,
          max: 5,
        },
      },
      complexity: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      privileges: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      data_source: {
        type: Sequelize.STRING,
        defaultValue: 'custom',
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      first_observed: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_observed: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
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
    await queryInterface.addIndex('mitre_procedures', ['mitre_id']);
    await queryInterface.addIndex('mitre_procedures', ['technique_id']);
    await queryInterface.addIndex('mitre_procedures', ['threat_actor_id']);
    await queryInterface.addIndex('mitre_procedures', ['organization_id']);
    await queryInterface.addIndex('mitre_procedures', ['name']);
    await queryInterface.addIndex('mitre_procedures', ['malware_family']);
    await queryInterface.addIndex('mitre_procedures', ['tool_name']);
    await queryInterface.addIndex('mitre_procedures', ['confidence']);
    await queryInterface.addIndex('mitre_procedures', ['severity']);
    await queryInterface.addIndex('mitre_procedures', ['complexity']);
    await queryInterface.addIndex('mitre_procedures', ['data_source']);
    await queryInterface.addIndex('mitre_procedures', ['is_active']);
    await queryInterface.addIndex('mitre_procedures', ['is_test_data']);
    await queryInterface.addIndex('mitre_procedures', ['first_observed']);
    await queryInterface.addIndex('mitre_procedures', ['last_observed']);

    // Add GIN indexes for array and JSONB fields
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['platforms'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['procedure_steps'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['commands_used'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['artifacts_created'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['network_indicators'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['detective_controls'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['preventive_controls'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['privileges'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['tags'],
      using: 'gin',
    });
    await queryInterface.addIndex('mitre_procedures', {
      fields: ['metadata'],
      using: 'gin',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mitre_procedures');
  },
};