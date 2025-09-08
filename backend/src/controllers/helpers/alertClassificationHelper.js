const { models } = require('../../database/models');
const alertAnalysisService = require('../../services/alertAnalysisService');
const aiAgentLogService = require('../../services/aiAgentLogService');

/**
 * Alert Classification Helper  
 * Handles AI classification workflows for alerts including
 * security event type classification, tag generation, and timeline management
 */
class AlertClassificationHelper {

  /**
   * Perform AI classification on an alert
   * @param {Object} alert - The alert object from database
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object with ID and other details
   * @param {Object} options - Classification options
   * @returns {Object} Classification results
   */
  async performClassification(alert, organizationId, user, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🏷️ Starting AI classification for event type and tags...');
      console.log('🏷️ Alert ID:', alert.id, 'User:', user.id);
      
      // Use the alertAnalysisService for simplified AI classification (event type + tags only)
      const classificationResult = await alertAnalysisService.generateAIClassification(alert, organizationId, {
        refreshAnalysis: options.refreshAnalysis || false,
        userId: user.id
      });

      // Format classification data for response
      const classificationData = this._formatClassificationData(classificationResult);

      // Save classification data to the database
      await this._saveClassificationResults(alert, classificationResult);

      // Create timeline event for classification completion
      await this._createClassificationTimelineEvent(alert, classificationResult);

      // Log AI agent activity
      await this._logAgentActivity(alert, classificationResult, user, organizationId, true);

      return {
        success: true,
        classification: classificationData,
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          status: alert.status,
          securityEventType: alert.securityEventType,
          eventTags: alert.eventTags,
          tagsConfidence: classificationResult.overallConfidence
        }
      };

    } catch (error) {
      console.error('AI classification failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Log failed AI agent activity
      await this._logAgentActivity(alert, null, user, organizationId, false, processingTime, error);
      
      throw error; // Re-throw to be handled by controller's error handling
    }
  }

  /**
   * Format classification result data for API response
   * @private
   */
  _formatClassificationData(classificationResult) {
    return {
      securityEventType: classificationResult.securityEventType,
      securityEventTypeReasoning: classificationResult.securityEventTypeReasoning,
      eventTags: classificationResult.eventTags,
      correlationPotential: classificationResult.correlationPotential,
      correlationReasoning: classificationResult.correlationReasoning,
      overallConfidence: classificationResult.overallConfidence,
      tagCount: classificationResult.tagCount,
      classificationTimestamp: classificationResult.classificationTimestamp,
      processingTimeMs: classificationResult.processingTimeMs,
      aiModel: classificationResult.aiModel,
      toolExecutionId: classificationResult.toolExecutionId
    };
  }

  /**
   * Save classification results to the database
   * @private
   */
  async _saveClassificationResults(alert, classificationResult) {
    await alert.update({
      securityEventType: classificationResult.securityEventType,
      eventTags: classificationResult.eventTags,
      tagsGeneratedAt: new Date(),
      tagsConfidence: classificationResult.overallConfidence
    });
  }

  /**
   * Create timeline event for classification completion
   * @private
   */
  async _createClassificationTimelineEvent(alert, classificationResult) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'ai_analysis_completed',
      title: 'AI Classification Completed',
      description: `AI classification completed with ${classificationResult.tagCount} tags and security event type: ${classificationResult.securityEventType}. Confidence: ${classificationResult.overallConfidence}%`,
      aiSource: 'AI_CLASSIFICATION_AGENT',
      aiConfidence: classificationResult.overallConfidence,
      metadata: {
        processingTimeMs: classificationResult.processingTimeMs,
        tagCount: classificationResult.tagCount,
        securityEventType: classificationResult.securityEventType,
        tagsConfidence: classificationResult.overallConfidence,
        correlationPotential: classificationResult.correlationPotential,
        aiModel: classificationResult.aiModel
      },
    });
  }

  /**
   * Log AI agent activity for tracking and monitoring
   * @private
   */
  async _logAgentActivity(alert, classificationResult, user, organizationId, success, processingTime = null, error = null) {
    try {
      const logData = {
        agentName: 'Alert and Incident Specialist Agent',
        taskName: 'classify alert',
        description: success ? 
          `Classify Alert: ${alert.title} - Security Event Type: ${classificationResult.securityEventType}` :
          `Failed to classify Alert: ${alert.title}`,
        inputTokens: classificationResult?.inputTokens || 0,
        outputTokens: classificationResult?.outputTokens || 0,
        executionTimeMs: classificationResult?.processingTimeMs || processingTime,
        success,
        userId: user.id,
        organizationId,
        alertId: alert.id,
        aiProvider: classificationResult?.aiProvider,
        aiModel: classificationResult?.aiModel,
        metadata: success ? {
          securityEventType: classificationResult.securityEventType,
          tagCount: classificationResult.tagCount,
          tagsConfidence: classificationResult.overallConfidence,
          correlationPotential: classificationResult.correlationPotential
        } : {
          errorType: error?.constructor.name,
          errorMessage: error?.message || 'AI classification failed',
          alertSeverity: alert.severity
        }
      };

      if (!success) {
        logData.errorMessage = error?.message || 'AI classification failed';
      }

      await aiAgentLogService.logAgentActivity(logData);
    } catch (logError) {
      console.error('Failed to log AI agent activity:', logError);
    }
  }

  /**
   * Get classification history for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @returns {Array} Classification history
   */
  async getClassificationHistory(alertId, organizationId) {
    return await models.AlertTimelineEvent.findAll({
      where: {
        alertId,
        type: 'ai_analysis_completed',
        aiSource: 'AI_CLASSIFICATION_AGENT'
      },
      order: [['timestamp', 'DESC']],
      limit: 10
    });
  }

  /**
   * Re-classify an alert with new parameters
   * @param {Object} alert - The alert object
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} options - Re-classification options
   * @returns {Object} New classification results
   */
  async reClassifyAlert(alert, organizationId, user, options = {}) {
    // Force refresh analysis for re-classification
    const reClassifyOptions = {
      ...options,
      refreshAnalysis: true
    };

    return await this.performClassification(alert, organizationId, user, reClassifyOptions);
  }

  /**
   * Validate classification confidence and suggest review if needed
   * @param {Object} classificationResult - Classification result
   * @returns {Object} Validation result with review recommendation
   */
  validateClassificationConfidence(classificationResult) {
    const confidence = classificationResult.overallConfidence;
    const tagCount = classificationResult.tagCount;
    
    let reviewRecommended = false;
    let reviewReason = '';

    if (confidence < 70) {
      reviewRecommended = true;
      reviewReason = 'Low confidence classification';
    } else if (tagCount === 0) {
      reviewRecommended = true;
      reviewReason = 'No contextual tags generated';
    } else if (!classificationResult.securityEventType || classificationResult.securityEventType === 'unknown') {
      reviewRecommended = true;
      reviewReason = 'Unable to determine security event type';
    }

    return {
      confidence,
      tagCount,
      reviewRecommended,
      reviewReason,
      qualityScore: this._calculateQualityScore(classificationResult)
    };
  }

  /**
   * Calculate overall quality score for classification
   * @private
   */
  _calculateQualityScore(classificationResult) {
    let score = 0;

    // Confidence score (0-40 points)
    score += Math.min(40, classificationResult.overallConfidence * 0.4);

    // Tag count (0-20 points)
    score += Math.min(20, classificationResult.tagCount * 4);

    // Security event type identified (0-20 points)
    if (classificationResult.securityEventType && classificationResult.securityEventType !== 'unknown') {
      score += 20;
    }

    // Correlation potential (0-20 points)
    if (classificationResult.correlationPotential && classificationResult.correlationPotential !== 'low') {
      score += 20;
    }

    return Math.round(score);
  }
}

module.exports = new AlertClassificationHelper();