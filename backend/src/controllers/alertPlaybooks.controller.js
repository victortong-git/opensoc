const { models } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError, BadRequestError } = require('../middleware/error.middleware');
const alertPlaybookService = require('../services/alertPlaybookService');
const aiAgentLogService = require('../services/aiAgentLogService');
const pdfGenerationService = require('../services/pdfGenerationService');

/**
 * Generate AI-powered playbooks for a specific alert
 * POST /api/alerts/:id/generate-playbooks
 */
const generatePlaybooks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the alert with AI analysis
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.Asset,
        as: 'asset',
        attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner', 'osType', 'osVersion'],
        required: false
      }
    ]
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  // Validate that AI analysis exists
  if (!alert.aiAnalysis) {
    throw new BadRequestError('AI analysis must be completed before generating playbooks. Please run AI analysis first.');
  }

  // Check if playbooks have already been generated
  const hasExistingPlaybooks = await alertPlaybookService.hasGeneratedPlaybooks(alert.id, organizationId);
  
  // Allow regeneration if explicitly requested
  const forceRegenerate = req.body.forceRegenerate === true;
  
  if (hasExistingPlaybooks && !forceRegenerate) {
    // Return existing playbooks
    const existingPlaybooks = await alertPlaybookService.getGeneratedPlaybooks(alert.id, organizationId);
    return res.status(200).json({
      success: true,
      message: 'Playbooks already exist for this alert',
      playbooks: existingPlaybooks,
      regenerated: false,
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        securityEventType: alert.aiAnalysis.securityEventType
      }
    });
  }

  const startTime = Date.now();

  try {
    console.log(`🎯 Starting playbook generation for alert ${alert.id} (${alert.title})`);

    // Generate playbooks using the service
    const result = await alertPlaybookService.generatePlaybooksForAlert(alert, req.user, {
      forceRegenerate
    });

    const processingTime = Date.now() - startTime;

    console.log(`✅ Playbook generation completed for alert ${alert.id} in ${processingTime}ms`);

    res.status(201).json({
      success: true,
      message: 'Alert-specific playbooks generated successfully',
      playbooks: [result.immediateActionPlaybook, result.investigationPlaybook],
      processingTimeMs: processingTime,
      regenerated: forceRegenerate,
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        securityEventType: alert.aiAnalysis.securityEventType,
        riskLevel: alert.aiAnalysis.riskAssessment?.level,
        confidence: alert.aiAnalysis.confidence
      },
      metadata: {
        playbookTypes: ['immediate_action', 'investigation'],
        hasAssetInfo: !!alert.asset,
        aiModel: result.immediateActionPlaybook.metadata?.aiGenerationMetadata?.processingModel
      }
    });

  } catch (error) {
    console.error('Playbook generation failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: error.message || 'AI playbook generation failed',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity
      }
    });
  }
});

/**
 * Generate or update immediate action playbook for alert
 * POST /api/alerts/:id/generate-immediate-playbook
 */
const generateImmediatePlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const startTime = Date.now();
  
  // Get alert with AI analysis
  const alert = await models.Alert.findOne({
    where: { id, organizationId }
  });

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  if (!alert.aiAnalysis) {
    return res.status(400).json({
      success: false,
      error: 'AI analysis must be completed before generating playbooks'
    });
  }

  try {
    console.log(`🎯 Starting immediate action playbook generation for alert ${alert.id}`);

    // Generate or update the immediate action playbook
    const result = await alertPlaybookService.generateOrUpdateImmediatePlaybook(alert, req.user);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Immediate action playbook ${result.updated ? 'updated' : 'generated'} for alert ${alert.id} in ${processingTime}ms`);

    // Log AI agent activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Playbook Specialist Agent',
      taskName: 'generate immediate playbook',
      description: `${result.updated ? 'Updated' : 'Generated'} immediate action playbook for Alert: ${alert.title}`,
      inputTokens: result.inputTokens || 0,
      outputTokens: result.outputTokens || 0,
      executionTimeMs: processingTime,
      success: true,
      userId: req.user.id,
      organizationId,
      alertId: alert.id,
      aiProvider: result.aiProvider,
      aiModel: result.aiModel,
      metadata: {
        playbookType: 'immediate',
        updated: result.updated,
        securityEventType: alert.aiAnalysis.securityEventType,
        severity: alert.severity
      }
    });

    // Create immediate playbook generation timeline event
    console.log('🔍 DEBUG: About to create immediate playbook timeline event');
    console.log('🔍 DEBUG: AlertTimelineEvent model available:', !!models.AlertTimelineEvent);
    console.log('🔍 DEBUG: alert.id:', alert.id);
    console.log('🔍 DEBUG: result.playbook exists:', !!result.playbook);
    console.log('🔍 DEBUG: result.playbook.steps:', result.playbook?.steps?.length);
    console.log('🔍 DEBUG: result.updated:', result.updated);
    console.log('🔍 DEBUG: alert.aiAnalysis.securityEventType:', alert.aiAnalysis?.securityEventType);
    
    try {
      // Defensive data access with fallbacks
      const stepCount = result.playbook?.steps?.length || 0;
      const securityEventType = alert.aiAnalysis?.securityEventType || 'Unknown';
      const playbookId = result.playbook?.id || 'Unknown';
      
      const timelineEventData = {
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_analysis_completed',
        title: result.updated ? 'Immediate Action Playbook Updated' : 'Immediate Action Playbook Generated',
        description: `AI-powered immediate action playbook ${result.updated ? 'updated' : 'generated'} successfully. Generated ${stepCount} action steps for ${securityEventType} incident.`,
        aiSource: 'PLAYBOOK_SPECIALIST_AGENT',
        aiConfidence: 90,
        isTestData: false,
        metadata: {
          processingTimeMs: processingTime,
          playbookType: 'immediate',
          playbookId: playbookId,
          stepCount: stepCount,
          updated: result.updated,
          securityEventType: securityEventType,
          severity: alert.severity,
          aiModel: result.aiModel || 'Unknown',
          aiProvider: result.aiProvider || 'Unknown'
        }
      };
      
      console.log('🔍 DEBUG: Timeline event data for immediate playbook:', JSON.stringify(timelineEventData, null, 2));
      
      const createdEvent = await models.AlertTimelineEvent.create(timelineEventData);
      console.log('📝 Immediate playbook generation timeline event created successfully');
      console.log('🔍 DEBUG: Created immediate playbook event ID:', createdEvent.id);
    } catch (timelineError) {
      console.error('❌ Failed to create immediate playbook timeline event:', timelineError);
      console.error('❌ Timeline error details:', {
        message: timelineError.message,
        stack: timelineError.stack,
        alertId: alert.id,
        playbookType: 'immediate',
        modelAvailable: !!models.AlertTimelineEvent,
        resultStructure: {
          hasPlaybook: !!result.playbook,
          hasSteps: !!result.playbook?.steps,
          stepCount: result.playbook?.steps?.length
        }
      });
      // Don't throw the error - continue with response even if timeline fails
    }

    res.status(result.updated ? 200 : 201).json({
      success: true,
      message: result.updated ? 'Immediate action playbook updated successfully' : 'Immediate action playbook generated successfully',
      playbook: result.playbook,
      updated: result.updated,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        securityEventType: alert.aiAnalysis.securityEventType
      }
    });

  } catch (error) {
    console.error('Immediate action playbook generation failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    // Log failed AI agent activity
    try {
      await aiAgentLogService.logAgentActivity({
        agentName: 'Playbook Specialist Agent',
        taskName: 'generate immediate playbook',
        description: `Failed to generate immediate action playbook for Alert: ${alert.title}`,
        executionTimeMs: processingTime,
        success: false,
        errorMessage: error.message || 'Immediate action playbook generation failed',
        userId: req.user.id,
        organizationId,
        alertId: alert.id,
        metadata: {
          playbookType: 'immediate',
          errorType: error.constructor.name,
          severity: alert.severity
        }
      });
    } catch (logError) {
      console.error('Failed to log AI agent activity:', logError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Immediate action playbook generation failed',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity
      }
    });
  }
});

/**
 * Generate or update investigation playbook for alert
 * POST /api/alerts/:id/generate-investigation-playbook
 */
const generateInvestigationPlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const startTime = Date.now();
  
  // Get alert with AI analysis
  const alert = await models.Alert.findOne({
    where: { id, organizationId }
  });

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  if (!alert.aiAnalysis) {
    return res.status(400).json({
      success: false,
      error: 'AI analysis must be completed before generating playbooks'
    });
  }

  try {
    console.log(`🎯 Starting investigation playbook generation for alert ${alert.id}`);

    // Generate or update the investigation playbook
    const result = await alertPlaybookService.generateOrUpdateInvestigationPlaybook(alert, req.user);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Investigation playbook ${result.updated ? 'updated' : 'generated'} for alert ${alert.id} in ${processingTime}ms`);

    // Log AI agent activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Playbook Specialist Agent',
      taskName: 'generate investigation playbook',
      description: `${result.updated ? 'Updated' : 'Generated'} investigation playbook for Alert: ${alert.title}`,
      inputTokens: result.inputTokens || 0,
      outputTokens: result.outputTokens || 0,
      executionTimeMs: processingTime,
      success: true,
      userId: req.user.id,
      organizationId,
      alertId: alert.id,
      aiProvider: result.aiProvider,
      aiModel: result.aiModel,
      metadata: {
        playbookType: 'investigation',
        updated: result.updated,
        securityEventType: alert.aiAnalysis.securityEventType,
        severity: alert.severity
      }
    });

    // Create investigation playbook generation timeline event
    console.log('🔍 DEBUG: About to create investigation playbook timeline event');
    console.log('🔍 DEBUG: AlertTimelineEvent model available:', !!models.AlertTimelineEvent);
    console.log('🔍 DEBUG: alert.id:', alert.id);
    console.log('🔍 DEBUG: result.playbook exists:', !!result.playbook);
    console.log('🔍 DEBUG: result.playbook.steps:', result.playbook?.steps?.length);
    console.log('🔍 DEBUG: result.updated:', result.updated);
    console.log('🔍 DEBUG: alert.aiAnalysis.securityEventType:', alert.aiAnalysis?.securityEventType);
    
    try {
      // Defensive data access with fallbacks
      const stepCount = result.playbook?.steps?.length || 0;
      const securityEventType = alert.aiAnalysis?.securityEventType || 'Unknown';
      const playbookId = result.playbook?.id || 'Unknown';
      
      const timelineEventData = {
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_analysis_completed',
        title: result.updated ? 'Investigation Playbook Updated' : 'Investigation Playbook Generated',
        description: `AI-powered investigation playbook ${result.updated ? 'updated' : 'generated'} successfully. Generated ${stepCount} investigation steps for ${securityEventType} incident.`,
        aiSource: 'PLAYBOOK_SPECIALIST_AGENT',
        aiConfidence: 90,
        isTestData: false,
        metadata: {
          processingTimeMs: processingTime,
          playbookType: 'investigation',
          playbookId: playbookId,
          stepCount: stepCount,
          updated: result.updated,
          securityEventType: securityEventType,
          severity: alert.severity,
          aiModel: result.aiModel || 'Unknown',
          aiProvider: result.aiProvider || 'Unknown'
        }
      };
      
      console.log('🔍 DEBUG: Timeline event data for investigation playbook:', JSON.stringify(timelineEventData, null, 2));
      
      const createdEvent = await models.AlertTimelineEvent.create(timelineEventData);
      console.log('📝 Investigation playbook generation timeline event created successfully');
      console.log('🔍 DEBUG: Created investigation playbook event ID:', createdEvent.id);
    } catch (timelineError) {
      console.error('❌ Failed to create investigation playbook timeline event:', timelineError);
      console.error('❌ Timeline error details:', {
        message: timelineError.message,
        stack: timelineError.stack,
        alertId: alert.id,
        playbookType: 'investigation',
        modelAvailable: !!models.AlertTimelineEvent,
        resultStructure: {
          hasPlaybook: !!result.playbook,
          hasSteps: !!result.playbook?.steps,
          stepCount: result.playbook?.steps?.length
        }
      });
      // Don't throw the error - continue with response even if timeline fails
    }

    res.status(result.updated ? 200 : 201).json({
      success: true,
      message: result.updated ? 'Investigation playbook updated successfully' : 'Investigation playbook generated successfully',
      playbook: result.playbook,
      updated: result.updated,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        securityEventType: alert.aiAnalysis.securityEventType
      }
    });

  } catch (error) {
    console.error('Investigation playbook generation failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    // Log failed AI agent activity
    try {
      await aiAgentLogService.logAgentActivity({
        agentName: 'Playbook Specialist Agent',
        taskName: 'generate investigation playbook',
        description: `Failed to generate investigation playbook for Alert: ${alert.title}`,
        executionTimeMs: processingTime,
        success: false,
        errorMessage: error.message || 'Investigation playbook generation failed',
        userId: req.user.id,
        organizationId,
        alertId: alert.id,
        metadata: {
          playbookType: 'investigation',
          errorType: error.constructor.name,
          severity: alert.severity
        }
      });
    } catch (logError) {
      console.error('Failed to log AI agent activity:', logError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Investigation playbook generation failed',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity
      }
    });
  }
});

/**
 * Get generated playbooks for a specific alert
 * GET /api/alerts/:id/playbooks
 */
const getAlertPlaybooks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Verify alert exists and belongs to organization
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
    attributes: ['id', 'title', 'severity', 'aiAnalysis', 'generatedPlaybookIds', 'playbooksGeneratedAt']
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  // Get generated playbooks
  const playbooks = await alertPlaybookService.getGeneratedPlaybooks(id, organizationId);

  res.status(200).json({
    success: true,
    playbooks,
    count: playbooks.length,
    alert: {
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      hasAiAnalysis: !!alert.aiAnalysis,
      playbooksGeneratedAt: alert.playbooksGeneratedAt
    },
    playbookTypes: playbooks.map(p => ({
      id: p.id,
      type: p.playbookType,
      name: p.name,
      createdAt: p.createdAt
    }))
  });
});

/**
 * Delete generated playbooks for a specific alert
 * DELETE /api/alerts/:id/playbooks
 */
const deleteAlertPlaybooks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Verify alert exists and belongs to organization
  const alert = await models.Alert.findOne({
    where: { id, organizationId }
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  // Find and delete generated playbooks
  const playbooks = await models.Playbook.findAll({
    where: {
      sourceAlertId: id,
      organizationId: organizationId,
      aiGenerated: true
    }
  });

  if (playbooks.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No generated playbooks found for this alert',
      deletedCount: 0
    });
  }

  // Delete playbooks
  const deletedCount = await models.Playbook.destroy({
    where: {
      sourceAlertId: id,
      organizationId: organizationId,
      aiGenerated: true
    }
  });

  // Clear playbook references from alert
  await alert.update({
    generatedPlaybookIds: [],
    playbooksGeneratedAt: null
  });

  // Create timeline event
  await models.AlertTimelineEvent.create({
    alertId: alert.id,
    timestamp: new Date(),
    type: 'user_action',
    title: 'Generated Playbooks Deleted',
    description: `User ${req.user.firstName} ${req.user.lastName} deleted ${deletedCount} AI-generated playbooks`,
    userId: req.user.id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    metadata: {
      action: 'delete_generated_playbooks',
      deletedCount: deletedCount,
      playbookIds: playbooks.map(p => p.id)
    }
  });

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${deletedCount} generated playbooks`,
    deletedCount,
    alert: {
      id: alert.id,
      title: alert.title
    }
  });
});

/**
 * Get playbook generation status for an alert
 * GET /api/alerts/:id/playbooks/status
 */
const getPlaybookGenerationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Verify alert exists
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
    attributes: ['id', 'title', 'aiAnalysis', 'aiAnalysisTimestamp', 'generatedPlaybookIds', 'playbooksGeneratedAt']
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  const hasAiAnalysis = !!alert.aiAnalysis;
  const hasPlaybooks = await alertPlaybookService.hasGeneratedPlaybooks(id, organizationId);

  res.status(200).json({
    success: true,
    alert: {
      id: alert.id,
      title: alert.title
    },
    status: {
      hasAiAnalysis,
      aiAnalysisTimestamp: alert.aiAnalysisTimestamp,
      hasGeneratedPlaybooks: hasPlaybooks,
      playbooksGeneratedAt: alert.playbooksGeneratedAt,
      canGeneratePlaybooks: hasAiAnalysis,
      playbookIds: alert.generatedPlaybookIds || []
    }
  });
});

/**
 * Preview playbook generation context (for debugging/validation)
 * GET /api/alerts/:id/playbooks/preview
 */
const previewPlaybookContext = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find alert with asset info
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.Asset,
        as: 'asset',
        attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner', 'osType', 'osVersion'],
        required: false
      }
    ]
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  if (!alert.aiAnalysis) {
    throw new BadRequestError('AI analysis must be completed before previewing playbook context');
  }

  // Build context preview
  const contextPreview = {
    alert: {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      securityEventType: alert.aiAnalysis.securityEventType,
      riskLevel: alert.aiAnalysis.riskAssessment?.level,
      confidence: alert.aiAnalysis.confidence
    },
    asset: alert.asset ? {
      name: alert.asset.name,
      type: alert.asset.assetType,
      criticality: alert.asset.criticality,
      location: alert.asset.location
    } : null,
    aiAnalysis: {
      summary: alert.aiAnalysis.summary,
      securityEventType: alert.aiAnalysis.securityEventType,
      riskAssessment: alert.aiAnalysis.riskAssessment,
      recommendedActions: alert.aiAnalysis.recommendedActions
    },
    contextSize: {
      rawDataKeys: Object.keys(alert.rawData || {}).length,
      enrichmentDataKeys: Object.keys(alert.enrichmentData || {}).length,
      hasAssetInfo: !!alert.asset,
      hasAiAnalysis: true
    }
  };

  res.status(200).json({
    success: true,
    contextPreview,
    readyForGeneration: true,
    estimatedTokens: JSON.stringify(contextPreview).length // Rough estimate
  });
});

/**
 * Export playbook as PDF
 * GET /api/alerts/:id/playbooks/:playbookId/export-pdf
 */
const exportPlaybookPDF = async (req, res, next) => {
  try {
    const { id: alertId, playbookId } = req.params;
    const organizationId = req.user.organizationId;

    // Find the alert
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality']
        }
      ]
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Find the playbook
    const playbook = await models.Playbook.findOne({
      where: { 
        id: playbookId, 
        sourceAlertId: alertId,
        organizationId 
      }
    });

    if (!playbook) {
      throw new NotFoundError('Playbook not found');
    }

    // Generate PDF using Puppeteer
    const pdfData = await pdfGenerationService.generatePlaybookPDF(alert, playbook, req.user);
    
    // Generate filename
    const filename = pdfGenerationService.generateFilename(alert, playbook);

    // Send binary PDF response
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfData.length
    });
    
    // Write binary data directly from Uint8Array
    res.write(pdfData);
    res.end();

  } catch (error) {
    console.error('PDF generation failed:', error);
    next(error);
  }
};

module.exports = {
  generatePlaybooks,
  generateImmediatePlaybook,
  generateInvestigationPlaybook,
  getAlertPlaybooks,
  deleteAlertPlaybooks,
  getPlaybookGenerationStatus,
  previewPlaybookContext,
  exportPlaybookPDF
};