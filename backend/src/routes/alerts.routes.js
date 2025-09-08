const express = require('express');
const Joi = require('joi');
const router = express.Router();

const alertsController = require('../controllers/alerts.controller');
const alertPlaybooksController = require('../controllers/alertPlaybooks.controller');
const orchestrationController = require('../controllers/orchestration.controller');
const { authMiddleware, requireAnalyst, requireAdmin } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authMiddleware,
  validate(schemas.alertsQuery, 'query'),
  alertsController.getAlerts
);

/**
 * @route   GET /api/alerts/stats
 * @desc    Get alert statistics
 * @access  Private
 */
router.get('/stats', 
  authMiddleware,
  alertsController.getAlertStats
);

/**
 * @route   GET /api/alerts/:id
 * @desc    Get single alert by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.getAlert
);

/**
 * @route   POST /api/alerts
 * @desc    Create new alert
 * @access  Private (Analyst+)
 */
router.post('/', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.createAlert),
  alertsController.createAlert
);

/**
 * @route   PUT /api/alerts/:id
 * @desc    Update alert
 * @access  Private (Analyst+)
 */
router.put('/:id', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  validate(schemas.updateAlert),
  alertsController.updateAlert
);

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete alert
 * @access  Private (Analyst+)
 */
router.delete('/:id', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertsController.deleteAlert
);

/**
 * @route   PUT /api/alerts/bulk
 * @desc    Bulk update alerts
 * @access  Private (Analyst+)
 */
router.put('/bulk', 
  authMiddleware,
  requireAnalyst,
  alertsController.bulkUpdateAlerts
);

/**
 * @route   POST /api/alerts/:id/resolve
 * @desc    Resolve alert
 * @access  Private (Analyst+)
 */
router.post('/:id/resolve', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertsController.resolveAlert
);

/**
 * @route   POST /api/alerts/:id/escalate
 * @desc    Escalate alert to incident
 * @access  Private (Analyst+)
 */
router.post('/:id/escalate', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertsController.escalateAlert
);

/**
 * @route   POST /api/alerts/:id/ai-analysis
 * @desc    Get AI analysis for alert
 * @access  Private
 */
router.post('/:id/ai-analysis', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.analyzeAlert
);

/**
 * @route   POST /api/alerts/:id/ai-classification
 * @desc    Get comprehensive AI classification including tags and event type
 * @access  Private
 */
router.post('/:id/ai-classification', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.aiClassification
);

/**
 * @route   POST /api/alerts/:id/ai-generate-incident-form
 * @desc    AI generate incident form data from alert and analysis
 * @access  Private
 */
router.post('/:id/ai-generate-incident-form', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.aiGenerateIncidentForm
);

/**
 * @route   POST /api/alerts/proof-read
 * @desc    AI proof read incident form text fields
 * @access  Private
 */
router.post('/proof-read', 
  authMiddleware,
  alertsController.proofReadIncidentFields
);

/**
 * @route   GET /api/alerts/:id/incidents
 * @desc    Get incidents created from this alert (reverse lookup)
 * @access  Private
 */
router.get('/:id/incidents', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.getAlertIncidents
);

/**
 * @route   GET /api/alerts/:id/timeline
 * @desc    Get alert timeline events
 * @access  Private
 */
router.get('/:id/timeline', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.getAlertTimeline
);

/**
 * @route   DELETE /api/alerts/:id/timeline/:eventId
 * @desc    Delete a timeline event (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id/timeline/:eventId', 
  authMiddleware,
  requireAdmin,
  validate(schemas.alertTimelineEventParams, 'params'),
  alertsController.deleteTimelineEvent
);

/**
 * @route   GET /api/alerts/:id/incident-confirmation
 * @desc    Get incident confirmation details for alert
 * @access  Private
 */
router.get('/:id/incident-confirmation', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertsController.getIncidentConfirmation
);

/**
 * @route   PUT /api/alerts/:id/incident-confirmation
 * @desc    Update incident confirmation details for alert
 * @access  Private (Analyst+)
 */
router.put('/:id/incident-confirmation', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertsController.updateIncidentConfirmation
);

/**
 * @route   POST /api/alerts/:id/generate-playbooks
 * @desc    Generate AI-powered playbooks for alert (Immediate Action & Investigation)
 * @access  Private (Analyst+)
 */
router.post('/:id/generate-playbooks', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.generatePlaybooks
);

/**
 * @route   POST /api/alerts/:id/generate-immediate-playbook
 * @desc    Generate or update AI-powered immediate action playbook for alert
 * @access  Private (Analyst+)
 */
router.post('/:id/generate-immediate-playbook', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.generateImmediatePlaybook
);

/**
 * @route   POST /api/alerts/:id/generate-investigation-playbook
 * @desc    Generate or update AI-powered investigation playbook for alert
 * @access  Private (Analyst+)
 */
router.post('/:id/generate-investigation-playbook', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.generateInvestigationPlaybook
);

/**
 * @route   GET /api/alerts/:id/playbooks
 * @desc    Get generated playbooks for alert
 * @access  Private
 */
router.get('/:id/playbooks', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.getAlertPlaybooks
);

/**
 * @route   DELETE /api/alerts/:id/playbooks
 * @desc    Delete generated playbooks for alert
 * @access  Private (Analyst+)
 */
router.delete('/:id/playbooks', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.deleteAlertPlaybooks
);

/**
 * @route   GET /api/alerts/:id/playbooks/status
 * @desc    Get playbook generation status for alert
 * @access  Private
 */
router.get('/:id/playbooks/status', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.getPlaybookGenerationStatus
);

/**
 * @route   GET /api/alerts/:id/playbooks/preview
 * @desc    Preview playbook generation context (debugging/validation)
 * @access  Private
 */
router.get('/:id/playbooks/preview', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  alertPlaybooksController.previewPlaybookContext
);

/**
 * @route   GET /api/alerts/:id/playbooks/:playbookId/export-pdf
 * @desc    Export playbook as PDF for external sharing
 * @access  Private (Analyst+)
 */

router.get('/:id/playbooks/:playbookId/export-pdf', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.alertPlaybookParams, 'params'),
  alertPlaybooksController.exportPlaybookPDF
);

/**
 * @route   POST /api/alerts/:id/orchestration
 * @desc    Execute comprehensive orchestration and automation analysis
 * @access  Private (Analyst+)
 */
router.post('/:id/orchestration', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.executeOrchestrationAnalysis
);

/**
 * @route   GET /api/alerts/:id/orchestration
 * @desc    Get orchestration analysis results for alert
 * @access  Private
 */
router.get('/:id/orchestration', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.getOrchestrationResults
);

/**
 * @route   DELETE /api/alerts/:id/orchestration
 * @desc    Delete orchestration results (for re-analysis)
 * @access  Private (Analyst+)
 */
router.delete('/:id/orchestration', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.deleteOrchestrationResults
);

/**
 * @route   POST /api/alerts/:id/orchestration-mcp
 * @desc    Execute comprehensive orchestration and automation analysis via MCP protocol
 * @access  Private (Analyst+)
 */
router.post('/:id/orchestration-mcp', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.executeMCPOrchestrationAnalysis
);

/**
 * @route   GET /api/alerts/:id/orchestration-mcp
 * @desc    Get MCP orchestration analysis results for alert
 * @access  Private
 */
router.get('/:id/orchestration-mcp', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.getMCPOrchestrationResults
);

/**
 * @route   DELETE /api/alerts/:id/orchestration-mcp
 * @desc    Delete MCP orchestration results (for re-analysis)
 * @access  Private (Analyst+)
 */
router.delete('/:id/orchestration-mcp', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.deleteMCPOrchestrationResults
);

/**
 * @route   GET /api/alerts/:id/nat-results
 * @desc    Get unified NAT analysis results for alert (regardless of API vs MCP execution method)
 * @access  Private
 */
router.get('/:id/nat-results', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  orchestrationController.getNATResults
);

module.exports = router;