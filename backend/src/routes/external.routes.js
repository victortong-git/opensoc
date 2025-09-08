const express = require('express');
const router = express.Router();

const externalAlertsController = require('../controllers/external-alerts.controller');
const { 
  apiKeyAuth, 
  requireApiKeyPermission, 
  apiKeyRateLimit, 
  apiKeyLogger, 
  validateExternalAlert 
} = require('../middleware/api-key-auth.middleware');

/**
 * Public documentation endpoint (no auth required)
 * @route   GET /api/external/help
 * @desc    Get API documentation and examples
 * @access  Public
 */
router.get('/help', externalAlertsController.getExternalApiHelp);

/**
 * Apply API key authentication and logging to all protected routes
 */
router.use([
  '/alerts*',
  '/health'
], apiKeyAuth, apiKeyLogger, apiKeyRateLimit);

/**
 * @route   GET /api/external/health
 * @desc    Health check with API key validation
 * @access  API Key Required
 */
router.get('/health', externalAlertsController.externalHealthCheck);

/**
 * @route   POST /api/external/alerts
 * @desc    Create new alert via external API
 * @access  API Key Required (create_alerts permission)
 */
router.post('/alerts', 
  requireApiKeyPermission('create_alerts'),
  validateExternalAlert,
  externalAlertsController.createExternalAlert
);

/**
 * @route   GET /api/external/alerts/:id/status
 * @desc    Get alert status
 * @access  API Key Required (read_alerts permission, falls back to create_alerts)
 */
router.get('/alerts/:id/status', 
  // Allow either read_alerts or create_alerts permission for status checking
  (req, res, next) => {
    const hasReadPermission = req.apiAuth?.permissions.includes('read_alerts');
    const hasCreatePermission = req.apiAuth?.permissions.includes('create_alerts');
    
    if (!hasReadPermission && !hasCreatePermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'API key requires either read_alerts or create_alerts permission',
        availablePermissions: req.apiAuth?.permissions || []
      });
    }
    
    next();
  },
  externalAlertsController.getExternalAlertStatus
);

module.exports = router;