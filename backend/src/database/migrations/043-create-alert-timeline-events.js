'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create alert_timeline_events table
    await queryInterface.createTable('alert_timeline_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('alert_created', 'ai_analysis_completed', 'ai_auto_resolved', 'status_change', 'user_action', 'note'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      user_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      alert_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'alerts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      ai_source: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'AI system that performed the action (e.g., SOC_ANALYST_AGENT)',
      },
      ai_confidence: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'AI confidence level (0-100) for AI-generated events',
        validate: {
          min: 0,
          max: 100,
        },
      },
      is_test_data: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Flag to identify test/demo data for cleanup purposes',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for optimal performance
    await queryInterface.addIndex('alert_timeline_events', ['alert_id', 'timestamp']);
    await queryInterface.addIndex('alert_timeline_events', ['type']);
    await queryInterface.addIndex('alert_timeline_events', ['user_id']);
    await queryInterface.addIndex('alert_timeline_events', ['ai_source']);
    await queryInterface.addIndex('alert_timeline_events', ['is_test_data']);
    await queryInterface.addIndex('alert_timeline_events', ['timestamp']);
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('alert_timeline_events', ['alert_id', 'timestamp']);
    await queryInterface.removeIndex('alert_timeline_events', ['type']);
    await queryInterface.removeIndex('alert_timeline_events', ['user_id']);
    await queryInterface.removeIndex('alert_timeline_events', ['ai_source']);
    await queryInterface.removeIndex('alert_timeline_events', ['is_test_data']);
    await queryInterface.removeIndex('alert_timeline_events', ['timestamp']);

    // Drop the table
    await queryInterface.dropTable('alert_timeline_events');

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_alert_timeline_events_type";');
  }
};