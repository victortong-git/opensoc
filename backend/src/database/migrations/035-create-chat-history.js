const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create chat_conversations table
    await queryInterface.createTable('chat_conversations', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      last_activity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          ragEnabled: true,
          dataSources: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
          model: 'default'
        }
      },
      is_archived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      message_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });

    // Create chat_messages table
    await queryInterface.createTable('chat_messages', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'chat_conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      rag_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      rag_context: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('chat_conversations', ['user_id']);
    await queryInterface.addIndex('chat_conversations', ['organization_id']);
    await queryInterface.addIndex('chat_conversations', ['last_activity']);
    await queryInterface.addIndex('chat_conversations', ['is_archived']);
    
    await queryInterface.addIndex('chat_messages', ['conversation_id']);
    await queryInterface.addIndex('chat_messages', ['timestamp']);
    await queryInterface.addIndex('chat_messages', ['role']);

    // Add composite index for efficient queries
    await queryInterface.addIndex('chat_conversations', ['user_id', 'organization_id', 'is_archived'], {
      name: 'chat_conversations_user_org_archived_idx'
    });
    
    await queryInterface.addIndex('chat_messages', ['conversation_id', 'timestamp'], {
      name: 'chat_messages_conversation_timestamp_idx'
    });

    console.log('✅ Chat history tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop indexes first
    await queryInterface.removeIndex('chat_messages', 'chat_messages_conversation_timestamp_idx');
    await queryInterface.removeIndex('chat_conversations', 'chat_conversations_user_org_archived_idx');
    
    // Drop tables
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('chat_conversations');
    
    console.log('✅ Chat history tables dropped successfully');
  }
};