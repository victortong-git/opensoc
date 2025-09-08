const express = require('express');
const Joi = require('joi');
const router = express.Router();

const incidentsController = require('../controllers/incidents.controller');
const incidentThreatHuntController = require('../controllers/incidentThreatHunt.controller');
const { authMiddleware, requireAnalyst } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// Create incidents query schema
const incidentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  severity: Joi.alternatives().try(
    Joi.number().integer().min(1).max(5),
    Joi.array().items(Joi.number().integer().min(1).max(5))
  ),
  status: Joi.alternatives().try(
    Joi.string().valid('open', 'investigating', 'contained', 'resolved'),
    Joi.array().items(Joi.string().valid('open', 'investigating', 'contained', 'resolved'))
  ),
  category: Joi.alternatives().try(
    Joi.string().valid('malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat'),
    Joi.array().items(Joi.string().valid('malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat'))
  ),
  assignedTo: Joi.string().uuid(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  search: Joi.string().max(255),
});

/**
 * @route   GET /api/incidents
 * @desc    Get all incidents with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authMiddleware,
  validate(incidentsQuerySchema, 'query'),
  incidentsController.getIncidents
);

/**
 * @route   GET /api/incidents/:id
 * @desc    Get single incident by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  incidentsController.getIncident
);

/**
 * @route   POST /api/incidents
 * @desc    Create new incident
 * @access  Private (Analyst+)
 */
router.post('/', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.createIncident),
  incidentsController.createIncident
);

/**
 * @route   PUT /api/incidents/:id
 * @desc    Update incident
 * @access  Private (Analyst+)
 */
router.put('/:id', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  validate(schemas.updateIncident),
  incidentsController.updateIncident
);

/**
 * @route   POST /api/incidents/:id/close
 * @desc    Close incident
 * @access  Private (Analyst+)
 */
router.post('/:id/close', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  validate(Joi.object({ resolution: Joi.string().max(500) })),
  incidentsController.closeIncident
);

/**
 * @route   POST /api/incidents/:id/notes
 * @desc    Add note to incident
 * @access  Private (Analyst+)
 */
router.post('/:id/notes', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  validate(Joi.object({ note: Joi.string().min(1).max(1000).required() })),
  incidentsController.addNote
);

/**
 * @route   POST /api/incidents/:id/timeline
 * @desc    Add timeline event to incident
 * @access  Private (Analyst+)
 */
router.post('/:id/timeline', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  validate(schemas.createTimelineEvent),
  incidentsController.addTimelineEvent
);

/**
 * @route   POST /api/incidents/:id/ai-draft-additional-info
 * @desc    AI draft additional information fields for incident
 * @access  Private (Analyst+)
 */
router.post('/:id/ai-draft-additional-info', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  incidentsController.aiDraftAdditionalInformation
);

/**
 * @route   POST /api/incidents/:id/generate-threat-hunt
 * @desc    Generate threat hunt from incident context
 * @access  Private (Analyst+)
 */
router.post('/:id/generate-threat-hunt', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  incidentThreatHuntController.generateThreatHuntFromIncident
);

/**
 * @route   DELETE /api/incidents/:id
 * @desc    Delete incident
 * @access  Private (Admin+)
 */
router.delete('/:id', 
  authMiddleware,
  requireAnalyst,
  validate(schemas.uuidParam, 'params'),
  incidentsController.deleteIncident
);

/**
 * @route   POST /api/incidents/threat-hunt/proof-read
 * @desc    AI proof-read threat hunt content fields
 * @access  Private (Analyst+)
 */
router.post('/threat-hunt/proof-read', 
  authMiddleware,
  requireAnalyst,
  incidentThreatHuntController.proofReadThreatHuntContent
);

module.exports = router;