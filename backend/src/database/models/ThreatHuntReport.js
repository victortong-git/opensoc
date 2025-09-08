const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ThreatHuntReport = sequelize.define('ThreatHuntReport', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  
  // === RELATIONSHIP ===
  threatHuntId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'threat_hunt_id',
    references: {
      model: 'threat_hunts',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Reference to the threat hunt this report documents',
  },
  
  // === REPORT IDENTIFICATION ===
  reportTitle: {
    type: DataTypes.STRING(300),
    allowNull: false,
    field: 'report_title',
    comment: 'Professional title for the threat hunting report',
  },
  reportType: {
    type: DataTypes.ENUM(
      'executive_summary',       // High-level business-focused report
      'technical_findings',      // Detailed technical analysis
      'methodology_review',      // Hunt methodology documentation
      'comprehensive',          // Full professional report
      'incident_response',      // IR-focused findings
      'compliance_assessment'   // Regulatory compliance report
    ),
    allowNull: false,
    field: 'report_type',
    defaultValue: 'comprehensive',
    comment: 'Type of professional report being generated',
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Version number for report tracking and updates',
  },
  
  // === EXECUTIVE SUMMARY ===
  executiveSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'executive_summary',
    comment: 'High-level summary for executive stakeholders',
  },
  businessImpact: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'business_impact',
    comment: 'Business impact assessment and risk implications',
  },
  keyFindings: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'key_findings',
    comment: 'Primary findings and discoveries from the hunt',
  },
  riskAssessment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'risk_assessment',
    comment: 'Overall risk assessment based on findings',
  },
  
  // === TECHNICAL FINDINGS ===
  technicalSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'technical_summary',
    comment: 'Technical summary for security teams and analysts',
  },
  methodologyUsed: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'methodology_used',
    comment: 'Detailed hunting methodology and approach documentation',
  },
  toolsAndTechniques: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'tools_and_techniques',
    comment: 'Tools, techniques, and technologies used in the hunt',
  },
  dataSourcesAnalyzed: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'data_sources_analyzed',
    comment: 'Data sources that were analyzed during the hunt',
  },
  
  // === DETAILED FINDINGS ===
  threatsIdentified: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'threats_identified',
    comment: 'Structured list of identified threats with details',
  },
  indicatorsOfCompromise: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'indicators_of_compromise',
    comment: 'IOCs discovered during the hunt',
  },
  suspiciousActivities: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'suspicious_activities',
    comment: 'Suspicious activities identified with context and severity',
  },
  falsePositives: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'false_positives',
    comment: 'False positives identified and lessons learned',
  },
  
  // === EVIDENCE & FORENSICS ===
  evidenceSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'evidence_summary',
    comment: 'Summary of forensic evidence collected',
  },
  evidenceChain: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'evidence_chain',
    comment: 'Chain of custody for collected evidence',
  },
  artifactsCollected: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'artifacts_collected',
    comment: 'Digital artifacts and evidence collected',
  },
  preservationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'preservation_notes',
    comment: 'Notes on evidence preservation and integrity',
  },
  
  // === RECOMMENDATIONS ===
  strategicRecommendations: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'strategic_recommendations',
    comment: 'High-level strategic recommendations for executives',
  },
  tacticalRecommendations: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'tactical_recommendations',
    comment: 'Tactical recommendations for security teams',
  },
  technicalRecommendations: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'technical_recommendations',
    comment: 'Technical implementation recommendations',
  },
  prioritizedActions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'prioritized_actions',
    comment: 'Prioritized action items with timelines and owners',
  },
  
  // === ASSESSMENT & METRICS ===
  confidenceLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
    allowNull: false,
    defaultValue: 'medium',
    field: 'confidence_level',
    comment: 'Overall confidence level in findings and conclusions',
  },
  severityAssessment: {
    type: DataTypes.ENUM('informational', 'low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
    field: 'severity_assessment',
    comment: 'Overall severity assessment of findings',
  },
  coverageAssessment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'coverage_assessment',
    comment: 'Assessment of hunting coverage and potential gaps',
  },
  metricsAndKPIs: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'metrics_and_kpis',
    comment: 'Key performance indicators and metrics from the hunt',
  },
  
  // === LESSONS LEARNED ===
  lessonsLearned: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'lessons_learned',
    comment: 'Key lessons learned for future hunts',
  },
  improvementOpportunities: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'improvement_opportunities',
    comment: 'Opportunities for improving hunting processes',
  },
  futureConsiderations: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'future_considerations',
    comment: 'Considerations for future hunting activities',
  },
  
  // === COMPLIANCE & REGULATORY ===
  complianceNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'compliance_notes',
    comment: 'Regulatory compliance considerations and notes',
  },
  legalConsiderations: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'legal_considerations',
    comment: 'Legal considerations and requirements',
  },
  retentionRequirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'retention_requirements',
    comment: 'Data retention requirements and policies',
  },
  
  // === REPORT GENERATION ===
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'generated_by',
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'User who generated this report',
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewed_by',
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'User who reviewed and approved this report',
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'User who provided final approval for this report',
  },
  status: {
    type: DataTypes.ENUM('draft', 'under_review', 'approved', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
    comment: 'Current status of the report',
  },
  
  // === AI ENHANCEMENT ===
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ai_generated',
    comment: 'Whether this report was generated with AI assistance',
  },
  aiGeneratedSections: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'ai_generated_sections',
    comment: 'Which sections were generated or enhanced by AI',
  },
  
  // === ORGANIZATIONAL ===
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  
  // === AUDIT TRAIL ===
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at',
    comment: 'When the report was officially published',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  },
}, {
  tableName: 'threat_hunt_reports',
  timestamps: true,
  indexes: [
    // Primary relationships
    {
      fields: ['threat_hunt_id'],
      name: 'threat_hunt_reports_hunt_id_idx'
    },
    {
      fields: ['organization_id'],
      name: 'threat_hunt_reports_organization_id_idx'
    },
    
    // Report management
    {
      fields: ['status'],
      name: 'threat_hunt_reports_status_idx'
    },
    {
      fields: ['report_type'],
      name: 'threat_hunt_reports_report_type_idx'
    },
    {
      fields: ['version'],
      name: 'threat_hunt_reports_version_idx'
    },
    
    // User tracking
    {
      fields: ['generated_by'],
      name: 'threat_hunt_reports_generated_by_idx'
    },
    {
      fields: ['reviewed_by'],
      name: 'threat_hunt_reports_reviewed_by_idx'
    },
    {
      fields: ['approved_by'],
      name: 'threat_hunt_reports_approved_by_idx'
    },
    
    // Assessment and filtering
    {
      fields: ['confidence_level'],
      name: 'threat_hunt_reports_confidence_level_idx'
    },
    {
      fields: ['severity_assessment'],
      name: 'threat_hunt_reports_severity_assessment_idx'
    },
    
    // AI tracking
    {
      fields: ['ai_generated'],
      name: 'threat_hunt_reports_ai_generated_idx'
    },
    
    // Time-based queries
    {
      fields: ['published_at'],
      name: 'threat_hunt_reports_published_at_idx'
    },
    {
      fields: ['created_at'],
      name: 'threat_hunt_reports_created_at_idx'
    },
    
    // Array field indexes
    {
      using: 'gin',
      fields: ['key_findings'],
      name: 'threat_hunt_reports_key_findings_gin_idx'
    },
    {
      using: 'gin',
      fields: ['tools_and_techniques'],
      name: 'threat_hunt_reports_tools_and_techniques_gin_idx'
    },
    {
      using: 'gin',
      fields: ['indicators_of_compromise'],
      name: 'threat_hunt_reports_iocs_gin_idx'
    },
    {
      using: 'gin',
      fields: ['strategic_recommendations'],
      name: 'threat_hunt_reports_strategic_recommendations_gin_idx'
    },
    {
      using: 'gin',
      fields: ['ai_generated_sections'],
      name: 'threat_hunt_reports_ai_generated_sections_gin_idx'
    },
    
    // JSONB indexes
    {
      using: 'gin',
      fields: ['threats_identified'],
      name: 'threat_hunt_reports_threats_identified_gin_idx'
    },
    {
      using: 'gin',
      fields: ['suspicious_activities'],
      name: 'threat_hunt_reports_suspicious_activities_gin_idx'
    },
    {
      using: 'gin',
      fields: ['evidence_chain'],
      name: 'threat_hunt_reports_evidence_chain_gin_idx'
    },
    {
      using: 'gin',
      fields: ['metrics_and_kpis'],
      name: 'threat_hunt_reports_metrics_and_kpis_gin_idx'
    },
    
    // Compound indexes for common queries
    {
      fields: ['organization_id', 'status', 'report_type'],
      name: 'threat_hunt_reports_org_status_type_idx'
    },
    {
      fields: ['threat_hunt_id', 'status', 'version'],
      name: 'threat_hunt_reports_hunt_status_version_idx'
    },
  ],
  comment: 'Professional threat hunting reports with executive and technical documentation',
});

module.exports = ThreatHuntReport;