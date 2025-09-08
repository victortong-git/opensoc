'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tmp_log_file_lines', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      log_file_meta_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tmp_log_file_meta',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to tmp_log_file_meta table'
      },
      line_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Line number in the original file (1-based)'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Raw content of the log line'
      },
      parsed_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Parsed/structured data extracted from the log line'
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
    await queryInterface.addIndex('tmp_log_file_lines', ['log_file_meta_id']);
    await queryInterface.addIndex('tmp_log_file_lines', ['log_file_meta_id', 'line_number']);
    await queryInterface.addIndex('tmp_log_file_lines', ['line_number']);
    
    // Add unique constraint to prevent duplicate line numbers per file
    await queryInterface.addIndex('tmp_log_file_lines', 
      ['log_file_meta_id', 'line_number'], 
      {
        unique: true,
        name: 'tmp_log_file_lines_unique_line_per_file'
      }
    );

    // Add index for text search on content
    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tmp_log_file_lines_content_gin_idx ON tmp_log_file_lines USING gin(to_tsvector(\'english\', content));'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tmp_log_file_lines');
  }
};