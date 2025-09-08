const aiProviderService = require('./aiProviderService');
const { providerRegistry } = require('./providers');

class AIGenerationService {
  constructor() {
    // No hardcoded configuration - all settings come from active provider
    this.providerCache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache for provider config
  }

  /**
   * Get provider configuration for an organization
   */
  async getProviderConfig(organizationId) {
    // Check cache first
    const cached = this.providerCache.get(organizationId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.config;
    }

    // Get fresh config from AI provider service
    const [providerConfig, globalSettings] = await Promise.all([
      aiProviderService.getProviderConfig(organizationId),
      aiProviderService.getGlobalSettings(organizationId)
    ]);

    const config = {
      ...providerConfig,
      ...globalSettings
    };

    // Cache the result
    this.providerCache.set(organizationId, {
      config,
      timestamp: Date.now()
    });

    return config;
  }

  /**
   * Check if AI provider is available and model is loaded
   */
  async checkConnection(organizationId) {
    const startTime = Date.now();
    const config = await this.getProviderConfig(organizationId);
    
    try {
      // Use provider registry for connection checking
      const result = await providerRegistry.checkConnection(config.type, config, organizationId);
      
      // Update provider health
      const connectionTime = Date.now() - startTime;
      if (result.connected && result.availableModels) {
        await aiProviderService.updateProviderHealth(organizationId, true, connectionTime, result.availableModels);
      } else {
        await aiProviderService.updateProviderHealth(organizationId, false, connectionTime);
      }
      
      // Add provider info to result
      result.providerInfo = aiProviderService.formatProviderInfo(config);
      
      return result;
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      console.error('AI provider connection check failed:', error.message);
      
      // Update provider health
      await aiProviderService.updateProviderHealth(organizationId, false, connectionTime);
      
      return {
        connected: false,
        modelAvailable: false,
        error: error.message,
        connectionTime,
        endpoint: `http://${config.host}:${config.port}`,
        providerInfo: aiProviderService.formatProviderInfo(config),
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate AI response for chat using active provider
   */
  async generateResponse(options = {}) {
    const { prompt, organizationId, model, maxTokens, temperature, userId, contextType, contextId } = options;
    
    if (!organizationId) {
      throw new Error('organizationId is required for AI generation');
    }
    
    try {
      const config = await this.getProviderConfig(organizationId);
      
      console.log('🤖 Generating AI response...');
      console.log('📝 Prompt length:', prompt.length);
      console.log('🔧 Provider:', config.type);
      console.log('🏠 Host:', `${config.host}:${config.port}`);
      console.log('🤖 Model:', model || config.model);
      
      // Check if provider is available first
      const connectionStatus = await this.checkConnection(organizationId);
      if (!connectionStatus.connected) {
        throw new Error('AI provider is not available. Please check your AI provider configuration and ensure the service is running.');
      }
      
      // Use the active provider API
      const response = await this.callProvider({
        prompt,
        config,
        model: model || config.model,
        maxTokens: maxTokens || config.maxTokens,
        temperature: temperature || config.temperature,
        organizationId,
        userId,
        contextType,
        contextId
      });
      
      return {
        response,
        content: response,
        model: model || config.model,
        provider: {
          type: config.type,
          name: config.providerName,
          isFallback: config.isFallback
        },
        usage: {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil(response.length / 4),
          totalTokens: Math.ceil((prompt.length + response.length) / 4)
        }
      };
    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }
  
  /**
   * Generate AI response for testing purposes (no fallbacks)
   * This method fails fast and does not provide stub responses
   */
  async generateTestResponse(options = {}) {
    const { prompt, organizationId, model, maxTokens, temperature, userId, contextType, contextId } = options;
    
    if (!organizationId) {
      throw new Error('organizationId is required for AI generation');
    }
    
    const config = await this.getProviderConfig(organizationId);
    
    console.log('🧪 Testing AI response (no fallbacks)...');
    console.log('📝 Prompt length:', prompt.length);
    console.log('🔧 Provider:', config.type);
    console.log('🏠 Host:', `${config.host}:${config.port}`);
    console.log('🤖 Model:', model || config.model);
    console.log('⏱️ Timeout:', config.generationTimeout || 120000, 'ms');
    console.log('🔍 DEBUG: Context params:', { userId, contextType, contextId });
    
    // Direct provider call without connection check or fallbacks
    const response = await this.callProvider({
      prompt,
      config,
      model: model || config.model,
      maxTokens: maxTokens || config.maxTokens,
      temperature: temperature || config.temperature,
      timeout: config.generationTimeout || 120000,
      organizationId,
      userId,
      contextType,
      contextId
    });
    
    return {
      response,
      content: response,
      model: model || config.model,
      provider: {
        type: config.type,
        name: config.providerName,
        isFallback: false
      },
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((prompt.length + response.length) / 4)
      }
    };
  }

  /**
   * Draft additional information fields for incident using tool-based approach
   */
  async draftAdditionalInformation(context) {
    const { incident, relatedAlerts, timeline, organizationId } = context;
    
    if (!organizationId) {
      throw new Error('organizationId is required for AI drafting');
    }
    
    try {
      console.log('🤖 Drafting additional information using tool-based approach for incident:', incident.id);
      
      // Use tool-based approach instead of direct AI calls
      return await this.draftAdditionalInformationWithTools(context);
      
    } catch (error) {
      console.error('❌ AI drafting failed:', error);
      throw new Error(`AI drafting failed: ${error.message}`);
    }
  }

  /**
   * Draft additional information using tool-based approach
   */
  async draftAdditionalInformationWithTools(context) {
    const { incident, relatedAlerts, timeline, organizationId } = context;
    
    try {
      console.log('🛠️ Using tool-based drafting approach for incident:', incident.id);
      
      const toolExecutor = require('../tools/common/toolExecutor');
      const toolContext = { organizationId, userId: null, contextType: 'incident_draft', contextId: incident.id };
      
      // Step 1: Analyze incident context
      const contextAnalysis = await toolExecutor.executeTool(
        'analyze_incident_context',
        {
          incidentId: incident.id,
          includeRelatedAlerts: true,
          includeTimeline: true,
          analysisDepth: 'detailed',
          organizationId,
          userId: null
        },
        {
          sessionId: `incident_draft_${incident.id}_${Date.now()}`,
          userId: null,
          organizationId
        }
      );
      
      if (!contextAnalysis.success || !contextAnalysis.result.success) {
        throw new Error('Failed to analyze incident context');
      }
      
      const incidentContext = contextAnalysis.result.context;
      const draftedFields = {};
      const fieldResults = {};
      
      // Step 2: Draft each field type using specialized tools
      const fieldsToGenerate = [
        { field: 'responseplan', tool: 'draft_response_plan' },
        { field: 'impactassessment', tool: 'draft_impact_assessment' },
        { field: 'investigationplan', tool: 'draft_investigation_plan' },
        { field: 'containmentstrategy', tool: 'draft_containment_strategy' },
        { field: 'estimatedtimeline', tool: 'draft_estimated_timeline' }
      ];
      
      // Check existing content to avoid overwriting
      const existingMetadata = incident.metadata || {};
      
      for (const { field, tool } of fieldsToGenerate) {
        // Skip if field already has content
        if (existingMetadata[field] && existingMetadata[field].trim().length > 0) {
          console.log(`⏭️ Skipping ${field} - already has content`);
          continue;
        }
        
        try {
          console.log(`🔧 Generating content for ${field} using ${tool}...`);
          
          const toolResult = await toolExecutor.executeTool(
            tool,
            {
              incidentContext,
              organizationId,
              userId: null,
              // Add field-specific parameters
              ...(tool === 'draft_response_plan' && { responseApproach: 'structured', includeStakeholders: true }),
              ...(tool === 'draft_impact_assessment' && { assessmentScope: 'comprehensive', includeFinancialImpact: true }),
              ...(tool === 'draft_investigation_plan' && { investigationApproach: 'combined', evidencePreservation: true }),
              ...(tool === 'draft_containment_strategy' && { containmentApproach: 'hybrid', balanceOperations: true }),
              ...(tool === 'draft_estimated_timeline' && { timelineScope: 'full_lifecycle', includeMilestones: true })
            },
            {
              sessionId: `incident_draft_${incident.id}_${Date.now()}`,
              userId: null,
              organizationId
            }
          );
          
          if (toolResult.success && toolResult.result.success) {
            draftedFields[field] = toolResult.result.content;
            fieldResults[field] = {
              success: true,
              contentType: toolResult.result.contentType,
              metadata: toolResult.result.metadata
            };
            console.log(`✅ Successfully generated ${field} (${toolResult.result.content.length} chars)`);
          } else {
            console.warn(`⚠️ Failed to generate ${field}: ${toolResult.error || toolResult.result?.error || 'Unknown error'}`);
            fieldResults[field] = {
              success: false,
              error: toolResult.error || toolResult.result?.error || 'Unknown error'
            };
          }
        } catch (fieldError) {
          console.error(`❌ Error generating ${field}:`, fieldError);
          fieldResults[field] = {
            success: false,
            error: fieldError.message
          };
        }
      }
      
      // Calculate confidence based on successful generations
      const totalFields = fieldsToGenerate.length;
      const successfulFields = Object.keys(draftedFields).length;
      const confidence = totalFields > 0 ? Math.round((successfulFields / totalFields) * 100) : 0;
      
      console.log(`🎯 Tool-based drafting completed: ${successfulFields}/${totalFields} fields generated (${confidence}% success)`);
      
      return {
        draftedFields,
        confidence,
        fieldsGenerated: successfulFields,
        totalFields,
        fieldResults,
        approach: 'tool_based',
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Tool-based drafting failed:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for additional information drafting
   */
  buildAdditionalInfoPrompt(incident, relatedAlerts, timeline) {
    const alertsContext = relatedAlerts.length > 0 
      ? relatedAlerts.map(alert => `
ALERT: ${alert.title}
- Severity: ${alert.severity}/5
- Source: ${alert.sourceSystem}
- Asset: ${alert.assetName || 'Unknown'}
- Description: ${alert.description || 'No description'}
- AI Analysis: ${alert.aiAnalysis ? JSON.stringify(alert.aiAnalysis).substring(0, 500) : 'None'}
`).join('\n')
      : 'No related alerts';

    const timelineContext = timeline.length > 0
      ? timeline.map(event => `${event.timestamp}: ${event.title} - ${event.description || ''}`).join('\n')
      : 'No timeline events';

    return `You are an expert SOC analyst tasked with drafting comprehensive additional information for a security incident. Use the provided context to generate professional, actionable content for each field.

INCIDENT CONTEXT:
=================
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity}/5 (1=Low, 5=Critical)
Status: ${incident.status}
Category: ${incident.category}
Created: ${incident.createdAt}

RELATED ALERTS:
===============
${alertsContext}

TIMELINE EVENTS:
===============
${timelineContext}

EXISTING FIELDS:
===============
Response Plan: ${incident.metadata.responseplan || 'Empty'}
Impact Assessment: ${incident.metadata.impactAssessment || 'Empty'}
Investigation Plan: ${incident.metadata.investigationPlan || 'Empty'}
Containment Strategy: ${incident.metadata.containmentStrategy || 'Empty'}
Estimated Timeline: ${incident.metadata.estimatedTimeline || 'Empty'}

TASK:
=====
Draft professional content for the additional information fields. Only provide content for fields that are currently empty or need improvement. Generate content that is:
- Specific to this incident based on the context provided
- Actionable and practical for SOC analysts
- Appropriately detailed for the severity level
- Professional and well-structured

Return your response in this exact JSON format:
{
  "responseplan": "detailed response plan if needed",
  "impactassessment": "business impact analysis if needed", 
  "investigationplan": "step-by-step investigation approach if needed",
  "containmentstrategy": "containment measures if needed",
  "estimatedtimeline": "realistic timeline estimate if needed"
}

Only include fields that need content. If a field already has good content, omit it from the response.`;
  }

  /**
   * Parse AI response for additional information
   */
  parseAdditionalInfoResponse(response, incident) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Filter out empty values
        const draftedFields = {};
        Object.keys(parsed).forEach(key => {
          if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].trim().length > 0) {
            draftedFields[key] = parsed[key].trim();
          }
        });
        
        return {
          draftedFields,
          confidence: Object.keys(draftedFields).length > 0 ? 90 : 70,
          fieldsGenerated: Object.keys(draftedFields).length
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      throw new Error(`AI response parsing failed: ${error.message}`);
    }
    
    // If no JSON structure found, throw error
    throw new Error('No valid JSON structure found in AI response');
  }


  /**
   * Call AI provider API with prompt
   */
  async callProvider({ prompt, config, model, maxTokens, temperature, timeout, organizationId, userId, contextType, contextId }) {
    try {
      // Use provider registry for text generation
      const options = {
        model,
        maxTokens,
        temperature,
        timeout: timeout || config.generationTimeout || 120000,
        organizationId,
        userId,
        contextType,
        contextId
      };
      
      console.log('🔧 Provider call timeout:', options.timeout, 'ms');
      
      return await providerRegistry.generateText(config.type, config, prompt, options);
    } catch (error) {
      // Re-throw with consistent error handling
      throw error;
    }
  }

  /**
   * Get available models from active provider
   */
  async getAvailableModels(organizationId) {
    const config = await this.getProviderConfig(organizationId);
    
    try {
      return await providerRegistry.getAvailableModels(config.type, config);
    } catch (error) {
      console.error('Failed to get available models:', error.message);
      return [];
    }
  }

  /**
   * Validate provider configuration
   */
  async validateProviderConfig(type, config) {
    try {
      return providerRegistry.validateProviderConfig(type, config);
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Get provider status information
   */
  async getProviderStatus(organizationId) {
    const config = await this.getProviderConfig(organizationId);
    
    try {
      return await providerRegistry.getProviderStatus(config.type, config, organizationId);
    } catch (error) {
      return {
        type: config.type,
        valid: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new AIGenerationService();