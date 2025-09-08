'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add social media style profile fields to ai_agents table
    await queryInterface.addColumn('ai_agents', 'profile_image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL to agent avatar/profile image',
    });

    await queryInterface.addColumn('ai_agents', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Agent biography/description for social profile',
    });

    await queryInterface.addColumn('ai_agents', 'specialties', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of agent specializations/skills',
    });

    await queryInterface.addColumn('ai_agents', 'social_metrics', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Social engagement metrics (likes, comments, activity counts)',
    });

    await queryInterface.addColumn('ai_agents', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the agent is actively being used',
    });

    await queryInterface.addColumn('ai_agents', 'first_activity_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of first recorded activity',
    });

    await queryInterface.addColumn('ai_agents', 'last_interaction_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last human interaction (like/comment)',
    });

    await queryInterface.addColumn('ai_agents', 'total_activities', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of activities performed',
    });

    await queryInterface.addColumn('ai_agents', 'total_likes_received', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total likes received across all activities',
    });

    await queryInterface.addColumn('ai_agents', 'total_comments_received', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total comments received across all activities',
    });

    await queryInterface.addColumn('ai_agents', 'avg_execution_time_ms', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Average execution time across all activities',
    });

    await queryInterface.addColumn('ai_agents', 'success_rate_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Success rate percentage (0-100)',
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('ai_agents', ['is_active']);
    await queryInterface.addIndex('ai_agents', ['total_activities']);
    await queryInterface.addIndex('ai_agents', ['total_likes_received']);
    await queryInterface.addIndex('ai_agents', ['success_rate_percentage']);
    await queryInterface.addIndex('ai_agents', ['last_interaction_at']);
    await queryInterface.addIndex('ai_agents', ['organization_id', 'is_active']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('ai_agents', ['is_active']);
    await queryInterface.removeIndex('ai_agents', ['total_activities']);
    await queryInterface.removeIndex('ai_agents', ['total_likes_received']);
    await queryInterface.removeIndex('ai_agents', ['success_rate_percentage']);
    await queryInterface.removeIndex('ai_agents', ['last_interaction_at']);
    await queryInterface.removeIndex('ai_agents', ['organization_id', 'is_active']);

    // Remove columns
    await queryInterface.removeColumn('ai_agents', 'profile_image_url');
    await queryInterface.removeColumn('ai_agents', 'bio');
    await queryInterface.removeColumn('ai_agents', 'specialties');
    await queryInterface.removeColumn('ai_agents', 'social_metrics');
    await queryInterface.removeColumn('ai_agents', 'is_active');
    await queryInterface.removeColumn('ai_agents', 'first_activity_at');
    await queryInterface.removeColumn('ai_agents', 'last_interaction_at');
    await queryInterface.removeColumn('ai_agents', 'total_activities');
    await queryInterface.removeColumn('ai_agents', 'total_likes_received');
    await queryInterface.removeColumn('ai_agents', 'total_comments_received');
    await queryInterface.removeColumn('ai_agents', 'avg_execution_time_ms');
    await queryInterface.removeColumn('ai_agents', 'success_rate_percentage');
  }
};