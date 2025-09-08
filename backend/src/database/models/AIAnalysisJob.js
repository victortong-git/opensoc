const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIAnalysisJob = sequelize.define('AIAnalysisJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'file_id',
    comment: 'Reference to the log file being analyzed'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    comment: 'Organization that owns this analysis job'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'User who created this analysis job'
  },
  status: {
    type: DataTypes.ENUM('queued', 'running', 'paused', 'cancelled', 'completed', 'error'),
    allowNull: false,
    defaultValue: 'queued',
    comment: 'Current status of the analysis job'
  },
  batchSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'batch_size',
    validate: {
      isIn: [[1, 5, 10, 25, 50, 100]]
    },
    comment: 'Number of lines to process per batch'
  },
  currentBatch: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'current_batch',
    comment: 'Current batch number being processed (1-based, 0 means not started)'
  },
  totalBatches: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'total_batches',
    comment: 'Total number of batches to process'
  },
  maxBatches: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_batches',
    comment: 'Maximum number of batches to process (user-defined limit)'
  },
  linesProcessed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'lines_processed',
    comment: 'Number of lines successfully processed'
  },
  totalLines: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'total_lines',
    comment: 'Total number of lines to analyze'
  },
  issuesFound: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'issues_found',
    comment: 'Number of security issues detected'
  },
  alertsCreated: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'alerts_created',
    comment: 'Number of alerts created from security issues'
  },
  pauseRequested: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'pause_requested',
    comment: 'Flag indicating if job pause has been requested'
  },
  cancelRequested: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'cancel_requested',
    comment: 'Flag indicating if job cancellation has been requested'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'start_time',
    comment: 'Timestamp when job processing started'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_time',
    comment: 'Timestamp when job processing completed or was cancelled'
  },
  estimatedEndTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'estimated_end_time',
    comment: 'Estimated completion time based on current progress'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Error message if job failed'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata about the job (performance metrics, settings, etc.)'
  }
}, {
  tableName: 'ai_analysis_jobs',
  indexes: [
    {
      fields: ['file_id']
    },
    {
      fields: ['organization_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['organization_id', 'status']
    },
    {
      fields: ['file_id', 'status']
    }
  ]
});

// Define associations
AIAnalysisJob.associate = function(models) {
  // An analysis job belongs to a log file meta
  AIAnalysisJob.belongsTo(models.TmpLogFileMeta, {
    foreignKey: 'fileId',
    as: 'logFile'
  });

  // An analysis job belongs to an organization
  if (models.Organization) {
    AIAnalysisJob.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
  }

  // An analysis job belongs to a user
  if (models.User) {
    AIAnalysisJob.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
};

// Instance methods
AIAnalysisJob.prototype.calculateProgress = function() {
  if (!this.totalLines || this.totalLines === 0) {
    return 0;
  }
  return Math.round((this.linesProcessed / this.totalLines) * 100);
};

AIAnalysisJob.prototype.isRunning = function() {
  return this.status === 'running';
};

AIAnalysisJob.prototype.isPaused = function() {
  return this.status === 'paused';
};

AIAnalysisJob.prototype.isCompleted = function() {
  return ['completed', 'cancelled', 'error'].includes(this.status);
};

AIAnalysisJob.prototype.canBePaused = function() {
  return this.status === 'running';
};

AIAnalysisJob.prototype.canBeResumed = function() {
  return this.status === 'paused';
};

AIAnalysisJob.prototype.canBeCancelled = function() {
  return ['queued', 'running', 'paused'].includes(this.status);
};

module.exports = AIAnalysisJob;