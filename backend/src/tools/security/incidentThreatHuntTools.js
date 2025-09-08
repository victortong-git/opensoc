/**
 * Incident Threat Hunt Generation AI Tools
 * Specialized AI tools for generating threat hunts from security incidents
 */

const aiGenerationService = require('../../services/aiGenerationService');

/**
 * Generate comprehensive threat hunt from incident data
 * @param {Object} params - Tool parameters
 * @param {Object} context - Execution context
 * @returns {Object} Generated threat hunt data
 */
async function generate_threat_hunt_from_incident(params, context) {
  const { incidentContext, promptContent, organizationId, userId } = params;
  const startTime = Date.now();
  
  console.log(`🎯 Starting threat hunt generation for incident: ${incidentContext.id}`);
  
  try {
    // Build comprehensive system prompt for threat hunt generation
    const systemPrompt = `You are an expert threat hunting analyst specializing in creating comprehensive threat hunts based on security incidents. Your task is to analyze incident data and generate a structured threat hunting plan.

ANALYSIS REQUIREMENTS:
- Analyze incident context including description, severity, category, and related alerts
- Extract IOCs and threat indicators for hunt focus
- Map to MITRE ATT&CK techniques based on incident characteristics
- Generate specific hunting queries and investigation steps
- Provide realistic effort estimates and success criteria
- Consider organizational context and threat landscape

OUTPUT FORMAT:
Return a JSON object with the following structure:
{
  "title": "Hunt: [descriptive title based on incident]",
  "description": "Comprehensive description of the threat hunt objectives",
  "priority": [1-5 based on incident severity],
  "category": "[appropriate hunt category]",
  "huntType": "[proactive/reactive/intel_driven]",
  "huntingPlan": "Detailed methodology and approach (markdown format)",
  "successCriteria": "Clear definition of successful hunt outcomes",
  "estimatedEffort": "Realistic time estimate (e.g., '4-8 hours')",
  "huntQueries": ["Array of specific hunting queries/commands"],
  "investigationSteps": ["Array of step-by-step investigation actions"],
  "expectedFindings": "What we expect to discover during the hunt",
  "mitreTactics": ["Array of relevant MITRE ATT&CK tactics"],
  "mitreTechniques": ["Array of relevant MITRE ATT&CK techniques"],
  "threatsDetected": ["Array of potential threat types"],
  "coverageGaps": "Analysis of potential blind spots and additional hunts needed",
  "confidence": [0-100],
  "metadata": {
    "sourceIncidentId": "${incidentContext.id}",
    "generatedBy": "ai_threat_hunt_generator",
    "basedOnAlerts": ${incidentContext.alertCount}
  }
}

QUALITY STANDARDS:
- Be specific and actionable in all recommendations
- Base hunting queries on actual IOCs when available
- Map techniques accurately to observed behaviors
- Provide realistic effort estimates
- Consider both technical and business impact`;

    // Create user prompt with incident context
    const userPrompt = promptContent;

    console.log('🧠 Generating threat hunt with AI...');
    console.log('🎯 DEBUG AI TOOL: Calling aiGenerationService.generateTestResponse');
    console.log('🎯 DEBUG AI TOOL: organizationId:', organizationId);
    console.log('🎯 DEBUG AI TOOL: userId:', userId);
    console.log('🎯 DEBUG AI TOOL: contextType: threat_hunt_generation');
    
    // Call AI Generation Service (uses configured AI provider)
    const aiResult = await aiGenerationService.generateTestResponse({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      organizationId,
      userId,
      contextType: 'threat_hunt_generation',
      contextId: incidentContext.id,
      maxTokens: 4000,
      temperature: 0.7
    });

    console.log('🎯 DEBUG AI TOOL: AI service call completed');
    console.log('🎯 DEBUG AI TOOL: aiResult keys:', Object.keys(aiResult || {}));
    console.log('🎯 DEBUG AI TOOL: aiResult.response exists:', !!aiResult?.response);
    console.log('🎯 DEBUG AI TOOL: aiResult.content exists:', !!aiResult?.content);
    
    const aiResponse = aiResult.response || aiResult.content;
    if (!aiResponse) {
      console.error('🎯 DEBUG AI TOOL: No AI response received!');
      console.error('🎯 DEBUG AI TOOL: aiResult full object:', aiResult);
      throw new Error(`AI generation failed: No response generated`);
    }

    console.log('📝 Parsing AI response...');
    console.log('🎯 DEBUG AI TOOL: AI response length:', aiResponse.length);
    console.log('🎯 DEBUG AI TOOL: AI response preview:', aiResponse.substring(0, 200) + '...');
    
    // Parse the AI response
    let threatHuntData;
    let jsonMatch = null;
    
    try {
      // Extract JSON from AI response (handle potential markdown wrapping)
      jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                  aiResponse.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        console.log('🎯 DEBUG AI TOOL: Attempting to parse JSON, length:', jsonMatch[1].length);
        console.log('🎯 DEBUG AI TOOL: JSON content preview:', jsonMatch[1].substring(0, 500) + '...');
        threatHuntData = JSON.parse(jsonMatch[1]);
      } else {
        console.error('🎯 DEBUG AI TOOL: No JSON match found in AI response');
        console.error('🎯 DEBUG AI TOOL: AI response sample:', aiResponse.substring(0, 1000) + '...');
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('🎯 DEBUG AI TOOL: Failed to parse AI response as JSON:', parseError);
      console.error('🎯 DEBUG AI TOOL: Parse error position:', parseError.message);
      if (jsonMatch && jsonMatch[1]) {
        console.error('🎯 DEBUG AI TOOL: Problematic JSON around position:', jsonMatch[1].substring(0, 200) + '...');
        console.error('🎯 DEBUG AI TOOL: Full JSON content length:', jsonMatch[1].length);
      }
      throw new Error(`Invalid AI response format: ${parseError.message}`);
    }

    // Validate required fields and their content
    const requiredFields = ['title', 'description', 'huntingPlan', 'successCriteria'];
    const missingFields = [];
    const emptyFields = [];
    
    for (const field of requiredFields) {
      if (!threatHuntData[field]) {
        missingFields.push(field);
      } else if (typeof threatHuntData[field] === 'string' && threatHuntData[field].trim().length === 0) {
        emptyFields.push(field);
      }
    }
    
    if (missingFields.length > 0 || emptyFields.length > 0) {
      const errorMsg = [];
      if (missingFields.length > 0) {
        errorMsg.push(`Missing fields: ${missingFields.join(', ')}`);
      }
      if (emptyFields.length > 0) {
        errorMsg.push(`Empty fields: ${emptyFields.join(', ')}`);
      }
      console.error('🎯 DEBUG AI TOOL: Field validation failed:', errorMsg.join('; '));
      console.error('🎯 DEBUG AI TOOL: Received threat hunt data:', threatHuntData);
      throw new Error(`AI generated incomplete threat hunt data: ${errorMsg.join('; ')}`);
    }

    // Validate that the fields contain meaningful content (not just placeholder text)
    if (threatHuntData.title && (threatHuntData.title.toLowerCase().includes('todo') || threatHuntData.title.toLowerCase().includes('placeholder'))) {
      throw new Error('AI generated placeholder content instead of real threat hunt data');
    }

    // Enhance data with context-specific information
    threatHuntData = await _enhanceThreatHuntData(threatHuntData, incidentContext);
    
    // Validate hunt queries for safety
    threatHuntData.huntQueries = _validateHuntQueries(threatHuntData.huntQueries || []);
    
    console.log('✅ Threat hunt generated successfully');
    console.log('🎯 DEBUG AI TOOL: Final threat hunt data keys:', Object.keys(threatHuntData || {}));
    console.log('🎯 DEBUG AI TOOL: Final threat hunt data title:', threatHuntData?.title);
    
    const finalResult = {
      success: true,
      result: threatHuntData,
      processingTimeMs: Date.now() - startTime,
      aiModel: 'gpt-oss-20b',
      generatedAt: new Date().toISOString()
    };
    
    console.log('🎯 DEBUG AI TOOL: Returning final result with keys:', Object.keys(finalResult));
    console.log('🎯 DEBUG AI TOOL: Final result success:', finalResult.success);
    console.log('🎯 DEBUG AI TOOL: Final result has result data:', !!finalResult.result);
    
    return finalResult;

  } catch (error) {
    console.error('❌ Threat hunt generation failed:', error);
    
    // Check if this is an AI provider issue and we should provide fallback content
    const isAIProviderIssue = error.message && (
      error.message.includes('AI generation failed') ||
      error.message.includes('No response generated') ||
      error.message.includes('timeout') ||
      error.message.includes('No valid JSON found') ||
      error.message.includes('Invalid AI response format') ||
      error.message.includes('AI generated incomplete')
    );
    
    if (isAIProviderIssue) {
      console.log('🎯 AI provider issue detected, generating fallback threat hunt content...');
      try {
        const fallbackThreatHunt = _generateFallbackThreatHunt(incidentContext);
        console.log('✅ Fallback threat hunt content generated successfully');
        
        return {
          success: true,
          result: fallbackThreatHunt,
          processingTimeMs: Date.now() - startTime,
          fallbackUsed: true,
          originalError: error.message
        };
      } catch (fallbackError) {
        console.error('❌ Fallback content generation also failed:', fallbackError);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Threat hunt generation failed',
      processingTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Generate fallback threat hunt content when AI fails
 * @private
 */
function _generateFallbackThreatHunt(incidentContext) {
  const incident = incidentContext;
  const severity = incident.severity || 3;
  const category = incident.category || 'unknown';
  const title = incident.title || 'Security Incident';
  
  // Map incident categories to hunting approaches
  const huntingApproaches = {
    malware: {
      tactics: ['Initial Access', 'Execution', 'Persistence', 'Defense Evasion'],
      techniques: ['T1566.001', 'T1059.001', 'T1053.005', 'T1055'],
      queries: [
        'Search for suspicious process execution patterns',
        'Check for unusual network connections',
        'Look for file system modifications',
        'Review authentication logs for anomalies'
      ]
    },
    phishing: {
      tactics: ['Initial Access', 'Collection', 'Exfiltration'],
      techniques: ['T1566.002', 'T1114', 'T1041'],
      queries: [
        'Analyze email headers and attachments',
        'Search for credential harvesting indicators',
        'Review web proxy logs for suspicious domains',
        'Check for data exfiltration patterns'
      ]
    },
    intrusion: {
      tactics: ['Initial Access', 'Lateral Movement', 'Impact'],
      techniques: ['T1190', 'T1021.001', 'T1486'],
      queries: [
        'Monitor for lateral movement indicators',
        'Check for privilege escalation attempts',
        'Review system configuration changes',
        'Analyze network traffic anomalies'
      ]
    },
    data_breach: {
      tactics: ['Collection', 'Exfiltration', 'Impact'],
      techniques: ['T1005', 'T1041', 'T1485'],
      queries: [
        'Search for data access patterns',
        'Monitor file transfer activities',
        'Check database query logs',
        'Review user access modifications'
      ]
    }
  };
  
  const approach = huntingApproaches[category] || huntingApproaches.malware;
  
  // Generate priority based on severity
  const priority = severity >= 4 ? 5 : severity >= 3 ? 4 : severity >= 2 ? 3 : 2;
  
  return {
    title: `Hunt: ${title}`,
    description: `Proactive threat hunt based on the security incident "${title}". This hunt aims to identify similar threats, validate the scope of impact, and discover any related malicious activity that may have been missed during initial incident response.`,
    priority,
    category: 'reactive',
    huntType: 'reactive',
    huntingPlan: `## Hunting Methodology

### Objective
Investigate and hunt for threats related to the ${category} incident to ensure complete threat eradication and identify any lateral movement or persistence mechanisms.

### Approach
1. **Initial Scope Assessment**: Review the original incident context and affected systems
2. **Indicator Development**: Extract IOCs and behavioral patterns from the incident
3. **Historical Analysis**: Search for similar patterns in historical data (30-90 days)
4. **Lateral Movement Hunt**: Look for signs of threat actor movement across the environment
5. **Persistence Check**: Hunt for any backdoors or persistence mechanisms installed

### Success Metrics
- Complete timeline of threat actor activity
- Identification of all affected systems
- Validation that threat has been fully contained
- Documentation of lessons learned for future prevention`,
    successCriteria: 'Successfully validate that the threat has been fully contained and no additional compromised systems exist. Document complete timeline of threat actor activity and any persistence mechanisms discovered.',
    estimatedEffort: severity >= 4 ? '8-16 hours' : severity >= 3 ? '4-8 hours' : '2-4 hours',
    huntQueries: approach.queries,
    investigationSteps: [
      'Review original incident timeline and affected systems',
      'Extract IOCs and behavioral indicators from incident data',
      'Search historical logs for similar patterns or indicators',
      'Analyze network traffic for unusual communication patterns',
      'Check for signs of lateral movement or privilege escalation',
      'Validate system integrity and look for persistence mechanisms',
      'Document findings and update incident response procedures'
    ],
    expectedFindings: `Expected to discover the full scope of the ${category} incident, identify any missed indicators of compromise, and validate that remediation efforts were complete. May uncover additional affected systems or persistence mechanisms.`,
    mitreTactics: approach.tactics,
    mitreTechniques: approach.techniques,
    threatsDetected: [category, 'lateral_movement', 'persistence'],
    coverageGaps: 'This hunt focuses on reactive investigation. Consider follow-up proactive hunts for similar threat patterns and preventive control validation.',
    confidence: 75,
    metadata: {
      sourceIncidentId: incident.id,
      generatedBy: 'fallback_threat_hunt_generator',
      basedOnAlerts: incident.alertCount || 0,
      fallbackGenerated: true,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Enhance threat hunt data with additional context and validation
 * @private
 */
async function _enhanceThreatHuntData(threatHuntData, incidentContext) {
  try {
    // Ensure priority mapping aligns with incident severity
    if (!threatHuntData.priority && incidentContext.severity) {
      threatHuntData.priority = Math.min(incidentContext.severity + 1, 5);
    }
    
    // Set hunt type based on incident characteristics
    if (!threatHuntData.huntType) {
      if (incidentContext.status === 'investigating' || incidentContext.status === 'open') {
        threatHuntData.huntType = 'reactive';
      } else {
        threatHuntData.huntType = 'intel_driven';
      }
    }
    
    // Enhance category based on incident category
    if (!threatHuntData.category && incidentContext.category) {
      const categoryMapping = {
        'malware': 'malware_hunt',
        'intrusion': 'network_hunt',
        'data_breach': 'behavioral_hunt',
        'policy_violation': 'endpoint_hunt',
        'insider_threat': 'behavioral_hunt'
      };
      threatHuntData.category = categoryMapping[incidentContext.category] || 'targeted_hunt';
    }
    
    // Ensure metadata includes source context
    threatHuntData.metadata = {
      ...threatHuntData.metadata,
      sourceIncidentTitle: incidentContext.title,
      sourceIncidentSeverity: incidentContext.severity,
      sourceIncidentCategory: incidentContext.category,
      relatedAlertsCount: incidentContext.alertCount,
      extractedIOCsCount: incidentContext.extractedIOCs?.length || 0,
      generatedAt: new Date().toISOString()
    };
    
    // Add IOC-specific hunt queries if IOCs were extracted
    if (incidentContext.extractedIOCs && incidentContext.extractedIOCs.length > 0) {
      const iocQueries = _generateIOCHuntQueries(incidentContext.extractedIOCs);
      threatHuntData.huntQueries = [...(threatHuntData.huntQueries || []), ...iocQueries];
    }
    
    return threatHuntData;
    
  } catch (error) {
    console.error('Error enhancing threat hunt data:', error);
    return threatHuntData; // Return original data if enhancement fails
  }
}

/**
 * Generate specific hunt queries for extracted IOCs
 * @private
 */
function _generateIOCHuntQueries(iocs) {
  const queries = [];
  
  iocs.forEach(ioc => {
    // Determine IOC type and create appropriate query
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ioc)) {
      // IP Address
      queries.push(`source_ip="${ioc}" OR destination_ip="${ioc}" OR remote_ip="${ioc}"`);
    } else if (/^[a-fA-F0-9]{32}$/.test(ioc)) {
      // MD5 Hash
      queries.push(`file_hash="${ioc}" OR md5="${ioc}"`);
    } else if (/^[a-fA-F0-9]{40}$/.test(ioc)) {
      // SHA1 Hash  
      queries.push(`file_hash="${ioc}" OR sha1="${ioc}"`);
    } else if (/^[a-fA-F0-9]{64}$/.test(ioc)) {
      // SHA256 Hash
      queries.push(`file_hash="${ioc}" OR sha256="${ioc}"`);
    } else if (ioc.includes('.') && !ioc.includes('/')) {
      // Domain
      queries.push(`domain="${ioc}" OR dns_query="${ioc}" OR hostname="${ioc}"`);
    }
  });
  
  return queries;
}

/**
 * Validate hunt queries for safety and syntax
 * @private
 */
function _validateHuntQueries(queries) {
  const validQueries = [];
  
  queries.forEach(query => {
    if (typeof query === 'string' && query.trim().length > 0) {
      // Basic safety checks - remove potentially dangerous commands
      const dangerousPatterns = [
        /rm\s+-rf/i,
        /delete\s+from/i,
        /drop\s+table/i,
        /shutdown/i,
        /reboot/i
      ];
      
      const isDangerous = dangerousPatterns.some(pattern => pattern.test(query));
      
      if (!isDangerous && query.length < 500) {
        validQueries.push(query.trim());
      }
    }
  });
  
  return validQueries;
}

/**
 * Proof-read threat hunt content for quality and clarity
 * @param {Object} params - Tool parameters
 * @param {Object} context - Execution context
 * @returns {Object} Proof-reading suggestions
 */
async function proofread_threat_hunt_content(params, context) {
  const { fieldsToProofRead, organizationId, userId, sessionId } = params;
  const startTime = Date.now();
  
  console.log('📝 Starting threat hunt content proof-reading...');
  
  try {
    const systemPrompt = `You are a professional threat hunting analyst and technical writer. Your task is to proof-read and improve threat hunting documentation.

ANALYSIS FOCUS:
- Clarity and technical accuracy
- Professional tone and structure  
- Actionable and specific language
- Proper threat hunting terminology
- Logical flow and completeness

RESPONSE FORMAT:
Return a JSON object where each key matches the input field name, and the value contains:
{
  "fieldName": {
    "suggestion": "improved text",
    "reasoning": "explanation of improvements made",
    "confidence": [0-100]
  }
}

QUALITY STANDARDS:
- Use clear, professional language
- Be specific and actionable
- Follow threat hunting best practices
- Maintain technical accuracy
- Improve readability without losing meaning`;

    const userPrompt = `Please proof-read and improve the following threat hunt content:

${Object.entries(fieldsToProofRead).map(([field, content]) => 
  `${field.toUpperCase()}:\n${content}\n`
).join('\n---\n')}

Focus on improving clarity, technical accuracy, and actionability while maintaining the original intent.`;

    // Call AI Generation Service (uses configured AI provider)
    const aiResult = await aiGenerationService.generateTestResponse({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      organizationId: organizationId,
      userId: userId,
      contextType: 'threat_hunt_proofreading',
      contextId: `proofreading_${Date.now()}`,
      maxTokens: 4000, // Increased from 2000 to handle larger proof-reading responses
      temperature: 0.3
    });

    const aiResponse = aiResult.response || aiResult.content;
    if (!aiResponse) {
      throw new Error(`Proof-reading failed: No response generated`);
    }

    // Parse AI response with enhanced error handling and JSON completion
    let suggestions;
    let jsonMatch = null;
    
    try {
      console.log('🔍 DEBUG: Parsing AI response, length:', aiResponse.length);
      
      // Try to find JSON in response
      jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                  aiResponse.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        let jsonContent = jsonMatch[1];
        console.log('🔍 DEBUG: Extracted JSON content length:', jsonContent.length);
        console.log('🔍 DEBUG: JSON content preview:', jsonContent.substring(0, 200) + '...');
        
        // Check if JSON is truncated and try to fix simple cases
        if (!jsonContent.trim().endsWith('}')) {
          console.log('🔍 DEBUG: JSON appears truncated, attempting to fix...');
          // Count opening and closing braces
          const openBraces = (jsonContent.match(/\{/g) || []).length;
          const closeBraces = (jsonContent.match(/\}/g) || []).length;
          
          // Add missing closing braces
          const missingBraces = openBraces - closeBraces;
          if (missingBraces > 0) {
            jsonContent += '}'.repeat(missingBraces);
            console.log('🔍 DEBUG: Added', missingBraces, 'closing braces to fix truncated JSON');
          }
        }
        
        suggestions = JSON.parse(jsonContent);
        console.log('🔍 DEBUG: Successfully parsed JSON with keys:', Object.keys(suggestions));
      } else {
        console.error('🔍 DEBUG: No JSON pattern found in response');
        console.error('🔍 DEBUG: Response preview:', aiResponse.substring(0, 500) + '...');
        throw new Error('No valid JSON found in proof-reading response');
      }
    } catch (parseError) {
      console.error('Failed to parse proof-reading response:', parseError);
      if (jsonMatch && jsonMatch[1]) {
        console.error('Problematic JSON content:', jsonMatch[1].substring(0, 500) + '...');
        console.error('Full JSON length:', jsonMatch[1].length);
      }
      throw new Error(`Invalid proof-reading response format: ${parseError.message}`);
    }

    console.log('✅ Proof-reading completed successfully');
    
    return {
      success: true,
      result: suggestions,
      processingTimeMs: Date.now() - startTime
    };

  } catch (error) {
    console.error('❌ Proof-reading failed:', error);
    
    return {
      success: false,
      error: error.message || 'Proof-reading failed',
      processingTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Incident Threat Hunt Executor
 * Handles threat hunt generation from incident context
 */
class IncidentThreatHuntExecutor {
  constructor() {
    this.toolRegistry = {
      'generate_threat_hunt_from_incident': generate_threat_hunt_from_incident,
      'proofread_threat_hunt_content': proofread_threat_hunt_content
    };
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName, params, context) {
    const tool = this.toolRegistry[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await tool(params, context);
  }

  /**
   * Get available tools
   */
  getAvailableTools() {
    return Object.keys(this.toolRegistry);
  }
}

module.exports = {
  generate_threat_hunt_from_incident,
  proofread_threat_hunt_content,
  IncidentThreatHuntExecutor
};