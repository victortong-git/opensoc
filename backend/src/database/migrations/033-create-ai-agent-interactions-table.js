'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_agent_interactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      agent_log_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ai_agent_logs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'References the AI agent activity being interacted with',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who made the interaction',
      },
      interaction_type: {
        type: Sequelize.ENUM('like', 'comment'),
        allowNull: false,
        comment: 'Type of interaction - like or comment',
      },
      comment_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Comment content for comment interactions',
      },
      parent_comment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'ai_agent_interactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'For threaded comments - references parent comment',
      },
      mentioned_users: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: true,
        defaultValue: [],
        comment: 'Array of user IDs mentioned in the comment (@mentions)',
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the comment has been edited',
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when comment was last edited',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('ai_agent_interactions', ['agent_log_id']);
    await queryInterface.addIndex('ai_agent_interactions', ['user_id']);
    await queryInterface.addIndex('ai_agent_interactions', ['interaction_type']);
    await queryInterface.addIndex('ai_agent_interactions', ['created_at']);
    await queryInterface.addIndex('ai_agent_interactions', ['parent_comment_id']);
    await queryInterface.addIndex('ai_agent_interactions', ['agent_log_id', 'interaction_type']);
    await queryInterface.addIndex('ai_agent_interactions', ['agent_log_id', 'created_at']);

    // Create unique constraint to prevent duplicate likes from same user on same activity
    await queryInterface.addConstraint('ai_agent_interactions', {
      fields: ['agent_log_id', 'user_id', 'interaction_type'],
      type: 'unique',
      name: 'unique_user_like_per_activity',
      where: {
        interaction_type: 'like'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_agent_interactions');
  }
};