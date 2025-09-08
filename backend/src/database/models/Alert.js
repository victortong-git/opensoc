const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  status: {
    type: DataTypes.ENUM('new', 'incident_likely', 'analysis_uncertain', 'review_required', 'investigating', 'resolved', 'false_positive'),
    defaultValue: 'new',
  },
  sourceSystem: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'source_system',
  },
  eventTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'event_time',
  },
  assetId: {
    type: DataTypes.UUID,
    field: 'asset_id',
  },
  assetName: {
    type: DataTypes.STRING(255),
    field: 'asset_name',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
  },
  rawData: {
    type: DataTypes.JSONB,
    field: 'raw_data',
  },
  enrichmentData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'enrichment_data',
  },
  assignedAgent: {
    type: DataTypes.STRING(100),
    field: 'assigned_agent',
  },
  // Security Event Type classification for SOC analysis
  securityEventType: {
    type: DataTypes.ENUM(
      // Network & Traffic
      'network_intrusion',
      'ddos_attack', 
      'port_scan',
      'suspicious_traffic',
      'dns_tunneling',
      'lateral_movement',
      
      // Malware & Threats
      'malware_detection',
      'ransomware',
      'trojan',
      'virus',
      'rootkit',
      'botnet_activity',
      'phishing',
      
      // Authentication & Access
      'authentication_failure',
      'privilege_escalation',
      'unauthorized_access',
      'account_compromise',
      'brute_force_attack',
      'credential_theft',
      
      // Data & Exfiltration
      'data_exfiltration',
      'data_breach',
      'data_loss_prevention',
      'unauthorized_data_access',
      
      // System & Host
      'suspicious_process',
      'system_compromise',
      'file_integrity_violation',
      'registry_modification',
      'service_manipulation',
      
      // Application & Web
      'web_attack',
      'sql_injection',
      'xss_attack',
      'application_vulnerability',
      'api_abuse',
      
      // Policy & Compliance
      'policy_violation',
      'compliance_violation',
      'configuration_violation',
      'security_control_bypass',
      
      // Insider & Internal
      'insider_threat',
      'user_behavior_anomaly',
      'data_misuse',
      'unauthorized_software',
      
      // Infrastructure
      'vulnerability_exploitation',
      'system_misconfiguration',
      'patch_management_failure',
      
      // General & Status
      'security_incident',
      'suspicious_activity',
      'anomaly_detection',
      'unknown',
      'pending'
    ),
    defaultValue: 'pending',
    allowNull: false,
    field: 'security_event_type',
    comment: 'Classification of security event type for SOC analysis and incident response',
  },
  // AI-generated event tags for correlation and machine learning
  eventTags: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    field: 'event_tags',
    comment: 'AI-generated contextual tags for correlation and analysis',
  },
  tagsGeneratedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'tags_generated_at',
    comment: 'Timestamp when AI tags were last generated',
  },
  tagsConfidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'tags_confidence',
    validate: {
      min: 0,
      max: 100
    },
    comment: 'AI confidence score for generated tags (0-100)',
  },
  // Test data flag for cleanup and filtering
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/demo data for cleanup purposes',
  },
  // Human feedback fields for AI model fine-tuning
  humanReviewStatus: {
    type: DataTypes.ENUM('pending', 'reviewed', 'verified'),
    defaultValue: 'pending',
    field: 'human_review_status',
    comment: 'Status of human review for AI classification and analysis',
  },
  aiClassificationFeedback: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'ai_classification_feedback',
    comment: 'Human feedback on AI classification accuracy and corrections',
  },
  humanCorrectedClassification: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'human_corrected_classification',
    comment: 'Human-corrected security event type and tags when AI is wrong',
  },
  feedbackTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'feedback_timestamp',
    comment: 'Timestamp when human feedback was last provided',
  },
  reviewerUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewer_user_id',
    comment: 'ID of the user who provided the human feedback',
  },
  // Vector embedding for AI similarity searches
  embedding: {
    type: 'vector(384)',
    allowNull: true,
    comment: 'Vector embedding for RAG similarity search (384-dimensional)',
  },
  // AI Analysis fields
  aiAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'ai_analysis',
    comment: 'Structured AI analysis results for the alert',
  },
  aiAnalysisTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ai_analysis_timestamp',
    comment: 'Timestamp when AI analysis was last performed',
  },
  // MITRE ATT&CK Analysis fields
  mitreAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'mitre_analysis',
    comment: 'Structured MITRE ATT&CK analysis results for the alert',
  },
  mitreAnalysisTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'mitre_analysis_timestamp',
    comment: 'Timestamp when MITRE analysis was last performed',
  },
  // Resolve remarks field for manual and automatic resolutions
  resolveRemarks: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'resolve_remarks',
    comment: 'Structured resolve remarks including resolution type, source, timestamp, and detailed explanation',
  },
  // Incident confirmation details for verification and SOC manager assessment
  incidentConfirmationDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'incident_confirmation_details',
    comment: 'Structured incident verification criteria, assessment results, and confirmation artifacts for SOC managers',
  },
  // Generated playbook tracking fields
  generatedPlaybookIds: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    field: 'generated_playbook_ids',
    comment: 'Array of generated playbook IDs associated with this alert',
  },
  playbooksGeneratedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'playbooks_generated_at',
    comment: 'Timestamp when playbooks were last generated for this alert',
  },
  // Triage remarks field for SOC Manager notes and AI triage reasoning
  triageRemarks: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'triage_remarks',
    comment: 'Structured triage notes including AI confidence, incident likelihood assessment, and SOC manager notes',
  },
  triageTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'triage_timestamp',
    comment: 'Timestamp when triage status was last updated',
  },
}, {
  tableName: 'alerts',
  indexes: [
    {
      fields: ['severity', 'status'],
    },
    {
      fields: ['event_time'],
    },
    {
      fields: ['organization_id'],
    },
    {
      fields: ['asset_id'],
    },
    {
      fields: ['source_system'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['is_test_data'],
    },
    {
      fields: ['ai_analysis_timestamp'],
    },
    {
      fields: ['resolve_remarks'],
      using: 'gin',
    },
    {
      fields: ['status', 'resolve_remarks'],
    },
    {
      fields: ['incident_confirmation_details'],
      using: 'gin',
    },
    {
      fields: ['status', 'incident_confirmation_details'],
    },
    {
      fields: ['security_event_type'],
    },
    {
      fields: ['status', 'security_event_type'],
    },
    {
      fields: ['severity', 'security_event_type'],
    },
    {
      fields: ['event_tags'],
      using: 'gin',
    },
    {
      fields: ['tags_generated_at'],
    },
    {
      fields: ['organization_id', 'event_tags'],
      using: 'gin',
    },
    {
      fields: ['severity', 'event_tags'],
      using: 'gin',
    },
    {
      fields: ['triage_remarks'],
      using: 'gin',
    },
    {
      fields: ['triage_timestamp'],
    },
    {
      fields: ['status', 'triage_timestamp'],
    },
    {
      fields: ['human_review_status'],
    },
    {
      fields: ['feedback_timestamp'],
    },
    {
      fields: ['reviewer_user_id'],
    },
    {
      fields: ['human_review_status', 'feedback_timestamp'],
    },
    {
      fields: ['ai_classification_feedback'],
      using: 'gin',
    },
  ],
});

module.exports = Alert;