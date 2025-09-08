const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id'
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ragEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'rag_enabled'
    },
    ragContext: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'rag_context'
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Messages don't get updated
    hooks: {
      afterCreate: async (message, options) => {
        // Update conversation message count and last activity
        const conversation = await sequelize.models.ChatConversation.findByPk(
          message.conversationId,
          { transaction: options.transaction }
        );
        
        if (conversation) {
          await conversation.increment('messageCount', { 
            transaction: options.transaction 
          });
          await conversation.update({
            lastActivity: new Date()
          }, { 
            transaction: options.transaction 
          });
        }
      }
    }
  });


  // Instance methods
  ChatMessage.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    return {
      id: values.id,
      conversationId: values.conversationId,
      role: values.role,
      content: values.content,
      timestamp: values.timestamp,
      ragEnabled: values.ragEnabled,
      ragContext: values.ragContext,
      createdAt: values.createdAt || values.created_at
    };
  };

  // Static methods
  ChatMessage.getRecentByConversation = async function(conversationId, limit = 5) {
    return this.findAll({
      where: { conversationId },
      order: [['timestamp', 'DESC']],
      limit,
      raw: true
    });
  };

  ChatMessage.getSessionMemory = async function(conversationId, limit = 5) {
    const messages = await this.findAll({
      where: { conversationId },
      order: [['timestamp', 'DESC']],
      limit,
      raw: true
    });
    
    // Return in chronological order for context
    return messages.reverse();
  };

  ChatMessage.createBulk = async function(messages, transaction) {
    const results = [];
    
    for (const messageData of messages) {
      const message = await this.create(messageData, { transaction });
      results.push(message);
    }
    
    return results;
  };

  ChatMessage.deleteOlderThan = async function(conversationId, keepCount = 100) {
    // Keep only the most recent messages for performance
    const messagesToKeep = await this.findAll({
      where: { conversationId },
      order: [['timestamp', 'DESC']],
      limit: keepCount,
      attributes: ['id']
    });
    
    if (messagesToKeep.length === keepCount) {
      const idsToKeep = messagesToKeep.map(m => m.id);
      
      await this.destroy({
        where: {
          conversationId,
          id: { [sequelize.Sequelize.Op.notIn]: idsToKeep }
        }
      });
    }
  };

module.exports = ChatMessage;