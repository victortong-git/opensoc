'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for job status
    await queryInterface.sequelize.query(`
      CREATE TYPE ai_analysis_job_status AS ENUM (
        'queued', 
        'running', 
        'paused', 
        'cancelled', 
        'completed', 
        'error'
      );
    `);

    // Create ai_analysis_jobs table
    await queryInterface.createTable('ai_analysis_jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      fileId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'file_id',
        references: {
          model: 'tmp_log_file_meta',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the log file being analyzed'
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'organization_id',
        comment: 'Organization that owns this analysis job'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
        comment: 'User who created this analysis job'
      },
      status: {
        type: 'ai_analysis_job_status',
        allowNull: false,
        defaultValue: 'queued',
        comment: 'Current status of the analysis job'
      },
      batchSize: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'batch_size',
        validate: {
          isIn: [[1, 5, 10, 25, 50, 100]]
        },
        comment: 'Number of lines to process per batch'
      },
      currentBatch: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'current_batch',
        comment: 'Current batch being processed (0-based)'
      },
      totalBatches: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'total_batches',
        comment: 'Total number of batches to process'
      },
      linesProcessed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'lines_processed',
        comment: 'Number of lines successfully processed'
      },
      totalLines: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'total_lines',
        comment: 'Total number of lines to analyze'
      },
      issuesFound: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'issues_found',
        comment: 'Number of security issues detected'
      },
      alertsCreated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'alerts_created',
        comment: 'Number of alerts created from security issues'
      },
      pauseRequested: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'pause_requested',
        comment: 'Flag indicating if job pause has been requested'
      },
      cancelRequested: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'cancel_requested',
        comment: 'Flag indicating if job cancellation has been requested'
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'start_time',
        comment: 'Timestamp when job processing started'
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'end_time',
        comment: 'Timestamp when job processing completed or was cancelled'
      },
      estimatedEndTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'estimated_end_time',
        comment: 'Estimated completion time based on current progress'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'error_message',
        comment: 'Error message if job failed'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata about the job (performance metrics, settings, etc.)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('ai_analysis_jobs', ['file_id'], {
      name: 'ai_analysis_jobs_file_id_idx'
    });

    await queryInterface.addIndex('ai_analysis_jobs', ['organization_id'], {
      name: 'ai_analysis_jobs_organization_id_idx'
    });

    await queryInterface.addIndex('ai_analysis_jobs', ['user_id'], {
      name: 'ai_analysis_jobs_user_id_idx'
    });

    await queryInterface.addIndex('ai_analysis_jobs', ['status'], {
      name: 'ai_analysis_jobs_status_idx'
    });

    await queryInterface.addIndex('ai_analysis_jobs', ['created_at'], {
      name: 'ai_analysis_jobs_created_at_idx'
    });

    // Composite indexes for common queries
    await queryInterface.addIndex('ai_analysis_jobs', ['organization_id', 'status'], {
      name: 'ai_analysis_jobs_org_status_idx'
    });

    await queryInterface.addIndex('ai_analysis_jobs', ['file_id', 'status'], {
      name: 'ai_analysis_jobs_file_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_file_status_idx');
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_org_status_idx');
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_created_at_idx');
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_status_idx');
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_user_id_idx');
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_organization_id_idx');
    await queryInterface.removeIndex('ai_analysis_jobs', 'ai_analysis_jobs_file_id_idx');

    // Drop table
    await queryInterface.dropTable('ai_analysis_jobs');

    // Drop enum type
    await queryInterface.sequelize.query('DROP TYPE ai_analysis_job_status;');
  }
};