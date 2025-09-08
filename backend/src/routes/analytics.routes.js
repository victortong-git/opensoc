const express = require('express');
const Joi = require('joi');
const {
  getDashboardMetrics,
  getAlertTrends,
  getSecurityComparison,
  getPerformanceMetrics,
} = require('../controllers/analytics.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard metrics and statistics
 * @access  Private
 */
router.get('/dashboard',
  getDashboardMetrics
);

/**
 * @route   GET /api/analytics/alerts/trends
 * @desc    Get alert trend analysis with time-based grouping
 * @access  Private
 * @query   period (24h, 7d, 30d, 90d), groupBy (hour, day, week)
 */
router.get('/alerts/trends',
  getAlertTrends
);

/**
 * @route   GET /api/analytics/security/comparison
 * @desc    Get security metrics comparison between periods
 * @access  Private  
 * @query   currentPeriod (24h, 7d, 30d), previousPeriod (24h, 7d, 30d)
 */
router.get('/security/comparison',
  getSecurityComparison
);

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance metrics including MTTR and system health
 * @access  Private
 */
router.get('/performance',
  getPerformanceMetrics
);

module.exports = router;