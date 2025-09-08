'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tmp_log_file_meta', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Generated unique filename for storage'
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Original filename uploaded by user'
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Full path to the stored file'
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'File size in bytes'
      },
      total_lines: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total number of lines in the file'
      },
      upload_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Date and time when file was uploaded'
      },
      status: {
        type: Sequelize.ENUM('uploading', 'processing', 'completed', 'error'),
        allowNull: false,
        defaultValue: 'uploading',
        comment: 'Current processing status of the file'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if processing failed'
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Organization that owns this file'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User who uploaded this file'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('tmp_log_file_meta', ['organization_id']);
    await queryInterface.addIndex('tmp_log_file_meta', ['user_id']);
    await queryInterface.addIndex('tmp_log_file_meta', ['status']);
    await queryInterface.addIndex('tmp_log_file_meta', ['upload_date']);
    await queryInterface.addIndex('tmp_log_file_meta', ['organization_id', 'upload_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tmp_log_file_meta');
  }
};