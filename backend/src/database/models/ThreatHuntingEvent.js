const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ThreatHunt = sequelize.define('ThreatHunt', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  
  // === CORE IDENTIFICATION ===
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255],
    },
    comment: 'Descriptive name of the threat hunt',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 10000],
    },
    comment: 'Comprehensive description including business justification and context',
  },
  
  // === HUNT CLASSIFICATION ===
  huntType: {
    type: DataTypes.ENUM(
      'proactive_exploration',      // Open-ended threat discovery
      'hypothesis_driven',          // Specific threat hypothesis testing
      'intel_driven',              // Based on threat intelligence feeds  
      'behavioral_analysis',       // User/system behavior anomaly hunting
      'infrastructure_hunt',       // Network and system-focused hunting
      'campaign_tracking',         // APT campaign identification
      'threat_reaction',          // Response to specific threat indicators
      'compliance_hunt',          // Regulatory compliance verification
      'red_team_verification',    // Validate detection capabilities
      'threat_landscape'          // Industry/sector-specific threats
    ),
    allowNull: false,
    defaultValue: 'proactive_exploration',
    field: 'hunt_type',
    comment: 'Professional threat hunting methodology type',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Business priority level for resource allocation',
  },
  status: {
    type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    allowNull: false,
    defaultValue: 'planned',
    comment: 'Current execution status',
  },
  
  // === HUNT DEFINITION ===
  hypothesis: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Testable threat hypothesis or research question',
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Scope of the hunting activity - what assets/systems to investigate',
  },
  targetSystems: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'target_systems',
    comment: 'Target systems, networks, or assets in scope',
  },
  timeframe: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Expected time window for hunt execution (e.g., "2-4 hours", "1 week")',
  },
  
  // === PROFESSIONAL METHODOLOGY ===
  methodology: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed hunting methodology and approach documentation',
  },
  successCriteria: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'success_criteria',
    comment: 'Measurable criteria defining successful hunt completion',
  },
  businessJustification: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'business_justification',
    comment: 'Business rationale and risk-based justification for the hunt',
  },
  
  // === RESULTS & FINDINGS ===
  findings: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Key findings, discoveries, and threat indicators',
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Actionable recommendations with business impact assessment',
  },
  evidence: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Evidence collection and forensic artifacts documented',
  },
  lessonsLearned: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'lessons_learned',
    comment: 'Lessons learned for future hunt improvement',
  },
  
  // === ASSIGNMENT & TRACKING ===
  hunterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'hunter_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Primary threat hunter responsible for this hunt',
  },
  assignedAnalysts: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'assigned_analysts',
    comment: 'Additional analysts assigned to support the hunt',
  },
  
  // === TIMING ===
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'start_date',
    comment: 'Hunt execution start date',
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_date',
    comment: 'Hunt completion date',
  },
  
  // === THREAT INTELLIGENCE CONTEXT ===
  sourceIntelType: {
    type: DataTypes.ENUM('ioc', 'threat_actor', 'campaign', 'manual', 'scheduled'),
    allowNull: true,
    field: 'source_intel_type',
    comment: 'Type of threat intelligence that initiated this hunt',
  },
  sourceIntelId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'source_intel_id',
    comment: 'ID of the source threat intelligence record',
  },
  sourceIntelContext: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'source_intel_context',
    comment: 'Contextual information from the triggering threat intelligence',
  },
  
  // === AI ENHANCEMENT TRACKING ===
  aiEnhanced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ai_enhanced',
    comment: 'Whether this hunt has been enhanced with AI assistance',
  },
  aiEnhancementSections: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'ai_enhancement_sections',
    comment: 'Which sections have been enhanced by AI',
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
  isTestData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_test_data',
    comment: 'Flag to identify test/demonstration data',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Tags for categorization and filtering',
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
  tableName: 'threat_hunts',
  timestamps: true,
  indexes: [
    // Core organizational indexes
    {
      fields: ['organization_id'],
      name: 'threat_hunts_organization_id_idx'
    },
    {
      fields: ['hunter_id'],
      name: 'threat_hunts_hunter_id_idx'
    },
    
    // Status and priority filtering
    {
      fields: ['status'],
      name: 'threat_hunts_status_idx'
    },
    {
      fields: ['priority'],
      name: 'threat_hunts_priority_idx'
    },
    {
      fields: ['hunt_type'],
      name: 'threat_hunts_hunt_type_idx'
    },
    
    // Time-based queries
    {
      fields: ['start_date'],
      name: 'threat_hunts_start_date_idx'
    },
    {
      fields: ['end_date'], 
      name: 'threat_hunts_end_date_idx'
    },
    {
      fields: ['created_at'],
      name: 'threat_hunts_created_at_idx'
    },
    
    // Threat intel integration
    {
      fields: ['source_intel_type', 'source_intel_id'],
      name: 'threat_hunts_source_intel_idx'
    },
    
    // AI enhancement tracking
    {
      fields: ['ai_enhanced'],
      name: 'threat_hunts_ai_enhanced_idx'
    },
    
    // Array field indexes
    {
      using: 'gin',
      fields: ['assigned_analysts'],
      name: 'threat_hunts_assigned_analysts_gin_idx'
    },
    {
      using: 'gin',
      fields: ['tags'],
      name: 'threat_hunts_tags_gin_idx'
    },
    {
      using: 'gin',
      fields: ['ai_enhancement_sections'],
      name: 'threat_hunts_ai_enhancement_sections_gin_idx'
    },
    
    // JSONB indexes
    {
      using: 'gin',
      fields: ['source_intel_context'],
      name: 'threat_hunts_source_intel_context_gin_idx'
    },
    
    // Compound indexes for common queries
    {
      fields: ['organization_id', 'status', 'hunt_type'],
      name: 'threat_hunts_org_status_type_idx'
    },
    {
      fields: ['organization_id', 'hunter_id', 'status'],
      name: 'threat_hunts_org_hunter_status_idx'
    },
  ],
  comment: 'Simplified professional threat hunting system with comprehensive methodology support',
});

module.exports = ThreatHunt;