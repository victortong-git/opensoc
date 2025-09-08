const aiGenerationService = require('./aiGenerationService');
const aiTaggingService = require('./aiTaggingService');
const aiToolExecutor = require('../tools/common/toolExecutor');

class AlertAnalysisService {
  constructor() {
    this.aiService = aiGenerationService;
    this.taggingService = aiTaggingService;
  }

  /**
   * Generate comprehensive alert analysis with security event type classification
   * This function combines basic analysis with security event type classification using AI tools
   */
  async analyzeAlert(alert, organizationId, userId = null) {
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting comprehensive alert analysis using AI tools for alert: ${alert.title}`);

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
        enrichmentData: alert.enrichmentData
      };

      // Call the comprehensive alert analysis AI tool
      const toolResult = await aiToolExecutor.executeTool('analyze_alert_comprehensive', {
        alertData,
        organizationId,
        userId,
        includeIncidentVerification: true
      }, {
        sessionId: `alert_analysis_${alert.id}_${Date.now()}`,
        userId,
        organizationId
      });

      if (!toolResult.success) {
        throw new Error(`AI tool analysis failed: ${toolResult.error}`);
      }

      const analysis = toolResult.result;
      const totalProcessingTime = Date.now() - startTime;

      // Structure the final analysis result to match expected format
      const structuredAnalysis = {
        // Basic analysis from tool result
        summary: analysis.summary || `Security alert: ${alert.title}`,
        explanation: analysis.explanation || 'AI analysis could not be completed',
        securityEventType: analysis.securityEventType || alert.securityEventType || 'pending',
        securityEventTypeReasoning: analysis.securityEventTypeReasoning || 'Unable to classify security event type',
        riskAssessment: {
          level: analysis.riskAssessment?.level || (alert.severity >= 4 ? 'high' : alert.severity >= 3 ? 'medium' : 'low'),
          score: analysis.riskAssessment?.score || alert.severity * 2,
          factors: analysis.riskAssessment?.factors || ['Alert severity level']
        },
        recommendedActions: {
          immediate: analysis.recommendedActions?.immediate || ['Review alert details'],
          followUp: analysis.recommendedActions?.followUp || ['Continue monitoring']
        },
        confidence: analysis.confidence || 75,
        autoResolutionRecommendation: {
          shouldAutoResolve: analysis.autoResolutionRecommendation?.shouldAutoResolve || false,
          resolutionType: analysis.autoResolutionRecommendation?.resolutionType || 'resolved',
          reasoning: analysis.autoResolutionRecommendation?.reasoning || 'Manual review recommended',
          confidenceLevel: analysis.autoResolutionRecommendation?.confidenceLevel || 0
        },
        
        // Incident verification from tool result
        incidentVerification: analysis.incidentVerification,
        
        // Metadata
        analysisTimestamp: new Date().toISOString(),
        processingTimeMs: totalProcessingTime,
        step1ProcessingTimeMs: analysis.step1ProcessingTimeMs || 0,
        step2ProcessingTimeMs: analysis.step2ProcessingTimeMs || 0,
        aiModel: 'configured', // Using configured AI provider via AI tools
        twoStepAnalysis: analysis.twoStepAnalysis || true,
        toolExecutionId: toolResult.executionId
      };

      console.log(`✅ Tool-based alert analysis completed in ${totalProcessingTime}ms - Risk: ${structuredAnalysis.riskAssessment.level}, Confidence: ${structuredAnalysis.confidence}%`);
      return structuredAnalysis;

    } catch (error) {
      console.error('Alert AI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate incident verification analysis for an alert
   * Step 2 of the two-step AI analysis process
   */
  async generateIncidentVerificationAnalysis(alert, basicAnalysis, organizationId, userId = null) {
    const startTime = Date.now();
    
    // Build focused prompt for incident verification
    const prompt = `As a SOC manager following NIST SP 800-61 guidelines, analyze this security alert to determine if it represents a real security incident that requires incident response procedures.

ALERT INFORMATION:
- Title: ${alert.title}
- Description: ${alert.description}
- Severity: ${alert.severity}/5
- Source: ${alert.sourceSystem}
- Asset: ${alert.assetName}
- Event Time: ${alert.eventTime}

AI BASIC ANALYSIS CONTEXT:
- Summary: ${basicAnalysis.summary}
- Security Event Type: ${basicAnalysis.securityEventType}
- Risk Level: ${basicAnalysis.riskAssessment?.level}
- Risk Score: ${basicAnalysis.riskAssessment?.score}/10
- AI Confidence: ${basicAnalysis.confidence}%

VERIFICATION TASK:
Determine if this alert represents a real security incident by evaluating:
1. Data completeness and validity
2. False positive indicators
3. Business impact assessment
4. Technical validation requirements

Provide your assessment in this exact JSON format:
{
  "isLikelyIncident": true|false,
  "confidence": 1-100,
  "reasoning": "Detailed explanation of your incident assessment based on NIST guidelines",
  "verificationCriteria": {
    "hasReporterInfo": true|false,
    "hasTimelineInfo": true|false,
    "hasTechnicalDetails": true|false,
    "falsePositiveScore": 1-10,
    "businessCriticality": "low|medium|high|critical"
  },
  "recommendedActions": {
    "immediate": ["immediate verification steps"],
    "investigation": ["investigation actions needed"]
  },
  "artifactsToCollect": ["evidence/artifacts to collect for confirmation"]
}`;

    try {
      // Call AI service for incident verification
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'alert_incident_verification',
        contextId: alert.id,
        model: null, // Use the configured model from AI provider
        maxTokens: 1500,
        temperature: 0.7
      });
      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;

      // Parse the JSON response
      let verification;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          verification = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in incident verification response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI incident verification response:', parseError);
        throw new Error(`AI incident verification analysis failed: ${parseError.message}`);
      }

      // Ensure required fields with defaults
      const structuredVerification = {
        isLikelyIncident: verification.isLikelyIncident || false,
        confidence: verification.confidence || 70,
        reasoning: verification.reasoning || 'Incident verification analysis completed',
        verificationCriteria: {
          hasReporterInfo: verification.verificationCriteria?.hasReporterInfo !== undefined ? verification.verificationCriteria.hasReporterInfo : true,
          hasTimelineInfo: verification.verificationCriteria?.hasTimelineInfo !== undefined ? verification.verificationCriteria.hasTimelineInfo : true,
          hasTechnicalDetails: verification.verificationCriteria?.hasTechnicalDetails !== undefined ? verification.verificationCriteria.hasTechnicalDetails : true,
          falsePositiveScore: verification.verificationCriteria?.falsePositiveScore || 5,
          businessCriticality: verification.verificationCriteria?.businessCriticality || 'medium'
        },
        recommendedActions: {
          immediate: verification.recommendedActions?.immediate || ['Review alert context'],
          investigation: verification.recommendedActions?.investigation || ['Continue monitoring']
        },
        artifactsToCollect: verification.artifactsToCollect || ['System logs', 'Security tool context'],
        processingTimeMs: processingTime,
        aiModel: 'configured', // Using configured model from AI provider
        verificationTimestamp: new Date().toISOString()
      };

      return structuredVerification;

    } catch (error) {
      console.error('Incident verification analysis failed:', error);
      
      // Return basic fallback verification
      return {
        isLikelyIncident: basicAnalysis.riskAssessment?.level === 'high' || basicAnalysis.riskAssessment?.level === 'critical',
        confidence: 60,
        reasoning: `Incident verification could not be completed due to AI service error. Assessment based on basic analysis risk level: ${basicAnalysis.riskAssessment?.level}`,
        verificationCriteria: {
          hasReporterInfo: !!alert.sourceSystem,
          hasTimelineInfo: !!alert.eventTime,
          hasTechnicalDetails: !!alert.rawData && Object.keys(alert.rawData).length > 0,
          falsePositiveScore: 5,
          businessCriticality: basicAnalysis.riskAssessment?.level || 'medium'
        },
        recommendedActions: {
          immediate: ['Manual review required due to verification service error'],
          investigation: ['Contact SOC manager for manual assessment']
        },
        artifactsToCollect: ['System logs', 'Alert context', 'Manual investigation notes'],
        processingTimeMs: Date.now() - startTime,
        aiModel: 'configured', // Using configured model from AI provider
        verificationTimestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Generate simplified AI classification focused on event type and tags only
   * This method only does security event type classification and contextual tag generation using AI tools
   */
  async generateAIClassification(alert, organizationId, options = {}) {
    const startTime = Date.now();

    try {
      console.log('🏷️ CLASSIFICATION: Starting AI classification for event type and tags using AI tools...');
      console.log('🏷️ CLASSIFICATION: Alert ID:', alert.id, 'Title:', alert.title);

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
        enrichmentData: alert.enrichmentData
      };

      // Call the AI classification tool
      console.log('🏷️ CLASSIFICATION: Calling tool "classify_alert_type_and_tags"');
      const toolResult = await aiToolExecutor.executeTool('classify_alert_type_and_tags', {
        alertData,
        organizationId,
        userId: options.userId
      }, {
        sessionId: `alert_classification_${alert.id}_${Date.now()}`,
        userId: options.userId,
        organizationId
      });

      if (!toolResult.success) {
        throw new Error(`AI tool classification failed: ${toolResult.error}`);
      }

      const rawClassification = toolResult.result;
      const totalProcessingTime = Date.now() - startTime;
      
      console.log('🏷️ CLASSIFICATION: Tool result received:', toolResult.success ? 'SUCCESS' : 'FAILED');
      console.log('🏷️ CLASSIFICATION: Raw classification data keys:', Object.keys(rawClassification || {}));
      
      // Check for contamination in raw response and log warnings
      if (rawClassification && rawClassification.recommendedActions) {
        console.log('❌ CLASSIFICATION: WARNING - recommendedActions found in raw AI response!', rawClassification.recommendedActions);
        console.log('🧹 CLASSIFICATION: Filtering out analysis contamination from classification response');
      }
      if (rawClassification && rawClassification.summary) {
        console.log('❌ CLASSIFICATION: WARNING - summary found in raw AI response!', rawClassification.summary);
      }
      if (rawClassification && rawClassification.riskAssessment) {
        console.log('❌ CLASSIFICATION: WARNING - riskAssessment found in raw AI response!', rawClassification.riskAssessment);
      }

      // Create FILTERED classification result - only lightweight classification fields allowed
      const classificationResult = {
        securityEventType: rawClassification.securityEventType || 'pending',
        securityEventTypeReasoning: rawClassification.securityEventTypeReasoning || 'Classification could not be completed',
        eventTags: rawClassification.eventTags || [],
        correlationPotential: rawClassification.correlationPotential || 'medium',
        correlationReasoning: rawClassification.correlationReasoning || 'Standard correlation potential',
        overallConfidence: rawClassification.overallConfidence || 75,
        tagCount: rawClassification.eventTags?.length || 0,
        classificationTimestamp: new Date().toISOString(),
        processingTimeMs: totalProcessingTime,
        aiModel: 'configured',
        toolExecutionId: toolResult.executionId
        // NOTE: Explicitly NOT including analysis fields:
        // - recommendedActions (belongs in AI Analysis)
        // - summary (belongs in AI Analysis) 
        // - riskAssessment (belongs in AI Analysis)
        // - explanation (belongs in AI Analysis)
      };

      console.log(`🏷️ CLASSIFICATION: Final result structure keys:`, Object.keys(classificationResult));
      console.log(`🏷️ CLASSIFICATION: Sending lightweight data to frontend - Event Type: ${classificationResult.securityEventType}, Tags: ${classificationResult.tagCount}`);
      
      // Validate that our filtering worked and no contamination remains
      const contaminatedFields = ['recommendedActions', 'summary', 'riskAssessment', 'explanation'];
      const foundContamination = contaminatedFields.filter(field => field in classificationResult);
      
      if (foundContamination.length > 0) {
        console.log('❌ CLASSIFICATION: ERROR - Contaminated fields still present in final result!', foundContamination);
      } else {
        console.log('✅ CLASSIFICATION: Clean result - Pure lightweight classification data only');
        console.log('✅ CLASSIFICATION: No analysis contamination detected in final response');
      }
      console.log(`✅ Tool-based AI classification completed in ${totalProcessingTime}ms`);
      return classificationResult;

    } catch (error) {
      console.error('AI classification failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AlertAnalysisService();