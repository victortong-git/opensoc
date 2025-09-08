'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add embedding field to incidents table
    await queryInterface.addColumn('incidents', 'embedding', {
      type: Sequelize.ARRAY(Sequelize.REAL),
      allowNull: true,
      comment: 'Vector embedding for RAG similarity search (384-dimensional)'
    });

    // Add embedding field to assets table
    await queryInterface.addColumn('assets', 'embedding', {
      type: Sequelize.ARRAY(Sequelize.REAL),
      allowNull: true,
      comment: 'Vector embedding for RAG similarity search (384-dimensional)'
    });

    // Add embedding field to iocs table (threat intel)
    await queryInterface.addColumn('iocs', 'embedding', {
      type: Sequelize.ARRAY(Sequelize.REAL),
      allowNull: true,
      comment: 'Vector embedding for RAG similarity search (384-dimensional)'
    });

    // Add embedding field to playbooks table
    await queryInterface.addColumn('playbooks', 'embedding', {
      type: Sequelize.ARRAY(Sequelize.REAL),
      allowNull: true,
      comment: 'Vector embedding for RAG similarity search (384-dimensional)'
    });

    console.log('✅ Added embedding fields to incidents, assets, iocs, and playbooks tables');
  },

  async down(queryInterface, Sequelize) {
    // Remove embedding fields in reverse order
    await queryInterface.removeColumn('playbooks', 'embedding');
    await queryInterface.removeColumn('iocs', 'embedding');
    await queryInterface.removeColumn('assets', 'embedding');
    await queryInterface.removeColumn('incidents', 'embedding');

    console.log('✅ Removed embedding fields from all tables');
  }
};