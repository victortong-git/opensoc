const aiAnalysisJobService = require('../services/aiAnalysisJobService');
const { validationResult, body, param, query } = require('express-validator');

class AIAnalysisJobController {
  
  /**
   * Create a new AI analysis job
   * POST /api/log-analyzer/files/:fileId/analysis-jobs
   */
  async createJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId, id: userId } = req.user;
      const { fileId } = req.params;
      const { batchSize = 50, maxBatches } = req.body;

      const job = await aiAnalysisJobService.createAnalysisJob(
        fileId,
        organizationId,
        userId,
        batchSize,
        maxBatches
      );

      res.status(201).json({
        success: true,
        message: 'Analysis job created successfully',
        data: job
      });

    } catch (error) {
      console.error('Create analysis job error:', error);
      const status = error.message.includes('not found') ? 404 : 
                    error.message.includes('already running') ? 409 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to create analysis job'
      });
    }
  }

  /**
   * Get job status and details
   * GET /api/log-analyzer/files/:fileId/analysis-jobs/:jobId
   */
  async getJobStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId } = req.user;
      const { jobId } = req.params;

      const job = await aiAnalysisJobService.getJobStatus(jobId, organizationId);

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      console.error('Get job status error:', error);
      const status = error.message === 'Job not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to get job status'
      });
    }
  }

  /**
   * Pause a running job
   * PUT /api/log-analyzer/files/:fileId/analysis-jobs/:jobId/pause
   */
  async pauseJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId } = req.user;
      const { jobId } = req.params;

      const job = await aiAnalysisJobService.pauseJob(jobId, organizationId);

      res.json({
        success: true,
        message: 'Job pause requested successfully',
        data: job
      });

    } catch (error) {
      console.error('Pause job error:', error);
      const status = error.message === 'Job not found' ? 404 : 
                    error.message.includes('cannot be paused') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to pause job'
      });
    }
  }

  /**
   * Resume a paused job
   * PUT /api/log-analyzer/files/:fileId/analysis-jobs/:jobId/resume
   */
  async resumeJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId } = req.user;
      const { jobId } = req.params;

      const job = await aiAnalysisJobService.resumeJob(jobId, organizationId);

      res.json({
        success: true,
        message: 'Job resumed successfully',
        data: job
      });

    } catch (error) {
      console.error('Resume job error:', error);
      const status = error.message === 'Job not found' ? 404 : 
                    error.message.includes('cannot be resumed') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to resume job'
      });
    }
  }

  /**
   * Cancel a job
   * DELETE /api/log-analyzer/files/:fileId/analysis-jobs/:jobId
   */
  async cancelJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId } = req.user;
      const { jobId } = req.params;

      const job = await aiAnalysisJobService.cancelJob(jobId, organizationId);

      res.json({
        success: true,
        message: 'Job cancellation requested successfully',
        data: job
      });

    } catch (error) {
      console.error('Cancel job error:', error);
      const status = error.message === 'Job not found' ? 404 : 
                    error.message.includes('cannot be cancelled') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to cancel job'
      });
    }
  }

  /**
   * Get all jobs for organization/file
   * GET /api/log-analyzer/analysis-jobs
   */
  async getJobs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId } = req.user;
      const { page, limit, status, fileId } = req.query;

      const result = await aiAnalysisJobService.getJobs(organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        fileId
      });

      res.json({
        success: true,
        data: result.jobs,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get jobs'
      });
    }
  }

  /**
   * Get active job for a specific file
   * GET /api/log-analyzer/files/:fileId/analysis-jobs/active
   */
  async getActiveJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId } = req.user;
      const { fileId } = req.params;

      const job = await aiAnalysisJobService.getActiveJobForFile(fileId, organizationId);

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      console.error('Get active job error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active job'
      });
    }
  }
}

// Validation middleware
const createJobValidation = [
  param('fileId').isUUID().withMessage('Invalid file ID'),
  body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100').custom((value) => {
    if (![1, 5, 10, 25, 50, 100].includes(parseInt(value))) {
      throw new Error('Batch size must be one of: 1, 5, 10, 25, 50, 100');
    }
    return true;
  }),
  body('maxBatches').optional().isInt({ min: 1 }).withMessage('Max batches must be a positive integer')
];

const jobIdValidation = [
  param('fileId').isUUID().withMessage('Invalid file ID'),
  param('jobId').isUUID().withMessage('Invalid job ID')
];

const getJobsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['queued', 'running', 'paused', 'cancelled', 'completed', 'error']).withMessage('Invalid status'),
  query('fileId').optional().isUUID().withMessage('Invalid file ID')
];

const activeJobValidation = [
  param('fileId').isUUID().withMessage('Invalid file ID')
];

module.exports = {
  controller: new AIAnalysisJobController(),
  validations: {
    createJobValidation,
    jobIdValidation,
    getJobsValidation,
    activeJobValidation
  }
};