const stixDataLoader = require('./stixDataLoader');

/**
 * MITRE ATT&CK Data Validator
 * Validates STIX data integrity and provides data quality metrics
 */

class MitreDataValidator {
  constructor() {
    this.stixLoader = stixDataLoader;
  }

  /**
   * Validate all MITRE ATT&CK data integrity
   * @returns {Object} Comprehensive validation report
   */
  async validateAllData() {
    console.log('🔍 Starting comprehensive MITRE data validation...');

    const report = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      domains: {},
      summary: {
        total_domains: 0,
        valid_domains: 0,
        total_techniques: 0,
        total_tactics: 0,
        total_groups: 0,
        total_software: 0,
        validation_errors: []
      }
    };

    const domains = ['enterprise', 'mobile', 'ics'];

    for (const domain of domains) {
      console.log(`📊 Validating ${domain} domain...`);
      
      try {
        const domainReport = await this.validateDomain(domain);
        report.domains[domain] = domainReport;
        report.summary.total_domains++;
        
        if (domainReport.status === 'valid') {
          report.summary.valid_domains++;
        }

        // Aggregate counts
        report.summary.total_techniques += domainReport.counts.techniques;
        report.summary.total_tactics += domainReport.counts.tactics;
        report.summary.total_groups += domainReport.counts.groups;
        report.summary.total_software += domainReport.counts.software;

        // Aggregate errors
        report.summary.validation_errors.push(...domainReport.errors);

      } catch (error) {
        console.error(`❌ Error validating ${domain} domain:`, error.message);
        report.domains[domain] = {
          status: 'error',
          error: error.message,
          counts: { techniques: 0, tactics: 0, groups: 0, software: 0 },
          errors: [error.message]
        };
        report.summary.validation_errors.push(`${domain}: ${error.message}`);
      }
    }

    // Determine overall status
    if (report.summary.valid_domains === report.summary.total_domains) {
      report.overall_status = 'valid';
    } else if (report.summary.valid_domains > 0) {
      report.overall_status = 'partial';
    } else {
      report.overall_status = 'invalid';
    }

    console.log(`✅ Validation complete: ${report.overall_status} (${report.summary.valid_domains}/${report.summary.total_domains} domains valid)`);

    return report;
  }

  /**
   * Validate specific domain data
   * @param {string} domain - Domain to validate
   * @returns {Object} Domain validation report
   */
  async validateDomain(domain) {
    const report = {
      domain,
      status: 'unknown',
      counts: {
        techniques: 0,
        tactics: 0,
        groups: 0,
        software: 0,
        relationships: 0
      },
      data_quality: {
        techniques_with_detection: 0,
        techniques_with_mitigations: 0,
        techniques_missing_platforms: 0,
        techniques_missing_data_sources: 0
      },
      errors: [],
      warnings: []
    };

    try {
      // Load domain data
      const data = this.stixLoader.loadDomain(domain);
      
      if (!data || !data.objects || !Array.isArray(data.objects)) {
        throw new Error(`Invalid STIX data structure for ${domain} domain`);
      }

      // Count objects by type
      const objectCounts = this.countObjectsByType(data.objects);
      report.counts = {
        techniques: objectCounts['attack-pattern'] || 0,
        tactics: objectCounts['x-mitre-tactic'] || 0,
        groups: objectCounts['intrusion-set'] || 0,
        software: (objectCounts['malware'] || 0) + (objectCounts['tool'] || 0),
        relationships: objectCounts['relationship'] || 0
      };

      // Validate techniques
      const techniques = data.objects.filter(obj => obj.type === 'attack-pattern');
      this.validateTechniques(techniques, report);

      // Validate tactics
      const tactics = data.objects.filter(obj => obj.type === 'x-mitre-tactic');
      this.validateTactics(tactics, report);

      // Validate relationships
      const relationships = data.objects.filter(obj => obj.type === 'relationship');
      this.validateRelationships(relationships, report);

      // Determine status
      if (report.errors.length === 0) {
        report.status = 'valid';
      } else if (report.counts.techniques > 0 && report.counts.tactics > 0) {
        report.status = 'valid_with_warnings';
      } else {
        report.status = 'invalid';
      }

    } catch (error) {
      report.status = 'error';
      report.errors.push(error.message);
    }

    return report;
  }

  /**
   * Count objects by type
   * @param {Array} objects - STIX objects
   * @returns {Object} Count by type
   */
  countObjectsByType(objects) {
    const counts = {};
    
    objects.forEach(obj => {
      counts[obj.type] = (counts[obj.type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Validate techniques data quality
   * @param {Array} techniques - Technique objects
   * @param {Object} report - Report to update
   */
  validateTechniques(techniques, report) {
    techniques.forEach((technique, index) => {
      try {
        // Validate required fields
        if (!technique.name) {
          report.errors.push(`Technique ${index}: Missing name`);
        }

        if (!technique.description) {
          report.errors.push(`Technique ${index}: Missing description`);
        }

        if (!technique.external_references || !Array.isArray(technique.external_references)) {
          report.errors.push(`Technique ${index}: Missing external references`);
        } else {
          const mitreRef = technique.external_references.find(ref => ref.source_name === 'mitre-attack');
          if (!mitreRef) {
            report.errors.push(`Technique ${index}: Missing MITRE ATT&CK reference`);
          }
        }

        // Check data quality
        if (technique.x_mitre_detection) {
          report.data_quality.techniques_with_detection++;
        }

        if (!technique.x_mitre_platforms || technique.x_mitre_platforms.length === 0) {
          report.data_quality.techniques_missing_platforms++;
          report.warnings.push(`Technique ${technique.name}: No platforms specified`);
        }

        if (!technique.x_mitre_data_sources || technique.x_mitre_data_sources.length === 0) {
          report.data_quality.techniques_missing_data_sources++;
          report.warnings.push(`Technique ${technique.name}: No data sources specified`);
        }

      } catch (error) {
        report.errors.push(`Technique ${index}: Validation error - ${error.message}`);
      }
    });
  }

  /**
   * Validate tactics data quality
   * @param {Array} tactics - Tactic objects
   * @param {Object} report - Report to update
   */
  validateTactics(tactics, report) {
    tactics.forEach((tactic, index) => {
      try {
        // Validate required fields
        if (!tactic.name) {
          report.errors.push(`Tactic ${index}: Missing name`);
        }

        if (!tactic.x_mitre_shortname) {
          report.errors.push(`Tactic ${index}: Missing shortname`);
        }

        if (!tactic.description) {
          report.errors.push(`Tactic ${index}: Missing description`);
        }

        if (!tactic.external_references || !Array.isArray(tactic.external_references)) {
          report.errors.push(`Tactic ${index}: Missing external references`);
        }

      } catch (error) {
        report.errors.push(`Tactic ${index}: Validation error - ${error.message}`);
      }
    });
  }

  /**
   * Validate relationships
   * @param {Array} relationships - Relationship objects
   * @param {Object} report - Report to update
   */
  validateRelationships(relationships, report) {
    relationships.forEach((rel, index) => {
      try {
        if (!rel.source_ref) {
          report.errors.push(`Relationship ${index}: Missing source_ref`);
        }

        if (!rel.target_ref) {
          report.errors.push(`Relationship ${index}: Missing target_ref`);
        }

        if (!rel.relationship_type) {
          report.errors.push(`Relationship ${index}: Missing relationship_type`);
        }

      } catch (error) {
        report.errors.push(`Relationship ${index}: Validation error - ${error.message}`);
      }
    });
  }

  /**
   * Get data freshness information
   * @returns {Object} Data freshness report
   */
  async getDataFreshness() {
    console.log('📅 Checking MITRE data freshness...');

    const freshnessReport = {
      timestamp: new Date().toISOString(),
      domains: {}
    };

    const domains = ['enterprise', 'mobile', 'ics'];

    for (const domain of domains) {
      try {
        const data = this.stixLoader.loadDomain(domain);
        const techniques = data.objects.filter(obj => obj.type === 'attack-pattern');
        
        // Find most recent modification date
        const modificationDates = techniques
          .map(t => new Date(t.modified))
          .filter(date => !isNaN(date));

        const mostRecent = modificationDates.length > 0 
          ? new Date(Math.max(...modificationDates))
          : null;

        const oldest = modificationDates.length > 0
          ? new Date(Math.min(...modificationDates))
          : null;

        freshnessReport.domains[domain] = {
          total_techniques: techniques.length,
          most_recent_update: mostRecent ? mostRecent.toISOString() : null,
          oldest_update: oldest ? oldest.toISOString() : null,
          age_in_days: mostRecent ? Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)) : null
        };

      } catch (error) {
        freshnessReport.domains[domain] = {
          error: error.message
        };
      }
    }

    return freshnessReport;
  }

  /**
   * Validate technique ID format
   * @param {string} techniqueId - Technique ID to validate
   * @returns {Object} Validation result
   */
  validateTechniqueId(techniqueId) {
    const result = {
      valid: false,
      format: 'unknown',
      errors: []
    };

    if (!techniqueId || typeof techniqueId !== 'string') {
      result.errors.push('Technique ID is required and must be a string');
      return result;
    }

    // Check for T#### format (main technique)
    const mainTechniquePattern = /^T\d{4}$/;
    if (mainTechniquePattern.test(techniqueId)) {
      result.valid = true;
      result.format = 'main_technique';
      return result;
    }

    // Check for T####.### format (sub-technique)
    const subTechniquePattern = /^T\d{4}\.\d{3}$/;
    if (subTechniquePattern.test(techniqueId)) {
      result.valid = true;
      result.format = 'sub_technique';
      return result;
    }

    result.errors.push('Invalid technique ID format. Expected T#### or T####.### format');
    return result;
  }

  /**
   * Get validation summary for dashboard
   * @returns {Object} Summary for dashboard display
   */
  async getValidationSummary() {
    const validation = await this.validateAllData();
    const freshness = await this.getDataFreshness();

    return {
      status: validation.overall_status,
      domains_available: validation.summary.valid_domains,
      total_domains: validation.summary.total_domains,
      total_techniques: validation.summary.total_techniques,
      total_tactics: validation.summary.total_tactics,
      error_count: validation.summary.validation_errors.length,
      most_recent_update: Math.max(
        ...Object.values(freshness.domains)
          .filter(d => d.most_recent_update)
          .map(d => new Date(d.most_recent_update).getTime())
      ),
      validation_timestamp: validation.timestamp,
      health_score: this.calculateHealthScore(validation)
    };
  }

  /**
   * Calculate overall health score
   * @param {Object} validation - Validation report
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore(validation) {
    let score = 100;

    // Deduct for invalid domains
    const invalidDomains = validation.summary.total_domains - validation.summary.valid_domains;
    score -= (invalidDomains * 30);

    // Deduct for errors
    score -= Math.min(validation.summary.validation_errors.length * 5, 50);

    // Minimum score
    return Math.max(score, 0);
  }
}

module.exports = new MitreDataValidator();