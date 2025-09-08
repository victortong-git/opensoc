const { models } = require('../database/models');
const { asyncHandler, NotFoundError } = require('../middleware/error.middleware');
const incidentThreatHuntGenerationService = require('../services/incidentThreatHuntGenerationService');

/**
 * Generate threat hunt from incident
 * POST /api/incidents/:id/generate-threat-hunt
 */
const generateThreatHuntFromIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const user = req.user;

  // Find the incident with full context
  const incident = await models.Incident.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'ASC']],
        required: false
      }
    ]
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  const processingStart = Date.now();

  try {
    console.log(`🎯 Generating threat hunt from incident: ${incident.id} - ${incident.title}`);

    // Generate threat hunt using the service
    const result = await incidentThreatHuntGenerationService.generateThreatHunt(
      incident,
      organizationId,
      user
    );

    const processingTime = Date.now() - processingStart;

    console.log(`✅ Threat hunt generated successfully in ${processingTime}ms`);
    console.log('🎯 DEBUG CONTROLLER: Result from service:', Object.keys(result || {}));
    console.log('🎯 DEBUG CONTROLLER: Result success:', result?.success);
    console.log('🎯 DEBUG CONTROLLER: Result has threatHuntData:', !!result?.threatHuntData);

    const finalResponse = {
      success: true,
      ...result,
      processingTimeMs: processingTime
    };
    
    console.log('🎯 DEBUG CONTROLLER: Final response to frontend:', Object.keys(finalResponse));
    console.log('🎯 DEBUG CONTROLLER: Final response success:', finalResponse.success);
    console.log('🎯 DEBUG CONTROLLER: Final response has threatHuntData:', !!finalResponse.threatHuntData);

    res.json(finalResponse);

  } catch (error) {
    const processingTime = Date.now() - processingStart;
    console.error('❌ Threat hunt generation failed:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Threat hunt generation service is temporarily unavailable. Please try again later.';
    let statusCode = 500;

    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorMessage = 'Threat hunt generation is taking longer than expected. Please try again.';
      statusCode = 504; // Gateway timeout
    } else if (error.message?.includes('AI generation failed')) {
      errorMessage = 'AI service is currently unavailable for threat hunt generation.';
      statusCode = 503; // Service unavailable
    } else if (error.message?.includes('Invalid response')) {
      errorMessage = 'AI service returned invalid response. Please try again.';
      statusCode = 502; // Bad gateway
    } else if (error.message?.includes('Missing required field')) {
      errorMessage = 'Generated threat hunt data is incomplete. Please try again.';
      statusCode = 502;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      processingTimeMs: processingTime,
      incident: {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        category: incident.category
      }
    });
  }
});

/**
 * Proof-read threat hunt content
 * POST /api/incidents/threat-hunt/proof-read
 */
const proofReadThreatHuntContent = asyncHandler(async (req, res) => {
  const { fieldsToProofRead } = req.body;
  const user = req.user;
  const organizationId = req.user.organizationId;

  if (!fieldsToProofRead || typeof fieldsToProofRead !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Fields to proof-read are required and must be an object'
    });
  }

  const processingStart = Date.now();

  try {
    console.log('📝 Starting threat hunt content proof-reading...');

    // Use the AI tool executor directly for proof-reading
    const aiToolExecutor = require('../tools/common/toolExecutor');
    
    const toolResult = await aiToolExecutor.executeTool(
      'proofread_threat_hunt_content',
      {
        fieldsToProofRead
      },
      {
        sessionId: `threat_hunt_proofread_${Date.now()}`,
        userId: user.id,
        organizationId
      }
    );

    const processingTime = Date.now() - processingStart;

    if (!toolResult.success) {
      throw new Error(`Proof-reading failed: ${toolResult.error}`);
    }

    console.log(`✅ Proof-reading completed successfully in ${processingTime}ms`);

    res.json({
      success: true,
      suggestions: toolResult.result,
      processingTimeMs: processingTime,
      proofReadAt: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - processingStart;
    console.error('❌ Proof-reading failed:', error);

    let errorMessage = 'Proof-reading service is temporarily unavailable. Please try again later.';
    let statusCode = 500;

    if (error.message?.includes('timeout')) {
      errorMessage = 'Proof-reading is taking longer than expected. Please try again.';
      statusCode = 504;
    } else if (error.message?.includes('AI service')) {
      errorMessage = 'AI proof-reading service is currently unavailable.';
      statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      processingTimeMs: processingTime
    });
  }
});

module.exports = {
  generateThreatHuntFromIncident,
  proofReadThreatHuntContent
};