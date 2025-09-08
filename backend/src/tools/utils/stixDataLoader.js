const fs = require('fs');
const path = require('path');

/**
 * STIX Data Loader
 * Utility for loading and querying MITRE ATT&CK STIX data files
 * Uses direct file access for POC (no caching)
 */
class STIXDataLoader {
  constructor() {
    // Use absolute path to mounted STIX data directory (inside Docker container)
    this.baseDir = '/app/attack-stix-data';
    this.supportedDomains = ['enterprise', 'mobile', 'ics'];
  }

  /**
   * Load STIX data for a specific domain
   * @param {string} domain - Domain (enterprise, mobile, ics)
   * @returns {Object} Parsed STIX data
   */
  loadDomain(domain = 'enterprise') {
    if (!this.supportedDomains.includes(domain)) {
      throw new Error(`Unsupported domain: ${domain}. Supported: ${this.supportedDomains.join(', ')}`);
    }

    const filePath = path.join(this.baseDir, `${domain}-attack`, `${domain}-attack.json`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`STIX data file not found: ${filePath}`);
    }

    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const stixData = JSON.parse(rawData);
      
      console.log(`📊 Loaded STIX data: ${stixData.objects?.length || 0} objects from ${domain} domain`);
      return stixData;
    } catch (error) {
      console.error(`❌ Error loading STIX data from ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all techniques (attack-patterns) for a domain
   * @param {string} domain - Domain to query
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of technique objects
   */
  getTechniques(domain = 'enterprise', filters = {}) {
    const data = this.loadDomain(domain);
    let allTechniques = data.objects.filter(obj => obj.type === 'attack-pattern');
    
    console.log(`📊 Total techniques in ${domain}:`, allTechniques.length);

    // Filter out revoked/deprecated first
    if (filters.excludeRevoked !== false) {
      allTechniques = allTechniques.filter(technique => !technique.revoked);
      console.log(`📊 Active techniques after removing revoked:`, allTechniques.length);
    }

    // Progressive search strategy: try specific to broad
    let techniques = allTechniques;
    let searchSteps = [];

    // STEP 1: Apply filters if provided
    if ((filters.query && filters.query.trim()) || filters.platform || filters.tactic) {
      let filteredTechniques = [...allTechniques];

      // Text search with enhanced matching
      if (filters.query && filters.query.trim()) {
        const query = filters.query.toLowerCase();
        const queryWords = query.split(/\s+/).filter(word => word.length > 2);
        
        filteredTechniques = filteredTechniques.filter(technique => {
          const name = technique.name.toLowerCase();
          const description = technique.description.toLowerCase();
          const techniqueId = technique.external_references?.find(ref => 
            ref.source_name === 'mitre-attack'
          )?.external_id?.toLowerCase() || '';

          // Exact phrase match (highest priority)
          if (name.includes(query) || description.includes(query) || techniqueId.includes(query)) {
            return true;
          }

          // Word-based matching (medium priority)
          if (queryWords.length > 0) {
            return queryWords.some(word => 
              name.includes(word) || description.includes(word) || techniqueId.includes(word)
            );
          }

          return false;
        });
        
        searchSteps.push(`Text search "${query}": ${filteredTechniques.length} results`);
      }

      // Platform filter (if provided and we have query results)
      if (filters.platform && filteredTechniques.length > 0) {
        const beforeCount = filteredTechniques.length;
        filteredTechniques = filteredTechniques.filter(technique => 
          technique.x_mitre_platforms && 
          technique.x_mitre_platforms.some(platform => 
            platform.toLowerCase().includes(filters.platform.toLowerCase())
          )
        );
        searchSteps.push(`Platform filter "${filters.platform}": ${beforeCount} → ${filteredTechniques.length}`);
      }

      // Tactic filter with enhanced matching (if provided and we have results)
      if (filters.tactic && filteredTechniques.length > 0) {
        const beforeCount = filteredTechniques.length;
        const tacticVariations = [
          filters.tactic,
          filters.tactic.replace(/-/g, '_'),
          filters.tactic.replace(/_/g, '-'),
          filters.tactic.replace(/-/g, ' '),
          filters.tactic.replace(/_/g, ' ')
        ];

        filteredTechniques = filteredTechniques.filter(technique =>
          technique.kill_chain_phases &&
          technique.kill_chain_phases.some(kcp => 
            tacticVariations.some(variation => 
              kcp.phase_name.toLowerCase() === variation.toLowerCase()
            )
          )
        );
        searchSteps.push(`Tactic filter "${filters.tactic}": ${beforeCount} → ${filteredTechniques.length}`);
      }

      techniques = filteredTechniques;
    }

    // STEP 2: Fallback searches if no results from strict filtering
    if (techniques.length === 0 && filters.query && filters.query.trim()) {
      console.log(`🔄 No results from strict search, trying fallbacks...`);
      
      // Fallback 1: Query only (ignore platform/tactic filters)
      const query = filters.query.toLowerCase();
      const queryWords = query.split(/\s+/).filter(word => word.length > 2);
      
      techniques = allTechniques.filter(technique => {
        const name = technique.name.toLowerCase();
        const description = technique.description.toLowerCase();
        
        // Try partial word matching
        return queryWords.some(word => 
          name.includes(word) || description.includes(word)
        ) || name.includes(query) || description.includes(query);
      });
      
      searchSteps.push(`Fallback query-only search: ${techniques.length} results`);
      
      // Fallback 2: Single word matching if still no results
      if (techniques.length === 0 && queryWords.length > 0) {
        techniques = allTechniques.filter(technique => {
          const name = technique.name.toLowerCase();
          // Try each word individually
          return queryWords.some(word => name.includes(word));
        });
        searchSteps.push(`Fallback single-word search: ${techniques.length} results`);
      }
    }

    // STEP 3: If still no results, return sample techniques for debugging
    if (techniques.length === 0) {
      console.log(`⚠️ No search results found, returning sample techniques for debugging`);
      techniques = allTechniques.slice(0, 5); // Return first 5 for debugging
      searchSteps.push(`Debug mode: returning ${techniques.length} sample techniques`);
    }

    console.log(`🔍 Search completed:`, searchSteps.join(' | '));
    console.log(`📋 Final result count: ${techniques.length}`);
    
    return techniques;
  }

  /**
   * Get technique by MITRE ID (T1234 or T1234.001)
   * @param {string} techniqueId - MITRE technique ID
   * @param {string} domain - Domain to search in
   * @returns {Object|null} Technique object or null if not found
   */
  getTechniqueById(techniqueId, domain = 'enterprise') {
    const data = this.loadDomain(domain);
    const technique = data.objects.find(obj => 
      obj.type === 'attack-pattern' &&
      obj.external_references &&
      obj.external_references.some(ref => 
        ref.source_name === 'mitre-attack' && 
        ref.external_id === techniqueId
      )
    );

    return technique || null;
  }

  /**
   * Get all tactics for a domain
   * @param {string} domain - Domain to query
   * @returns {Array} Array of tactic objects
   */
  getTactics(domain = 'enterprise') {
    const data = this.loadDomain(domain);
    return data.objects.filter(obj => obj.type === 'x-mitre-tactic');
  }

  /**
   * Get relationships for a technique
   * @param {string} techniqueId - MITRE technique ID
   * @param {string} domain - Domain to search in
   * @returns {Object} Object with technique and related objects
   */
  getTechniqueWithRelationships(techniqueId, domain = 'enterprise') {
    const data = this.loadDomain(domain);
    
    const technique = this.getTechniqueById(techniqueId, domain);
    if (!technique) {
      return null;
    }

    // Find relationships involving this technique
    const relationships = data.objects.filter(obj => 
      obj.type === 'relationship' && 
      (obj.source_ref === technique.id || obj.target_ref === technique.id)
    );

    // Find groups that use this technique
    const groups = data.objects.filter(obj => 
      obj.type === 'intrusion-set' &&
      relationships.some(rel => 
        rel.relationship_type === 'uses' && 
        rel.source_ref === obj.id && 
        rel.target_ref === technique.id
      )
    );

    // Find software that implements this technique
    const software = data.objects.filter(obj => 
      (obj.type === 'malware' || obj.type === 'tool') &&
      relationships.some(rel => 
        rel.relationship_type === 'uses' && 
        rel.source_ref === obj.id && 
        rel.target_ref === technique.id
      )
    );

    // Find sub-techniques
    const subTechniques = data.objects.filter(obj => 
      obj.type === 'attack-pattern' &&
      obj.x_mitre_is_subtechnique === true &&
      relationships.some(rel => 
        rel.relationship_type === 'subtechnique-of' && 
        rel.source_ref === obj.id && 
        rel.target_ref === technique.id
      )
    );

    return {
      technique,
      relationships,
      groups,
      software,
      subTechniques
    };
  }

  /**
   * Search across multiple object types
   * @param {string} query - Search query
   * @param {string} domain - Domain to search in
   * @param {Array} objectTypes - Types to search (default: all)
   * @returns {Object} Search results grouped by type
   */
  searchAll(query, domain = 'enterprise', objectTypes = null) {
    const data = this.loadDomain(domain);
    const searchQuery = query.toLowerCase();
    
    const defaultTypes = ['attack-pattern', 'intrusion-set', 'malware', 'tool', 'x-mitre-tactic'];
    const typesToSearch = objectTypes || defaultTypes;

    const results = {};

    typesToSearch.forEach(type => {
      results[type] = data.objects.filter(obj => {
        if (obj.type !== type) return false;
        
        return obj.name?.toLowerCase().includes(searchQuery) ||
               obj.description?.toLowerCase().includes(searchQuery) ||
               obj.external_references?.some(ref => 
                 ref.external_id?.toLowerCase().includes(searchQuery)
               );
      });
    });

    return results;
  }

  /**
   * Get available platforms for a domain
   * @param {string} domain - Domain to query
   * @returns {Array} Array of unique platform names
   */
  getPlatforms(domain = 'enterprise') {
    const techniques = this.getTechniques(domain);
    const platforms = new Set();

    techniques.forEach(technique => {
      if (technique.x_mitre_platforms) {
        technique.x_mitre_platforms.forEach(platform => platforms.add(platform));
      }
    });

    return Array.from(platforms).sort();
  }

  /**
   * Get available data sources for a domain
   * @param {string} domain - Domain to query
   * @returns {Array} Array of unique data source names
   */
  getDataSources(domain = 'enterprise') {
    const techniques = this.getTechniques(domain);
    const dataSources = new Set();

    techniques.forEach(technique => {
      if (technique.x_mitre_data_sources) {
        technique.x_mitre_data_sources.forEach(ds => dataSources.add(ds));
      }
    });

    return Array.from(dataSources).sort();
  }

  /**
   * Validate data availability
   * @returns {Object} Validation results for each domain
   */
  validateDataAvailability() {
    const results = {
      baseDirectory: fs.existsSync(this.baseDir)
    };

    this.supportedDomains.forEach(domain => {
      const filePath = path.join(this.baseDir, `${domain}-attack`, `${domain}-attack.json`);
      results[domain] = fs.existsSync(filePath);
    });

    return results;
  }

  /**
   * Search techniques across multiple MITRE domains
   * @param {string} query - Search query
   * @param {Array} domains - Domains to search (['enterprise', 'mobile', 'ics'])
   * @param {Object} filters - Optional filters
   * @returns {Object} Aggregated results with domain attribution
   */
  searchMultipleDomains(query, domains = ['enterprise', 'mobile', 'ics'], filters = {}) {
    console.log(`🔍 Multi-domain search: "${query}" across domains: ${domains.join(', ')}`);
    
    const aggregatedResults = {
      techniques: [],
      domain_breakdown: {},
      search_metadata: {
        query,
        domains_searched: domains,
        total_domains: domains.length,
        successful_domains: 0
      }
    };

    const seenTechniqueIds = new Set(); // For deduplication

    for (const domain of domains) {
      try {
        console.log(`📊 Searching ${domain} domain...`);
        
        // Use existing getTechniques method for each domain with query
        const domainTechniques = this.getTechniques(domain, { ...filters, query });
        
        // Process and enrich techniques with domain information
        const enrichedTechniques = domainTechniques.map(technique => {
          const mitreId = technique.external_references?.find(ref => 
            ref.source_name === 'mitre-attack'
          )?.external_id || 'Unknown';

          return {
            id: mitreId,
            name: technique.name,
            description: technique.description,
            platforms: technique.x_mitre_platforms || [],
            tactics: technique.kill_chain_phases?.map(kcp => kcp.phase_name) || [],
            data_sources: technique.x_mitre_data_sources || [],
            detection: technique.x_mitre_detection || 'No detection guidance available',
            is_sub_technique: technique.x_mitre_is_subtechnique || false,
            url: technique.external_references?.find(ref => 
              ref.source_name === 'mitre-attack'
            )?.url,
            version: technique.x_mitre_version,
            source_domain: domain, // Add domain attribution
            stix_id: technique.id // Keep original STIX ID for relationships
          };
        });

        // Deduplicate techniques across domains
        const uniqueTechniques = enrichedTechniques.filter(technique => {
          if (seenTechniqueIds.has(technique.id)) {
            // If we've seen this technique, add domain to existing entry
            const existingTechnique = aggregatedResults.techniques.find(t => t.id === technique.id);
            if (existingTechnique && !existingTechnique.additional_domains) {
              existingTechnique.additional_domains = [];
            }
            if (existingTechnique) {
              existingTechnique.additional_domains.push(domain);
            }
            return false;
          } else {
            seenTechniqueIds.add(technique.id);
            return true;
          }
        });

        // Add unique techniques to aggregated results
        aggregatedResults.techniques.push(...uniqueTechniques);

        // Track domain-specific results
        aggregatedResults.domain_breakdown[domain] = {
          total_techniques: domainTechniques.length,
          unique_techniques: uniqueTechniques.length,
          shared_techniques: enrichedTechniques.length - uniqueTechniques.length
        };

        aggregatedResults.search_metadata.successful_domains++;
        console.log(`✅ ${domain}: ${domainTechniques.length} techniques found`);

      } catch (error) {
        console.error(`❌ Error searching ${domain} domain:`, error.message);
        aggregatedResults.domain_breakdown[domain] = {
          error: error.message,
          total_techniques: 0,
          unique_techniques: 0,
          shared_techniques: 0
        };
      }
    }

    // Sort results by relevance (can be enhanced with scoring)
    aggregatedResults.techniques.sort((a, b) => {
      // Prioritize techniques that appear in multiple domains
      const aMultiDomain = a.additional_domains ? a.additional_domains.length : 0;
      const bMultiDomain = b.additional_domains ? b.additional_domains.length : 0;
      
      if (aMultiDomain !== bMultiDomain) {
        return bMultiDomain - aMultiDomain;
      }
      
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // Add final metadata
    aggregatedResults.search_metadata.total_techniques = aggregatedResults.techniques.length;
    aggregatedResults.search_metadata.cross_domain_techniques = 
      aggregatedResults.techniques.filter(t => t.additional_domains && t.additional_domains.length > 0).length;

    console.log(`🎯 Multi-domain search complete: ${aggregatedResults.techniques.length} unique techniques`);
    
    return aggregatedResults;
  }

  /**
   * Get technique details with multi-domain fallback
   * @param {string} techniqueId - MITRE technique ID
   * @param {Array} domains - Domains to search in order of preference
   * @param {boolean} includeRelationships - Include relationship data
   * @returns {Object} Technique details with domain information
   */
  getTechniqueMultiDomain(techniqueId, domains = ['enterprise', 'mobile', 'ics'], includeRelationships = true) {
    console.log(`🔍 Multi-domain technique lookup: ${techniqueId}`);
    
    for (const domain of domains) {
      try {
        if (includeRelationships) {
          const data = this.getTechniqueWithRelationships(techniqueId, domain);
          if (data) {
            console.log(`✅ Found ${techniqueId} in ${domain} domain`);
            return {
              ...data,
              source_domain: domain,
              searched_domains: domains
            };
          }
        } else {
          const technique = this.getTechniqueById(techniqueId, domain);
          if (technique) {
            console.log(`✅ Found ${techniqueId} in ${domain} domain`);
            return {
              technique,
              source_domain: domain,
              searched_domains: domains
            };
          }
        }
      } catch (error) {
        console.log(`❌ ${techniqueId} not found in ${domain}: ${error.message}`);
        continue;
      }
    }

    console.log(`❌ ${techniqueId} not found in any domain: ${domains.join(', ')}`);
    return null;
  }
}

module.exports = new STIXDataLoader();