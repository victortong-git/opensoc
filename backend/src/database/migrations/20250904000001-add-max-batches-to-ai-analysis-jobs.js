'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ai_analysis_jobs', 'max_batches', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum number of batches to process (user-defined limit)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ai_analysis_jobs', 'max_batches');
  }
};