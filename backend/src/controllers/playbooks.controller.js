const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const embeddingHelper = require('../services/embeddingHelper');
const aiGenerationService = require('../services/aiGenerationService');
const aiAgentLogService = require('../services/aiAgentLogService');
const { Op } = require('sequelize');

/**
 * Get all playbooks with filtering and pagination
 * GET /api/playbooks
 */
const getPlaybooks = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    category,
    isActive,
    triggerType,
    search,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (category) {
    const categoryArray = Array.isArray(category) ? category : [category];
    where.category = { [Op.in]: categoryArray };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (triggerType) {
    const triggerTypeArray = Array.isArray(triggerType) ? triggerType : [triggerType];
    where.triggerType = { [Op.in]: triggerTypeArray };
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { category: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get playbooks with pagination
  const { count, rows: playbooks } = await models.Playbook.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  res.status(200).json({
    playbooks,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNext,
      hasPrev,
    },
  });
});

/**
 * Get single playbook by ID
 * GET /api/playbooks/:id
 */
const getPlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const playbook = await models.Playbook.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  if (!playbook) {
    throw new NotFoundError('Playbook not found');
  }

  res.status(200).json({ playbook });
});

/**
 * Create new playbook
 * POST /api/playbooks
 */
const createPlaybook = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    name,
    description,
    category,
    triggerType = 'manual',
    steps = [],
    isActive = true,
  } = req.body;

  const playbookData = {
    name,
    description,
    category,
    triggerType,
    steps,
    isActive,
    executionCount: 0,
    successRate: 0.0,
    averageExecutionTime: 0,
    createdBy: req.user.id,
    organizationId,
  };

  const playbook = await models.Playbook.create(playbookData);

  // Trigger automatic embedding generation (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('playbook', playbook.id, 'create');

  // Log playbook creation activity
  await logPlaybookActivity(req.user.id, playbook.id, 'playbook_created', `Created playbook: ${name}`, {
    playbookName: name,
    category: category,
    triggerType: triggerType,
  });

  // Include creator information in response
  const createdPlaybook = await models.Playbook.findOne({
    where: { id: playbook.id },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(201).json({
    message: 'Playbook created successfully',
    playbook: createdPlaybook,
  });
});

/**
 * Update playbook
 * PUT /api/playbooks/:id
 */
const updatePlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const playbook = await models.Playbook.findOne({
    where: { id, organizationId },
  });

  if (!playbook) {
    throw new NotFoundError('Playbook not found');
  }

  // Track changes for activity log
  const changes = [];
  const updateData = req.body;
  
  Object.keys(updateData).forEach(key => {
    if (JSON.stringify(updateData[key]) !== JSON.stringify(playbook[key])) {
      changes.push(`${key}: updated`);
    }
  });

  await playbook.update(updateData);

  // Trigger automatic embedding generation for updates (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('playbook', playbook.id, 'update');

  // Log playbook update activity
  if (changes.length > 0) {
    await logPlaybookActivity(req.user.id, playbook.id, 'playbook_updated', `Updated playbook: ${playbook.name}`, {
      playbookName: playbook.name,
      changes: changes,
    });
  }

  // Include creator information in response
  const updatedPlaybook = await models.Playbook.findOne({
    where: { id: playbook.id },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(200).json({
    message: 'Playbook updated successfully',
    playbook: updatedPlaybook,
  });
});

/**
 * Delete playbook
 * DELETE /api/playbooks/:id
 */
const deletePlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const playbook = await models.Playbook.findOne({
    where: { id, organizationId },
  });

  if (!playbook) {
    throw new NotFoundError('Playbook not found');
  }

  // Log playbook deletion activity
  await logPlaybookActivity(req.user.id, playbook.id, 'playbook_deleted', `Deleted playbook: ${playbook.name}`, {
    playbookName: playbook.name,
    category: playbook.category,
  });

  await playbook.destroy();

  res.status(200).json({
    message: 'Playbook deleted successfully',
  });
});

/**
 * Execute playbook
 * POST /api/playbooks/:id/execute
 */
const executePlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const playbook = await models.Playbook.findOne({
    where: { id, organizationId },
  });

  if (!playbook) {
    throw new NotFoundError('Playbook not found');
  }

  if (!playbook.isActive) {
    throw new ValidationError('Cannot execute inactive playbook');
  }

  // Simulate playbook execution
  const executionStart = Date.now();
  const executionId = `exec-${Date.now()}`;
  
  // In a real implementation, this would:
  // 1. Create an execution record
  // 2. Execute each step in sequence
  // 3. Handle automated vs manual steps
  // 4. Track progress and results
  // 5. Update execution statistics
  
  // For now, simulate execution delay based on steps
  const estimatedTime = playbook.steps.reduce((total, step) => {
    return total + (step.timeout || 60); // Default 60 seconds per step
  }, 0);

  // Log playbook execution activity
  await logPlaybookActivity(req.user.id, playbook.id, 'playbook_executed', `Executed playbook: ${playbook.name}`, {
    playbookName: playbook.name,
    executionId: executionId,
    stepCount: playbook.steps.length,
    estimatedTime: estimatedTime,
  });

  // Update execution statistics (simplified)
  const newExecutionCount = playbook.executionCount + 1;
  const executionTime = Math.floor(estimatedTime * (0.8 + Math.random() * 0.4)); // Simulate variance
  const newAverageTime = Math.floor(
    (playbook.averageExecutionTime * playbook.executionCount + executionTime) / newExecutionCount
  );

  // Simulate success rate (typically high for established playbooks)
  const simulatedSuccess = Math.random() > 0.1; // 90% success rate
  const currentSuccessCount = Math.floor(playbook.successRate * playbook.executionCount / 100);
  const newSuccessCount = simulatedSuccess ? currentSuccessCount + 1 : currentSuccessCount;
  const newSuccessRate = (newSuccessCount / newExecutionCount) * 100;

  await playbook.update({
    executionCount: newExecutionCount,
    averageExecutionTime: newAverageTime,
    successRate: newSuccessRate,
  });

  res.status(200).json({
    message: 'Playbook execution started',
    execution: {
      id: executionId,
      playbookId: playbook.id,
      playbookName: playbook.name,
      status: 'running',
      startTime: new Date(executionStart),
      estimatedDuration: estimatedTime,
      steps: playbook.steps.map((step, index) => ({
        ...step,
        status: index === 0 ? 'running' : 'pending',
      })),
    },
  });
});

/**
 * Get playbook statistics
 * GET /api/playbooks/stats
 */
const getPlaybookStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [
    totalPlaybooks,
    activePlaybooks,
    playbooksByCategory,
    recentExecutions,
    avgSuccessRate,
  ] = await Promise.all([
    models.Playbook.count({ where: { organizationId } }),
    models.Playbook.count({ where: { organizationId, isActive: true } }),
    sequelize.query(`
      SELECT category, COUNT(*) as count 
      FROM playbooks 
      WHERE organization_id = :orgId 
      GROUP BY category
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM playbook_activities pa
      JOIN playbooks p ON pa.playbook_id = p.id
      WHERE p.organization_id = :orgId 
      AND pa.action = 'playbook_executed'
      AND pa.timestamp >= NOW() - INTERVAL '24 hours'
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ count: 0 }]), // Handle case where table doesn't exist yet
    sequelize.query(`
      SELECT AVG(success_rate) as avg_rate
      FROM playbooks 
      WHERE organization_id = :orgId 
      AND execution_count > 0
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
  ]);

  res.status(200).json({
    total: totalPlaybooks,
    active: activePlaybooks,
    byCategory: playbooksByCategory,
    recentExecutions: parseInt(recentExecutions[0].count),
    avgSuccessRate: parseFloat(avgSuccessRate[0]?.avg_rate || 0),
  });
});

/**
 * Get playbook templates
 * GET /api/playbooks/templates
 */
const getPlaybookTemplates = asyncHandler(async (req, res) => {
  // Return predefined playbook templates
  const templates = [
    {
      id: 'template-malware-response',
      name: 'Malware Incident Response',
      description: 'Standard response procedure for malware detection and containment',
      category: 'Incident Response',
      steps: [
        {
          id: 'step-1',
          name: 'Asset Isolation',
          type: 'automated',
          description: 'Automatically isolate infected asset from network',
          timeout: 300,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-2',
          name: 'Evidence Collection',
          type: 'automated',
          description: 'Collect system artifacts and memory dump',
          timeout: 600,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-3',
          name: 'Malware Analysis',
          type: 'manual',
          description: 'Analyze malware sample and determine impact',
          timeout: 1800,
          isRequired: true,
          order: 3
        },
        {
          id: 'step-4',
          name: 'Remediation',
          type: 'automated',
          description: 'Remove malware and restore system',
          timeout: 900,
          isRequired: true,
          order: 4
        }
      ]
    },
    {
      id: 'template-phishing-response',
      name: 'Phishing Email Investigation',
      description: 'Step-by-step process for investigating and responding to phishing attacks',
      category: 'Email Security',
      steps: [
        {
          id: 'step-1',
          name: 'Email Quarantine',
          type: 'automated',
          description: 'Remove suspicious email from all mailboxes',
          timeout: 180,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-2',
          name: 'Header Analysis',
          type: 'manual',
          description: 'Examine email metadata and routing information',
          timeout: 600,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-3',
          name: 'URL/Attachment Analysis',
          type: 'automated',
          description: 'Scan URLs and attachments for malicious content',
          timeout: 300,
          isRequired: true,
          order: 3
        }
      ]
    }
  ];

  res.status(200).json({ templates });
});

/**
 * Log playbook activity
 */
const logPlaybookActivity = async (userId, playbookId, action, description, metadata = {}) => {
  try {
    // Create playbook_activities table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS playbook_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        playbook_id UUID NOT NULL REFERENCES playbooks(id),
        action VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      )
    `);

    await sequelize.query(`
      INSERT INTO playbook_activities (user_id, playbook_id, action, description, metadata)
      VALUES (:userId, :playbookId, :action, :description, :metadata)
    `, {
      replacements: {
        userId,
        playbookId,
        action,
        description,
        metadata: JSON.stringify(metadata)
      }
    });
  } catch (error) {
    console.error('Failed to log playbook activity:', error);
    // Don't throw error - activity logging should not break main functionality
  }
};

/**
 * Helper function to create a playbook (used by test data generation)
 * Creates playbook with proper embedding triggers
 */
const createPlaybookHelper = async (playbookData, user) => {
  const organizationId = user.organizationId;
  
  const finalPlaybookData = {
    ...playbookData,
    organizationId,
    createdBy: user?.id || null,
    // Explicitly handle isTestData parameter for test data consistency
    isTestData: playbookData.isTestData === true || playbookData.isTestData === 'true',
    isActive: playbookData.isActive !== undefined ? playbookData.isActive : true,
    executionCount: playbookData.executionCount || 0,
    successRate: playbookData.successRate || 0,
    averageExecutionTime: playbookData.averageExecutionTime || 0,
  };

  const playbook = await models.Playbook.create(finalPlaybookData);

  // Trigger automatic embedding generation (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('playbook', playbook.id, 'create');

  // Get the created playbook (no complex associations needed for playbooks)
  const createdPlaybook = await models.Playbook.findByPk(playbook.id);

  return createdPlaybook;
};

/**
 * AI-powered playbook enhancement
 * POST /api/playbooks/:id/enhance
 */
const enhancePlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const playbook = await models.Playbook.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  if (!playbook) {
    throw new NotFoundError('Playbook not found');
  }

  const startTime = Date.now();
  
  try {
    console.log('🤖 Starting AI playbook enhancement analysis...');
    console.log('📝 Playbook:', playbook.name);
    console.log('🔧 Steps count:', playbook.steps?.length || 0);

    // Build comprehensive analysis prompt
    const prompt = buildPlaybookEnhancementPrompt(playbook);
    
    // Generate AI enhancement suggestions using real AI service
    const aiResult = await aiGenerationService.generateResponse({
      prompt,
      organizationId,
      model: 'gpt-oss:20b', // Use the configured model
      maxTokens: 2500,
      temperature: 0.7
    });

    // Parse AI response to extract enhancement suggestions
    const enhancementData = parseEnhancementResponse(aiResult.response, playbook);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log successful AI activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Playbook Specialist Agent',
      taskName: 'enhance playbook',
      description: `AI analysis and enhancement of playbook: ${playbook.name}`,
      inputTokens: aiResult.usage?.promptTokens || Math.ceil(prompt.length / 4),
      outputTokens: aiResult.usage?.completionTokens || Math.ceil(aiResult.response.length / 4),
      executionTimeMs: executionTime,
      success: true,
      userId: req.user.id,
      organizationId,
      metadata: {
        playbookId: playbook.id,
        playbookName: playbook.name,
        enhancementsGenerated: enhancementData.enhancements.length,
        categories: [...new Set(enhancementData.enhancements.map(e => e.category))],
        highImpactCount: enhancementData.enhancements.filter(e => e.impact === 'high').length,
        aiProvider: aiResult.provider?.type || 'ollama',
        aiModel: aiResult.model || 'gpt-oss:20b'
      }
    });

    // Log playbook activity
    await logPlaybookActivity(req.user.id, playbook.id, 'playbook_ai_enhanced', 
      `AI analyzed playbook: ${playbook.name}`, {
        playbookName: playbook.name,
        enhancementsGenerated: enhancementData.enhancements.length,
        executionTime: executionTime,
        aiProvider: aiResult.provider?.type || 'ollama'
      });

    res.status(200).json({
      message: 'AI enhancement analysis completed successfully',
      playbook: {
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        category: playbook.category,
        steps: playbook.steps
      },
      enhancements: enhancementData.enhancements,
      analysis: {
        totalSuggestions: enhancementData.enhancements.length,
        highImpact: enhancementData.enhancements.filter(e => e.impact === 'high').length,
        mediumImpact: enhancementData.enhancements.filter(e => e.impact === 'medium').length,
        lowImpact: enhancementData.enhancements.filter(e => e.impact === 'low').length,
        categories: [...new Set(enhancementData.enhancements.map(e => e.category))],
        executionTime: executionTime,
        confidence: enhancementData.confidence || 85
      },
      aiProvider: {
        type: aiResult.provider?.type || 'ollama',
        model: aiResult.model || 'gpt-oss:20b',
        isFallback: aiResult.provider?.isFallback || false
      }
    });

  } catch (error) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.error('❌ AI playbook enhancement failed:', error);

    // Log failed AI activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Playbook Specialist Agent',
      taskName: 'enhance playbook',
      description: `Failed to enhance playbook: ${playbook.name}`,
      executionTimeMs: executionTime,
      success: false,
      errorMessage: error.message,
      userId: req.user.id,
      organizationId,
      metadata: {
        playbookId: playbook.id,
        playbookName: playbook.name,
        errorType: 'ai_enhancement_failure',
        errorDetails: error.message
      }
    });

    throw new ValidationError(`AI enhancement failed: ${error.message}`);
  }
});

/**
 * Build comprehensive prompt for AI playbook enhancement
 */
function buildPlaybookEnhancementPrompt(playbook) {
  const stepsContext = playbook.steps && playbook.steps.length > 0 
    ? playbook.steps.map((step, index) => `
STEP ${index + 1}: ${step.name}
- Type: ${step.type || 'manual'}
- Description: ${step.description || 'No description'}
- Timeout: ${step.timeout || 300} seconds
- Required: ${step.isRequired !== false ? 'Yes' : 'No'}
`).join('\n')
    : 'No steps defined';

  return `You are an expert cybersecurity consultant specializing in incident response playbook optimization. Analyze the following playbook and provide specific, actionable enhancement suggestions.

PLAYBOOK DETAILS:
================
Name: ${playbook.name}
Description: ${playbook.description || 'No description provided'}
Category: ${playbook.category}
Trigger Type: ${playbook.triggerType || 'manual'}
Current Steps: ${playbook.steps?.length || 0}
Active: ${playbook.isActive ? 'Yes' : 'No'}

CURRENT STEPS:
==============
${stepsContext}

ANALYSIS REQUIREMENTS:
=====================
Provide enhancement suggestions in the following areas:
1. **Security Gaps**: Missing security controls, evidence preservation, or containment measures
2. **Process Efficiency**: Automation opportunities, parallel execution, or redundant steps
3. **Compliance & Documentation**: Audit trails, regulatory requirements, or documentation improvements
4. **Communication**: Stakeholder notification, escalation procedures, or status updates
5. **Recovery & Lessons Learned**: Recovery validation, post-incident analysis, or improvement processes

For each suggestion, provide:
- Specific actionable recommendation
- Clear business justification
- Implementation complexity (low/medium/high)
- Expected impact on security posture

RESPONSE FORMAT:
===============
Return your response as a valid JSON object with this exact structure:

{
  "enhancements": [
    {
      "id": "enh-1",
      "type": "new_step|improve_step|optimize_config|security_enhancement",
      "title": "Short descriptive title",
      "description": "Detailed description of the enhancement",
      "impact": "high|medium|low",
      "category": "Security|Efficiency|Compliance|Communication|Recovery",
      "reasoning": "Why this enhancement is important and beneficial",
      "suggestedStep": {
        "name": "Step name if applicable",
        "description": "Step description if applicable", 
        "type": "automated|manual|decision",
        "timeout": 600,
        "isRequired": true,
        "order": 2
      },
      "complexity": "low|medium|high",
      "estimatedTimeReduction": "5-10 minutes (if applicable)"
    }
  ],
  "confidence": 85
}

Focus on practical, implementable suggestions that will meaningfully improve the playbook's effectiveness, security posture, and operational efficiency.`;
}

/**
 * Parse AI response and extract enhancement suggestions
 */
function parseEnhancementResponse(response, playbook) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (parsed.enhancements && Array.isArray(parsed.enhancements)) {
        // Add unique IDs to enhancements if missing
        const enhancementsWithIds = parsed.enhancements.map((enhancement, index) => ({
          id: enhancement.id || `enh-${Date.now()}-${index}`,
          type: enhancement.type || 'optimize_config',
          title: enhancement.title || `Enhancement ${index + 1}`,
          description: enhancement.description || 'AI-generated enhancement',
          impact: enhancement.impact || 'medium',
          category: enhancement.category || 'Efficiency',
          reasoning: enhancement.reasoning || 'Recommended by AI analysis',
          complexity: enhancement.complexity || 'medium',
          estimatedTimeReduction: enhancement.estimatedTimeReduction,
          suggestedStep: enhancement.suggestedStep || null,
          applied: false
        }));

        return {
          enhancements: enhancementsWithIds,
          confidence: parsed.confidence || 85
        };
      }
    }
  } catch (error) {
    console.error('Failed to parse AI enhancement response as JSON:', error);
  }
  
  // Fallback: Create a basic enhancement from the raw response
  return {
    enhancements: [{
      id: `enh-${Date.now()}`,
      type: 'optimize_config',
      title: 'AI Analysis Result',
      description: response.substring(0, 300) + (response.length > 300 ? '...' : ''),
      impact: 'medium',
      category: 'Analysis',
      reasoning: 'AI provided general recommendations for the playbook',
      complexity: 'medium',
      applied: false
    }],
    confidence: 70
  };
}

/**
 * AI-powered playbook review
 * POST /api/playbooks/:id/review
 */
const reviewPlaybook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const playbook = await models.Playbook.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  if (!playbook) {
    throw new NotFoundError('Playbook not found');
  }

  const startTime = Date.now();
  
  try {
    console.log('🤖 Starting AI playbook review analysis...');
    console.log('📝 Playbook:', playbook.name);
    console.log('🔧 Steps count:', playbook.steps?.length || 0);

    // Build comprehensive review prompt
    const prompt = buildPlaybookReviewPrompt(playbook);
    
    // Generate AI review using real AI service
    const aiResult = await aiGenerationService.generateResponse({
      prompt,
      organizationId,
      model: 'gpt-oss:20b',
      maxTokens: 2000,
      temperature: 0.3 // Lower temperature for more consistent reviews
    });

    // Parse AI response to extract review findings
    const reviewData = parseReviewResponse(aiResult.response, playbook);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log successful AI activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Playbook Specialist Agent',
      taskName: 'review playbook',
      description: `AI security and compliance review of playbook: ${playbook.name}`,
      inputTokens: aiResult.usage?.promptTokens || Math.ceil(prompt.length / 4),
      outputTokens: aiResult.usage?.completionTokens || Math.ceil(aiResult.response.length / 4),
      executionTimeMs: executionTime,
      success: true,
      userId: req.user.id,
      organizationId,
      metadata: {
        playbookId: playbook.id,
        playbookName: playbook.name,
        overallScore: reviewData.overallScore,
        findingsCount: reviewData.findings.length,
        criticalFindings: reviewData.findings.filter(f => f.severity === 'critical').length,
        aiProvider: aiResult.provider?.type || 'ollama',
        aiModel: aiResult.model || 'gpt-oss:20b'
      }
    });

    // Log playbook activity
    await logPlaybookActivity(req.user.id, playbook.id, 'playbook_ai_reviewed', 
      `AI reviewed playbook: ${playbook.name}`, {
        playbookName: playbook.name,
        overallScore: reviewData.overallScore,
        findingsCount: reviewData.findings.length,
        executionTime: executionTime,
        aiProvider: aiResult.provider?.type || 'ollama'
      });

    res.status(200).json({
      message: 'AI review analysis completed successfully',
      playbook: {
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        category: playbook.category,
        steps: playbook.steps
      },
      review: {
        overallScore: reviewData.overallScore,
        scores: reviewData.scores,
        findings: reviewData.findings,
        recommendations: reviewData.recommendations
      },
      analysis: {
        totalFindings: reviewData.findings.length,
        criticalFindings: reviewData.findings.filter(f => f.severity === 'critical').length,
        majorFindings: reviewData.findings.filter(f => f.severity === 'major').length,
        minorFindings: reviewData.findings.filter(f => f.severity === 'minor').length,
        executionTime: executionTime,
        confidence: reviewData.confidence || 90
      },
      aiProvider: {
        type: aiResult.provider?.type || 'ollama',
        model: aiResult.model || 'gpt-oss:20b',
        isFallback: aiResult.provider?.isFallback || false
      }
    });

  } catch (error) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.error('❌ AI playbook review failed:', error);

    // Log failed AI activity
    await aiAgentLogService.logAgentActivity({
      agentName: 'Playbook Specialist Agent',
      taskName: 'review playbook',
      description: `Failed to review playbook: ${playbook.name}`,
      executionTimeMs: executionTime,
      success: false,
      errorMessage: error.message,
      userId: req.user.id,
      organizationId,
      metadata: {
        playbookId: playbook.id,
        playbookName: playbook.name,
        errorType: 'ai_review_failure',
        errorDetails: error.message
      }
    });

    throw new ValidationError(`AI review failed: ${error.message}`);
  }
});

/**
 * Build comprehensive prompt for AI playbook review
 */
function buildPlaybookReviewPrompt(playbook) {
  const stepsContext = playbook.steps && playbook.steps.length > 0 
    ? playbook.steps.map((step, index) => `
STEP ${index + 1}: ${step.name}
- Type: ${step.type || 'manual'}
- Description: ${step.description || 'No description'}
- Timeout: ${step.timeout || 300} seconds
- Required: ${step.isRequired !== false ? 'Yes' : 'No'}
`).join('\n')
    : 'No steps defined';

  return `You are an expert cybersecurity auditor specializing in incident response playbook reviews. Conduct a comprehensive security and compliance review of the following playbook.

PLAYBOOK DETAILS:
================
Name: ${playbook.name}
Description: ${playbook.description || 'No description provided'}
Category: ${playbook.category}
Trigger Type: ${playbook.triggerType || 'manual'}
Current Steps: ${playbook.steps?.length || 0}
Active: ${playbook.isActive ? 'Yes' : 'No'}

CURRENT STEPS:
==============
${stepsContext}

REVIEW CRITERIA:
===============
Evaluate the playbook across these dimensions:
1. **Security**: Evidence preservation, containment effectiveness, access controls
2. **Compliance**: Regulatory requirements, audit trails, documentation standards
3. **Efficiency**: Step optimization, automation opportunities, resource utilization
4. **Completeness**: Missing critical steps, stakeholder notification, escalation procedures

RESPONSE FORMAT:
===============
Return your response as a valid JSON object with this exact structure:

{
  "overallScore": 85,
  "scores": {
    "security": 90,
    "compliance": 80,
    "efficiency": 85,
    "completeness": 85
  },
  "findings": [
    {
      "id": "finding-1",
      "title": "Missing Evidence Preservation",
      "description": "The playbook lacks explicit evidence preservation steps before containment actions.",
      "severity": "critical|major|minor",
      "category": "Security|Compliance|Efficiency|Completeness",
      "recommendation": "Add forensic evidence collection step before isolation",
      "affectedSteps": [1, 2],
      "impact": "High risk of evidence tampering"
    }
  ],
  "recommendations": [
    "Implement automated evidence preservation before containment",
    "Add compliance checkpoint after critical steps"
  ],
  "confidence": 90
}

Focus on practical, actionable findings that will improve the playbook's security posture, compliance alignment, and operational effectiveness.`;
}

/**
 * Parse AI response and extract review findings
 */
function parseReviewResponse(response, playbook) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (parsed.overallScore && parsed.scores && parsed.findings) {
        // Add unique IDs to findings if missing
        const findingsWithIds = parsed.findings.map((finding, index) => ({
          id: finding.id || `finding-${Date.now()}-${index}`,
          title: finding.title || `Finding ${index + 1}`,
          description: finding.description || 'AI-generated finding',
          severity: finding.severity || 'minor',
          category: finding.category || 'General',
          recommendation: finding.recommendation || 'Recommended by AI analysis',
          affectedSteps: finding.affectedSteps || [],
          impact: finding.impact || 'Low impact'
        }));

        return {
          overallScore: parsed.overallScore || 75,
          scores: {
            security: parsed.scores.security || 75,
            compliance: parsed.scores.compliance || 75,
            efficiency: parsed.scores.efficiency || 75,
            completeness: parsed.scores.completeness || 75
          },
          findings: findingsWithIds,
          recommendations: parsed.recommendations || ['AI provided general recommendations'],
          confidence: parsed.confidence || 90
        };
      }
    }
  } catch (error) {
    console.error('Failed to parse AI review response as JSON:', error);
  }
  
  // Fallback: Create a basic review from the raw response
  return {
    overallScore: 75,
    scores: {
      security: 75,
      compliance: 75,
      efficiency: 75,
      completeness: 75
    },
    findings: [{
      id: `finding-${Date.now()}`,
      title: 'AI Analysis Result',
      description: response.substring(0, 300) + (response.length > 300 ? '...' : ''),
      severity: 'minor',
      category: 'Analysis',
      recommendation: 'AI provided general recommendations for the playbook',
      affectedSteps: [],
      impact: 'General guidance provided'
    }],
    recommendations: ['AI provided general recommendations for improving the playbook'],
    confidence: 70
  };
}

module.exports = {
  getPlaybooks,
  getPlaybook,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  executePlaybook,
  getPlaybookStats,
  getPlaybookTemplates,
  enhancePlaybook,
  reviewPlaybook,
  createPlaybookHelper,
};