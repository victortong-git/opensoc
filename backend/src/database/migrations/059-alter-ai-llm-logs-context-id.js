'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Alter context_id column from INTEGER to VARCHAR(255) to support UUID strings
    await queryInterface.changeColumn('ai_llm_logs', 'context_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'ID of related entity (conversation_id, incident_id, alert_id, etc.) - supports UUIDs and other identifier formats'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to INTEGER (this will cause data loss if UUIDs were stored)
    await queryInterface.changeColumn('ai_llm_logs', 'context_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID of related entity (conversation_id, incident_id, etc.)'
    });
  }
};