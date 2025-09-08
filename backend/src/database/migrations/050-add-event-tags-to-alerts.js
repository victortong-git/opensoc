'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add event_tags JSONB field for storing AI-generated tags
    await queryInterface.addColumn('alerts', 'event_tags', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
      comment: 'AI-generated contextual tags for correlation and analysis'
    });

    // Add timestamp for when tags were generated
    await queryInterface.addColumn('alerts', 'tags_generated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when AI tags were last generated'
    });

    // Add confidence score for tag generation
    await queryInterface.addColumn('alerts', 'tags_confidence', {
      type: Sequelize.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'AI confidence score for generated tags (0-100)'
    });

    // Add GIN index for JSONB tag searches (PostgreSQL specific)
    await queryInterface.addIndex('alerts', ['event_tags'], {
      using: 'GIN',
      name: 'alerts_event_tags_gin_idx'
    });
    
    // Add index for tags_generated_at for filtering recently tagged alerts
    await queryInterface.addIndex('alerts', ['tags_generated_at']);
    
    // Add separate index for organization_id and event_tags (can't combine UUID with GIN)
    await queryInterface.addIndex('alerts', ['organization_id']);
    
    // Add separate index for severity and event_tags  
    await queryInterface.addIndex('alerts', ['severity']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('alerts', 'alerts_event_tags_gin_idx');
    await queryInterface.removeIndex('alerts', ['tags_generated_at']);
    await queryInterface.removeIndex('alerts', ['organization_id']);
    await queryInterface.removeIndex('alerts', ['severity']);
    
    // Remove columns
    await queryInterface.removeColumn('alerts', 'event_tags');
    await queryInterface.removeColumn('alerts', 'tags_generated_at');
    await queryInterface.removeColumn('alerts', 'tags_confidence');
  }
};