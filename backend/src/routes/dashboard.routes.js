const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', 
  authMiddleware,
  dashboardController.getDashboardStats
);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get recent alerts
 * @access  Private
 */
router.get('/alerts', 
  authMiddleware,
  dashboardController.getRecentAlerts
);

/**
 * @route   GET /api/dashboard/incidents
 * @desc    Get recent incidents
 * @access  Private
 */
router.get('/incidents', 
  authMiddleware,
  dashboardController.getRecentIncidents
);

/**
 * @route   GET /api/dashboard/alert-trends
 * @desc    Get alert trends by severity
 * @access  Private
 */
router.get('/alert-trends', 
  authMiddleware,
  dashboardController.getAlertTrends
);

/**
 * @route   GET /api/dashboard/response-metrics
 * @desc    Get response metrics and incident distribution
 * @access  Private
 */
router.get('/response-metrics', 
  authMiddleware,
  dashboardController.getResponseMetrics
);

/**
 * @route   GET /api/dashboard/team-performance
 * @desc    Get team performance statistics
 * @access  Private
 */
router.get('/team-performance', 
  authMiddleware,
  dashboardController.getTeamPerformance
);

/**
 * @route   GET /api/dashboard/ai-agents-status
 * @desc    Get AI agents status
 * @access  Private
 */
router.get('/ai-agents-status', 
  authMiddleware,
  dashboardController.getAIAgentsStatus
);

/**
 * @route   GET /api/dashboard/incident-trends
 * @desc    Get incident trends by status and severity
 * @access  Private
 */
router.get('/incident-trends', 
  authMiddleware,
  dashboardController.getIncidentTrends
);

module.exports = router;