const { models } = require('../../database/models');
const alertAnalysisService = require('../../services/alertAnalysisService');
const aiAgentLogService = require('../../services/aiAgentLogService');

/**
 * Alert Analysis Helper
 * Handles comprehensive AI analysis workflows for alerts including 
 * false positive detection, auto-resolution, and triage assignment
 */
class AlertAnalysisHelper {

  /**
   * Perform comprehensive AI analysis on an alert
   * @param {Object} alert - The alert object from database
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object with ID and other details
   * @returns {Object} Analysis results with auto-resolution status
   */
  async performAnalysis(alert, organizationId, user) {
    const startTime = Date.now();
    
    try {
      // PHASE 1: Pre-analysis false positive detection for efficiency
      console.log('🔍 Phase 1: Starting false positive pre-screening...');
      const aiToolExecutor = require('../../tools/common/toolExecutor');
      
      const alertData = this._prepareAlertData(alert);

      // Run lightweight false positive detection first
      const falsePositiveResult = await aiToolExecutor.executeTool('detect_false_positive_alert', {
        alertData,
        historicalContext: {
          recentSimilarAlerts: [], // TODO: Add historical context in future enhancement
          organizationPatterns: [],
          assetContext: {}
        },
        organizationId,
        userId: user.id
      }, {
        sessionId: `alert_false_positive_${alert.id}_${Date.now()}`,
        userId: user.id,
        organizationId
      });

      const fpAnalysis = falsePositiveResult.success ? falsePositiveResult.result : null;
      let autoResolvedStatus = null;
      let structuredAnalysis = null;

      // PHASE 2: Auto-resolution decision based on false positive detection
      if (fpAnalysis && fpAnalysis.autoResolutionRecommendation.shouldAutoResolve) {
        const { autoResolvedStatus: status, analysis } = await this._handleFalsePositiveAutoResolution(
          alert, fpAnalysis, user
        );
        autoResolvedStatus = status;
        structuredAnalysis = analysis;
      }

      // PHASE 3: Comprehensive analysis (only if not auto-resolved)
      if (!autoResolvedStatus) {
        console.log('🔍 Phase 3: Starting comprehensive alert analysis with security event type classification...');
        structuredAnalysis = await alertAnalysisService.analyzeAlert(alert, organizationId, user.id);
        
        const { autoResolvedStatus: compAutoStatus } = await this._handleComprehensiveAnalysis(
          alert, structuredAnalysis, user
        );
        autoResolvedStatus = compAutoStatus;
      }
      
      const executionTime = Date.now() - startTime;

      // Save analysis results to database
      await this._saveAnalysisResults(alert, structuredAnalysis);

      // Create timeline events
      await this._createTimelineEvents(alert, structuredAnalysis, autoResolvedStatus);

      // Log AI agent activity
      await this._logAgentActivity(alert, structuredAnalysis, executionTime, user, organizationId, true, autoResolvedStatus);

      return {
        success: true,
        analysis: structuredAnalysis,
        autoResolved: !!autoResolvedStatus,
        autoResolvedStatus,
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          status: alert.status,
          securityEventType: alert.securityEventType
        }
      };

    } catch (error) {
      console.error('Alert AI analysis failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Log failed AI agent activity
      await this._logAgentActivity(alert, null, processingTime, user, organizationId, false, null, error);
      
      throw error; // Re-throw to be handled by controller's error handling
    }
  }

  /**
   * Prepare alert data for AI analysis
   * @private
   */
  _prepareAlertData(alert) {
    return {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      sourceSystem: alert.sourceSystem,
      eventTime: alert.eventTime,
      assetName: alert.assetName,
      assetId: alert.assetId,
      status: alert.status,
      rawData: alert.rawData,
      enrichmentData: alert.enrichmentData,
      securityEventType: alert.securityEventType
    };
  }

  /**
   * Handle false positive auto-resolution
   * @private
   */
  async _handleFalsePositiveAutoResolution(alert, fpAnalysis, user) {
    const fpAutoResolution = fpAnalysis.autoResolutionRecommendation;
    console.log(`🤖 FALSE POSITIVE: High confidence false positive detected (${fpAutoResolution.confidenceLevel}%)`);
    
    if (fpAutoResolution.confidenceLevel >= 85 && alert.status === 'new') {
      console.log(`🤖 FALSE POSITIVE: Auto-resolving alert as ${fpAutoResolution.specificResolutionType}`);
      
      // Create enhanced resolve remarks for false positive auto-resolution
      const resolveRemarksData = {
        resolvedBy: 'AI_FALSE_POSITIVE_DETECTION',
        resolvedAt: new Date().toISOString(),
        resolutionType: fpAutoResolution.specificResolutionType,
        reasoning: fpAutoResolution.reasoning,
        falsePositiveType: fpAnalysis.falsePositiveType,
        detectionPatterns: fpAnalysis.detectionPatterns,
        confidenceScore: fpAnalysis.confidenceScore,
        aiModel: fpAnalysis.aiModel,
        processingTimeMs: fpAnalysis.processingTimeMs,
        autoResolved: true,
        reviewRequired: fpAutoResolution.reviewRequired,
        escalationTrigger: fpAutoResolution.escalationTrigger
      };

      // Automatically resolve the alert
      await alert.update({
        status: fpAutoResolution.resolutionType,
        resolveRemarks: resolveRemarksData,
        updatedAt: new Date()
      });

      // Create enhanced timeline event for false positive auto-resolution
      await models.AlertTimelineEvent.create({
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_false_positive_resolved',
        title: 'Alert Auto-Resolved as False Positive',
        description: `🤖 Alert automatically resolved by AI as "${fpAutoResolution.specificResolutionType}" with ${fpAutoResolution.confidenceLevel}% confidence. Type: ${fpAnalysis.falsePositiveType}. ${fpAutoResolution.reasoning}`,
        aiSource: 'FALSE_POSITIVE_DETECTION_AGENT',
        aiConfidence: fpAutoResolution.confidenceLevel,
        metadata: {
          falsePositiveType: fpAnalysis.falsePositiveType,
          detectionPatterns: fpAnalysis.detectionPatterns,
          confidenceScore: fpAnalysis.confidenceScore,
          specificResolutionType: fpAutoResolution.specificResolutionType,
          originalStatus: 'new',
          newStatus: fpAutoResolution.resolutionType,
          reasoning: fpAutoResolution.reasoning,
          reviewRequired: fpAutoResolution.reviewRequired,
          processingTimeMs: fpAnalysis.processingTimeMs,
          aiModel: fpAnalysis.aiModel,
          autoResolved: true
        },
      });

      // Skip comprehensive analysis for high-confidence false positives
      console.log(`🤖 FALSE POSITIVE: Alert ${alert.id} auto-resolved as ${fpAutoResolution.specificResolutionType} - skipping comprehensive analysis`);
      
      // Create a minimal analysis result for response consistency
      const structuredAnalysis = {
        summary: `Auto-resolved false positive: ${fpAnalysis.falsePositiveType}`,
        explanation: fpAutoResolution.reasoning,
        securityEventType: alert.securityEventType || 'false_positive',
        riskAssessment: {
          level: 'low',
          score: 1,
          factors: ['Detected as false positive']
        },
        recommendedActions: {
          immediate: ['No action required - false positive'],
          followUp: ['Review auto-resolution patterns if needed']
        },
        confidence: fpAutoResolution.confidenceLevel,
        autoResolutionRecommendation: fpAutoResolution,
        processingTimeMs: fpAnalysis.processingTimeMs,
        analysisTimestamp: new Date().toISOString(),
        aiModel: fpAnalysis.aiModel,
        twoStepAnalysis: false
      };

      return {
        autoResolvedStatus: fpAutoResolution.resolutionType,
        analysis: structuredAnalysis
      };
    } else {
      console.log(`🤖 FALSE POSITIVE: Confidence below threshold (${fpAutoResolution.confidenceLevel}% < 85%) - proceeding with comprehensive analysis`);
      return { autoResolvedStatus: null, analysis: null };
    }
  }

  /**
   * Handle comprehensive analysis results and triage assignment
   * @private
   */
  async _handleComprehensiveAnalysis(alert, structuredAnalysis, user) {
    // Determine triage status based on AI analysis confidence and risk assessment
    let triageStatus = 'new';
    let triageRemarks = null;
    
    if (structuredAnalysis) {
      const confidence = structuredAnalysis.confidence || 0;
      const riskLevel = structuredAnalysis.riskAssessment?.level || 'unknown';
      const riskScore = structuredAnalysis.riskAssessment?.score || 0;
      
      // Assign triage status based on AI analysis results
      if (confidence >= 80 && (riskLevel === 'high' || riskLevel === 'critical' || riskScore >= 8)) {
        triageStatus = 'incident_likely';
      } else if (confidence < 60 || riskLevel === 'unknown') {
        triageStatus = 'analysis_uncertain';
      } else if (confidence >= 60 && (riskLevel === 'medium' || riskScore >= 5)) {
        triageStatus = 'review_required';
      }
      
      // Create triage remarks with AI analysis metadata
      triageRemarks = {
        aiAnalysisConfidence: confidence,
        riskLevel: riskLevel,
        riskScore: riskScore,
        triageReason: `AI analysis with ${confidence}% confidence indicates ${riskLevel} risk level`,
        assignedBy: 'AI_TRIAGE_SYSTEM',
        assignedAt: new Date().toISOString(),
        securityEventType: structuredAnalysis.securityEventType,
        recommendedActions: structuredAnalysis.recommendedActions,
        needsHumanReview: confidence < 80 || riskLevel === 'unknown'
      };
    }
    
    // If comprehensive analysis also recommends auto-resolution, handle it
    const autoResolution = structuredAnalysis.autoResolutionRecommendation;
    if (autoResolution.shouldAutoResolve && 
        autoResolution.confidenceLevel >= 85 && 
        alert.status === 'new') {
      
      const resolveRemarksData = {
        resolvedBy: 'AI_COMPREHENSIVE_AUTO_RESOLUTION',
        resolvedAt: new Date().toISOString(),
        resolutionType: autoResolution.resolutionType,
        reasoning: autoResolution.reasoning,
        aiConfidence: autoResolution.confidenceLevel,
        aiAnalysisId: structuredAnalysis.analysisTimestamp,
        autoResolved: true
      };

      // Automatically resolve the alert
      await alert.update({
        status: autoResolution.resolutionType,
        resolveRemarks: resolveRemarksData,
        triageRemarks: triageRemarks,
        triageTimestamp: new Date(),
        updatedAt: new Date()
      });

      // Create AI auto-resolution timeline event  
      await models.AlertTimelineEvent.create({
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_auto_resolved',
        title: 'Alert Auto-Resolved by Comprehensive Analysis',
        description: `🤖 Alert automatically resolved by AI as "${autoResolution.resolutionType}" with ${autoResolution.confidenceLevel}% confidence. ${autoResolution.reasoning}`,
        aiSource: 'SOC_ANALYST_AGENT',
        aiConfidence: autoResolution.confidenceLevel,
        metadata: {
          resolutionType: autoResolution.resolutionType,
          originalStatus: 'new',
          newStatus: autoResolution.resolutionType,
          reasoning: autoResolution.reasoning,
          aiAnalysisId: structuredAnalysis.analysisTimestamp,
          autoResolved: true,
          aiModel: structuredAnalysis.aiModel,
          triageStatus: triageStatus
        },
      });

      console.log(`🤖 Auto-resolved alert ${alert.id} as ${autoResolution.resolutionType} (confidence: ${autoResolution.confidenceLevel}%)`);
      return { autoResolvedStatus: autoResolution.resolutionType };
      
    } else if (triageStatus !== 'new') {
      // Update alert with new triage status for human review
      await alert.update({
        status: triageStatus,
        triageRemarks: triageRemarks,
        triageTimestamp: new Date(),
        updatedAt: new Date()
      });
      
      // Create triage timeline event
      await models.AlertTimelineEvent.create({
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_triage_assigned',
        title: `Alert Triaged as ${triageStatus.replace('_', ' ').toUpperCase()}`,
        description: `🤖 AI triage system assigned status "${triageStatus}" based on ${structuredAnalysis.confidence}% confidence analysis. Risk Level: ${structuredAnalysis.riskAssessment?.level}. ${triageRemarks.triageReason}`,
        aiSource: 'AI_TRIAGE_SYSTEM',
        aiConfidence: structuredAnalysis.confidence,
        metadata: {
          originalStatus: 'new',
          newStatus: triageStatus,
          triageRemarks: triageRemarks,
          riskAssessment: structuredAnalysis.riskAssessment,
          securityEventType: structuredAnalysis.securityEventType
        },
      });
      
      console.log(`🎯 Alert ${alert.id} triaged as ${triageStatus} for SOC manager review`);
    }

    return { autoResolvedStatus: null };
  }

  /**
   * Save analysis results to the database
   * @private
   */
  async _saveAnalysisResults(alert, structuredAnalysis) {
    const updateData = {
      aiAnalysis: structuredAnalysis,
      aiAnalysisTimestamp: new Date()
    };
    
    // Only update securityEventType if current value is pending/null or if analysis provides a better classification
    if (!alert.securityEventType || alert.securityEventType === 'pending') {
      updateData.securityEventType = structuredAnalysis.securityEventType || 'pending';
    }
    
    await alert.update(updateData);
  }

  /**
   * Create appropriate timeline events based on analysis results
   * @private
   */
  async _createTimelineEvents(alert, structuredAnalysis, autoResolvedStatus) {
    if (autoResolvedStatus) {
      // Timeline event was already created during auto-resolution
      console.log(`🤖 Alert ${alert.id} was auto-resolved as ${autoResolvedStatus} - timeline event already created`);
    } else {
      // Create AI analysis completion timeline event for non-auto-resolved alerts
      const autoResolution = structuredAnalysis.autoResolutionRecommendation;
      
      await models.AlertTimelineEvent.create({
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_analysis_completed',
        title: 'AI SOC Consultant Analysis Completed',
        description: `AI analysis completed with ${structuredAnalysis.confidence}% confidence. Security Event Type: ${structuredAnalysis.securityEventType}. Risk level: ${structuredAnalysis.riskAssessment.level}. ${structuredAnalysis.summary}`,
        aiSource: 'SOC_ANALYST_AGENT',
        aiConfidence: structuredAnalysis.confidence,
        metadata: {
          processingTimeMs: structuredAnalysis.processingTimeMs,
          riskLevel: structuredAnalysis.riskAssessment.level,
          riskScore: structuredAnalysis.riskAssessment.score,
          securityEventType: structuredAnalysis.securityEventType,
          autoResolutionEligible: autoResolution.shouldAutoResolve,
          confidenceLevel: autoResolution.confidenceLevel,
          aiModel: structuredAnalysis.aiModel
        },
      });
    }
  }

  /**
   * Log AI agent activity for tracking and monitoring
   * @private
   */
  async _logAgentActivity(alert, structuredAnalysis, executionTime, user, organizationId, success, autoResolvedStatus, error = null) {
    try {
      const logData = {
        agentName: 'Alert and Incident Specialist Agent',
        taskName: 'analyze alert',
        description: success ? 
          `Analyze Alert: ${alert.title} - ${structuredAnalysis.summary}` :
          `Failed to analyze Alert: ${alert.title}`,
        inputTokens: structuredAnalysis?.inputTokens || 0,
        outputTokens: structuredAnalysis?.outputTokens || 0,
        executionTimeMs: executionTime,
        success,
        userId: user.id,
        organizationId,
        alertId: alert.id,
        aiProvider: structuredAnalysis?.aiProvider,
        aiModel: structuredAnalysis?.aiModel,
        metadata: success ? {
          confidence: structuredAnalysis.confidence,
          riskLevel: structuredAnalysis.riskAssessment.level,
          securityEventType: structuredAnalysis.securityEventType,
          autoResolved: !!autoResolvedStatus,
          autoResolvedStatus
        } : {
          errorType: error?.constructor.name,
          errorMessage: error?.message || 'AI analysis failed',
          alertSeverity: alert.severity
        }
      };

      if (!success) {
        logData.errorMessage = error?.message || 'AI analysis failed';
      }

      await aiAgentLogService.logAgentActivity(logData);
    } catch (logError) {
      console.error('Failed to log AI agent activity:', logError);
    }
  }
}

module.exports = new AlertAnalysisHelper();