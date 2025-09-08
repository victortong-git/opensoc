'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check and add assigned_to_name field if it doesn't exist
    const [results] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'incidents' AND column_name = 'assigned_to_name'
    `);
    
    if (results.length === 0) {
      await queryInterface.addColumn('incidents', 'assigned_to_name', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // Check and add alert_ids array field if it doesn't exist
    const [alertIdsResults] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'incidents' AND column_name = 'alert_ids'
    `);
    
    if (alertIdsResults.length === 0) {
      await queryInterface.addColumn('incidents', 'alert_ids', {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      });
    }
    
    // Check and add alert_count field if it doesn't exist
    const [alertCountResults] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'incidents' AND column_name = 'alert_count'
    `);
    
    if (alertCountResults.length === 0) {
      await queryInterface.addColumn('incidents', 'alert_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Check and remove columns if they exist
    const columns = ['assigned_to_name', 'alert_ids', 'alert_count'];
    
    for (const column of columns) {
      const [results] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'incidents' AND column_name = '${column}'
      `);
      
      if (results.length > 0) {
        await queryInterface.removeColumn('incidents', column);
      }
    }
  }
};