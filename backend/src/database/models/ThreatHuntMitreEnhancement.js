const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ThreatHuntMitreEnhancement = sequelize.define('ThreatHuntMitreEnhancement', {
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
    unique: true, // One enhancement per threat hunt
    references: {
      model: 'threat_hunts',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Reference to the threat hunt this enhancement belongs to',
  },
  
  // === TOOL CALLING METADATA ===
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'session_id',
    comment: 'Unique session ID for the MITRE enhancement process',
  },
  aiReasoningEffort: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'high',
    field: 'ai_reasoning_effort',
    comment: 'AI reasoning effort level used for enhancement',
  },
  confidenceScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.0,
    field: 'confidence_score',
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Overall confidence score for the enhancement (0.00 to 1.00)',
  },
  
  // === MAPPED TECHNIQUES ===
  mappedTechniques: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'mapped_techniques',
    comment: 'Array of mapped MITRE techniques with details',
  },
  
  // === STRUCTURED ANALYSIS ===
  analysisStructured: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'analysis_structured',
    comment: 'Structured analysis with parsed sections',
  },
  originalAnalysisText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'original_analysis_text',
    comment: 'Original AI-generated analysis text',
  },
  
  // === DETECTION STRATEGIES ===
  detectionStrategies: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'detection_strategies',
    comment: 'Array of detection strategies for mapped techniques',
  },
  
  // === TOOL CALLING SUMMARY ===
  toolCallingSummary: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'tool_calling_summary',
    comment: 'Summary of AI tool calling session',
  },
  
  // === PROCESSING METADATA ===
  processingTimeMs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'processing_time_ms',
    comment: 'Time taken for enhancement processing in milliseconds',
  },
  enhancementTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'enhancement_timestamp',
    defaultValue: DataTypes.NOW,
    comment: 'When the enhancement was completed',
  },
  
  // === VALIDATION TRACKING ===
  humanValidated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'human_validated',
    comment: 'Whether the enhancement has been validated by a human analyst',
  },
  validationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'validation_notes',
    comment: 'Human analyst notes on enhancement validation',
  },
  validatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'validated_by',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User who validated the enhancement',
  },
  validatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'validated_at',
    comment: 'When the enhancement was validated',
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
  tableName: 'threat_hunt_mitre_enhancements',
  timestamps: true,
  indexes: [
    // Primary relationship
    {
      fields: ['threat_hunt_id'],
      unique: true,
      name: 'threat_hunt_mitre_enhancements_hunt_id_unique'
    },
    {
      fields: ['organization_id'],
      name: 'threat_hunt_mitre_enhancements_organization_id_idx'
    },
    
    // Session tracking
    {
      fields: ['session_id'],
      name: 'threat_hunt_mitre_enhancements_session_id_idx'
    },
    
    // Timestamps and filtering
    {
      fields: ['enhancement_timestamp'],
      name: 'threat_hunt_mitre_enhancements_timestamp_idx'
    },
    {
      fields: ['human_validated'],
      name: 'threat_hunt_mitre_enhancements_validated_idx'
    },
    {
      fields: ['ai_reasoning_effort'],
      name: 'threat_hunt_mitre_enhancements_reasoning_effort_idx'
    },
    
    // JSONB indexes for efficient querying
    {
      using: 'gin',
      fields: ['mapped_techniques'],
      name: 'threat_hunt_mitre_enhancements_techniques_gin_idx'
    },
    {
      using: 'gin',
      fields: ['detection_strategies'],
      name: 'threat_hunt_mitre_enhancements_strategies_gin_idx'
    },
    {
      using: 'gin',
      fields: ['analysis_structured'],
      name: 'threat_hunt_mitre_enhancements_analysis_gin_idx'
    },
    {
      using: 'gin',
      fields: ['tool_calling_summary'],
      name: 'threat_hunt_mitre_enhancements_tool_summary_gin_idx'
    },
    
    // Compound indexes
    {
      fields: ['organization_id', 'enhancement_timestamp'],
      name: 'threat_hunt_mitre_enhancements_org_timestamp_idx'
    },
    {
      fields: ['threat_hunt_id', 'human_validated'],
      name: 'threat_hunt_mitre_enhancements_hunt_validated_idx'
    },
  ],
  comment: 'Stores complete MITRE ATT&CK enhancement data for threat hunts with AI tool calling results',
});

module.exports = ThreatHuntMitreEnhancement;