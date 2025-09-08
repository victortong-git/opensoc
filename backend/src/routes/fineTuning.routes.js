const express = require('express');
const fineTuningController = require('../controllers/fineTuning.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/ai-tools/fine-tuning/stats
 * @desc    Get fine-tuning dataset statistics
 * @access  Private
 */
router.get('/stats', fineTuningController.getStats);

/**
 * @route   POST /api/ai-tools/fine-tuning/export
 * @desc    Export fine-tuning dataset
 * @access  Private
 */
router.post('/export', 
  validate(Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    minConfidence: Joi.number().integer().min(1).max(10).default(7),
    includeUnverified: Joi.boolean().default(false),
    format: Joi.string().valid('jsonl', 'json', 'csv').default('jsonl'),
    datasetSplit: Joi.object({
      training: Joi.number().integer().min(50).max(80).default(70),
      validation: Joi.number().integer().min(10).max(30).default(20),
      test: Joi.number().integer().min(10).max(30).default(10)
    }).default({ training: 70, validation: 20, test: 10 })
  })), 
  fineTuningController.exportDataset
);

/**
 * @route   GET /api/ai-tools/fine-tuning/exports
 * @desc    Get export history
 * @access  Private
 */
router.get('/exports', 
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }), 'query'), 
  fineTuningController.getExportHistory
);

/**
 * @route   POST /api/ai-tools/fine-tuning/feedback/:alertId
 * @desc    Submit human feedback for an alert
 * @access  Private
 */
// Middleware to clean null values from request body
const cleanNullValues = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === null) {
        delete req.body[key];
      }
    });
  }
  next();
};

router.post('/feedback/:alertId', 
  validate(Joi.object({
    alertId: Joi.string().uuid().required()
  }), 'params'),
  cleanNullValues, // Clean null values before validation
  validate(Joi.object({
    securityEventTypeCorrect: Joi.boolean().optional(),
    eventTagsCorrect: Joi.boolean().optional(),
    riskAssessmentCorrect: Joi.boolean().optional(),
    recommendedActionsCorrect: Joi.boolean().optional(),
    overallConfidence: Joi.number().integer().min(1).max(10).required(),
    comments: Joi.string().max(1000).allow('').optional(),
    correctedSecurityEventType: Joi.string().optional(),
    correctedEventTags: Joi.array().items(Joi.string()).optional()
  })), 
  fineTuningController.submitFeedback
);

/**
 * @route   DELETE /api/ai-tools/fine-tuning/feedback/:alertId
 * @desc    Clear human feedback for an alert
 * @access  Private
 */
router.delete('/feedback/:alertId', 
  validate(Joi.object({
    alertId: Joi.string().uuid().required()
  }), 'params'),
  fineTuningController.clearFeedback
);

/**
 * @route   GET /api/ai-tools/fine-tuning/quality-metrics
 * @desc    Get feedback quality metrics
 * @access  Private
 */
router.get('/quality-metrics', 
  validate(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }), 'query'), 
  fineTuningController.getQualityMetrics
);

module.exports = router;