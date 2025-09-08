const { models } = require('../database/models');
const toolExecutor = require('../tools/common/toolExecutor');
const { AlertMitreAnalyzer } = require('../tools/mitre/alertMitreAnalyzer');
const embeddingHelper = require('./embeddingHelper');

class AlertPlaybookService {
  constructor() {
    this.toolExecutor = toolExecutor;
    this.mitreAnalyzer = new AlertMitreAnalyzer();
  }

  /**
   * Generate AI-powered playbooks for a specific alert
   * Creates two playbooks: Immediate Action and Investigation
   */
  async generatePlaybooksForAlert(alert, user, options = {}) {
    const startTime = Date.now();

    try {
      // Validate that AI analysis exists
      if (!alert.aiAnalysis) {
        throw new Error('AI analysis must be completed before generating playbooks');
      }

      // Get asset information if available
      let assetInfo = null;
      if (alert.assetId) {
        assetInfo = await models.Asset.findOne({
          where: { id: alert.assetId, organizationId: alert.organizationId },
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner', 'osType', 'osVersion']
        });
      }

      // Generate both playbooks in parallel
      const [immediateActionPlaybook, investigationPlaybook] = await Promise.all([
        this.generateImmediateActionPlaybook(alert, assetInfo, user),
        this.generateInvestigationPlaybook(alert, assetInfo, user)
      ]);

      // Update alert with generated playbook IDs
      const playbookIds = [immediateActionPlaybook.id, investigationPlaybook.id];
      await alert.update({
        generatedPlaybookIds: playbookIds,
        playbooksGeneratedAt: new Date()
      });

      // Create timeline event
      await models.AlertTimelineEvent.create({
        alertId: alert.id,
        timestamp: new Date(),
        type: 'ai_analysis_completed',
        title: 'AI Playbooks Generated',
        description: `Generated Immediate Action and Investigation playbooks based on AI analysis with ${alert.aiAnalysis.confidence}% confidence`,
        aiSource: 'PLAYBOOK_GENERATION_AGENT',
        aiConfidence: alert.aiAnalysis.confidence,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          playbookIds: playbookIds,
          playbookTypes: ['immediate_action', 'investigation'],
          securityEventType: alert.aiAnalysis.securityEventType,
          riskLevel: alert.aiAnalysis.riskAssessment?.level,
          hasAssetInfo: !!assetInfo,
          aiModel: 'configured' // Using configured model from AI provider
        }
      });

      return {
        immediateActionPlaybook,
        investigationPlaybook,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      console.error('Alert playbook generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Immediate Action Playbook using AI Tool-based approach
   */
  async generateImmediateActionPlaybook(alert, assetInfo, user) {
    try {
      console.log(`🎯 Generating immediate action playbook using tool-based approach for alert: ${alert.id}`);

      // Gather enriched context data
      const contextData = await this.buildEnrichedContext(alert, assetInfo);

      // Use tool executor to generate playbook
      const toolResult = await this.toolExecutor.executeTool('generate_immediate_action_playbook', {
        alertData: {
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          sourceSystem: alert.sourceSystem,
          eventTime: alert.eventTime,
          assetName: alert.assetName,
          assetId: alert.assetId,
          status: alert.status,
          rawData: alert.rawData || {},
          enrichmentData: alert.enrichmentData || {}
        },
        analysisResults: alert.aiAnalysis,
        mitreResults: contextData.mitreResults,
        assetInfo: assetInfo,
        organizationId: user.organizationId || alert.organizationId,
        userId: user.id
      }, {
        userId: user.id,
        organizationId: user.organizationId || alert.organizationId,
        alertId: alert.id
      });

      if (!toolResult.success) {
        throw new Error(`Playbook tool failed: ${toolResult.error}`);
      }

      console.log(`✅ Immediate action playbook generated successfully - ${toolResult.result.steps?.length || 0} steps`);

      // Create playbook record using tool result
      const playbook = await models.Playbook.create({
        name: toolResult.result.name || 'Immediate Action Playbook',
        description: toolResult.result.description || 'AI-generated immediate action playbook',
        category: toolResult.result.category || 'security_incident',
        triggerType: 'manual',
        steps: toolResult.result.steps || [],
        sourceAlertId: alert.id,
        playbookType: 'immediate_action',
        aiGenerated: true,
        isActive: true,
        organizationId: alert.organizationId,
        createdBy: user.id,
        // Store enriched metadata from tool result
        metadata: {
          ...toolResult.result.metadata,
          aiGenerationMetadata: {
            ...toolResult.result.metadata?.aiGenerationMetadata,
            generatedWith: 'playbook_tool_executor',
            estimatedTime: toolResult.result.estimatedTime,
            prerequisites: toolResult.result.prerequisites,
            successCriteria: toolResult.result.successCriteria,
            processingTimeMs: toolResult.result.processingTimeMs
          }
        }
      });

      // Generate embedding for searchability
      embeddingHelper.triggerEmbeddingForRecord('playbook', playbook.id, 'create');

      return playbook;
    } catch (error) {
      console.error('❌ Tool-based immediate action playbook generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Investigation Playbook using AI Tool-based approach
   */
  async generateInvestigationPlaybook(alert, assetInfo, user) {
    try {
      console.log(`🔍 Generating investigation playbook using tool-based approach for alert: ${alert.id}`);

      // Gather enriched context data
      const contextData = await this.buildEnrichedContext(alert, assetInfo);

      // Use tool executor to generate playbook
      const toolResult = await this.toolExecutor.executeTool('generate_investigation_playbook', {
        alertData: {
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          sourceSystem: alert.sourceSystem,
          eventTime: alert.eventTime,
          assetName: alert.assetName,
          assetId: alert.assetId,
          status: alert.status,
          rawData: alert.rawData || {},
          enrichmentData: alert.enrichmentData || {}
        },
        analysisResults: alert.aiAnalysis,
        mitreResults: contextData.mitreResults,
        assetInfo: assetInfo,
        organizationId: user.organizationId || alert.organizationId,
        userId: user.id
      }, {
        userId: user.id,
        organizationId: user.organizationId || alert.organizationId,
        alertId: alert.id
      });

      if (!toolResult.success) {
        throw new Error(`Playbook tool failed: ${toolResult.error}`);
      }

      console.log(`✅ Investigation playbook generated successfully - ${toolResult.result.steps?.length || 0} steps`);

      // Create playbook record using tool result
      const playbook = await models.Playbook.create({
        name: toolResult.result.name || 'Investigation Playbook',
        description: toolResult.result.description || 'AI-generated investigation playbook',
        category: toolResult.result.category || 'security_incident',
        triggerType: 'manual',
        steps: toolResult.result.steps || [],
        sourceAlertId: alert.id,
        playbookType: 'investigation',
        aiGenerated: true,
        isActive: true,
        organizationId: alert.organizationId,
        createdBy: user.id,
        // Store enriched metadata from tool result
        metadata: {
          ...toolResult.result.metadata,
          aiGenerationMetadata: {
            ...toolResult.result.metadata?.aiGenerationMetadata,
            generatedWith: 'playbook_tool_executor',
            estimatedTime: toolResult.result.estimatedTime,
            prerequisites: toolResult.result.prerequisites,
            deliverables: toolResult.result.deliverables,
            legalConsiderations: toolResult.result.legalConsiderations,
            processingTimeMs: toolResult.result.processingTimeMs
          }
        }
      });

      // Generate embedding for searchability
      embeddingHelper.triggerEmbeddingForRecord('playbook', playbook.id, 'create');

      return playbook;
    } catch (error) {
      console.error('❌ Tool-based investigation playbook generation failed:', error);
      throw error;
    }
  }

  /**
   * Build enriched context data for tool-based playbook generation
   * Gathers analysis results and MITRE data as structured context (not prompts)
   */
  async buildEnrichedContext(alert, assetInfo) {
    try {
      console.log(`📊 Building enriched context for alert: ${alert.id}`);

      // Initialize context data structure
      const contextData = {
        analysisResults: alert.aiAnalysis,
        assetInfo: assetInfo,
        mitreResults: {
          techniques: [],
          tactics: [],
          killChainCoverage: null,
          domainClassification: null
        }
      };

      // Try to get MITRE analysis if available
      try {
        console.log(`🎯 Attempting to gather MITRE analysis context...`);
        
        // Check if alert already has MITRE analysis stored
        const existingMitreAnalysis = await models.AlertMitreAnalysis.findOne({
          where: { alertId: alert.id }
        });

        if (existingMitreAnalysis) {
          console.log(`✅ Found existing MITRE analysis for alert ${alert.id}`);
          contextData.mitreResults = {
            techniques: existingMitreAnalysis.techniques || [],
            tactics: existingMitreAnalysis.tactics || [],
            killChainCoverage: existingMitreAnalysis.killChainCoverage,
            domainClassification: existingMitreAnalysis.domainClassification
          };
        } else {
          console.log(`🔍 No existing MITRE analysis found, attempting real-time analysis...`);
          
          // Try to generate MITRE analysis in real-time (optional, non-blocking)
          const mitreAnalysis = await this.mitreAnalyzer.analyzeAlert({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            sourceSystem: alert.sourceSystem,
            assetName: alert.assetName,
            securityEventType: alert.aiAnalysis?.securityEventType,
            rawData: alert.rawData,
            enrichmentData: alert.enrichmentData
          });

          if (mitreAnalysis.success) {
            console.log(`✅ Generated MITRE analysis successfully - ${mitreAnalysis.ttp_mapping?.total_techniques || 0} techniques`);
            contextData.mitreResults = {
              techniques: mitreAnalysis.ttp_mapping?.techniques || [],
              tactics: mitreAnalysis.ttp_mapping?.techniques?.flatMap(t => t.tactics) || [],
              killChainCoverage: mitreAnalysis.summary?.kill_chain_coverage,
              domainClassification: mitreAnalysis.domain_classification
            };
          }
        }
      } catch (mitreError) {
        console.log(`⚠️ MITRE analysis unavailable (${mitreError.message}), continuing with base context`);
        // Continue without MITRE data - not critical for playbook generation
      }

      console.log(`📊 Context building completed:`, {
        hasAnalysis: !!contextData.analysisResults,
        hasAssetInfo: !!contextData.assetInfo,
        mitreVectorCount: contextData.mitreResults.techniques.length,
        mitreHasTactics: contextData.mitreResults.tactics.length > 0
      });

      return contextData;
    } catch (error) {
      console.error('❌ Failed to build enriched context:', error);
      
      // Return minimal context to prevent complete failure
      return {
        analysisResults: alert.aiAnalysis,
        assetInfo: assetInfo,
        mitreResults: {
          techniques: [],
          tactics: [],
          killChainCoverage: null,
          domainClassification: null
        }
      };
    }
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
        legalConsiderations: playbookData.legalConsiderations || []
      };
      
    } catch (parseError) {
      console.error('Failed to parse AI playbook response:', parseError);
      console.error('AI response length:', aiResponse.length);
      console.error('AI response sample (first 800 chars):', aiResponse.substring(0, 800));
      console.error('AI response sample (around error position):', this.getErrorContext(aiResponse, parseError.message));
      
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
    // This is a simple approach - replace unescaped quotes within array elements
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
   * Get context around JSON parsing error for debugging
   */
  getErrorContext(response, errorMessage) {
    const positionMatch = errorMessage.match(/position (\d+)/);
    if (!positionMatch) return 'Unable to extract error position';
    
    const position = parseInt(positionMatch[1]);
    const start = Math.max(0, position - 100);
    const end = Math.min(response.length, position + 100);
    
    return `...${response.substring(start, end)}...`;
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

  /**
   * Get generated playbooks for an alert
   */
  async getGeneratedPlaybooks(alertId, organizationId) {
    const playbooks = await models.Playbook.findAll({
      where: {
        sourceAlertId: alertId,
        organizationId: organizationId,
        aiGenerated: true
      },
      include: [
        {
          model: models.User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return playbooks;
  }

  /**
   * Check if playbooks have been generated for an alert
   */
  async hasGeneratedPlaybooks(alertId, organizationId) {
    const count = await models.Playbook.count({
      where: {
        sourceAlertId: alertId,
        organizationId: organizationId,
        aiGenerated: true
      }
    });

    return count > 0;
  }

  /**
   * Generate or update immediate action playbook for alert
   * Updates existing playbook if found, creates new one otherwise
   */
  async generateOrUpdateImmediatePlaybook(alert, user) {
    const startTime = Date.now();

    try {
      // Get asset information if available
      let assetInfo = null;
      if (alert.assetId) {
        assetInfo = await models.Asset.findOne({
          where: { id: alert.assetId, organizationId: alert.organizationId },
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner', 'osType', 'osVersion']
        });
      }

      // Check if immediate action playbook already exists
      const existingPlaybook = await models.Playbook.findOne({
        where: {
          sourceAlertId: alert.id,
          organizationId: alert.organizationId,
          playbookType: 'immediate_action'
        }
      });

      // Generate the playbook content using tool-based approach
      const contextData = await this.buildEnrichedContext(alert, assetInfo);
      
      const toolResult = await this.toolExecutor.executeTool('generate_immediate_action_playbook', {
        alertData: {
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          sourceSystem: alert.sourceSystem,
          eventTime: alert.eventTime,
          assetName: alert.assetName,
          assetId: alert.assetId,
          status: alert.status,
          rawData: alert.rawData || {},
          enrichmentData: alert.enrichmentData || {}
        },
        analysisResults: alert.aiAnalysis,
        mitreResults: contextData.mitreResults,
        assetInfo: assetInfo,
        organizationId: user.organizationId || alert.organizationId,
        userId: user.id
      }, {
        userId: user.id,
        organizationId: user.organizationId || alert.organizationId,
        alertId: alert.id
      });

      if (!toolResult.success) {
        throw new Error(`Playbook tool failed: ${toolResult.error}`);
      }

      const playbookData = toolResult.result;

      if (existingPlaybook) {
        // Update existing playbook
        await existingPlaybook.update({
          name: playbookData.name || (existingPlaybook.metadata?.aiGenerationMetadata?.playbookType === 'immediate_action' ? 'Immediate Action Playbook' : 'Investigation Playbook'),
          description: playbookData.description || 'AI-generated security playbook',
          category: playbookData.category || this.getCategoryFromEventType(alert.aiAnalysis.securityEventType) || 'security_incident',
          steps: playbookData.steps,
          metadata: {
            ...existingPlaybook.metadata,
            sourceAlert: {
              id: alert.id,
              title: alert.title,
              severity: alert.severity,
              securityEventType: alert.aiAnalysis.securityEventType
            },
            assetInfo: assetInfo ? {
              name: assetInfo.name,
              type: assetInfo.assetType,
              criticality: assetInfo.criticality
            } : null,
            aiGenerationMetadata: {
              regeneratedAt: new Date().toISOString(),
              confidence: alert.aiAnalysis.confidence,
              playbookType: 'immediate_action',
              estimatedTime: playbookData.estimatedTime,
              prerequisites: playbookData.prerequisites,
              successCriteria: playbookData.successCriteria,
              processingModel: 'configured'
            }
          }
        });

        return {
          playbook: existingPlaybook,
          updated: true
        };
      } else {
        // Create new playbook
        const playbook = await this.generateImmediateActionPlaybook(alert, assetInfo, user);
        return {
          playbook: playbook,
          updated: false
        };
      }

    } catch (error) {
      console.error('Error in generateOrUpdateImmediatePlaybook:', error);
      throw error;
    }
  }

  /**
   * Generate or update investigation playbook for alert
   * Updates existing playbook if found, creates new one otherwise
   */
  async generateOrUpdateInvestigationPlaybook(alert, user) {
    const startTime = Date.now();

    try {
      // Get asset information if available
      let assetInfo = null;
      if (alert.assetId) {
        assetInfo = await models.Asset.findOne({
          where: { id: alert.assetId, organizationId: alert.organizationId },
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner', 'osType', 'osVersion']
        });
      }

      // Check if investigation playbook already exists
      const existingPlaybook = await models.Playbook.findOne({
        where: {
          sourceAlertId: alert.id,
          organizationId: alert.organizationId,
          playbookType: 'investigation'
        }
      });

      // Generate the playbook content using tool-based approach
      const contextData = await this.buildEnrichedContext(alert, assetInfo);
      
      const toolResult = await this.toolExecutor.executeTool('generate_investigation_playbook', {
        alertData: {
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          sourceSystem: alert.sourceSystem,
          eventTime: alert.eventTime,
          assetName: alert.assetName,
          assetId: alert.assetId,
          status: alert.status,
          rawData: alert.rawData || {},
          enrichmentData: alert.enrichmentData || {}
        },
        analysisResults: alert.aiAnalysis,
        mitreResults: contextData.mitreResults,
        assetInfo: assetInfo,
        organizationId: user.organizationId || alert.organizationId,
        userId: user.id
      }, {
        userId: user.id,
        organizationId: user.organizationId || alert.organizationId,
        alertId: alert.id
      });

      if (!toolResult.success) {
        throw new Error(`Playbook tool failed: ${toolResult.error}`);
      }

      const playbookData = toolResult.result;

      if (existingPlaybook) {
        // Update existing playbook
        await existingPlaybook.update({
          name: playbookData.name || (existingPlaybook.metadata?.aiGenerationMetadata?.playbookType === 'immediate_action' ? 'Immediate Action Playbook' : 'Investigation Playbook'),
          description: playbookData.description || 'AI-generated security playbook',
          category: playbookData.category || this.getCategoryFromEventType(alert.aiAnalysis.securityEventType) || 'security_incident',
          steps: playbookData.steps,
          metadata: {
            ...existingPlaybook.metadata,
            sourceAlert: {
              id: alert.id,
              title: alert.title,
              severity: alert.severity,
              securityEventType: alert.aiAnalysis.securityEventType
            },
            assetInfo: assetInfo ? {
              name: assetInfo.name,
              type: assetInfo.assetType,
              criticality: assetInfo.criticality
            } : null,
            aiGenerationMetadata: {
              regeneratedAt: new Date().toISOString(),
              confidence: alert.aiAnalysis.confidence,
              playbookType: 'investigation',
              estimatedTime: playbookData.estimatedTime,
              prerequisites: playbookData.prerequisites,
              deliverables: playbookData.deliverables,
              legalConsiderations: playbookData.legalConsiderations,
              processingModel: 'configured'
            }
          }
        });

        return {
          playbook: existingPlaybook,
          updated: true
        };
      } else {
        // Create new playbook
        const playbook = await this.generateInvestigationPlaybook(alert, assetInfo, user);
        return {
          playbook: playbook,
          updated: false
        };
      }

    } catch (error) {
      console.error('Error in generateOrUpdateInvestigationPlaybook:', error);
      throw error;
    }
  }

}

// Export singleton instance
module.exports = new AlertPlaybookService();