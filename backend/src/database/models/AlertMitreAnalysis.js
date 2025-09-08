const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertMitreAnalysis = sequelize.define('AlertMitreAnalysis', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    alert_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'alerts',
        key: 'id'
      },
      field: 'alert_id'
    },
    classified_domains: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of classified MITRE domains (enterprise, mobile, ics)',
      validate: {
        isValidDomains(value) {
          if (!Array.isArray(value)) {
            throw new Error('classified_domains must be an array');
          }
          const validDomains = ['enterprise', 'mobile', 'ics'];
          const invalidDomains = value.filter(domain => !validDomains.includes(domain));
          if (invalidDomains.length > 0) {
            throw new Error(`Invalid domains: ${invalidDomains.join(', ')}`);
          }
        }
      }
    },
    mapped_techniques: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of mapped MITRE techniques with confidence scores'
    },
    enriched_analysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'AI-enhanced analysis and recommendations'
    },
    confidence_scores: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Per-technique confidence scores and relevance factors'
    },
    domain_scores: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Domain classification scores and details'
    },
    kill_chain_coverage: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Kill chain analysis and tactic coverage'
    },
    analysis_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'analysis_timestamp'
    },
    ai_model_used: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'AI model used for enrichment analysis',
      field: 'ai_model_used'
    },
    processing_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total processing time in milliseconds',
      field: 'processing_time_ms'
    }
  }, {
    tableName: 'alert_mitre_analysis',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      {
        fields: ['alert_id']
      },
      {
        fields: ['analysis_timestamp']
      },
      {
        fields: ['classified_domains'],
        using: 'gin'
      }
    ],

    // Instance methods
    instanceMethods: {
      /**
       * Get high confidence techniques
       * @param {number} threshold - Confidence threshold (default: 0.7)
       * @returns {Array} High confidence techniques
       */
      getHighConfidenceTechniques(threshold = 0.7) {
        return this.mapped_techniques.filter(technique => 
          technique.confidence_score && technique.confidence_score >= threshold
        );
      },

      /**
       * Get techniques by tactic
       * @param {string} tactic - MITRE tactic name
       * @returns {Array} Techniques for the specified tactic
       */
      getTechniquesByTactic(tactic) {
        return this.mapped_techniques.filter(technique =>
          technique.tactics && technique.tactics.includes(tactic)
        );
      },

      /**
       * Get analysis summary
       * @returns {Object} Analysis summary
       */
      getSummary() {
        const totalTechniques = this.mapped_techniques.length;
        const highConfidenceTechniques = this.getHighConfidenceTechniques().length;
        const domainsAnalyzed = this.classified_domains.length;
        
        return {
          total_techniques: totalTechniques,
          high_confidence_techniques: highConfidenceTechniques,
          domains_analyzed: domainsAnalyzed,
          primary_domain: this.classified_domains[0] || 'enterprise',
          analysis_date: this.analysis_timestamp,
          processing_time_ms: this.processing_time_ms,
          ai_enhanced: !!this.enriched_analysis
        };
      }
    }
  });

module.exports = AlertMitreAnalysis;