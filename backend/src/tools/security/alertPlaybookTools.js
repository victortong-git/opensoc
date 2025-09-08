/**
 * Alert Playbook AI Tools for AI Chat System
 * Provides specialized AI-powered playbook generation capabilities using enriched context data
 */

const aiGenerationService = require('../../services/aiGenerationService');

const ALERT_PLAYBOOK_TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_immediate_action_playbook",
      description: "Generate AI-powered immediate action playbook for security alert containment and stabilization using enriched context data",
      category: "Playbook Generation",
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
            description: "Alert data for playbook generation"
          },
          analysisResults: {
            type: "object",
            properties: {
              securityEventType: { type: "string", description: "Classified security event type" },
              riskAssessment: { type: "object", description: "Risk assessment with level, score, and factors" },
              recommendedActions: { type: "object", description: "AI-recommended immediate and follow-up actions" },
              confidence: { type: "integer", description: "Analysis confidence percentage" },
              summary: { type: "string", description: "Analysis summary" },
              explanation: { type: "string", description: "Detailed analysis explanation" }
            },
            description: "AI analysis results to enrich playbook context"
          },
          mitreResults: {
            type: "object",
            properties: {
              techniques: { type: "array", description: "Mapped MITRE ATT&CK techniques" },
              tactics: { type: "array", description: "Relevant MITRE tactics" },
              killChainCoverage: { type: "object", description: "Kill chain coverage analysis" },
              domainClassification: { type: "object", description: "MITRE domain classification results" }
            },
            description: "MITRE ATT&CK analysis results for technique-specific guidance"
          },
          assetInfo: {
            type: "object",
            properties: {
              name: { type: "string", description: "Asset name" },
              assetType: { type: "string", description: "Asset type" },
              criticality: { type: "string", description: "Asset criticality level" },
              ipAddress: { type: "string", description: "Asset IP address" },
              hostname: { type: "string", description: "Asset hostname" },
              location: { type: "string", description: "Asset location" },
              osType: { type: "string", description: "Operating system type" }
            },
            description: "Asset information for context-specific playbook steps"
          },
          organizationId: {
            type: "string",
            description: "Organization ID for context"
          },
          userId: {
            type: "string",
            description: "User ID requesting the playbook generation"
          }
        },
        required: ["alertData", "analysisResults"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_investigation_playbook",
      description: "Generate AI-powered comprehensive investigation playbook for security alert forensic analysis using enriched context data",
      category: "Playbook Generation",
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
            description: "Alert data for playbook generation"
          },
          analysisResults: {
            type: "object",
            properties: {
              securityEventType: { type: "string", description: "Classified security event type" },
              riskAssessment: { type: "object", description: "Risk assessment with level, score, and factors" },
              recommendedActions: { type: "object", description: "AI-recommended immediate and follow-up actions" },
              confidence: { type: "integer", description: "Analysis confidence percentage" },
              summary: { type: "string", description: "Analysis summary" },
              explanation: { type: "string", description: "Detailed analysis explanation" }
            },
            description: "AI analysis results to enrich playbook context"
          },
          mitreResults: {
            type: "object",
            properties: {
              techniques: { type: "array", description: "Mapped MITRE ATT&CK techniques" },
              tactics: { type: "array", description: "Relevant MITRE tactics" },
              killChainCoverage: { type: "object", description: "Kill chain coverage analysis" },
              domainClassification: { type: "object", description: "MITRE domain classification results" }
            },
            description: "MITRE ATT&CK analysis results for technique-specific investigation guidance"
          },
          assetInfo: {
            type: "object",
            properties: {
              name: { type: "string", description: "Asset name" },
              assetType: { type: "string", description: "Asset type" },
              criticality: { type: "string", description: "Asset criticality level" },
              ipAddress: { type: "string", description: "Asset IP address" },
              hostname: { type: "string", description: "Asset hostname" },
              location: { type: "string", description: "Asset location" },
              osType: { type: "string", description: "Operating system type" }
            },
            description: "Asset information for context-specific investigation steps"
          },
          organizationId: {
            type: "string",
            description: "Organization ID for context"
          },
          userId: {
            type: "string",
            description: "User ID requesting the playbook generation"
          }
        },
        required: ["alertData", "analysisResults"]
      }
    }
  }
];

/**
 * Alert Playbook Tools Executor
 */
class AlertPlaybookExecutor {
  constructor() {
    this.aiService = aiGenerationService;
  }

  /**
   * Generate immediate action playbook using enriched context data
   */
  async generateImmediateActionPlaybook(params) {
    try {
      const { alertData, analysisResults, mitreResults = {}, assetInfo = null, organizationId, userId } = params;
      const startTime = Date.now();

      console.log(`🎯 PLAYBOOK TOOL: generateImmediateActionPlaybook called for alert: ${alertData.title}`);
      console.log(`📊 Context available - Analysis: ${!!analysisResults}, MITRE: ${!!mitreResults.techniques}, Asset: ${!!assetInfo}`);

      const prompt = this.buildImmediateActionPrompt(alertData, analysisResults, mitreResults, assetInfo);

      // Call AI Generation Service
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId: organizationId || 1,
        userId,
        contextType: 'alert_playbook_immediate_tool',
        contextId: alertData.id,
        model: null,
        maxTokens: 4500,
        temperature: 0.7
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;

      console.log(`🎯 PLAYBOOK TOOL: AI response received, length: ${aiResponse?.length || 0} characters`);

      // Parse the playbook response
      const playbookData = this.parsePlaybookResponse(aiResponse, 'Immediate Action Playbook');

      const structuredResult = {
        success: true,
        playbookType: 'immediate_action',
        name: playbookData.name,
        description: playbookData.description,
        category: playbookData.category || this.getCategoryFromEventType(analysisResults.securityEventType),
        steps: playbookData.steps || [],
        estimatedTime: playbookData.estimatedTime || '30-60 minutes',
        prerequisites: playbookData.prerequisites || [],
        successCriteria: playbookData.successCriteria || [],
        metadata: {
          generatedWith: 'playbook_tool',
          sourceAlert: {
            id: alertData.id,
            title: alertData.title,
            severity: alertData.severity,
            securityEventType: analysisResults.securityEventType
          },
          contextEnrichment: {
            hasAnalysis: !!analysisResults,
            hasMitreData: !!(mitreResults.techniques && mitreResults.techniques.length > 0),
            hasAssetInfo: !!assetInfo,
            mitreVectorCount: mitreResults.techniques?.length || 0
          },
          processingTimeMs: processingTime,
          aiModel: 'configured',
          confidence: analysisResults.confidence || 75
        },
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Immediate action playbook generated successfully in ${processingTime}ms - ${playbookData.steps?.length || 0} steps`);
      return structuredResult;

    } catch (error) {
      console.error('❌ Immediate action playbook generation failed:', error);
      return {
        success: false,
        error: error.message,
        playbookType: 'immediate_action',
        processingTimeMs: Date.now() - (params.startTime || Date.now()),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate investigation playbook using enriched context data
   */
  async generateInvestigationPlaybook(params) {
    try {
      const { alertData, analysisResults, mitreResults = {}, assetInfo = null, organizationId, userId } = params;
      const startTime = Date.now();

      console.log(`🔍 PLAYBOOK TOOL: generateInvestigationPlaybook called for alert: ${alertData.title}`);
      console.log(`📊 Context available - Analysis: ${!!analysisResults}, MITRE: ${!!mitreResults.techniques}, Asset: ${!!assetInfo}`);

      const prompt = this.buildInvestigationPrompt(alertData, analysisResults, mitreResults, assetInfo);

      // Call AI Generation Service
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId: organizationId || 1,
        userId,
        contextType: 'alert_playbook_investigation_tool',
        contextId: alertData.id,
        model: null,
        maxTokens: 8000,
        temperature: 0.7
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - startTime;

      console.log(`🔍 PLAYBOOK TOOL: AI response received, length: ${aiResponse?.length || 0} characters`);

      // Parse the playbook response
      const playbookData = this.parsePlaybookResponse(aiResponse, 'Investigation Playbook');

      const structuredResult = {
        success: true,
        playbookType: 'investigation',
        name: playbookData.name,
        description: playbookData.description,
        category: playbookData.category || this.getCategoryFromEventType(analysisResults.securityEventType),
        steps: playbookData.steps || [],
        estimatedTime: playbookData.estimatedTime || '4-8 hours',
        prerequisites: playbookData.prerequisites || [],
        deliverables: playbookData.deliverables || playbookData.successCriteria || [],
        legalConsiderations: playbookData.legalConsiderations || [],
        metadata: {
          generatedWith: 'playbook_tool',
          sourceAlert: {
            id: alertData.id,
            title: alertData.title,
            severity: alertData.severity,
            securityEventType: analysisResults.securityEventType
          },
          contextEnrichment: {
            hasAnalysis: !!analysisResults,
            hasMitreData: !!(mitreResults.techniques && mitreResults.techniques.length > 0),
            hasAssetInfo: !!assetInfo,
            mitreVectorCount: mitreResults.techniques?.length || 0
          },
          processingTimeMs: processingTime,
          aiModel: 'configured',
          confidence: analysisResults.confidence || 75
        },
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Investigation playbook generated successfully in ${processingTime}ms - ${playbookData.steps?.length || 0} steps`);
      return structuredResult;

    } catch (error) {
      console.error('❌ Investigation playbook generation failed:', error);
      return {
        success: false,
        error: error.message,
        playbookType: 'investigation',
        processingTimeMs: Date.now() - (params.startTime || Date.now()),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build immediate action playbook prompt with enriched context
   */
  buildImmediateActionPrompt(alertData, analysisResults, mitreResults, assetInfo) {
    const mitreContext = this.buildMitreContext(mitreResults);
    const assetContext = this.buildAssetContext(assetInfo);

    return `As a senior SOC analyst, create an IMMEDIATE ACTION playbook for this security alert using enriched context data. Focus on urgent containment and stabilization actions that must be taken in the first 30 minutes to prevent further damage.

ALERT INFORMATION:
==================
Alert ID: ${alertData.id}
Title: ${alertData.title}
Description: ${alertData.description}
Severity: ${alertData.severity}/5 (${alertData.severity >= 4 ? 'HIGH/CRITICAL' : alertData.severity >= 3 ? 'MEDIUM' : 'LOW'})
Source System: ${alertData.sourceSystem || 'Unknown'}
Event Time: ${alertData.eventTime || 'Unknown'}
Current Status: ${alertData.status || 'Unknown'}

${assetContext}

AI ANALYSIS RESULTS:
====================
Security Event Type: ${analysisResults.securityEventType}
Risk Level: ${analysisResults.riskAssessment?.level} (Score: ${analysisResults.riskAssessment?.score}/10)
AI Confidence: ${analysisResults.confidence}%
Risk Factors: ${analysisResults.riskAssessment?.factors?.join(', ') || 'Not specified'}

ANALYSIS SUMMARY:
${analysisResults.summary}

DETAILED EXPLANATION:
${analysisResults.explanation}

RECOMMENDED ACTIONS FROM AI ANALYSIS:
Immediate: ${analysisResults.recommendedActions?.immediate?.join(', ') || 'Not specified'}
Follow-up: ${analysisResults.recommendedActions?.followUp?.join(', ') || 'Not specified'}

${mitreContext}

RAW EVENT DATA:
===============
${JSON.stringify(alertData.rawData, null, 2)}

THREAT INTELLIGENCE:
====================
${JSON.stringify(alertData.enrichmentData, null, 2)}

Create a structured playbook with 5-8 immediate action steps. Each step should be:
- Actionable within 5-15 minutes
- Focused on containment and damage prevention
- Specific to this alert type and asset
- Enhanced with MITRE technique-specific guidance where applicable
- Include exact commands, tools, and validation steps

IMPORTANT: Generate the response as valid JSON. Use double quotes for all strings and escape any internal quotes with backslashes.

Generate the response in this exact JSON format:
{
  "name": "Immediate Action: [Alert-specific title]",
  "description": "Immediate containment and stabilization actions for this security alert",
  "category": "[security event category]",
  "steps": [
    {
      "id": 1,
      "title": "Step title (max 60 chars)",
      "description": "Detailed step instructions with specific commands and procedures, enhanced with MITRE technique context where relevant",
      "expectedTime": "X minutes",
      "priority": "critical|high|medium",
      "tools": ["Tool1", "Tool2"],
      "commands": ["specific command 1", "specific command 2"],
      "validation": "How to verify this step was completed successfully",
      "escalationCondition": "When to escalate if step fails",
      "mitreRelevance": "Associated MITRE techniques if applicable"
    }
  ],
  "estimatedTime": "Total estimated time in minutes",
  "prerequisites": ["What must be available before starting"],
  "successCriteria": ["How to know the immediate response was successful"]
}

Focus on containment, asset isolation, evidence preservation, and immediate threat neutralization. Make it specific to the ${alertData.assetName || 'affected system'} and ${analysisResults.securityEventType} event type.

For commands containing quotes or special characters, properly escape them in JSON (use \\" for quotes).

RESPOND WITH ONLY THE JSON OBJECT:`;
  }

  /**
   * Build investigation playbook prompt with enriched context
   */
  buildInvestigationPrompt(alertData, analysisResults, mitreResults, assetInfo) {
    const mitreContext = this.buildMitreContext(mitreResults);
    const assetContext = this.buildAssetContext(assetInfo);

    return `As a digital forensics expert, create a comprehensive INVESTIGATION playbook for this security alert using enriched context data. Focus on thorough evidence collection, analysis, and forensic investigation procedures.

ALERT INFORMATION:
==================
Alert ID: ${alertData.id}
Title: ${alertData.title}
Description: ${alertData.description}
Severity: ${alertData.severity}/5 (${alertData.severity >= 4 ? 'HIGH/CRITICAL' : alertData.severity >= 3 ? 'MEDIUM' : 'LOW'})
Source System: ${alertData.sourceSystem || 'Unknown'}
Event Time: ${alertData.eventTime || 'Unknown'}
Current Status: ${alertData.status || 'Unknown'}

${assetContext}

AI ANALYSIS RESULTS:
====================
Security Event Type: ${analysisResults.securityEventType}
Risk Level: ${analysisResults.riskAssessment?.level} (Score: ${analysisResults.riskAssessment?.score}/10)
AI Confidence: ${analysisResults.confidence}%
Risk Factors: ${analysisResults.riskAssessment?.factors?.join(', ') || 'Not specified'}

ANALYSIS SUMMARY:
${analysisResults.summary}

DETAILED EXPLANATION:
${analysisResults.explanation}

RECOMMENDED ACTIONS FROM AI ANALYSIS:
Immediate: ${analysisResults.recommendedActions?.immediate?.join(', ') || 'Not specified'}
Follow-up: ${analysisResults.recommendedActions?.followUp?.join(', ') || 'Not specified'}

${mitreContext}

RAW EVENT DATA:
===============
${JSON.stringify(alertData.rawData, null, 2)}

THREAT INTELLIGENCE:
====================
${JSON.stringify(alertData.enrichmentData, null, 2)}

Create a detailed investigation playbook with 8-12 comprehensive steps covering:
- Evidence collection and preservation (enhanced with MITRE technique context)
- Digital forensics procedures specific to identified TTPs
- Network traffic analysis guided by MITRE tactics
- Malware analysis (if applicable) using technique-specific approaches
- Timeline reconstruction based on kill chain analysis
- Root cause analysis considering MITRE framework
- Attribution assessment using mapped techniques
- Documentation and reporting

Generate the response in this exact JSON format:
{
  "name": "Investigation: [Alert-specific title]",
  "description": "Comprehensive forensic investigation procedures for this security alert",
  "category": "[security event category]",
  "steps": [
    {
      "id": 1,
      "title": "Step title (max 60 chars)",
      "description": "Detailed forensic procedures with specific methodologies and tools, enhanced with MITRE technique guidance",
      "expectedTime": "X hours/days",
      "priority": "critical|high|medium",
      "tools": ["Forensic Tool 1", "Analysis Tool 2"],
      "commands": ["specific forensic command 1", "analysis command 2"],
      "validation": "How to verify evidence collection/analysis was successful",
      "artifacts": ["Evidence artifacts to collect", "Log files to preserve"],
      "documentation": "What to document for this step",
      "mitreRelevance": "Associated MITRE techniques and detection methods"
    }
  ],
  "estimatedTime": "Total estimated investigation time",
  "prerequisites": ["Skills, tools, and access required"],
  "deliverables": ["Investigation report sections", "Evidence packages"],
  "legalConsiderations": ["Chain of custody requirements", "Legal preservation needs"]
}

Focus on thorough investigation methodology for ${analysisResults.securityEventType} events on ${alertData.assetName || 'affected systems'}. Include specific forensic techniques, analysis procedures, and evidence handling enhanced with MITRE ATT&CK context.

RESPOND WITH ONLY THE JSON OBJECT:`;
  }

  /**
   * Build MITRE context section for prompts
   */
  buildMitreContext(mitreResults) {
    if (!mitreResults.techniques || mitreResults.techniques.length === 0) {
      return `MITRE ATT&CK ANALYSIS:
=======================
No MITRE techniques mapped for this alert. Consider standard threat hunting approaches.`;
    }

    const topTechniques = mitreResults.techniques.slice(0, 10);
    const techniqueList = topTechniques.map(t => 
      `- ${t.id}: ${t.name} (${t.source_domain || 'enterprise'} domain, confidence: ${(t.confidence_score || 0.5).toFixed(2)})`
    ).join('\n');

    return `MITRE ATT&CK ANALYSIS:
=======================
Mapped Techniques: ${mitreResults.techniques.length}
Kill Chain Coverage: ${mitreResults.killChainCoverage?.coverage_percentage || 'Unknown'}%

Top Relevant Techniques:
${techniqueList}

Tactical Context: ${mitreResults.killChainCoverage?.covered_tactics?.join(', ') || 'Multiple tactics identified'}`;
  }

  /**
   * Build asset context section for prompts
   */
  buildAssetContext(assetInfo) {
    if (!assetInfo) {
      return `AFFECTED ASSET INFORMATION:
===========================
Asset Name: Unknown
Detailed asset information not available`;
    }

    return `AFFECTED ASSET INFORMATION:
===========================
Asset Name: ${assetInfo.name || 'Unknown'}
Asset Type: ${assetInfo.assetType || 'Unknown'}
IP Address: ${assetInfo.ipAddress || 'Not specified'}
Hostname: ${assetInfo.hostname || 'Not specified'}
Criticality: ${assetInfo.criticality || 'Unknown'}
Location: ${assetInfo.location || 'Not specified'}
OS Type: ${assetInfo.osType || 'Not specified'}`;
  }

  /**
   * Parse AI response and extract playbook data with error handling
   */
  parsePlaybookResponse(aiResponse, fallbackTitle) {
    try {
      // Extract JSON from response
      let cleanedResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Enhanced JSON extraction with better error handling
      let jsonString = this.extractJsonFromResponse(cleanedResponse);
      
      if (!jsonString) {
        throw new Error('No valid JSON structure found in AI response');
      }
      
      // Try to fix common JSON formatting issues before parsing
      jsonString = this.preprocessJsonForParsing(jsonString);
      
      const playbookData = JSON.parse(jsonString);
      
      // Validate required fields and provide defaults
      return {
        name: playbookData.name || fallbackTitle,
        description: playbookData.description || 'AI-generated security playbook',
        category: playbookData.category || 'security_incident',
        steps: Array.isArray(playbookData.steps) ? playbookData.steps : [],
        estimatedTime: playbookData.estimatedTime || 'Variable',
        prerequisites: playbookData.prerequisites || [],
        successCriteria: playbookData.successCriteria || playbookData.deliverables || [],
        legalConsiderations: playbookData.legalConsiderations || [],
        deliverables: playbookData.deliverables || []
      };
      
    } catch (parseError) {
      console.error('Failed to parse AI playbook response:', parseError);
      console.error('AI response length:', aiResponse.length);
      console.error('AI response sample (first 800 chars):', aiResponse.substring(0, 800));
      
      // Throw error instead of providing fallback - fail fast for honest error reporting
      throw new Error(`AI playbook generation failed - unable to parse response: ${parseError.message}`);
    }
  }

  /**
   * Extract JSON from AI response with improved logic
   */
  extractJsonFromResponse(response) {
    // Try to find the main JSON object
    let startIndex = response.indexOf('{');
    if (startIndex === -1) return null;
    
    // Use a simple bracket counter to find the matching closing brace
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < response.length; i++) {
      const char = response[i];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex === -1) {
      // Try the original regex approach as fallback
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : null;
    }
    
    return response.substring(startIndex, endIndex + 1);
  }

  /**
   * Preprocess JSON string to fix common formatting issues
   */
  preprocessJsonForParsing(jsonString) {
    // Fix common issues with unescaped quotes in command strings
    let processed = jsonString;
    
    // Fix unescaped quotes in command arrays and tool arrays
    processed = processed.replace(
      /"commands":\s*\[(.*?)\]/gs,
      (match, content) => {
        // Escape quotes within command strings but preserve array structure
        let fixed = content.replace(/"([^"]*)'([^"]*)"/g, '"$1\'$2"');
        return `"commands": [${fixed}]`;
      }
    );
    
    processed = processed.replace(
      /"tools":\s*\[(.*?)\]/gs,
      (match, content) => {
        // Escape quotes within tool strings
        let fixed = content.replace(/"([^"]*)'([^"]*)"/g, '"$1\'$2"');
        return `"tools": [${fixed}]`;
      }
    );
    
    return processed;
  }

  /**
   * Map security event type to playbook category
   */
  getCategoryFromEventType(securityEventType) {
    const categoryMap = {
      'malware_detection': 'malware',
      'ransomware': 'malware',
      'trojan': 'malware',
      'virus': 'malware',
      'network_intrusion': 'intrusion',
      'unauthorized_access': 'intrusion',
      'privilege_escalation': 'intrusion',
      'data_exfiltration': 'data_breach',
      'data_breach': 'data_breach',
      'phishing': 'phishing',
      'insider_threat': 'insider_threat',
      'policy_violation': 'policy_violation',
      'compliance_violation': 'policy_violation'
    };

    return categoryMap[securityEventType] || 'security_incident';
  }
}

module.exports = {
  ALERT_PLAYBOOK_TOOLS,
  AlertPlaybookExecutor
};