'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add AI mapping reasoning fields to ThreatHuntTTP table
    await queryInterface.addColumn('threat_hunt_ttps', 'ai_tool_calling_session_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Session ID linking to ai_tool_calling_log for AI mapping context'
    });

    await queryInterface.addColumn('threat_hunt_ttps', 'ai_mapping_reasoning', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'AI reasoning for why this technique was mapped to the threat hunt'
    });

    await queryInterface.addColumn('threat_hunt_ttps', 'ai_confidence_score', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      comment: 'AI confidence score for this technique mapping (0.00 to 1.00)'
    });

    await queryInterface.addColumn('threat_hunt_ttps', 'ai_reasoning_effort', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      allowNull: true,
      comment: 'Reasoning effort level used for AI mapping'
    });

    await queryInterface.addColumn('threat_hunt_ttps', 'ai_mapping_timestamp', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When AI mapping was performed'
    });

    await queryInterface.addColumn('threat_hunt_ttps', 'ai_mapping_validated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the AI mapping has been validated by a human'
    });

    await queryInterface.addColumn('threat_hunt_ttps', 'human_validation_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Human notes on AI mapping validation'
    });

    // Add indexes for AI mapping queries
    await queryInterface.addIndex('threat_hunt_ttps', ['ai_tool_calling_session_id'], {
      name: 'threat_hunt_ttps_ai_session_id_idx'
    });

    await queryInterface.addIndex('threat_hunt_ttps', ['ai_confidence_score'], {
      name: 'threat_hunt_ttps_ai_confidence_idx'
    });

    await queryInterface.addIndex('threat_hunt_ttps', ['ai_reasoning_effort'], {
      name: 'threat_hunt_ttps_ai_reasoning_effort_idx'
    });

    await queryInterface.addIndex('threat_hunt_ttps', ['ai_mapping_validated'], {
      name: 'threat_hunt_ttps_ai_validated_idx'
    });

    await queryInterface.addIndex('threat_hunt_ttps', ['ai_mapping_timestamp'], {
      name: 'threat_hunt_ttps_ai_mapping_timestamp_idx'
    });

    // Compound index for AI mapping analytics
    await queryInterface.addIndex('threat_hunt_ttps', ['threat_hunt_id', 'ai_mapping_validated'], {
      name: 'threat_hunt_ttps_hunt_ai_validated_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('threat_hunt_ttps', 'ai_tool_calling_session_id');
    await queryInterface.removeColumn('threat_hunt_ttps', 'ai_mapping_reasoning');
    await queryInterface.removeColumn('threat_hunt_ttps', 'ai_confidence_score');
    await queryInterface.removeColumn('threat_hunt_ttps', 'ai_reasoning_effort');
    await queryInterface.removeColumn('threat_hunt_ttps', 'ai_mapping_timestamp');
    await queryInterface.removeColumn('threat_hunt_ttps', 'ai_mapping_validated');
    await queryInterface.removeColumn('threat_hunt_ttps', 'human_validation_notes');
  }
};