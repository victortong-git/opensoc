const toolExecutor = require('../tools/common/toolExecutor');

/**
 * MITRE Technique Validation Service
 * Tool executor-driven validation against actual MITRE ATT&CK framework data
 */
class MitreValidationService {
  constructor() {
    // Cache for valid/invalid technique IDs to improve performance
    this.validTechniques = new Set();
    this.invalidTechniques = new Set();
    this.cacheTimestamp = null;
    this.cacheValidityMs = 60 * 60 * 1000; // 1 hour cache validity
    this.supportedDomains = ['enterprise', 'mobile', 'ics'];
  }

  /**
   * Validate technique ID using tool executor
   * @param {string} techniqueId - MITRE technique ID (e.g., T1055, T1048.003)
   * @param {string} domain - MITRE domain to check (default: enterprise)
   * @returns {Promise<boolean>} True if technique exists
   */
  async isValidTechnique(techniqueId, domain = 'enterprise') {
    // Basic format validation first
    if (!this.isValidFormat(techniqueId)) {
      return false;
    }

    const cacheKey = `${techniqueId}_${domain}`;

    // Check cache first
    if (this.isCacheValid()) {
      if (this.validTechniques.has(cacheKey)) {
        return true;
      }
      if (this.invalidTechniques.has(cacheKey)) {
        return false;
      }
    }

    try {
      // Use tool executor to get technique details
      const result = await toolExecutor.executeTool('get_technique_details', {
        technique_id: techniqueId,
        domain: domain,
        include_relationships: false
      }, {
        tags: ['validation'],
        source: 'mitre_validation',
        priority: 'normal'
      });

      const isValid = result.success && result.result && result.result.technique;

      // Update cache
      this.updateCache(cacheKey, isValid);

      return isValid;

    } catch (error) {
      console.warn(`Tool executor error validating technique ${techniqueId}:`, error.message);
      
      // Fallback to format validation if tool executor fails
      return this.isValidFormat(techniqueId);
    }
  }

  /**
   * Validate multiple technique IDs in batch
   * @param {string[]} techniqueIds - Array of technique IDs
   * @param {string} domain - MITRE domain to check (default: enterprise)
   * @returns {Promise<Object>} Object with valid and invalid arrays
   */
  async validateTechniques(techniqueIds, domain = 'enterprise') {
    const results = {
      valid: [],
      invalid: [],
      errors: []
    };

    // Filter unique IDs and basic format validation
    const uniqueIds = [...new Set(techniqueIds.filter(id => this.isValidFormat(id)))];
    
    if (uniqueIds.length === 0) {
      results.errors.push('No valid format technique IDs provided');
      results.invalid = techniqueIds;
      return results;
    }

    try {
      // Check each technique individually
      for (const techniqueId of uniqueIds) {
        const cacheKey = `${techniqueId}_${domain}`;
        
        // Check cache first
        if (this.isCacheValid()) {
          if (this.validTechniques.has(cacheKey)) {
            results.valid.push(techniqueId);
            continue;
          } else if (this.invalidTechniques.has(cacheKey)) {
            results.invalid.push(techniqueId);
            continue;
          }
        }

        // Query using tool executor
        try {
          const result = await toolExecutor.executeTool('get_technique_details', {
            technique_id: techniqueId,
            domain: domain,
            include_relationships: false
          }, {
            tags: ['validation'],
            source: 'mitre_validation',
            priority: 'normal'
          });

          const isValid = result.success && result.result && result.result.technique;
          
          if (isValid) {
            results.valid.push(techniqueId);
          } else {
            results.invalid.push(techniqueId);
          }

          // Update cache
          this.updateCache(cacheKey, isValid);

        } catch (techniqueError) {
          console.warn(`Tool executor error validating technique ${techniqueId}:`, techniqueError.message);
          results.invalid.push(techniqueId);
          this.updateCache(cacheKey, false);
        }
      }

    } catch (error) {
      console.warn('Tool executor error during batch validation:', error.message);
      results.errors.push(`Tool validation failed: ${error.message}`);
      
      // Fallback: all format-valid IDs are considered valid
      results.valid = uniqueIds;
      results.invalid = techniqueIds.filter(id => !this.isValidFormat(id));
    }

    return results;
  }

  /**
   * Validate technique ID format
   * @param {string} techniqueId - Technique ID to validate
   * @returns {boolean} True if format is valid
   */
  isValidFormat(techniqueId) {
    if (!techniqueId || typeof techniqueId !== 'string') {
      return false;
    }

    // MITRE technique format: T#### or T####.###
    if (!/^T\d{4}(\.\d{3})?$/.test(techniqueId)) {
      return false;
    }

    const parts = techniqueId.split('.');
    const mainNumber = parseInt(parts[0].substring(1));
    const subNumber = parts[1] ? parseInt(parts[1]) : null;
    
    // Basic sanity checks
    if (mainNumber < 1000 || mainNumber > 2000) {
      return false;
    }

    if (subNumber !== null) {
      if (subNumber === 0 || subNumber > 999) {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter AI response text to remove invalid technique IDs
   * @param {string} aiResponse - AI response containing technique IDs
   * @returns {Promise<Object>} Cleaned response with validation stats
   */
  async filterInvalidTechniques(aiResponse) {
    // Extract all technique IDs from text
    const techniqueIds = this.extractTechniqueIds(aiResponse);
    
    if (techniqueIds.length === 0) {
      return {
        cleanedResponse: aiResponse,
        totalTechniques: 0,
        validTechniques: [],
        invalidTechniques: [],
        filterCount: 0
      };
    }

    // Validate techniques against database
    const validation = await this.validateTechniques(techniqueIds);

    // Remove invalid technique IDs from response
    let cleanedResponse = aiResponse;
    for (const invalidId of validation.invalid) {
      const regex = new RegExp(`\\b${invalidId.replace('.', '\\.')}\\b`, 'g');
      cleanedResponse = cleanedResponse.replace(regex, `[INVALID_TECHNIQUE_REMOVED: ${invalidId}]`);
    }

    // Add validation note if techniques were filtered
    if (validation.invalid.length > 0) {
      cleanedResponse += `\n\n**Validation Note:** ${validation.invalid.length} invalid MITRE technique IDs were filtered from this analysis. Only techniques verified against the MITRE ATT&CK database are included.`;
    }

    return {
      cleanedResponse,
      totalTechniques: techniqueIds.length,
      validTechniques: validation.valid,
      invalidTechniques: validation.invalid,
      filterCount: validation.invalid.length,
      errors: validation.errors
    };
  }

  /**
   * Extract technique IDs from text using regex
   * @param {string} text - Text to search
   * @returns {string[]} Array of unique technique IDs found
   */
  extractTechniqueIds(text) {
    const techniquePattern = /T\d{4}(?:\.\d{3})?/g;
    const matches = text.match(techniquePattern);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Update cache with validation result
   * @private
   */
  updateCache(cacheKey, isValid) {
    if (!this.cacheTimestamp) {
      this.cacheTimestamp = Date.now();
    }

    if (isValid) {
      this.validTechniques.add(cacheKey);
      this.invalidTechniques.delete(cacheKey);
    } else {
      this.invalidTechniques.add(cacheKey);
      this.validTechniques.delete(cacheKey);
    }
  }

  /**
   * Check if cache is still valid
   * @private
   */
  isCacheValid() {
    if (!this.cacheTimestamp) {
      return false;
    }
    return (Date.now() - this.cacheTimestamp) < this.cacheValidityMs;
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validTechniques.clear();
    this.invalidTechniques.clear();
    this.cacheTimestamp = null;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      validCount: this.validTechniques.size,
      invalidCount: this.invalidTechniques.size,
      isValid: this.isCacheValid(),
      ageMs: this.cacheTimestamp ? Date.now() - this.cacheTimestamp : null
    };
  }
}

module.exports = new MitreValidationService();