const ragChatService = require('../services/ragChatService');
const aiGenerationService = require('../services/aiGenerationService');
const conversationalIntelligence = require('../services/conversationalIntelligenceService').default;
const queryClassificationService = require('../services/queryClassificationService');
const { asyncHandler } = require('../middleware/error.middleware');
const { v4: uuidv4 } = require('uuid');
const { models, sequelize } = require('../database/models');
const { ChatConversation, ChatMessage } = models;

// Session memory storage (in-memory for active sessions)
const sessionMemory = new Map(); // conversationId -> { messages: [], lastCleared: Date }
const maxSessionMemory = 5; // Keep last 5 messages for context
const maxSessionAge = 2 * 60 * 60 * 1000; // 2 hours

// Clean up old sessions periodically
setInterval(() => {
  const now = new Date();
  let cleaned = 0;

  for (const [id, session] of sessionMemory.entries()) {
    if (now - session.lastActivity > maxSessionAge) {
      sessionMemory.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old chat sessions`);
  }
}, 30 * 60 * 1000); // Every 30 minutes

/**
 * Generate conversation title from first user message
 */
const generateConversationTitle = (message) => {
  // Clean and truncate message for title
  let title = message.trim().replace(/[^\w\s-]/g, ' ');
  
  // Remove extra spaces
  title = title.replace(/\s+/g, ' ');
  
  // Truncate to reasonable length
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return title || 'New Conversation';
};

/**
 * Build AI prompt with session memory context
 */
const buildPromptWithMemory = async (message, conversationId, ragContext) => {
  let contextPrompt = '';
  
  // Get session memory for context
  const session = sessionMemory.get(conversationId);
  if (session && session.messages.length > 0) {
    contextPrompt = '\n\nRecent conversation context:\n';
    session.messages.forEach((msg, index) => {
      const speaker = msg.role === 'user' ? 'Human' : 'Assistant';
      contextPrompt += `${speaker}: ${msg.content}\n`;
    });
    contextPrompt += '\nPlease consider this context when responding.\n';
  }

  const finalPrompt = ragContext + contextPrompt + `\n\nCurrent question: ${message}`;
  
  // Monitor context size
  const promptLength = finalPrompt.length;
  const estimatedTokens = Math.ceil(promptLength / 4);
  console.log('📝 Final prompt length:', promptLength, 'chars');
  console.log('🎯 Estimated tokens:', estimatedTokens);
  console.log('📊 Context breakdown:');
  console.log('  - RAG context:', ragContext.length, 'chars');
  console.log('  - Session memory:', contextPrompt.length, 'chars');
  console.log('  - Current message:', message.length, 'chars');
  
  // Warn if context is very large
  if (estimatedTokens > 8000) {
    console.warn('⚠️ Large context detected:', estimatedTokens, 'tokens - may cause timeouts');
  }

  return finalPrompt;
};

/**
 * Update session memory
 */
const updateSessionMemory = (conversationId, message) => {
  if (!sessionMemory.has(conversationId)) {
    sessionMemory.set(conversationId, {
      messages: [],
      lastActivity: new Date(),
      lastCleared: null
    });
  }

  const session = sessionMemory.get(conversationId);
  session.messages.push({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp
  });

  // Keep only recent messages for memory
  if (session.messages.length > maxSessionMemory * 2) { // x2 for user+assistant pairs
    session.messages = session.messages.slice(-maxSessionMemory * 2);
  }

  session.lastActivity = new Date();
};

/**
 * Send a message to AI SOC Consultant with database persistence
 * POST /api/chat/message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { organizationId, userId } = req.user || {};
  const {
    message,
    conversationId,
    ragEnabled = true,
    dataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
    maxResults = 3,
    model = 'default'
  } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message is required',
      message: 'Please provide a non-empty message string'
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'Message too long',
      message: 'Message must be less than 2000 characters'
    });
  }

  const trimmedMessage = message.trim();
  console.log(`💬 Processing chat message for user ${userId} (conv: ${conversationId})`);

  // Check for interactive workflow intent
  const interactiveIntent = conversationalIntelligence.detectInteractiveIntent(trimmedMessage, conversationId);
  
  // Check for existing workflow that needs user input
  const existingWorkflow = conversationalIntelligence.getWorkflow(conversationId);

  const transaction = await sequelize.transaction();

  try {
    let conversation;
    let isNewConversation = false;

    // Find or create conversation
    if (conversationId) {
      conversation = await ChatConversation.findOne({
        where: {
          id: conversationId,
          userId,
          organizationId
        },
        transaction
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
          message: 'The specified conversation does not exist or you do not have access to it'
        });
      }
    } else {
      // Create new conversation
      isNewConversation = true;
      const title = generateConversationTitle(trimmedMessage);
      
      conversation = await ChatConversation.create({
        userId,
        organizationId,
        title,
        settings: {
          ragEnabled,
          dataSources,
          model
        }
      }, { transaction });
    }

    // Update conversation settings if provided
    if (!isNewConversation) {
      const updatedSettings = {
        ...conversation.settings,
        ragEnabled: ragEnabled !== undefined ? ragEnabled : conversation.settings.ragEnabled,
        dataSources: dataSources.length > 0 ? dataSources : conversation.settings.dataSources,
        model: model !== 'default' ? model : conversation.settings.model
      };

      await conversation.update({
        settings: updatedSettings,
        lastActivity: new Date()
      }, { transaction });
    }

    // Create user message in database
    const userMessage = await ChatMessage.create({
      conversationId: conversation.id,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
      ragEnabled: false
    }, { transaction });

    // Update session memory with user message
    updateSessionMemory(conversation.id, {
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date()
    });

    // Handle conversational intelligence workflows
    let workflowResponse = null;
    let workflowActive = false;

    if (existingWorkflow) {
      // Continue existing workflow with user input
      console.log(`🔄 Continuing workflow ${existingWorkflow.type} for conversation ${conversation.id}`);
      
      const workflowResult = await conversationalIntelligence.processUserResponse(
        conversation.id, 
        trimmedMessage, 
        organizationId
      );

      if (workflowResult) {
        if (workflowResult.readyToExecute) {
          // Workflow has all required info, proceed with execution
          console.log(`✅ Workflow ready to execute: ${workflowResult.workflow.type}`);
          workflowResponse = conversationalIntelligence.generateWorkflowSummary(workflowResult.workflow);
          workflowActive = true;
        } else if (workflowResult.continueGathering) {
          // Need more information from user
          const questions = await conversationalIntelligence.generateQuestions(conversation.id, organizationId);
          if (questions.length > 0) {
            workflowResponse = questions[0].formattedPrompt || questions[0].prompt;
            workflowActive = true;
          }
        }
      }
    } else if (interactiveIntent.requiresInteraction) {
      // Initialize new interactive workflow
      console.log(`🚀 Initializing new workflow: ${interactiveIntent.workflowType}`);
      
      const workflow = await conversationalIntelligence.initializeWorkflow(
        conversation.id, 
        interactiveIntent.workflowType,
        { organizationId }
      );

      const questions = await conversationalIntelligence.generateQuestions(conversation.id, organizationId);
      if (questions.length > 0) {
        workflowResponse = questions[0].formattedPrompt || questions[0].prompt;
        workflowActive = true;
      } else {
        // No questions needed, workflow ready
        workflowResponse = conversationalIntelligence.generateWorkflowSummary(workflow);
        workflowActive = true;
      }
    }

    // If workflow is active, skip normal AI processing
    let aiResponse;
    if (workflowActive && workflowResponse) {
      aiResponse = workflowResponse;
      console.log(`🤖 Using workflow response instead of normal AI generation`);
    } else {
      // Build RAG-enhanced prompt for normal AI processing
      let ragPrompt;
      let ragContext = null;
    
    try {
      ragPrompt = await ragChatService.buildRAGPrompt(trimmedMessage, {
        dataSources: ragEnabled ? dataSources : [],
        organizationId,
        conversationId: conversation.id,
        ragEnabled,
        maxResults
      });

      // Get RAG context for response metadata
      if (ragEnabled && dataSources.length > 0) {
        const searchResults = await ragChatService.semanticSearch(trimmedMessage, {
          dataSources,
          organizationId,
          maxResults
        });

        if (searchResults.length > 0) {
          ragContext = {
            query: trimmedMessage.substring(0, 100),
            resultsFound: searchResults.length,
            sources: searchResults.map(r => ({
              type: r.type,
              id: r.id,
              similarity: parseFloat(r.similarity.toFixed(3))
            }))
          };
        }
      }
    } catch (error) {
      console.error('❌ Failed to build RAG prompt:', error);
      ragPrompt = `You are an AI Security Operations Center (SOC) Consultant. Please help with: ${trimmedMessage}`;
    }

      // Build prompt with session memory
      const promptWithMemory = await buildPromptWithMemory(
        trimmedMessage,
        conversation.id,
        ragPrompt
      );

      // Generate AI response
      try {
      console.log('🤖 Generating AI response with memory context...');
      
      const aiResult = await aiGenerationService.generateTestResponse({
        prompt: promptWithMemory,
        organizationId,
        model: conversation.settings.model,
        maxTokens: 1000,
        temperature: 0.7
      });

      aiResponse = aiResult.response || aiResult.content;
    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      
      // Provide specific error messages based on error type
      if (error.message && error.message.includes('timed out')) {
        aiResponse = '⏱️ **AI Response Timeout**\n\nThe AI took too long to respond to your query. This could be due to:\n\n• Complex query requiring extensive processing\n• AI model is busy with other requests\n• Large context size slowing down generation\n\n**Suggestions:**\n• Try asking a simpler or more specific question\n• Wait a moment and try again\n• Check if the AI provider is running properly\n\n*Timeout details: ' + error.message + '*';
      } else if (error.message && error.message.includes('Cannot connect')) {
        aiResponse = '🔌 **AI Provider Connection Failed**\n\nCannot connect to the AI provider service. This could be due to:\n\n• AI provider service is not running\n• Network connectivity issues\n• Incorrect AI provider configuration\n\n**Next steps:**\n• Verify AI provider is running (check Settings page)\n• Check network connectivity\n• Contact your administrator if the issue persists\n\n*Connection details: ' + error.message + '*';
      } else {
        aiResponse = '🚨 **AI Provider Error**\n\nThe AI provider encountered an error while processing your request. This could be due to:\n\n• AI provider service is down\n• Incorrect configuration settings\n• Model or memory issues\n\nPlease check your AI Provider settings in the Settings page or contact your administrator.\n\n*Error details: ' + error.message + '*';
      }
      }
    }

    // Create assistant message in database with workflow context
    const messageContext = ragContext || {};
    if (workflowActive) {
      const currentWorkflow = conversationalIntelligence.getWorkflow(conversation.id);
      if (currentWorkflow) {
        messageContext.workflow = {
          type: currentWorkflow.type,
          state: currentWorkflow.state,
          step: currentWorkflow.currentStep,
          totalSteps: currentWorkflow.totalSteps
        };
      }
    }

    const assistantMessage = await ChatMessage.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      ragEnabled,
      ragContext: messageContext
    }, { transaction });

    // Update session memory with assistant message
    updateSessionMemory(conversation.id, {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Commit transaction
    await transaction.commit();

    console.log(`✅ Chat response generated and saved for conversation ${conversation.id}`);

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        isNewConversation,
        message: {
          id: assistantMessage.id,
          role: 'assistant',
          content: aiResponse,
          timestamp: assistantMessage.timestamp,
          ragEnabled,
          ragContext: messageContext
        },
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messageCount: conversation.messageCount,
          settings: conversation.settings,
          lastActivity: conversation.lastActivity
        },
        sessionMemory: sessionMemory.get(conversation.id)?.messages.length || 0,
        workflow: workflowActive ? {
          active: true,
          type: conversationalIntelligence.getWorkflow(conversation.id)?.type,
          state: conversationalIntelligence.getWorkflow(conversation.id)?.state,
          requiresUserInput: workflowActive && workflowResponse && !workflowResponse.includes('**Proceed with this workflow?**')
        } : { active: false }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Chat message processing failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Chat processing failed',
      message: 'An error occurred while processing your message'
    });
  }
});

/**
 * Get conversation with messages from database
 * GET /api/chat/conversations/:id
 */
const getConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { userId, organizationId } = req.user || {};
  const { limit = 50, offset = 0 } = req.query;

  const conversation = await ChatConversation.findOne({
    where: {
      id: conversationId,
      userId,
      organizationId
    },
    include: [{
      model: ChatMessage,
      as: 'messages',
      order: [['timestamp', 'ASC']],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset)
    }]
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
      message: 'The requested conversation does not exist or has been archived'
    });
  }

  // Get session memory info
  const session = sessionMemory.get(conversationId);

  res.json({
    success: true,
    data: {
      conversation: conversation.toJSON(),
      sessionMemory: {
        messageCount: session?.messages.length || 0,
        lastActivity: session?.lastActivity || null,
        lastCleared: session?.lastCleared || null
      }
    }
  });
});

/**
 * List user's conversations from database
 * GET /api/chat/conversations
 */
const listConversations = asyncHandler(async (req, res) => {
  const { userId, organizationId } = req.user || {};
  const { 
    limit = 20, 
    offset = 0, 
    includeArchived = false,
    search = ''
  } = req.query;

  const whereClause = {
    userId,
    organizationId
  };

  if (!includeArchived) {
    whereClause.isArchived = false;
  }

  if (search) {
    whereClause.title = {
      [sequelize.Sequelize.Op.iLike]: `%${search}%`
    };
  }

  const { rows: conversations, count: totalCount } = await ChatConversation.findAndCountAll({
    where: whereClause,
    order: [['lastActivity', 'DESC']],
    limit: Math.min(parseInt(limit), 100),
    offset: parseInt(offset),
    include: [{
      model: ChatMessage,
      as: 'messages',
      order: [['timestamp', 'DESC']],
      limit: 1 // Get only the last message
    }]
  });

  const conversationsWithMemory = conversations.map(conv => {
    const session = sessionMemory.get(conv.id);
    return {
      ...conv.toJSON(),
      sessionMemory: {
        messageCount: session?.messages.length || 0,
        lastActivity: session?.lastActivity || null,
        lastCleared: session?.lastCleared || null
      },
      lastMessage: conv.messages?.[0] || null
    };
  });

  res.json({
    success: true,
    data: {
      conversations: conversationsWithMemory,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + parseInt(limit)
      }
    }
  });
});

/**
 * Update conversation (title, archive status)
 * PUT /api/chat/conversations/:id
 */
const updateConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { userId, organizationId } = req.user || {};
  const { title, isArchived } = req.body;

  const conversation = await ChatConversation.findOne({
    where: {
      id: conversationId,
      userId,
      organizationId
    }
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
      message: 'The requested conversation does not exist'
    });
  }

  const updates = {};
  if (title !== undefined) updates.title = title.substring(0, 100);
  if (isArchived !== undefined) updates.isArchived = isArchived;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No updates provided',
      message: 'Please provide title or isArchived fields to update'
    });
  }

  await conversation.update(updates);

  res.json({
    success: true,
    data: {
      conversation: conversation.toJSON()
    },
    message: 'Conversation updated successfully'
  });
});

/**
 * Delete/Archive a conversation
 * DELETE /api/chat/conversations/:id
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { userId, organizationId } = req.user || {};
  const { permanent = false } = req.query;

  const conversation = await ChatConversation.findOne({
    where: {
      id: conversationId,
      userId,
      organizationId
    }
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
      message: 'The requested conversation does not exist'
    });
  }

  if (permanent === 'true') {
    // Permanently delete conversation and messages
    await conversation.destroy();
    
    // Clear session memory
    sessionMemory.delete(conversationId);
    
    res.json({
      success: true,
      message: 'Conversation permanently deleted'
    });
  } else {
    // Soft delete - archive conversation
    await conversation.update({ isArchived: true });
    
    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  }
});

/**
 * Clear session memory (not chat history)
 * POST /api/chat/conversations/:id/clear-session
 */
const clearSessionMemory = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { userId, organizationId } = req.user || {};

  // Verify conversation exists and user has access
  const conversation = await ChatConversation.findOne({
    where: {
      id: conversationId,
      userId,
      organizationId
    }
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
      message: 'The requested conversation does not exist'
    });
  }

  // Clear session memory but keep database history
  if (sessionMemory.has(conversationId)) {
    sessionMemory.get(conversationId).messages = [];
    sessionMemory.get(conversationId).lastCleared = new Date();
  }

  console.log(`🧹 Session memory cleared for conversation ${conversationId}`);

  res.json({
    success: true,
    message: 'Session memory cleared successfully. Chat history preserved.',
    data: {
      conversationId,
      sessionCleared: true,
      clearedAt: new Date()
    }
  });
});

/**
 * Get chat statistics
 * GET /api/chat/stats
 */
const getChatStats = asyncHandler(async (req, res) => {
  const { userId, organizationId } = req.user || {};

  const [
    totalConversations,
    archivedConversations,
    totalMessages,
    avgMessagesResult,
    ragStats
  ] = await Promise.all([
    ChatConversation.count({
      where: { userId, organizationId }
    }),
    ChatConversation.count({
      where: { userId, organizationId, isArchived: true }
    }),
    ChatMessage.count({
      include: [{
        model: ChatConversation,
        as: 'conversation',
        where: { userId, organizationId }
      }]
    }),
    ChatConversation.findAll({
      where: { userId, organizationId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('messageCount')), 'avgMessages']
      ],
      raw: true
    }),
    ragChatService.getRAGStats(organizationId)
  ]);

  // Count active sessions
  let activeSessions = 0;
  const now = new Date();
  for (const session of sessionMemory.values()) {
    if (now - session.lastActivity < maxSessionAge) {
      activeSessions++;
    }
  }

  res.json({
    success: true,
    data: {
      conversations: {
        total: totalConversations,
        active: totalConversations - archivedConversations,
        archived: archivedConversations,
        averageMessages: Math.round(avgMessagesResult[0]?.avgMessages || 0)
      },
      messages: {
        total: totalMessages
      },
      sessions: {
        active: activeSessions,
        memoryLimit: maxSessionMemory,
        maxAge: `${maxSessionAge / (60 * 60 * 1000)} hours`
      },
      rag: ragStats,
      timestamp: new Date()
    }
  });
});

module.exports = {
  sendMessage,
  getConversation,
  listConversations,
  updateConversation,
  deleteConversation,
  clearSessionMemory,
  getChatStats
};