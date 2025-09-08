'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('📊 Adding MITRE analysis fields to alerts table...');

    // Add MITRE analysis fields to alerts table
    await queryInterface.addColumn('alerts', 'mitre_analysis', {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Structured MITRE ATT&CK analysis results for the alert'
    });

    await queryInterface.addColumn('alerts', 'mitre_analysis_timestamp', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when MITRE analysis was last performed'
    });

    console.log('✅ MITRE analysis fields added to alerts table');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing MITRE analysis fields from alerts table...');

    await queryInterface.removeColumn('alerts', 'mitre_analysis_timestamp');
    await queryInterface.removeColumn('alerts', 'mitre_analysis');

    console.log('✅ MITRE analysis fields removed from alerts table');
  }
};