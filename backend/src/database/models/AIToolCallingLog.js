const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIToolCallingLog = sequelize.define('AIToolCallingLog', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  
  // Session and User Context
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'session_id',
    comment: 'Unique session ID for grouping related tool calls'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },

  // AI Model Information
  modelName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'gpt-oss-120b',
    field: 'model_name',
    comment: 'Name of the AI model used'
  },
  reasoningEffort: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    field: 'reasoning_effort',
    comment: 'Reasoning effort level used by the AI'
  },

  // Request Context
  userPrompt: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'user_prompt',
    comment: 'Original user prompt that initiated the tool calling'
  },
  systemInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'system_instructions',
    comment: 'System instructions provided to the AI'
  },

  // Tool Calling Details
  toolName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'tool_name',
    comment: 'Name of the tool function called by AI'
  },
  toolParameters: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'tool_parameters',
    comment: 'Parameters passed to the tool function'
  },
  toolCallId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'tool_call_id',
    comment: 'Unique identifier for this specific tool call'
  },

  // AI Decision Process
  aiReasoning: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_reasoning',
    comment: 'AI reasoning for why this tool was selected and used'
  },
  decisionConfidence: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'decision_confidence',
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'AI confidence in the decision to use this tool (0.00 to 1.00)'
  },

  // Execution Results
  toolExecutionStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'tool_execution_start',
    comment: 'When tool execution started'
  },
  toolExecutionEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'tool_execution_end',
    comment: 'When tool execution completed'
  },
  toolExecutionDurationMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tool_execution_duration_ms',
    comment: 'Duration of tool execution in milliseconds'
  },
  toolResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'tool_response',
    comment: 'Response data returned by the tool function'
  },
  toolExecutionSuccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'tool_execution_success',
    comment: 'Whether the tool execution was successful'
  },
  toolExecutionError: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'tool_execution_error',
    comment: 'Error message if tool execution failed'
  },

  // Response Integration
  aiFinalResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_final_response',
    comment: 'Final AI response incorporating tool results'
  },
  responseUsesToolResult: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'response_uses_tool_result',
    comment: 'Whether AI final response used the tool result'
  },

  // Demo/Audit Fields
  isDemoSession: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_demo_session',
    comment: 'Flag to identify demo/hackathon sessions'
  },
  hackathonDemoTag: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'hackathon_demo_tag',
    comment: 'Tag for categorizing hackathon demo scenarios'
  },

  // Related Entity Links
  threatHuntId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'threat_hunt_id',
    references: {
      model: 'threat_hunts',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Link to threat hunt if tool calling was for hunt enhancement'
  },

  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ai_tool_calling_log',
  timestamps: true,
  indexes: [
    // Basic lookups
    {
      fields: ['session_id'],
      name: 'ai_tool_calling_log_session_id_idx'
    },
    {
      fields: ['user_id'],
      name: 'ai_tool_calling_log_user_id_idx'
    },
    {
      fields: ['organization_id'],
      name: 'ai_tool_calling_log_organization_id_idx'
    },
    {
      fields: ['tool_name'],
      name: 'ai_tool_calling_log_tool_name_idx'
    },
    
    // Demo and audit queries
    {
      fields: ['is_demo_session'],
      name: 'ai_tool_calling_log_is_demo_session_idx'
    },
    {
      fields: ['hackathon_demo_tag'],
      name: 'ai_tool_calling_log_hackathon_demo_tag_idx'
    },
    {
      fields: ['threat_hunt_id'],
      name: 'ai_tool_calling_log_threat_hunt_id_idx'
    },
    
    // Timeline queries
    {
      fields: ['created_at'],
      name: 'ai_tool_calling_log_created_at_idx'
    },
    {
      fields: ['tool_execution_start'],
      name: 'ai_tool_calling_log_tool_execution_start_idx'
    },
    
    // Compound indexes for common queries
    {
      fields: ['session_id', 'created_at'],
      name: 'ai_tool_calling_log_session_timeline_idx'
    },
    {
      fields: ['is_demo_session', 'hackathon_demo_tag'],
      name: 'ai_tool_calling_log_demo_tag_idx'
    },
    {
      fields: ['tool_name', 'tool_execution_success'],
      name: 'ai_tool_calling_log_tool_success_idx'
    },
    
    // JSONB indexes for advanced queries
    {
      using: 'gin',
      fields: ['tool_parameters'],
      name: 'ai_tool_calling_log_tool_parameters_gin_idx'
    },
    {
      using: 'gin',
      fields: ['tool_response'],
      name: 'ai_tool_calling_log_tool_response_gin_idx'
    }
  ],
  comment: 'Comprehensive logging for AI tool calling activities - essential for OpenAI Hackathon demonstration'
});

module.exports = AIToolCallingLog;