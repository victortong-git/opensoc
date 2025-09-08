const { models } = require('../database/models/index');
const { Op } = require('sequelize');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/error.middleware');
const aiGenerationService = require('../services/aiGenerationService');
const aiAgentLogService = require('../services/aiAgentLogService');

const { ThreatActor, ThreatCampaign, IOC } = models;

/**
 * Get threat actors with optional filtering
 */
const getThreatActors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc',
      isActive,
      sophistication,
      origin 
    } = req.query;

    const organizationId = req.user.organizationId;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {
      organizationId
    };

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { aliases: { [Op.overlap]: [search] } }
      ];
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }

    if (sophistication) {
      whereConditions.sophistication = sophistication;
    }

    if (origin) {
      whereConditions.origin = { [Op.iLike]: `%${origin}%` };
    }

    // Get threat actors with pagination
    const { count, rows: threatActors } = await ThreatActor.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: ThreatCampaign,
          as: 'threatCampaigns',
          attributes: ['id', 'name', 'isActive'],
          required: false
        }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / parseInt(limit));
    const currentPage = parseInt(page);

    res.json({
      actors: threatActors,
      pagination: {
        currentPage,
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    });

  } catch (error) {
    console.error('Error fetching threat actors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threat actors',
      details: error.message 
    });
  }
};

/**
 * Get threat campaigns with optional filtering
 */
const getThreatCampaigns = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc',
      isActive,
      severity,
      confidence,
      threatActorId 
    } = req.query;

    const organizationId = req.user.organizationId;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {
      organizationId
    };

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }

    if (severity) {
      whereConditions.severity = parseInt(severity);
    }

    if (confidence) {
      whereConditions.confidence = confidence;
    }

    if (threatActorId) {
      whereConditions.threatActorId = threatActorId;
    }

    // Get threat campaigns with pagination
    const { count, rows: threatCampaigns } = await ThreatCampaign.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: ThreatActor,
          as: 'threatActor',
          attributes: ['id', 'name', 'aliases'],
          required: false
        }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / parseInt(limit));
    const currentPage = parseInt(page);

    res.json({
      campaigns: threatCampaigns,
      pagination: {
        currentPage,
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    });

  } catch (error) {
    console.error('Error fetching threat campaigns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threat campaigns',
      details: error.message 
    });
  }
};

/**
 * Get threat intelligence summary statistics
 */
const getThreatIntelStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    // Get IOC stats
    const totalIOCs = await IOC.count({
      where: { organizationId }
    });

    const activeIOCs = await IOC.count({
      where: { 
        organizationId,
        isActive: true 
      }
    });

    // Get threat actor stats
    const totalThreatActors = await ThreatActor.count({
      where: { organizationId }
    });

    const activeThreatActors = await ThreatActor.count({
      where: { 
        organizationId,
        isActive: true 
      }
    });

    // Get threat campaign stats
    const totalCampaigns = await ThreatCampaign.count({
      where: { organizationId }
    });

    const activeCampaigns = await ThreatCampaign.count({
      where: { 
        organizationId,
        isActive: true 
      }
    });

    // Get recent activity counts (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentIOCs = await IOC.count({
      where: { 
        organizationId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const recentThreatActors = await ThreatActor.count({
      where: { 
        organizationId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const recentCampaigns = await ThreatCampaign.count({
      where: { 
        organizationId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    res.json({
      activeIOCs,
      threatActors: activeThreatActors,
      activeCampaigns,
      intelligenceFeeds: 12, // Mock value - would be real if we had feed management
      
      // Additional stats
      totalStats: {
        totalIOCs,
        totalThreatActors,
        totalCampaigns
      },
      recentActivity: {
        recentIOCs,
        recentThreatActors,
        recentCampaigns
      }
    });

  } catch (error) {
    console.error('Error fetching threat intelligence stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threat intelligence statistics',
      details: error.message 
    });
  }
};

/**
 * Get single threat actor by ID
 */
const getThreatActor = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const threatActor = await ThreatActor.findOne({
      where: { 
        id, 
        organizationId 
      },
      include: [
        {
          model: ThreatCampaign,
          as: 'threatCampaigns',
          required: false
        }
      ]
    });

    if (!threatActor) {
      return res.status(404).json({ error: 'Threat actor not found' });
    }

    res.json({ threatActor });

  } catch (error) {
    console.error('Error fetching threat actor:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threat actor',
      details: error.message 
    });
  }
};

/**
 * Get single threat campaign by ID
 */
const getThreatCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const threatCampaign = await ThreatCampaign.findOne({
      where: { 
        id, 
        organizationId 
      },
      include: [
        {
          model: ThreatActor,
          as: 'threatActor',
          required: false
        }
      ]
    });

    if (!threatCampaign) {
      return res.status(404).json({ error: 'Threat campaign not found' });
    }

    res.json({ threatCampaign });

  } catch (error) {
    console.error('Error fetching threat campaign:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threat campaign',
      details: error.message 
    });
  }
};

/**
 * Helper function to create a single threat actor
 * Used by test data generation system
 */
const createThreatActorHelper = async (actorData, user) => {
  console.log('🔧 DEBUG: createThreatActorHelper called with:', { name: actorData?.name, isTestData: actorData?.isTestData });
  
  const validatedData = {
    ...actorData,
    organizationId: user.organizationId,
    isTestData: actorData.isTestData || false,
    // Ensure required fields have defaults
    name: actorData.name || 'Unknown Threat Actor',
    description: actorData.description || 'Threat actor details to be determined',
    sophistication: actorData.sophistication || 'intermediate',
    aliases: Array.isArray(actorData.aliases) ? actorData.aliases : [],
    motivation: Array.isArray(actorData.motivation) ? actorData.motivation : [],
    targetSectors: Array.isArray(actorData.targetSectors) ? actorData.targetSectors : [],
    techniques: Array.isArray(actorData.techniques) ? actorData.techniques : [],
    campaigns: Array.isArray(actorData.campaigns) ? actorData.campaigns : [],
    metadata: actorData.metadata || {},
  };

  try {
    const createdActor = await models.ThreatActor.create(validatedData);
    console.log('✅ Threat actor created:', createdActor.id, createdActor.name);
    return createdActor;
  } catch (error) {
    console.error('❌ Failed to create threat actor:', actorData.name, error);
    throw new ValidationError(`Failed to create threat actor: ${error.message}`);
  }
};

/**
 * Helper function to create multiple threat actors (for bulk operations)
 * Used by test data generation system
 */
const createThreatActorBulkHelper = async (actorsArray, user, organizationId) => {
  console.log('🔧 DEBUG: createThreatActorBulkHelper called with:', { count: actorsArray?.length, userId: user?.id });
  
  if (!Array.isArray(actorsArray) || actorsArray.length === 0) {
    throw new ValidationError('Threat actors array is required and cannot be empty');
  }

  // Helper function to convert sophistication values
  const convertSophistication = (value) => {
    if (typeof value === 'string' && ['basic', 'intermediate', 'advanced', 'expert'].includes(value)) {
      return value;
    }
    if (typeof value === 'number') {
      const mapping = { 1: 'basic', 2: 'intermediate', 3: 'advanced', 4: 'expert' };
      return mapping[value] || 'intermediate';
    }
    return 'intermediate';
  };

  // Helper function to handle motivation field
  const convertMotivation = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  };

  const validatedActors = actorsArray.map(actor => ({
    ...actor,
    organizationId: organizationId || user.organizationId,
    isTestData: actor.isTestData || false,
    name: actor.name || 'Unknown Threat Actor',
    description: actor.description || 'Threat actor details to be determined',
    sophistication: convertSophistication(actor.sophistication),
    aliases: Array.isArray(actor.aliases) ? actor.aliases : [],
    motivation: convertMotivation(actor.motivation),
    targetSectors: Array.isArray(actor.targetSectors) ? actor.targetSectors : [],
    techniques: Array.isArray(actor.techniques) ? actor.techniques : [],
    campaigns: Array.isArray(actor.campaigns) ? actor.campaigns : [],
    metadata: actor.metadata || {},
  }));

  try {
    const createdActors = await models.ThreatActor.bulkCreate(validatedActors);
    console.log('✅ Bulk created threat actors:', createdActors.length);
    return createdActors.map(actor => actor.id);
  } catch (error) {
    console.error('❌ Failed to bulk create threat actors:', error);
    throw new ValidationError(`Failed to create threat actors: ${error.message}`);
  }
};

/**
 * Helper function to create a single threat campaign
 * Used by test data generation system
 */
const createThreatCampaignHelper = async (campaignData, user) => {
  console.log('🔧 DEBUG: createThreatCampaignHelper called with:', { name: campaignData?.name, isTestData: campaignData?.isTestData });
  
  const validatedData = {
    ...campaignData,
    organizationId: user.organizationId,
    isTestData: campaignData.isTestData || false,
    // Ensure required fields have defaults
    name: campaignData.name || 'Unknown Campaign',
    description: campaignData.description || 'Campaign details to be determined',
    severity: campaignData.severity || 3,
    confidence: campaignData.confidence || 'medium',
    targetSectors: Array.isArray(campaignData.targetSectors) ? campaignData.targetSectors : [],
    targetGeographies: Array.isArray(campaignData.targetGeographies) ? campaignData.targetGeographies : [],
    techniques: Array.isArray(campaignData.techniques) ? campaignData.techniques : [],
    objectives: Array.isArray(campaignData.objectives) ? campaignData.objectives : [],
    associatedIOCs: Array.isArray(campaignData.associatedIOCs) ? campaignData.associatedIOCs : [],
    relatedIncidents: Array.isArray(campaignData.relatedIncidents) ? campaignData.relatedIncidents : [],
    tags: Array.isArray(campaignData.tags) ? campaignData.tags : [],
    metadata: campaignData.metadata || {},
  };

  try {
    const createdCampaign = await models.ThreatCampaign.create(validatedData);
    console.log('✅ Threat campaign created:', createdCampaign.id, createdCampaign.name);
    return createdCampaign;
  } catch (error) {
    console.error('❌ Failed to create threat campaign:', campaignData.name, error);
    throw new ValidationError(`Failed to create threat campaign: ${error.message}`);
  }
};

/**
 * Helper function to create multiple threat campaigns (for bulk operations)
 * Used by test data generation system
 */
const createThreatCampaignBulkHelper = async (campaignsArray, user, organizationId) => {
  console.log('🔧 DEBUG: createThreatCampaignBulkHelper called with:', { count: campaignsArray?.length, userId: user?.id });
  
  if (!Array.isArray(campaignsArray) || campaignsArray.length === 0) {
    throw new ValidationError('Threat campaigns array is required and cannot be empty');
  }

  // Helper function to convert confidence values
  const convertConfidence = (value) => {
    if (typeof value === 'string' && ['low', 'medium', 'high', 'very_high'].includes(value)) {
      return value;
    }
    if (typeof value === 'number') {
      const mapping = { 1: 'low', 2: 'medium', 3: 'high', 4: 'very_high' };
      return mapping[value] || 'medium';
    }
    return 'medium';
  };

  const validatedCampaigns = campaignsArray.map(campaign => ({
    ...campaign,
    organizationId: organizationId || user.organizationId,
    isTestData: campaign.isTestData || false,
    name: campaign.name || 'Unknown Campaign',
    description: campaign.description || 'Campaign details to be determined',
    severity: campaign.severity || 3,
    confidence: convertConfidence(campaign.confidence),
    targetSectors: Array.isArray(campaign.targetSectors) ? campaign.targetSectors : [],
    targetGeographies: Array.isArray(campaign.targetGeographies) ? campaign.targetGeographies : [],
    techniques: Array.isArray(campaign.techniques) ? campaign.techniques : [],
    objectives: Array.isArray(campaign.objectives) ? campaign.objectives : [],
    associatedIOCs: Array.isArray(campaign.associatedIOCs) ? campaign.associatedIOCs : [],
    relatedIncidents: Array.isArray(campaign.relatedIncidents) ? campaign.relatedIncidents : [],
    tags: Array.isArray(campaign.tags) ? campaign.tags : [],
    metadata: campaign.metadata || {},
  }));

  try {
    const createdCampaigns = await models.ThreatCampaign.bulkCreate(validatedCampaigns);
    console.log('✅ Bulk created threat campaigns:', createdCampaigns.length);
    return createdCampaigns.map(campaign => campaign.id);
  } catch (error) {
    console.error('❌ Failed to bulk create threat campaigns:', error);
    throw new ValidationError(`Failed to create threat campaigns: ${error.message}`);
  }
};

/**
 * AI Generate Threat Hunt from IOC
 * POST /api/threat-intel/iocs/:id/ai-generate-hunt
 */
const aiGenerateIOCHunt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the IOC with context
  const ioc = await IOC.findOne({
    where: { id, organizationId }
  });

  if (!ioc) {
    throw new NotFoundError('IOC not found');
  }

  const startTime = Date.now();

  try {
    // Prepare IOC context for AI
    const iocContext = {
      id: ioc.id,
      type: ioc.type,
      value: ioc.value,
      confidence: ioc.confidence,
      severity: ioc.severity,
      description: ioc.description,
      source: ioc.source,
      tags: ioc.tags,
      firstSeen: ioc.firstSeen,
      lastSeen: ioc.lastSeen,
      isActive: ioc.isActive,
      relatedCampaign: ioc.relatedCampaign,
      mitreAttack: ioc.mitreAttack
    };

    // Build comprehensive prompt for threat hunt generation
    const prompt = `As an expert threat hunter, create a comprehensive threat hunting plan from this IOC (Indicator of Compromise). Design a detailed hunting methodology to detect similar threats and uncover potential compromises.

IOC CONTEXT:
============
IOC ID: ${iocContext.id}
Type: ${iocContext.type}
Value: ${iocContext.value}
Confidence: ${iocContext.confidence}
Severity: ${iocContext.severity}/5 (${iocContext.severity >= 4 ? 'HIGH/CRITICAL' : iocContext.severity >= 3 ? 'MEDIUM' : 'LOW'})
Description: ${iocContext.description}
Source: ${iocContext.source}
Tags: ${JSON.stringify(iocContext.tags)}
First Seen: ${iocContext.firstSeen}
Last Seen: ${iocContext.lastSeen}
Active Status: ${iocContext.isActive}
Related Campaign: ${iocContext.relatedCampaign}
MITRE ATT&CK TTPs: ${JSON.stringify(iocContext.mitreAttack)}

TASK: Create a JSON object for a threat hunt targeting this IOC.

You must respond with ONLY a valid JSON object. No explanations, no markdown, no other text.

Required JSON structure:
{
  "title": "Hunt title for ${ioc.type} ${ioc.value}",
  "description": "Why this hunt is important and what threats we're looking for",
  "priority": ${ioc.severity || 3},
  "category": "network_hunt",
  "huntType": "proactive",
  "huntingPlan": "Step by step hunting methodology: 1) Query data sources 2) Search for IOC 3) Analyze patterns 4) Correlate findings 5) Document results",
  "successCriteria": "Find all instances of the IOC in our environment",
  "estimatedEffort": "2-4 hours",
  "huntQueries": ["source_ip:${ioc.value}", "destination_ip:${ioc.value}"],
  "investigationSteps": ["Execute queries", "Analyze results", "Correlate findings"],
  "expectedFindings": "Detection of IOC activity and related threats",
  "mitreTactics": ["Initial Access"],
  "mitreTechniques": ["T1566"],
  "threatsDetected": ["Malicious activity"],
  "coverageGaps": "May miss advanced evasion techniques",
  "confidence": 85
}

IMPORTANT: 
- Return ONLY the JSON object
- Replace values with appropriate content for the IOC
- No extra text before or after the JSON
- Ensure valid JSON syntax`;

    // Generate AI suggestions
    const response = await aiGenerationService.generateResponse({
      prompt,
      organizationId
    });

    const analysis = response.content || response.response;
    const processingTime = Date.now() - startTime;

    // Debug logging - log the actual AI response
    console.log('🔍 AI Response Debug Info:');
    console.log('  Response type:', typeof analysis);
    console.log('  Response length:', analysis?.length || 0);
    console.log('  Response preview (first 500 chars):', analysis?.substring(0, 500) || 'N/A');
    console.log('  Response preview (last 500 chars):', analysis?.length > 500 ? analysis.substring(analysis.length - 500) : 'N/A');

    // Parse AI response with enhanced error handling
    let aiSuggestions;
    try {
      if (typeof analysis === 'string') {
        let cleanedAnalysis = analysis.trim();
        
        console.log('🧹 Cleaning AI response...');
        
        // Remove markdown code blocks if present
        if (cleanedAnalysis.startsWith('```json')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          console.log('  Removed ```json code blocks');
        } else if (cleanedAnalysis.startsWith('```')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```\s*/, '').replace(/\s*```$/, '');
          console.log('  Removed ``` code blocks');
        }
        
        // Enhanced JSON extraction with multiple patterns
        let jsonMatch = null;
        
        // Pattern 1: Look for complete JSON object
        jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
        
        // Pattern 2: If no match, look for JSON starting after explanatory text
        if (!jsonMatch) {
          const jsonStart = cleanedAnalysis.indexOf('{');
          const jsonEnd = cleanedAnalysis.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonMatch = [cleanedAnalysis.substring(jsonStart, jsonEnd + 1)];
            console.log('  Found JSON using start/end position method');
          }
        }
        
        // Pattern 3: Look for JSON between common delimiters
        if (!jsonMatch) {
          const patterns = [
            /JSON:\s*(\{[\s\S]*\})/,
            /json:\s*(\{[\s\S]*\})/,
            /response:\s*(\{[\s\S]*\})/i,
            /result:\s*(\{[\s\S]*\})/i
          ];
          
          for (const pattern of patterns) {
            const match = cleanedAnalysis.match(pattern);
            if (match && match[1]) {
              jsonMatch = [match[1]];
              console.log('  Found JSON using pattern:', pattern.toString());
              break;
            }
          }
        }
        
        if (jsonMatch) {
          console.log('✅ JSON structure found, attempting parse...');
          console.log('  JSON content preview:', jsonMatch[0].substring(0, 200) + '...');
          
          try {
            aiSuggestions = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON parsed successfully');
          } catch (jsonParseError) {
            console.error('❌ JSON parse failed:', jsonParseError.message);
            console.log('🔧 Attempting JSON repair...');
            
            // Attempt to fix common JSON issues
            let repairedJson = jsonMatch[0]
              .replace(/,\s*}/g, '}')  // Remove trailing commas
              .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
              .replace(/:\s*'([^']*)'/g, ':"$1"')  // Replace single quotes with double quotes
              .trim();
            
            try {
              aiSuggestions = JSON.parse(repairedJson);
              console.log('✅ JSON repaired and parsed successfully');
            } catch (repairError) {
              console.error('❌ JSON repair failed:', repairError.message);
              throw new Error(`JSON structure found but cannot be parsed: ${jsonParseError.message}`);
            }
          }
        } else {
          console.error('❌ No JSON structure found in AI response');
          console.log('  Cleaned analysis preview:', cleanedAnalysis.substring(0, 1000));
          throw new Error('No JSON structure found in AI response');
        }
      } else {
        console.log('🔄 Using AI response directly (not a string)');
        aiSuggestions = analysis;
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('❌ Full error details:', parseError.stack);
      
      // Provide fallback response instead of complete failure
      console.log('🆘 Generating fallback hunt suggestions...');
      aiSuggestions = generateFallbackHuntSuggestions(ioc, parseError);
    }

    // Structure response with defaults
    const huntSuggestions = {
      title: aiSuggestions.title || `Threat Hunt: ${ioc.type.toUpperCase()} Detection`,
      description: aiSuggestions.description || `Hunt for threats related to IOC: ${ioc.value}`,
      priority: aiSuggestions.priority || ioc.severity,
      category: aiSuggestions.category || 'network_hunt',
      huntType: aiSuggestions.huntType || 'proactive',
      huntingPlan: aiSuggestions.huntingPlan || 'Comprehensive hunting plan to be executed',
      successCriteria: aiSuggestions.successCriteria || 'Detection and validation of IOC presence',
      estimatedEffort: aiSuggestions.estimatedEffort || '2-4 hours',
      huntQueries: aiSuggestions.huntQueries || [`Search for IOC: ${ioc.value}`],
      investigationSteps: aiSuggestions.investigationSteps || ['Validate detection', 'Analyze scope', 'Collect evidence'],
      expectedFindings: aiSuggestions.expectedFindings || 'IOC matches and related threat activity',
      mitreTactics: aiSuggestions.mitreTactics || ioc.mitreAttack || [],
      mitreTechniques: aiSuggestions.mitreTechniques || [],
      threatsDetected: aiSuggestions.threatsDetected || ['Unknown threat activity'],
      coverageGaps: aiSuggestions.coverageGaps || 'Additional hunts may be needed for comprehensive coverage',
      confidence: aiSuggestions.confidence || 85
    };

    // Log AI agent activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Threat Intelligence Hunt Generator',
      taskName: 'generate threat hunt from IOC',
      description: `Generated threat hunt for IOC: ${ioc.value} with ${huntSuggestions.confidence}% confidence`,
      executionTimeMs: processingTime,
      success: true,
      userId: req.user.id,
      organizationId,
      metadata: {
        iocId: ioc.id,
        iocType: ioc.type,
        iocSeverity: ioc.severity,
        huntCategory: huntSuggestions.category,
        huntType: huntSuggestions.huntType
      }
    });

    res.json({
      success: true,
      suggestions: huntSuggestions,
      processingTime: processingTime,
      sourceIOC: {
        id: ioc.id,
        type: ioc.type,
        value: ioc.value,
        severity: ioc.severity
      }
    });

  } catch (error) {
    console.error('AI IOC hunt generation failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    // Log failed AI agent activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Threat Intelligence Hunt Generator',
      taskName: 'generate threat hunt from IOC',
      description: `Failed to generate hunt from IOC: ${ioc.value}`,
      executionTimeMs: processingTime,
      success: false,
      errorMessage: error.message,
      userId: req.user.id,
      organizationId,
      metadata: {
        iocId: ioc.id,
        iocType: ioc.type,
        errorType: error.constructor.name
      }
    });

    res.status(500).json({
      success: false,
      error: error.message || 'AI threat hunt generation failed'
    });
  }
});

/**
 * AI Generate Threat Hunt from Threat Actor
 * POST /api/threat-intel/actors/:id/ai-generate-hunt
 */
const aiGenerateThreatActorHunt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the Threat Actor with related campaigns
  const threatActor = await ThreatActor.findOne({
    where: { id, organizationId },
    include: [
      {
        model: ThreatCampaign,
        as: 'threatCampaigns',
        required: false
      }
    ]
  });

  if (!threatActor) {
    throw new NotFoundError('Threat Actor not found');
  }

  const startTime = Date.now();

  try {
    // Prepare Threat Actor context for AI
    const actorContext = {
      id: threatActor.id,
      name: threatActor.name,
      aliases: threatActor.aliases,
      description: threatActor.description,
      sophistication: threatActor.sophistication,
      origin: threatActor.origin,
      firstSeen: threatActor.firstSeen,
      lastSeen: threatActor.lastSeen,
      isActive: threatActor.isActive,
      campaigns: threatActor.campaigns,
      techniques: threatActor.techniques,
      targetSectors: threatActor.targetSectors,
      relatedCampaigns: threatActor.threatCampaigns
    };

    const prompt = `As an expert threat hunter, create a comprehensive threat hunting plan to detect activities by this threat actor. Focus on behavioral patterns, TTPs, and infrastructure associated with this actor.

THREAT ACTOR CONTEXT:
=====================
Actor ID: ${actorContext.id}
Name: ${actorContext.name}
Aliases: ${JSON.stringify(actorContext.aliases)}
Description: ${actorContext.description}
Sophistication: ${actorContext.sophistication}
Origin: ${actorContext.origin}
First Seen: ${actorContext.firstSeen}
Last Seen: ${actorContext.lastSeen}
Active Status: ${actorContext.isActive}
Known Campaigns: ${JSON.stringify(actorContext.campaigns)}
TTPs: ${JSON.stringify(actorContext.techniques)}
Target Sectors: ${JSON.stringify(actorContext.targetSectors)}
Related Campaigns: ${JSON.stringify(actorContext.relatedCampaigns)}

Generate threat hunt form data in this exact JSON format:
{
  "title": "Comprehensive hunt title targeting this specific threat actor",
  "description": "Detailed hunt description focusing on actor's behavioral patterns, infrastructure, and known TTPs",
  "priority": 1-5 (based on actor sophistication and threat level),
  "category": "apt_hunt|behavioral_hunt|infrastructure_hunt|ttp_hunt",
  "huntType": "proactive|reactive|continuous",
  "huntingPlan": "COMPREHENSIVE hunting methodology targeting: 1) Known TTPs and behavioral patterns, 2) Infrastructure reuse patterns, 3) Code similarities and signatures, 4) Communication patterns, 5) Target selection patterns, 6) Timing and operational security patterns, 7) Attribution indicators. Include specific detection methods for each pattern.",
  "successCriteria": "Clear criteria for identifying actor presence including confidence thresholds and validation requirements",
  "estimatedEffort": "Realistic time estimate considering actor complexity",
  "huntQueries": ["Specific queries targeting actor TTPs, infrastructure, and behavioral patterns"],
  "investigationSteps": ["Detailed steps for investigating suspected actor activity including attribution validation"],
  "expectedFindings": "Expected indicators and evidence patterns associated with this threat actor",
  "mitreTactics": ["MITRE ATT&CK tactics commonly used by this actor"],
  "mitreTechniques": ["Specific MITRE ATT&CK techniques associated with this actor"],
  "threatsDetected": ["Types of campaigns and attacks this hunt can identify"],
  "coverageGaps": "Analysis of actor capabilities this hunt might miss and recommendations",
  "confidence": 1-100
}

CRITICAL REQUIREMENTS:
1. Your response must be ONLY valid JSON
2. Focus on actor-specific behavioral patterns and TTPs
3. Include sophisticated detection methods appropriate for the actor's sophistication level
4. huntingPlan must be detailed with specific methodologies (minimum 500 characters)

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:`;

    const response = await aiGenerationService.generateResponse({
      prompt,
      organizationId
    });

    const analysis = response.content || response.response;
    const processingTime = Date.now() - startTime;

    // Parse and structure response
    let aiSuggestions;
    try {
      if (typeof analysis === 'string') {
        let cleanedAnalysis = analysis.trim();
        if (cleanedAnalysis.startsWith('```json')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedAnalysis.startsWith('```')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiSuggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON structure found');
        }
      } else {
        aiSuggestions = analysis;
      }
    } catch (parseError) {
      throw new Error(`AI threat hunt generation failed - unable to parse response: ${parseError.message}`);
    }

    const huntSuggestions = {
      title: aiSuggestions.title || `APT Hunt: ${threatActor.name}`,
      description: aiSuggestions.description || `Hunt for activities by threat actor: ${threatActor.name}`,
      priority: aiSuggestions.priority || (threatActor.sophistication === 'expert' ? 5 : threatActor.sophistication === 'advanced' ? 4 : 3),
      category: aiSuggestions.category || 'apt_hunt',
      huntType: aiSuggestions.huntType || 'proactive',
      huntingPlan: aiSuggestions.huntingPlan || 'Comprehensive hunting plan targeting actor TTPs',
      successCriteria: aiSuggestions.successCriteria || 'Detection of actor-specific patterns with high confidence',
      estimatedEffort: aiSuggestions.estimatedEffort || '4-8 hours',
      huntQueries: aiSuggestions.huntQueries || [`Hunt for ${threatActor.name} TTPs`],
      investigationSteps: aiSuggestions.investigationSteps || ['Analyze patterns', 'Validate attribution', 'Scope assessment'],
      expectedFindings: aiSuggestions.expectedFindings || 'Actor-specific behavioral patterns and infrastructure',
      mitreTactics: aiSuggestions.mitreTactics || threatActor.techniques || [],
      mitreTechniques: aiSuggestions.mitreTechniques || [],
      threatsDetected: aiSuggestions.threatsDetected || ['APT activity', 'Sophisticated attacks'],
      coverageGaps: aiSuggestions.coverageGaps || 'Actor may use unknown TTPs not covered by this hunt',
      confidence: aiSuggestions.confidence || 80
    };

    await aiAgentLogService.logAgentActivity({
      agentName: 'Threat Intelligence Hunt Generator',
      taskName: 'generate threat hunt from actor',
      description: `Generated threat hunt for actor: ${threatActor.name} with ${huntSuggestions.confidence}% confidence`,
      executionTimeMs: processingTime,
      success: true,
      userId: req.user.id,
      organizationId,
      metadata: {
        actorId: threatActor.id,
        actorName: threatActor.name,
        sophistication: threatActor.sophistication,
        huntCategory: huntSuggestions.category
      }
    });

    res.json({
      success: true,
      suggestions: huntSuggestions,
      processingTime: processingTime,
      sourceThreatActor: {
        id: threatActor.id,
        name: threatActor.name,
        sophistication: threatActor.sophistication
      }
    });

  } catch (error) {
    console.error('AI Threat Actor hunt generation failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    await aiAgentLogService.logAgentActivity({
      agentName: 'Threat Intelligence Hunt Generator',
      taskName: 'generate threat hunt from actor',
      description: `Failed to generate hunt from actor: ${threatActor.name}`,
      executionTimeMs: processingTime,
      success: false,
      errorMessage: error.message,
      userId: req.user.id,
      organizationId
    });

    res.status(500).json({
      success: false,
      error: error.message || 'AI threat hunt generation failed'
    });
  }
});

/**
 * AI Generate Threat Hunt from Campaign
 * POST /api/threat-intel/campaigns/:id/ai-generate-hunt
 */
const aiGenerateCampaignHunt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the Campaign with related actor
  const campaign = await ThreatCampaign.findOne({
    where: { id, organizationId },
    include: [
      {
        model: ThreatActor,
        as: 'threatActor',
        required: false
      }
    ]
  });

  if (!campaign) {
    throw new NotFoundError('Threat Campaign not found');
  }

  const startTime = Date.now();

  try {
    const campaignContext = {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      threatActor: campaign.threatActor?.name,
      severity: campaign.severity,
      isActive: campaign.isActive,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      affectedAssets: campaign.affectedAssets,
      targetSectors: campaign.targetSectors,
      techniques: campaign.techniques
    };

    const prompt = `As an expert threat hunter, create a comprehensive hunting plan to detect this specific threat campaign. Focus on campaign-specific indicators, target patterns, and attack methodologies.

THREAT CAMPAIGN CONTEXT:
========================
Campaign ID: ${campaignContext.id}
Name: ${campaignContext.name}
Description: ${campaignContext.description}
Threat Actor: ${campaignContext.threatActor || 'Unknown'}
Severity: ${campaignContext.severity}/5 (${campaignContext.severity >= 4 ? 'HIGH/CRITICAL' : campaignContext.severity >= 3 ? 'MEDIUM' : 'LOW'})
Active Status: ${campaignContext.isActive}
Start Date: ${campaignContext.startDate}
End Date: ${campaignContext.endDate || 'Ongoing'}
Affected Assets: ${campaignContext.affectedAssets}
Target Sectors: ${JSON.stringify(campaignContext.targetSectors)}
TTPs: ${JSON.stringify(campaignContext.techniques)}

Generate threat hunt form data in this exact JSON format:
{
  "title": "Campaign-specific hunt title",
  "description": "Detailed description focusing on campaign objectives, methods, and targets",
  "priority": 1-5 (based on campaign severity and current threat level),
  "category": "campaign_hunt|targeted_hunt|sector_hunt|timeline_hunt",
  "huntType": "proactive|reactive|continuous",
  "huntingPlan": "COMPREHENSIVE campaign hunting strategy including: 1) Campaign-specific IOCs and signatures, 2) Target selection patterns, 3) Attack timeline analysis, 4) Infrastructure overlap detection, 5) Victim correlation techniques, 6) Campaign evolution tracking, 7) Attribution validation methods. Include specific detection approaches for each element.",
  "successCriteria": "Campaign detection criteria including indicator thresholds and validation methods",
  "estimatedEffort": "Time estimate based on campaign complexity and scope",
  "huntQueries": ["Specific queries targeting campaign indicators, infrastructure, and attack patterns"],
  "investigationSteps": ["Step-by-step investigation process for suspected campaign activity"],
  "expectedFindings": "Expected evidence patterns and indicators specific to this campaign",
  "mitreTactics": ["MITRE ATT&CK tactics used in this campaign"],
  "mitreTechniques": ["Specific techniques documented for this campaign"],
  "threatsDetected": ["Types of attacks and objectives this campaign hunt addresses"],
  "coverageGaps": "Analysis of campaign aspects this hunt might miss",
  "confidence": 1-100
}

CRITICAL REQUIREMENTS:
1. Your response must be ONLY valid JSON
2. Focus on campaign-specific patterns and objectives
3. Consider campaign timeline and evolution
4. huntingPlan must be comprehensive (minimum 500 characters)

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:`;

    const response = await aiGenerationService.generateResponse({
      prompt,
      organizationId
    });

    const analysis = response.content || response.response;
    const processingTime = Date.now() - startTime;

    // Parse response
    let aiSuggestions;
    try {
      if (typeof analysis === 'string') {
        let cleanedAnalysis = analysis.trim();
        if (cleanedAnalysis.startsWith('```json')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedAnalysis.startsWith('```')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiSuggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON structure found');
        }
      } else {
        aiSuggestions = analysis;
      }
    } catch (parseError) {
      throw new Error(`AI threat hunt generation failed - unable to parse response: ${parseError.message}`);
    }

    const huntSuggestions = {
      title: aiSuggestions.title || `Campaign Hunt: ${campaign.name}`,
      description: aiSuggestions.description || `Hunt for threat campaign: ${campaign.name}`,
      priority: aiSuggestions.priority || campaign.severity,
      category: aiSuggestions.category || 'campaign_hunt',
      huntType: aiSuggestions.huntType || 'proactive',
      huntingPlan: aiSuggestions.huntingPlan || 'Comprehensive campaign hunting strategy',
      successCriteria: aiSuggestions.successCriteria || 'Detection of campaign-specific activity patterns',
      estimatedEffort: aiSuggestions.estimatedEffort || '3-6 hours',
      huntQueries: aiSuggestions.huntQueries || [`Hunt for ${campaign.name} indicators`],
      investigationSteps: aiSuggestions.investigationSteps || ['Analyze campaign patterns', 'Validate indicators', 'Assess scope'],
      expectedFindings: aiSuggestions.expectedFindings || 'Campaign-specific indicators and attack patterns',
      mitreTactics: aiSuggestions.mitreTactics || campaign.techniques || [],
      mitreTechniques: aiSuggestions.mitreTechniques || [],
      threatsDetected: aiSuggestions.threatsDetected || ['Campaign activity', 'Targeted attacks'],
      coverageGaps: aiSuggestions.coverageGaps || 'Campaign may have evolved beyond current indicators',
      confidence: aiSuggestions.confidence || 75
    };

    await aiAgentLogService.logAgentActivity({
      agentName: 'Threat Intelligence Hunt Generator',
      taskName: 'generate threat hunt from campaign',
      description: `Generated threat hunt for campaign: ${campaign.name} with ${huntSuggestions.confidence}% confidence`,
      executionTimeMs: processingTime,
      success: true,
      userId: req.user.id,
      organizationId,
      metadata: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        severity: campaign.severity,
        huntCategory: huntSuggestions.category
      }
    });

    res.json({
      success: true,
      suggestions: huntSuggestions,
      processingTime: processingTime,
      sourceCampaign: {
        id: campaign.id,
        name: campaign.name,
        severity: campaign.severity
      }
    });

  } catch (error) {
    console.error('AI Campaign hunt generation failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    await aiAgentLogService.logAgentActivity({
      agentName: 'Threat Intelligence Hunt Generator',
      taskName: 'generate threat hunt from campaign',
      description: `Failed to generate hunt from campaign: ${campaign.name}`,
      executionTimeMs: processingTime,
      success: false,
      errorMessage: error.message,
      userId: req.user.id,
      organizationId
    });

    res.status(500).json({
      success: false,
      error: error.message || 'AI threat hunt generation failed'
    });
  }
});

/**
 * Generate fallback hunt suggestions when AI parsing fails
 */
const generateFallbackHuntSuggestions = (ioc, parseError) => {
  console.log('🆘 Creating fallback hunt suggestions for IOC:', ioc.value);
  
  const iocTypeMap = {
    'ip': {
      category: 'network_hunt',
      title: 'Network IP Threat Hunt',
      description: `Proactive hunt for suspicious activity from IP address ${ioc.value}`,
      huntQueries: [
        `source_ip:"${ioc.value}" OR destination_ip:"${ioc.value}"`,
        `ip_address:"${ioc.value}" AND (event_type:network OR event_type:connection)`
      ],
      mitreTactics: ['Initial Access', 'Command and Control'],
      threatsDetected: ['Malicious IP Communication', 'C2 Traffic', 'Data Exfiltration']
    },
    'domain': {
      category: 'network_hunt',
      title: 'Domain Threat Hunt',
      description: `Proactive hunt for connections to suspicious domain ${ioc.value}`,
      huntQueries: [
        `domain:"${ioc.value}" OR hostname:"${ioc.value}"`,
        `dns_query:"${ioc.value}" OR http_host:"${ioc.value}"`
      ],
      mitreTactics: ['Command and Control', 'Exfiltration'],
      threatsDetected: ['Malicious Domain Communication', 'DNS Tunneling', 'C2 Beaconing']
    },
    'file_hash': {
      category: 'malware_hunt',
      title: 'File Hash Malware Hunt',
      description: `Hunt for malicious file with hash ${ioc.value}`,
      huntQueries: [
        `file_hash:"${ioc.value}" OR md5:"${ioc.value}" OR sha1:"${ioc.value}" OR sha256:"${ioc.value}"`,
        `process_hash:"${ioc.value}" OR image_hash:"${ioc.value}"`
      ],
      mitreTactics: ['Execution', 'Defense Evasion'],
      threatsDetected: ['Malware Execution', 'File-based Threats', 'Process Injection']
    },
    'url': {
      category: 'network_hunt',
      title: 'URL Threat Hunt',
      description: `Hunt for connections to suspicious URL ${ioc.value}`,
      huntQueries: [
        `url:"${ioc.value}" OR uri:"${ioc.value}"`,
        `http_request:"${ioc.value}" OR web_request:"${ioc.value}"`
      ],
      mitreTactics: ['Initial Access', 'Command and Control'],
      threatsDetected: ['Malicious URL Access', 'Web-based Threats', 'Drive-by Downloads']
    },
    'email': {
      category: 'behavioral_hunt',
      title: 'Email Threat Hunt',
      description: `Hunt for suspicious email activity from ${ioc.value}`,
      huntQueries: [
        `sender:"${ioc.value}" OR from_address:"${ioc.value}"`,
        `email_address:"${ioc.value}" OR reply_to:"${ioc.value}"`
      ],
      mitreTactics: ['Initial Access', 'Collection'],
      threatsDetected: ['Phishing Campaigns', 'Email-based Threats', 'Social Engineering']
    }
  };

  const fallbackData = iocTypeMap[ioc.type] || iocTypeMap['ip']; // Default to IP hunt

  return {
    title: fallbackData.title,
    description: fallbackData.description,
    priority: ioc.severity || 3,
    category: fallbackData.category,
    huntType: 'proactive',
    huntingPlan: `Systematic hunt for ${ioc.type} indicator ${ioc.value}:
1. Data Source Analysis: Query SIEM, EDR, network logs, and security tools
2. Pattern Recognition: Look for related indicators and suspicious patterns  
3. Timeline Analysis: Analyze activity timelines around IOC appearances
4. Correlation: Cross-reference with known threat intelligence
5. Scope Assessment: Determine extent of potential compromise
6. Documentation: Record findings and evidence for investigation
7. Remediation: Implement appropriate containment measures if threats found

Note: This hunt was generated using fallback logic due to AI parsing error: ${parseError.message}`,
    successCriteria: 'Successfully query all relevant data sources, identify any instances of the IOC, and determine threat scope',
    estimatedEffort: '2-4 hours depending on environment complexity',
    huntQueries: fallbackData.huntQueries,
    investigationSteps: [
      'Execute hunt queries across all security tools',
      'Analyze results for IOC presence and related activity',
      'Correlate findings with threat intelligence feeds',
      'Assess potential impact and scope',
      'Document evidence and create incident if threats found',
      'Update IOC status and threat context'
    ],
    expectedFindings: `Detection of ${ioc.value} in logs, network traffic, or security events with associated threat context`,
    mitreTactics: fallbackData.mitreTactics,
    mitreTechniques: ioc.mitreAttack || [],
    threatsDetected: fallbackData.threatsDetected,
    coverageGaps: 'This fallback hunt may not cover all advanced evasion techniques. Consider manual analysis for complex threats.',
    confidence: 75, // Lower confidence for fallback
    _fallback: true,
    _fallbackReason: parseError.message
  };
};

module.exports = {
  getThreatActors,
  getThreatCampaigns,
  getThreatIntelStats,
  getThreatActor,
  getThreatCampaign,
  aiGenerateIOCHunt,
  aiGenerateThreatActorHunt,
  aiGenerateCampaignHunt,
  createThreatActorHelper,
  createThreatActorBulkHelper,
  createThreatCampaignHelper,
  createThreatCampaignBulkHelper,
};