const { models, sequelize } = require('../database/models');
const { Op } = require('sequelize');
const aiLogSecurityAnalyst = require('./aiLogSecurityAnalyst');
const websocketService = require('./websocketService');

/**
 * AI Analysis Job Management Service
 * Handles creation, control, and monitoring of AI log analysis jobs
 */
class AIAnalysisJobService {
  
  /**
   * Create a new AI analysis job
   */
  async createAnalysisJob(fileId, organizationId, userId, batchSize = 50, maxBatches = null) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get file details and total lines
      const logFile = await models.TmpLogFileMeta.findOne({
        where: { id: fileId, organizationId },
        transaction
      });

      if (!logFile) {
        throw new Error('Log file not found');
      }

      // Check if there's already a running or queued job for this file
      const existingJob = await models.AIAnalysisJob.findOne({
        where: {
          fileId,
          status: ['queued', 'running', 'paused']
        },
        transaction
      });

      if (existingJob) {
        throw new Error('An analysis job is already running or queued for this file');
      }

      // Get unanalyzed lines count
      const unanalyzedCount = await models.TmpLogFileLines.count({
        where: {
          logFileMetaId: fileId,
          securityAnalyzed: false
        },
        transaction
      });

      if (unanalyzedCount === 0) {
        throw new Error('No unanalyzed lines found in this file');
      }

      // Calculate total batches needed
      const totalBatches = Math.ceil(unanalyzedCount / batchSize);
      
      // Apply maxBatches limit if specified
      const effectiveTotalBatches = maxBatches && maxBatches < totalBatches ? maxBatches : totalBatches;
      const effectiveTotalLines = effectiveTotalBatches * batchSize;

      // Create the job
      const job = await models.AIAnalysisJob.create({
        fileId,
        organizationId,
        userId,
        status: 'queued',
        batchSize,
        currentBatch: 0, // 0 indicates not started, first batch will be 1
        totalBatches: effectiveTotalBatches,
        maxBatches: maxBatches,
        totalLines: effectiveTotalLines,
        metadata: {
          created: new Date().toISOString(),
          fileInfo: {
            originalName: logFile.originalName,
            totalFileLines: logFile.totalLines,
            unanalyzedLineCount: unanalyzedCount
          },
          batchLimits: {
            requestedMaxBatches: maxBatches,
            actualTotalBatches: totalBatches,
            effectiveTotalBatches: effectiveTotalBatches
          }
        }
      }, { transaction });

      await transaction.commit();
      
      // Start processing the job asynchronously with error handling
      this.processJobAsync(job.id).catch(async (error) => {
        console.error(`Failed to start job processing for job ${job.id}:`, error);
        
        // Update job status to error if processing fails to start
        try {
          await models.AIAnalysisJob.update({
            status: 'error',
            endTime: new Date(),
            errorMessage: `Failed to start processing: ${error.message}`,
            metadata: {
              ...job.metadata,
              errorOccurredAt: new Date().toISOString(),
              startupError: true
            }
          }, {
            where: { id: job.id }
          });
        } catch (updateError) {
          console.error(`Failed to update job status to error for job ${job.id}:`, updateError);
        }
      });

      return job;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Recovery mechanism for stale jobs (called on server startup)
   */
  async recoverStaleJobs() {
    try {
      console.log('🔄 Checking for stale AI analysis jobs...');
      
      // Find jobs that were left in running or queued state
      const staleJobs = await models.AIAnalysisJob.findAll({
        where: {
          status: ['queued', 'running']
        }
      });

      if (staleJobs.length === 0) {
        console.log('✅ No stale AI analysis jobs found');
        return;
      }

      console.log(`🔧 Found ${staleJobs.length} stale jobs, attempting recovery...`);

      for (const job of staleJobs) {
        const timeSinceCreated = Date.now() - new Date(job.createdAt).getTime();
        const timeSinceUpdate = Date.now() - new Date(job.updatedAt).getTime();
        
        // If job has been stale for more than 5 minutes, mark as error
        if (timeSinceUpdate > 5 * 60 * 1000) {
          await job.update({
            status: 'error',
            endTime: new Date(),
            errorMessage: 'Job was stale after server restart',
            metadata: {
              ...job.metadata,
              errorOccurredAt: new Date().toISOString(),
              recoveredFromStale: true,
              staleTimeSinceUpdate: timeSinceUpdate
            }
          });
          console.log(`❌ Marked stale job ${job.id} as error (stale for ${Math.round(timeSinceUpdate / 1000)}s)`);
        } else {
          // If job is recently created/updated, try to resume processing
          if (job.status === 'queued') {
            console.log(`🔄 Resuming queued job ${job.id}`);
            this.processJobAsync(job.id).catch(async (error) => {
              console.error(`Failed to resume job ${job.id}:`, error);
              await job.update({
                status: 'error',
                endTime: new Date(),
                errorMessage: `Failed to resume after recovery: ${error.message}`,
                metadata: {
                  ...job.metadata,
                  errorOccurredAt: new Date().toISOString(),
                  resumeError: true
                }
              });
            });
          } else if (job.status === 'running') {
            console.log(`⚠️ Job ${job.id} was in running state, marking as error for safety`);
            await job.update({
              status: 'error',
              endTime: new Date(),
              errorMessage: 'Job was interrupted by server restart',
              metadata: {
                ...job.metadata,
                errorOccurredAt: new Date().toISOString(),
                interruptedByRestart: true
              }
            });
          }
        }
      }

      console.log('✅ Stale job recovery completed');
    } catch (error) {
      console.error('❌ Error during stale job recovery:', error);
    }
  }

  /**
   * Get job status and details
   */
  async getJobStatus(jobId, organizationId) {
    const job = await models.AIAnalysisJob.findOne({
      where: { id: jobId, organizationId },
      include: [{
        model: models.TmpLogFileMeta,
        as: 'logFile',
        attributes: ['originalName', 'totalLines']
      }]
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  /**
   * Pause a running job
   */
  async pauseJob(jobId, organizationId) {
    const job = await models.AIAnalysisJob.findOne({
      where: { id: jobId, organizationId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (!job.canBePaused()) {
      throw new Error(`Job cannot be paused. Current status: ${job.status}`);
    }

    // Set pause request flag
    await job.update({
      pauseRequested: true,
      metadata: {
        ...job.metadata,
        pauseRequestedAt: new Date().toISOString()
      }
    });

    return job;
  }

  /**
   * Resume a paused job
   */
  async resumeJob(jobId, organizationId) {
    const job = await models.AIAnalysisJob.findOne({
      where: { id: jobId, organizationId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (!job.canBeResumed()) {
      throw new Error(`Job cannot be resumed. Current status: ${job.status}`);
    }

    // Update job status and clear pause flags
    await job.update({
      status: 'running',
      pauseRequested: false,
      metadata: {
        ...job.metadata,
        resumedAt: new Date().toISOString()
      }
    });

    // Continue processing the job
    this.processJobAsync(job.id);

    return job;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId, organizationId) {
    const job = await models.AIAnalysisJob.findOne({
      where: { id: jobId, organizationId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (!job.canBeCancelled()) {
      throw new Error(`Job cannot be cancelled. Current status: ${job.status}`);
    }

    // Immediately set status to cancelled instead of just setting flag
    await job.update({
      status: 'cancelled',
      cancelRequested: true,
      endTime: new Date(),
      metadata: {
        ...job.metadata,
        cancelRequestedAt: new Date().toISOString(),
        cancelledAt: new Date().toISOString()
      }
    });

    return job;
  }

  /**
   * Process job asynchronously (main job processing logic)
   */
  async processJobAsync(jobId) {
    let job = await models.AIAnalysisJob.findByPk(jobId);
    if (!job) return;

    try {
      // Update job status to running
      await job.update({
        status: 'running',
        startTime: new Date()
      });

      // Emit WebSocket event for job started
      try {
        websocketService.emitToUser(job.userId, 'ai_analysis_started', {
          jobId: job.id,
          fileId: job.fileId,
          status: 'running',
          batchSize: job.batchSize,
          totalBatches: job.totalBatches,
          startTime: new Date()
        });
      } catch (wsError) {
        console.warn('Failed to emit ai_analysis_started event:', wsError.message);
      }

      // Get unanalyzed lines for this file
      const unanalyzedLines = await models.TmpLogFileLines.findAll({
        where: {
          logFileMetaId: job.fileId,
          securityAnalyzed: false
        },
        order: [['lineNumber', 'ASC']],
        include: [{
          model: models.TmpLogFileMeta,
          as: 'logFileMeta',
          where: { organizationId: job.organizationId }
        }]
      });

      if (unanalyzedLines.length === 0) {
        await job.update({
          status: 'completed',
          endTime: new Date()
        });

        // Emit WebSocket event for immediate completion (no lines to process)
        try {
          websocketService.emitToUser(job.userId, 'ai_analysis_completed', {
            jobId: job.id,
            fileId: job.fileId,
            status: 'completed',
            totalBatches: job.totalBatches,
            linesProcessed: job.linesProcessed,
            totalLines: job.totalLines,
            issuesFound: job.issuesFound,
            alertsCreated: job.alertsCreated,
            startTime: job.startTime,
            endTime: new Date(),
            totalProcessingTime: new Date() - new Date(job.startTime),
            timestamp: new Date(),
            reason: 'no_unanalyzed_lines'
          });
        } catch (wsError) {
          console.warn('Failed to emit ai_analysis_completed event (early completion):', wsError.message);
        }
        
        return;
      }

      // Use the totalBatches from the job creation instead of recalculating
      // This ensures we respect the limits set when the job was created
      const effectiveBatchCount = job.totalBatches;
      
      console.log(`Processing job ${jobId}: ${effectiveBatchCount} batches (max batches: ${job.maxBatches || 'all'}, batch size: ${job.batchSize})`);

      // Process batches - use 1-based batch numbering throughout
      for (let batchNumber = 1; batchNumber <= effectiveBatchCount; batchNumber++) {
        // Refresh job to check for pause/cancel requests FIRST
        job = await models.AIAnalysisJob.findByPk(jobId);
        
        // Strong cancellation check - exit immediately if cancelled
        if (job.cancelRequested || job.status === 'cancelled') {
          console.log(`Job ${jobId} cancelled at batch ${batchNumber}, stopping processing`);
          await job.update({
            status: 'cancelled',
            endTime: new Date(),
            currentBatch: batchNumber - 1, // Last completed batch
            metadata: {
              ...job.metadata,
              cancelledAt: new Date().toISOString(),
              cancelledAtBatch: batchNumber
            }
          });
          
          // Emit WebSocket cancellation event
          try {
            websocketService.emitToUser(job.userId, 'ai_analysis_cancelled', {
              jobId: job.id,
              fileId: job.fileId,
              status: 'cancelled',
              currentBatch: batchNumber - 1,
              totalBatches: job.totalBatches,
              linesProcessed: job.linesProcessed,
              timestamp: new Date()
            });
          } catch (wsError) {
            console.warn('Failed to emit cancellation event:', wsError.message);
          }
          return;
        }
        
        // Check for pause request BEFORE processing this batch
        if (job.pauseRequested) {
          await job.update({
            status: 'paused',
            currentBatch: batchNumber - 1, // Last completed batch
            metadata: {
              ...job.metadata,
              pausedAt: new Date().toISOString(),
              pausedBeforeBatch: batchNumber
            }
          });
          
          // Emit WebSocket pause event
          try {
            websocketService.emitToUser(job.userId, 'ai_analysis_paused', {
              jobId: job.id,
              fileId: job.fileId,
              status: 'paused',
              currentBatch: batchNumber - 1,
              totalBatches: job.totalBatches,
              linesProcessed: job.linesProcessed,
              timestamp: new Date()
            });
          } catch (wsError) {
            console.warn('Failed to emit pause event:', wsError.message);
          }
          return;
        }
        
        // Calculate line range for this specific batch
        const startIndex = (batchNumber - 1) * job.batchSize;
        const endIndex = Math.min(startIndex + job.batchSize, unanalyzedLines.length);
        
        console.log(`Processing batch ${batchNumber}/${effectiveBatchCount}: lines ${startIndex + 1} to ${endIndex} (${endIndex - startIndex} lines)`);
        
        // Extract lines for this batch using calculated indices
        const batch = unanalyzedLines.slice(startIndex, endIndex);
        
        // Validate batch has lines (should never be empty with correct logic)
        if (batch.length === 0) {
          console.log(`Empty batch encountered at batch ${batchNumber}, completing job`);
          break;
        }

        try {
          // Update job to show current batch being processed
          await job.update({
            currentBatch: batchNumber
          });

          // Emit WebSocket batch start event for real-time feedback
          try {
            websocketService.emitToUser(job.userId, 'ai_batch_started', {
              jobId: job.id,
              fileId: job.fileId,
              batchNumber,
              totalBatches: job.totalBatches,
              batchSize: batch.length,
              timestamp: new Date()
            });
          } catch (wsError) {
            console.warn(`Failed to emit batch start event for batch ${batchNumber}:`, wsError.message);
          }

          // Process the batch using existing AI security analyst
          const batchStartTime = Date.now();
          const batchResults = await this.processBatch(batch, job.userId, job.organizationId);
          const batchProcessingTime = Date.now() - batchStartTime;

          // Update job progress with completed batch
          const newLinesProcessed = job.linesProcessed + batchResults.analyzed;
          const cappedLinesProcessed = Math.min(newLinesProcessed, job.totalLines);
          
          await job.update({
            currentBatch: batchNumber, // This is the just completed batch
            linesProcessed: cappedLinesProcessed,
            issuesFound: job.issuesFound + batchResults.issuesFound,
            alertsCreated: job.alertsCreated + batchResults.alertsCreated,
            estimatedEndTime: this.calculateEstimatedEndTime(job, batchProcessingTime),
            metadata: {
              ...job.metadata,
              lastBatchCompletedAt: new Date().toISOString(),
              lastBatchProcessingTime: batchProcessingTime,
              batchHistory: [
                ...(job.metadata?.batchHistory || []).slice(-9), // Keep last 10 batches
                {
                  batchNumber,
                  linesProcessed: batchResults.analyzed,
                  issuesFound: batchResults.issuesFound,
                  alertsCreated: batchResults.alertsCreated,
                  processingTime: batchProcessingTime,
                  completedAt: new Date().toISOString()
                }
              ]
            }
          });

          // Calculate progress percentage
          const progressPercentage = Math.min(Math.round((cappedLinesProcessed / job.totalLines) * 100), 100);

          // Emit WebSocket batch completion event for real-time feedback
          try {
            websocketService.emitToUser(job.userId, 'ai_batch_completed', {
              jobId: job.id,
              fileId: job.fileId,
              batchNumber,
              totalBatches: job.totalBatches,
              linesProcessed: cappedLinesProcessed,
              totalLines: job.totalLines,
              progressPercentage,
              issuesFound: job.issuesFound + batchResults.issuesFound,
              alertsCreated: job.alertsCreated + batchResults.alertsCreated,
              batchResults: {
                linesAnalyzed: batchResults.analyzed,
                issuesFound: batchResults.issuesFound,
                alertsCreated: batchResults.alertsCreated,
                processingTime: batchProcessingTime
              },
              estimatedEndTime: job.estimatedEndTime,
              timestamp: new Date()
            });

            // Also emit general progress event
            websocketService.emitToUser(job.userId, 'ai_analysis_progress', {
              jobId: job.id,
              fileId: job.fileId,
              status: 'running',
              currentBatch: batchNumber,
              totalBatches: job.totalBatches,
              linesProcessed: cappedLinesProcessed,
              totalLines: job.totalLines,
              progressPercentage,
              issuesFound: job.issuesFound + batchResults.issuesFound,
              alertsCreated: job.alertsCreated + batchResults.alertsCreated,
              estimatedEndTime: job.estimatedEndTime,
              timestamp: new Date()
            });
          } catch (wsError) {
            console.warn(`Failed to emit progress events for batch ${batchNumber}:`, wsError.message);
          }

        } catch (batchError) {
          console.error(`Error processing batch ${batchNumber}:`, batchError);
          
          // Continue with next batch but log the error and emit event
          await job.update({
            metadata: {
              ...job.metadata,
              errors: [...(job.metadata.errors || []), {
                batch: batchNumber,
                error: batchError.message,
                timestamp: new Date().toISOString()
              }]
            }
          });

          // Emit batch error event
          try {
            websocketService.emitToUser(job.userId, 'ai_batch_error', {
              jobId: job.id,
              fileId: job.fileId,
              batchNumber,
              error: batchError.message,
              timestamp: new Date()
            });
          } catch (wsError) {
            console.warn(`Failed to emit batch error event for batch ${batchNumber}:`, wsError.message);
          }
        }
      }

      // Mark job as completed
      await job.update({
        status: 'completed',
        endTime: new Date(),
        metadata: {
          ...job.metadata,
          completedAt: new Date().toISOString()
        }
      });

      // Emit WebSocket event for job completion
      try {
        const totalProcessingTime = new Date() - new Date(job.startTime);
        websocketService.emitToUser(job.userId, 'ai_analysis_completed', {
          jobId: job.id,
          fileId: job.fileId,
          status: 'completed',
          currentBatch: job.currentBatch,
          totalBatches: job.totalBatches,
          linesProcessed: job.linesProcessed,
          totalLines: job.totalLines,
          issuesFound: job.issuesFound,
          alertsCreated: job.alertsCreated,
          startTime: job.startTime,
          endTime: new Date(),
          totalProcessingTime,
          averageBatchTime: job.currentBatch > 0 ? Math.round(totalProcessingTime / job.currentBatch) : 0,
          maxBatches: job.maxBatches,
          wasLimited: job.maxBatches && job.maxBatches < Math.ceil(job.totalLines / job.batchSize),
          timestamp: new Date()
        });
      } catch (wsError) {
        console.warn('Failed to emit ai_analysis_completed event:', wsError.message);
      }

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      
      await job.update({
        status: 'error',
        endTime: new Date(),
        errorMessage: error.message,
        metadata: {
          ...job.metadata,
          errorOccurredAt: new Date().toISOString()
        }
      });

      // Emit WebSocket event for job error
      try {
        websocketService.emitToUser(job.userId, 'ai_analysis_error', {
          jobId: job.id,
          fileId: job.fileId,
          status: 'error',
          errorMessage: error.message,
          currentBatch: job.currentBatch,
          totalBatches: job.totalBatches,
          linesProcessed: job.linesProcessed,
          totalLines: job.totalLines,
          issuesFound: job.issuesFound,
          alertsCreated: job.alertsCreated,
          startTime: job.startTime,
          endTime: new Date(),
          timestamp: new Date()
        });
      } catch (wsError) {
        console.warn('Failed to emit ai_analysis_error event:', wsError.message);
      }
    }
  }

  /**
   * Process a single batch of log lines
   */
  async processBatch(logLines, userId, organizationId) {
    const startTime = Date.now();
    let batchResults = {
      analyzed: 0,
      issuesFound: 0,
      alertsCreated: 0,
      errors: []
    };

    try {
      // Use the existing AI security analyst batch processing
      const results = await aiLogSecurityAnalyst.processLogLinesBatch(logLines, userId, organizationId);
      
      batchResults = {
        analyzed: results.analyzed,
        issuesFound: results.issuesFound,
        alertsCreated: results.alertsCreated,
        errors: results.errors,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Batch processing error:', error);
      batchResults.errors.push(error.message);
      batchResults.processingTime = Date.now() - startTime;
    }

    return batchResults;
  }

  /**
   * Calculate estimated end time based on current progress
   */
  calculateEstimatedEndTime(job, lastBatchTime) {
    if (!lastBatchTime || job.linesProcessed === 0) {
      return null;
    }

    const remainingLines = job.totalLines - job.linesProcessed;
    const avgTimePerLine = lastBatchTime / job.batchSize;
    const estimatedRemainingTime = remainingLines * avgTimePerLine;
    
    return new Date(Date.now() + estimatedRemainingTime);
  }

  /**
   * Get all jobs for an organization with optional filtering
   */
  async getJobs(organizationId, options = {}) {
    const { page = 1, limit = 20, status, fileId } = options;
    
    const whereClause = { organizationId };
    if (status) whereClause.status = status;
    if (fileId) whereClause.fileId = fileId;

    const { count, rows } = await models.AIAnalysisJob.findAndCountAll({
      where: whereClause,
      include: [{
        model: models.TmpLogFileMeta,
        as: 'logFile',
        attributes: ['originalName', 'totalLines']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return {
      jobs: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get active job for a specific file
   */
  async getActiveJobForFile(fileId, organizationId) {
    return await models.AIAnalysisJob.findOne({
      where: {
        fileId,
        organizationId,
        status: ['queued', 'running', 'paused']
      },
      order: [['createdAt', 'DESC']]
    });
  }
}

// Make the processLogLinesBatch method available (it might not be exported)
// We'll need to access this from aiLogSecurityAnalyst
const aiAnalysisJobService = new AIAnalysisJobService();

module.exports = aiAnalysisJobService;