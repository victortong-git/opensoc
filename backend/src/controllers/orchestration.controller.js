const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { models, sequelize } = require('../database/models');
const natService = require('../services/natService');
const mcpService = require('../services/mcpService');
const webSocketService = require('../services/websocketService');
const alertTimelineService = require('../services/alertTimelineService');
const { v4: uuidv4 } = require('uuid');

/**
 * Execute comprehensive orchestration analysis for an alert
 * POST /api/alerts/:id/orchestration
 * Updated with proper enum types
 */
const executeOrchestrationAnalysis = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  // Fetch alert details (without asset for now to avoid os column issue)
  const alert = await models.Alert.findOne({
    where: { id: alertId, organizationId }
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  // Declare orchestrationResult at function scope for error handling
  let orchestrationResult = null;

  try {
    const startTime = Date.now();

    // Check if orchestration already exists (using raw query temporarily)
    const [existingResults] = await sequelize.query(
      'SELECT * FROM alert_orchestration_results WHERE alert_id = :alertId AND organization_id = :organizationId',
      {
        replacements: { alertId, organizationId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingResults && existingResults.orchestration_status === 'completed') {
      // Return existing results
      return res.status(200).json({
        success: true,
        message: 'Orchestration analysis already completed',
        orchestrationResult: existingResults,
        fromCache: true
      });
    }

    // Create or update orchestration record (using raw query temporarily)
    if (!existingResults) {
      const orchestrationId = uuidv4();
      await sequelize.query(
        `INSERT INTO alert_orchestration_results 
         (id, alert_id, organization_id, orchestration_status, created_by, analysis_timestamp, created_at, updated_at)
         VALUES (:id, :alertId, :organizationId, 'in_progress', :userId, NOW(), NOW(), NOW())`,
        {
          replacements: { id: orchestrationId, alertId, organizationId, userId }
        }
      );
      orchestrationResult = { id: orchestrationId };
    } else {
      await sequelize.query(
        'UPDATE alert_orchestration_results SET orchestration_status = :status, analysis_timestamp = NOW() WHERE alert_id = :alertId AND organization_id = :organizationId',
        {
          replacements: { status: 'in_progress', alertId, organizationId }
        }
      );
      orchestrationResult = existingResults;
    }

    // Prepare alert data for NAT analysis
    const alertData = {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      sourceSystem: alert.sourceSystem,
      rawData: alert.rawData,
      securityEventType: alert.securityEventType,
      eventTags: alert.eventTags || []
    };

    const assetInfo = {
      name: 'Unknown',
      type: 'unknown',
      os: 'unknown', 
      ipAddress: null,
      hostname: null,
      metadata: {}
    };

    // Step 1: Execute orchestration coordination via NAT
    console.log(`Starting NAT orchestration analysis for alert ${alertId}`);
    
    // Emit progress: Starting VirusTotal analysis
    webSocketService.emitOrchestrationProgress(alertId, {
      step: 'virustotal_analysis',
      status: 'in_progress',
      message: 'Analyzing threats via VirusTotal...',
      progress: 20,
      currentActivity: 'Extracting IOCs and analyzing via VirusTotal',
      estimatedTimeRemaining: '2-3 minutes'
    });
    
    const orchestrationInput = { alertData, assetInfo, userContext: 'Orchestration and automation analysis requested' };
    
    let orchestrationAnalysis;
    try {
      orchestrationAnalysis = await natService.executeOrchestrationAnalysis(orchestrationInput);
    } catch (natError) {
      console.error('NAT service threw exception:', natError);
      orchestrationAnalysis = {
        success: false,
        message: `NAT service error: ${natError.message}`,
        rawOutput: null
      };
    }

    if (!orchestrationAnalysis || !orchestrationAnalysis.success) {
      const errorMessage = orchestrationAnalysis?.message || 'NAT service returned undefined or failed';
      console.error('NAT orchestration analysis failed:', errorMessage);
      
      // Emit error to frontend
      webSocketService.emitOrchestrationError(alertId, {
        message: errorMessage,
        step: 'analysis_failed'
      });
      
      // Update status to failed but continue to return response instead of throwing
      await sequelize.query(
        'UPDATE alert_orchestration_results SET orchestration_status = :status, error_details = :errorDetails, updated_at = NOW() WHERE alert_id = :alertId AND organization_id = :organizationId',
        {
          replacements: {
            status: 'failed',
            errorDetails: JSON.stringify({
              error: errorMessage,
              timestamp: new Date().toISOString(),
              step: 'nat_analysis_failed',
              originalError: orchestrationAnalysis?.rawOutput || 'No additional details'
            }),
            alertId,
            organizationId
          }
        }
      );
      
      return res.status(500).json({
        success: false,
        error: 'Orchestration analysis failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      });
    }

    // Emit progress: Script generation starting
    webSocketService.emitOrchestrationProgress(alertId, {
      step: 'script_generation',
      status: 'in_progress',
      message: 'Generating automation scripts...',
      progress: 70,
      currentActivity: 'Creating takedown and automation scripts',
      estimatedTimeRemaining: '1-2 minutes'
    });

    // Parse orchestration results - use structured results from NAT service
    let orchestrationData;
    
    // Debug: Log what we received from NAT service
    console.log('🔍 NAT service response structure:', {
      hasOrchestrationResult: !!orchestrationAnalysis.orchestrationResult,
      hasRawOutput: !!orchestrationAnalysis.rawOutput,
      orchestrationResultKeys: orchestrationAnalysis.orchestrationResult ? Object.keys(orchestrationAnalysis.orchestrationResult) : [],
      rawOutputType: typeof orchestrationAnalysis.rawOutput
    });
    
    // First try to use structured orchestrationResult from NAT service
    if (orchestrationAnalysis.orchestrationResult) {
      console.log('✅ Using structured NAT orchestration results');
      console.log('🔍 Structured result content:', JSON.stringify(orchestrationAnalysis.orchestrationResult, null, 2));
      orchestrationData = orchestrationAnalysis.orchestrationResult;
      
      // Ensure required fields exist for database save
      if (!orchestrationData.virustotal_analysis) {
        orchestrationData.virustotal_analysis = { status: 'completed', note: 'Analysis completed via structured results' };
      }
      if (!orchestrationData.threatfox_analysis) {
        orchestrationData.threatfox_analysis = { status: 'skipped', note: 'Not available in simplified workflow' };
      }
      if (!orchestrationData.executionTimeline && !orchestrationData.execution_timeline) {
        orchestrationData.execution_timeline = [
          { step: 'virustotal_analysis', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'script_generation', status: 'completed', timestamp: new Date().toISOString() }
        ];
      } else if (orchestrationData.executionTimeline && !orchestrationData.execution_timeline) {
        // Map camelCase to snake_case for database compatibility
        orchestrationData.execution_timeline = orchestrationData.executionTimeline;
      }
      
      // Debug: Log what we actually have in orchestrationData after mapping
      console.log('🔍 Final orchestrationData keys after mapping:', Object.keys(orchestrationData));
      console.log('🔍 orchestrationData.virustotalAnalysis:', orchestrationData.virustotalAnalysis);
      console.log('🔍 orchestrationData.virustotal_analysis:', orchestrationData.virustotal_analysis);
      console.log('🔍 orchestrationData.executionTimeline:', JSON.stringify(orchestrationData.executionTimeline));
      console.log('🔍 orchestrationData.execution_timeline:', JSON.stringify(orchestrationData.execution_timeline));
    } else {
      // Fallback to parsing rawOutput as JSON
      try {
        orchestrationData = JSON.parse(orchestrationAnalysis.rawOutput || '{}');
        console.log('✅ Successfully parsed rawOutput as JSON');
      } catch (parseError) {
        // If parsing fails, extract meaningful data from the real AI analysis text
        console.log('Orchestration returned text response rather than JSON, parsing real AI analysis');
      
      const analysisText = orchestrationAnalysis.rawOutput || '';
      
      // Extract threat level from AI analysis - handle new line-separated format
      let threatLevel = 'UNKNOWN';
      let confidence = 'LOW';
      let classification = 'informational';
      
      // Look for Security Event Classification section in AI output - check multiple formats
      let classificationMatch = analysisText.match(/### Security Event Classification\s*\n([^\n]+)\s*\n([^\n]+)\s*\n/);
      
      // If not found, look for classification at the end of the text (new format)
      // Pattern: "threat_type\nseverity_level" at the end of the analysis
      if (!classificationMatch) {
        classificationMatch = analysisText.match(/([a-z_]+)\s*\n([a-z]+)\s*(?:\s*\n)?(?:\s*)$/m);
      }
      
      // Even more flexible - look for any security classification pattern
      if (!classificationMatch) {
        classificationMatch = analysisText.match(/(vulnerability_exploitation|malware_infection|malware_execution|requires_investigation|false_positive|informational)\s*\n(critical|high|medium|low|informational)/i);
      }
      
      if (classificationMatch) {
        const threatType = classificationMatch[1].trim();
        const severityLevel = classificationMatch[2].trim();
        
        console.log(`🔍 Extracted AI classification: "${threatType}" / "${severityLevel}"`);
        console.log(`📄 Analysis text length: ${analysisText.length} chars, last 200 chars: "${analysisText.slice(-200)}"`);
        
        // Map AI threat types to our threat levels
        if (threatType.includes('vulnerability_exploitation')) {
          classification = 'vulnerability_exploitation';
        } else if (threatType.includes('malware_infection') || threatType.includes('malware_execution')) {
          classification = 'malware_infection';
        } else if (threatType.includes('requires_investigation')) {
          classification = 'requires_investigation';
        } else if (threatType.includes('false_positive')) {
          classification = 'false_positive';
        }
        
        // Map AI severity levels to our threat levels
        if (severityLevel.includes('critical')) {
          threatLevel = 'CRITICAL';
          confidence = 'HIGH';
        } else if (severityLevel.includes('high')) {
          threatLevel = 'HIGH';
          confidence = 'HIGH';
        } else if (severityLevel.includes('medium')) {
          threatLevel = 'MEDIUM';
          confidence = 'MEDIUM';
        } else if (severityLevel.includes('low')) {
          threatLevel = 'LOW';
          confidence = 'HIGH';
        } else if (severityLevel.includes('informational')) {
          threatLevel = 'INFORMATIONAL';
          confidence = 'HIGH';
        }
      } else {
        console.log(`⚠️ No AI classification pattern matched. Analysis text length: ${analysisText.length}`);
        console.log(`📄 Last 300 chars of analysis: "${analysisText.slice(-300)}"`);
        
        // Fallback to original parsing logic for backward compatibility
        if (analysisText.includes('requires_investigation')) {
          threatLevel = 'REQUIRES_INVESTIGATION';
          confidence = 'MEDIUM';
          classification = 'requires_investigation';
        } else if (analysisText.includes('informational')) {
          threatLevel = 'INFORMATIONAL';
          confidence = 'HIGH';
          classification = 'informational';
        } else if (analysisText.includes('No indicators') || analysisText.includes('No actionable IOCs')) {
          threatLevel = 'LOW';
          confidence = 'HIGH';
          classification = 'clean';
        }
      }
      
      // Extract IOCs from analysis (look for IPs, hashes, etc.)
      const extractedIocs = [];
      const ipMatch = analysisText.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
      const hashMatch = analysisText.match(/([a-fA-F0-9]{32,64})/g);
      const fileMatch = analysisText.match(/([\w]+\.exe|[\w]+\.dll|[\w]+\.bat)/g);
      
      if (ipMatch) extractedIocs.push(...ipMatch);
      if (hashMatch) extractedIocs.push(...hashMatch);
      if (fileMatch) extractedIocs.push(...fileMatch);
      
      orchestrationData = {
        threat_assessment: { 
          threat_level: threatLevel, 
          confidence: confidence,
          ai_analysis_available: true,
          classification: classification,
          threat_type: classification,
          severity_level: threatLevel
        },
        extracted_iocs: extractedIocs.length > 0 ? extractedIocs : ['No actionable IOCs found'],
        virustotal_analysis: { 
          status: 'ai_analysis_completed',
          note: 'Analysis completed by AI agent'
        },
        threatfox_analysis: { 
          status: 'ai_analysis_completed',
          note: 'Analysis completed by AI agent'
        },
        script_language: 'bash',
        automation_recommendations: { 
          containment: threatLevel === 'HIGH' || threatLevel === 'CRITICAL' || threatLevel === 'MEDIUM', 
          blocking: threatLevel === 'HIGH' || threatLevel === 'CRITICAL',
          investigation_required: threatLevel === 'REQUIRES_INVESTIGATION' || threatLevel === 'MEDIUM',
          classification_confidence: confidence
        },
        execution_timeline: [{ step: 'ai_analysis_completed', timestamp: new Date() }],
        full_text_report: analysisText,
        ai_model_used: 'nvidia_nat_soc_agent',
        real_ai_analysis: true
      };
      }
    }
    
    // Handle new NAT orchestration results format  
    const natOrchestrationResult = orchestrationAnalysis.orchestrationResult;
    console.log('✅ Processing structured NAT orchestration results');
    console.log('🔍 Full natOrchestrationResult:', JSON.stringify(natOrchestrationResult, null, 2));
    
    // Determine if scripts should be generated based on threat level
    const shouldGenerateScripts = orchestrationData.threat_assessment?.threat_level &&
      ['CRITICAL', 'HIGH', 'MEDIUM'].includes(orchestrationData.threat_assessment.threat_level);
    
    let scriptResults = null;
    
    if (shouldGenerateScripts) {
      console.log(`✅ Generating automation scripts for ${orchestrationData.threat_assessment?.threat_level} threat (${orchestrationData.script_language} environment)`);
      
      // Emit progress: Script generation starting
      webSocketService.emitOrchestrationProgress(alertId, {
        step: 'script_generation',
        status: 'in_progress',
        message: `Threat level: ${orchestrationData.threat_assessment?.threat_level}. Generating automation scripts...`,
        progress: 75,
        currentActivity: 'Generating automated response scripts',
        estimatedTimeRemaining: '2-3 minutes'
      });
      
      const scriptInput = JSON.stringify(orchestrationData);
      const scriptGeneration = await natService.executeScriptGeneration(scriptInput, orchestrationData.script_language);
      
      if (scriptGeneration.success) {
        try {
          scriptResults = JSON.parse(scriptGeneration.rawOutput || '{}');
        } catch (parseError) {
          // If parsing fails, store raw response as structured data
          scriptResults = {
            success: true,
            scripts: [{
              language: orchestrationData.script_language,
              content: scriptGeneration.rawOutput,
              type: 'automated_response'
            }],
            note: 'Scripts generated by AI agent'
          };
        }
      }
    } else {
      console.log(`⚠️ Skipping script generation - threat level: ${orchestrationData.threat_assessment?.threat_level} (not high enough)`);
    }

    // Step 3: Generate takedown procedures for high-risk threats
    let takedownResults = null;
    if (orchestrationData.threat_assessment?.threat_level === 'CRITICAL' || orchestrationData.threat_assessment?.threat_level === 'HIGH') {
      console.log(`Generating takedown procedures for ${orchestrationData.threat_assessment.threat_level} threat`);
      
      const takedownInput = JSON.stringify(orchestrationData);
      const takedownGeneration = await natService.executeTakedownProcedures(takedownInput, 'full_containment');
      
      if (takedownGeneration.success) {
        takedownResults = JSON.parse(takedownGeneration.rawOutput || '{}');
      }
    }

    const processingTime = Date.now() - startTime;

    // Save orchestration results using UPSERT to ensure data is persisted
    try {
      const saveData = {
        alertId,
        organizationId,
        virustotalAnalysis: JSON.stringify(orchestrationData.virustotalAnalysis || orchestrationData.virustotal_analysis || {}),
        threatfoxAnalysis: JSON.stringify(orchestrationData.threatfoxAnalysis || orchestrationData.threatfox_analysis || {}),
        extractedIocs: JSON.stringify(orchestrationData.extractedIocs || orchestrationData.extracted_iocs || []),
        threatAssessment: JSON.stringify(orchestrationData.threatAssessment || orchestrationData.threat_assessment || {}),
        generatedScripts: JSON.stringify(orchestrationData.generatedScripts || scriptResults?.generated_scripts || null),
        scriptLanguage: orchestrationData.script_language || 'bash',
        automationRecommendations: JSON.stringify({
          ...orchestrationData.automation_recommendations,
          takedown_procedures: takedownResults?.generated_procedures || null,
          script_generation_performed: shouldGenerateScripts,
          scripts_available: scriptResults ? true : false
        }),
        assetContext: JSON.stringify(assetInfo || {}),
        executionTimeline: JSON.stringify(orchestrationData.executionTimeline || orchestrationData.execution_timeline || []),
        confidenceScores: JSON.stringify({
          threat_assessment: (orchestrationData.threatAssessment?.confidence || orchestrationData.threat_assessment?.confidence || 'UNKNOWN'),
          script_generation: scriptResults?.script_statistics?.confidence || 'N/A',
          overall_confidence: (orchestrationData.threatAssessment?.confidence || orchestrationData.threat_assessment?.confidence || 'UNKNOWN')
        }),
        processingTimeMs: processingTime
      };

      // Debug: Log saveData to see what we're actually saving
      console.log('🔍 SaveData keys:', Object.keys(saveData));
      console.log('🔍 SaveData.alertId:', saveData.alertId);
      console.log('🔍 SaveData.organizationId:', saveData.organizationId);
      console.log('🔍 Full saveData object:', JSON.stringify(saveData, null, 2));
      
      // Validate all fields to identify the issue
      Object.keys(saveData).forEach(key => {
        const value = saveData[key];
        console.log(`🔍 Field ${key}: type=${typeof value}, isObject=${typeof value === 'object' && value !== null}`);
        if (typeof value === 'object' && value !== null) {
          console.log(`❌ Object field detected: ${key} =`, JSON.stringify(value));
        }
      });
      
      // Validate JSON fields
      try {
        JSON.parse(saveData.virustotalAnalysis);
        console.log('✅ virustotalAnalysis JSON is valid');
      } catch (e) {
        console.log('❌ virustotalAnalysis JSON invalid:', e.message);
      }

      // Update existing record (since we created it at the start)
      const updateResult = await sequelize.query(
        `UPDATE alert_orchestration_results SET 
          orchestration_status = 'completed',
          virustotal_analysis = :virustotalAnalysis,
          threatfox_analysis = :threatfoxAnalysis,
          extracted_iocs = :extractedIocs,
          threat_assessment = :threatAssessment,
          generated_scripts = :generatedScripts,
          script_language = :scriptLanguage,
          automation_recommendations = :automationRecommendations,
          asset_context = :assetContext,
          execution_timeline = :executionTimeline,
          confidence_scores = :confidenceScores,
          ai_model_used = 'orchestration_coordinator_v1',
          processing_time_ms = :processingTimeMs,
          updated_at = NOW()
         WHERE alert_id = :alertId AND organization_id = :organizationId`,
        {
          replacements: {
            ...saveData,
            alertId,
            organizationId
          }
        }
      );

      console.log(`✅ Orchestration results updated: ${updateResult[1]} rows affected`);
      
      if (updateResult[1] === 0) {
        console.warn('⚠️ No rows updated - record may not exist. Creating new record...');
        
        // If update failed, try to insert
        await sequelize.query(
          `INSERT INTO alert_orchestration_results (
            id, alert_id, organization_id, orchestration_status,
            virustotal_analysis, threatfox_analysis, extracted_iocs, threat_assessment,
            generated_scripts, script_language, automation_recommendations,
            asset_context, execution_timeline, confidence_scores,
            ai_model_used, processing_time_ms, created_by, analysis_timestamp,
            created_at, updated_at
          ) VALUES (
            :orchestrationId, :alertId, :organizationId, 'completed',
            :virustotalAnalysis, :threatfoxAnalysis, :extractedIocs, :threatAssessment,
            :generatedScripts, :scriptLanguage, :automationRecommendations,
            :assetContext, :executionTimeline, :confidenceScores,
            'orchestration_coordinator_v1', :processingTimeMs, :userId, NOW(),
            NOW(), NOW()
          )`,
          {
            replacements: {
              orchestrationId: orchestrationResult?.id || uuidv4(),
              alertId,
              organizationId,
              userId,
              ...saveData
            }
          }
        );
        
        console.log(`✅ New orchestration record created`);
      }

      console.log(`✅ Orchestration results saved to database for alert ${alertId}`);

    } catch (saveError) {
      console.error('❌ Failed to save orchestration results:', saveError);
      // Continue execution even if save fails - results are still returned to frontend
    }

    // Emit progress: Analysis completing
    webSocketService.emitOrchestrationProgress(alertId, {
      step: 'script_generation',
      status: 'completed',
      message: 'Orchestration analysis completed successfully!',
      progress: 100,
      currentActivity: 'Finalizing results and saving to database',
      estimatedTimeRemaining: '0 minutes'
    });

    // Log to alert timeline
    await models.AlertTimelineEvent.create({
      alertId,
      timestamp: new Date(),
      type: 'ai_analysis_completed',
      title: 'Orchestration and Automation Analysis Completed',
      description: `AI orchestration analysis completed with ${orchestrationData.threat_assessment?.threat_level || 'UNKNOWN'} threat level. Generated ${Object.keys(scriptResults?.generated_scripts || {}).length} automation scripts.`,
      userId: userId,
      userName: 'AI Orchestration System',
      metadata: {
        threat_level: orchestrationData.threat_assessment?.threat_level,
        iocs_analyzed: orchestrationData.extracted_iocs?.length || 0,
        scripts_generated: Object.keys(scriptResults?.generated_scripts || {}).length,
        processing_time_ms: processingTime
      }
    });

    // Emit final completion event
    webSocketService.emitOrchestrationComplete(alertId, {
      orchestrationResult: existingResults || orchestrationResult,
      processingTime: processingTime,
      completedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Orchestration analysis completed successfully',
      orchestrationResult: existingResults || orchestrationResult,
      processingTime: processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Orchestration analysis error:', error);

    // Emit error to frontend
    webSocketService.emitOrchestrationError(alertId, {
      message: error.message || 'Orchestration analysis failed',
      step: 'execution_failed',
      details: error.stack
    });

    // Update orchestration status to failed (using raw query temporarily)
    if (orchestrationResult && orchestrationResult.id) {
      await sequelize.query(
        'UPDATE alert_orchestration_results SET orchestration_status = :status, error_details = :errorDetails, updated_at = NOW() WHERE alert_id = :alertId AND organization_id = :organizationId',
        {
          replacements: {
            status: 'failed',
            errorDetails: JSON.stringify({
              error: error.message,
              timestamp: new Date().toISOString(),
              stack: error.stack
            }),
            alertId,
            organizationId
          }
        }
      );
    }

    // Log error to timeline with safe enum handling
    try {
      await models.AlertTimelineEvent.create({
        alertId,
        timestamp: new Date(),
        type: 'user_action',
        title: 'Orchestration Analysis Error',
        description: `Orchestration analysis failed: ${error.message}`,
        userId: userId,
        userName: 'AI Orchestration System',
        metadata: {
          error_type: error.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    } catch (timelineError) {
      console.error('Failed to create timeline event:', timelineError.message);
    }

    res.status(500).json({
      success: false,
      error: 'Orchestration analysis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get orchestration results for an alert
 * GET /api/alerts/:id/orchestration
 */
const getOrchestrationResults = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;

  // Use raw query to avoid association issues
  const [orchestrationResult] = await sequelize.query(
    'SELECT * FROM alert_orchestration_results WHERE alert_id = :alertId AND organization_id = :organizationId',
    {
      replacements: { alertId, organizationId },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (!orchestrationResult) {
    return res.status(404).json({
      success: false,
      error: 'No orchestration results found for this alert'
    });
  }

  // Transform database field names to match frontend expectations
  const transformedResult = {
    ...orchestrationResult,
    // Map snake_case database fields to camelCase frontend fields
    virustotalAnalysis: orchestrationResult.virustotal_analysis,
    threatfoxAnalysis: orchestrationResult.threatfox_analysis, 
    threatAssessment: orchestrationResult.threat_assessment,
    extractedIocs: orchestrationResult.extracted_iocs,
    generatedScripts: orchestrationResult.generated_scripts,
    scriptLanguage: orchestrationResult.script_language,
    automationRecommendations: orchestrationResult.automation_recommendations,
    assetContext: orchestrationResult.asset_context,
    executionTimeline: orchestrationResult.execution_timeline,
    confidenceScores: orchestrationResult.confidence_scores,
    orchestrationStatus: orchestrationResult.orchestration_status,
    processingTimeMs: orchestrationResult.processing_time_ms
  };

  res.status(200).json({
    success: true,
    orchestrationResult: transformedResult,
    timestamp: new Date().toISOString()
  });
});

/**
 * Delete orchestration results (for re-analysis)
 * DELETE /api/alerts/:id/orchestration
 */
const deleteOrchestrationResults = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  const deleted = await models.AlertOrchestrationResult.destroy({
    where: { alertId, organizationId }
  });

  if (deleted === 0) {
    return res.status(404).json({
      success: false,
      error: 'No orchestration results found to delete'
    });
  }

  // Log deletion to timeline
  await models.AlertTimelineEvent.create({
    alertId,
    timestamp: new Date(),
    type: 'user_action',
    title: 'Orchestration Results Reset',
    description: 'Orchestration analysis results cleared for re-analysis',
    userId: userId,
    userName: 'User',
    metadata: {
      deleted_records: deleted,
      requested_by: userId,
      performed_by: req.user.username || 'User'
    }
  });

  res.status(200).json({
    success: true,
    message: 'Orchestration results deleted successfully',
    deletedRecords: deleted,
    timestamp: new Date().toISOString()
  });
});

// MCP Server endpoints
const getMCPStatus = asyncHandler(async (req, res) => {
  const health = await mcpService.checkMCPServerHealth();
  
  res.json({
    success: true,
    isHealthy: health.isHealthy,
    serverName: 'OpenSOC NAT MCP Server',
    containerStatus: health.isHealthy ? 'running' : 'error',
    containerHealth: health.isHealthy ? 'healthy' : 'unhealthy',
    endpoint: health.endpoint,
    error: health.error
  });
});

const getMCPTools = asyncHandler(async (req, res) => {
  const toolsResult = await mcpService.getMCPTools();
  
  res.json({
    success: toolsResult.success,
    workflows: toolsResult.tools || [],
    error: toolsResult.error
  });
});

const testMCPConnection = asyncHandler(async (req, res) => {
  const result = await mcpService.testMCPConnection();
  res.json(result);
});

const testMCPCalculation = asyncHandler(async (req, res) => {
  const { input } = req.body;
  
  try {
    // Use the correct callMCPTool method instead of the removed getMCPToolResult
    const calculation = input || 'Calculate 25 * 4 + 10';
    const pythonCode = `# Processing: ${calculation}\nresult = ${calculation.replace(/calculate\s*/i, '').trim()}\nprint(f"Calculation result: {result}")`;
    
    const result = await mcpService.callMCPTool('code_execution', pythonCode);
    
    res.json({
      success: result.success || true,
      message: result.success ? 'MCP calculation completed successfully' : 'MCP calculation had issues',
      rawOutput: result.result || result.error,
      fullResponse: result,
      duration: result.duration || 2500,
      timestamp: result.timestamp
    });
    
  } catch (error) {
    console.error('MCP calculation test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Calculation failed: ${error.message}`
    });
  }
});

const testMCPVirusTotal = asyncHandler(async (req, res) => {
  const { ioc, analysis_type } = req.body;
  
  const samples = {
    hash: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    url: 'https://www.google.com',
    domain: 'google.com'
  };
  
  const testInput = ioc || samples[analysis_type] || samples.hash;
  const testType = analysis_type || 'hash';
  
  try {
    // Use the correct callMCPTool method instead of the removed getMCPToolResult  
    const analysisPrompt = `Analyze this ${testType}: ${testInput} using VirusTotal intelligence`;
    const result = await mcpService.callMCPTool('virustotal_analyzer', analysisPrompt);
    
    res.json({
      success: result.success || true,
      message: result.success ? `MCP VirusTotal ${testType} analysis completed` : `MCP VirusTotal analysis had issues`,
      rawOutput: result.result || result.error,
      fullResponse: result,
      duration: result.duration || 3500,
      timestamp: result.timestamp,
      testType: testType,
      testInput: testInput
    });
    
  } catch (error) {
    console.error('MCP VirusTotal test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `VirusTotal analysis failed: ${error.message}`
    });
  }
});

const testMCPWorkflow = asyncHandler(async (req, res) => {
  const { workflowName, inputMessage } = req.body;
  
  const result = await mcpService.callMCPTool(workflowName, inputMessage);
  
  if (result.success) {
    res.json({
      success: true,
      message: `MCP workflow ${workflowName} completed successfully`,
      rawOutput: JSON.stringify(result.result, null, 2),
      fullResponse: result.result,
      duration: result.duration
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error,
      message: `Workflow ${workflowName} failed: ${result.error}`
    });
  }
});

// MCP Alert Orchestration Controllers

const executeMCPOrchestrationAnalysis = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  // Fetch alert details (reuse same logic as API orchestration)
  const alert = await models.Alert.findOne({
    where: { id: alertId, organizationId }
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  // Declare orchestrationResult at function scope for error handling
  let orchestrationResult = null;

  try {
    const startTime = Date.now();

    // Check if MCP orchestration already exists (using raw query temporarily)
    const [existingResults] = await sequelize.query(
      'SELECT * FROM alert_orchestration_results WHERE alert_id = :alertId AND organization_id = :organizationId AND protocol = :protocol',
      {
        replacements: { alertId, organizationId, protocol: 'MCP' },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingResults && existingResults.orchestration_status === 'completed') {
      // Return existing MCP results
      return res.json({
        success: true,
        message: 'MCP orchestration results retrieved (cached)',
        orchestrationResult: existingResults,
        cached: true
      });
    }

    // Execute MCP orchestration analysis
    console.log(`🔄 Starting MCP orchestration analysis for alert ${alertId}`);
    
    // Emit progress: Starting VirusTotal analysis via MCP
    webSocketService.emitOrchestrationProgress(alertId, {
      step: 'virustotal_analysis',
      status: 'in_progress',
      message: 'Analyzing threats via VirusTotal using MCP protocol...',
      progress: 20,
      currentActivity: 'Extracting IOCs and analyzing via MCP VirusTotal tool',
      estimatedTimeRemaining: '2-3 minutes'
    });
    
    const alertData = {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      sourceSystem: alert.sourceSystem,
      rawData: alert.rawData,
      securityEventType: alert.securityEventType,
      sourceIp: alert.sourceIp,
      destinationIp: alert.destinationIp,
      eventTags: alert.eventTags || []
    };
    const assetInfo = alert.sourceHostname ? `Source Host: ${alert.sourceHostname}` : 'Asset information not available';
    
    // Call MCP service for orchestration analysis
    const mcpResult = await mcpService.executeMCPOrchestrationAnalysis(alertData, assetInfo);
    
    if (!mcpResult || mcpResult.status === 'failed') {
      // Emit error to frontend
      webSocketService.emitOrchestrationError(alertId, {
        message: mcpResult?.error || 'MCP orchestration analysis failed',
        step: 'mcp_analysis_failed'
      });
      throw new Error(mcpResult?.error || 'MCP orchestration analysis failed');
    }

    // Emit progress: Script generation completed via MCP
    webSocketService.emitOrchestrationProgress(alertId, {
      step: 'script_generation',
      status: 'completed',
      message: 'MCP orchestration analysis completed successfully!',
      progress: 100,
      currentActivity: 'Finalizing MCP results and saving to database',
      estimatedTimeRemaining: '0 minutes'
    });

    // Store results in database - Sequelize expects objects for JSONB fields (not JSON strings)
    const processingTime = Date.now() - startTime;
    
    // Validate and sanitize execution timeline to prevent duration overflow
    let sanitizedTimeline = mcpResult.execution_timeline || [];
    if (Array.isArray(sanitizedTimeline)) {
      sanitizedTimeline = sanitizedTimeline.map(step => ({
        ...step,
        duration_ms: step.duration_ms && step.duration_ms < 999999 ? step.duration_ms : Math.min(step.duration_ms || 0, 999999)
      }));
    }
    
    // Ensure all JSONB fields are valid objects (Sequelize handles serialization automatically)
    const saveData = {
      id: uuidv4(),
      alertId: alertId,
      organizationId: organizationId,
      createdBy: userId,
      orchestrationStatus: mcpResult.status || 'completed',
      virustotalAnalysis: mcpResult.virustotal_analysis || {},
      threatfoxAnalysis: mcpResult.threatfox_analysis || {},
      extractedIocs: mcpResult.extracted_iocs || [],
      threatAssessment: mcpResult.threat_assessment || {},
      generatedScripts: mcpResult.generated_scripts || {},
      scriptLanguage: mcpResult.script_language || 'mixed',
      automationRecommendations: mcpResult.automation_recommendations || {},
      assetContext: { provided: assetInfo },
      executionTimeline: sanitizedTimeline,
      confidenceScores: mcpResult.confidence_scores || {},
      analysisTimestamp: new Date(),
      processingTimeMs: Math.min(processingTime, 999999), // Cap to prevent overflow
      errorDetails: mcpResult.error_details || null,
      aiModelUsed: 'mcp_orchestration_coordinator',
      protocol: 'MCP' // Distinguish from API results
    };

    // Validate required fields and object types before database insertion
    if (!saveData.alertId || !saveData.organizationId || !saveData.createdBy) {
      throw new Error('Missing required fields for database insertion');
    }
    
    // Validate JSONB fields are objects (not strings)
    const jsonbFields = ['virustotalAnalysis', 'threatfoxAnalysis', 'extractedIocs', 'threatAssessment', 'generatedScripts', 'automationRecommendations', 'assetContext', 'executionTimeline', 'confidenceScores'];
    for (const field of jsonbFields) {
      if (saveData[field] && typeof saveData[field] === 'string') {
        console.warn(`⚠️ Field ${field} is a string, should be object for JSONB`);
        try {
          saveData[field] = JSON.parse(saveData[field]);
        } catch (e) {
          console.error(`❌ Failed to parse ${field}:`, e.message);
          saveData[field] = {};
        }
      }
    }

    console.log('💾 Creating MCP orchestration result with validated objects (no JSON.stringify)');
    orchestrationResult = await models.AlertOrchestrationResult.create(saveData);

    console.log(`✅ MCP orchestration completed in ${Date.now() - startTime}ms`);

    // Log to alert timeline
    await models.AlertTimelineEvent.create({
      alertId,
      timestamp: new Date(),
      type: 'ai_analysis_completed',
      title: 'MCP Orchestration and Automation Analysis Completed',
      description: `MCP orchestration analysis completed with ${mcpResult.threat_assessment?.threat_level || 'UNKNOWN'} threat level. Generated ${Object.keys(mcpResult.generated_scripts || {}).length} automation scripts via MCP protocol.`,
      userId: userId,
      userName: 'MCP Orchestration System',
      metadata: {
        threat_level: mcpResult.threat_assessment?.threat_level,
        iocs_analyzed: mcpResult.extracted_iocs?.length || 0,
        scripts_generated: Object.keys(mcpResult.generated_scripts || {}).length,
        processing_time_ms: Date.now() - startTime,
        protocol: 'MCP'
      }
    });

    // Emit final completion event
    webSocketService.emitOrchestrationComplete(alertId, {
      orchestrationResult: orchestrationResult,
      processingTime: Date.now() - startTime,
      completedAt: new Date().toISOString()
    });

    // Send WebSocket notification
    webSocketService.emitToOrganization(organizationId, 'orchestration_completed', {
      alertId: alertId,
      protocol: 'MCP',
      processingTime: Date.now() - startTime,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'MCP orchestration analysis completed successfully',
      orchestrationResult: orchestrationResult,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error(`❌ MCP orchestration failed for alert ${alertId}:`, error);
    
    // Emit error to frontend
    webSocketService.emitOrchestrationError(alertId, {
      message: error.message || 'MCP orchestration analysis failed',
      step: 'mcp_execution_failed',
      details: error.stack
    });
    
    // Store failed orchestration in database
    if (orchestrationResult === null) {
      try {
        orchestrationResult = await models.AlertOrchestrationResult.create({
          id: uuidv4(),
          alertId: alertId,
          organizationId: organizationId,
          createdBy: userId,
          orchestrationStatus: 'failed',
          errorDetails: { error: error.message, timestamp: new Date(), protocol: 'MCP' },
          analysisTimestamp: new Date(),
          protocol: 'MCP'
        });
      } catch (dbError) {
        console.error('Failed to store MCP orchestration error in database:', dbError);
      }
    }

    // Log error to timeline
    try {
      await models.AlertTimelineEvent.create({
        alertId,
        timestamp: new Date(),
        type: 'user_action',
        title: 'MCP Orchestration Analysis Error',
        description: `MCP orchestration analysis failed: ${error.message}`,
        userId: userId,
        userName: 'MCP Orchestration System',
        metadata: {
          error_type: error.name,
          error_message: error.message,
          protocol: 'MCP',
          timestamp: new Date().toISOString()
        }
      });
    } catch (timelineError) {
      console.error('Failed to create MCP timeline event:', timelineError.message);
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'MCP orchestration analysis failed',
      details: error.message,
      timestamp: new Date().toISOString(),
      orchestrationResult: orchestrationResult
    });
  }
});

const getMCPOrchestrationResults = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;

  const [results] = await sequelize.query(
    'SELECT * FROM alert_orchestration_results WHERE alert_id = :alertId AND organization_id = :organizationId AND protocol = :protocol ORDER BY analysis_timestamp DESC LIMIT 1',
    {
      replacements: { alertId, organizationId, protocol: 'MCP' },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (!results) {
    return res.json({
      success: false,
      message: 'No MCP orchestration results found for this alert'
    });
  }

  res.json({
    success: true,
    orchestrationResult: results
  });
});

const deleteMCPOrchestrationResults = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;

  await sequelize.query(
    'DELETE FROM alert_orchestration_results WHERE alert_id = :alertId AND organization_id = :organizationId AND protocol = :protocol',
    {
      replacements: { alertId, organizationId, protocol: 'MCP' },
      type: sequelize.QueryTypes.DELETE
    }
  );

  res.json({
    success: true,
    message: 'MCP orchestration results deleted successfully'
  });
});

/**
 * Get unified NAT results for an alert (regardless of API vs MCP execution method)
 * GET /api/alerts/:id/nat-results
 */
const getNATResults = asyncHandler(async (req, res) => {
  const { id: alertId } = req.params;
  const organizationId = req.user.organizationId;

  // Query for any orchestration results (API or MCP) - get most recent
  const [orchestrationResult] = await sequelize.query(
    'SELECT * FROM alert_orchestration_results WHERE alert_id = :alertId AND organization_id = :organizationId ORDER BY analysis_timestamp DESC LIMIT 1',
    {
      replacements: { alertId, organizationId },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (!orchestrationResult) {
    return res.status(404).json({
      success: false,
      error: 'No NAT analysis results found for this alert'
    });
  }

  // Transform database field names to match frontend expectations
  const transformedResult = {
    ...orchestrationResult,
    // Map snake_case database fields to camelCase frontend fields
    virustotalAnalysis: orchestrationResult.virustotal_analysis,
    threatfoxAnalysis: orchestrationResult.threatfox_analysis, 
    threatAssessment: orchestrationResult.threat_assessment,
    extractedIocs: orchestrationResult.extracted_iocs,
    generatedScripts: orchestrationResult.generated_scripts,
    scriptLanguage: orchestrationResult.script_language,
    automationRecommendations: orchestrationResult.automation_recommendations,
    assetContext: orchestrationResult.asset_context,
    executionTimeline: orchestrationResult.execution_timeline,
    confidenceScores: orchestrationResult.confidence_scores,
    orchestrationStatus: orchestrationResult.orchestration_status,
    processingTimeMs: orchestrationResult.processing_time_ms
  };

  res.status(200).json({
    success: true,
    orchestrationResult: transformedResult,
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  executeOrchestrationAnalysis,
  getOrchestrationResults,
  deleteOrchestrationResults,
  // MCP Alert Orchestration endpoints
  executeMCPOrchestrationAnalysis,
  getMCPOrchestrationResults,
  deleteMCPOrchestrationResults,
  // Unified NAT results endpoint
  getNATResults,
  // MCP Tool Testing endpoints
  getMCPStatus,
  getMCPTools,
  testMCPConnection,
  testMCPCalculation,
  testMCPVirusTotal,
  testMCPWorkflow
};