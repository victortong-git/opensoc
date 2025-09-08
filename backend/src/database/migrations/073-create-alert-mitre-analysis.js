'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alert_mitre_analysis', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      alert_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'alerts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      classified_domains: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of classified MITRE domains (enterprise, mobile, ics)'
      },
      mapped_techniques: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of mapped MITRE techniques with confidence scores'
      },
      enriched_analysis: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'AI-enhanced analysis and recommendations'
      },
      confidence_scores: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Per-technique confidence scores and relevance factors'
      },
      domain_scores: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Domain classification scores and details'
      },
      kill_chain_coverage: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Kill chain analysis and tactic coverage'
      },
      analysis_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      ai_model_used: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'AI model used for enrichment analysis'
      },
      processing_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total processing time in milliseconds'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('alert_mitre_analysis', ['alert_id']);
    await queryInterface.addIndex('alert_mitre_analysis', ['analysis_timestamp']);
    await queryInterface.addIndex('alert_mitre_analysis', ['classified_domains'], {
      using: 'gin'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alert_mitre_analysis');
  }
};