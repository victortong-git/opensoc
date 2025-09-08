const express = require('express');
const router = express.Router();
const {
  getAIGenerationLogs,
  getAIGenerationLogById,
  deleteAIGenerationLog,
  getAIGenerationLogsStats,
  cleanupAIGenerationLogs,
} = require('../controllers/ai-generation-logs.controller');

// All routes require authentication
const { requireAuth } = require('../middleware/auth.middleware');
router.use(requireAuth);

/**
 * @route GET /api/ai-generation-logs
 * @desc Get AI generation logs with pagination and filtering
 * @access Private
 */
router.get('/', getAIGenerationLogs);

/**
 * @route GET /api/ai-generation-logs/stats
 * @desc Get AI generation logs statistics
 * @access Private
 */
router.get('/stats', getAIGenerationLogsStats);

/**
 * @route DELETE /api/ai-generation-logs/cleanup
 * @desc Cleanup old AI generation logs
 * @access Private
 */
router.delete('/cleanup', cleanupAIGenerationLogs);

/**
 * @route GET /api/ai-generation-logs/:id
 * @desc Get AI generation log by ID
 * @access Private
 */
router.get('/:id', getAIGenerationLogById);

/**
 * @route DELETE /api/ai-generation-logs/:id
 * @desc Delete AI generation log by ID
 * @access Private
 */
router.delete('/:id', deleteAIGenerationLog);

module.exports = router;