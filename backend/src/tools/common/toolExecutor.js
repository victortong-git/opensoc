const { MitreToolExecutor } = require('../mitre/mitreTools');
const { SecurityAlertsExecutor, SECURITY_ALERT_TOOLS } = require('../security/securityAlertsTools');
const { AlertAIExecutor, ALERT_AI_TOOLS } = require('../security/alertAITools');
const { AlertPlaybookExecutor, ALERT_PLAYBOOK_TOOLS } = require('../security/alertPlaybookTools');
const { IncidentExecutor, INCIDENT_TOOLS } = require('../security/incidentTools');
const { ReportingExecutor, REPORTING_TOOLS } = require('../security/reportingTools');
const { RAGExecutor, RAG_TOOLS } = require('../security/ragTools');
const { ThreatIntelExecutor, THREAT_INTEL_TOOLS } = require('../security/threatIntelTools');
const { SpecificRecordExecutor, SPECIFIC_RECORD_TOOLS } = require('../security/specificRecordTools');
const { IncidentDraftExecutor, INCIDENT_DRAFT_TOOLS } = require('../security/incidentDraftTools');
const { ProofreadingExecutor, PROOFREADING_TOOLS } = require('../security/proofReadingTools');
const { IncidentThreatHuntExecutor } = require('../security/incidentThreatHuntTools');

/**
 * AI Tool Execution Infrastructure
 * Handles tool execution, logging, and GPT-OSS integration with HIGH reasoning effort
 */

class AIToolExecutor {
  constructor() {
    this.mitreExecutor = new MitreToolExecutor();
    this.securityAlertsExecutor = new SecurityAlertsExecutor();
    this.alertAIExecutor = new AlertAIExecutor();
    this.alertPlaybookExecutor = new AlertPlaybookExecutor();
    this.incidentExecutor = new IncidentExecutor();
    this.reportingExecutor = new ReportingExecutor();
    this.ragExecutor = new RAGExecutor();
    this.threatIntelExecutor = new ThreatIntelExecutor();
    this.specificRecordExecutor = new SpecificRecordExecutor();
    this.incidentDraftExecutor = new IncidentDraftExecutor();
    this.proofreadingExecutor = new ProofreadingExecutor();
    this.incidentThreatHuntExecutor = new IncidentThreatHuntExecutor();
    
    this.supportedTools = new Map();
    this.initializeTools();
  }

  initializeTools() {
    // Register MITRE tools
    this.supportedTools.set('search_mitre_techniques', this.mitreExecutor.searchMitreTechniques.bind(this.mitreExecutor));
    this.supportedTools.set('get_technique_details', this.mitreExecutor.getTechniqueDetails.bind(this.mitreExecutor));
    this.supportedTools.set('get_mitre_tactics', this.mitreExecutor.getMitreTactics.bind(this.mitreExecutor));
    this.supportedTools.set('map_threat_hunt_to_mitre', this.mitreExecutor.mapThreatHuntToMitre.bind(this.mitreExecutor));
    this.supportedTools.set('analyze_attack_patterns', this.mitreExecutor.analyzeAttackPattern.bind(this.mitreExecutor));
    this.supportedTools.set('find_related_techniques', this.mitreExecutor.getTechniqueRelationships.bind(this.mitreExecutor));
    this.supportedTools.set('generate_threat_hunt_hypotheses', this.mitreExecutor.generateHuntHypothesis.bind(this.mitreExecutor));
    this.supportedTools.set('create_detection_rules', this.mitreExecutor.suggestDetectionTechniques.bind(this.mitreExecutor));
    this.supportedTools.set('assess_coverage', this.mitreExecutor.assessCoverage?.bind(this.mitreExecutor) || this.mitreExecutor.getMitreTactics.bind(this.mitreExecutor));
    this.supportedTools.set('search_threat_groups', this.mitreExecutor.searchThreatGroups?.bind(this.mitreExecutor) || this.mitreExecutor.analyzeAttackPattern.bind(this.mitreExecutor));

    // Register Security Alert tools
    this.supportedTools.set('get_latest_critical_alerts', this.securityAlertsExecutor.getLatestCriticalAlerts.bind(this.securityAlertsExecutor));
    this.supportedTools.set('analyze_alert_trends', this.securityAlertsExecutor.analyzeAlertTrends.bind(this.securityAlertsExecutor));
    this.supportedTools.set('get_alerts_by_asset', this.securityAlertsExecutor.getAlertsByAsset.bind(this.securityAlertsExecutor));
    this.supportedTools.set('search_alerts_by_indicators', this.securityAlertsExecutor.searchAlertsByIndicators.bind(this.securityAlertsExecutor));

    // Register Alert AI tools
    this.supportedTools.set('classify_alert_type_and_tags', this.alertAIExecutor.classifyAlertTypeAndTags.bind(this.alertAIExecutor));
    this.supportedTools.set('analyze_alert_comprehensive', this.alertAIExecutor.analyzeAlertComprehensive.bind(this.alertAIExecutor));
    this.supportedTools.set('generate_alert_event_tags', this.alertAIExecutor.generateAlertEventTags.bind(this.alertAIExecutor));

    // Register Alert Playbook tools
    this.supportedTools.set('generate_immediate_action_playbook', this.alertPlaybookExecutor.generateImmediateActionPlaybook.bind(this.alertPlaybookExecutor));
    this.supportedTools.set('generate_investigation_playbook', this.alertPlaybookExecutor.generateInvestigationPlaybook.bind(this.alertPlaybookExecutor));

    // Register Incident Management tools
    this.supportedTools.set('get_active_incidents', this.incidentExecutor.getActiveIncidents.bind(this.incidentExecutor));
    this.supportedTools.set('get_incident_details', this.incidentExecutor.getIncidentDetails.bind(this.incidentExecutor));
    this.supportedTools.set('suggest_incident_response_steps', this.incidentExecutor.suggestIncidentResponseSteps.bind(this.incidentExecutor));
    this.supportedTools.set('analyze_incident_patterns', this.incidentExecutor.analyzeIncidentPatterns.bind(this.incidentExecutor));
    this.supportedTools.set('generate_incident_summary_report', this.incidentExecutor.generateIncidentSummaryReport.bind(this.incidentExecutor));

    // Register Reporting tools
    this.supportedTools.set('generate_security_dashboard_summary', this.reportingExecutor.generateSecurityDashboardSummary.bind(this.reportingExecutor));
    this.supportedTools.set('generate_threat_intelligence_report', this.reportingExecutor.generateThreatIntelligenceReport.bind(this.reportingExecutor));
    this.supportedTools.set('generate_compliance_report', this.reportingExecutor.generateComplianceReport.bind(this.reportingExecutor));
    this.supportedTools.set('generate_asset_security_report', this.reportingExecutor.generateAssetSecurityReport.bind(this.reportingExecutor));
    this.supportedTools.set('generate_executive_summary', this.reportingExecutor.generateExecutiveSummary.bind(this.reportingExecutor));

    // Register RAG/Context tools
    this.supportedTools.set('intelligent_hybrid_search', this.ragExecutor.intelligentHybridSearch.bind(this.ragExecutor));
    this.supportedTools.set('smart_context_search', this.ragExecutor.smartContextSearch.bind(this.ragExecutor));
    this.supportedTools.set('find_related_security_data', this.ragExecutor.findRelatedSecurityData.bind(this.ragExecutor));
    this.supportedTools.set('semantic_playbook_search', this.ragExecutor.semanticPlaybookSearch.bind(this.ragExecutor));
    this.supportedTools.set('contextual_threat_analysis', this.ragExecutor.contextualThreatAnalysis.bind(this.ragExecutor));
    this.supportedTools.set('intelligent_knowledge_extraction', this.ragExecutor.intelligentKnowledgeExtraction.bind(this.ragExecutor));

    // Register Specific Record tools
    this.supportedTools.set('get_specific_alert_by_id', this.specificRecordExecutor.getSpecificAlertById.bind(this.specificRecordExecutor));
    this.supportedTools.set('get_specific_incident_by_id', this.specificRecordExecutor.getSpecificIncidentById.bind(this.specificRecordExecutor));
    this.supportedTools.set('get_alerts_by_criteria', this.specificRecordExecutor.getAlertsByCriteria.bind(this.specificRecordExecutor));
    this.supportedTools.set('get_incidents_by_criteria', this.specificRecordExecutor.getIncidentsByCriteria.bind(this.specificRecordExecutor));
    this.supportedTools.set('search_assets_by_attributes', this.specificRecordExecutor.searchAssetsByAttributes.bind(this.specificRecordExecutor));
    this.supportedTools.set('get_iocs_by_criteria', this.specificRecordExecutor.getIOCsByCriteria.bind(this.specificRecordExecutor));
    this.supportedTools.set('intelligent_query_router', this.specificRecordExecutor.intelligentQueryRouter.bind(this.specificRecordExecutor));

    // Register Threat Intelligence tools
    this.supportedTools.set('analyze_threat_indicators', this.threatIntelExecutor.analyzeThreatIndicators.bind(this.threatIntelExecutor));
    this.supportedTools.set('search_threat_intelligence', this.threatIntelExecutor.searchThreatIntelligence.bind(this.threatIntelExecutor));
    this.supportedTools.set('generate_threat_profile', this.threatIntelExecutor.generateThreatProfile.bind(this.threatIntelExecutor));
    this.supportedTools.set('assess_ioc_quality', this.threatIntelExecutor.assessIOCQuality.bind(this.threatIntelExecutor));
    this.supportedTools.set('detect_threat_campaigns', this.threatIntelExecutor.detectThreatCampaigns.bind(this.threatIntelExecutor));

    // Register Incident Draft tools
    this.supportedTools.set('analyze_incident_context', this.incidentDraftExecutor.analyzeIncidentContext.bind(this.incidentDraftExecutor));
    this.supportedTools.set('draft_response_plan', this.incidentDraftExecutor.draftResponsePlan.bind(this.incidentDraftExecutor));
    this.supportedTools.set('draft_impact_assessment', this.incidentDraftExecutor.draftImpactAssessment.bind(this.incidentDraftExecutor));
    this.supportedTools.set('draft_investigation_plan', this.incidentDraftExecutor.draftInvestigationPlan.bind(this.incidentDraftExecutor));
    this.supportedTools.set('draft_containment_strategy', this.incidentDraftExecutor.draftContainmentStrategy.bind(this.incidentDraftExecutor));
    this.supportedTools.set('draft_estimated_timeline', this.incidentDraftExecutor.draftEstimatedTimeline.bind(this.incidentDraftExecutor));
    this.supportedTools.set('generate_incident_form_from_alert', this.incidentDraftExecutor.generateIncidentFormFromAlert.bind(this.incidentDraftExecutor));

    // Register Proofreading tools
    this.supportedTools.set('analyze_text_quality', this.proofreadingExecutor.analyzeTextQuality.bind(this.proofreadingExecutor));
    this.supportedTools.set('improve_grammar_and_spelling', this.proofreadingExecutor.improveGrammarAndSpelling.bind(this.proofreadingExecutor));
    this.supportedTools.set('enhance_professional_tone', this.proofreadingExecutor.enhanceProfessionalTone.bind(this.proofreadingExecutor));
    this.supportedTools.set('validate_technical_terminology', this.proofreadingExecutor.validateTechnicalTerminology.bind(this.proofreadingExecutor));
    this.supportedTools.set('assess_content_completeness', this.proofreadingExecutor.assessContentCompleteness.bind(this.proofreadingExecutor));
    this.supportedTools.set('ensure_clarity_and_conciseness', this.proofreadingExecutor.ensureClarityAndConciseness.bind(this.proofreadingExecutor));
    this.supportedTools.set('validate_consistency', this.proofreadingExecutor.validateConsistency.bind(this.proofreadingExecutor));

    // Register Incident Threat Hunt tools
    this.supportedTools.set('generate_threat_hunt_from_incident', this.incidentThreatHuntExecutor.executeTool.bind(this.incidentThreatHuntExecutor, 'generate_threat_hunt_from_incident'));
    this.supportedTools.set('proofread_threat_hunt_content', this.incidentThreatHuntExecutor.executeTool.bind(this.incidentThreatHuntExecutor, 'proofread_threat_hunt_content'));

    console.log(`🔧 Initialized ${this.supportedTools.size} AI tools across 11 categories`);
    console.log(`📊 Tools breakdown:`, {
      mitre: 8,
      securityAlerts: 4,
      alertAI: 3,
      alertPlaybooks: 2,
      incidentManagement: 5,
      reporting: 5,
      contextRetrieval: 6,
      threatIntelligence: 5,
      incidentDrafting: 7,
      proofreading: 7
    });
  }

  /**
   * Execute a tool with comprehensive logging
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} parameters - Tool parameters
   * @param {Object} context - Execution context (user, session, etc.)
   * @returns {Object} Tool execution result
   */
  async executeTool(toolName, parameters, context = {}) {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();

    console.log(`🛠️ Executing tool: ${toolName} [${executionId}]`);

    try {
      // Log tool call start
      await this.logToolCall({
        executionId,
        toolName,
        parameters,
        context,
        status: 'started',
        timestamp: new Date()
      });

      // Validate tool exists
      if (!this.supportedTools.has(toolName)) {
        throw new Error(`Unknown tool: ${toolName}. Available tools: ${Array.from(this.supportedTools.keys()).join(', ')}`);
      }

      // Execute tool with context parameters (organizationId, userId, etc.)
      const toolFunction = this.supportedTools.get(toolName);
      const result = await toolFunction({ ...parameters, ...context });

      const executionTime = Date.now() - startTime;

      // Log successful completion
      await this.logToolCall({
        executionId,
        toolName,
        parameters,
        context,
        result,
        status: 'completed',
        executionTimeMs: executionTime,
        timestamp: new Date()
      });

      console.log(`✅ Tool ${toolName} completed in ${executionTime}ms [${executionId}]`);

      return {
        executionId,
        toolName,
        success: true,
        result,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`❌ Tool ${toolName} failed: ${error.message} [${executionId}]`);

      // Log error
      await this.logToolCall({
        executionId,
        toolName,
        parameters,
        context,
        error: error.message,
        status: 'failed',
        executionTimeMs: executionTime,
        timestamp: new Date()
      });

      return {
        executionId,
        toolName,
        success: false,
        error: error.message,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute multiple tools in parallel or sequence
   * @param {Array} toolCalls - Array of {toolName, parameters} objects
   * @param {Object} context - Execution context
   * @param {boolean} parallel - Execute in parallel (default: false)
   * @returns {Array} Array of execution results
   */
  async executeMultipleTools(toolCalls, context = {}, parallel = false) {
    console.log(`🔄 Executing ${toolCalls.length} tools ${parallel ? 'in parallel' : 'sequentially'}`);

    if (parallel) {
      const promises = toolCalls.map(call => 
        this.executeTool(call.toolName, call.parameters, context)
      );
      return await Promise.all(promises);
    } else {
      const results = [];
      for (const call of toolCalls) {
        const result = await this.executeTool(call.toolName, call.parameters, context);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Get available tools and their schemas
   * @returns {Object} Available tools with their definitions
   */
  getAvailableTools() {
    const { MITRE_TOOLS } = require('../mitre/mitreTools');
    
    return {
      mitre_tools: MITRE_TOOLS,
      security_alert_tools: SECURITY_ALERT_TOOLS,
      alert_ai_tools: ALERT_AI_TOOLS,
      incident_tools: INCIDENT_TOOLS,
      reporting_tools: REPORTING_TOOLS,
      rag_tools: RAG_TOOLS,
      specific_record_tools: SPECIFIC_RECORD_TOOLS,
      threat_intel_tools: THREAT_INTEL_TOOLS,
      incident_draft_tools: INCIDENT_DRAFT_TOOLS,
      proofreading_tools: PROOFREADING_TOOLS,
      incident_threat_hunt_tools: ['generate_threat_hunt_from_incident', 'proofread_threat_hunt_content'],
      tool_count: this.supportedTools.size,
      categories: {
        mitre: MITRE_TOOLS.length,
        security_alerts: SECURITY_ALERT_TOOLS.length,
        alert_ai: ALERT_AI_TOOLS.length,
        incident_management: INCIDENT_TOOLS.length,
        reporting: REPORTING_TOOLS.length,
        context_retrieval: RAG_TOOLS.length,
        specific_record_lookup: SPECIFIC_RECORD_TOOLS.length,
        threat_intelligence: THREAT_INTEL_TOOLS.length,
        incident_drafting: INCIDENT_DRAFT_TOOLS.length,
        proofreading: PROOFREADING_TOOLS.length,
        incident_threat_hunt: 2
      }
    };
  }

  /**
   * Generate unique execution ID
   * @returns {string} Unique execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log tool call to database (ai_tool_calling_log table)
   * @param {Object} logData - Log data to store
   */
  async logToolCall(logData) {
    try {
      const AIToolCallingLog = require('../../database/models/AIToolCallingLog');
      
      await AIToolCallingLog.create({
        sessionId: logData.context?.sessionId || `tool_session_${Date.now()}`,
        userId: logData.context?.userId || null,
        organizationId: logData.context?.organizationId || null,
        modelName: 'gpt-oss:20b',
        reasoningEffort: 'high',
        userPrompt: `Tool execution: ${logData.toolName}`,
        systemInstructions: 'MITRE ATT&CK tool execution',
        toolName: logData.toolName,
        toolParameters: logData.parameters || {},
        toolCallId: logData.executionId,
        aiReasoning: `Executing ${logData.toolName} tool for MITRE ATT&CK analysis`,
        decisionConfidence: 0.95,
        toolExecutionStart: logData.timestamp,
        toolExecutionEnd: logData.status === 'completed' ? new Date() : null,
        toolExecutionDurationMs: logData.executionTimeMs || null,
        toolResponse: logData.result || null,
        toolExecutionSuccess: logData.status === 'completed',
        toolExecutionError: logData.error || null,
        aiFinalResponse: logData.status === 'completed' ? 'Tool executed successfully' : 'Tool execution failed',
        responseUsesToolResult: logData.status === 'completed',
        isDemoSession: false,
        hackathonDemoTag: 'mitre_attack_integration',
        threatHuntId: logData.context?.threatHuntId || null
      });

    } catch (error) {
      console.error('❌ Error logging tool call:', error.message);
      // Don't throw here to avoid breaking tool execution
    }
  }

  /**
   * Get tool execution statistics
   * @param {Object} filters - Optional filters (timeRange, toolName, status)
   * @returns {Object} Execution statistics
   */
  async getExecutionStats(filters = {}) {
    try {
      const AIToolCallingLog = require('../../database/models/AIToolCallingLog');
      const { Op } = require('sequelize');

      const whereClause = {};

      if (filters.timeRange) {
        whereClause.timestamp = {
          [Op.gte]: new Date(Date.now() - filters.timeRange)
        };
      }

      if (filters.toolName) {
        whereClause.toolName = filters.toolName;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const [totalCalls, successfulCalls, failedCalls] = await Promise.all([
        AIToolCallingLog.count({ where: whereClause }),
        AIToolCallingLog.count({ where: { ...whereClause, status: 'completed' } }),
        AIToolCallingLog.count({ where: { ...whereClause, status: 'failed' } })
      ]);

      const avgExecutionTime = await AIToolCallingLog.findOne({
        where: { ...whereClause, status: 'completed' },
        attributes: [
          [AIToolCallingLog.sequelize.fn('AVG', AIToolCallingLog.sequelize.col('execution_time_ms')), 'avgTime']
        ]
      });

      return {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(2) : 0,
        averageExecutionTimeMs: Math.round(avgExecutionTime?.dataValues?.avgTime || 0),
        filters
      };

    } catch (error) {
      console.error('❌ Error getting execution stats:', error.message);
      return {
        error: error.message,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        successRate: 0,
        averageExecutionTimeMs: 0
      };
    }
  }

  /**
   * Get recent tool executions
   * @param {number} limit - Number of recent executions to retrieve
   * @param {Object} filters - Optional filters
   * @returns {Array} Recent executions
   */
  async getRecentExecutions(limit = 50, filters = {}) {
    try {
      const AIToolCallingLog = require('../../database/models/AIToolCallingLog');
      const { Op } = require('sequelize');

      const whereClause = {};

      if (filters.toolName) {
        whereClause.toolName = filters.toolName;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      const executions = await AIToolCallingLog.findAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit,
        attributes: [
          'executionId',
          'toolName',
          'status',
          'executionTimeMs',
          'timestamp',
          'error',
          'userId',
          'sessionId'
        ]
      });

      return executions.map(exec => exec.toJSON());

    } catch (error) {
      console.error('❌ Error getting recent executions:', error.message);
      return [];
    }
  }

  /**
   * Validate tool parameters against schema
   * @param {string} toolName - Tool name
   * @param {Object} parameters - Parameters to validate
   * @returns {Object} Validation result
   */
  validateToolParameters(toolName, parameters) {
    const { MITRE_TOOLS } = require('../mitre/mitreTools');
    
    // Collect all tool definitions from all categories
    const allTools = [
      ...MITRE_TOOLS,
      ...SECURITY_ALERT_TOOLS,
      ...ALERT_AI_TOOLS,
      ...INCIDENT_TOOLS,
      ...REPORTING_TOOLS,
      ...RAG_TOOLS,
      ...SPECIFIC_RECORD_TOOLS,
      ...THREAT_INTEL_TOOLS,
      ...INCIDENT_DRAFT_TOOLS,
      ...PROOFREADING_TOOLS
    ];
    
    const toolDef = allTools.find(tool => tool.function.name === toolName);
    
    if (!toolDef) {
      return {
        valid: false,
        error: `Tool ${toolName} not found. Available tools: ${Array.from(this.supportedTools.keys()).join(', ')}`
      };
    }

    const schema = toolDef.function.parameters;
    const required = schema.required || [];
    const properties = schema.properties || {};

    // Check required parameters
    for (const requiredParam of required) {
      if (!(requiredParam in parameters)) {
        return {
          valid: false,
          error: `Missing required parameter: ${requiredParam}`
        };
      }
    }

    // Validate parameter types (basic validation)
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      if (properties[paramName]) {
        const expectedType = properties[paramName].type;
        const actualType = Array.isArray(paramValue) ? 'array' : typeof paramValue;
        
        if (expectedType !== actualType) {
          return {
            valid: false,
            error: `Parameter ${paramName} should be ${expectedType}, got ${actualType}`
          };
        }
      }
    }

    return {
      valid: true,
      message: 'Parameters valid',
      toolCategory: toolDef.function.category || 'unknown'
    };
  }

  /**
   * Get all available tool definitions for GPT-OSS
   * @param {Array} enabledTools - List of enabled tool names (optional filter)
   * @returns {Array} Tool definitions in GPT-OSS format
   */
  getToolDefinitionsForGPTOSS(enabledTools = null) {
    const { MITRE_TOOLS } = require('../mitre/mitreTools');
    
    // Collect all tool definitions
    const allTools = [
      ...MITRE_TOOLS,
      ...SECURITY_ALERT_TOOLS,
      ...ALERT_AI_TOOLS,
      ...INCIDENT_TOOLS,
      ...REPORTING_TOOLS,
      ...RAG_TOOLS,
      ...SPECIFIC_RECORD_TOOLS,
      ...THREAT_INTEL_TOOLS,
      ...INCIDENT_DRAFT_TOOLS,
      ...PROOFREADING_TOOLS
    ];

    // Filter by enabled tools if provided
    if (enabledTools && Array.isArray(enabledTools)) {
      return allTools.filter(tool => enabledTools.includes(tool.function.name));
    }

    return allTools;
  }

  /**
   * Execute tool with user's enabled tools filter
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} parameters - Tool parameters
   * @param {Object} context - Execution context including enabledTools
   * @returns {Object} Tool execution result
   */
  async executeToolWithFilter(toolName, parameters, context = {}) {
    const enabledTools = context.enabledTools || [];
    
    // Check if tool is enabled for this user/conversation
    if (enabledTools.length > 0 && !enabledTools.includes(toolName)) {
      return {
        success: false,
        error: `Tool ${toolName} is not enabled for this conversation`,
        toolName,
        timestamp: new Date().toISOString()
      };
    }

    // Execute the tool normally
    return await this.executeTool(toolName, parameters, context);
  }
}

module.exports = new AIToolExecutor();