const Joi = require('joi');

/**
 * Create validation middleware for request body, query, or params
 * @param {Object} schema - Joi validation schema
 * @param {string} target - 'body', 'query', or 'params'
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
        details: validationErrors,
      });
    }

    // Replace the original data with validated/sanitized data
    req[target] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Authentication schemas
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(6).max(128).required(),
  }),

  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    firstName: Joi.string().min(1).max(100),
    lastName: Joi.string().min(1).max(100),
    role: Joi.string().valid('admin', 'analyst', 'viewer').default('viewer'),
  }),

  // User management schemas
  updateUser: Joi.object({
    email: Joi.string().email(),
    firstName: Joi.string().min(1).max(100),
    lastName: Joi.string().min(1).max(100),
    role: Joi.string().valid('admin', 'analyst', 'viewer'),
    isActive: Joi.boolean(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  }),

  // Alert schemas
  createAlert: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    severity: Joi.number().integer().min(1).max(5).required(),
    sourceSystem: Joi.string().min(1).max(100).required(),
    eventTime: Joi.date().required(),
    assetId: Joi.string().uuid(),
    assetName: Joi.string().max(255),
    rawData: Joi.object(),
    enrichmentData: Joi.object(),
    assignedAgent: Joi.string().max(100),
    isTestData: Joi.boolean().default(false),
  }),

  updateAlert: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    severity: Joi.number().integer().min(1).max(5),
    status: Joi.string().valid('new', 'incident_likely', 'analysis_uncertain', 'review_required', 'investigating', 'resolved', 'false_positive'),
    assignedAgent: Joi.string().max(100),
    enrichmentData: Joi.object(),
    triageRemarks: Joi.object(),
  }),

  // Incident schemas
  createIncident: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    severity: Joi.number().integer().min(1).max(5).required(),
    category: Joi.string().valid('malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat', 'phishing', 'dos_attack', 'privilege_escalation', 'data_loss', 'exploit'),
    assignedTo: Joi.string().uuid().allow(null, ''),
    assignedToName: Joi.string().max(255).allow(null),
    alertIds: Joi.array().items(Joi.string().uuid()),
    metadata: Joi.object(),
  }),

  updateIncident: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    severity: Joi.number().integer().min(1).max(5),
    status: Joi.string().valid('open', 'investigating', 'contained', 'resolved'),
    category: Joi.string().valid('malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat', 'phishing', 'dos_attack', 'privilege_escalation', 'data_loss', 'exploit'),
    assignedTo: Joi.string().uuid().allow(null, ''),
    assignedToName: Joi.string().max(255).allow(null),
    alertIds: Joi.array().items(Joi.string().uuid()),
    metadata: Joi.object(),
  }),

  // Timeline event schemas
  createTimelineEvent: Joi.object({
    type: Joi.string().valid('alert', 'action', 'note', 'status_change', 'escalation').required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
  }),

  // Asset schemas
  createAsset: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    assetType: Joi.string().valid('server', 'workstation', 'network_device', 'mobile_device', 'iot_device', 'virtual_machine', 'container', 'cloud_service').required(),
    ipAddress: Joi.string().ip(),
    hostname: Joi.string().max(255),
    os: Joi.string().max(255),
    osVersion: Joi.string().max(255),
    criticality: Joi.number().integer().min(1).max(5),
    metadata: Joi.object(),
    location: Joi.string().max(255),
    owner: Joi.string().max(255),
  }),

  updateAsset: Joi.object({
    name: Joi.string().min(1).max(255),
    assetType: Joi.string().valid('server', 'workstation', 'network_device', 'mobile_device', 'iot_device', 'virtual_machine', 'container', 'cloud_service'),
    ipAddress: Joi.string().ip(),
    hostname: Joi.string().max(255),
    os: Joi.string().max(255),
    osVersion: Joi.string().max(255),
    criticality: Joi.number().integer().min(1).max(5),
    metadata: Joi.object(),
    isActive: Joi.boolean(),
    status: Joi.string().valid('online', 'offline', 'maintenance', 'compromised'),
    vulnerabilityCount: Joi.number().integer().min(0),
    riskScore: Joi.number().integer().min(0).max(100),
    location: Joi.string().max(255),
    owner: Joi.string().max(255),
  }),

  // Query parameter schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  alertFilters: Joi.object({
    severity: Joi.alternatives().try(
      Joi.number().integer().min(1).max(5),
      Joi.array().items(Joi.number().integer().min(1).max(5))
    ),
    status: Joi.alternatives().try(
      Joi.string().valid('new', 'incident_likely', 'analysis_uncertain', 'review_required', 'investigating', 'resolved', 'false_positive'),
      Joi.array().items(Joi.string().valid('new', 'incident_likely', 'analysis_uncertain', 'review_required', 'investigating', 'resolved', 'false_positive'))
    ),
    sourceSystem: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    assetId: Joi.string().uuid(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    search: Joi.string().max(255),
  }),

  incidentFilters: Joi.object({
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
  }),

  // UUID param validation
  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // Alert playbook params validation (id + playbookId)
  alertPlaybookParams: Joi.object({
    id: Joi.string().uuid().required(),
    playbookId: Joi.string().uuid().required(),
  }),

  // Alert timeline event params validation (id + eventId)
  alertTimelineEventParams: Joi.object({
    id: Joi.string().uuid().required(),
    eventId: Joi.string().uuid().required(),
  }),

  // Combined schemas
  alertsQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().default('eventTime'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    severity: Joi.alternatives().try(
      Joi.number().integer().min(1).max(5),
      Joi.array().items(Joi.number().integer().min(1).max(5))
    ),
    status: Joi.alternatives().try(
      Joi.string().valid('new', 'incident_likely', 'analysis_uncertain', 'review_required', 'investigating', 'resolved', 'false_positive'),
      Joi.array().items(Joi.string().valid('new', 'incident_likely', 'analysis_uncertain', 'review_required', 'investigating', 'resolved', 'false_positive'))
    ),
    sourceSystem: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    assetId: Joi.string().uuid(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    search: Joi.string().max(255),
  }),
};

module.exports = {
  validate,
  schemas,
};