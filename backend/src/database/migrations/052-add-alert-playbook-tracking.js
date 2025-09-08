'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add playbook tracking fields to alerts table
    await queryInterface.addColumn('alerts', 'generated_playbook_ids', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
      comment: 'Array of generated playbook IDs associated with this alert'
    });

    await queryInterface.addColumn('alerts', 'playbooks_generated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when playbooks were last generated for this alert'
    });

    // Add indexes for efficient queries
    await queryInterface.addIndex('alerts', ['playbooks_generated_at'], {
      name: 'idx_alerts_playbooks_generated_at'
    });

    // GIN index for JSONB array queries
    await queryInterface.addIndex('alerts', ['generated_playbook_ids'], {
      name: 'idx_alerts_generated_playbook_ids',
      using: 'gin'
    });

    // Composite index for organization + playbook generation queries
    await queryInterface.addIndex('alerts', ['organization_id', 'playbooks_generated_at'], {
      name: 'idx_alerts_org_playbooks_generated'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('alerts', 'idx_alerts_org_playbooks_generated');
    await queryInterface.removeIndex('alerts', 'idx_alerts_generated_playbook_ids');
    await queryInterface.removeIndex('alerts', 'idx_alerts_playbooks_generated_at');

    // Remove columns
    await queryInterface.removeColumn('alerts', 'playbooks_generated_at');
    await queryInterface.removeColumn('alerts', 'generated_playbook_ids');
  }
};