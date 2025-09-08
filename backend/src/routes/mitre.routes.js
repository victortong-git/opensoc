const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const toolExecutor = require('../tools/common/toolExecutor');
const aiGenerationService = require('../services/aiGenerationService');
const mitreDataValidator = require('../tools/utils/mitreDataValidator');
const stixDataLoader = require('../tools/utils/stixDataLoader');
const Joi = require('joi');

/**
 * MITRE ATT&CK Routes with AI Tool Integration
 * Production-ready endpoints for MITRE framework access
 */

// Input validation schemas
const searchTechniquesSchema = Joi.object({
  query: Joi.string().allow('').max(500).default(''),
  domain: Joi.string().valid('enterprise', 'mobile', 'ics').default('enterprise'),
  platform: Joi.string().allow('').optional(),
  tactic: Joi.string().allow('').optional(),
  include_sub_techniques: Joi.boolean().default(true),
  max_results: Joi.number().integer().min(1).max(100).default(20)
});

const techniqueDetailsSchema = Joi.object({
  technique_id: Joi.string().required().pattern(/^T\d{4}(\.\d{3})?$/),
  domain: Joi.string().valid('enterprise', 'mobile', 'ics').default('enterprise'),
  include_relationships: Joi.boolean().default(true)
});

const threatHuntMappingSchema = Joi.object({
  hunt_description: Joi.string().required().min(10).max(2000),
  data_sources: Joi.array().items(Joi.string()).optional(),
  platform: Joi.string().optional(),
  confidence_threshold: Joi.number().min(0).max(1).default(0.7)
});

const aiAnalysisSchema = Joi.object({
  prompt: Joi.string().required().min(10).max(2000),
  context: Joi.object().optional(),
  include_tools: Joi.boolean().default(true),
  reasoning_effort: Joi.string().valid('low', 'medium', 'high').default('high')
});

// Helper function to create request context
const createContext = (req) => {
  return {
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    sessionId: `session_${Date.now()}`,
    source: 'api',
    priority: 'normal',
    timestamp: new Date().toISOString(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };
};

// Apply middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/mitre/search/techniques
 * @desc Search MITRE ATT&CK techniques using AI-powered analysis
 * @access Private
 */
router.post('/search/techniques', 
  validate(searchTechniquesSchema),
  async (req, res) => {
    try {
      console.log(`🔍 MITRE technique search: "${req.body.query}" by user ${req.user.id}`);

      const result = await toolExecutor.executeTool(
        'search_mitre_techniques',
        req.body,
        {
          ...createContext(req),
          tags: ['technique_search', 'mitre']
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to search techniques',
          details: result.error
        });
      }

      res.json({
        success: true,
        data: result.result,
        execution_time_ms: result.executionTimeMs,
        execution_id: result.executionId
      });

    } catch (error) {
      console.error('❌ Error in technique search:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/mitre/technique/:techniqueId
 * @desc Get detailed information about a specific MITRE technique
 * @access Private
 */
router.get('/technique/:techniqueId',
  async (req, res) => {
    try {
      const { techniqueId } = req.params;
      const { domain = 'enterprise', include_relationships = 'true' } = req.query;

      console.log(`📋 Getting technique details: ${techniqueId} from ${domain} domain`);

      // Validate technique ID format
      const validation = mitreDataValidator.validateTechniqueId(techniqueId);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid technique ID format',
          details: validation.errors
        });
      }

      const result = await toolExecutor.executeTool(
        'get_technique_details',
        {
          technique_id: techniqueId,
          domain,
          include_relationships: include_relationships === 'true'
        },
        {
          ...createContext(req),
          tags: ['technique_details', 'mitre']
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get technique details',
          details: result.error
        });
      }

      if (!result.result.technique) {
        return res.status(404).json({
          success: false,
          error: 'Technique not found',
          technique_id: techniqueId,
          domain
        });
      }

      res.json({
        success: true,
        data: result.result,
        execution_time_ms: result.executionTimeMs,
        execution_id: result.executionId
      });

    } catch (error) {
      console.error('❌ Error getting technique details:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/mitre/map/threat-hunt
 * @desc Map threat hunting activities to MITRE ATT&CK techniques
 * @access Private
 */
router.post('/map/threat-hunt',
  validate(threatHuntMappingSchema),
  async (req, res) => {
    try {
      console.log(`🎯 Mapping threat hunt to MITRE: "${req.body.hunt_description.substring(0, 100)}..."`);

      const result = await toolExecutor.executeTool(
        'map_threat_hunt_to_mitre',
        req.body,
        {
          ...createContext(req),
          tags: ['threat_hunt_mapping', 'mitre'],
          source: 'threat_hunt'
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to map threat hunt to MITRE',
          details: result.error
        });
      }

      res.json({
        success: true,
        data: result.result,
        execution_time_ms: result.executionTimeMs,
        execution_id: result.executionId
      });

    } catch (error) {
      console.error('❌ Error mapping threat hunt:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/mitre/tactics/:domain?
 * @desc Get all tactics for a MITRE domain
 * @access Private
 */
router.get('/tactics/:domain?',
  async (req, res) => {
    try {
      const { domain = 'enterprise' } = req.params;
      const { include_technique_counts = 'true' } = req.query;

      console.log(`📊 Getting MITRE tactics for ${domain} domain`);

      const result = await toolExecutor.executeTool(
        'get_mitre_tactics',
        {
          domain,
          include_technique_counts: include_technique_counts === 'true'
        },
        {
          ...createContext(req),
          tags: ['tactics', 'mitre']
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get tactics',
          details: result.error
        });
      }

      res.json({
        success: true,
        data: result.result,
        execution_time_ms: result.executionTimeMs,
        execution_id: result.executionId
      });

    } catch (error) {
      console.error('❌ Error getting tactics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/mitre/analyze/attack-pattern
 * @desc Analyze attack patterns using MITRE framework
 * @access Private
 */
router.post('/analyze/attack-pattern',
  async (req, res) => {
    try {
      const { attack_description, indicators = [], timeline, environment } = req.body;

      if (!attack_description || attack_description.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Attack description is required and must be at least 10 characters'
        });
      }

      console.log(`🔬 Analyzing attack pattern: "${attack_description.substring(0, 100)}..."`);

      const result = await toolExecutor.executeTool(
        'analyze_attack_pattern',
        {
          attack_description,
          indicators,
          timeline,
          environment
        },
        {
          ...createContext(req),
          tags: ['attack_analysis', 'mitre'],
          priority: 'high'
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to analyze attack pattern',
          details: result.error
        });
      }

      res.json({
        success: true,
        data: result.result,
        execution_time_ms: result.executionTimeMs,
        execution_id: result.executionId
      });

    } catch (error) {
      console.error('❌ Error analyzing attack pattern:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/mitre/ai/analyze
 * @desc AI-powered MITRE analysis using GPT-OSS with HIGH reasoning
 * @access Private
 */
router.post('/ai/analyze',
  validate(aiAnalysisSchema),
  async (req, res) => {
    try {
      const { prompt, context: userContext = {}, include_tools = true } = req.body;

      console.log(`🤖 AI MITRE analysis: "${prompt.substring(0, 100)}..." using AI provider service`);

      // Enhanced prompt for MITRE analysis
      const enhancedPrompt = `As a cybersecurity expert, analyze the following using the MITRE ATT&CK framework. Provide structured analysis including:

1. **MITRE ATT&CK Mapping**: Identify relevant tactics, techniques, and procedures (TTPs)
2. **Threat Assessment**: Evaluate the threat level and potential impact
3. **Detection Methods**: Suggest detection techniques and data sources
4. **Mitigation Strategies**: Recommend defensive measures and countermeasures
5. **IOCs and Artifacts**: Extract indicators of compromise if present

Query: ${prompt}

Please provide a comprehensive analysis in a structured format.`;

      // Call AI provider service using the exact same pattern as working alert classification
      console.log('🤖 MITRE AI Analysis - Calling generateTestResponse with params:', {
        organizationId: req.user.organizationId,
        userId: req.user.id,
        contextType: 'mitre_analysis',
        contextId: `mitre_${Date.now()}`,
        promptLength: enhancedPrompt.length,
        model: null,
        maxTokens: 3000, // Increased to match working alert classification
        temperature: 0.7
      });

      const result = await aiGenerationService.generateTestResponse({
        prompt: enhancedPrompt,
        organizationId: req.user.organizationId,
        userId: req.user.id,
        contextType: 'mitre_analysis',
        contextId: `mitre_${Date.now()}`,
        model: null, // Use configured model
        maxTokens: 3000, // Increased to match working alert classification
        temperature: 0.7
      });

      console.log('🤖 MITRE AI Analysis - Raw result structure:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        hasResponse: !!(result?.response),
        hasContent: !!(result?.content),
        responseType: typeof result?.response,
        contentType: typeof result?.content,
        responseLength: result?.response?.length || 0,
        contentLength: result?.content?.length || 0
      });

      const aiResponse = result.response || result.content;
      
      console.log('🤖 MITRE AI Analysis - Final aiResponse:', {
        hasAiResponse: !!aiResponse,
        aiResponseType: typeof aiResponse,
        aiResponseLength: aiResponse?.length || 0,
        aiResponsePreview: aiResponse ? aiResponse.substring(0, 200) + '...' : 'NO RESPONSE'
      });

      if (!aiResponse) {
        return res.status(500).json({
          success: false,
          error: 'AI analysis failed',
          details: 'No response from AI provider'
        });
      }

      res.json({
        success: true,
        data: {
          analysis: aiResponse,
          prompt: enhancedPrompt,
          model: result.model || 'AI Provider Model',
          reasoning_effort: 'high',
          tools_used: include_tools,
          generation_time_ms: result.generation_time || 0,
          context: userContext
        },
        execution_time_ms: result.execution_time || 0
      });

    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/mitre/tools/available
 * @desc Get available MITRE tools and their schemas
 * @access Private
 */
router.get('/tools/available',
  async (req, res) => {
    try {
      const tools = toolExecutor.getAvailableTools();
      
      res.json({
        success: true,
        data: tools,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting available tools:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/mitre/data/validation
 * @desc Get MITRE data validation status
 * @access Private
 */
router.get('/data/validation',
  async (req, res) => {
    try {
      console.log('🔍 Getting MITRE data validation status...');

      const summary = await mitreDataValidator.getValidationSummary();
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting validation status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/mitre/data/freshness
 * @desc Get MITRE data freshness information
 * @access Private
 */
router.get('/data/freshness',
  async (req, res) => {
    try {
      console.log('📅 Getting MITRE data freshness information...');

      const freshness = await mitreDataValidator.getDataFreshness();
      
      res.json({
        success: true,
        data: freshness,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting data freshness:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/mitre/service/status
 * @desc Get MITRE service and GPT-OSS status
 * @access Private
 */
router.get('/service/status',
  async (req, res) => {
    try {
      console.log('🔍 Checking MITRE service status...');

      const [dataAvailability, aiProviderStatus] = await Promise.all([
        stixDataLoader.validateDataAvailability(),
        aiGenerationService.checkConnection(req.user.organizationId)
      ]);

      res.json({
        success: true,
        data: {
          stix_data: dataAvailability,
          ai_provider: {
            available: aiProviderStatus.connected || false,
            model: aiProviderStatus.availableModels?.[0] || 'Unknown',
            provider_type: aiProviderStatus.providerInfo?.type || 'Unknown'
          },
          service_config: {
            model: aiProviderStatus.availableModels?.[0] || 'AI Provider Model',
            reasoning_effort: 'high'
          },
          tools_available: toolExecutor.getAvailableTools().tool_count
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error checking service status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/mitre/analyze-alert
 * @desc Analyze alert using multi-domain MITRE ATT&CK framework with AI enrichment
 * @access Private
 */
router.post('/analyze-alert',
  async (req, res) => {
    try {
      const { alert_id, alert_data } = req.body;
      
      console.log(`🎯 Starting MITRE analysis for alert ${alert_id}`);

      if (!alert_id) {
        return res.status(400).json({
          success: false,
          error: 'alert_id is required'
        });
      }

      // Get alert data from database if not provided
      const { models } = require('../database/models');
      let alertInfo = alert_data;
      if (!alertInfo) {
        console.log('📥 Fetching alert data from database...');
        const Alert = models.Alert;
        const alert = await Alert.findByPk(alert_id);
        
        if (!alert) {
          return res.status(404).json({
            success: false,
            error: 'Alert not found'
          });
        }

        alertInfo = {
          id: alert.id,
          title: alert.title,
          description: alert.description,
          sourceSystem: alert.sourceSystem,
          assetName: alert.assetName,
          assetId: alert.assetId,
          severity: alert.severity,
          securityEventType: alert.securityEventType,
          rawData: alert.rawData,
          organizationId: alert.organizationId || req.user.organizationId
        };
      }

      // Add user context
      alertInfo.organizationId = alertInfo.organizationId || req.user.organizationId;

      // Import and initialize the analyzer
      const { AlertMitreAnalyzer } = require('../tools/mitre/alertMitreAnalyzer');
      const analyzer = new AlertMitreAnalyzer();

      // Perform comprehensive analysis
      const analysis = await analyzer.analyzeAlert(alertInfo, {
        enableAiEnrichment: true
      });

      if (analysis.success) {
        // Store analysis results in database (optional)
        try {
          const AlertMitreAnalysis = models.AlertMitreAnalysis;
          const Alert = models.Alert;
          
          if (AlertMitreAnalysis && Alert) {
            // Save full analysis to AlertMitreAnalysis table
            await AlertMitreAnalysis.create({
              alert_id: alert_id,
              classified_domains: analysis.domain_classification.classified_domains,
              mapped_techniques: analysis.ttp_mapping.techniques,
              enriched_analysis: analysis.enriched_analysis,
              confidence_scores: analysis.ttp_mapping.techniques.map(t => ({
                technique_id: t.id,
                score: t.confidence_score
              })),
              analysis_timestamp: new Date(),
              ai_model_used: analysis.enriched_analysis.ai_model || 'gpt-oss:20b',
              processing_time_ms: analysis.processing_time_ms
            });
            
            // Also update the main Alert record with analysis summary for quick access
            await Alert.update({
              mitreAnalysis: analysis, // Store full analysis for frontend compatibility
              mitreAnalysisTimestamp: new Date()
            }, {
              where: { id: alert_id }
            });
            
            console.log('💾 Analysis results saved to database and alert record');
          }
        } catch (dbError) {
          console.warn('⚠️ Could not save analysis to database:', dbError.message);
          // Continue without failing - analysis is still valid
        }

        // Create MITRE analysis completion timeline event
        console.log('🔍 DEBUG: About to create MITRE timeline event');
        console.log('🔍 DEBUG: AlertTimelineEvent model available:', !!models.AlertTimelineEvent);
        console.log('🔍 DEBUG: alert_id:', alert_id);
        console.log('🔍 DEBUG: analysis success:', analysis.success);
        console.log('🔍 DEBUG: analysis.ttp_mapping.total_techniques:', analysis.ttp_mapping.total_techniques);
        console.log('🔍 DEBUG: analysis.enriched_analysis.success:', analysis.enriched_analysis.success);
        
        try {
          const timelineEventData = {
            alertId: alert_id,
            timestamp: new Date(),
            type: 'ai_analysis_completed',
            title: 'MITRE ATT&CK Analysis Completed',
            description: `MITRE ATT&CK analysis completed with ${analysis.ttp_mapping.total_techniques} techniques mapped across ${analysis.domain_classification.classified_domains.length} domain(s). AI enrichment: ${analysis.enriched_analysis.success ? 'successful' : 'failed'}.`,
            aiSource: 'MITRE_ATTACK_ANALYZER',
            aiConfidence: analysis.enriched_analysis.success ? 95 : 75,
            isTestData: false,
            metadata: {
              processingTimeMs: analysis.processing_time_ms,
              domainsAnalyzed: analysis.domain_classification.classified_domains,
              techniquesMapped: analysis.ttp_mapping.total_techniques,
              highConfidenceTechniques: analysis.ttp_mapping.techniques.filter(t => t.confidence_score > 0.8).length,
              aiEnrichmentApplied: analysis.enriched_analysis.success,
              aiModel: analysis.enriched_analysis.ai_model || 'gpt-oss:20b'
            }
          };
          
          console.log('🔍 DEBUG: Timeline event data:', JSON.stringify(timelineEventData, null, 2));
          
          const createdEvent = await models.AlertTimelineEvent.create(timelineEventData);
          console.log('📝 MITRE analysis timeline event created successfully');
          console.log('🔍 DEBUG: Created event ID:', createdEvent.id);
        } catch (timelineError) {
          console.error('❌ Failed to create MITRE analysis timeline event:', timelineError);
          console.error('❌ Timeline error details:', {
            message: timelineError.message,
            stack: timelineError.stack,
            alertId: alert_id,
            modelAvailable: !!models.AlertTimelineEvent,
            analysisSuccessful: analysis.success
          });
          // Don't throw the error - continue with response even if timeline fails
        }

        res.json({
          success: true,
          data: analysis, // Return analysis object directly to match frontend expectations
          metadata: {
            analysis_timestamp: new Date().toISOString(),
            processing_time_ms: analysis.processing_time_ms,
            domains_analyzed: analysis.domain_classification.classified_domains.length,
            techniques_mapped: analysis.ttp_mapping.total_techniques,
            ai_enrichment_enabled: true
          }
        });

      } else {
        res.status(500).json({
          success: false,
          error: analysis.error,
          alert_id: alert_id,
          fallback_guidance: [
            'Manual MITRE analysis recommended',
            'Review alert against Enterprise domain techniques',
            'Consider threat hunting based on alert indicators'
          ]
        });
      }

    } catch (error) {
      console.error('❌ Error in alert MITRE analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

module.exports = router;