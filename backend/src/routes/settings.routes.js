const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const {
  getSystemSettings,
  updateSystemSetting,
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  getSettingsStats,
  getDataCounts,
  clearData,
} = require('../controllers/settings.controller');

const {
  getApiKeys,
  createApiKey,
  updateApiKey,
  regenerateApiKey,
  deactivateApiKey,
  getApiKeyStats
} = require('../controllers/api-keys.controller');

// Apply authentication middleware to all routes
router.use(requireAuth);

// System Settings routes
router.get('/', getSystemSettings);
router.put('/:id', requireRole(['admin', 'soc_lead']), updateSystemSetting);

// Alert Rules routes
router.get('/alert-rules', getAlertRules);
router.post('/alert-rules', requireRole(['admin', 'soc_lead']), createAlertRule);
router.put('/alert-rules/:id', requireRole(['admin', 'soc_lead']), updateAlertRule);
router.delete('/alert-rules/:id', requireRole(['admin', 'soc_lead']), deleteAlertRule);
router.post('/alert-rules/:id/toggle', requireRole(['admin', 'soc_lead']), toggleAlertRule);

// Statistics routes
router.get('/stats', getSettingsStats);

// Clear Data routes (admin only)
router.get('/data-counts', requireRole(['admin']), getDataCounts);
router.delete('/clear-data/:type', requireRole(['admin']), clearData);

// API Keys routes (admin only - API key management requires highest privileges)
router.get('/api-keys', requireRole(['admin']), getApiKeys);
router.post('/api-keys', requireRole(['admin']), createApiKey);
router.put('/api-keys/:id', requireRole(['admin']), updateApiKey);
router.put('/api-keys/:id/regenerate', requireRole(['admin']), regenerateApiKey);
router.delete('/api-keys/:id', requireRole(['admin']), deactivateApiKey);
router.get('/api-keys/:id/stats', requireRole(['admin']), getApiKeyStats);

module.exports = router;