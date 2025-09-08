const { models } = require('../database/models');
const aiAgentLogService = require('./aiAgentLogService');

/**
 * Incident Threat Hunt Generation Service
 * Handles AI-powered threat hunt generation from security incidents
 * with comprehensive context analysis and data structuring
 */
class IncidentThreatHuntGenerationService {

  /**
   * Generate threat hunt data from an incident
   * @param {Object} incident - Incident object with full context
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @returns {Object} Generated threat hunt data
   */
  async generateThreatHunt(incident, organizationId, user) {
    const startTime = Date.now();

    try {
      // Prepare comprehensive context from Security Incident AND related alerts
      const incidentContext = await this._prepareIncidentContext(incident, organizationId);

      // Build comprehensive prompt using Incident + Alerts + Timeline context
      const promptContent = this._buildPromptContent(incidentContext);

      // Execute the AI tool to generate structured threat hunt data
      const aiToolExecutor = require('../tools/common/toolExecutor');
      
      const toolResult = await aiToolExecutor.executeTool(
        'generate_threat_hunt_from_incident',
        {
          incidentContext,
          promptContent,
          organizationId,
          userId: user.id,
          generateComprehensiveData: true,
          includeHuntQueries: true,
          includeMitreMapping: true,
          includeInvestigationSteps: true
        },
        {
          sessionId: `threat_hunt_generation_${incident.id}_${Date.now()}`,
          userId: user.id,
          organizationId
        }
      );

      // Enhanced validation for threat hunt tool results
      if (!toolResult.success) {
        throw new Error(`Threat hunt generation failed: ${toolResult.error}`);
      }

      console.log('🎯 DEBUG: Tool execution successful, processing threat hunt data...');
      console.log('🎯 DEBUG: Tool result structure:', Object.keys(toolResult));
      console.log('🎯 DEBUG: Tool result success:', toolResult.success);
      
      // Debug the tool result structure
      console.log('🎯 DEBUG: Raw tool result keys:', Object.keys(toolResult));
      console.log('🎯 DEBUG: Tool result has result field:', !!toolResult.result);
      console.log('🎯 DEBUG: Tool result has data field:', !!toolResult.data);
      
      // Validate that we have actual threat hunt data
      const toolResultData = toolResult;
      // Handle nested result structure: toolResult.result.result contains the actual threat hunt data
      let actualThreatHuntData = toolResultData.result || toolResultData.data || toolResultData;
      
      // If we got the tool wrapper, extract the actual threat hunt data from nested result
      if (actualThreatHuntData && actualThreatHuntData.success && actualThreatHuntData.result) {
        console.log('🎯 DEBUG: Found nested tool result structure, extracting inner result');
        actualThreatHuntData = actualThreatHuntData.result;
      }
      
      console.log('🎯 DEBUG: Extracted threat hunt data type:', typeof actualThreatHuntData);
      console.log('🎯 DEBUG: Extracted threat hunt data keys:', actualThreatHuntData ? Object.keys(actualThreatHuntData) : 'No data');
      console.log('🎯 DEBUG: Title field value:', actualThreatHuntData?.title);
      console.log('🎯 DEBUG: Priority field value:', actualThreatHuntData?.priority);
      
      // Check for empty or incomplete threat hunt data
      if (!actualThreatHuntData || typeof actualThreatHuntData !== 'object') {
        console.error('🎯 ERROR: Tool returned success but no valid threat hunt data');
        throw new Error('AI service returned empty threat hunt data. Please try again.');
      }

      // Validate critical fields - use more lenient validation for now
      const criticalFields = ['title'];
      const missingCriticalFields = criticalFields.filter(field => {
        const value = actualThreatHuntData[field];
        return !value || value === '' || value === 'undefined' || value === null;
      });
      
      if (missingCriticalFields.length > 0) {
        console.error('🎯 ERROR: Missing critical threat hunt fields:', missingCriticalFields);
        console.error('🎯 ERROR: Available fields:', Object.keys(actualThreatHuntData));
        throw new Error(`AI service returned incomplete threat hunt data (missing: ${missingCriticalFields.join(', ')}). Please try again.`);
      }

      console.log('🎯 DEBUG: Threat hunt data validation passed');
      console.log('🎯 DEBUG: Title:', actualThreatHuntData.title);
      console.log('🎯 DEBUG: Priority:', actualThreatHuntData.priority);
      
      const executionTime = Date.now() - startTime;
      
      console.log('🎯 DEBUG: Tool result data received:', !!toolResultData);
      console.log('🎯 DEBUG: Tool result data keys:', toolResultData ? Object.keys(toolResultData) : 'No data');
      console.log('🎯 DEBUG: Execution time:', executionTime, 'ms');

      // Create timeline event for threat hunt generation (wrapped in try-catch)
      try {
        console.log('🎯 DEBUG: Creating timeline event...');
        await this._createTimelineEvent(incident, toolResultData, executionTime);
        console.log('🎯 DEBUG: Timeline event created successfully');
      } catch (timelineError) {
        console.error('🎯 WARNING: Failed to create timeline event, but continuing with main operation:', timelineError.message);
        // Don't throw - continue with the main threat hunt response
      }

      // Log AI agent activity (wrapped in try-catch to prevent main operation failure)
      try {
        console.log('🎯 DEBUG: Logging AI agent activity...');
        await this._logAgentActivity(incident, toolResultData, executionTime, user, organizationId, true);
        console.log('🎯 DEBUG: AI agent activity logged successfully');
      } catch (logError) {
        console.error('🎯 WARNING: Failed to log AI agent activity, but continuing with main operation:', logError.message);
        // Don't throw - continue with the main threat hunt response
      }

      // Prepare response with structured threat hunt data
      // Use the already validated threat hunt data
      
      const response = {
        success: true,
        threatHuntData: {
          success: true,
          result: actualThreatHuntData
        },
        incident: {
          id: incident.id,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          category: incident.category
        },
        processingTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };
      
      console.log('🎯 DEBUG: Final response prepared successfully');
      console.log('🎯 DEBUG: Response success:', response.success);
      console.log('🎯 DEBUG: Response has threatHuntData:', !!response.threatHuntData);
      console.log('🎯 DEBUG: ThreatHuntData success:', response.threatHuntData?.success);
      console.log('🎯 DEBUG: ThreatHuntData has result:', !!response.threatHuntData?.result);
      console.log('🎯 DEBUG: Response keys:', Object.keys(response));
      
      return response;

    } catch (error) {
      console.error('Threat hunt generation failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Log failed AI agent activity
      await this._logAgentActivity(incident, null, processingTime, user, organizationId, false, error);
      
      throw error;
    }
  }

  /**
   * Prepare comprehensive incident context including related alerts and timeline
   * @private
   */
  async _prepareIncidentContext(incident, organizationId) {
    // Fetch related alerts for additional context
    const relatedAlerts = await this._fetchRelatedAlerts(incident, organizationId);
    
    // Extract IOCs from incident and alerts
    const extractedIOCs = this._extractIOCs(incident, relatedAlerts);
    
    // Analyze MITRE ATT&CK techniques from incident metadata
    const mitreContext = this._analyzeMitreContext(incident);

    return {
      // Core incident data
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      category: incident.category,
      status: incident.status,
      createdAt: incident.createdAt,
      assignedToName: incident.assignedToName,
      
      // Incident metadata (additional information fields)
      metadata: {
        responseplan: incident.metadata?.responseplan || '',
        impactAssessment: incident.metadata?.impactAssessment || '',
        investigationPlan: incident.metadata?.investigationPlan || '',
        containmentStrategy: incident.metadata?.containmentStrategy || '',
        estimatedTimeline: incident.metadata?.estimatedTimeline || ''
      },
      
      // Timeline events for understanding incident progression
      timeline: incident.timeline || [],
      
      // Related alerts for comprehensive context
      relatedAlerts: relatedAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        sourceSystem: alert.sourceSystem,
        assetName: alert.assetName,
        eventTime: alert.eventTime,
        rawData: alert.rawData
      })),
      
      // Extracted IOCs for hunt focus
      extractedIOCs: extractedIOCs,
      
      // MITRE ATT&CK context
      mitreContext: mitreContext,
      
      // Alert count and summary
      alertCount: relatedAlerts.length,
      
      // Environmental context
      organizationId: organizationId
    };
  }

  /**
   * Fetch related alerts for the incident
   * @private
   */
  async _fetchRelatedAlerts(incident, organizationId) {
    try {
      // Try to find alerts that might be related to this incident
      // This could be based on time range, assets, or explicit relationships
      const alerts = await models.Alert.findAll({
        where: {
          organizationId: organizationId,
          // Look for alerts around the incident creation time (±6 hours)
          eventTime: {
            [require('sequelize').Op.between]: [
              new Date(new Date(incident.createdAt).getTime() - 6 * 60 * 60 * 1000),
              new Date(new Date(incident.createdAt).getTime() + 6 * 60 * 60 * 1000)
            ]
          }
        },
        limit: 10,
        order: [['eventTime', 'DESC']]
      });

      return alerts || [];
    } catch (error) {
      console.error('Failed to fetch related alerts:', error);
      return [];
    }
  }

  /**
   * Extract potential IOCs from incident and alert data
   * @private
   */
  _extractIOCs(incident, relatedAlerts) {
    const iocs = [];
    
    // Extract from incident description and metadata
    iocs.push(...this._extractIOCsFromText(incident.description || ''));
    if (incident.metadata) {
      Object.values(incident.metadata).forEach(value => {
        if (typeof value === 'string') {
          iocs.push(...this._extractIOCsFromText(value));
        }
      });
    }
    
    // Extract from related alerts
    relatedAlerts.forEach(alert => {
      iocs.push(...this._extractIOCsFromText(alert.description || ''));
      if (alert.rawData) {
        iocs.push(...this._extractIOCsFromText(JSON.stringify(alert.rawData)));
      }
    });
    
    // Deduplicate and return
    return [...new Set(iocs)].filter(ioc => ioc && ioc.length > 3);
  }

  /**
   * Extract IOCs from text using regex patterns
   * @private
   */
  _extractIOCsFromText(text) {
    if (!text || typeof text !== 'string') return [];
    
    const iocs = [];
    
    // IP Address pattern (IPv4)
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = text.match(ipPattern) || [];
    iocs.push(...ips);
    
    // Domain pattern
    const domainPattern = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;
    const domains = text.match(domainPattern) || [];
    iocs.push(...domains);
    
    // Hash patterns (MD5, SHA1, SHA256)
    const hashPatterns = [
      /\b[a-fA-F0-9]{32}\b/g,  // MD5
      /\b[a-fA-F0-9]{40}\b/g,  // SHA1
      /\b[a-fA-F0-9]{64}\b/g   // SHA256
    ];
    
    hashPatterns.forEach(pattern => {
      const hashes = text.match(pattern) || [];
      iocs.push(...hashes);
    });
    
    return iocs;
  }

  /**
   * Analyze MITRE ATT&CK context from incident
   * @private
   */
  _analyzeMitreContext(incident) {
    const context = {
      tactics: [],
      techniques: [],
      category: incident.category || 'unknown'
    };
    
    // Map incident categories to common MITRE tactics
    const categoryToTactics = {
      'malware': ['execution', 'persistence', 'defense-evasion'],
      'intrusion': ['initial-access', 'execution', 'persistence'],
      'data_breach': ['collection', 'exfiltration'],
      'policy_violation': ['privilege-escalation', 'credential-access'],
      'insider_threat': ['collection', 'exfiltration', 'impact']
    };
    
    if (categoryToTactics[incident.category]) {
      context.tactics = categoryToTactics[incident.category];
    }
    
    return context;
  }

  /**
   * Build comprehensive prompt content for AI generation
   * @private
   */
  _buildPromptContent(incidentContext) {
    return `Generate a comprehensive threat hunt based on the following incident analysis:

INCIDENT DETAILS:
Title: ${incidentContext.title}
Description: ${incidentContext.description}
Severity: ${incidentContext.severity}
Category: ${incidentContext.category}
Status: ${incidentContext.status}

ADDITIONAL INCIDENT INFORMATION:
${Object.entries(incidentContext.metadata).map(([key, value]) => 
  value ? `${key}: ${value}` : ''
).filter(Boolean).join('\n')}

RELATED ALERTS (${incidentContext.alertCount}):
${incidentContext.relatedAlerts.map(alert => 
  `- [${alert.severity}] ${alert.title} (${alert.sourceSystem}) - ${alert.description?.substring(0, 200)}...`
).join('\n')}

EXTRACTED IOCs:
${incidentContext.extractedIOCs.join(', ')}

TIMELINE EVENTS:
${incidentContext.timeline.map(event => 
  `- ${event.timestamp}: ${event.title} - ${event.description || ''}`
).join('\n')}

Please generate a structured threat hunt that includes:
1. Hunt title and description
2. Priority and category mapping
3. Comprehensive hunting plan
4. Success criteria and estimated effort
5. Specific hunt queries for the identified IOCs
6. Investigation steps based on the incident timeline
7. Expected findings and coverage gaps analysis
8. MITRE ATT&CK technique mapping`;
  }

  /**
   * Create timeline event for threat hunt generation
   * @private
   */
  async _createTimelineEvent(incident, toolResultData, executionTime) {
    try {
      if (incident.timeline) {
        // Extract the actual threat hunt data for timeline
        const actualData = toolResultData.result || toolResultData;
        const huntTitle = actualData.title || 'Threat Hunt';
        
        // Add timeline event to track threat hunt generation
        await models.TimelineEvent.create({
          incidentId: incident.id,
          type: 'action',
          title: 'Threat Hunt Generated',
          description: `AI-generated threat hunt: "${huntTitle}" (${executionTime}ms)`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to create timeline event:', error);
      // Don't fail the main operation if timeline creation fails
    }
  }

  /**
   * Log AI agent activity for threat hunt generation
   * @private
   */
  async _logAgentActivity(incident, toolResultData, processingTime, user, organizationId, success, error = null) {
    try {
      // Extract the actual threat hunt data for logging
      const actualData = success ? (toolResultData?.result || toolResultData) : null;
      
      await aiAgentLogService.logAgentActivity({
        agentName: 'Threat Hunt Generator Agent',
        taskName: 'generate_threat_hunt_from_incident',
        description: 'Generate comprehensive threat hunt from security incident context',
        executionTimeMs: processingTime,
        success: success,
        errorMessage: error?.message,
        userId: user.id,
        organizationId: organizationId,
        incidentId: incident.id,
        metadata: {
          feature: 'incident_threat_hunt_generation',
          version: '1.0.0',
          inputData: {
            incidentId: incident.id,
            incidentTitle: incident.title,
            incidentSeverity: incident.severity,
            incidentCategory: incident.category
          },
          outputData: success ? {
            threatHuntTitle: actualData?.title,
            priority: actualData?.priority,
            huntType: actualData?.huntType,
            confidence: actualData?.confidence
          } : null
        }
      });
    } catch (logError) {
      console.error('Failed to log AI agent activity:', logError);
      // Don't fail the main operation if logging fails
    }
  }
}

module.exports = new IncidentThreatHuntGenerationService();