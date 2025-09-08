'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the default for capabilities column first
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_agents ALTER COLUMN capabilities DROP DEFAULT;
    `);
    
    // Update capabilities column from ARRAY to JSONB
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_agents 
      ALTER COLUMN capabilities TYPE JSONB 
      USING CASE 
        WHEN capabilities IS NULL THEN '[]'::JSONB
        ELSE array_to_json(capabilities)::JSONB 
      END;
    `);
    
    // Set new default for capabilities
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_agents ALTER COLUMN capabilities SET DEFAULT '[]'::JSONB;
    `);
    
    // Add missing columns that the model expects
    const tableInfo = await queryInterface.describeTable('ai_agents');
    
    if (!tableInfo.primary_functions) {
      await queryInterface.addColumn('ai_agents', 'primary_functions', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      });
    }
    
    if (!tableInfo.metrics) {
      await queryInterface.addColumn('ai_agents', 'metrics', {
        type: Sequelize.JSONB,
        defaultValue: {}
      });
    }
    
    if (!tableInfo.current_tasks) {
      await queryInterface.addColumn('ai_agents', 'current_tasks', {
        type: Sequelize.JSONB,
        defaultValue: []
      });
    }
    
    if (!tableInfo.assigned_humans) {
      await queryInterface.addColumn('ai_agents', 'assigned_humans', {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      });
    }
    
    if (!tableInfo.last_updated) {
      await queryInterface.addColumn('ai_agents', 'last_updated', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }
    
    // Set default version if column is empty
    await queryInterface.sequelize.query(`
      UPDATE ai_agents SET version = '1.0.0' WHERE version IS NULL;
    `);
    
    // Add indexes
    await queryInterface.addIndex('ai_agents', ['status']);
    await queryInterface.addIndex('ai_agents', ['last_updated']);
  },

  async down(queryInterface, Sequelize) {
    console.log('Reverting final AI agents fixes requires manual intervention');
  }
};