'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('info', 'warning', 'error', 'success'),
        defaultValue: 'info'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes (only if they don't exist)
    try {
      const indexes = await queryInterface.showIndex('notifications');
      const existingIndexNames = indexes.map(idx => idx.name);
      
      if (!existingIndexNames.includes('notifications_user_id')) {
        await queryInterface.addIndex('notifications', ['user_id']);
      }
      if (!existingIndexNames.includes('notifications_organization_id')) {
        await queryInterface.addIndex('notifications', ['organization_id']);
      }
      if (!existingIndexNames.includes('notifications_is_read')) {
        await queryInterface.addIndex('notifications', ['is_read']);
      }
      if (!existingIndexNames.includes('notifications_type')) {
        await queryInterface.addIndex('notifications', ['type']);
      }
      if (!existingIndexNames.includes('notifications_priority')) {
        await queryInterface.addIndex('notifications', ['priority']);
      }
      if (!existingIndexNames.includes('notifications_created_at')) {
        await queryInterface.addIndex('notifications', ['created_at']);
      }
    } catch (error) {
      console.log('Some indexes may already exist, skipping index creation errors');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};