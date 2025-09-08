const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const toolExecutor = require('../tools/common/toolExecutor');
const mitreDataValidator = require('../tools/utils/mitreDataValidator');
const stixDataLoader = require('../tools/utils/stixDataLoader');
const Joi = require('joi');

/**
 * MITRE ATT&CK Attack Routes
 * Provides frontend-expected /api/attack/* endpoints by aliasing to existing MITRE functionality
 * Maintains compatibility with attackService.ts expectations
 */

// Input validation schemas
const techniqueDetailsSchema = Joi.object({
  technique_id: Joi.string().required().pattern(/^T\d{4}(\.\d{3})?$/),
  domain: Joi.string().valid('enterprise', 'mobile', 'ics').default('enterprise'),
  include_relationships: Joi.boolean().default(true)
});

// Apply middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/attack/techniques/:techniqueId
 * @desc Get technique details - maps to existing MITRE tool executor
 * @access Private
 */
router.get('/techniques/:techniqueId',
  async (req, res) => {
    try {
      const { techniqueId } = req.params;
      const { domain = 'enterprise', include_relationships = 'true' } = req.query;

      console.log(`🔍 Attack API: Getting technique ${techniqueId} from ${domain} domain`);

      // Validate technique ID format
      const validation = mitreDataValidator.validateTechniqueId(techniqueId);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid technique ID format',
          details: validation.errors
        });
      }

      // Use existing tool executor functionality
      const result = await toolExecutor.executeTool(
        'get_technique_details',
        {
          technique_id: techniqueId,
          domain,
          include_relationships: include_relationships === 'true'
        },
        {
          userId: req.user?.id,
          organizationId: req.user?.organizationId,
          sessionId: `attack_api_${Date.now()}`,
          source: 'attack_api'
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
        console.warn(`⚠️ Technique not found in STIX data: ${techniqueId} (domain: ${domain})`);
        return res.status(404).json({
          success: false,
          error: 'Technique not found in MITRE ATT&CK framework',
          technique_id: techniqueId,
          domain,
          suggestion: 'Verify the technique ID is correct and exists in the MITRE ATT&CK framework'
        });
      }

      // Return in format expected by frontend
      res.json({
        success: true,
        data: result.result.technique,
        mitreId: techniqueId,
        domain: domain
      });

    } catch (error) {
      console.error('❌ Attack API: Error getting technique details:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/attack/tactics
 * @desc Get all tactics for domain - maps to existing MITRE tool executor
 * @access Private
 */
router.get('/tactics',
  async (req, res) => {
    try {
      const { domain = 'enterprise', include_technique_counts = 'true' } = req.query;

      console.log(`🔍 Attack API: Getting tactics for ${domain} domain`);

      // Use existing tool executor functionality
      const result = await toolExecutor.executeTool(
        'get_mitre_tactics',
        {
          domain,
          include_technique_counts: include_technique_counts === 'true'
        },
        {
          userId: req.user?.id,
          organizationId: req.user?.organizationId,
          sessionId: `attack_api_${Date.now()}`,
          source: 'attack_api'
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get tactics',
          details: result.error
        });
      }

      // Return in format expected by frontend
      res.json({
        success: true,
        data: result.result.tactics || [],
        domain: domain,
        count: result.result.tactics?.length || 0
      });

    } catch (error) {
      console.error('❌ Attack API: Error getting tactics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/attack/validate
 * @desc Validate STIX data availability - maps to existing STIX loader
 * @access Private
 */
router.get('/validate',
  async (req, res) => {
    try {
      console.log('🔍 Attack API: Validating STIX data availability');

      const validation = stixDataLoader.validateDataAvailability();
      
      res.json({
        success: true,
        data: validation,
        message: 'STIX data validation completed'
      });

    } catch (error) {
      console.error('❌ Attack API: Error validating data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/attack/techniques
 * @desc Search techniques - maps to existing MITRE tool executor
 * @access Private
 */
router.get('/techniques',
  async (req, res) => {
    try {
      const { 
        query = '',
        domain = 'enterprise',
        platform,
        tactic,
        max_results = 20,
        include_sub_techniques = 'true'
      } = req.query;

      console.log(`🔍 Attack API: Searching techniques with query "${query}" in ${domain} domain`);

      // Use existing tool executor functionality
      const result = await toolExecutor.executeTool(
        'search_mitre_techniques',
        {
          query,
          domain,
          platform,
          tactic,
          include_sub_techniques: include_sub_techniques === 'true',
          max_results: parseInt(max_results)
        },
        {
          userId: req.user?.id,
          organizationId: req.user?.organizationId,
          sessionId: `attack_api_${Date.now()}`,
          source: 'attack_api'
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to search techniques',
          details: result.error
        });
      }

      // Return in format expected by frontend
      res.json({
        success: true,
        data: result.result.results || [],
        query: query,
        domain: domain,
        count: result.result.total_found || 0
      });

    } catch (error) {
      console.error('❌ Attack API: Error searching techniques:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/attack/matrix
 * @desc Get ATT&CK matrix - constructs from tactics and techniques
 * @access Private
 */
router.get('/matrix',
  async (req, res) => {
    try {
      const { domain = 'enterprise', platform_filter } = req.query;

      console.log(`🔍 Attack API: Getting matrix for ${domain} domain`);

      // Get tactics using existing tool executor
      const tacticsResult = await toolExecutor.executeTool(
        'get_mitre_tactics',
        { domain, include_technique_counts: true },
        {
          userId: req.user?.id,
          organizationId: req.user?.organizationId,
          sessionId: `attack_api_${Date.now()}`,
          source: 'attack_api'
        }
      );

      if (!tacticsResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get matrix data',
          details: tacticsResult.error
        });
      }

      const tactics = tacticsResult.result.tactics || [];
      
      // Calculate statistics
      const totalTactics = tactics.length;
      const totalTechniques = tactics.reduce((sum, tactic) => 
        sum + (tactic.technique_count || 0), 0);
      const averageTechniquesPerTactic = totalTactics > 0 ? 
        Math.round(totalTechniques / totalTactics) : 0;

      // Return in format expected by frontend
      res.json({
        success: true,
        data: {
          domain: domain,
          tactics: tactics
        },
        statistics: {
          totalTactics,
          totalTechniques,
          averageTechniquesPerTactic
        }
      });

    } catch (error) {
      console.error('❌ Attack API: Error getting matrix:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/attack/platforms
 * @desc Get available platforms - uses STIX data loader
 * @access Private
 */
router.get('/platforms',
  async (req, res) => {
    try {
      const { domain = 'enterprise' } = req.query;

      console.log(`🔍 Attack API: Getting platforms for ${domain} domain`);

      const platforms = stixDataLoader.getPlatforms(domain);
      
      res.json({
        success: true,
        data: platforms,
        domain: domain,
        count: platforms.length
      });

    } catch (error) {
      console.error('❌ Attack API: Error getting platforms:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/attack/data-sources
 * @desc Get available data sources - uses STIX data loader
 * @access Private
 */
router.get('/data-sources',
  async (req, res) => {
    try {
      const { domain = 'enterprise' } = req.query;

      console.log(`🔍 Attack API: Getting data sources for ${domain} domain`);

      const dataSources = stixDataLoader.getDataSources(domain);
      
      res.json({
        success: true,
        data: dataSources,
        domain: domain,
        count: dataSources.length
      });

    } catch (error) {
      console.error('❌ Attack API: Error getting data sources:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

module.exports = router;