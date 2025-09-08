const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { 
  controller, 
  upload, 
  validations 
} = require('../controllers/logAnalyzer.controller');
const { 
  controller: jobController, 
  validations: jobValidations 
} = require('../controllers/aiAnalysisJobController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/log-analyzer/upload
 * Upload a new log file
 */
router.post('/upload', 
  upload.single('logFile'),
  validations.fileUploadValidation,
  controller.uploadFile.bind(controller)
);

/**
 * GET /api/log-analyzer/files
 * Get all log files for the organization
 * Query params: page, limit, status, search
 */
router.get('/files',
  validations.getFilesValidation,
  controller.getFiles.bind(controller)
);

/**
 * GET /api/log-analyzer/files/:fileId
 * Get details of a specific file
 */
router.get('/files/:fileId',
  validations.fileIdValidation,
  controller.getFileDetails.bind(controller)
);

/**
 * PUT /api/log-analyzer/files/:fileId
 * Update file metadata
 */
router.put('/files/:fileId',
  validations.updateFileValidation,
  controller.updateFile.bind(controller)
);

/**
 * GET /api/log-analyzer/files/:fileId/lines
 * Get lines of a specific file with pagination
 * Query params: page, limit, search
 */
router.get('/files/:fileId/lines',
  validations.getFileLinesValidation,
  controller.getFileLines.bind(controller)
);

/**
 * POST /api/log-analyzer/files/:fileId/lines
 * Create a new log line
 */
router.post('/files/:fileId/lines',
  validations.createLineValidation,
  controller.createLine.bind(controller)
);

/**
 * PUT /api/log-analyzer/files/:fileId/lines/:lineId
 * Update an existing log line
 */
router.put('/files/:fileId/lines/:lineId',
  validations.updateLineValidation,
  controller.updateLine.bind(controller)
);

/**
 * DELETE /api/log-analyzer/files/:fileId/lines/:lineId
 * Delete a specific log line
 */
router.delete('/files/:fileId/lines/:lineId',
  validations.deleteLineValidation,
  controller.deleteLine.bind(controller)
);

/**
 * DELETE /api/log-analyzer/files/:fileId/lines
 * Empty all lines for a file (keep metadata)
 */
router.delete('/files/:fileId/lines',
  validations.fileIdValidation,
  controller.emptyFileLines.bind(controller)
);

/**
 * DELETE /api/log-analyzer/files/:fileId
 * Delete file completely (metadata, lines, and physical file)
 */
router.delete('/files/:fileId',
  validations.fileIdValidation,
  controller.deleteFile.bind(controller)
);

/**
 * POST /api/log-analyzer/cleanup
 * Bulk cleanup operations
 * Body: { action, olderThanDays?, fileIds? }
 */
router.post('/cleanup',
  validations.bulkCleanupValidation,
  controller.bulkCleanup.bind(controller)
);

/**
 * POST /api/log-analyzer/files/:fileId/analyze-security
 * Analyze file for security issues using AI
 * Body: { batchSize?: number }
 */
router.post('/files/:fileId/analyze-security',
  validations.analyzeFileSecurityValidation,
  controller.analyzeFileSecurity.bind(controller)
);

/**
 * GET /api/log-analyzer/files/:fileId/security-stats
 * Get security analysis statistics for a file
 */
router.get('/files/:fileId/security-stats',
  validations.securityAnalysisStatsValidation,
  controller.getSecurityAnalysisStats.bind(controller)
);

/**
 * GET /api/log-analyzer/files/:fileId/security-issues
 * Get security issues found in a file
 * Query params: page, limit, severity, issueType
 */
router.get('/files/:fileId/security-issues',
  validations.getSecurityIssuesValidation,
  controller.getFileSecurityIssues.bind(controller)
);

/**
 * GET /api/log-analyzer/stats
 * Get storage usage statistics
 */
router.get('/stats',
  controller.getStorageStats.bind(controller)
);

// ===========================================
// AI Analysis Job Management Routes
// ===========================================

/**
 * POST /api/log-analyzer/files/:fileId/analysis-jobs
 * Create a new AI analysis job for a file
 * Body: { batchSize?: number }
 */
router.post('/files/:fileId/analysis-jobs',
  jobValidations.createJobValidation,
  jobController.createJob.bind(jobController)
);

/**
 * GET /api/log-analyzer/files/:fileId/analysis-jobs/active
 * Get active job for a specific file
 */
router.get('/files/:fileId/analysis-jobs/active',
  jobValidations.activeJobValidation,
  jobController.getActiveJob.bind(jobController)
);

/**
 * GET /api/log-analyzer/files/:fileId/analysis-jobs/:jobId
 * Get job status and details
 */
router.get('/files/:fileId/analysis-jobs/:jobId',
  jobValidations.jobIdValidation,
  jobController.getJobStatus.bind(jobController)
);

/**
 * PUT /api/log-analyzer/files/:fileId/analysis-jobs/:jobId/pause
 * Pause a running job
 */
router.put('/files/:fileId/analysis-jobs/:jobId/pause',
  jobValidations.jobIdValidation,
  jobController.pauseJob.bind(jobController)
);

/**
 * PUT /api/log-analyzer/files/:fileId/analysis-jobs/:jobId/resume
 * Resume a paused job
 */
router.put('/files/:fileId/analysis-jobs/:jobId/resume',
  jobValidations.jobIdValidation,
  jobController.resumeJob.bind(jobController)
);

/**
 * DELETE /api/log-analyzer/files/:fileId/analysis-jobs/:jobId
 * Cancel a job
 */
router.delete('/files/:fileId/analysis-jobs/:jobId',
  jobValidations.jobIdValidation,
  jobController.cancelJob.bind(jobController)
);

/**
 * GET /api/log-analyzer/analysis-jobs
 * Get all jobs for organization with optional filtering
 * Query params: page, limit, status, fileId
 */
router.get('/analysis-jobs',
  jobValidations.getJobsValidation,
  jobController.getJobs.bind(jobController)
);

module.exports = router;