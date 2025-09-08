const ragChatService = require('../services/ragChatService');
const aiGenerationService = require('../services/aiGenerationService');
const AIGenerator = require('../services/ai/aiGenerator'); // Add direct AI generator
const { asyncHandler } = require('../middleware/error.middleware');
const { v4: uuidv4 } = require('uuid');
const { models, sequelize } = require('../database/models');
const { ChatConversation, ChatMessage } = models;
const webSocketService = require('../services/websocketService');
const toolExecutor = require('../tools/common/toolExecutor');

// Session memory storage (in-memory for active sessions)
const sessionMemory = new Map(); // conversationId -> { messages: [], lastActivity: Date }
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
 * Update session memory with new message
 */
const updateSessionMemory = (conversationId, message) => {
  if (!sessionMemory.has(conversationId)) {
    sessionMemory.set(conversationId, { messages: [], lastActivity: new Date() });
  }
  
  const session = sessionMemory.get(conversationId);
  session.messages.push({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp
  });
  
  // Keep only last N messages for context (user + assistant pairs)
  if (session.messages.length > maxSessionMemory * 2) {
    session.messages = session.messages.slice(-maxSessionMemory * 2);
  }
  
  session.lastActivity = new Date();
};

/**
 * Get session memory for conversation
 */
const getSessionMemory = (conversationId) => {
  const session = sessionMemory.get(conversationId);
  return session ? session.messages : [];
};

/**
 * Send a message to AI SOC Consultant
 * POST /api/chat/message
 */
const sendMessage = asyncHandler(async (req, res) => {
  // Mirror AI classification pattern exactly - use same variable extraction
  const organizationId = req.user.organizationId;
  const userId = req.user.id;
  
  console.log('🔍 CHAT DEBUG: User context:', {
    organizationId,
    userId,
    userObject: req.user ? 'present' : 'missing'
  });
  
  const {
    message,
    conversationId,
    ragEnabled = true,
    dataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
    similarityThreshold = 0.55,
    maxResults = 10,
    model = 'default',
    enabledTools = []
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

  const transaction = await sequelize.transaction();
  
  try {
    console.log(`💬 Processing chat message for user ${userId}`);
    console.log(`🔧 RAG enabled: ${ragEnabled}, Data sources: ${dataSources.join(', ')}`);
    console.log(`🛠️ Enabled tools: ${enabledTools.length > 0 ? enabledTools.join(', ') : 'none'}`);

    let conversation;
    let isNewConversation = false;

    if (conversationId) {
      // Find existing conversation
      conversation = await ChatConversation.findOne({
        where: { 
          id: conversationId, 
          userId, 
          organizationId,
          isArchived: false
        },
        transaction
      });

      if (!conversation) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
          message: 'The specified conversation does not exist or access is denied'
        });
      }
    } else {
      // Create new conversation
      isNewConversation = true;
      const title = generateConversationTitle(message);
      
      conversation = await ChatConversation.create({
        userId,
        organizationId,
        title,
        lastActivity: new Date(),
        settings: {
          ragEnabled,
          dataSources,
          model,
          enabledTools
        }
      }, { transaction });

      console.log(`🆕 Created new conversation: ${conversation.id}`);
    }

    // Update conversation settings and activity
    if (!isNewConversation) {
      await conversation.update({
        lastActivity: new Date(),
        settings: {
          ...conversation.settings,
          ragEnabled,
          dataSources: dataSources.length > 0 ? dataSources : conversation.settings.dataSources,
          model: model !== 'default' ? model : conversation.settings.model,
          enabledTools: enabledTools.length > 0 ? enabledTools : conversation.settings.enabledTools || []
        }
      }, { transaction });
    }

    // Get session memory for context
    const sessionMessages = getSessionMemory(conversation.id);
    
    // Build conversation context from session memory
    let conversationContext = '';
    if (sessionMessages.length > 0) {
      conversationContext = '\n\nRecent conversation context:\n' + 
        sessionMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    // Build RAG-enhanced prompt with progress tracking
    let ragPrompt;
    let ragContext = null;
    let searchResults = [];
    let queryAnalysis = null; // Declare outside try block for later use
    
    try {
      // Create consistent messageId for this request
      const messageId = `temp-${Date.now()}`;
      const startTime = Date.now();
      
      // Step 1: Query Analysis
      webSocketService.emitToUser(userId, 'process_step', {
        conversationId: conversation.id,
        messageId,
        step: 'query_analysis',
        status: 'starting',
        message: 'Analyzing query type and intent...',
        timestamp: new Date().toISOString()
      });
      
      // Enhanced query classification
      queryAnalysis = analyzeQuery(message);
      
      webSocketService.emitToUser(userId, 'process_step', {
        conversationId: conversation.id,
        messageId,
        step: 'query_analysis',
        status: 'complete',
        message: `Query type: ${queryAnalysis.type}`,
        details: {
          queryType: queryAnalysis.type,
          confidence: queryAnalysis.confidence,
          detectedEntities: queryAnalysis.entities,
          suggestedStrategy: queryAnalysis.strategy
        },
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      // Create progress callback to emit WebSocket events (throttled)
      let lastProgressEmit = 0;
      const progressThrottle = 500; // 500ms throttle
      
      const progressCallback = (progress) => {
        const now = Date.now();
        if (now - lastProgressEmit > progressThrottle) {
          webSocketService.emitToUser(userId, 'rag_search_progress', {
            conversationId: conversation.id,
            messageId,
            progress
          });
          lastProgressEmit = now;
        }
      };

      // Step 2: RAG Search Strategy Selection
      const ragStartTime = Date.now();
      webSocketService.emitToUser(userId, 'process_step', {
        conversationId: conversation.id,
        messageId,
        step: 'rag_search',
        status: 'starting',
        message: `Searching ${ragEnabled ? dataSources.length : 0} data sources...`,
        details: {
          strategy: queryAnalysis.strategy,
          dataSources: ragEnabled ? dataSources : [],
          similarityThreshold,
          maxResults
        },
        timestamp: new Date().toISOString()
      });

      // Enhanced progress callback for detailed search tracking
      const enhancedProgressCallback = (progress) => {
        progressCallback(progress); // Keep original functionality
        
        // Add detailed search breakdown
        if (progress.searchMetadata) {
          webSocketService.emitToUser(userId, 'rag_search_detailed', {
            conversationId: conversation.id,
            messageId,
            searchBreakdown: progress.searchMetadata.searchBreakdown || [],
            totalTime: progress.searchMetadata.totalSearchTime || 0,
            resultsFound: progress.resultsFound || 0,
            timestamp: new Date().toISOString()
          });
        }
      };

      // Get search results from buildRAGPrompt and reuse them for context
      const promptResult = await ragChatService.buildRAGPromptWithResults(message, {
        dataSources: ragEnabled ? dataSources : [],
        organizationId,
        conversationId: conversation.id,
        ragEnabled,
        similarityThreshold,
        maxResults,
        progressCallback: enhancedProgressCallback
      });
      
      // Emit detailed RAG search completion
      webSocketService.emitToUser(userId, 'process_step', {
        conversationId: conversation.id,
        messageId,
        step: 'rag_search',
        status: 'complete',
        message: `Found ${promptResult.searchResults?.length || 0} relevant items`,
        details: {
          resultsFound: promptResult.searchResults?.length || 0,
          searchTime: Date.now() - ragStartTime,
          topSimilarity: promptResult.searchResults?.[0]?.similarity || 0,
          dataSourceBreakdown: promptResult.ragContext?.searchMetadata?.searchBreakdown || [],
          contextLength: promptResult.ragPrompt?.length || 0
        },
        duration: Date.now() - ragStartTime,
        timestamp: new Date().toISOString()
      });

      ragPrompt = promptResult.prompt;
      searchResults = promptResult.searchResults || [];

      // Add conversation context to prompt
      ragPrompt += conversationContext;

      // Build RAG context from search results (no duplicate search)
      if (ragEnabled && searchResults.length > 0) {
        ragContext = {
          query: message.substring(0, 100),
          resultsFound: searchResults.length,
          sources: searchResults.map(r => ({
            type: r.type,
            id: r.id,
            similarity: parseFloat(r.similarity.toFixed(3))
          }))
        };

        // Include search metadata if available
        if (searchResults._searchMetadata) {
          ragContext.searchMetadata = searchResults._searchMetadata;
        }
      }
    } catch (error) {
      console.error('❌ Failed to build RAG prompt:', error);
      // Emit error to user
      webSocketService.emitToUser(userId, 'rag_search_error', {
        conversationId: conversation.id,
        error: error.message
      });
      // Continue without RAG context
      ragPrompt = `You are an AI Security Operations Center (SOC) Consultant. Please help with: ${message}${conversationContext}`;
    }

    // Generate AI response with tool calling capability
    let aiResponse;
    let toolExecutions = [];
    let lastError;
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    // Step 3: Tool Selection Strategy
    const toolSelectionStartTime = Date.now();
    const allTools = toolExecutor.getToolDefinitionsForGPTOSS();
    
    webSocketService.emitToUser(userId, 'process_step', {
      conversationId: conversation.id,
      messageId: `temp-${Date.now()}`, 
      step: 'tool_selection',
      status: 'starting',
      message: `Selecting from ${allTools.length} available tools...`,
      details: {
        totalToolsAvailable: allTools.length,
        userFilterEnabled: enabledTools.length > 0,
        queryBasedFiltering: true
      },
      timestamp: new Date().toISOString()
    });

    // Get filtered tools based on user selection
    const availableTools = enabledTools.length > 0 
      ? allTools.filter(tool => 
          enabledTools.includes(tool.function.name)
        )
      : allTools;

    // Analyze which tools are most relevant for this query type
    const toolRelevanceAnalysis = analyzeToolRelevance(queryAnalysis || { type: 'general', entities: [], confidence: 0.5 }, availableTools);
    const recommendedTools = toolRelevanceAnalysis.recommended;
    const skippedTools = allTools.length - availableTools.length;

    console.log(`🛠️ Available tools for this request: ${availableTools.length}`);

    // Emit detailed tool selection results
    webSocketService.emitToUser(userId, 'process_step', {
      conversationId: conversation.id,
      messageId: `temp-${Date.now()}`, 
      step: 'tool_selection',
      status: 'complete',
      message: `Selected ${availableTools.length} tools, ${recommendedTools.length} highly relevant`,
      details: {
        selectedTools: availableTools.map(t => t.function.name),
        recommendedTools: recommendedTools,
        skippedTools: skippedTools,
        relevanceScores: toolRelevanceAnalysis.scores,
        selectionReasoning: toolRelevanceAnalysis.reasoning
      },
      duration: Date.now() - toolSelectionStartTime,
      timestamp: new Date().toISOString()
    });

    // Emit tool selection to frontend (keep existing functionality)
    if (enabledTools.length > 0) {
      webSocketService.emitToUser(userId, 'tool_selection_active', {
        conversationId: conversation.id,
        enabledTools,
        availableToolsCount: availableTools.length
      });
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 CHAT DEBUG: Generating AI response with tools (attempt ${attempt}/${maxRetries})...`);
        console.log('🔍 CHAT DEBUG: Generating response with prompt length:', ragPrompt.length);
        
        // Step 4: AI Generation
        const aiGenStartTime = Date.now();
        webSocketService.emitToUser(userId, 'process_step', {
          conversationId: conversation.id,
          messageId: `temp-${Date.now()}`, 
          step: 'ai_generation',
          status: 'starting',
          message: 'Generating AI response with configured provider...',
          details: {
            provider: 'Configured AI Provider (Ollama)',
            attempt: attempt,
            maxRetries: maxRetries,
            promptLength: ragPrompt.length,
            maxTokens: 2000,
            temperature: 0.7,
            contextIncluded: ragContext ? 'RAG context included' : 'No RAG context'
          },
          timestamp: new Date().toISOString()
        });
        
        // Use proper AI generation service with timeout
        const aiResult = await Promise.race([
          aiGenerationService.generateResponse({
            prompt: ragPrompt,
            organizationId,
            userId,
            contextType: 'chat',
            contextId: conversation.id,
            maxTokens: 2000,
            temperature: 0.7
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI generation timeout after 300 seconds')), 300000)
          )
        ]);

        aiResponse = aiResult.content || aiResult.response;
        
        // Emit AI generation completion
        webSocketService.emitToUser(userId, 'process_step', {
          conversationId: conversation.id,
          messageId: `temp-${Date.now()}`, 
          step: 'ai_generation',
          status: 'complete',
          message: `Response generated (${(aiResponse?.length || 0)} characters)`,
          details: {
            responseLength: aiResponse?.length || 0,
            generationTime: Date.now() - aiGenStartTime,
            attempt: attempt,
            model: aiResult.model || 'Unknown',
            tokensUsed: aiResult.tokensUsed || 'Unknown'
          },
          duration: Date.now() - aiGenStartTime,
          timestamp: new Date().toISOString()
        });
        // Note: Tool calling disabled for now - using direct AI provider instead
        toolExecutions = [];

        console.log(`✅ AI response generated successfully on attempt ${attempt} with ${toolExecutions.length} tool calls`);
        
        // Log this successful generation to ai_llm_logs for consistency (optional)
        try {
          // Get proper provider configuration (KISS - use same system as other AI functions)
          const config = await aiGenerationService.getProviderConfig(organizationId);
          
          // Use direct database logging with proper provider information
          const { models } = require('../database/models');
          await models.AILLMLog.create({
            // Core identification fields
            organizationId,
            userId,
            contextType: 'chat',
            contextId: conversation.id,
            
            // Provider information (use actual provider config, not hardcoded)
            providerId: config.providerId,
            providerName: config.providerName, // Will be "Ollama"
            providerType: config.type, // Will be "ollama"
            providerUrl: `http://${config.host}:${config.port}/api/generate`,
            
            // Model and configuration (use config values)
            modelName: config.model,
            maxTokens: 1000,
            temperature: 0.7,
            tokenWindow: config.maxTokenWindow,
            
            // Request/response data (correct field names)
            rawPrompt: ragPrompt.substring(0, 10000), // Truncate if too long
            rawResponse: aiResponse.substring(0, 20000), // Truncate if too long
            
            // Timing and success info
            requestTimestamp: new Date(Date.now() - (aiResult.executionTime || 0)),
            responseTimestamp: new Date(),
            durationMs: aiResult.executionTime || 0,
            success: true,
            
            // Token usage
            inputTokens: aiResult.metadata?.prompt_eval_count || null,
            outputTokens: aiResult.metadata?.eval_count || null,
            
            // HTTP and metadata
            httpStatusCode: 200,
            requestHeaders: null,
            responseHeaders: null,
            providerMetadata: aiResult.metadata || {}
          });
          console.log('✅ Chat response logged to LLM logs using proper Ollama provider config');
        } catch (logError) {
          console.error('⚠️ Failed to log chat to LLM logs (non-critical):', logError.message);
          console.error('⚠️ Logging error details:', logError.errors?.map(e => e.message).join(', ') || 'Unknown error');
        }

        // Execute tools if any were called by the AI
        if (toolExecutions.length > 0) {
          console.log(`🛠️ Executing ${toolExecutions.length} tool calls...`);
          
          for (let i = 0; i < toolExecutions.length; i++) {
            const toolCall = toolExecutions[i];
            
            // Emit tool execution start event
            webSocketService.emitToUser(userId, 'tool_execution_start', {
              conversationId: conversation.id,
              toolName: toolCall.function.name,
              toolIndex: i,
              totalTools: toolExecutions.length,
              parameters: toolCall.function.arguments
            });

            try {
              console.log(`🔧 Executing tool: ${toolCall.function.name}`);
              
              const toolResult = await toolExecutor.executeToolWithFilter(
                toolCall.function.name,
                typeof toolCall.function.arguments === 'string' 
                  ? JSON.parse(toolCall.function.arguments)
                  : toolCall.function.arguments,
                { 
                  userId, 
                  organizationId, 
                  enabledTools,
                  conversationId: conversation.id 
                }
              );

              // Update tool execution with result
              toolExecutions[i].result = toolResult;

              // Emit tool execution complete event
              webSocketService.emitToUser(userId, 'tool_execution_complete', {
                conversationId: conversation.id,
                toolName: toolCall.function.name,
                toolIndex: i,
                totalTools: toolExecutions.length,
                result: toolResult,
                success: true
              });

              console.log(`✅ Tool ${toolCall.function.name} executed successfully`);
              
            } catch (toolError) {
              console.error(`❌ Tool execution failed for ${toolCall.function.name}:`, toolError);
              
              toolExecutions[i].error = toolError.message;

              // Emit tool execution error event
              webSocketService.emitToUser(userId, 'tool_execution_error', {
                conversationId: conversation.id,
                toolName: toolCall.function.name,
                toolIndex: i,
                totalTools: toolExecutions.length,
                error: toolError.message
              });
            }
          }
        }
        
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        console.error(`❌ AI response generation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        // Emit AI generation error to frontend
        webSocketService.emitToUser(userId, 'process_step', {
          conversationId: conversation.id,
          messageId: `temp-${Date.now()}`, 
          step: 'ai_generation',
          status: 'error',
          message: `AI generation failed: ${error.message}`,
          details: {
            attempt: attempt,
            maxRetries: maxRetries,
            errorType: error.constructor.name,
            errorMessage: error.message
          },
          timestamp: new Date().toISOString()
        });
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // If all retries failed, show error message
    if (!aiResponse) {
      console.error('❌ All AI generation attempts failed. Showing error message to user.');
      
      const errorMessage = lastError ? lastError.message : 'Unknown error - response was empty';
      aiResponse = '🚨 **AI Provider Unavailable**\n\nThe AI provider failed to respond after 3 attempts. This could be due to:\n\n• AI provider service is down\n• Network connectivity issues\n• Provider overload\n\nPlease try again in a few moments or contact your administrator.\n\n*Error details: ' + errorMessage + '*';
      
      // Emit error to user via WebSocket for real-time feedback
      webSocketService.emitToUser(userId, 'ai_provider_error', {
        conversationId: conversation.id,
        error: errorMessage,
        attempts: maxRetries,
        timestamp: new Date().toISOString()
      });
    }

    // Create user message in database
    const userMessage = await ChatMessage.create({
      conversationId: conversation.id,
      role: 'user',
      content: message.trim(),
      ragEnabled: false
    }, { transaction });

    // Create assistant message in database
    const assistantMessage = await ChatMessage.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse,
      ragEnabled,
      ragContext,
      metadata: {
        toolExecutions: toolExecutions.length > 0 ? toolExecutions : undefined,
        enabledTools: enabledTools.length > 0 ? enabledTools : undefined,
        toolsUsed: toolExecutions.length
      }
    }, { transaction });

    // Update session memory
    updateSessionMemory(conversation.id, userMessage);
    updateSessionMemory(conversation.id, assistantMessage);

    await transaction.commit();

    console.log(`✅ Chat response generated for conversation ${conversation.id}`);

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        isNewConversation,
        message: assistantMessage,
        conversation: {
          id: conversation.id,
          messageCount: conversation.messageCount + 2, // user + assistant
          settings: conversation.settings,
          lastActivity: conversation.lastActivity,
          title: conversation.title
        },
        sessionMemory: sessionMessages.length
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Failed to process chat message:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process chat message. Please try again.'
    });
  }
});

/**
 * Get conversation history
 * GET /api/chat/conversations/:id
 */
const getConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { id: userId, organizationId } = req.user || {};
  const { limit = 50, offset = 0 } = req.query;

  try {
    const conversation = await ChatConversation.findOne({
      where: { 
        id: conversationId, 
        userId, 
        organizationId,
        isArchived: false
      },
      include: [{
        model: ChatMessage,
        as: 'messages',
        limit: Math.min(parseInt(limit), 100),
        offset: parseInt(offset),
        order: [['createdAt', 'ASC']]
      }]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        message: 'The requested conversation does not exist or access is denied'
      });
    }

    // Get session memory info
    const sessionMemory = getSessionMemory(conversationId);

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          lastActivity: conversation.lastActivity,
          settings: conversation.settings,
          messageCount: conversation.messageCount
        },
        messages: conversation.messages || [],
        sessionMemory: {
          messageCount: sessionMemory.length,
          lastActivity: sessionMemory.length > 0 ? 
            sessionMemory[sessionMemory.length - 1].timestamp : null
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to get conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load conversation'
    });
  }
});

/**
 * List user's conversations
 * GET /api/chat/conversations
 */
const listConversations = asyncHandler(async (req, res) => {
  const { id: userId, organizationId } = req.user || {};
  const { 
    limit = 20, 
    offset = 0, 
    includeArchived = false, 
    search 
  } = req.query;

  try {
    console.log(`📋 Listing conversations for user ${userId}, org ${organizationId}`);

    const where = { 
      userId, 
      organizationId
    };

    if (!includeArchived) {
      where.isArchived = false;
    }

    if (search) {
      where.title = { [sequelize.Op.iLike]: `%${search}%` };
    }

    // First get conversations without the problematic include
    const conversations = await ChatConversation.findAll({
      where,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['lastActivity', 'DESC']]
    });

    console.log(`✅ Found ${conversations.length} conversations`);

    const total = await ChatConversation.count({ where });

    // Manually get the last message for each conversation to avoid the complex UNION query
    const formattedConversations = [];
    for (const conv of conversations) {
      try {
        // Get the most recent message for this conversation
        const lastMessage = await ChatMessage.findOne({
          where: { conversationId: conv.id },
          order: [['timestamp', 'DESC']]
        });

        formattedConversations.push({
          id: conv.id,
          title: conv.title,
          messageCount: conv.messageCount,
          settings: conv.settings,
          lastActivity: conv.lastActivity,
          createdAt: conv.createdAt,
          isArchived: conv.isArchived,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            role: lastMessage.role,
            content: lastMessage.content.length > 100 
              ? lastMessage.content.substring(0, 100) + '...' 
              : lastMessage.content,
            timestamp: lastMessage.timestamp
          } : null
        });
      } catch (msgError) {
        console.error(`❌ Error getting last message for conversation ${conv.id}:`, msgError);
        // Still include the conversation without the last message
        formattedConversations.push({
          id: conv.id,
          title: conv.title,
          messageCount: conv.messageCount,
          settings: conv.settings,
          lastActivity: conv.lastActivity,
          createdAt: conv.createdAt,
          isArchived: conv.isArchived,
          lastMessage: null
        });
      }
    }

    console.log(`✅ Successfully formatted ${formattedConversations.length} conversations`);

    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to list conversations:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: `Failed to load conversations: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? {
        error: error.name,
        sql: error.sql
      } : undefined
    });
  }
});

/**
 * Delete a conversation
 * DELETE /api/chat/conversations/:id
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { id: userId, organizationId } = req.user || {};
  const { permanent = false } = req.query;

  try {
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
        message: 'The requested conversation does not exist or access is denied'
      });
    }

    if (permanent === 'true') {
      // Permanently delete conversation and all messages
      await ChatMessage.destroy({
        where: { conversationId }
      });
      
      await conversation.destroy();
      
      // Clear session memory
      sessionMemory.delete(conversationId);

      res.json({
        success: true,
        message: 'Conversation permanently deleted'
      });
    } else {
      // Archive conversation
      await conversation.update({ 
        isArchived: true,
        lastActivity: new Date()
      });

      res.json({
        success: true,
        message: 'Conversation archived successfully'
      });
    }
  } catch (error) {
    console.error('❌ Failed to delete conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete conversation'
    });
  }
});

/**
 * Update conversation (title, archive status)
 * PUT /api/chat/conversations/:id
 */
const updateConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { id: userId, organizationId } = req.user || {};
  const { title, isArchived } = req.body;

  try {
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
        message: 'The requested conversation does not exist or access is denied'
      });
    }

    const updates = {};
    if (title && title.trim()) {
      updates.title = title.trim().substring(0, 100);
    }
    if (typeof isArchived === 'boolean') {
      updates.isArchived = isArchived;
    }
    updates.lastActivity = new Date();

    await conversation.update(updates);

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messageCount: conversation.messageCount,
          settings: conversation.settings,
          lastActivity: conversation.lastActivity,
          isArchived: conversation.isArchived
        }
      },
      message: 'Conversation updated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to update conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update conversation'
    });
  }
});

/**
 * Update conversation settings
 * PUT /api/chat/conversations/:id/settings
 */
const updateConversationSettings = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { id: userId, organizationId } = req.user || {};
  const { ragEnabled, dataSources, model } = req.body;

  try {
    const conversation = await ChatConversation.findOne({
      where: { 
        id: conversationId, 
        userId, 
        organizationId,
        isArchived: false
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        message: 'The requested conversation does not exist or access is denied'
      });
    }

    const currentSettings = conversation.settings || {};
    const newSettings = { ...currentSettings };

    // Update settings
    if (typeof ragEnabled === 'boolean') {
      newSettings.ragEnabled = ragEnabled;
    }

    if (Array.isArray(dataSources)) {
      const validSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
      const filteredSources = dataSources.filter(source => validSources.includes(source));
      newSettings.dataSources = filteredSources;
    }

    if (model && typeof model === 'string') {
      newSettings.model = model;
    }

    await conversation.update({
      settings: newSettings,
      lastActivity: new Date()
    });

    res.json({
      success: true,
      data: {
        conversationId,
        settings: newSettings
      },
      message: 'Conversation settings updated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to update conversation settings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update conversation settings'
    });
  }
});

/**
 * Clear session memory (not chat history)
 * POST /api/chat/conversations/:id/clear-session
 */
const clearSessionMemory = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { id: userId, organizationId } = req.user || {};

  try {
    const conversation = await ChatConversation.findOne({
      where: { 
        id: conversationId, 
        userId, 
        organizationId,
        isArchived: false
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        message: 'The requested conversation does not exist or access is denied'
      });
    }

    // Clear session memory
    sessionMemory.delete(conversationId);

    console.log(`🧹 Cleared session memory for conversation ${conversationId}`);

    res.json({
      success: true,
      data: {
        conversationId,
        sessionCleared: true,
        clearedAt: new Date().toISOString()
      },
      message: 'Session memory cleared successfully'
    });
  } catch (error) {
    console.error('❌ Failed to clear session memory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear session memory'
    });
  }
});

/**
 * Get chat statistics
 * GET /api/chat/stats
 */
const getChatStats = asyncHandler(async (req, res) => {
  const { id: userId, organizationId } = req.user || {};

  try {
    const where = { organizationId };
    if (userId) {
      where.userId = userId;
    }

    const [conversationStats, messageStats] = await Promise.all([
      ChatConversation.findAll({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN is_archived = false THEN 1 END")), 'active'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN is_archived = true THEN 1 END")), 'archived'],
          [sequelize.fn('AVG', sequelize.col('message_count')), 'averageMessages']
        ],
        raw: true
      }),
      ChatMessage.findAll({
        include: [{
          model: ChatConversation,
          as: 'conversation',
          where,
          attributes: []
        }],
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('ChatMessage.id')), 'total']
        ],
        raw: true
      })
    ]);

    const stats = conversationStats[0] || {};
    const messageCount = messageStats[0]?.total || 0;

    // Get RAG statistics
    let ragStats = {};
    try {
      ragStats = await ragChatService.getRAGStats(organizationId);
    } catch (error) {
      console.error('❌ Failed to get RAG stats:', error);
      ragStats = {
        totalRecords: 0,
        embeddedRecords: 0,
        overallCoverage: 0,
        modelInfo: { name: 'unknown', dimensions: 0, initialized: false }
      };
    }

    // Get session memory statistics
    const activeSessions = sessionMemory.size;
    const sessionStats = {
      active: activeSessions,
      memoryLimit: maxSessionMemory,
      maxAge: `${maxSessionAge / (60 * 60 * 1000)} hours`
    };

    res.json({
      success: true,
      data: {
        conversations: {
          total: parseInt(stats.total) || 0,
          active: parseInt(stats.active) || 0,
          archived: parseInt(stats.archived) || 0,
          averageMessages: Math.round(parseFloat(stats.averageMessages)) || 0
        },
        messages: {
          total: parseInt(messageCount) || 0
        },
        sessions: sessionStats,
        rag: ragStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Failed to get chat statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load chat statistics'
    });
  }
});

/**
 * Get available AI tools
 */
const getAvailableTools = asyncHandler(async (req, res) => {
  try {
    console.log('🚀 getAvailableTools endpoint called');
    const toolExecutor = require('../tools/common/toolExecutor');
    console.log('✅ toolExecutor loaded');
    
    // Get available tools from toolExecutor - use the correct method that returns an array
    const availableTools = toolExecutor.getToolDefinitionsForGPTOSS();
    console.log('🔧 Got tools:', availableTools?.length || 0);
    
    console.log(`🛠️ Loading ${availableTools.length} tools for API response`);
    
    // Group tools by category
    const toolsByCategory = {};
    
    availableTools.forEach(tool => {
      const category = tool.function.category || 'Uncategorized';
      
      if (!toolsByCategory[category]) {
        toolsByCategory[category] = {
          category: category,
          tools: []
        };
      }
      
      toolsByCategory[category].tools.push({
        name: tool.function.name,
        displayName: tool.function.description.split(' - ')[0] || tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      });
    });
    
    const categorizedTools = Object.values(toolsByCategory);
    
    console.log(`✅ Returning ${availableTools.length} tools in ${categorizedTools.length} categories:`, 
      categorizedTools.map(cat => `${cat.category}: ${cat.tools.length} tools`).join(', ')
    );
    
    res.json({
      success: true,
      data: categorizedTools,
      message: `Loaded ${availableTools.length} tools across ${categorizedTools.length} categories`
    });
  } catch (error) {
    console.error('❌ Error getting available tools:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load available tools',
      details: error.message
    });
  }
});

/**
 * Analyze query to determine type and strategy
 */
function analyzeQuery(message) {
  const query = message.toLowerCase();
  
  // UUID pattern detection
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const hasUuid = uuidPattern.test(message);
  
  // Entity detection patterns
  const entities = {
    alertKeywords: /\b(alert|alerts|security event|incident|threat)\b/i.test(query),
    severityKeywords: /\b(critical|high|medium|low|severity)\b/i.test(query),
    timeKeywords: /\b(recent|last|today|yesterday|week|month|24\s*hours?)\b/i.test(query),
    assetKeywords: /\b(asset|server|workstation|host|device|system)\b/i.test(query),
    searchKeywords: /\b(show|find|search|get|list|display)\b/i.test(query),
    analysisKeywords: /\b(analyze|analysis|investigate|review|explain)\b/i.test(query)
  };
  
  // Determine query type and strategy
  let queryType = 'general';
  let strategy = 'semantic_search';
  let confidence = 0.5;
  
  if (hasUuid) {
    queryType = 'specific_record';
    strategy = 'direct_lookup';
    confidence = 0.95;
  } else if (entities.alertKeywords && (entities.severityKeywords || entities.timeKeywords)) {
    queryType = 'structured_filter';
    strategy = 'structured_query';
    confidence = 0.85;
  } else if (entities.searchKeywords && (entities.alertKeywords || entities.assetKeywords)) {
    queryType = 'filtered_search';
    strategy = 'hybrid_search';
    confidence = 0.75;
  } else if (entities.analysisKeywords) {
    queryType = 'analytical';
    strategy = 'semantic_search';
    confidence = 0.7;
  }
  
  return {
    type: queryType,
    confidence,
    entities: Object.keys(entities).filter(key => entities[key]),
    strategy,
    hasUuid,
    patterns: {
      uuid: hasUuid,
      structured: entities.severityKeywords || entities.timeKeywords,
      analytical: entities.analysisKeywords,
      search: entities.searchKeywords
    }
  };
}

/**
 * Analyze tool relevance for the given query
 */
function analyzeToolRelevance(queryAnalysis, availableTools) {
  const scores = {};
  const recommended = [];
  const reasoning = {};
  
  availableTools.forEach(tool => {
    const toolName = tool.function.name;
    let score = 0.1; // Base score
    let reasons = [];
    
    // Score based on query type
    if (queryAnalysis.type === 'specific_record' && toolName.includes('specific_')) {
      score += 0.8;
      reasons.push('Specific record lookup detected');
    }
    
    if (queryAnalysis.type === 'structured_filter' && 
        (toolName.includes('get_') || toolName.includes('search_'))) {
      score += 0.6;
      reasons.push('Structured query pattern');
    }
    
    if (queryAnalysis.type === 'analytical' && 
        (toolName.includes('analyze_') || toolName.includes('generate_'))) {
      score += 0.7;
      reasons.push('Analytical query detected');
    }
    
    // Score based on detected entities
    queryAnalysis.entities.forEach(entity => {
      if (entity === 'alertKeywords' && toolName.includes('alert')) {
        score += 0.5;
        reasons.push('Alert-related tool');
      }
      if (entity === 'severityKeywords' && toolName.includes('critical')) {
        score += 0.3;
        reasons.push('Severity filtering capability');
      }
      if (entity === 'timeKeywords' && toolName.includes('latest')) {
        score += 0.3;
        reasons.push('Time-based filtering');
      }
    });
    
    // Penalize overly broad tools for specific queries
    if (queryAnalysis.confidence > 0.8 && toolName.includes('hybrid')) {
      score -= 0.2;
      reasons.push('Too broad for specific query');
    }
    
    scores[toolName] = Math.min(score, 1.0);
    reasoning[toolName] = reasons;
    
    if (score >= 0.6) {
      recommended.push(toolName);
    }
  });
  
  return {
    scores,
    recommended,
    reasoning
  };
}

module.exports = {
  sendMessage,
  getConversation,
  listConversations,
  deleteConversation,
  updateConversation,
  updateConversationSettings,
  clearSessionMemory,
  getChatStats,
  getAvailableTools
};