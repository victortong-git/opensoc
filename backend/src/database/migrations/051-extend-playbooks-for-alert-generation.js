'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add alert-specific fields to playbooks table
    await queryInterface.addColumn('playbooks', 'source_alert_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'alerts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Source alert ID if this playbook was generated from an alert'
    });

    await queryInterface.addColumn('playbooks', 'playbook_type', {
      type: Sequelize.ENUM('general', 'immediate_action', 'investigation'),
      defaultValue: 'general',
      allowNull: false,
      comment: 'Type of playbook: general, immediate_action, or investigation'
    });

    await queryInterface.addColumn('playbooks', 'ai_generated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Flag indicating if this playbook was AI-generated'
    });

    // Add indexes for efficient queries
    await queryInterface.addIndex('playbooks', ['source_alert_id'], {
      name: 'idx_playbooks_source_alert'
    });

    await queryInterface.addIndex('playbooks', ['playbook_type'], {
      name: 'idx_playbooks_type'
    });

    await queryInterface.addIndex('playbooks', ['ai_generated'], {
      name: 'idx_playbooks_ai_generated'
    });

    await queryInterface.addIndex('playbooks', ['source_alert_id', 'playbook_type'], {
      name: 'idx_playbooks_source_alert_type'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('playbooks', 'idx_playbooks_source_alert_type');
    await queryInterface.removeIndex('playbooks', 'idx_playbooks_ai_generated');
    await queryInterface.removeIndex('playbooks', 'idx_playbooks_type');
    await queryInterface.removeIndex('playbooks', 'idx_playbooks_source_alert');

    // Remove columns
    await queryInterface.removeColumn('playbooks', 'ai_generated');
    await queryInterface.removeColumn('playbooks', 'playbook_type');
    await queryInterface.removeColumn('playbooks', 'source_alert_id');

    // Remove ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_playbooks_playbook_type";');
  }
};