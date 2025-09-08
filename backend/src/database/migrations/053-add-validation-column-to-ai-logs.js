'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ai_generation_logs', 'validation', {
      type: Sequelize.ENUM('Pass', 'Fail', 'Pending', 'Unknown'),
      allowNull: false,
      defaultValue: 'Pending',
      field: 'validation',
      comment: 'Validation status of AI-generated data creation in database'
    });

    // Add index for the validation column for better query performance
    await queryInterface.addIndex('ai_generation_logs', ['validation']);
  },

  async down(queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('ai_generation_logs', ['validation']);
    
    // Remove the column
    await queryInterface.removeColumn('ai_generation_logs', 'validation');
    
    // Remove the ENUM type (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_generation_logs_validation";');
  }
};