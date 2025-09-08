const { models } = require('../database/models');
const aiAgentLogService = require('./aiAgentLogService');

/**
 * Incident Form Generation Service
 * Handles AI-powered incident form generation from security alerts
 * with comprehensive context analysis and data structuring
 */
class IncidentFormGenerationService {

  /**
   * Generate incident form data from an alert
   * @param {Object} alert - Alert object with full context
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @returns {Object} Generated incident form data
   */
  async generateIncidentForm(alert, organizationId, user) {
    const startTime = Date.now();

    try {
      
      // Prepare comprehensive context from Security Alert AND existing AI Analysis
      const alertContext = this._prepareAlertContext(alert);

      // Build comprehensive prompt using Security Alert + AI Analysis context
      const promptContent = this._buildPromptContent(alertContext);

      // Execute the AI tool to generate structured incident data
      const aiToolExecutor = require('../tools/common/toolExecutor');
      
      const toolResult = await aiToolExecutor.executeTool(
        'generate_incident_form_from_alert',
        {
          alertContext,
          promptContent,
          organizationId,
          userId: user.id,
          generateComprehensiveData: true,
          includeTimeline: true,
          includeMitreMapping: true,
          includeActionItems: true
        },
        {
          sessionId: `incident_form_generation_${alert.id}_${Date.now()}`,
          userId: user.id,
          organizationId
        }
      );

      if (!toolResult.success) {
        throw new Error(`Incident form generation failed: ${toolResult.error}`);
      }

      // Extract and validate the incident form data
      const toolResponse = toolResult.result;
      console.log('🔍 Tool result structure:', Object.keys(toolResponse));
      console.log('🔍 Tool result content type:', typeof toolResponse.content);
      console.log('🔍 Tool result content preview:', JSON.stringify(toolResponse.content || toolResponse, null, 2).substring(0, 500));
      
      const incidentData = toolResponse.content;
      if (!incidentData) {
        throw new Error('AI tool returned no incident form content. Tool response: ' + JSON.stringify(toolResponse, null, 2));
      }
      
      const toolMetadata = toolResponse;
      const executionTime = Date.now() - startTime;

      // Create timeline event for incident form generation
      await this._createTimelineEvent(alert, toolMetadata, executionTime);

      // Log AI agent activity
      await this._logAgentActivity(alert, toolMetadata, executionTime, user, organizationId, true);

      // Transform AI tool response to match frontend interface expectations
      const transformedData = this._transformToFrontendFormat(incidentData);
      
      // Prepare response with structured incident form data
      return {
        success: true,
        incidentFormData: transformedData,
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          status: alert.status
        },
        processingTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Incident form generation failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Log failed AI agent activity
      await this._logAgentActivity(alert, null, processingTime, user, organizationId, false, error);
      
      throw error;
    }
  }

  /**
   * Prepare comprehensive alert context
   * @private
   */
  _prepareAlertContext(alert) {
    return {
      // Core alert data
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      sourceSystem: alert.sourceSystem,
      eventTime: alert.eventTime,
      assetName: alert.assetName,
      assetId: alert.assetId,
      status: alert.status,
      assignedAgent: alert.assignedAgent,
      
      // Raw and enrichment data
      rawData: alert.rawData,
      enrichmentData: alert.enrichmentData,
      
      // Asset information
      asset: alert.asset,
      
      // Existing AI Analysis (if available)
      aiAnalysis: alert.aiAnalysis,
      aiAnalysisTimestamp: alert.aiAnalysisTimestamp,
      
      // Additional context
      securityEventType: alert.securityEventType,
      eventTags: alert.eventTags,
      tagsConfidence: alert.tagsConfidence,
      resolveRemarks: alert.resolveRemarks,
      triageRemarks: alert.triageRemarks
    };
  }

  /**
   * Build comprehensive prompt content for AI generation
   * @private
   */
  _buildPromptContent(alertContext) {
    const sections = [];

    // Alert Information Section
    sections.push(`## Alert Information
- **Title:** ${alertContext.title}
- **Severity:** ${alertContext.severity}
- **Source System:** ${alertContext.sourceSystem}
- **Event Time:** ${alertContext.eventTime}
- **Status:** ${alertContext.status}
- **Asset:** ${alertContext.assetName || 'Unknown'}
- **Security Event Type:** ${alertContext.securityEventType || 'Not classified'}`);

    // Description Section
    if (alertContext.description) {
      sections.push(`## Alert Description
${alertContext.description}`);
    }

    // AI Analysis Section (if available)
    if (alertContext.aiAnalysis && alertContext.aiAnalysis.summary) {
      sections.push(`## AI Analysis Summary
**Confidence:** ${alertContext.aiAnalysis.confidence || 'Unknown'}%
**Risk Level:** ${alertContext.aiAnalysis.riskAssessment?.level || 'Unknown'}
**Summary:** ${alertContext.aiAnalysis.summary}
**Explanation:** ${alertContext.aiAnalysis.explanation || 'No detailed explanation available'}`);

      if (alertContext.aiAnalysis.recommendedActions) {
        sections.push(`## AI Recommended Actions
**Immediate Actions:**
${this._formatActionsList(alertContext.aiAnalysis.recommendedActions.immediate)}

**Follow-up Actions:**
${this._formatActionsList(alertContext.aiAnalysis.recommendedActions.followUp)}`);
      }
    }

    // Asset Information Section
    if (alertContext.asset) {
      sections.push(`## Asset Information
- **Name:** ${alertContext.asset.name}
- **Type:** ${alertContext.asset.assetType}
- **IP Address:** ${alertContext.asset.ipAddress || 'Unknown'}
- **Criticality:** ${alertContext.asset.criticality || 'Unknown'}
- **Location:** ${alertContext.asset.location || 'Unknown'}
- **Owner:** ${alertContext.asset.owner || 'Unknown'}`);
    }

    // Raw Data Section (if available and manageable)
    if (alertContext.rawData && Object.keys(alertContext.rawData).length > 0) {
      const rawDataStr = JSON.stringify(alertContext.rawData, null, 2);
      if (rawDataStr.length < 2000) { // Only include if reasonably sized
        sections.push(`## Raw Alert Data
\`\`\`json
${rawDataStr}
\`\`\``);
      }
    }

    // Tags Section
    if (alertContext.eventTags && alertContext.eventTags.length > 0) {
      sections.push(`## Event Tags
${alertContext.eventTags.map(tag => `- ${tag}`).join('\n')}
**Tags Confidence:** ${alertContext.tagsConfidence || 'Unknown'}%`);
    }

    return sections.join('\n\n');
  }

  /**
   * Format actions list for prompt
   * @private
   */
  _formatActionsList(actions) {
    if (!actions || !Array.isArray(actions)) return 'None specified';
    return actions.map(action => `- ${action}`).join('\n');
  }

  /**
   * Create timeline event for incident form generation
   * @private
   */
  async _createTimelineEvent(alert, incidentData, executionTime) {
    try {
      await models.AlertTimelineEvent.create({
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_analysis_completed',
        title: 'Incident Form Data Generated',
        description: `AI successfully generated comprehensive incident form data with ${incidentData.sections?.length || 'unknown'} sections. Processing time: ${executionTime}ms`,
        aiSource: 'INCIDENT_FORM_GENERATOR',
        aiConfidence: incidentData.confidence || 85,
        metadata: {
          processingTimeMs: executionTime,
          sectionsGenerated: incidentData.sections?.length || 0,
          hasTimeline: !!incidentData.timeline,
          hasMitreMapping: !!incidentData.mitreMapping,
          hasActionItems: !!incidentData.actionItems,
          aiModel: incidentData.aiModel,
          confidence: incidentData.confidence
        },
      });
    } catch (error) {
      console.error('Failed to create timeline event for incident form generation:', error);
    }
  }

  /**
   * Log AI agent activity for tracking and monitoring
   * @private
   */
  async _logAgentActivity(alert, incidentData, executionTime, user, organizationId, success, error = null) {
    try {
      const logData = {
        agentName: 'Incident Form Generator Agent',
        taskName: 'generate incident form',
        description: success ? 
          `Generated incident form for Alert: ${alert.title}` :
          `Failed to generate incident form for Alert: ${alert.title}`,
        inputTokens: incidentData?.inputTokens || 0,
        outputTokens: incidentData?.outputTokens || 0,
        executionTimeMs: executionTime,
        success,
        userId: user.id,
        organizationId,
        alertId: alert.id,
        aiProvider: incidentData?.aiProvider,
        aiModel: incidentData?.aiModel,
        metadata: success ? {
          confidence: incidentData.confidence,
          sectionsGenerated: incidentData.sections?.length || 0,
          alertSeverity: alert.severity,
          securityEventType: alert.securityEventType
        } : {
          errorType: error?.constructor.name,
          errorMessage: error?.message || 'Incident form generation failed',
          alertSeverity: alert.severity
        }
      };

      if (!success) {
        logData.errorMessage = error?.message || 'Incident form generation failed';
      }

      await aiAgentLogService.logAgentActivity(logData);
    } catch (logError) {
      console.error('Failed to log AI agent activity for incident form generation:', logError);
    }
  }

  /**
   * Validate generated incident form data
   * @param {Object} incidentData - Generated incident form data
   * @returns {Object} Validation result
   */
  validateIncidentFormData(incidentData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      completeness: 0
    };

    // Check required fields
    const requiredFields = ['title', 'description', 'severity', 'priority'];
    let completedFields = 0;

    requiredFields.forEach(field => {
      if (incidentData[field] && incidentData[field].trim().length > 0) {
        completedFields++;
      } else {
        validation.errors.push(`Missing required field: ${field}`);
        validation.isValid = false;
      }
    });

    // Check optional but recommended fields
    const recommendedFields = ['affectedSystems', 'timeline', 'actionItems', 'mitreMapping'];
    
    recommendedFields.forEach(field => {
      if (!incidentData[field] || (Array.isArray(incidentData[field]) && incidentData[field].length === 0)) {
        validation.warnings.push(`Missing recommended field: ${field}`);
      } else {
        completedFields++;
      }
    });

    // Calculate completeness percentage
    validation.completeness = Math.round((completedFields / (requiredFields.length + recommendedFields.length)) * 100);

    // Quality checks
    if (incidentData.description && incidentData.description.length < 50) {
      validation.warnings.push('Description appears to be too brief');
    }

    if (incidentData.confidence && incidentData.confidence < 70) {
      validation.warnings.push('Low AI confidence in generated data');
    }

    return validation;
  }

  /**
   * Generate incident form data with custom parameters
   * @param {Object} alert - Alert object
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} customOptions - Custom generation options
   * @returns {Object} Generated incident form data
   */
  async generateCustomIncidentForm(alert, organizationId, user, customOptions = {}) {
    const alertContext = this._prepareAlertContext(alert);
    
    // Merge custom options
    const options = {
      generateComprehensiveData: true,
      includeTimeline: true,
      includeMitreMapping: true,
      includeActionItems: true,
      ...customOptions
    };

    // Add custom context if provided
    if (customOptions.additionalContext) {
      alertContext.customContext = customOptions.additionalContext;
    }

    return await this.generateIncidentForm(alert, organizationId, user);
  }

  /**
   * Transform AI tool response to frontend-compatible format
   * Maps the nested AI tool structure to flat frontend interface
   */
  _transformToFrontendFormat(incidentData) {
    try {
      // Handle nested structure from AI tool
      const formData = incidentData;
      
      // Extract impact assessment fields
      const impactAssessment = formData.impactAssessment || {};
      const impactText = typeof impactAssessment === 'string' 
        ? impactAssessment 
        : `Technical Impact: ${impactAssessment.technicalImpact || 'N/A'}\nBusiness Impact: ${impactAssessment.businessImpact || 'N/A'}\nData Impact: ${impactAssessment.dataImpact || 'N/A'}\nEstimated Downtime: ${impactAssessment.estimatedDowntime || 'N/A'}`;

      // Extract recommended actions
      const recommendedActions = formData.recommendedActions || {};
      const actionsList = [];
      if (recommendedActions.immediate) {
        actionsList.push(...recommendedActions.immediate.map(action => `IMMEDIATE: ${action.action}`));
      }
      if (recommendedActions.shortTerm) {
        actionsList.push(...recommendedActions.shortTerm.map(action => `SHORT-TERM: ${action.action}`));
      }
      if (recommendedActions.longTerm) {
        actionsList.push(...recommendedActions.longTerm.map(action => `LONG-TERM: ${action.action}`));
      }

      // Extract stakeholders
      const stakeholders = [];
      if (formData.communicationPlan?.stakeholders) {
        stakeholders.push(...formData.communicationPlan.stakeholders);
      }

      // Build timeline as string
      let estimatedTimeline = 'Investigation and remediation timeline to be determined based on incident scope.';
      if (formData.timeline && Array.isArray(formData.timeline)) {
        estimatedTimeline = formData.timeline
          .map(event => `${event.timestamp}: ${event.event}`)
          .join('\n');
      }

      // Build investigation plan
      let investigationPlan = 'Comprehensive investigation plan to be developed.';
      if (formData.recommendedActions) {
        const steps = [];
        if (formData.recommendedActions.immediate) {
          steps.push('IMMEDIATE INVESTIGATION:');
          formData.recommendedActions.immediate.forEach(action => {
            steps.push(`- ${action.action}`);
          });
        }
        if (formData.recommendedActions.shortTerm) {
          steps.push('\nSHORT-TERM INVESTIGATION:');
          formData.recommendedActions.shortTerm.forEach(action => {
            steps.push(`- ${action.action}`);
          });
        }
        investigationPlan = steps.join('\n');
      }

      // Build containment strategy
      let containmentStrategy = 'Containment strategy to be implemented based on threat assessment.';
      if (formData.containmentSuggestions) {
        containmentStrategy = formData.containmentSuggestions
          .map(suggestion => `${suggestion.suggestion}\nImplementation: ${suggestion.implementation}`)
          .join('\n\n');
      }

      // Build response plan
      let responseplan = 'Incident response plan to be executed according to SOC procedures.';
      if (formData.recommendedActions?.immediate || formData.communicationPlan) {
        const planParts = [];
        if (formData.communicationPlan?.initialMessage) {
          planParts.push(`COMMUNICATION PLAN:\n${formData.communicationPlan.initialMessage}`);
        }
        if (formData.recommendedActions?.immediate) {
          planParts.push(`IMMEDIATE RESPONSE:\n${formData.recommendedActions.immediate.map(a => `- ${a.action}`).join('\n')}`);
        }
        responseplan = planParts.join('\n\n');
      }

      return {
        title: formData.title || 'AI Generated Incident',
        description: formData.description || 'No description provided',
        severity: formData.severity || 3,
        category: formData.category || 'other',
        responseplan,
        impactAssessment: impactText,
        recommendedActions: actionsList,
        stakeholders,
        estimatedTimeline,
        investigationPlan,
        containmentStrategy,
        confidence: formData.confidence || 85
      };
      
    } catch (error) {
      console.error('Error transforming incident form data:', error);
      // Per coding_practice.md: "for all AI functions, no fallback, no mock response. fail is fail"
      throw new Error(`Failed to transform AI-generated incident form data: ${error.message}`);
    }
  }
}

module.exports = new IncidentFormGenerationService();