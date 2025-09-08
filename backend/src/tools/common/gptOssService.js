const axios = require('axios');
const { MITRE_TOOLS } = require('../mitre/mitreTools');

/**
 * GPT-OSS Service with HIGH Reasoning Effort
 * Integrates with HuggingFace GPT-OSS inference providers for tool calling
 * Based on: https://huggingface.co/docs/inference-providers/en/guides/gpt-oss
 */

class GPTOSSService {
  constructor() {
    this.baseUrl = process.env.VLLM_HOST || 'http://localhost:8000';
    this.model = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
    this.timeout = parseInt(process.env.OLLAMA_GENERATION_TIMEOUT) || 900000;
    this.reasoningEffort = 'high'; // HIGH reasoning effort for accurate MITRE analysis
    
    console.log(`🤖 GPT-OSS Service initialized: ${this.baseUrl} with ${this.model}`);
  }

  /**
   * Generate response with tool calling capability
   * @param {string} userPrompt - User's input prompt
   * @param {Array} availableTools - Available tools for the AI to use
   * @param {Object} context - Additional context (session, user, etc.)
   * @returns {Object} AI response with tool calls
   */
  async generateWithTools(userPrompt, availableTools = MITRE_TOOLS, context = {}) {
    try {
      console.log(`🧠 Generating GPT-OSS response with ${availableTools.length} tools available`);

      const systemPrompt = this.buildSystemPrompt(availableTools);
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user', 
          content: userPrompt
        }
      ];

      const requestData = {
        model: this.model,
        messages,
        tools: availableTools,
        tool_choice: 'auto',
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 4096,
        reasoning_effort: this.reasoningEffort,
        stream: false
      };

      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, requestData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy-key'}`,
        }
      });

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('Invalid response from GPT-OSS service');
      }

      const choice = response.data.choices[0];
      const message = choice.message;

      console.log(`✅ GPT-OSS response generated (${response.data.usage?.total_tokens || 0} tokens)`);

      return {
        success: true,
        response: {
          content: message.content,
          tool_calls: message.tool_calls || [],
          reasoning: choice.reasoning || null,
          finish_reason: choice.finish_reason
        },
        usage: response.data.usage || {},
        model: this.model,
        reasoning_effort: this.reasoningEffort,
        context
      };

    } catch (error) {
      console.error('❌ GPT-OSS generation error:', error.message);
      
      return {
        success: false,
        error: error.message,
        model: this.model,
        reasoning_effort: this.reasoningEffort,
        context
      };
    }
  }

  /**
   * Process tool calls and generate follow-up response
   * @param {Array} toolCalls - Tool calls from AI
   * @param {Array} toolResults - Results from tool execution
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} context - Context information
   * @returns {Object} Follow-up AI response
   */
  async processToolResults(toolCalls, toolResults, conversationHistory, context = {}) {
    try {
      console.log(`🔄 Processing ${toolResults.length} tool results`);

      // Build tool result messages
      const toolMessages = toolCalls.map((toolCall, index) => {
        const result = toolResults[index];
        return {
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result.success ? result.result : { error: result.error })
        };
      });

      // Create follow-up messages
      const messages = [
        ...conversationHistory,
        ...toolMessages
      ];

      const requestData = {
        model: this.model,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
        reasoning_effort: this.reasoningEffort,
        stream: false
      };

      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, requestData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy-key'}`,
        }
      });

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('Invalid response from GPT-OSS service');
      }

      const choice = response.data.choices[0];
      const message = choice.message;

      console.log(`✅ Tool results processed successfully`);

      return {
        success: true,
        response: {
          content: message.content,
          reasoning: choice.reasoning || null,
          finish_reason: choice.finish_reason
        },
        usage: response.data.usage || {},
        model: this.model,
        reasoning_effort: this.reasoningEffort,
        tool_results_used: toolResults.length,
        context
      };

    } catch (error) {
      console.error('❌ Error processing tool results:', error.message);
      
      return {
        success: false,
        error: error.message,
        model: this.model,
        reasoning_effort: this.reasoningEffort,
        context
      };
    }
  }

  /**
   * Build system prompt for MITRE ATT&CK focused interactions
   * @param {Array} availableTools - Available tools
   * @returns {string} System prompt
   */
  buildSystemPrompt(availableTools) {
    return `You are an expert cybersecurity analyst specializing in MITRE ATT&CK framework analysis and threat hunting. You have access to comprehensive MITRE ATT&CK tools for analyzing threats, techniques, and attack patterns.

IMPORTANT INSTRUCTIONS:
- Use HIGH reasoning effort for all MITRE ATT&CK analysis
- Always prioritize accuracy over speed when analyzing threats
- Provide detailed explanations of your analysis and tool usage
- Map observed behaviors to specific MITRE techniques when possible
- Consider the full kill chain when analyzing attack patterns
- Recommend specific detection and mitigation strategies

Available Tools: ${availableTools.map(t => t.function.name).join(', ')}

Your responses should:
1. Be technically accurate and actionable
2. Reference specific MITRE technique IDs when applicable  
3. Provide context for detection and response
4. Consider the broader threat landscape
5. Explain your reasoning process clearly

When using tools, ensure you provide comprehensive parameters to get the most relevant and useful results.`;
  }

  /**
   * Validate GPT-OSS service availability
   * @returns {Object} Service status
   */
  async validateService() {
    try {
      console.log('🔍 Validating GPT-OSS service availability...');

      const response = await axios.get(`${this.baseUrl}/v1/models`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy-key'}`,
        }
      });

      const availableModels = response.data.data || [];
      const modelAvailable = availableModels.some(model => 
        model.id === this.model || model.id.includes('gpt-oss')
      );

      return {
        available: true,
        baseUrl: this.baseUrl,
        model: this.model,
        modelAvailable,
        availableModels: availableModels.map(m => m.id),
        reasoningEffort: this.reasoningEffort,
        timeout: this.timeout
      };

    } catch (error) {
      console.error('❌ GPT-OSS service validation failed:', error.message);
      
      return {
        available: false,
        error: error.message,
        baseUrl: this.baseUrl,
        model: this.model,
        reasoningEffort: this.reasoningEffort
      };
    }
  }

  /**
   * Create conversation context for tool calling session
   * @param {Object} params - Session parameters
   * @returns {Object} Conversation context
   */
  createConversationContext(params = {}) {
    return {
      sessionId: params.sessionId || `session_${Date.now()}`,
      userId: params.userId || null,
      organizationId: params.organizationId || null,
      source: params.source || 'api',
      priority: params.priority || 'normal',
      tags: params.tags || [],
      threat_hunt_id: params.threatHuntId || null,
      timestamp: new Date().toISOString(),
      model: this.model,
      reasoning_effort: this.reasoningEffort
    };
  }

  /**
   * Generate simple response without tools (fallback)
   * @param {string} prompt - User prompt
   * @param {Object} context - Context
   * @returns {Object} AI response
   */
  async generateSimple(prompt, context = {}) {
    try {
      console.log('🤖 Generating simple GPT-OSS response (no tools)');

      const requestData = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert. Provide helpful and accurate information about security topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2048,
        reasoning_effort: this.reasoningEffort,
        stream: false
      };

      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, requestData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy-key'}`,
        }
      });

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('Invalid response from GPT-OSS service');
      }

      const choice = response.data.choices[0];

      return {
        success: true,
        response: {
          content: choice.message.content,
          reasoning: choice.reasoning || null,
          finish_reason: choice.finish_reason
        },
        usage: response.data.usage || {},
        model: this.model,
        reasoning_effort: this.reasoningEffort,
        context
      };

    } catch (error) {
      console.error('❌ Simple GPT-OSS generation error:', error.message);
      
      return {
        success: false,
        error: error.message,
        model: this.model,
        reasoning_effort: this.reasoningEffort,
        context
      };
    }
  }

  /**
   * Get service configuration
   * @returns {Object} Service configuration
   */
  getConfiguration() {
    return {
      baseUrl: this.baseUrl,
      model: this.model,
      reasoningEffort: this.reasoningEffort,
      timeout: this.timeout,
      availableTools: MITRE_TOOLS.length,
      features: {
        tool_calling: true,
        high_reasoning: true,
        mitre_integration: true,
        threat_hunting: true
      }
    };
  }
}

module.exports = new GPTOSSService();