'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add AI analysis fields to alerts table
    await queryInterface.addColumn('alerts', 'ai_analysis', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Structured AI analysis results for the alert'
    });

    await queryInterface.addColumn('alerts', 'ai_analysis_timestamp', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when AI analysis was last performed'
    });

    // Add index for querying alerts with AI analysis
    await queryInterface.addIndex('alerts', ['ai_analysis_timestamp'], {
      name: 'idx_alerts_ai_analysis_timestamp'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('alerts', 'idx_alerts_ai_analysis_timestamp');
    
    // Remove columns
    await queryInterface.removeColumn('alerts', 'ai_analysis_timestamp');
    await queryInterface.removeColumn('alerts', 'ai_analysis');
  }
};