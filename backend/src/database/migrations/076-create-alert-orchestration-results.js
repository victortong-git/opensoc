'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alert_orchestration_results', {
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
      orchestration_status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      virustotal_analysis: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'VirusTotal IOC analysis results'
      },
      threatfox_analysis: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'ThreatFox threat hunting and campaign analysis results'
      },
      extracted_iocs: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'IOCs extracted from alert data for analysis'
      },
      threat_assessment: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Combined threat intelligence assessment and risk scoring'
      },
      generated_scripts: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Generated automation scripts for takedown/mitigation'
      },
      script_language: {
        type: Sequelize.ENUM('bash', 'python', 'powershell', 'mixed'),
        allowNull: true,
        comment: 'Primary language of generated scripts'
      },
      automation_recommendations: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'AI-generated automation and response recommendations'
      },
      asset_context: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Asset information used for script generation context'
      },
      execution_timeline: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Timeline of orchestration execution steps'
      },
      confidence_scores: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Confidence scores for threat assessment and script recommendations'
      },
      analysis_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      ai_model_used: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'AI model used for orchestration analysis'
      },
      processing_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total orchestration processing time in milliseconds'
      },
      error_details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Error details if orchestration failed'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
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
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('alert_orchestration_results', ['alert_id']);
    await queryInterface.addIndex('alert_orchestration_results', ['analysis_timestamp']);
    await queryInterface.addIndex('alert_orchestration_results', ['orchestration_status']);
    await queryInterface.addIndex('alert_orchestration_results', ['organization_id']);
    
    // GIN indexes for JSONB fields
    await queryInterface.addIndex('alert_orchestration_results', ['virustotal_analysis'], {
      using: 'gin'
    });
    await queryInterface.addIndex('alert_orchestration_results', ['threatfox_analysis'], {
      using: 'gin'
    });
    await queryInterface.addIndex('alert_orchestration_results', ['generated_scripts'], {
      using: 'gin'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alert_orchestration_results');
  }
};