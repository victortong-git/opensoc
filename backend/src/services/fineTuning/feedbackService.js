const { models } = require('../../database/models');
const { Op } = require('sequelize');
const sequelize = require('../../database/config/database');

/**
 * Fine-Tuning Feedback Service
 * Handles human feedback collection for AI model improvement
 */
class FineTuningFeedbackService {

  /**
   * Submit human feedback for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID providing feedback
   * @param {Object} feedbackData - Human feedback data
   * @returns {Object} Updated alert
   */
  async submitFeedback(alertId, organizationId, userId, feedbackData) {
    try {
      // Find the alert
      const alert = await models.Alert.findOne({
        where: { 
          id: alertId, 
          organizationId 
        }
      });

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Validate feedback structure
      const validatedFeedback = this._validateFeedback(feedbackData);

      // Determine if corrections were made
      const hasCorrections = this._hasCorrections(alert, feedbackData);
      
      // Prepare update data
      const updateData = {
        humanReviewStatus: hasCorrections ? 'reviewed' : 'verified',
        aiClassificationFeedback: validatedFeedback,
        reviewerUserId: userId,
        feedbackTimestamp: new Date()
      };

      // If there are corrections, store them
      if (hasCorrections) {
        updateData.humanCorrectedClassification = {
          securityEventType: feedbackData.correctedSecurityEventType || alert.securityEventType,
          eventTags: feedbackData.correctedEventTags || alert.eventTags,
          riskAssessment: feedbackData.correctedRiskAssessment || alert.riskAssessment,
          recommendedActions: feedbackData.correctedRecommendedActions || alert.recommendedActions
        };
      }

      // Update the alert
      await alert.update(updateData);

      return await models.Alert.findByPk(alertId, {
        include: [
          {
            model: models.User,
            as: 'reviewer',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Validate feedback data structure
   * @param {Object} feedbackData - Raw feedback data
   * @returns {Object} Validated feedback
   */
  _validateFeedback(feedbackData) {
    const {
      securityEventTypeCorrect = true,
      eventTagsCorrect = true,
      riskAssessmentCorrect = true,
      recommendedActionsCorrect = true,
      overallConfidence = 5,
      comments = ''
    } = feedbackData;

    // Ensure confidence is within valid range
    const validConfidence = Math.max(1, Math.min(10, parseInt(overallConfidence)));

    return {
      securityEventTypeCorrect: Boolean(securityEventTypeCorrect),
      eventTagsCorrect: Boolean(eventTagsCorrect),
      riskAssessmentCorrect: Boolean(riskAssessmentCorrect),
      recommendedActionsCorrect: Boolean(recommendedActionsCorrect),
      overallConfidence: validConfidence,
      comments: String(comments).trim()
    };
  }

  /**
   * Check if human corrections were made to AI classification
   * @param {Object} alert - Alert instance
   * @param {Object} feedbackData - Human feedback
   * @returns {boolean} True if corrections were made
   */
  _hasCorrections(alert, feedbackData) {
    return !!(
      feedbackData.correctedSecurityEventType ||
      feedbackData.correctedEventTags ||
      feedbackData.correctedRiskAssessment ||
      feedbackData.correctedRecommendedActions ||
      !feedbackData.securityEventTypeCorrect ||
      !feedbackData.eventTagsCorrect ||
      !feedbackData.riskAssessmentCorrect ||
      !feedbackData.recommendedActionsCorrect
    );
  }

  /**
   * Get feedback summary for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Object} Feedback statistics
   */
  async getFeedbackSummary(organizationId) {
    try {
      const summary = await models.Alert.findAll({
        where: { 
          organizationId,
          isTestData: false,
          humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] }
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN human_review_status = 'verified' THEN 1 END")), 'verifiedCount'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN human_review_status = 'reviewed' THEN 1 END")), 'correctedCount'],
          [sequelize.fn('AVG', sequelize.literal("(ai_classification_feedback->>'overallConfidence')::numeric")), 'avgConfidence']
        ],
        raw: true
      });

      return {
        totalReviews: parseInt(summary[0]?.totalReviews || 0),
        verifiedCount: parseInt(summary[0]?.verifiedCount || 0),
        correctedCount: parseInt(summary[0]?.correctedCount || 0),
        avgConfidence: parseFloat(summary[0]?.avgConfidence || 0),
        accuracyRate: summary[0]?.totalReviews > 0 
          ? (parseFloat(summary[0]?.verifiedCount || 0) / parseFloat(summary[0]?.totalReviews || 1)) * 100 
          : 0
      };

    } catch (error) {
      console.error('Failed to get feedback summary:', error);
      throw error;
    }
  }

  /**
   * Get quality metrics for feedback analysis
   * @param {string} organizationId - Organization ID  
   * @param {Object} options - Query options (startDate, endDate)
   * @returns {Object} Quality metrics
   */
  async getQualityMetrics(organizationId, options = {}) {
    try {
      const { startDate, endDate } = options;
      const whereClause = { 
        organizationId,
        isTestData: false,
        humanReviewStatus: { [Op.in]: ['reviewed', 'verified'] }
      };

      // Add date filtering if provided
      if (startDate || endDate) {
        whereClause.feedbackTimestamp = {};
        if (startDate) whereClause.feedbackTimestamp[Op.gte] = new Date(startDate);
        if (endDate) whereClause.feedbackTimestamp[Op.lte] = new Date(endDate);
      }

      // Get confidence distribution
      const confidenceDistribution = await models.Alert.findAll({
        where: whereClause,
        attributes: [
          [sequelize.literal("(ai_classification_feedback->>'overallConfidence')::numeric"), 'confidence'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.literal("(ai_classification_feedback->>'overallConfidence')::numeric")],
        raw: true
      });

      // Get feedback accuracy metrics
      const accuracyMetrics = await models.Alert.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN (ai_classification_feedback->>'securityEventTypeCorrect')::boolean = true THEN 1 END")), 'correctEventType'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN (ai_classification_feedback->>'eventTagsCorrect')::boolean = true THEN 1 END")), 'correctEventTags'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN (ai_classification_feedback->>'riskAssessmentCorrect')::boolean = true THEN 1 END")), 'correctRiskAssessment'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
        ],
        raw: true
      });

      return {
        confidenceDistribution: confidenceDistribution.map(item => ({
          confidence: parseInt(item.confidence),
          count: parseInt(item.count)
        })),
        accuracyMetrics: {
          eventTypeAccuracy: parseFloat(accuracyMetrics[0]?.correctEventType || 0) / parseFloat(accuracyMetrics[0]?.totalReviews || 1) * 100,
          eventTagsAccuracy: parseFloat(accuracyMetrics[0]?.correctEventTags || 0) / parseFloat(accuracyMetrics[0]?.totalReviews || 1) * 100,
          riskAssessmentAccuracy: parseFloat(accuracyMetrics[0]?.correctRiskAssessment || 0) / parseFloat(accuracyMetrics[0]?.totalReviews || 1) * 100,
          totalReviews: parseInt(accuracyMetrics[0]?.totalReviews || 0)
        }
      };

    } catch (error) {
      console.error('Failed to get quality metrics:', error);
      throw error;
    }
  }

  /**
   * Clear human feedback for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID requesting the clear (for permission validation)
   * @returns {Object} Updated alert
   */
  async clearFeedback(alertId, organizationId, userId) {
    try {
      // Find the alert
      const alert = await models.Alert.findOne({
        where: { 
          id: alertId, 
          organizationId 
        }
      });

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Check if there is existing feedback
      if (!alert.aiClassificationFeedback) {
        throw new Error('No feedback exists for this alert');
      }

      // Permission check: Only original reviewer or admin can clear
      // For now, allow any authenticated user to clear (can be enhanced with role checking)
      if (alert.reviewerUserId && alert.reviewerUserId !== userId) {
        // Note: In a full implementation, you'd check if the current user is an admin
        // For now, we'll allow clearing by anyone for demo purposes
        console.warn(`User ${userId} clearing feedback originally submitted by ${alert.reviewerUserId}`);
      }

      // Clear feedback data and reset status
      const updateData = {
        humanReviewStatus: 'pending',
        aiClassificationFeedback: null,
        humanCorrectedClassification: null,
        reviewerUserId: null,
        feedbackTimestamp: null
      };

      // Update the alert
      await alert.update(updateData);

      // Log the clear action for audit purposes
      console.log(`Feedback cleared for alert ${alertId} by user ${userId} at ${new Date().toISOString()}`);

      // Return success response
      return {
        success: true,
        alertId: alertId,
        message: 'Feedback cleared successfully'
      };

    } catch (error) {
      console.error('Failed to clear feedback:', error);
      throw error;
    }
  }
}

module.exports = new FineTuningFeedbackService();