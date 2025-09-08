'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add AI provider information fields to ai_generation_logs table
    await queryInterface.addColumn('ai_generation_logs', 'ai_provider', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'AI service provider (e.g., Ollama, OpenAI, Azure)',
      field: 'ai_provider'
    });

    await queryInterface.addColumn('ai_generation_logs', 'ai_endpoint', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'AI service endpoint URL',
      field: 'ai_endpoint'
    });

    await queryInterface.addColumn('ai_generation_logs', 'model_version', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Detailed model version information',
      field: 'model_version'
    });

    await queryInterface.addColumn('ai_generation_logs', 'provider_metadata', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Additional provider-specific metadata',
      field: 'provider_metadata'
    });

    // Add index for AI provider for better query performance
    await queryInterface.addIndex('ai_generation_logs', ['ai_provider']);
  },

  async down(queryInterface, Sequelize) {
    // Remove the indexes first
    await queryInterface.removeIndex('ai_generation_logs', ['ai_provider']);
    
    // Remove the columns
    await queryInterface.removeColumn('ai_generation_logs', 'provider_metadata');
    await queryInterface.removeColumn('ai_generation_logs', 'model_version');
    await queryInterface.removeColumn('ai_generation_logs', 'ai_endpoint');
    await queryInterface.removeColumn('ai_generation_logs', 'ai_provider');
  }
};