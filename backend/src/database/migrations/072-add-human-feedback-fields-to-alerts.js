'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add human feedback fields for AI model fine-tuning
    await queryInterface.addColumn('alerts', 'human_review_status', {
      type: Sequelize.ENUM('pending', 'reviewed', 'verified'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Status of human review for AI classification and analysis',
    });

    await queryInterface.addColumn('alerts', 'ai_classification_feedback', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Human feedback on AI classification accuracy and corrections',
    });

    await queryInterface.addColumn('alerts', 'human_corrected_classification', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Human-corrected security event type and tags when AI is wrong',
    });

    await queryInterface.addColumn('alerts', 'feedback_timestamp', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when human feedback was last provided',
    });

    await queryInterface.addColumn('alerts', 'reviewer_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'ID of the user who provided the human feedback',
    });

    // Add indexes for efficient querying
    await queryInterface.addIndex('alerts', ['human_review_status'], {
      name: 'idx_alerts_human_review_status'
    });

    await queryInterface.addIndex('alerts', ['feedback_timestamp'], {
      name: 'idx_alerts_feedback_timestamp'
    });

    await queryInterface.addIndex('alerts', ['reviewer_user_id'], {
      name: 'idx_alerts_reviewer_user_id'
    });

    await queryInterface.addIndex('alerts', ['human_review_status', 'feedback_timestamp'], {
      name: 'idx_alerts_human_review_feedback_time'
    });

    // GIN index for JSONB feedback data
    await queryInterface.addIndex('alerts', ['ai_classification_feedback'], {
      using: 'gin',
      name: 'idx_alerts_ai_classification_feedback_gin'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('alerts', 'idx_alerts_ai_classification_feedback_gin');
    await queryInterface.removeIndex('alerts', 'idx_alerts_human_review_feedback_time');
    await queryInterface.removeIndex('alerts', 'idx_alerts_reviewer_user_id');
    await queryInterface.removeIndex('alerts', 'idx_alerts_feedback_timestamp');
    await queryInterface.removeIndex('alerts', 'idx_alerts_human_review_status');

    // Remove columns
    await queryInterface.removeColumn('alerts', 'reviewer_user_id');
    await queryInterface.removeColumn('alerts', 'feedback_timestamp');
    await queryInterface.removeColumn('alerts', 'human_corrected_classification');
    await queryInterface.removeColumn('alerts', 'ai_classification_feedback');
    await queryInterface.removeColumn('alerts', 'human_review_status');

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_alerts_human_review_status";');
  }
};