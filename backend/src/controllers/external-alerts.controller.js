const { models } = require('../database/models');
const { asyncHandler, ValidationError } = require('../middleware/error.middleware');
const notificationService = require('../services/notificationService');

/**
 * Create alert via external API
 * POST /api/external/alerts
 * Requires API key authentication
 */
const createExternalAlert = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId; // Set by API key middleware
  
  const {
    title,
    description,
    severity,
    sourceSystem,
    eventTime,
    assetName,
    assetId,
    category = 'external',
    status = 'new',
    rawData,
    enrichmentData,
    metadata = {}
  } = req.body;

  // Create alert data structure
  const alertData = {
    title: title.trim(),
    description: description.trim(),
    severity: parseInt(severity),
    sourceSystem: sourceSystem.trim(),
    eventTime: eventTime ? new Date(eventTime) : new Date(),
    assetName: assetName || 'External System',
    assetId: assetId || null,
    category: category.trim(),
    status,
    organizationId,
    rawData: rawData || {},
    enrichmentData: enrichmentData || {},
    metadata: {
      ...metadata,
      createdViaApi: true,
      apiKeyId: req.apiAuth.apiKey.id,
      apiKeyName: req.apiAuth.apiKey.name,
      externalSource: true,
      clientIp: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    },
    // Mark as external integration data
    isTestData: false
  };

  try {
    // Create the alert
    const alert = await models.Alert.create(alertData);

    // Create alert timeline event
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'alert_created',
      title: 'Alert Created via API',
      description: `Alert "${alert.title}" was created via external API using API key: ${req.apiAuth.apiKey.name}`,
      userId: null, // No user for API-created alerts
      userName: `API: ${req.apiAuth.apiKey.name}`,
      metadata: {
        severity: alert.severity,
        sourceSystem: alert.sourceSystem,
        assetName: alert.assetName,
        apiKeyId: req.apiAuth.apiKey.id,
        apiKeyName: req.apiAuth.apiKey.name,
        externalSource: true
      },
    });

    // Get the created alert (without associations for external API)
    const createdAlert = await models.Alert.findByPk(alert.id);

    // Create notification for the alert (async, don't wait)
    setImmediate(() => {
      notificationService.createFromAlert(createdAlert).catch(error => {
        console.error('Failed to create notification for external alert:', error);
      });
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      alert: {
        id: createdAlert.id,
        title: createdAlert.title,
        description: createdAlert.description,
        severity: createdAlert.severity,
        status: createdAlert.status,
        sourceSystem: createdAlert.sourceSystem,
        eventTime: createdAlert.eventTime,
        assetName: createdAlert.assetName,
        category: createdAlert.category,
        createdAt: createdAlert.createdAt
      },
      // Include useful information for the external system
      integration: {
        alertUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts/${createdAlert.id}`,
        apiKeyName: req.apiAuth.apiKey.name,
        organizationId: organizationId
      }
    });

  } catch (error) {
    console.error('Failed to create external alert:', error);
    
    if (error.name === 'SequelizeValidationError') {
      throw new ValidationError(`Invalid alert data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new ValidationError('Invalid asset ID or organization reference');
    }
    
    throw error;
  }
});

/**
 * Get alert status via external API
 * GET /api/external/alerts/:id/status
 * Requires API key authentication
 */
const getExternalAlertStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  const alert = await models.Alert.findOne({
    where: { id, organizationId },
    attributes: ['id', 'title', 'status', 'severity', 'eventTime', 'updatedAt']
  });

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found',
      message: 'Alert not found or does not belong to your organization'
    });
  }

  res.status(200).json({
    success: true,
    alert: {
      id: alert.id,
      title: alert.title,
      status: alert.status,
      severity: alert.severity,
      eventTime: alert.eventTime,
      lastUpdated: alert.updatedAt
    }
  });
});

/**
 * Health check for external API
 * GET /api/external/health
 * Requires API key authentication
 */
const externalHealthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'External API is operational',
    timestamp: new Date().toISOString(),
    apiKey: {
      id: req.apiAuth.apiKey.id,
      name: req.apiAuth.apiKey.name,
      permissions: req.apiAuth.permissions
    },
    organization: {
      id: req.apiAuth.organization.id,
      name: req.apiAuth.organization.name
    },
    rateLimit: {
      windowMs: process.env.API_KEY_RATE_LIMIT_WINDOW_MS || '60000',
      maxRequests: process.env.API_KEY_RATE_LIMIT_MAX_REQUESTS || '30'
    }
  });
});

/**
 * Get external API documentation/help
 * GET /api/external/help
 * Public endpoint (no auth required)
 */
const getExternalApiHelp = asyncHandler(async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.status(200).json({
    name: 'OpenSOC External Integration API',
    version: '1.0.0',
    description: 'API for external systems to create and manage security alerts',
    authentication: {
      type: 'API Key',
      headers: [
        'Authorization: Bearer YOUR_API_KEY',
        'Authorization: YOUR_API_KEY',
        'X-API-Key: YOUR_API_KEY'
      ]
    },
    endpoints: {
      createAlert: {
        method: 'POST',
        url: `${baseUrl}/api/external/alerts`,
        description: 'Create a new security alert',
        requiredFields: ['title', 'description', 'severity', 'sourceSystem'],
        optionalFields: ['eventTime', 'assetName', 'assetId', 'category', 'rawData', 'enrichmentData']
      },
      getAlertStatus: {
        method: 'GET',
        url: `${baseUrl}/api/external/alerts/{id}/status`,
        description: 'Get the current status of an alert'
      },
      healthCheck: {
        method: 'GET',
        url: `${baseUrl}/api/external/health`,
        description: 'Check API health and authentication'
      }
    },
    examples: {
      createAlert: {
        url: `${baseUrl}/api/external/alerts`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: {
          title: 'Suspicious Login Detected',
          description: 'Multiple failed login attempts detected from IP 192.168.1.100',
          severity: 3,
          sourceSystem: 'Authentication System',
          eventTime: '2024-01-15T10:30:00Z',
          assetName: 'Login Server',
          category: 'authentication',
          rawData: {
            ip: '192.168.1.100',
            failedAttempts: 5,
            username: 'admin'
          }
        }
      }
    },
    rateLimits: {
      requests: `${process.env.API_KEY_RATE_LIMIT_MAX_REQUESTS || '30'} requests`,
      window: `${parseInt(process.env.API_KEY_RATE_LIMIT_WINDOW_MS || '60000') / 1000} seconds`
    },
    support: {
      documentation: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/integration`,
      contact: 'Contact your system administrator for API key management'
    }
  });
});

module.exports = {
  createExternalAlert,
  getExternalAlertStatus,
  externalHealthCheck,
  getExternalApiHelp
};