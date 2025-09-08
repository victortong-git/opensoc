const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
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
 * @route   POST /api/chat/message
 * @desc    Send a message to AI SOC Consultant
 * @access  Private
 */
router.post('/message', [
  body('message')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('conversationId')
    .optional()
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  body('ragEnabled')
    .optional()
    .isBoolean()
    .withMessage('RAG enabled must be a boolean'),
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
  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Model must be a string with max 100 characters'),
  handleValidationErrors
], chatController.sendMessage);

/**
 * @route   GET /api/chat/conversations
 * @desc    List user's conversations
 * @access  Private
 */
router.get('/conversations', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], chatController.listConversations);

/**
 * @route   GET /api/chat/conversations/:id
 * @desc    Get conversation history
 * @access  Private
 */
router.get('/conversations/:id', [
  param('id')
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], chatController.getConversation);

/**
 * @route   DELETE /api/chat/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/conversations/:id', [
  param('id')
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  handleValidationErrors
], chatController.deleteConversation);

/**
 * @route   PUT /api/chat/conversations/:id/settings
 * @desc    Update conversation settings
 * @access  Private
 */
router.put('/conversations/:id/settings', [
  param('id')
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  body('ragEnabled')
    .optional()
    .isBoolean()
    .withMessage('RAG enabled must be a boolean'),
  body('dataSources')
    .optional()
    .isArray()
    .withMessage('Data sources must be an array'),
  body('dataSources.*')
    .optional()
    .isIn(['alerts', 'incidents', 'assets', 'iocs', 'playbooks'])
    .withMessage('Invalid data source'),
  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Model must be a string with max 100 characters'),
  handleValidationErrors
], chatController.updateConversationSettings);

/**
 * @route   GET /api/chat/stats
 * @desc    Get chat statistics
 * @access  Private
 */
router.get('/stats', chatController.getChatStats);

module.exports = router;