const express = require('express');
const router = express.Router();
const embeddingsController = require('../controllers/embeddings.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/embeddings/status
 * @desc    Get embedding status for all tables
 * @access  Private
 */
router.get('/status', embeddingsController.getEmbeddingStatus);

/**
 * @route   GET /api/embeddings/stats
 * @desc    Get detailed RAG statistics
 * @access  Private
 */
router.get('/stats', embeddingsController.getRAGStats);

/**
 * @route   POST /api/embeddings/generate
 * @desc    Generate embeddings for a specific table
 * @access  Private
 */
router.post('/generate', [
  body('modelType')
    .isIn(['alert', 'incident', 'asset', 'ioc', 'playbook'])
    .withMessage('Model type must be one of: alert, incident, asset, ioc, playbook'),
  body('batchSize')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Batch size must be between 1 and 500'),
  body('forceUpdate')
    .optional()
    .isBoolean()
    .withMessage('Force update must be a boolean'),
  handleValidationErrors
], embeddingsController.generateEmbeddings);

/**
 * @route   POST /api/embeddings/generate-all
 * @desc    Generate embeddings for all tables
 * @access  Private
 */
router.post('/generate-all', [
  body('batchSize')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Batch size must be between 1 and 500'),
  handleValidationErrors
], embeddingsController.generateAllEmbeddings);

/**
 * @route   POST /api/embeddings/test
 * @desc    Test embedding generation with sample text
 * @access  Private
 */
router.post('/test', [
  body('text')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Text must be between 1 and 1000 characters'),
  handleValidationErrors
], embeddingsController.testEmbedding);

/**
 * @route   POST /api/embeddings/search
 * @desc    Search for similar content using embeddings
 * @access  Private
 */
router.post('/search', [
  body('query')
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  body('dataSources')
    .optional()
    .isArray()
    .withMessage('Data sources must be an array'),
  body('dataSources.*')
    .optional()
    .isIn(['alerts', 'incidents', 'assets', 'iocs', 'playbooks'])
    .withMessage('Invalid data source'),
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max results must be between 1 and 50'),
  body('similarityThreshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Similarity threshold must be between 0 and 1'),
  handleValidationErrors
], embeddingsController.semanticSearch);

/**
 * @route   POST /api/embeddings/initialize
 * @desc    Initialize embedding model
 * @access  Private
 */
router.post('/initialize', embeddingsController.initializeModel);

module.exports = router;