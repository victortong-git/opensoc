const express = require('express');
const router = express.Router();
const {
  getPlaybooks,
  getPlaybook,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  executePlaybook,
  getPlaybookStats,
  getPlaybookTemplates,
  enhancePlaybook,
  reviewPlaybook,
} = require('../controllers/playbooks.controller');

// Import auth middleware
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/playbooks
 * @desc    Get all playbooks with filtering and pagination
 * @access  Private
 * @params  Query: page, limit, sortBy, sortOrder, category, isActive, triggerType, search
 */
router.get('/', getPlaybooks);

/**
 * @route   GET /api/playbooks/stats
 * @desc    Get playbook statistics
 * @access  Private
 */
router.get('/stats', getPlaybookStats);

/**
 * @route   GET /api/playbooks/templates
 * @desc    Get playbook templates
 * @access  Private
 */
router.get('/templates', getPlaybookTemplates);

/**
 * @route   GET /api/playbooks/:id
 * @desc    Get single playbook by ID
 * @access  Private
 */
router.get('/:id', getPlaybook);

/**
 * @route   POST /api/playbooks
 * @desc    Create new playbook
 * @access  Private (admin or soc_lead)
 */
router.post('/', requireRole(['admin', 'soc_lead']), createPlaybook);

/**
 * @route   PUT /api/playbooks/:id
 * @desc    Update playbook
 * @access  Private (admin or soc_lead)
 */
router.put('/:id', requireRole(['admin', 'soc_lead']), updatePlaybook);

/**
 * @route   POST /api/playbooks/:id/execute
 * @desc    Execute playbook
 * @access  Private (admin, soc_lead, or analyst)
 */
router.post('/:id/execute', requireRole(['admin', 'soc_lead', 'analyst']), executePlaybook);

/**
 * @route   POST /api/playbooks/:id/enhance
 * @desc    AI-powered playbook enhancement analysis
 * @access  Private (admin, soc_lead, or analyst)
 */
router.post('/:id/enhance', requireRole(['admin', 'soc_lead', 'analyst']), enhancePlaybook);

/**
 * @route   POST /api/playbooks/:id/review
 * @desc    AI-powered playbook security and compliance review
 * @access  Private (admin, soc_lead, or analyst)
 */
router.post('/:id/review', requireRole(['admin', 'soc_lead', 'analyst']), reviewPlaybook);

/**
 * @route   DELETE /api/playbooks/:id
 * @desc    Delete playbook
 * @access  Private (admin only)
 */
router.delete('/:id', requireRole(['admin']), deletePlaybook);

module.exports = router;