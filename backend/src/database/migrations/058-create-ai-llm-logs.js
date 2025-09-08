'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_llm_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'organization_id'
      },
      providerId: {
        type: Sequelize.UUID,
        allowNull: true, // Can be null if provider is deleted later
        references: {
          model: 'ai_providers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'provider_id'
      },
      providerName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Provider name from ai_providers.name at time of request'
      },
      providerType: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Provider type (ollama, vllm, etc.)'
      },
      providerUrl: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Full endpoint URL used for the request'
      },
      modelName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'AI model name used for generation'
      },
      maxTokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum tokens requested for output'
      },
      tokenWindow: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Context window size of the model'
      },
      temperature: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Sampling temperature used'
      },
      requestTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When the actual AI request was initiated'
      },
      responseTimestamp: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the actual AI response was received'
      },
      durationMs: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total request duration in milliseconds'
      },
      inputTokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated or actual input token count'
      },
      outputTokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated or actual output token count'
      },
      rawPrompt: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Exact prompt sent to the AI provider'
      },
      rawResponse: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Exact response received from AI provider'
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True only if actual AI response was received'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Actual error message from AI provider'
      },
      httpStatusCode: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'HTTP status code from provider response'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'user_id'
      },
      contextType: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Type of operation (chat, incident_draft, alert_analysis, etc.)'
      },
      contextId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (conversation_id, incident_id, etc.)'
      },
      requestHeaders: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'HTTP headers sent to AI provider'
      },
      responseHeaders: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'HTTP headers received from AI provider'
      },
      providerMetadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Provider-specific metadata (eval_count, timing data, etc.)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for common query patterns
    await queryInterface.addIndex('ai_llm_logs', ['organization_id']);
    await queryInterface.addIndex('ai_llm_logs', ['provider_id']);
    await queryInterface.addIndex('ai_llm_logs', ['provider_name']);
    await queryInterface.addIndex('ai_llm_logs', ['success']);
    await queryInterface.addIndex('ai_llm_logs', ['request_timestamp']);
    await queryInterface.addIndex('ai_llm_logs', ['user_id']);
    await queryInterface.addIndex('ai_llm_logs', ['context_type']);
    await queryInterface.addIndex('ai_llm_logs', ['created_at']);
    
    // Composite index for common filtering scenarios
    await queryInterface.addIndex('ai_llm_logs', ['organization_id', 'success', 'request_timestamp']);
    await queryInterface.addIndex('ai_llm_logs', ['organization_id', 'provider_name', 'request_timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_llm_logs');
  }
};