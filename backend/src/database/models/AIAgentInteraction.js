const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIAgentInteraction = sequelize.define('AIAgentInteraction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  agentLogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'agent_log_id',
    comment: 'References the AI agent activity being interacted with',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'User who made the interaction',
  },
  interactionType: {
    type: DataTypes.ENUM('like', 'comment'),
    allowNull: false,
    field: 'interaction_type',
    comment: 'Type of interaction - like or comment',
  },
  commentText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'comment_text',
    comment: 'Comment content for comment interactions',
  },
  parentCommentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_comment_id',
    comment: 'For threaded comments - references parent comment',
  },
  mentionedUsers: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: [],
    field: 'mentioned_users',
    comment: 'Array of user IDs mentioned in the comment (@mentions)',
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_edited',
    comment: 'Whether the comment has been edited',
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at',
    comment: 'Timestamp when comment was last edited',
  },
}, {
  tableName: 'ai_agent_interactions',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['agent_log_id'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['interaction_type'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['parent_comment_id'],
    },
    {
      fields: ['agent_log_id', 'interaction_type'],
    },
    {
      fields: ['agent_log_id', 'created_at'],
    },
  ],
});

// Define associations
AIAgentInteraction.associate = (models) => {
  AIAgentInteraction.belongsTo(models.AIAgentLog, {
    foreignKey: 'agentLogId',
    as: 'agentLog',
  });
  
  AIAgentInteraction.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  // Self-referencing association for threaded comments
  AIAgentInteraction.belongsTo(AIAgentInteraction, {
    foreignKey: 'parentCommentId',
    as: 'parentComment',
  });
  
  AIAgentInteraction.hasMany(AIAgentInteraction, {
    foreignKey: 'parentCommentId',
    as: 'replies',
  });
  
  // Association to mentioned users
  AIAgentInteraction.belongsToMany(models.User, {
    through: 'ai_agent_interaction_mentions',
    foreignKey: 'interactionId',
    otherKey: 'userId',
    as: 'mentionedUserObjects',
  });
};

module.exports = AIAgentInteraction;