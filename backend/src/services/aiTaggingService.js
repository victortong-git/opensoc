const aiGenerationService = require('./aiGenerationService');
const aiToolExecutor = require('../tools/common/toolExecutor');

class AITaggingService {
  constructor() {
    this.aiService = aiGenerationService;
  }

  /**
   * Generate comprehensive AI-powered contextual tags for an alert
   * This service creates flexible, open-ended tags for correlation and machine learning using AI tools
   */
  async generateEventTags(alert, organizationId, options = {}) {
    const { userId = null, maxTags = 15 } = options;
    const startTime = Date.now();

    try {
      console.log('🏷️ Generating AI contextual tags using AI tools...');

      // Build alert data structure for tool calls
      const alertData = {
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        sourceSystem: alert.sourceSystem,
        eventTime: alert.eventTime,
        assetName: alert.assetName,
        assetId: alert.assetId,
        status: alert.status,
        rawData: alert.rawData,
        enrichmentData: alert.enrichmentData,
        securityEventType: alert.securityEventType
      };

      // Call the AI event tags generation tool
      const toolResult = await aiToolExecutor.executeTool('generate_alert_event_tags', {
        alertData,
        organizationId,
        userId,
        maxTags
      }, {
        sessionId: `alert_tagging_${alert.id}_${Date.now()}`,
        userId,
        organizationId
      });

      if (!toolResult.success) {
        throw new Error(`AI tool tagging failed: ${toolResult.error}`);
      }

      const tagging = toolResult.result;
      const totalProcessingTime = Date.now() - startTime;

      // Validate and structure the response to match expected format
      const structuredTagAnalysis = {
        securityEventType: alert.securityEventType || 'pending', // Keep existing if available
        securityEventTypeReasoning: 'Security event type maintained from previous classification',
        eventTags: tagging.eventTags || [],
        overallConfidence: tagging.overallConfidence || 75,
        correlationPotential: tagging.correlationPotential || 'medium',
        correlationReasoning: tagging.correlationReasoning || 'Standard correlation potential based on alert type',
        recommendedActions: {
          immediate: tagging.recommendedActions?.immediate || ['Review alert context', 'Check for similar events'],
          hunting: tagging.recommendedActions?.hunting || ['Search for related indicators', 'Analyze asset activity patterns']
        },
        processingTimeMs: totalProcessingTime,
        aiModel: 'configured', // Using configured AI provider via AI tools
        generatedAt: new Date().toISOString(),
        tagCount: tagging.eventTags?.length || 0,
        toolExecutionId: toolResult.executionId
      };

      console.log(`✅ Tool-based AI tagging completed in ${totalProcessingTime}ms - Generated ${structuredTagAnalysis.tagCount} tags`);
      return structuredTagAnalysis;

    } catch (error) {
      console.error('AI tag generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate and structure tags from AI response
   */
  validateAndStructureTags(tags) {
    if (!Array.isArray(tags)) return [];

    return tags
      .filter(tag => tag && tag.tag && typeof tag.tag === 'string')
      .map(tag => ({
        tag: tag.tag.toLowerCase().replace(/\s+/g, '-'),
        category: tag.category || 'general',
        confidence: Math.min(1, Math.max(0, tag.confidence || 0.5)),
        reasoning: tag.reasoning || 'AI-generated tag'
      }))
      .slice(0, 20); // Limit to 20 tags maximum
  }

  /**
   * Update alert with generated tags
   */
  async updateAlertTags(alertId, tagAnalysis) {
    try {
      const models = require('../database/models');
      
      const updateData = {
        eventTags: tagAnalysis.eventTags,
        tagsGeneratedAt: new Date(),
        tagsConfidence: tagAnalysis.overallConfidence,
        securityEventType: tagAnalysis.securityEventType
      };

      await models.Alert.update(updateData, {
        where: { id: alertId }
      });

      console.log(`🏷️ Updated alert ${alertId} with ${tagAnalysis.eventTags.length} tags`);
      return true;
    } catch (error) {
      console.error('Failed to update alert with tags:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new AITaggingService();