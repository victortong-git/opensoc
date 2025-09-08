const statsService = require('./fineTuning/statsService');
const exportService = require('./fineTuning/exportService');
const feedbackService = require('./fineTuning/feedbackService');

/**
 * Fine-Tuning Service
 * Main service coordinator for AI model fine-tuning functionality
 */
class FineTuningService {

  /**
   * Get comprehensive dataset statistics for fine-tuning dashboard
   * @param {string} organizationId - Organization ID
   * @returns {Object} Dataset statistics
   */
  async getDatasetStats(organizationId) {
    return await statsService.getDatasetStats(organizationId);
  }

  /**
   * Export training data in specified format for fine-tuning
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Export options
   * @returns {string} Formatted training data
   */
  async exportTrainingData(organizationId, options) {
    return await exportService.exportTrainingData(organizationId, options);
  }

  /**
   * Submit human feedback for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID providing feedback
   * @param {Object} feedbackData - Human feedback data
   * @returns {Object} Updated alert
   */
  async submitFeedback(alertId, organizationId, userId, feedbackData) {
    return await feedbackService.submitFeedback(alertId, organizationId, userId, feedbackData);
  }

  /**
   * Clear human feedback for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID requesting the clear
   * @returns {Object} Updated alert
   */
  async clearFeedback(alertId, organizationId, userId) {
    return await feedbackService.clearFeedback(alertId, organizationId, userId);
  }

  /**
   * Get feedback summary for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Object} Feedback statistics
   */
  async getFeedbackSummary(organizationId) {
    return await feedbackService.getFeedbackSummary(organizationId);
  }

  /**
   * Get quality metrics for feedback analysis
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options (startDate, endDate)
   * @returns {Object} Quality metrics
   */
  async getQualityMetrics(organizationId, options) {
    return await feedbackService.getQualityMetrics(organizationId, options);
  }
}

module.exports = new FineTuningService();