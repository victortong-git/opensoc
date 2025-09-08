'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_providers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Display name of the AI provider',
      },
      type: {
        type: Sequelize.ENUM('ollama', 'vllm'),
        allowNull: false,
        comment: 'Type of AI provider (ollama or vllm)',
      },
      host: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'localhost',
        comment: 'Hostname or IP address of the AI provider',
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Port number for the AI provider connection',
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this provider is enabled',
        field: 'is_enabled',
      },
      is_connected: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Current connection status',
        field: 'is_connected',
      },
      last_health_check: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last health check',
        field: 'last_health_check',
      },
      response_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Last recorded response time in milliseconds',
        field: 'response_time',
      },
      available_models: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of available AI models',
        field: 'available_models',
      },
      selected_model: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Currently selected AI model',
        field: 'selected_model',
      },
      max_tokens: {
        type: Sequelize.INTEGER,
        defaultValue: 4096,
        allowNull: false,
        comment: 'Maximum tokens per request',
        field: 'max_tokens',
      },
      max_token_window: {
        type: Sequelize.INTEGER,
        defaultValue: 8192,
        allowNull: false,
        comment: 'Maximum token context window',
        field: 'max_token_window',
      },
      temperature: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.7,
        allowNull: false,
        comment: 'Temperature setting for model creativity (0.0-1.0)',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the AI provider configuration',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Organization that owns this provider configuration',
        field: 'organization_id',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at',
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at',
      },
    });

    // Add indexes
    await queryInterface.addIndex('ai_providers', ['organization_id']);
    await queryInterface.addIndex('ai_providers', ['type']);
    await queryInterface.addIndex('ai_providers', ['is_enabled']);
    await queryInterface.addIndex('ai_providers', ['organization_id', 'is_enabled']);

    // Add constraint to ensure only one active provider per organization
    await queryInterface.addConstraint('ai_providers', {
      fields: ['organization_id'],
      type: 'check',
      name: 'ai_providers_valid_port_check',
      where: {
        port: {
          [Sequelize.Op.between]: [1, 65535]
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove constraint
    await queryInterface.removeConstraint('ai_providers', 'ai_providers_valid_port_check');
    
    // Remove indexes
    await queryInterface.removeIndex('ai_providers', ['organization_id', 'is_enabled']);
    await queryInterface.removeIndex('ai_providers', ['is_enabled']);
    await queryInterface.removeIndex('ai_providers', ['type']);
    await queryInterface.removeIndex('ai_providers', ['organization_id']);
    
    // Drop table
    await queryInterface.dropTable('ai_providers');
  }
};