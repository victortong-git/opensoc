'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM types
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reasoning_effort_enum') THEN
          CREATE TYPE reasoning_effort_enum AS ENUM ('low', 'medium', 'high');
        END IF;
      END $$;
    `);

    await queryInterface.createTable('ai_tool_calling_log', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      
      // Session and User Context
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Unique session ID for grouping related tool calls'
      },
      user_id: {
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
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // AI Model Information
      model_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'gpt-oss-120b',
        comment: 'Name of the AI model used'
      },
      reasoning_effort: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        comment: 'Reasoning effort level used by the AI'
      },

      // Request Context
      user_prompt: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Original user prompt that initiated the tool calling'
      },
      system_instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'System instructions provided to the AI'
      },

      // Tool Calling Details
      tool_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the tool function called by AI'
      },
      tool_parameters: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Parameters passed to the tool function'
      },
      tool_call_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Unique identifier for this specific tool call'
      },

      // AI Decision Process
      ai_reasoning: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'AI reasoning for why this tool was selected and used'
      },
      decision_confidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'AI confidence in the decision to use this tool (0.00 to 1.00)'
      },

      // Execution Results
      tool_execution_start: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When tool execution started'
      },
      tool_execution_end: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When tool execution completed'
      },
      tool_execution_duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration of tool execution in milliseconds'
      },
      tool_response: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Response data returned by the tool function'
      },
      tool_execution_success: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the tool execution was successful'
      },
      tool_execution_error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if tool execution failed'
      },

      // Response Integration
      ai_final_response: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Final AI response incorporating tool results'
      },
      response_uses_tool_result: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether AI final response used the tool result'
      },

      // Demo/Audit Fields
      is_demo_session: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Flag to identify demo/hackathon sessions'
      },
      hackathon_demo_tag: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Tag for categorizing hackathon demo scenarios'
      },

      // Related Entity Links
      threat_hunt_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'threat_hunts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Link to threat hunt if tool calling was for hunt enhancement'
      },

      // Timestamps
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

    // Create indexes for performance and demo queries
    await queryInterface.addIndex('ai_tool_calling_log', ['session_id'], {
      name: 'ai_tool_calling_log_session_id_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['user_id'], {
      name: 'ai_tool_calling_log_user_id_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['organization_id'], {
      name: 'ai_tool_calling_log_organization_id_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['tool_name'], {
      name: 'ai_tool_calling_log_tool_name_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['is_demo_session'], {
      name: 'ai_tool_calling_log_is_demo_session_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['hackathon_demo_tag'], {
      name: 'ai_tool_calling_log_hackathon_demo_tag_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['threat_hunt_id'], {
      name: 'ai_tool_calling_log_threat_hunt_id_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['created_at'], {
      name: 'ai_tool_calling_log_created_at_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['tool_execution_start'], {
      name: 'ai_tool_calling_log_tool_execution_start_idx'
    });

    // Compound indexes for common demo queries
    await queryInterface.addIndex('ai_tool_calling_log', ['session_id', 'created_at'], {
      name: 'ai_tool_calling_log_session_timeline_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['is_demo_session', 'hackathon_demo_tag'], {
      name: 'ai_tool_calling_log_demo_tag_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['tool_name', 'tool_execution_success'], {
      name: 'ai_tool_calling_log_tool_success_idx'
    });

    // JSONB indexes for tool parameters and responses
    await queryInterface.addIndex('ai_tool_calling_log', ['tool_parameters'], {
      using: 'gin',
      name: 'ai_tool_calling_log_tool_parameters_gin_idx'
    });

    await queryInterface.addIndex('ai_tool_calling_log', ['tool_response'], {
      using: 'gin',
      name: 'ai_tool_calling_log_tool_response_gin_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ai_tool_calling_log');
    
    // Drop ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS reasoning_effort_enum;');
  }
};