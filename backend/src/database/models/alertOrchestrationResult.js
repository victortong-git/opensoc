const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertOrchestrationResult = sequelize.define('AlertOrchestrationResult', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    alertId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'alert_id'
    },
    orchestrationStatus: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false,
      field: 'orchestration_status'
    },
    virustotalAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'virustotal_analysis'
    },
    threatfoxAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'threatfox_analysis'
    },
    extractedIocs: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      field: 'extracted_iocs'
    },
    threatAssessment: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'threat_assessment'
    },
    generatedScripts: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'generated_scripts'
    },
    scriptLanguage: {
      type: DataTypes.ENUM('bash', 'python', 'powershell', 'mixed'),
      allowNull: true,
      field: 'script_language'
    },
    automationRecommendations: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'automation_recommendations'
    },
    assetContext: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'asset_context'
    },
    executionTimeline: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      field: 'execution_timeline'
    },
    confidenceScores: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'confidence_scores'
    },
    analysisTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'analysis_timestamp'
    },
    aiModelUsed: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'ai_model_used'
    },
    processingTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processing_time_ms'
    },
    errorDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'error_details'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id'
    },
    protocol: {
      type: DataTypes.ENUM('NAT_API', 'MCP'),
      allowNull: false,
      defaultValue: 'NAT_API',
      field: 'protocol'
    }
  }, {
    tableName: 'alert_orchestration_results',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['alert_id']
      },
      {
        fields: ['analysis_timestamp']
      },
      {
        fields: ['orchestration_status']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['virustotal_analysis'],
        using: 'gin'
      },
      {
        fields: ['threatfox_analysis'],
        using: 'gin'
      },
      {
        fields: ['generated_scripts'],
        using: 'gin'
      }
    ]
});

module.exports = AlertOrchestrationResult;