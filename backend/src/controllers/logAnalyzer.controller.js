const logAnalyzerService = require('../services/logAnalyzerService');
const aiLogSecurityAnalyst = require('../services/aiLogSecurityAnalyst');
const multer = require('multer');
const { validationResult, body, param, query } = require('express-validator');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow text-based files
    const allowedMimes = [
      'text/plain',
      'text/log',
      'application/octet-stream'
    ];
    
    const allowedExtensions = ['.log', '.txt', '.out', '.err', '.trace'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (allowedMimes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only log files are allowed'), false);
    }
  }
});

class LogAnalyzerController {
  
  /**
   * Upload and process log file
   */
  async uploadFile(req, res) {
    try {
      // Validation errors check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { organizationId, id: userId } = req.user;
      
      const logFileMeta = await logAnalyzerService.saveUploadedFile(
        req.file,
        userId,
        organizationId
      );

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: logFileMeta
      });

    } catch (error) {
      console.error('Upload file error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file'
      });
    }
  }

  /**
   * Get all log files for organization
   */
  async getFiles(req, res) {
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
      const { page, limit, status, search } = req.query;

      const result = await logAnalyzerService.getLogFiles(organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        search
      });

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get files'
      });
    }
  }

  /**
   * Get file details
   */
  async getFileDetails(req, res) {
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

      const file = await logAnalyzerService.getFileDetails(fileId, organizationId);

      res.json({
        success: true,
        data: file
      });

    } catch (error) {
      console.error('Get file details error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to get file details'
      });
    }
  }

  /**
   * Update file metadata
   */
  async updateFile(req, res) {
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
      const updateData = req.body;

      const updatedFile = await logAnalyzerService.updateFile(fileId, organizationId, updateData);

      res.json({
        success: true,
        message: 'File updated successfully',
        data: updatedFile
      });

    } catch (error) {
      console.error('Update file error:', error);
      const status = error.message === 'File not found' ? 404 : 
                    error.message === 'No valid fields to update' ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update file'
      });
    }
  }

  /**
   * Get file lines with pagination
   */
  async getFileLines(req, res) {
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
      const { 
        page, 
        limit, 
        search, 
        securityStatus, 
        severity, 
        analysisStatus, 
        hasAlerts,
        logLevel,
        dateFrom,
        dateTo,
        ipAddress
      } = req.query;

      const result = await logAnalyzerService.getFileLines(fileId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 100,
        search,
        securityStatus,
        severity,
        analysisStatus,
        hasAlerts: hasAlerts !== undefined ? hasAlerts === 'true' : undefined,
        logLevel,
        dateFrom,
        dateTo,
        ipAddress
      });

      res.json({
        success: true,
        data: result.lines,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get file lines error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to get file lines'
      });
    }
  }

  /**
   * Empty all lines for a file (keep metadata)
   */
  async emptyFileLines(req, res) {
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

      const result = await logAnalyzerService.emptyFileLines(fileId, organizationId);

      res.json({
        success: true,
        message: 'File lines cleared successfully',
        data: result
      });

    } catch (error) {
      console.error('Empty file lines error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to empty file lines'
      });
    }
  }

  /**
   * Delete file completely
   */
  async deleteFile(req, res) {
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

      const result = await logAnalyzerService.deleteFile(fileId, organizationId);

      res.json({
        success: true,
        message: 'File deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Delete file error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete file'
      });
    }
  }

  /**
   * Bulk cleanup operations
   */
  async bulkCleanup(req, res) {
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
      const { action, olderThanDays, fileIds } = req.body;

      const result = await logAnalyzerService.bulkCleanup(organizationId, {
        action,
        olderThanDays,
        fileIds
      });

      res.json({
        success: true,
        message: 'Bulk cleanup completed',
        data: result
      });

    } catch (error) {
      console.error('Bulk cleanup error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to perform bulk cleanup'
      });
    }
  }

  /**
   * Create a new log line
   */
  async createLine(req, res) {
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
      const lineData = req.body;

      const newLine = await logAnalyzerService.createLine(fileId, organizationId, lineData);

      res.status(201).json({
        success: true,
        message: 'Line created successfully',
        data: newLine
      });

    } catch (error) {
      console.error('Create line error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to create line'
      });
    }
  }

  /**
   * Update an existing log line
   */
  async updateLine(req, res) {
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
      const { fileId, lineId } = req.params;
      const updateData = req.body;

      const updatedLine = await logAnalyzerService.updateLine(lineId, fileId, organizationId, updateData);

      res.json({
        success: true,
        message: 'Line updated successfully',
        data: updatedLine
      });

    } catch (error) {
      console.error('Update line error:', error);
      const status = error.message === 'File not found' ? 404 :
                    error.message === 'Line not found' ? 404 :
                    error.message === 'No valid fields to update' ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update line'
      });
    }
  }

  /**
   * Delete a log line
   */
  async deleteLine(req, res) {
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
      const { fileId, lineId } = req.params;

      const result = await logAnalyzerService.deleteLine(lineId, fileId, organizationId);

      res.json({
        success: true,
        message: 'Line deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Delete line error:', error);
      const status = error.message === 'File not found' ? 404 :
                    error.message === 'Line not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete line'
      });
    }
  }

  /**
   * Analyze file for security issues using AI
   */
  async analyzeFileSecurity(req, res) {
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

      // Verify file exists and belongs to organization
      const file = await logAnalyzerService.getFileDetails(fileId, organizationId);
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Start the security analysis
      const analysisResults = await aiLogSecurityAnalyst.analyzeLogSecurity(
        fileId, 
        organizationId, 
        userId, 
        batchSize,
        maxBatches
      );

      res.json({
        success: true,
        message: 'Security analysis completed',
        data: analysisResults
      });

    } catch (error) {
      console.error('Analyze file security error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to analyze file security'
      });
    }
  }

  /**
   * Get security analysis statistics for a file
   */
  async getSecurityAnalysisStats(req, res) {
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

      const stats = await aiLogSecurityAnalyst.getSecurityAnalysisStats(fileId, organizationId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get security analysis stats error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to get security analysis statistics'
      });
    }
  }

  /**
   * Get security issues found in a file
   */
  async getFileSecurityIssues(req, res) {
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
      const { page, limit, severity, issueType } = req.query;

      const result = await aiLogSecurityAnalyst.getSecurityIssues(fileId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        severity,
        issueType
      });

      res.json({
        success: true,
        data: result.issues,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get file security issues error:', error);
      const status = error.message === 'File not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to get file security issues'
      });
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(req, res) {
    try {
      const { organizationId } = req.user;

      const stats = await logAnalyzerService.getStorageStats(organizationId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get storage stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get storage statistics'
      });
    }
  }
}

// Validation middleware
const fileUploadValidation = [
  // File will be validated by multer and service layer
];

const getFilesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['uploading', 'processing', 'completed', 'error']).withMessage('Invalid status'),
  query('search').optional().isLength({ max: 255 }).withMessage('Search term too long')
];

const fileIdValidation = [
  param('fileId').isUUID().withMessage('Invalid file ID')
];

const getFileLinesValidation = [
  ...fileIdValidation,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
  query('securityStatus').optional().isIn(['not_analyzed', 'analyzing', 'safe', 'security_issue', 'alerts_created']).withMessage('Invalid security status'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  query('analysisStatus').optional().isIn(['pending', 'in_progress', 'completed', 'failed']).withMessage('Invalid analysis status'),
  query('hasAlerts').optional().isBoolean().withMessage('hasAlerts must be a boolean'),
  query('logLevel').optional().isIn(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']).withMessage('Invalid log level'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('ipAddress').optional().isIP().withMessage('Invalid IP address format')
];

const updateFileValidation = [
  ...fileIdValidation,
  body('originalName').optional().isLength({ min: 1, max: 255 }).withMessage('Original name must be between 1 and 255 characters'),
  body('status').optional().isIn(['uploading', 'processing', 'completed', 'error']).withMessage('Invalid status'),
  body('errorMessage').optional().isLength({ max: 1000 }).withMessage('Error message too long')
];

const bulkCleanupValidation = [
  body('action').isIn(['empty_lines', 'delete_files']).withMessage('Action must be empty_lines or delete_files'),
  body('olderThanDays').optional().isInt({ min: 1 }).withMessage('olderThanDays must be a positive integer'),
  body('fileIds').optional().isArray().withMessage('fileIds must be an array'),
  body('fileIds.*').optional().isUUID().withMessage('Each file ID must be a valid UUID')
];

const createLineValidation = [
  ...fileIdValidation,
  body('content').isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
  body('parsedData').optional().isObject().withMessage('Parsed data must be an object')
];

const updateLineValidation = [
  ...fileIdValidation,
  param('lineId').isUUID().withMessage('Invalid line ID'),
  body('content').optional().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
  body('parsedData').optional().isObject().withMessage('Parsed data must be an object')
];

const deleteLineValidation = [
  ...fileIdValidation,
  param('lineId').isUUID().withMessage('Invalid line ID')
];

const analyzeFileSecurityValidation = [
  ...fileIdValidation,
  body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100')
];

const securityAnalysisStatsValidation = [
  ...fileIdValidation
];

const getSecurityIssuesValidation = [
  ...fileIdValidation,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  query('issueType').optional().isLength({ max: 100 }).withMessage('Issue type too long')
];

module.exports = {
  controller: new LogAnalyzerController(),
  upload,
  validations: {
    fileUploadValidation,
    getFilesValidation,
    fileIdValidation,
    updateFileValidation,
    getFileLinesValidation,
    bulkCleanupValidation,
    createLineValidation,
    updateLineValidation,
    deleteLineValidation,
    analyzeFileSecurityValidation,
    securityAnalysisStatsValidation,
    getSecurityIssuesValidation
  }
};