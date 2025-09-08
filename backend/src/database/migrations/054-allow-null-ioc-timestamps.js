'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('iocs', 'first_seen', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.changeColumn('iocs', 'last_seen', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    console.log('✅ IOC timestamp fields updated to allow null values');
  },

  down: async (queryInterface, Sequelize) => {
    // Update any null values to current timestamp before making NOT NULL
    await queryInterface.sequelize.query(`
      UPDATE iocs 
      SET first_seen = NOW() 
      WHERE first_seen IS NULL
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE iocs 
      SET last_seen = NOW() 
      WHERE last_seen IS NULL
    `);
    
    await queryInterface.changeColumn('iocs', 'first_seen', {
      type: Sequelize.DATE,
      allowNull: false
    });
    
    await queryInterface.changeColumn('iocs', 'last_seen', {
      type: Sequelize.DATE,
      allowNull: false
    });
  }
};