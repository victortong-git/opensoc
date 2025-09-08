const { models } = require('../../database/models');
const { Op } = require('sequelize');
const sequelize = require('../../database/config/database');

/**
 * Fine-Tuning Export Service
 * Handles training data export and formatting
 */
class FineTuningExportService {

  /**
   * Export training data in specified format for fine-tuning
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Export options
   * @returns {string} Formatted training data
   */
  async exportTrainingData(organizationId, options) {
    try {
      const {
        startDate,
        endDate,
        minConfidence = 7,
        includeUnverified = false,
        format = 'jsonl',
        datasetSplit = { training: 70, validation: 20, test: 10 },
        exportedByUserId
      } = options;

      // Build query conditions
      const whereConditions = {
        organizationId,
        isTestData: false,
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };

      // Filter by human review status
      if (includeUnverified) {
        whereConditions.humanReviewStatus = { [Op.in]: ['reviewed', 'verified'] };
      } else {
        whereConditions.humanReviewStatus = 'verified';
      }

      // Filter by confidence level if specified
      if (minConfidence > 1) {
        whereConditions[Op.and] = [
          sequelize.literal(`(ai_classification_feedback->>'overallConfidence')::numeric >= ${minConfidence}`)
        ];
      }

      // Fetch alerts with human feedback
      const alerts = await models.Alert.findAll({
        where: whereConditions,
        include: [
          {
            model: models.User,
            as: 'reviewer',
            attributes: ['id', 'username', 'firstName', 'lastName'],
            required: false
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      if (alerts.length === 0) {
        throw new Error('No alerts found matching the specified criteria');
      }

      // Transform alerts to training data format
      const trainingData = alerts.map(alert => this._transformAlertToTrainingData(alert));

      // Split dataset
      const splitData = this._splitDataset(trainingData, datasetSplit);

      // Log export activity
      await this._logExportActivity(organizationId, exportedByUserId, {
        totalRecords: alerts.length,
        dateRange: { startDate, endDate },
        format,
        minConfidence,
        includeUnverified
      });

      // Format output based on requested format
      return this._formatExportData(splitData, format);

    } catch (error) {
      console.error('Failed to export training data:', error);
      throw error;
    }
  }

  /**
   * Transform alert data to instruction-tuning format
   * @param {Object} alert - Alert model instance
   * @returns {Object} Training data record
   */
  _transformAlertToTrainingData(alert) {
    // Prepare input data (what the model sees)
    const inputData = {
      alert_title: alert.title,
      alert_description: alert.description,
      severity: alert.severity,
      source_system: alert.sourceSystem,
      event_timestamp: alert.eventTimestamp,
      raw_log_data: alert.rawLogData ? JSON.stringify(alert.rawLogData) : null,
      network_context: alert.networkContext ? JSON.stringify(alert.networkContext) : null
    };

    // Prepare expected output (what the model should generate)
    const outputData = {
      security_event_type: alert.humanCorrectedClassification?.securityEventType || alert.securityEventType,
      event_tags: alert.humanCorrectedClassification?.eventTags || alert.eventTags,
      risk_assessment: alert.humanCorrectedClassification?.riskAssessment || alert.riskAssessment,
      recommended_actions: alert.humanCorrectedClassification?.recommendedActions || alert.recommendedActions
    };

    // Create instruction-tuning format
    const instruction = "Analyze this security alert and provide classification, tags, risk assessment, and recommended actions.";
    
    return {
      instruction: instruction,
      input: JSON.stringify(inputData),
      output: JSON.stringify(outputData),
      metadata: {
        alert_id: alert.id,
        review_status: alert.humanReviewStatus,
        reviewer_id: alert.reviewerUserId,
        feedback_timestamp: alert.feedbackTimestamp,
        confidence_score: alert.aiClassificationFeedback?.overallConfidence || null,
        human_verified: alert.humanReviewStatus === 'verified'
      }
    };
  }

  /**
   * Split dataset into training, validation, and test sets
   * @param {Array} data - Training data records
   * @param {Object} splitRatio - Split percentages
   * @returns {Object} Split datasets
   */
  _splitDataset(data, splitRatio) {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    
    const trainingSize = Math.floor(shuffled.length * (splitRatio.training / 100));
    const validationSize = Math.floor(shuffled.length * (splitRatio.validation / 100));
    
    return {
      training: shuffled.slice(0, trainingSize),
      validation: shuffled.slice(trainingSize, trainingSize + validationSize),
      test: shuffled.slice(trainingSize + validationSize)
    };
  }

  /**
   * Format split data for export
   * @param {Object} splitData - Split datasets
   * @param {string} format - Export format
   * @returns {string} Formatted data
   */
  _formatExportData(splitData, format) {
    switch (format.toLowerCase()) {
      case 'jsonl':
        return {
          training: splitData.training.map(item => JSON.stringify(item)).join('\n'),
          validation: splitData.validation.map(item => JSON.stringify(item)).join('\n'),
          test: splitData.test.map(item => JSON.stringify(item)).join('\n')
        };
      
      case 'json':
        return {
          training: JSON.stringify(splitData.training, null, 2),
          validation: JSON.stringify(splitData.validation, null, 2),
          test: JSON.stringify(splitData.test, null, 2)
        };
      
      case 'csv':
        return {
          training: this._convertToCSV(splitData.training),
          validation: this._convertToCSV(splitData.validation),
          test: this._convertToCSV(splitData.test)
        };
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert training data to CSV format
   * @param {Array} data - Training data
   * @returns {string} CSV formatted data
   */
  _convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object') {
            return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
          }
          return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  /**
   * Log export activity for audit trail
   * @param {string} organizationId - Organization ID
   * @param {string} exportedByUserId - User who initiated export
   * @param {Object} exportDetails - Export configuration details
   */
  async _logExportActivity(organizationId, exportedByUserId, exportDetails) {
    try {
      // Create export log entry
      await models.FineTuningExport.create({
        organizationId,
        exportedByUserId,
        totalRecords: exportDetails.totalRecords,
        exportConfig: exportDetails,
        exportedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to log export activity:', error);
      // Don't throw - logging failure shouldn't stop export
    }
  }
}

module.exports = new FineTuningExportService();