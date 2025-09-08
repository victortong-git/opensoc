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
  body('enabledTools')
    .optional()
    .isArray()
    .withMessage('Enabled tools must be an array'),
  body('enabledTools.*')
    .optional()
    .isString()
    .withMessage('Each enabled tool must be a string'),
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
 * @route   PUT /api/chat/conversations/:id
 * @desc    Update conversation (title, archive status)
 * @access  Private
 */
router.put('/conversations/:id', [
  param('id')
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  body('title')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
  handleValidationErrors
], chatController.updateConversation);

/**
 * @route   POST /api/chat/conversations/:id/clear-session
 * @desc    Clear session memory for a conversation
 * @access  Private
 */
router.post('/conversations/:id/clear-session', [
  param('id')
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  handleValidationErrors
], chatController.clearSessionMemory);

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
  body('settings.enabledTools')
    .optional()
    .isArray()
    .withMessage('Enabled tools must be an array'),
  body('settings.enabledTools.*')
    .optional()
    .isString()
    .withMessage('Each enabled tool must be a string'),
  handleValidationErrors
], chatController.updateConversationSettings);

/**
 * @route   GET /api/chat/tools/available
 * @desc    Get available AI tools
 * @access  Private
 */
router.get('/tools/available', chatController.getAvailableTools);

/**
 * @route   GET /api/chat/stats
 * @desc    Get chat statistics
 * @access  Private
 */
router.get('/stats', chatController.getChatStats);

module.exports = router;