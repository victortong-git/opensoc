'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if metadata column already exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'incidents' 
      AND column_name = 'metadata'
      AND table_schema = 'public'
    `);
    
    if (results.length === 0) {
      // Add metadata JSONB field only if it doesn't exist
      await queryInterface.addColumn('incidents', 'metadata', {
        type: Sequelize.JSONB,
        defaultValue: {}
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('incidents', 'metadata');
  }
};