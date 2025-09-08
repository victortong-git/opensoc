/**
 * Alert AI Tools for AI Chat System
 * Provides specialized AI-powered alert analysis, classification and tagging capabilities
 */

const aiGenerationService = require('../../services/aiGenerationService');

const ALERT_AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "classify_alert_type_and_tags",
      description: "Classify security alert type and generate contextual event tags for correlation and analysis",
      category: "Alert Classification",
      parameters: {
        type: "object",
        properties: {
          alertData: {
            type: "object",
            properties: {
              id: { type: "string", description: "Alert ID" },
              title: { type: "string", description: "Alert title" },
              description: { type: "string", description: "Alert description" },
              severity: { type: "integer", description: "Alert severity (1-5)" },
              sourceSystem: { type: "string", description: "Source system that generated the alert" },
              eventTime: { type: "string", description: "When the event occurred" },
              assetName: { type: "string", description: "Affected asset name" },
              assetId: { type: "string", description: "Affected asset ID" },
              status: { type: "string", description: "Current alert status" },
              rawData: { type: "object", description: "Raw alert data" },
              enrichmentData: { type: "object", description: "Additional enrichment data" }
            },
            required: ["title", "description", "severity"],
            description: "Alert data to classify"
          },
          organizationId: {
            type: "string",
            description: "Organization ID for context"
          },
          userId: {
            type: "string",
            description: "User ID requesting the classification"
          }
        },
        required: ["alertData"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_alert_comprehensive",
      description: "Perform comprehensive AI analysis of security alert with risk assessment, recommendations, and incident verification - excludes classification which should be done separately",
      category: "Alert Analysis",
      parameters: {
        type: "object",
        properties: {
          alertData: {
            type: "object",
            properties: {
              id: { type: "string", description: "Alert ID" },
              title: { type: "string", description: "Alert title" },
              description: { type: "string", description: "Alert description" },
              severity: { type: "integer", description: "Alert severity (1-5)" },
              sourceSystem: { type: "string", description: "Source system that generated the alert" },
              eventTime: { type: "string", description: "When the event occurred" },
              assetName: { type: "string", description: "Affected asset name" },
              assetId: { type: "string", description: "Affected asset ID" },
              status: { type: "string", description: "Current alert status" },
              rawData: { type: "object", description: "Raw alert data" },
              enrichmentData: { type: "object", description: "Additional enrichment data" }
            },
            required: ["title", "description", "severity"],
            description: "Alert data to analyze"
          },
          organizationId: {
            type: "string",
            description: "Organization ID for context"
          },
          userId: {
            type: "string",
            description: "User ID requesting the analysis"
          },
          includeIncidentVerification: {
            type: "boolean",
            default: true,
            description: "Include incident verification analysis (NIST SP 800-61 guidelines)"
          }
        },
        required: ["alertData"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_alert_event_tags",
      description: "Generate comprehensive contextual tags for alert correlation, machine learning, and threat hunting",
      category: "Alert Tagging",
      parameters: {
        type: "object",
        properties: {
          alertData: {
            type: "object",
            properties: {
              id: { type: "string", description: "Alert ID" },
              title: { type: "string", description: "Alert title" },
              description: { type: "string", description: "Alert description" },
              severity: { type: "integer", description: "Alert severity (1-5)" },
              sourceSystem: { type: "string", description: "Source system that generated the alert" },
              eventTime: { type: "string", description: "When the event occurred" },
              assetName: { type: "string", description: "Affected asset name" },
              assetId: { type: "string", description: "Affected asset ID" },
              status: { type: "string", description: "Current alert status" },
              rawData: { type: "object", description: "Raw alert data" },
              enrichmentData: { type: "object", description: "Additional enrichment data" },
              securityEventType: { type: "string", description: "Previously classified security event type" }
            },
            required: ["title", "description", "severity"],
            description: "Alert data to tag"
          },
          organizationId: {
            type: "string",
            description: "Organization ID for context"
          },
          userId: {
            type: "string",
            description: "User ID requesting the tags"
          },
          maxTags: {
            type: "integer",
            default: 15,
            minimum: 5,
            maximum: 25,
            description: "Maximum number of tags to generate"
          }
        },
        required: ["alertData"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "detect_false_positive_alert",
      description: "Lightweight false positive detection and auto-resolution recommendation for security alerts to reduce alert fatigue",
      category: "Alert Auto-Resolution",
      parameters: {
        type: "object",
        properties: {
          alertData: {
            type: "object",
            properties: {
              id: { type: "string", description: "Alert ID" },
              title: { type: "string", description: "Alert title" },
              description: { type: "string", description: "Alert description" },
              severity: { type: "integer", description: "Alert severity (1-5)" },
              sourceSystem: { type: "string", description: "Source system that generated the alert" },
              eventTime: { type: "string", description: "When the event occurred" },
              assetName: { type: "string", description: "Affected asset name" },
              assetId: { type: "string", description: "Affected asset ID" },
              status: { type: "string", description: "Current alert status" },
              rawData: { type: "object", description: "Raw alert data" },
              enrichmentData: { type: "object", description: "Additional enrichment data" },
              securityEventType: { type: "string", description: "Previously classified security event type" }
            },
            required: ["title", "description", "severity"],
            description: "Alert data to analyze for false positive patterns"
          },
          historicalContext: {
            type: "object",
            description: "Historical context including similar resolved alerts, organizational patterns",
            properties: {
              recentSimilarAlerts: { type: "array", description: "Recently resolved similar alerts" },
              organizationPatterns: { type: "array", description: "Known organizational false positive patterns" },
              assetContext: { type: "object", description: "Asset type and environment context" }
            }
          },
          organizationId: {
            type: "string",
            description: "Organization ID for context"
          },
          userId: {
            type: "string", 
            description: "User ID requesting the analysis"
          }
        },
        required: ["alertData"]
      }
    }
  }
];

/**
 * Alert AI Tools Executor
 */
class AlertAIExecutor {
  constructor() {
    this.aiService = aiGenerationService;
  }

  /**
   * Classify alert type and generate basic contextual tags
   */
  async classifyAlertTypeAndTags(params) {
    try {
      const { alertData, organizationId, userId } = params;
      const startTime = Date.now();

      console.log(`🏷️ CLASSIFICATION TOOL: classifyAlertTypeAndTags method called for alert: ${alertData.title}`);
      console.log(`🏷️ CLASSIFICATION TOOL: This should only return categorization data - no action recommendations`);

      const prompt = `As a security categorization system, classify this alert into the appropriate security event type and generate relevant tags for organization and correlation.

ALERT TO CATEGORIZE:
- Title: ${alertData.title}
- Description: ${alertData.description}
- Severity: ${alertData.severity}/5
- Source: ${alertData.sourceSystem || 'Unknown'}
- Asset: ${alertData.assetName || 'Unknown'}

SECURITY EVENT TYPE CATEGORIES:
Select the most appropriate category from this list:

Network & Traffic: network_intrusion, ddos_attack, port_scan, suspicious_traffic, dns_tunneling, lateral_movement
Malware & Threats: malware_detection, ransomware, trojan, virus, rootkit, botnet_activity, phishing
Authentication & Access: authentication_failure, privilege_escalation, unauthorized_access, account_compromise, brute_force_attack, credential_theft
Data & Exfiltration: data_exfiltration, data_breach, data_loss_prevention, unauthorized_data_access
System & Host: suspicious_process, system_compromise, file_integrity_violation, registry_modification, service_manipulation
Application & Web: web_attack, sql_injection, xss_attack, application_vulnerability, api_abuse
Policy & Compliance: policy_violation, compliance_violation, configuration_violation, security_control_bypass
Insider & Internal: insider_threat, user_behavior_anomaly, data_misuse, unauthorized_software
Infrastructure: vulnerability_exploitation, system_misconfiguration, patch_management_failure
General & Status: security_incident, suspicious_activity, anomaly_detection, unknown, pending

LIGHTWEIGHT TAG GENERATION:
Generate 5-8 essential tags for quick categorization:
- Technical: key protocols, services, or IOC types 
- Behavioral: primary attack behaviors or patterns
- Contextual: asset type, timing, or business context
- Correlation: simple pattern matching or campaign links

Provide your categorization in this exact JSON format:
{
  "securityEventType": "most_appropriate_security_event_type_from_list_above",
  "securityEventTypeReasoning": "brief reason for this categorization",
  "eventTags": [
    {
      "tag": "tag-name-here",
      "category": "technical|behavioral|contextual|correlation",
      "confidence": 0.85,
      "reasoning": "why this tag fits"
    }
  ],
  "overallConfidence": 0.90,
  "correlationPotential": "high|medium|low",
  "correlationReasoning": "brief correlation rationale"
}`;

      // Call AI Generation Service (uses configured AI provider)
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'alert_quick_classification',
        contextId: alertData.id,
        maxTokens: 1500,
        temperature: 0.7
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;
      
      console.log(`🏷️ CLASSIFICATION TOOL: AI raw response length:`, aiResponse?.length || 0);
      console.log(`🏷️ CLASSIFICATION TOOL: AI raw response preview:`, aiResponse?.substring(0, 200) + '...');

      // Parse JSON response
      let classification;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          classification = JSON.parse(jsonMatch[0]);
          console.log(`🏷️ CLASSIFICATION TOOL: Parsed AI response keys:`, Object.keys(classification));
          if (classification.recommendedActions) {
            console.log(`❌ CLASSIFICATION TOOL: WARNING - AI generated recommendedActions despite clean prompt!`, classification.recommendedActions);
          } else {
            console.log(`✅ CLASSIFICATION TOOL: Clean AI response - no recommendedActions generated`);
          }
        } else {
          throw new Error('No JSON found in AI classification response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI classification JSON:', parseError);
        throw new Error(`AI classification failed: ${parseError.message}`);
      }

      // Validate and structure the response
      const structuredResult = {
        success: true,
        securityEventType: classification.securityEventType || 'pending',
        securityEventTypeReasoning: classification.securityEventTypeReasoning || 'Classification could not be completed',
        eventTags: this.validateAndStructureTags(classification.eventTags || []),
        overallConfidence: Math.min(100, Math.max(0, (classification.overallConfidence || 0.75) * 100)),
        correlationPotential: classification.correlationPotential || 'medium',
        correlationReasoning: classification.correlationReasoning || 'Standard correlation potential based on alert type',
        processingTimeMs: processingTime,
        aiModel: 'configured', // Using OpenSOC's configured AI provider
        timestamp: new Date().toISOString(),
        tagCount: classification.eventTags?.length || 0
      };

      console.log(`🏷️ CLASSIFICATION TOOL: Final structured result keys:`, Object.keys(structuredResult));
      if (structuredResult.recommendedActions) {
        console.log(`❌ CLASSIFICATION TOOL: ERROR - recommendedActions in final result!`, structuredResult.recommendedActions);
      } else {
        console.log(`✅ CLASSIFICATION TOOL: Clean final result - pure classification data only`);
      }
      console.log(`✅ Alert classification completed in ${processingTime}ms - Event Type: ${structuredResult.securityEventType}, Tags: ${structuredResult.tagCount}`);
      return structuredResult;

    } catch (error) {
      console.error('❌ Alert classification failed:', error);
      return {
        success: false,
        error: error.message,
        securityEventType: 'pending',
        eventTags: [],
        processingTimeMs: Date.now() - (params.startTime || Date.now()),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Comprehensive alert analysis with risk assessment
   */
  async analyzeAlertComprehensive(params) {
    try {
      const { alertData, organizationId, userId, includeIncidentVerification = true } = params;
      const startTime = Date.now();

      console.log(`🔍 Starting comprehensive analysis for alert: ${alertData.title}`);

      const prompt = `As a SOC analyst, perform deep security analysis of this alert focusing on risk assessment, impact analysis, and action recommendations. DO NOT classify the alert type - assume classification has been done separately.

ALERT DETAILS:
- Title: ${alertData.title}
- Description: ${alertData.description}
- Severity: ${alertData.severity}/5
- Source System: ${alertData.sourceSystem || 'Unknown'}
- Event Time: ${alertData.eventTime || 'Unknown'}
- Asset: ${alertData.assetName || 'Unknown'} (${alertData.assetId || 'Unknown'})
- Status: ${alertData.status || 'Unknown'}
- Raw Data: ${JSON.stringify(alertData.rawData || {})}
- Enrichment Data: ${JSON.stringify(alertData.enrichmentData || {})}

COMPREHENSIVE ANALYSIS REQUIREMENTS:
1. Analyze the security implications and potential impact
2. Assess risk level with detailed scoring factors
3. Evaluate for automatic resolution potential (confidence ≥85%)
4. Provide actionable immediate and follow-up recommendations

AUTO-RESOLUTION CRITERIA:
Only recommend automatic resolution if you have HIGH CONFIDENCE (≥85%) that this alert is:
1. A false positive with clear indicators
2. A known benign activity with documented patterns  
3. A duplicate/redundant alert already investigated
4. A low-risk activity that requires no immediate action

Provide your analysis in this exact JSON format:
{
  "summary": "Brief 1-2 sentence summary of the alert",
  "explanation": "Detailed explanation of what this alert indicates and its significance",
  "riskAssessment": {
    "level": "low|medium|high|critical",
    "score": 1-10,
    "factors": ["list of risk factors"]
  },
  "recommendedActions": {
    "immediate": ["list of immediate actions needed"],
    "followUp": ["list of follow-up actions for investigation"]
  },
  "confidence": 1-100,
  "autoResolutionRecommendation": {
    "shouldAutoResolve": true|false,
    "resolutionType": "resolved|false_positive",
    "reasoning": "Detailed explanation why this alert can/cannot be automatically resolved",
    "confidenceLevel": 1-100
  }
}`;

      // Call AI Generation Service (uses configured AI provider)
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'alert_comprehensive_analysis',
        contextId: alertData.id,
        maxTokens: 2000,
        temperature: 0.7
      });

      const aiResponse = aiResult.response || aiResult.content;
      let step1ProcessingTime = Date.now() - startTime;

      // Parse JSON response for basic analysis
      let basicAnalysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          basicAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI analysis response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI analysis JSON:', parseError);
        throw new Error(`AI analysis failed: ${parseError.message}`);
      }

      // Step 2: Incident verification if requested
      let incidentVerification = null;
      if (includeIncidentVerification) {
        console.log('🔍 Step 2: Generating incident verification analysis...');
        try {
          incidentVerification = await this.generateIncidentVerificationAnalysis(alertData, basicAnalysis, organizationId, userId);
        } catch (error) {
          console.error('Incident verification failed:', error.message);
          incidentVerification = this.getFallbackIncidentVerification(alertData, basicAnalysis);
        }
      }

      const totalProcessingTime = Date.now() - startTime;

      // Structure final result
      const structuredResult = {
        success: true,
        summary: basicAnalysis.summary || `Security alert: ${alertData.title}`,
        explanation: basicAnalysis.explanation || 'AI analysis could not be completed',
        riskAssessment: {
          level: basicAnalysis.riskAssessment?.level || (alertData.severity >= 4 ? 'high' : alertData.severity >= 3 ? 'medium' : 'low'),
          score: basicAnalysis.riskAssessment?.score || alertData.severity * 2,
          factors: basicAnalysis.riskAssessment?.factors || ['Alert severity level']
        },
        recommendedActions: {
          immediate: basicAnalysis.recommendedActions?.immediate || ['Review alert details'],
          followUp: basicAnalysis.recommendedActions?.followUp || ['Continue monitoring']
        },
        confidence: basicAnalysis.confidence || 75,
        autoResolutionRecommendation: {
          shouldAutoResolve: basicAnalysis.autoResolutionRecommendation?.shouldAutoResolve || false,
          resolutionType: basicAnalysis.autoResolutionRecommendation?.resolutionType || 'resolved',
          reasoning: basicAnalysis.autoResolutionRecommendation?.reasoning || 'Manual review recommended',
          confidenceLevel: basicAnalysis.autoResolutionRecommendation?.confidenceLevel || 0
        },
        incidentVerification: incidentVerification,
        processingTimeMs: totalProcessingTime,
        step1ProcessingTimeMs: step1ProcessingTime,
        step2ProcessingTimeMs: incidentVerification?.processingTimeMs || 0,
        aiModel: 'configured', // Using OpenSOC's configured AI provider
        timestamp: new Date().toISOString(),
        twoStepAnalysis: includeIncidentVerification
      };

      console.log(`✅ Comprehensive analysis completed in ${totalProcessingTime}ms - Risk: ${structuredResult.riskAssessment.level}, Confidence: ${structuredResult.confidence}%`);
      return structuredResult;

    } catch (error) {
      console.error('❌ Alert comprehensive analysis failed:', error);
      return {
        success: false,
        error: error.message,
        processingTimeMs: Date.now() - (params.startTime || Date.now()),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate diverse contextual tags for correlation and ML
   */
  async generateAlertEventTags(params) {
    try {
      const { alertData, organizationId, userId, maxTags = 15 } = params;
      const startTime = Date.now();

      console.log(`🏷️ Generating comprehensive event tags for alert: ${alertData.title}`);

      const prompt = `As a SOC analyst and threat intelligence expert, generate comprehensive contextual tags for this security alert to enable correlation analysis, machine learning, and threat hunting.

ALERT DETAILS:
- Title: ${alertData.title}
- Description: ${alertData.description}
- Severity: ${alertData.severity}/5
- Source System: ${alertData.sourceSystem || 'Unknown'}
- Event Time: ${alertData.eventTime || 'Unknown'}
- Asset: ${alertData.assetName || 'Unknown'} (${alertData.assetId || 'Unknown'})
- Current Security Event Type: ${alertData.securityEventType || 'pending'}
- Raw Data: ${JSON.stringify(alertData.rawData || {})}
- Enrichment Data: ${JSON.stringify(alertData.enrichmentData || {})}

TAG GENERATION GUIDELINES:
Generate diverse, contextual tags that enable:
1. Correlation with similar events
2. Machine learning training data
3. Threat hunting and pattern detection
4. Attribution and campaign tracking
5. Technical analysis and forensics

TAG CATEGORIES TO INCLUDE:

TECHNICAL TAGS:
- MITRE ATT&CK techniques (e.g., "technique-T1055", "tactic-defense-evasion")
- IOC types and families (e.g., "ioc-domain", "malware-family-emotet", "c2-infrastructure")
- Protocols and services (e.g., "protocol-smtp", "service-rdp", "port-443")
- File types and extensions (e.g., "filetype-exe", "extension-docx", "mime-application")

BEHAVIORAL TAGS:
- Attack phases (e.g., "phase-initial-access", "phase-persistence", "phase-exfiltration")
- Actor behaviors (e.g., "behavior-credential-dumping", "behavior-living-off-land")
- Impact types (e.g., "impact-data-destruction", "impact-service-disruption")

CONTEXTUAL TAGS:
- Timing (e.g., "timing-business-hours", "timing-weekend", "timing-holiday")
- Geographic (e.g., "geo-external-source", "geo-high-risk-country")
- Asset context (e.g., "asset-critical", "asset-web-facing", "asset-database-server")
- Business impact (e.g., "business-critical", "business-customer-facing", "business-financial")

CORRELATION TAGS:
- Campaign indicators (e.g., "campaign-apt29", "campaign-financially-motivated")
- Infrastructure overlap (e.g., "infrastructure-shared", "infrastructure-bulletproof-hosting")
- Pattern matching (e.g., "pattern-similar-recent", "pattern-recurring", "pattern-seasonal")
- Attribution (e.g., "attribution-nation-state", "attribution-cybercrime", "attribution-hacktivist")

Provide your analysis in this exact JSON format:
{
  "eventTags": [
    {
      "tag": "tag-name-here",
      "category": "technical|behavioral|contextual|correlation",
      "confidence": 0.85,
      "reasoning": "brief explanation of why this tag applies"
    }
  ],
  "overallConfidence": 0.90,
  "correlationPotential": "high|medium|low",
  "correlationReasoning": "explanation of correlation potential for threat hunting"
}

Generate ${maxTags} high-quality tags that maximize correlation potential and provide diverse analytical perspectives on this security event.`;

      // Call AI Generation Service (uses configured AI provider)
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'alert_tagging',
        contextId: alertData.id,
        maxTokens: 3000,
        temperature: 0.7
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;

      // Parse JSON response
      let tagAnalysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          tagAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI tag generation response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI tag generation JSON:', parseError);
        throw new Error(`AI tag generation failed: ${parseError.message}`);
      }

      // Structure result
      const structuredResult = {
        success: true,
        eventTags: this.validateAndStructureTags(tagAnalysis.eventTags || [], maxTags),
        overallConfidence: Math.min(100, Math.max(0, (tagAnalysis.overallConfidence || 0.75) * 100)),
        correlationPotential: tagAnalysis.correlationPotential || 'medium',
        correlationReasoning: tagAnalysis.correlationReasoning || 'Standard correlation potential based on alert type',
        processingTimeMs: processingTime,
        aiModel: 'configured', // Using OpenSOC's configured AI provider
        timestamp: new Date().toISOString(),
        tagCount: tagAnalysis.eventTags?.length || 0
      };

      console.log(`✅ Event tags generation completed in ${processingTime}ms - Generated ${structuredResult.tagCount} tags`);
      return structuredResult;

    } catch (error) {
      console.error('❌ Alert event tags generation failed:', error);
      return {
        success: false,
        error: error.message,
        processingTimeMs: Date.now() - (params.startTime || Date.now()),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate incident verification analysis (Step 2 of comprehensive analysis)
   */
  async generateIncidentVerificationAnalysis(alertData, basicAnalysis, organizationId, userId) {
    const startTime = Date.now();
    
    const prompt = `As a SOC manager following NIST SP 800-61 guidelines, analyze this security alert to determine if it represents a real security incident that requires incident response procedures.

ALERT INFORMATION:
- Title: ${alertData.title}
- Description: ${alertData.description}
- Severity: ${alertData.severity}/5
- Source: ${alertData.sourceSystem || 'Unknown'}
- Asset: ${alertData.assetName || 'Unknown'}
- Event Time: ${alertData.eventTime || 'Unknown'}

AI BASIC ANALYSIS CONTEXT:
- Summary: ${basicAnalysis.summary}
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
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'alert_incident_verification',
        contextId: alertData.id,
        maxTokens: 1500,
        temperature: 0.7
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;

      // Parse JSON response
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

      // Structure verification result
      return {
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
        aiModel: 'configured', // Using OpenSOC's configured AI provider
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Incident verification analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get fallback incident verification when AI fails
   */
  getFallbackIncidentVerification(alertData, basicAnalysis) {
    return {
      isLikelyIncident: basicAnalysis.riskAssessment?.level === 'high' || basicAnalysis.riskAssessment?.level === 'critical',
      confidence: 60,
      reasoning: `Incident verification could not be completed due to AI service error. Assessment based on basic analysis risk level: ${basicAnalysis.riskAssessment?.level}`,
      verificationCriteria: {
        hasReporterInfo: !!alertData.sourceSystem,
        hasTimelineInfo: !!alertData.eventTime,
        hasTechnicalDetails: !!alertData.rawData && Object.keys(alertData.rawData).length > 0,
        falsePositiveScore: 5,
        businessCriticality: basicAnalysis.riskAssessment?.level || 'medium'
      },
      recommendedActions: {
        immediate: ['Manual review required due to verification service error'],
        investigation: ['Contact SOC manager for manual assessment']
      },
      artifactsToCollect: ['System logs', 'Alert context', 'Manual investigation notes'],
      processingTimeMs: 0,
      aiModel: 'gpt-oss',
      timestamp: new Date().toISOString(),
      error: 'Fallback verification used'
    };
  }

  /**
   * Dedicated false positive detection with auto-resolution recommendation
   * Lightweight analysis focused on false positive patterns and auto-resolution confidence
   */
  async detectFalsePositiveAlert(params) {
    try {
      const { alertData, historicalContext = {}, organizationId, userId } = params;
      const startTime = Date.now();

      console.log(`🔍 FALSE POSITIVE: Starting false positive detection for alert: ${alertData.title}`);
      console.log(`🔍 FALSE POSITIVE: Analyzing for auto-resolution patterns and confidence`);

      const prompt = `As a specialized false positive detection system, analyze this security alert to determine if it's a false positive that can be automatically resolved to reduce alert fatigue.

ALERT TO ANALYZE:
- Title: ${alertData.title}
- Description: ${alertData.description}
- Severity: ${alertData.severity}/5
- Source System: ${alertData.sourceSystem || 'Unknown'}
- Event Time: ${alertData.eventTime || 'Unknown'}
- Asset: ${alertData.assetName || 'Unknown'} (${alertData.assetId || 'Unknown'})
- Security Event Type: ${alertData.securityEventType || 'Unknown'}
- Raw Data: ${JSON.stringify(alertData.rawData || {})}

HISTORICAL CONTEXT:
- Recent Similar Alerts: ${JSON.stringify(historicalContext.recentSimilarAlerts || [])}
- Organization Patterns: ${JSON.stringify(historicalContext.organizationPatterns || [])}
- Asset Context: ${JSON.stringify(historicalContext.assetContext || {})}

FALSE POSITIVE DETECTION CRITERIA:
Analyze for these false positive patterns with HIGH CONFIDENCE requirements:

1. **Test/Synthetic Alerts** (≥90% confidence):
   - Alert titles containing "test", "synthetic", "demo", "training"
   - Source systems known for generating test alerts
   - Scheduled or repeated test patterns

2. **Maintenance Activities** (≥85% confidence):
   - Alerts during maintenance windows
   - Known maintenance-related activities
   - Scheduled system updates or reboots

3. **Known Benign Activities** (≥85% confidence):
   - Business-approved activities (backups, scans, updates)
   - Normal operational processes
   - Whitelisted applications or processes

4. **Duplicate/Redundant Alerts** (≥80% confidence):
   - Multiple alerts for the same incident
   - Already resolved similar issues
   - Cascading alerts from single root cause

5. **Development/Test Environment Alerts** (≥75% confidence):
   - Alerts from development or test systems
   - Non-production environments
   - Testing-related activities

AUTO-RESOLUTION DECISION FRAMEWORK:
- **Immediate Auto-Resolve** (≥85% confidence): Clear false positive with documented patterns
- **Queue for Review** (75-84% confidence): Likely false positive, needs SOC review
- **Comprehensive Analysis Required** (<75% confidence): Potential real threat, needs full investigation

Provide your analysis in this exact JSON format:
{
  "isFalsePositive": true|false,
  "falsePositiveType": "test_alert|maintenance_activity|benign_activity|duplicate_alert|dev_environment|unknown",
  "confidenceScore": 1-100,
  "detectionPatterns": ["list of specific patterns detected"],
  "reasoning": "Detailed explanation of why this is/isn't a false positive",
  "historicalMatches": ["descriptions of similar resolved alerts"],
  "riskFactors": ["any risk factors that reduce confidence"],
  "autoResolutionRecommendation": {
    "shouldAutoResolve": true|false,
    "resolutionType": "false_positive|resolved",
    "specificResolutionType": "false_positive_test_alert|false_positive_maintenance|false_positive_benign_activity|false_positive_duplicate|false_positive_dev_environment|resolved",
    "confidenceLevel": 1-100,
    "reasoning": "Specific reasoning for auto-resolution decision",
    "reviewRequired": true|false,
    "escalationTrigger": "reason if escalation needed"
  },
  "processingTimeMs": "will be calculated"
}

IMPORTANT: Only recommend auto-resolution with high confidence. When in doubt, recommend human review.`;

      // Call AI Generation Service (uses configured AI provider)
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'alert_false_positive_detection',
        contextId: alertData.id,
        maxTokens: 1500,
        temperature: 0.3 // Lower temperature for more consistent decisions
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;
      
      console.log(`🔍 FALSE POSITIVE: AI raw response length:`, aiResponse?.length || 0);

      // Parse JSON response
      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          console.log(`🔍 FALSE POSITIVE: Parsed AI response - Confidence: ${analysis.confidenceScore}%, Should Auto-Resolve: ${analysis.autoResolutionRecommendation?.shouldAutoResolve}`);
        } else {
          throw new Error('No JSON found in AI false positive detection response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI false positive detection JSON:', parseError);
        throw new Error(`AI false positive detection failed: ${parseError.message}`);
      }

      // Validate and structure the response
      const structuredResult = {
        success: true,
        isFalsePositive: analysis.isFalsePositive || false,
        falsePositiveType: analysis.falsePositiveType || 'unknown',
        confidenceScore: Math.min(100, Math.max(0, analysis.confidenceScore || 0)),
        detectionPatterns: Array.isArray(analysis.detectionPatterns) ? analysis.detectionPatterns : [],
        reasoning: analysis.reasoning || 'No specific reasoning provided',
        historicalMatches: Array.isArray(analysis.historicalMatches) ? analysis.historicalMatches : [],
        riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
        autoResolutionRecommendation: {
          shouldAutoResolve: analysis.autoResolutionRecommendation?.shouldAutoResolve || false,
          resolutionType: analysis.autoResolutionRecommendation?.resolutionType || 'resolved',
          specificResolutionType: analysis.autoResolutionRecommendation?.specificResolutionType || 'resolved',
          confidenceLevel: Math.min(100, Math.max(0, analysis.autoResolutionRecommendation?.confidenceLevel || 0)),
          reasoning: analysis.autoResolutionRecommendation?.reasoning || 'No auto-resolution reasoning provided',
          reviewRequired: analysis.autoResolutionRecommendation?.reviewRequired !== false, // Default to true for safety
          escalationTrigger: analysis.autoResolutionRecommendation?.escalationTrigger || null
        },
        processingTimeMs: processingTime,
        aiModel: 'configured', // Using OpenSOC's configured AI provider
        timestamp: new Date().toISOString(),
        toolExecutionId: `fp_detection_${alertData.id}_${Date.now()}`
      };

      console.log(`🔍 FALSE POSITIVE: Detection completed in ${processingTime}ms`);
      console.log(`🔍 FALSE POSITIVE: Result - Is FP: ${structuredResult.isFalsePositive}, Type: ${structuredResult.falsePositiveType}, Confidence: ${structuredResult.confidenceScore}%`);
      console.log(`🔍 FALSE POSITIVE: Auto-Resolution: ${structuredResult.autoResolutionRecommendation.shouldAutoResolve} (${structuredResult.autoResolutionRecommendation.confidenceLevel}%)`);
      
      return structuredResult;

    } catch (error) {
      console.error('❌ False positive detection failed:', error);
      return {
        success: false,
        error: error.message,
        isFalsePositive: false,
        confidenceScore: 0,
        autoResolutionRecommendation: {
          shouldAutoResolve: false,
          resolutionType: 'resolved',
          confidenceLevel: 0,
          reasoning: 'False positive detection failed - requires manual review',
          reviewRequired: true
        },
        processingTimeMs: Date.now() - (params.startTime || Date.now()),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate and structure tags from AI response
   */
  validateAndStructureTags(tags, maxTags = 20) {
    if (!Array.isArray(tags)) return [];

    return tags
      .filter(tag => tag && tag.tag && typeof tag.tag === 'string')
      .map(tag => ({
        tag: tag.tag.toLowerCase().replace(/\s+/g, '-'),
        category: tag.category || 'general',
        confidence: Math.min(1, Math.max(0, tag.confidence || 0.5)),
        reasoning: tag.reasoning || 'AI-generated tag'
      }))
      .slice(0, maxTags);
  }
}

module.exports = {
  ALERT_AI_TOOLS,
  AlertAIExecutor
};