'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('threat_hunting_events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hunting_type: {
        type: Sequelize.ENUM('proactive', 'reactive', 'intel_driven', 'scheduled'),
        allowNull: false,
        defaultValue: 'proactive',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planned',
      },
      hypothesis: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      scope: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      target_assets: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      hunting_techniques: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      related_threat_intel: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      mitre_tactics: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      mitre_techniques: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      plan_phase: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      execution_phase: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      analysis_phase: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      findings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      iocs_discovered: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      recommended_actions: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      hunter_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assigned_analysts: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estimated_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      actual_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      related_incidents: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      related_alerts: {
        type: Sequelize.ARRAY(Sequelize.UUID),
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
      false_positive_rate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
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
    await queryInterface.addIndex('threat_hunting_events', ['organization_id']);
    await queryInterface.addIndex('threat_hunting_events', ['hunter_id']);
    await queryInterface.addIndex('threat_hunting_events', ['status']);
    await queryInterface.addIndex('threat_hunting_events', ['priority']);
    await queryInterface.addIndex('threat_hunting_events', ['hunting_type']);
    await queryInterface.addIndex('threat_hunting_events', ['confidence']);
    await queryInterface.addIndex('threat_hunting_events', ['severity']);
    await queryInterface.addIndex('threat_hunting_events', ['is_test_data']);
    await queryInterface.addIndex('threat_hunting_events', ['start_date']);
    await queryInterface.addIndex('threat_hunting_events', ['end_date']);

    // Add GIN indexes for array and JSONB fields
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['target_assets'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['hunting_techniques'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['mitre_tactics'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['mitre_techniques'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['iocs_discovered'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['assigned_analysts'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['related_incidents'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['related_alerts'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['tags'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['related_threat_intel'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['plan_phase'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['execution_phase'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['analysis_phase'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['findings'],
      using: 'gin',
    });
    await queryInterface.addIndex('threat_hunting_events', {
      fields: ['metadata'],
      using: 'gin',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('threat_hunting_events');
  },
};