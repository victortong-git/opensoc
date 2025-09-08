const { Op, fn, col, literal } = require('sequelize');
const ThreatHunt = require('../database/models/ThreatHuntingEvent'); // This exports as ThreatHunt but is the correct model
const ThreatHuntTTP = require('../database/models/ThreatHuntTTP');
const ThreatHuntReport = require('../database/models/ThreatHuntReport');
const ThreatHuntMitreEnhancement = require('../database/models/ThreatHuntMitreEnhancement');
const aiGenerationService = require('../services/aiGenerationService');
const toolExecutor = require('../tools/common/toolExecutor');
const gptOssService = require('../tools/common/gptOssService');

// Import other models as needed
const User = require('../database/models/User');
const Organization = require('../database/models/Organization');

/**
 * Professional Threat Hunt Types with descriptions
 */
const HUNT_TYPES = {
  'proactive_exploration': {
    name: 'Proactive Exploration',
    description: 'Open-ended threat discovery and environment exploration'
  },
  'hypothesis_driven': {
    name: 'Hypothesis-Driven Hunt',
    description: 'Specific threat hypothesis testing with measurable outcomes'
  },
  'intel_driven': {
    name: 'Intelligence-Driven Hunt', 
    description: 'Hunt based on external threat intelligence feeds and IOCs'
  },
  'behavioral_analysis': {
    name: 'Behavioral Analysis Hunt',
    description: 'User and system behavior anomaly hunting and analysis'
  },
  'infrastructure_hunt': {
    name: 'Infrastructure Hunt',
    description: 'Network and system-focused threat hunting activities'
  },
  'campaign_tracking': {
    name: 'Campaign Tracking',
    description: 'APT campaign identification and attribution hunting'
  },
  'threat_reaction': {
    name: 'Threat Reaction Hunt',
    description: 'Reactive hunting in response to specific threat indicators'
  },
  'compliance_hunt': {
    name: 'Compliance Hunt',
    description: 'Regulatory compliance verification and audit support'
  },
  'red_team_verification': {
    name: 'Red Team Verification',
    description: 'Validation of detection capabilities and security controls'
  },
  'threat_landscape': {
    name: 'Threat Landscape Assessment',
    description: 'Industry or sector-specific threat landscape analysis'
  }
};

const mitreValidationService = require('../services/mitreValidationService');

/**
 * Validate and filter MITRE technique IDs from AI response using database
 * Removes technique IDs that don't exist in our MITRE database
 */
async function validateAndFilterMitreTechniques(aiResponse) {
  try {
    // Use the database-driven validation service
    const validation = await mitreValidationService.filterInvalidTechniques(aiResponse);

    if (validation.filterCount > 0) {
      console.warn(`🔍 MITRE Database Validation: Filtered ${validation.filterCount} invalid technique IDs: ${validation.invalidTechniques.slice(0, 10).join(', ')}${validation.invalidTechniques.length > 10 ? '...' : ''}`);
    }

    if (validation.validTechniques.length > 0) {
      console.log(`✅ MITRE Validation: ${validation.validTechniques.length} valid techniques found: ${validation.validTechniques.slice(0, 10).join(', ')}${validation.validTechniques.length > 10 ? '...' : ''}`);
    }

    return {
      cleanedAnalysis: validation.cleanedResponse,
      invalidTechniques: validation.invalidTechniques,
      validTechniques: validation.validTechniques,
      totalFiltered: validation.filterCount,
      validationErrors: validation.errors || []
    };

  } catch (error) {
    console.error('Database validation failed, using fallback validation:', error.message);
    
    // Fallback to basic format validation if database is unavailable
    const techniqueIds = mitreValidationService.extractTechniqueIds(aiResponse);
    const validTechniques = techniqueIds.filter(id => mitreValidationService.isValidFormat(id));
    const invalidTechniques = techniqueIds.filter(id => !mitreValidationService.isValidFormat(id));

    // Clean response with format-only validation
    let cleanedAnalysis = aiResponse;
    invalidTechniques.forEach(invalidId => {
      const regex = new RegExp(`\\b${invalidId.replace('.', '\\.')}\\b`, 'g');
      cleanedAnalysis = cleanedAnalysis.replace(regex, `[INVALID_FORMAT_REMOVED: ${invalidId}]`);
    });

    if (invalidTechniques.length > 0) {
      cleanedAnalysis += `\n\n**Fallback Note:** ${invalidTechniques.length} technique IDs with invalid format were filtered. Database validation was unavailable.`;
    }

    return {
      cleanedAnalysis,
      invalidTechniques,
      validTechniques,
      totalFiltered: invalidTechniques.length,
      validationErrors: [`Database validation failed: ${error.message}`]
    };
  }
}

// === CORE HUNT MANAGEMENT ===

/**
 * Get all threat hunts with professional filtering and pagination
 */
const getThreatHunts = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      page = 1,
      limit = 25,
      search = '',
      status = '',
      priority = '',
      huntType = '',
      hunterId = '',
      sourceIntelType = '',
      aiEnhanced = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build comprehensive where clause
    const whereClause = {
      organizationId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(huntType && { huntType }),
      ...(hunterId && { hunterId }),
      ...(sourceIntelType && { sourceIntelType }),
      ...(aiEnhanced !== '' && { aiEnhanced: aiEnhanced === 'true' }),
    };

    // Enhanced search across multiple fields
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { hypothesis: { [Op.iLike]: `%${search}%` } },
        { scope: { [Op.iLike]: `%${search}%` } },
        { methodology: { [Op.iLike]: `%${search}%` } },
        { businessJustification: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Date range filtering
    if (startDate || endDate) {
      if (startDate && endDate) {
        // Filter by hunt execution dates if both provided
        whereClause[Op.and] = [
          ...(whereClause[Op.and] || []),
          {
            [Op.or]: [
              {
                [Op.and]: [
                  { startDate: { [Op.gte]: new Date(startDate) } },
                  { startDate: { [Op.lte]: new Date(endDate) } }
                ]
              },
              {
                [Op.and]: [
                  { endDate: { [Op.gte]: new Date(startDate) } },
                  { endDate: { [Op.lte]: new Date(endDate) } }
                ]
              }
            ]
          }
        ];
      } else {
        // Filter by creation date if only one date provided
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        }
      }
    }

    // Count total records
    const totalItems = await ThreatHunt.count({
      where: whereClause,
    });

    // Get paginated results with associations
    const hunts = await ThreatHunt.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      data: hunts.map(hunt => ({
        ...hunt.toJSON(),
        huntTypeDetails: HUNT_TYPES[hunt.huntType] || null,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching threat hunts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threat hunts',
      error: error.message,
    });
  }
};

/**
 * Get single threat hunt by ID with full details
 */
const getThreatHuntById = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const hunt = await ThreatHunt.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        }
      ],
    });

    if (!hunt) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...hunt.toJSON(),
        huntTypeDetails: HUNT_TYPES[hunt.huntType] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching threat hunt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threat hunt',
      error: error.message,
    });
  }
};

/**
 * Create new threat hunt with professional validation
 */
const createThreatHunt = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;
    const huntData = {
      ...req.body,
      organizationId,
      hunterId: req.body.hunterId || userId,
    };

    // Enhanced validation for professional fields
    if (!huntData.name || !huntData.description || !huntData.scope) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and scope are required',
      });
    }

    // Validate hunt type
    if (huntData.huntType && !HUNT_TYPES[huntData.huntType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hunt type provided',
        availableTypes: Object.keys(HUNT_TYPES),
      });
    }

    const hunt = await ThreatHunt.create(huntData);

    // Fetch the created hunt with associations
    const createdHunt = await ThreatHunt.findOne({
      where: { id: hunt.id },
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Threat hunt created successfully',
      data: {
        ...createdHunt.toJSON(),
        huntTypeDetails: HUNT_TYPES[createdHunt.huntType] || null,
      },
    });
  } catch (error) {
    console.error('Error creating threat hunt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create threat hunt',
      error: error.message,
    });
  }
};

/**
 * Update existing threat hunt
 */
const updateThreatHunt = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.organizationId;
    delete updateData.createdAt;

    // Validate hunt type if provided
    if (updateData.huntType && !HUNT_TYPES[updateData.huntType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hunt type provided',
        availableTypes: Object.keys(HUNT_TYPES),
      });
    }

    // Transform structured data fields to strings for database storage
    const fieldsToTransform = [
      'methodology', 
      'successCriteria', 
      'businessJustification', 
      'hypothesis',
      'scope',
      'targetSystems',
      'description'
    ];
    
    fieldsToTransform.forEach(field => {
      if (updateData[field] && typeof updateData[field] !== 'string') {
        if (Array.isArray(updateData[field])) {
          // Convert arrays to formatted text
          updateData[field] = updateData[field].map((item, index) => 
            typeof item === 'object' ? JSON.stringify(item, null, 2) : `${index + 1}. ${item}`
          ).join('\n\n');
        } else if (typeof updateData[field] === 'object') {
          // Convert objects to JSON string
          updateData[field] = JSON.stringify(updateData[field], null, 2);
        }
        
        console.log(`✅ Transformed ${field} from ${typeof req.body[field]} to string (length: ${updateData[field].length})`);
      }
    });

    const [updatedCount] = await ThreatHunt.update(updateData, {
      where: { id, organizationId },
      returning: true,
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found',
      });
    }

    // Fetch updated hunt with associations
    const updatedHunt = await ThreatHunt.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Threat hunt updated successfully',
      data: {
        ...updatedHunt.toJSON(),
        huntTypeDetails: HUNT_TYPES[updatedHunt.huntType] || null,
      },
    });
  } catch (error) {
    console.error('Error updating threat hunt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update threat hunt',
      error: error.message,
    });
  }
};

/**
 * Delete threat hunt (cascade to TTPs and reports)
 */
const deleteThreatHunt = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const deletedCount = await ThreatHunt.destroy({
      where: { id, organizationId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found',
      });
    }

    res.json({
      success: true,
      message: 'Threat hunt deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting threat hunt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete threat hunt',
      error: error.message,
    });
  }
};

/**
 * Get professional threat hunting dashboard statistics
 */
const getThreatHuntingStats = async (req, res) => {
  try {
    const { organizationId } = req.user;

    // Basic counts with new status including 'on_hold'
    const [
      totalHunts,
      plannedHunts,
      inProgressHunts,
      completedHunts,
      cancelledHunts,
      onHoldHunts,
      highPriorityHunts,
      criticalPriorityHunts,
      aiEnhancedHunts,
      intelDrivenHunts,
    ] = await Promise.all([
      ThreatHunt.count({ where: { organizationId } }),
      ThreatHunt.count({ where: { organizationId, status: 'planned' } }),
      ThreatHunt.count({ where: { organizationId, status: 'in_progress' } }),
      ThreatHunt.count({ where: { organizationId, status: 'completed' } }),
      ThreatHunt.count({ where: { organizationId, status: 'cancelled' } }),
      ThreatHunt.count({ where: { organizationId, status: 'on_hold' } }),
      ThreatHunt.count({ where: { organizationId, priority: 'high' } }),
      ThreatHunt.count({ where: { organizationId, priority: 'critical' } }),
      ThreatHunt.count({ where: { organizationId, aiEnhanced: true } }),
      ThreatHunt.count({ 
        where: { 
          organizationId, 
          sourceIntelType: { [Op.ne]: null } 
        } 
      }),
    ]);

    // Get hunt type distribution with professional types
    const huntTypeStats = await ThreatHunt.findAll({
      where: { organizationId },
      attributes: [
        'huntType',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['huntType'],
      raw: true,
    });

    // Enhanced hunt type distribution with names
    const huntTypeDistribution = huntTypeStats.reduce((acc, stat) => {
      const typeInfo = HUNT_TYPES[stat.huntType] || { name: stat.huntType };
      acc[stat.huntType] = {
        count: parseInt(stat.count),
        name: typeInfo.name,
        description: typeInfo.description,
      };
      return acc;
    }, {});

    // Recent completed hunts
    const recentCompletedHunts = await ThreatHunt.findAll({
      where: { organizationId, status: 'completed' },
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['endDate', 'DESC']],
      limit: 5,
    });

    // Top hunters by activity
    const topHuntersRaw = await ThreatHunt.findAll({
      where: { organizationId, hunterId: { [Op.ne]: null } },
      attributes: [
        'hunterId',
        [fn('COUNT', col('id')), 'huntCount'],
      ],
      group: ['hunterId'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Get user details for top hunters
    const topHunters = [];
    for (const hunterStat of topHuntersRaw) {
      const hunter = await User.findByPk(hunterStat.hunterId, {
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });
      if (hunter) {
        topHunters.push({
          hunter,
          huntCount: parseInt(hunterStat.huntCount),
        });
      }
    }

    // Calculate average duration for completed hunts
    const completedHuntsWithDuration = await ThreatHunt.findAll({
      where: { 
        organizationId, 
        status: 'completed',
        startDate: { [Op.ne]: null },
        endDate: { [Op.ne]: null },
      },
      attributes: ['startDate', 'endDate'],
    });

    let averageDurationDays = 0;
    if (completedHuntsWithDuration.length > 0) {
      const totalDays = completedHuntsWithDuration.reduce((sum, hunt) => {
        const days = (new Date(hunt.endDate) - new Date(hunt.startDate)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageDurationDays = Math.round((totalDays / completedHuntsWithDuration.length) * 10) / 10;
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalHunts,
          plannedHunts,
          inProgressHunts,
          completedHunts,
          cancelledHunts,
          onHoldHunts,
          highPriorityHunts,
          criticalPriorityHunts,
          aiEnhancedHunts,
          intelDrivenHunts,
          averageDurationDays,
        },
        huntTypeDistribution,
        recentCompletedHunts: recentCompletedHunts.map(hunt => ({
          ...hunt.toJSON(),
          huntTypeDetails: HUNT_TYPES[hunt.huntType] || null,
        })),
        topHunters,
      },
    });
  } catch (error) {
    console.error('Error fetching threat hunting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threat hunting statistics',
      error: error.message,
    });
  }
};

/**
 * Get available hunt types for selection
 */
const getHuntTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      data: HUNT_TYPES,
    });
  } catch (error) {
    console.error('Error fetching hunt types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hunt types',
      error: error.message,
    });
  }
};

/**
 * Clone existing threat hunt
 */
const cloneThreatHunt = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;
    const { id } = req.params;

    const originalHunt = await ThreatHunt.findOne({
      where: { id, organizationId },
    });

    if (!originalHunt) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found',
      });
    }

    // Prepare data for cloning (reset execution-specific fields)
    const cloneData = {
      ...originalHunt.toJSON(),
      id: undefined, // Remove ID to create new record
      name: `${originalHunt.name} (Copy)`,
      status: 'planned',
      hunterId: userId, // Set current user as hunter
      startDate: null,
      endDate: null,
      findings: null,
      recommendations: null,
      evidence: null,
      lessonsLearned: null,
      aiEnhanced: false,
      aiEnhancementSections: [],
      createdAt: undefined,
      updatedAt: undefined,
    };

    const clonedHunt = await ThreatHunt.create(cloneData);

    // Fetch the cloned hunt with associations
    const createdHunt = await ThreatHunt.findOne({
      where: { id: clonedHunt.id },
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Threat hunt cloned successfully',
      data: {
        ...createdHunt.toJSON(),
        huntTypeDetails: HUNT_TYPES[createdHunt.huntType] || null,
      },
    });
  } catch (error) {
    console.error('Error cloning threat hunt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clone threat hunt',
      error: error.message,
    });
  }
};

// === TTP MANAGEMENT ===

/**
 * Add TTPs to a threat hunt
 */
const addHuntTTPs = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { huntId } = req.params;
    const { ttps } = req.body;

    // Verify hunt exists and belongs to organization
    const hunt = await ThreatHunt.findOne({
      where: { id: huntId, organizationId }
    });

    if (!hunt) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found',
      });
    }

    // Create TTPs with organizationId
    const ttpData = ttps.map(ttp => ({
      ...ttp,
      threatHuntId: huntId,
      organizationId,
    }));

    const createdTTPs = await ThreatHuntTTP.bulkCreate(ttpData);

    res.status(201).json({
      success: true,
      message: `Added ${createdTTPs.length} TTPs to threat hunt`,
      data: createdTTPs,
    });
  } catch (error) {
    console.error('Error adding hunt TTPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add TTPs to hunt',
      error: error.message,
    });
  }
};

/**
 * Get TTPs for a specific hunt
 */
const getHuntTTPs = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { huntId } = req.params;

    const ttps = await ThreatHuntTTP.findAll({
      where: { threatHuntId: huntId, organizationId },
      order: [['tacticId', 'ASC'], ['techniqueId', 'ASC']],
    });

    res.json({
      success: true,
      data: ttps,
    });
  } catch (error) {
    console.error('Error fetching hunt TTPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hunt TTPs',
      error: error.message,
    });
  }
};

// === REPORT MANAGEMENT ===

/**
 * Generate professional threat hunt report
 */
const generateHuntReport = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;
    const { huntId } = req.params;
    const { reportType = 'comprehensive', ...reportData } = req.body;

    // Verify hunt exists and belongs to organization
    const hunt = await ThreatHunt.findOne({
      where: { id: huntId, organizationId },
      include: [
        {
          model: ThreatHuntTTP,
          as: 'ttps',
        }
      ]
    });

    if (!hunt) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found',
      });
    }

    // Create professional report
    const report = await ThreatHuntReport.create({
      ...reportData,
      threatHuntId: huntId,
      reportType,
      reportTitle: reportData.reportTitle || `${hunt.name} - ${reportType.replace('_', ' ').toUpperCase()} Report`,
      generatedBy: userId,
      organizationId,
    });

    res.status(201).json({
      success: true,
      message: 'Threat hunt report generated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error generating hunt report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate hunt report',
      error: error.message,
    });
  }
};

/**
 * Get reports for a specific hunt
 */
const getHuntReports = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { huntId } = req.params;

    const reports = await ThreatHuntReport.findAll({
      where: { threatHuntId: huntId, organizationId },
      include: [
        {
          model: User,
          as: 'generatedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching hunt reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hunt reports',
      error: error.message,
    });
  }
};

// === ENHANCED AI FUNCTIONS ===

/**
 * AI-powered hunt content enhancement (simplified for new schema)
 */
const enhanceThreatHuntContent = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;
    const { id: huntId } = req.params;
    const { section, currentContent, context } = req.body;

    if (!section || !currentContent) {
      return res.status(400).json({
        success: false,
        message: 'Section and current content are required',
      });
    }

    // Handle placeholder ID for new hunt generation
    const isPlaceholder = huntId === 'ai-generation-placeholder-id';
    let hunt = null;

    if (!isPlaceholder) {
      hunt = await ThreatHunt.findOne({
        where: { id: huntId, organizationId }
      });

      if (!hunt) {
        return res.status(404).json({
          success: false,
          message: 'Threat hunt not found'
        });
      }
    }

    // Enhanced AI content generation based on context
    let enhancedContent;
    
    if (isPlaceholder && context?.generationType === 'full_hunt_from_intel') {
      // Generate full hunt content from threat intelligence using real AI
      const sourceData = context.sourceIntel;
      const sourceType = sourceData?.type || 'unknown';
      const data = sourceData?.data || {};
      
      // Create comprehensive AI prompt for threat hunt generation
      const aiPrompt = createThreatHuntGenerationPrompt(sourceType, data, currentContent, context);
      
      try {
        console.log('🤖 Calling AI service for threat hunt generation...');
        const aiResponse = await aiGenerationService.generateResponse({
          prompt: aiPrompt,
          organizationId,
          model: 'gpt-oss:20b', // Use configured model
          maxTokens: 3000,
          temperature: 0.7
        });
        
        const aiContent = aiResponse.content || aiResponse.response;
        console.log('✅ AI response received, parsing content...');
        
        // Parse AI response into structured format
        enhancedContent = parseAIHuntResponse(aiContent, sourceType, data);
        
        // Validate that we got structured AI content
        if (enhancedContent && enhancedContent.name && enhancedContent.description) {
          console.log('✅ Structured AI content generated successfully');
          console.log('📝 Generated hunt name:', enhancedContent.name);
          console.log('📄 Generated description length:', enhancedContent.description.length);
        } else {
          console.error('❌ AI parsing failed - missing required structured content');
          throw new Error('AI response parsing failed - no valid structured content received');
        }
        
      } catch (aiError) {
        console.error('❌ AI generation failed:', aiError.message);
        throw new Error(`AI enhancement failed: ${aiError.message}`);
      }
    } else {
      // Standard AI enhancement for existing content - use structured generation
      try {
        const enhancementPrompt = `Please enhance the following threat hunting data with professional improvements. Return a structured JSON response with individual fields:

Current Hunt Data:
${currentContent}

Please provide a structured JSON response with the following fields:
{
  "name": "Enhanced hunt name",
  "description": "Enhanced description with professional details",
  "hypothesis": "Enhanced hypothesis with specific indicators",
  "methodology": "Enhanced methodology with step-by-step approach",
  "scope": "Enhanced scope with clear boundaries",
  "successCriteria": "Enhanced success criteria with measurable outcomes", 
  "businessJustification": "Enhanced business justification",
  "timeframe": "Enhanced timeframe if applicable"
}

Make the content more detailed, professional, and actionable for security analysts.`;

        const aiResponse = await aiGenerationService.generateResponse({
          prompt: enhancementPrompt,
          organizationId,
          maxTokens: 2500,
          temperature: 0.6
        });

        // Try to parse the structured AI response
        const aiContent = aiResponse.content || aiResponse.response;
        console.log('🤖 Raw AI response for parsing:', aiContent.substring(0, 200) + '...');

        try {
          // Extract JSON from the AI response
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON structure found in AI response');
          }

          const parsedContent = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed structured AI enhancement');

          enhancedContent = {
            name: parsedContent.name || null,
            description: parsedContent.description || null,
            hypothesis: parsedContent.hypothesis || null,
            methodology: parsedContent.methodology || null,
            scope: parsedContent.scope || null,
            successCriteria: parsedContent.successCriteria || null,
            businessJustification: parsedContent.businessJustification || null,
            timeframe: parsedContent.timeframe || null,
            suggestions: [
              'Consider adding more specific indicators',
              'Include timeline requirements',
              'Add validation criteria',
              'Document evidence collection process'
            ],
            additionalResources: [
              'MITRE ATT&CK Framework',
              'Industry threat reports',
              'Historical incident data',
              'Threat intelligence feeds'
            ]
          };

        } catch (parseError) {
          console.error('❌ Failed to parse structured AI response:', parseError.message);
          console.log('📄 Falling back to simple enhancement format');
          
          // Fallback to simple enhancement if structured parsing fails
          enhancedContent = {
            enhancedContent: aiContent,
            suggestions: ['Consider adding more specific indicators', 'Include timeline requirements'],
            additionalResources: ['MITRE ATT&CK Framework', 'Industry threat reports']
          };
        }

      } catch (aiError) {
        console.error('❌ AI enhancement failed:', aiError.message);
        throw new Error(`AI enhancement failed: ${aiError.message}`);
      }
    }

    // Update existing hunt to mark as AI enhanced (skip for placeholder)
    if (!isPlaceholder && hunt) {
      await ThreatHunt.update(
        { 
          aiEnhanced: true,
          aiEnhancementSections: hunt.aiEnhancementSections.includes(section) 
            ? hunt.aiEnhancementSections 
            : [...hunt.aiEnhancementSections, section]
        },
        { where: { id: huntId, organizationId } }
      );
    }

    res.json({
      success: true,
      enhancement: enhancedContent,
      section,
      huntId: isPlaceholder ? 'generated' : hunt.id
    });

  } catch (error) {
    console.error('AI content enhancement failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI content enhancement failed'
    });
  }
};

// AI Helper functions for threat hunt generation
function createThreatHuntGenerationPrompt(sourceType, data, currentContent, context) {
  const basePrompt = `As a senior cybersecurity threat hunting expert, generate specific and actionable threat hunt content. Focus on creating practical, technical guidance that security analysts can immediately implement.`;
  
  let intelligenceContext = '';
  let huntingGuidance = '';
  
  switch (sourceType) {
    case 'ioc':
      intelligenceContext = `
THREAT INTELLIGENCE CONTEXT:
- Indicator: ${data.value || 'Unknown'}
- IOC Type: ${data.type || 'Unknown'}  
- Description: ${data.description || 'No description available'}
- Confidence Level: ${data.confidence || 'Unknown'}
- Severity: ${data.severity || 'Unknown'}/5
- Source: ${data.source || 'Unknown'}
- First Seen: ${data.firstSeen || 'Unknown'}
- Last Seen: ${data.lastSeen || 'Unknown'}
- Related Campaign: ${data.relatedCampaign || 'None identified'}
- MITRE ATT&CK Techniques: ${data.mitreAttack?.join(', ') || 'None mapped'}
- Tags: ${data.tags?.join(', ') || 'None'}`;

      // Add specific hunting guidance based on IOC type
      switch (data.type) {
        case 'registry_key':
          huntingGuidance = `
REGISTRY KEY HUNTING STRATEGY:
- Focus on Windows endpoint monitoring and registry access logs
- Look for persistence mechanisms and autostart locations
- Monitor for registry modifications and unauthorized changes
- Correlate with process creation and file system events
- Check for related malware families using similar registry persistence`;
          break;
        case 'file_hash':
          huntingGuidance = `
FILE HASH HUNTING STRATEGY:
- Search across file system monitoring logs and SIEM data
- Look for file execution events, downloads, and transfers
- Monitor process creation with matching file hashes
- Check for file writes, renames, and lateral movement
- Investigate parent processes and execution chains`;
          break;
        case 'ip':
          huntingGuidance = `
IP ADDRESS HUNTING STRATEGY:
- Analyze network traffic logs and connection data
- Look for outbound connections and data exfiltration
- Monitor DNS queries and domain resolution patterns
- Check for command and control communication patterns
- Investigate related IP addresses and ASN blocks`;
          break;
        case 'domain':
          huntingGuidance = `
DOMAIN HUNTING STRATEGY:
- Search DNS logs and web proxy data
- Look for domain generation algorithms (DGA) patterns
- Monitor HTTP/HTTPS traffic to the domain
- Check for subdomain enumeration and DNS tunneling
- Investigate domain reputation and registration details`;
          break;
        default:
          huntingGuidance = `
GENERAL IOC HUNTING STRATEGY:
- Focus on data sources most relevant to this IOC type
- Look for behavioral patterns and anomalies
- Monitor for related indicators and threat actor TTPs
- Correlate across multiple security tools and data sources`;
      }
      break;
      
    case 'threat_actor':
      intelligenceContext = `
THREAT ACTOR INTELLIGENCE:
- Actor Name: ${data.name || 'Unknown'}
- Aliases: ${data.aliases?.join(', ') || 'None known'}
- Description: ${data.description || 'No description available'}
- Sophistication: ${data.sophistication || 'Unknown'}
- Origin: ${data.origin || 'Unknown'}
- Target Sectors: ${data.targetSectors?.join(', ') || 'Unknown'}
- Known Campaigns: ${data.campaigns?.join(', ') || 'None identified'}
- TTPs: ${data.techniques?.join(', ') || 'None documented'}
- First Observed: ${data.firstSeen || 'Unknown'}
- Last Activity: ${data.lastSeen || 'Unknown'}`;
      
      huntingGuidance = `
THREAT ACTOR HUNTING STRATEGY:
- Focus on known TTPs and behavioral patterns
- Look for campaign infrastructure and tools
- Monitor for target sector specific attacks
- Search for related IOCs and attack signatures
- Investigate timeline and attack progression patterns`;
      break;
      
    case 'campaign':
      intelligenceContext = `
CAMPAIGN INTELLIGENCE:
- Campaign Name: ${data.name || 'Unknown'}
- Description: ${data.description || 'No description available'}
- Attribution: ${data.threatActor || 'Unknown'}
- Campaign Severity: ${data.severity || 'Unknown'}/5
- Active Status: ${data.isActive ? 'Active' : 'Inactive'}
- Start Date: ${data.startDate || 'Unknown'}
- End Date: ${data.endDate || 'Ongoing'}
- Affected Assets: ${data.affectedAssets || 'Unknown'}
- Target Sectors: ${data.targetSectors?.join(', ') || 'Unknown'}
- Techniques Used: ${data.techniques?.join(', ') || 'None documented'}`;
      
      huntingGuidance = `
CAMPAIGN HUNTING STRATEGY:
- Focus on campaign-specific indicators and TTPs
- Look for multi-stage attack patterns
- Monitor for infrastructure reuse and commonalities
- Search for victim targeting patterns
- Investigate timeline correlation across multiple incidents`;
      break;
  }

  return `${basePrompt}

${intelligenceContext}

${huntingGuidance}

HUNT CONFIGURATION:
- Hunt Type: ${context.huntType || 'intel_driven'}
- Priority Level: ${context.priority || 'medium'}

TASK: Generate specific, actionable threat hunt content following this exact format. DO NOT use placeholder text or brackets. Provide real, specific content for each section:

HUNT_NAME: Create a specific hunt title that includes the actual indicator/threat being hunted (max 100 chars)

DESCRIPTION: Write a detailed 2-3 paragraph description that includes:
- The specific threat or indicator being investigated
- Why this hunt is important for the organization
- What security teams will learn from this investigation
- How this relates to the threat landscape

HYPOTHESIS: Formulate a clear, testable hypothesis that includes:
- Specific behaviors or artifacts you expect to find
- Technical indicators that would confirm the threat presence
- Environmental conditions that might indicate compromise

METHODOLOGY: Provide a detailed 5-phase hunting methodology:
Phase 1: Initial data collection and baseline establishment
Phase 2: Indicator correlation and pattern analysis  
Phase 3: Behavioral analysis and anomaly detection
Phase 4: Evidence validation and false positive elimination
Phase 5: Impact assessment and threat characterization

SCOPE: Define specific hunting scope including:
- Exact systems and networks to investigate (be specific about asset types)
- Specific data sources and log types to analyze
- Time windows for investigation (provide actual timeframes)
- Geographical or organizational boundaries

SUCCESS_CRITERIA: List 4-5 measurable success criteria such as:
- Specific detection rates or coverage metrics
- Evidence collection requirements
- Investigation completion timelines
- Threat confirmation or elimination criteria

BUSINESS_JUSTIFICATION: Provide professional business case including:
- Risk reduction impact and specific threat mitigation
- Compliance requirements and regulatory benefits  
- Cost of potential breach vs. investigation cost
- Organizational security posture improvement

CRITICAL REQUIREMENTS:
- Use the actual indicator value and specific details throughout
- Provide actionable technical guidance, not generic advice
- Include specific tools, queries, and investigation steps
- Make content immediately usable by security analysts
- Ensure all sections contain specific, non-generic information

Generate comprehensive threat hunting content now:`;
}

function parseAIHuntResponse(aiContent, sourceType, data) {
  console.log('🔍 Parsing AI response...');
  console.log('📄 AI content length:', aiContent.length);
  
  try {
    // Parse structured AI response - handle both plain text and markdown formats
    const sections = {};
    const lines = aiContent.split('\n');
    let currentSection = null;
    let currentContent = [];
    let sectionsFound = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for section headers in multiple formats
      // Plain text format: HUNT_NAME:
      // Markdown format: **HUNT_NAME** or ### HUNT_NAME
      
      if (trimmedLine.match(/^(\*\*)?HUNT_NAME(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*HUNT_NAME/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'name';
        // Extract content after the header
        let nameContent = trimmedLine.replace(/^(\*\*)?HUNT_NAME(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*HUNT_NAME\s*/i, '').trim();
        currentContent = nameContent ? [nameContent] : [];
        sectionsFound.push('HUNT_NAME');
      } else if (trimmedLine.match(/^(\*\*)?DESCRIPTION(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*DESCRIPTION/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'description';
        let descContent = trimmedLine.replace(/^(\*\*)?DESCRIPTION(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*DESCRIPTION\s*/i, '').trim();
        currentContent = descContent ? [descContent] : [];
        sectionsFound.push('DESCRIPTION');
      } else if (trimmedLine.match(/^(\*\*)?HYPOTHESIS(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*HYPOTHESIS/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'hypothesis';
        let hypContent = trimmedLine.replace(/^(\*\*)?HYPOTHESIS(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*HYPOTHESIS\s*/i, '').trim();
        currentContent = hypContent ? [hypContent] : [];
        sectionsFound.push('HYPOTHESIS');
      } else if (trimmedLine.match(/^(\*\*)?METHODOLOGY(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*METHODOLOGY/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'methodology';
        let methContent = trimmedLine.replace(/^(\*\*)?METHODOLOGY(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*METHODOLOGY\s*/i, '').trim();
        currentContent = methContent ? [methContent] : [];
        sectionsFound.push('METHODOLOGY');
      } else if (trimmedLine.match(/^(\*\*)?SCOPE(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*SCOPE/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'scope';
        let scopeContent = trimmedLine.replace(/^(\*\*)?SCOPE(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*SCOPE\s*/i, '').trim();
        currentContent = scopeContent ? [scopeContent] : [];
        sectionsFound.push('SCOPE');
      } else if (trimmedLine.match(/^(\*\*)?SUCCESS_CRITERIA(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*SUCCESS[_\s]*CRITERIA/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'successCriteria';
        let succContent = trimmedLine.replace(/^(\*\*)?SUCCESS_CRITERIA(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*SUCCESS[_\s]*CRITERIA\s*/i, '').trim();
        currentContent = succContent ? [succContent] : [];
        sectionsFound.push('SUCCESS_CRITERIA');
      } else if (trimmedLine.match(/^(\*\*)?BUSINESS_JUSTIFICATION(\*\*)?:?\s*/i) || trimmedLine.match(/^#{1,3}\s*BUSINESS[_\s]*JUSTIFICATION/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'businessJustification';
        let bizContent = trimmedLine.replace(/^(\*\*)?BUSINESS_JUSTIFICATION(\*\*)?:?\s*/i, '').replace(/^#{1,3}\s*BUSINESS[_\s]*JUSTIFICATION\s*/i, '').trim();
        currentContent = bizContent ? [bizContent] : [];
        sectionsFound.push('BUSINESS_JUSTIFICATION');
      } else if (trimmedLine && currentSection) {
        // Add content to current section, cleaning up markdown
        let cleanLine = line.replace(/^\*\*|\*\*$/g, '').replace(/^#{1,6}\s*/, '');
        currentContent.push(cleanLine);
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    console.log('📋 Sections found:', sectionsFound);
    console.log('🔍 Section details:', Object.keys(sections).map(key => `${key}: ${sections[key]?.substring(0, 50)}...`));
    console.log('✅ AI response parsed successfully');
    
    // Enhanced validation - check for meaningful content
    if (!sections.name || !sections.description) {
      console.error('❌ Missing required sections:', {
        hasName: !!sections.name,
        hasDescription: !!sections.description,
        hasMethodology: !!sections.methodology
      });
      throw new Error('AI response did not contain required threat hunt sections (name and description are mandatory)');
    }

    // Check for generic/placeholder content
    const genericIndicators = ['[', ']', 'placeholder', 'example', 'TODO', 'TBD'];
    const hasGenericContent = Object.values(sections).some(content => 
      genericIndicators.some(indicator => content?.toLowerCase().includes(indicator.toLowerCase()))
    );
    
    if (hasGenericContent) {
      console.warn('⚠️ AI response contains placeholder text - content may be generic');
    }
    
    return {
      name: sections.name || null,
      description: sections.description || null,
      hypothesis: sections.hypothesis || null,
      methodology: sections.methodology || null,
      scope: sections.scope || null,
      successCriteria: sections.successCriteria || null,
      businessJustification: sections.businessJustification || null,
      suggestions: [
        `Correlate with ${sourceType === 'ioc' ? 'similar IOCs' : 'related intelligence'}`,
        'Monitor for behavioral patterns and anomalies',
        'Set up continuous monitoring for threat evolution',
        'Document findings for future threat intelligence'
      ],
      additionalResources: [
        'MITRE ATT&CK Framework',
        'Cyber Threat Intelligence feeds',
        'Industry-specific threat reports',
        'Historical incident data'
      ]
    };
  } catch (parseError) {
    console.error('❌ Error parsing AI response:', parseError.message);
    console.error('📄 First 500 characters of AI response:', aiContent.substring(0, 500));
    throw new Error(`AI response parsing failed: ${parseError.message}`);
  }
}


// === BACKWARDS COMPATIBILITY ===
// Alias old method names for backwards compatibility during migration

const getThreatHuntingEvents = getThreatHunts;
const getThreatHuntingEventById = getThreatHuntById;
const createThreatHuntingEvent = createThreatHunt;
const updateThreatHuntingEvent = updateThreatHunt;
const deleteThreatHuntingEvent = deleteThreatHunt;
const cloneThreatHuntingEvent = cloneThreatHunt;

// === MITRE ATTACK ENHANCEMENT WITH TOOL CALLING ===

/**
 * Enhance threat hunt with MITRE ATTACK mapping using tool calling approach
 * Can handle both generating new enhancements and saving existing enhancement data
 */
const enhanceThreatHuntWithMitre = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;
    const { id: huntId } = req.params;
    const { enhancement, huntData, aiReasoningEffort, toolCallingEnabled } = req.body;

    console.log(`🎯 Starting MITRE enhancement for hunt ${huntId}`);

    // Check if this is a save request for existing enhancement data
    if (enhancement && enhancement.sessionId) {
      console.log('💾 Saving existing MITRE enhancement data to database...');
      return await saveMitreEnhancementData(req, res, huntId, organizationId, enhancement);
    }

    // This is a new AI enhancement request
    const hunt = await ThreatHunt.findOne({
      where: { id: huntId, organizationId },
      include: [
        {
          model: User,
          as: 'hunter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!hunt) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found'
      });
    }

    const startTime = Date.now();

    // Create comprehensive prompt for MITRE analysis with technique ID constraints
    const mitreAnalysisPrompt = `You are a cybersecurity expert specializing in MITRE ATT&CK framework analysis. 

Analyze this threat hunt and provide comprehensive MITRE ATT&CK mapping:

**Threat Hunt Details:**
- Name: ${hunt.name}
- Type: ${hunt.huntType}
- Description: ${hunt.description}
- Scope: ${hunt.scope}
- Hypothesis: ${hunt.hypothesis || 'Not specified'}
- Target Systems: ${hunt.targetSystems || 'Not specified'}
- Methodology: ${hunt.methodology || 'Not specified'}

**Enhancement Request:**
${enhancement || 'Provide comprehensive MITRE ATT&CK mapping and analysis'}

**CRITICAL: VALID TECHNIQUE IDs ONLY - NO FICTIONAL IDs ALLOWED**
You MUST only use technique IDs that actually exist in the official MITRE ATT&CK framework. Do not invent, hallucinate, or create technique IDs.

**INVALID IDs YOU MUST NEVER USE:**
- Any T18XX series (T1800, T1859, T1888, etc.) - THESE DO NOT EXIST
- Any T19XX series (T1900, T1950, etc.) - THESE DO NOT EXIST  
- Sub-techniques beyond the actual limits (T1053.024, T1059.015, etc.) - THESE DO NOT EXIST
- Any technique ID > T1600 - LIKELY FICTIONAL

**Examples of VALID technique IDs:**
- T1053 (Scheduled Task/Job) - has sub-techniques T1053.001 through T1053.007 ONLY
- T1547 (Boot or Logon Autostart Execution) - has sub-techniques T1547.001 through T1547.015 ONLY  
- T1546 (Event Triggered Execution) - has sub-techniques T1546.001 through T1546.015 ONLY
- T1059 (Command and Scripting Interpreter) - has sub-techniques T1059.001 through T1059.008 ONLY
- T1003 (OS Credential Dumping) - has sub-techniques T1003.001 through T1003.008 ONLY
- T1078 (Valid Accounts) - has sub-techniques T1078.001 through T1078.004 ONLY

**VERIFICATION RULE:** Before including any technique ID, verify it exists at https://attack.mitre.org/techniques/TXXX/

**Analysis Requirements:**
Please provide a comprehensive MITRE ATT&CK analysis including:

1. **Relevant MITRE ATT&CK Techniques**: Identify specific techniques (T####) that relate to this threat hunt. Use only real technique IDs from the MITRE framework.
2. **Tactics Mapping**: Map techniques to appropriate MITRE tactics (Initial Access, Execution, Persistence, etc.)
3. **Detection Strategies**: Suggest detection methods and data sources for each technique
4. **Hunting Queries**: Provide specific hunting queries or search patterns
5. **Confidence Assessment**: Rate confidence for each technique mapping (1-10)
6. **False Positive Considerations**: Identify potential false positives and how to mitigate them
7. **Recommended Actions**: Suggest next steps for threat hunters

**MANDATORY CONSTRAINTS - VIOLATION WILL RESULT IN REJECTED RESPONSE:**
- ONLY use technique IDs from the official MITRE ATT&CK framework (T1000-T1600 range typically)
- NEVER create fictional technique IDs (no T1053.008+, no T1800+, no T1900+ series)
- If unsure about a sub-technique, use only the main technique (e.g., T1053) without sub-techniques
- Maximum of 6-8 most relevant techniques for focused, actionable analysis
- Each technique ID you use must be verifiable at https://attack.mitre.org/
- When in doubt, omit the technique rather than guess the ID

Format your response with clear sections and include only valid MITRE technique IDs.`;

    console.log('🧠 Generating MITRE enhancement using configured AI provider...');
    const aiResult = await aiGenerationService.generateTestResponse({
      prompt: mitreAnalysisPrompt,
      organizationId,
      userId,
      contextType: 'mitre_enhancement',
      contextId: huntId,
      maxTokens: 4000,
      temperature: 0.3
    });

    const aiResponse = aiResult.response || aiResult.content;
    if (!aiResponse) {
      throw new Error('AI generation failed: No response generated');
    }

    const processingTime = Date.now() - startTime;

    console.log(`✅ MITRE enhancement completed in ${processingTime}ms`);

    // Validate and filter AI response for invalid technique IDs
    const validatedResponse = await validateAndFilterMitreTechniques(aiResponse);

    // Update hunt with AI enhancement tracking
    await ThreatHunt.update({
      aiEnhanced: true,
      aiEnhancementSections: ['mitre_attack_mapping'],
      updatedAt: new Date()
    }, {
      where: { id: huntId, organizationId }
    });

    console.log(`✅ MITRE enhancement completed for hunt ${huntId} in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        huntId,
        analysis: validatedResponse.cleanedAnalysis,
        processingTimeMs: processingTime,
        model: 'configured',
        enhancementTimestamp: new Date().toISOString(),
        validationSummary: {
          invalidTechniquesRemoved: validatedResponse.invalidTechniques.length,
          invalidTechniques: validatedResponse.invalidTechniques,
          warningMessage: validatedResponse.invalidTechniques.length > 0 ? 
            `AI generated ${validatedResponse.invalidTechniques.length} invalid technique IDs that were filtered out` : null
        }
      },
      message: 'MITRE enhancement completed successfully'
    });

  } catch (error) {
    console.error('❌ Error in MITRE enhancement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance hunt with MITRE ATTACK',
      error: error.message
    });
  }
};

/**
 * Save MITRE enhancement data to database
 */
async function saveMitreEnhancementData(req, res, huntId, organizationId, enhancementData) {
  try {
    console.log(`💾 Saving MITRE enhancement data for hunt ${huntId}`);

    // Check if enhancement already exists
    let existingEnhancement = await ThreatHuntMitreEnhancement.findOne({
      where: { threatHuntId: huntId, organizationId }
    });

    const enhancementRecord = {
      threatHuntId: huntId,
      organizationId: organizationId,
      sessionId: enhancementData.sessionId,
      aiReasoningEffort: enhancementData.aiReasoningEffort || 'high',
      confidenceScore: enhancementData.confidenceScore || 0.0,
      mappedTechniques: enhancementData.mappedTechniques || [],
      analysisStructured: enhancementData.analysisStructured || null,
      originalAnalysisText: enhancementData.analysisStructured?.originalText || 
                       enhancementData.analysisStructured?.summary || 
                       enhancementData.toolCallingSummary?.originalText || null,
      detectionStrategies: enhancementData.detectionStrategies || [],
      toolCallingSummary: enhancementData.toolCallingSummary || {
        sessionId: enhancementData.sessionId,
        totalToolCalls: 1,
        successfulCalls: 1,
        failedCalls: 0,
        toolsUsed: ['ai_mitre_analysis'],
        processingTimeMs: 0,
        reasoningEffort: 'high'
      },
      processingTimeMs: enhancementData.toolCallingSummary?.processingTimeMs || 0,
      enhancementTimestamp: enhancementData.enhancementTimestamp || new Date(),
    };

    if (existingEnhancement) {
      // Update existing enhancement
      await existingEnhancement.update(enhancementRecord);
      console.log(`✅ Updated existing MITRE enhancement for hunt ${huntId}`);
    } else {
      // Create new enhancement record
      existingEnhancement = await ThreatHuntMitreEnhancement.create(enhancementRecord);
      console.log(`✅ Created new MITRE enhancement for hunt ${huntId}`);
    }

    // Also update the hunt record to mark as enhanced
    await ThreatHunt.update({
      aiEnhanced: true,
      aiEnhancementSections: ['mitre_attack_mapping'],
      updatedAt: new Date()
    }, {
      where: { id: huntId, organizationId }
    });

    res.json({
      success: true,
      data: {
        huntId,
        enhancementId: existingEnhancement.id,
        saved: true
      },
      message: 'MITRE enhancement data saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving MITRE enhancement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save MITRE enhancement data',
      error: error.message
    });
  }
}

/**
 * Get saved MITRE enhancement for a threat hunt
 */
const getMitreEnhancement = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id: huntId } = req.params;

    console.log(`🔍 Getting MITRE enhancement for hunt ${huntId}`);

    // Get the saved MITRE enhancement data
    const enhancement = await ThreatHuntMitreEnhancement.findOne({
      where: { 
        threatHuntId: huntId, 
        organizationId 
      },
      include: [
        {
          model: ThreatHunt,
          as: 'threatHunt',
          attributes: ['id', 'name', 'huntType', 'aiEnhanced', 'aiEnhancementSections']
        }
      ]
    });

    if (!enhancement) {
      console.log(`⚠️ No MITRE enhancement found for hunt ${huntId}`);
      return res.json({
        success: false,
        data: null,
        message: 'No MITRE enhancement available for this hunt'
      });
    }

    console.log(`✅ Found MITRE enhancement for hunt ${huntId} with ${enhancement.mappedTechniques?.length || 0} techniques`);

    // Structure the response data to match frontend expectations
    const enhancementData = {
      huntId: enhancement.threatHuntId,
      sessionId: enhancement.sessionId,
      mappedTechniques: enhancement.mappedTechniques || [],
      analysisStructured: {
        ...(enhancement.analysisStructured || {}),
        originalText: enhancement.originalAnalysisText || 
                     enhancement.analysisStructured?.originalText || 
                     enhancement.analysisStructured?.summary ||
                     ''
      },
      detectionStrategies: enhancement.detectionStrategies || [],
      toolCallingSummary: enhancement.toolCallingSummary || {
        sessionId: enhancement.sessionId,
        totalToolCalls: 1,
        successfulCalls: 1,
        failedCalls: 0,
        toolsUsed: ['ai_mitre_analysis'],
        processingTimeMs: enhancement.processingTimeMs,
        reasoningEffort: enhancement.aiReasoningEffort
      },
      enhancementTimestamp: enhancement.enhancementTimestamp,
      aiReasoningEffort: enhancement.aiReasoningEffort,
      confidenceScore: parseFloat(enhancement.confidenceScore) || 0.0
    };

    res.json({
      success: true,
      data: enhancementData,
      metadata: {
        savedAt: enhancement.createdAt,
        lastModified: enhancement.updatedAt,
        humanValidated: enhancement.humanValidated,
        validationNotes: enhancement.validationNotes
      }
    });

  } catch (error) {
    console.error('❌ Error getting MITRE enhancement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get MITRE enhancement',
      error: error.message
    });
  }
};

/**
 * Clear MITRE ATTACK enhancement data for a threat hunt
 */
const clearMitreEnhancement = async (req, res) => {
  try {
    const { id: huntId } = req.params;
    const { organizationId } = req.user;

    console.log(`🗑️ Clearing MITRE enhancement data for hunt ${huntId}`);

    // Find the threat hunt first
    const hunt = await ThreatHunt.findOne({
      where: { id: huntId, organizationId }
    });

    if (!hunt) {
      return res.status(404).json({
        success: false,
        message: 'Threat hunt not found'
      });
    }

    // Delete MITRE enhancement data from database
    const deletedCount = await ThreatHuntMitreEnhancement.destroy({
      where: { 
        threatHuntId: huntId, 
        organizationId 
      }
    });

    // Reset AI enhancement tracking flags
    await hunt.update({
      aiEnhanced: false,
      aiEnhancementSections: hunt.aiEnhancementSections.filter(
        section => section !== 'mitre_attack_mapping'
      )
    });

    console.log(`✅ Cleared MITRE enhancement data: ${deletedCount} records deleted`);

    res.json({
      success: true,
      message: 'MITRE enhancement data cleared successfully',
      metadata: {
        recordsDeleted: deletedCount,
        huntId,
        clearedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error clearing MITRE enhancement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear MITRE enhancement data',
      error: error.message
    });
  }
};

module.exports = {
  // New simplified methods
  getThreatHunts,
  getThreatHuntById,
  createThreatHunt,
  updateThreatHunt,
  deleteThreatHunt,
  getThreatHuntingStats,
  getHuntTypes,
  cloneThreatHunt,
  
  // TTP management
  addHuntTTPs,
  getHuntTTPs,
  
  // Report management
  generateHuntReport,
  getHuntReports,
  
  // AI enhancement
  enhanceThreatHuntContent,
  
  // MITRE ATTACK enhancement
  enhanceThreatHuntWithMitre,
  getMitreEnhancement,
  clearMitreEnhancement,
  
  // Backwards compatibility aliases
  getThreatHuntingEvents,
  getThreatHuntingEventById,
  createThreatHuntingEvent,
  updateThreatHuntingEvent,
  deleteThreatHuntingEvent,
  cloneThreatHuntingEvent,
};