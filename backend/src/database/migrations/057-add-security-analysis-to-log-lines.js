'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check which columns already exist
    const tableDescription = await queryInterface.describeTable('tmp_log_file_lines');
    
    if (!tableDescription.security_analyzed) {
      await queryInterface.addColumn('tmp_log_file_lines', 'security_analyzed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Flag indicating if line has been analyzed for security issues'
      });
    }

    if (!tableDescription.has_security_issue) {
      await queryInterface.addColumn('tmp_log_file_lines', 'has_security_issue', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Flag indicating if security issue was detected'
      });
    }

    if (!tableDescription.security_issue_description) {
      await queryInterface.addColumn('tmp_log_file_lines', 'security_issue_description', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the security issue identified by AI'
      });
    }

    if (!tableDescription.security_issue_severity) {
      await queryInterface.addColumn('tmp_log_file_lines', 'security_issue_severity', {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: true,
        comment: 'Severity level of the identified security issue'
      });
    }

    if (!tableDescription.security_issue_type) {
      await queryInterface.addColumn('tmp_log_file_lines', 'security_issue_type', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Type/category of the security issue (e.g., brute_force, malware, etc.)'
      });
    }

    if (!tableDescription.ai_analysis_timestamp) {
      await queryInterface.addColumn('tmp_log_file_lines', 'ai_analysis_timestamp', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when AI security analysis was performed'
      });
    }

    if (!tableDescription.ai_analysis_metadata) {
      await queryInterface.addColumn('tmp_log_file_lines', 'ai_analysis_metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional AI analysis data including recommendations and confidence scores'
      });
    }

    if (!tableDescription.created_alert_id) {
      await queryInterface.addColumn('tmp_log_file_lines', 'created_alert_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to security alert created for this log line'
      });
    }

    // Add indexes for efficient querying (only if they don't exist)
    try {
      const indexes = await queryInterface.showIndex('tmp_log_file_lines');
      const existingIndexNames = indexes.map(idx => idx.name);
      
      if (!existingIndexNames.includes('tmp_log_file_lines_security_analyzed_idx')) {
        await queryInterface.addIndex('tmp_log_file_lines', ['security_analyzed'], {
          name: 'tmp_log_file_lines_security_analyzed_idx'
        });
      }

      if (!existingIndexNames.includes('tmp_log_file_lines_has_security_issue_idx')) {
        await queryInterface.addIndex('tmp_log_file_lines', ['has_security_issue'], {
          name: 'tmp_log_file_lines_has_security_issue_idx'
        });
      }

      if (!existingIndexNames.includes('tmp_log_file_lines_security_severity_idx')) {
        await queryInterface.addIndex('tmp_log_file_lines', ['security_issue_severity'], {
          name: 'tmp_log_file_lines_security_severity_idx'
        });
      }

      if (!existingIndexNames.includes('tmp_log_file_lines_file_security_analyzed_idx')) {
        await queryInterface.addIndex('tmp_log_file_lines', ['log_file_meta_id', 'security_analyzed'], {
          name: 'tmp_log_file_lines_file_security_analyzed_idx'
        });
      }

      if (!existingIndexNames.includes('tmp_log_file_lines_file_security_issue_idx')) {
        await queryInterface.addIndex('tmp_log_file_lines', ['log_file_meta_id', 'has_security_issue'], {
          name: 'tmp_log_file_lines_file_security_issue_idx'
        });
      }

      if (!existingIndexNames.includes('tmp_log_file_lines_ai_analysis_timestamp_idx')) {
        await queryInterface.addIndex('tmp_log_file_lines', ['ai_analysis_timestamp'], {
          name: 'tmp_log_file_lines_ai_analysis_timestamp_idx'
        });
      }
    } catch (error) {
      console.log('Some indexes may already exist, skipping index creation errors');
    }

    // Add foreign key constraint for alert reference (only if it doesn't exist)
    try {
      const constraints = await queryInterface.getForeignKeyReferencesForTable('tmp_log_file_lines');
      const hasAlertConstraint = constraints.some(constraint => 
        constraint.columnName === 'created_alert_id'
      );
      
      if (!hasAlertConstraint) {
        await queryInterface.addConstraint('tmp_log_file_lines', {
          fields: ['created_alert_id'],
          type: 'foreign key',
          name: 'tmp_log_file_lines_alert_fk',
          references: {
            table: 'alerts',
            field: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        });
      }
    } catch (error) {
      console.log('Foreign key constraint may already exist or alerts table not available, skipping constraint creation');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('tmp_log_file_lines', 'tmp_log_file_lines_alert_fk');

    // Remove indexes
    await queryInterface.removeIndex('tmp_log_file_lines', 'tmp_log_file_lines_ai_analysis_timestamp_idx');
    await queryInterface.removeIndex('tmp_log_file_lines', 'tmp_log_file_lines_file_security_issue_idx');
    await queryInterface.removeIndex('tmp_log_file_lines', 'tmp_log_file_lines_file_security_analyzed_idx');
    await queryInterface.removeIndex('tmp_log_file_lines', 'tmp_log_file_lines_security_severity_idx');
    await queryInterface.removeIndex('tmp_log_file_lines', 'tmp_log_file_lines_has_security_issue_idx');
    await queryInterface.removeIndex('tmp_log_file_lines', 'tmp_log_file_lines_security_analyzed_idx');

    // Remove columns
    await queryInterface.removeColumn('tmp_log_file_lines', 'created_alert_id');
    await queryInterface.removeColumn('tmp_log_file_lines', 'ai_analysis_metadata');
    await queryInterface.removeColumn('tmp_log_file_lines', 'ai_analysis_timestamp');
    await queryInterface.removeColumn('tmp_log_file_lines', 'security_issue_type');
    await queryInterface.removeColumn('tmp_log_file_lines', 'security_issue_severity');
    await queryInterface.removeColumn('tmp_log_file_lines', 'security_issue_description');
    await queryInterface.removeColumn('tmp_log_file_lines', 'has_security_issue');
    await queryInterface.removeColumn('tmp_log_file_lines', 'security_analyzed');

    // Remove the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tmp_log_file_lines_security_issue_severity";');
  }
};