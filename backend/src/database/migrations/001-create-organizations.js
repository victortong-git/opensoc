'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      subscription_plan: {
        type: Sequelize.ENUM('free', 'professional', 'enterprise'),
        defaultValue: 'free'
      },
      max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      max_alerts_per_month: {
        type: Sequelize.INTEGER,
        defaultValue: 1000
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Add indexes
    await queryInterface.addIndex('organizations', ['domain']);
    await queryInterface.addIndex('organizations', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organizations');
  }
};