const { models, sequelize } = require('../database/models');
const { Op } = require('sequelize');

/**
 * Alert Statistics Service
 * Provides comprehensive statistics and analytics for alerts
 */
class AlertStatsService {
  
  /**
   * Get comprehensive alert statistics for a given timeframe
   * @param {string} organizationId - Organization ID to filter by
   * @param {number} days - Number of days to look back (default: 7)
   * @returns {Object} Comprehensive alert statistics
   */
  async getAlertStatistics(organizationId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get various statistics in parallel for performance
    const [
      totalAlerts,
      severityStats,
      statusStats,
      sourceSystemStats,
      timeSeriesData
    ] = await Promise.all([
      this._getTotalAlerts(organizationId, startDate),
      this._getSeverityBreakdown(organizationId, startDate),
      this._getStatusBreakdown(organizationId, startDate), 
      this._getSourceSystemBreakdown(organizationId, startDate),
      this._getTimeSeriesData(organizationId, startDate)
    ]);

    return {
      totalAlerts,
      severityBreakdown: this._formatSeverityStats(severityStats),
      statusBreakdown: this._formatStatusStats(statusStats),
      topSources: this._formatSourceSystemStats(sourceSystemStats),
      timeSeriesData: this._formatTimeSeriesData(timeSeriesData),
    };
  }

  /**
   * Get total alert count for the timeframe
   * @private
   */
  async _getTotalAlerts(organizationId, startDate) {
    return await models.Alert.count({
      where: {
        organizationId,
        createdAt: { [Op.gte]: startDate }
      }
    });
  }

  /**
   * Get alert count breakdown by severity level
   * @private  
   */
  async _getSeverityBreakdown(organizationId, startDate) {
    return await models.Alert.findAll({
      where: {
        organizationId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'severity',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      raw: true,
    });
  }

  /**
   * Get alert count breakdown by status
   * @private
   */
  async _getStatusBreakdown(organizationId, startDate) {
    return await models.Alert.findAll({
      where: {
        organizationId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true,
    });
  }

  /**
   * Get alert count breakdown by source system (top 10)
   * @private
   */
  async _getSourceSystemBreakdown(organizationId, startDate) {
    return await models.Alert.findAll({
      where: {
        organizationId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'sourceSystem',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sourceSystem'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
    });
  }

  /**
   * Get daily time series data for alerts
   * @private
   */
  async _getTimeSeriesData(organizationId, startDate) {
    return await models.Alert.findAll({
      where: {
        organizationId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });
  }

  /**
   * Format severity statistics for API response
   * @private
   */
  _formatSeverityStats(severityStats) {
    return severityStats.map(stat => ({
      severity: parseInt(stat.severity),
      count: parseInt(stat.count),
    }));
  }

  /**
   * Format status statistics for API response  
   * @private
   */
  _formatStatusStats(statusStats) {
    return statusStats.map(stat => ({
      status: stat.status,
      count: parseInt(stat.count),
    }));
  }

  /**
   * Format source system statistics for API response
   * @private  
   */
  _formatSourceSystemStats(sourceSystemStats) {
    return sourceSystemStats.map(stat => ({
      sourceSystem: stat.sourceSystem,
      count: parseInt(stat.count),
    }));
  }

  /**
   * Format time series data for API response
   * @private
   */
  _formatTimeSeriesData(timeSeriesData) {
    return timeSeriesData.map(stat => ({
      date: stat.date,
      count: parseInt(stat.count),
    }));
  }

  /**
   * Get advanced alert statistics including trends and insights
   * @param {string} organizationId - Organization ID
   * @param {number} days - Number of days to analyze  
   * @returns {Object} Advanced statistics with trends
   */
  async getAdvancedStatistics(organizationId, days = 30) {
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - parseInt(days));
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(days));

    const [currentStats, previousStats] = await Promise.all([
      this._getTotalAlerts(organizationId, currentPeriodStart),
      this._getTotalAlerts(organizationId, previousPeriodStart)
    ]);

    // Calculate trend
    const trend = previousStats > 0 ? 
      ((currentStats - previousStats) / previousStats * 100).toFixed(1) : 
      '0.0';

    return {
      currentPeriodTotal: currentStats,
      previousPeriodTotal: previousStats,
      trendPercentage: parseFloat(trend),
      trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
    };
  }

  /**
   * Get real-time alert metrics for dashboard
   * @param {string} organizationId - Organization ID
   * @returns {Object} Real-time metrics
   */
  async getRealtimeMetrics(organizationId) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      todayCount,
      activeCount, 
      highSeverityCount,
      criticalCount
    ] = await Promise.all([
      models.Alert.count({
        where: {
          organizationId,
          createdAt: { [Op.gte]: today }
        }
      }),
      models.Alert.count({
        where: {
          organizationId,
          status: { [Op.in]: ['open', 'investigating', 'acknowledged'] }
        }
      }),
      models.Alert.count({
        where: {
          organizationId,
          severity: { [Op.gte]: 3 },
          status: { [Op.ne]: 'resolved' }
        }
      }),
      models.Alert.count({
        where: {
          organizationId,
          severity: { [Op.gte]: 4 },
          status: { [Op.ne]: 'resolved' }
        }
      })
    ]);

    return {
      todayAlerts: todayCount,
      activeAlerts: activeCount,
      highSeverityActive: highSeverityCount,
      criticalActive: criticalCount,
      timestamp: new Date()
    };
  }
}

module.exports = new AlertStatsService();