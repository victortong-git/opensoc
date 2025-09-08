const { models } = require('../../database/models');
const { Op } = require('sequelize');
const sequelize = require('../../database/config/database');

/**
 * Fine-Tuning Statistics Service
 * Handles dataset statistics and metrics for fine-tuning dashboard
 */
class FineTuningStatsService {

  /**
   * Get comprehensive dataset statistics for fine-tuning dashboard
   * @param {string} organizationId - Organization ID
   * @returns {Object} Dataset statistics
   */
  async getDatasetStats(organizationId) {
    try {
      // Get overall alert counts (include test data for development)
      const totalAlerts = await models.Alert.count({
        where: { organizationId }
      });

      // Get human-reviewed alerts (include test data for development)
      const humanReviewedAlerts = await models.Alert.count({
        where: { 
          organizationId, 
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] }
        }
      });

      // Get verified high-quality alerts (include test data for development)
      const verifiedAlerts = await models.Alert.count({
        where: { 
          organizationId, 
          humanReviewStatus: 'verified'
        }
      });

      // Get false positive and resolved counts (include test data for development)
      const falsePositiveAlerts = await models.Alert.count({
        where: { 
          organizationId, 
          status: 'false_positive',
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] }
        }
      });

      const resolvedAlerts = await models.Alert.count({
        where: { 
          organizationId, 
          status: 'resolved',
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] }
        }
      });

      // Get date range of alerts (include test data for development)
      const dateRangeQuery = await models.Alert.findOne({
        where: { organizationId },
        attributes: [
          [sequelize.fn('MIN', sequelize.col('created_at')), 'earliest'],
          [sequelize.fn('MAX', sequelize.col('created_at')), 'latest']
        ],
        raw: true
      });

      // Get confidence-based quality distribution (include test data for development)
      const qualityDistribution = await models.Alert.findAll({
        where: { 
          organizationId, 
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] },
          aiClassificationFeedback: { [Op.ne]: null }
        },
        attributes: [
          [sequelize.literal("CASE WHEN (ai_classification_feedback->>'overallConfidence')::numeric >= 8 THEN 'high' WHEN (ai_classification_feedback->>'overallConfidence')::numeric >= 5 THEN 'medium' ELSE 'low' END"), 'qualityLevel'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.literal("CASE WHEN (ai_classification_feedback->>'overallConfidence')::numeric >= 8 THEN 'high' WHEN (ai_classification_feedback->>'overallConfidence')::numeric >= 5 THEN 'medium' ELSE 'low' END")],
        raw: true
      });

      // Get security event type distribution for human-reviewed alerts (include test data for development)
      const eventTypeDistribution = await models.Alert.findAll({
        where: { 
          organizationId, 
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] },
          securityEventType: { [Op.ne]: null }
        },
        attributes: [
          'securityEventType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['securityEventType'],
        raw: true
      });

      // Get reviewer statistics (include test data for development)
      const reviewerStats = await models.Alert.findAll({
        where: { 
          organizationId, 
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] },
          reviewerUserId: { [Op.ne]: null },
          aiClassificationFeedback: { [Op.ne]: null }
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('reviewer_user_id'))), 'totalReviewers'],
          [sequelize.fn('AVG', sequelize.literal("(ai_classification_feedback->>'overallConfidence')::numeric")), 'avgConfidence']
        ],
        raw: true
      });

      // Format quality distribution results
      const formattedQualityDistribution = {
        high: 0,
        medium: 0,
        low: 0
      };

      qualityDistribution.forEach(item => {
        formattedQualityDistribution[item.qualityLevel] = parseInt(item.count);
      });

      const formattedEventTypeDistribution = {};
      eventTypeDistribution.forEach(item => {
        formattedEventTypeDistribution[item.securityEventType] = parseInt(item.count);
      });

      return {
        totalAlerts,
        humanReviewedAlerts,
        verifiedAlerts,
        falsePositiveAlerts,
        resolvedAlerts,
        dateRange: {
          earliest: dateRangeQuery?.earliest ? new Date(dateRangeQuery.earliest).toISOString().split('T')[0] : null,
          latest: dateRangeQuery?.latest ? new Date(dateRangeQuery.latest).toISOString().split('T')[0] : null
        },
        qualityDistribution: formattedQualityDistribution,
        eventTypeDistribution: formattedEventTypeDistribution,
        reviewerStats: {
          totalReviewers: parseInt(reviewerStats[0]?.totalReviewers || 0),
          avgConfidence: parseFloat(reviewerStats[0]?.avgConfidence || 0)
        }
      };

    } catch (error) {
      console.error('Failed to get dataset stats:', error);
      throw error;
    }
  }
}

module.exports = new FineTuningStatsService();