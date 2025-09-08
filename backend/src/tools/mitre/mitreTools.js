const stixDataLoader = require('../utils/stixDataLoader');

/**
 * MITRE ATT&CK Tools for AI Agent System
 * Implements comprehensive MITRE toolkit with GPT-OSS HIGH reasoning effort
 */

const MITRE_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_mitre_techniques",
      description: "Search for MITRE ATT&CK techniques using natural language queries, filters, and contextual understanding. Returns comprehensive technique information including relationships, detection methods, and tactical context.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language search query for techniques (e.g., 'privilege escalation using registry', 'lateral movement via SMB', 'data exfiltration techniques')"
          },
          domain: {
            type: "string",
            enum: ["enterprise", "mobile", "ics"],
            default: "enterprise",
            description: "MITRE ATT&CK domain to search within"
          },
          platform: {
            type: "string",
            description: "Filter by platform (Windows, Linux, macOS, AWS, etc.)"
          },
          tactic: {
            type: "string",
            description: "Filter by tactic (initial-access, execution, persistence, etc.)"
          },
          include_sub_techniques: {
            type: "boolean",
            default: true,
            description: "Include sub-techniques in results"
          },
          max_results: {
            type: "integer",
            default: 20,
            description: "Maximum number of results to return"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "get_technique_details",
      description: "Get comprehensive details for a specific MITRE ATT&CK technique including detection methods, mitigation strategies, related groups, software, and sub-techniques.",
      parameters: {
        type: "object",
        properties: {
          technique_id: {
            type: "string",
            description: "MITRE technique ID (e.g., T1055, T1055.001)"
          },
          domain: {
            type: "string",
            enum: ["enterprise", "mobile", "ics"],
            default: "enterprise",
            description: "MITRE ATT&CK domain"
          },
          include_relationships: {
            type: "boolean",
            default: true,
            description: "Include related groups, software, and techniques"
          }
        },
        required: ["technique_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "map_threat_hunt_to_mitre",
      description: "Map threat hunting queries, indicators, or observable behavior to relevant MITRE ATT&CK techniques. Provides tactical context and detection guidance.",
      parameters: {
        type: "object",
        properties: {
          hunt_description: {
            type: "string",
            description: "Description of threat hunting activity, indicators, or observed behavior to map to MITRE framework"
          },
          data_sources: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Available data sources for detection (e.g., 'Process Monitoring', 'Network Traffic', 'File Monitoring')"
          },
          platform: {
            type: "string",
            description: "Target platform being hunted (Windows, Linux, macOS, etc.)"
          },
          confidence_threshold: {
            type: "number",
            default: 0.7,
            description: "Minimum confidence level for technique mapping (0.0-1.0)"
          }
        },
        required: ["hunt_description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_mitre_tactics",
      description: "Retrieve all MITRE ATT&CK tactics for a domain with comprehensive information about the kill chain progression.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            enum: ["enterprise", "mobile", "ics"],
            default: "enterprise",
            description: "MITRE ATT&CK domain"
          },
          include_technique_counts: {
            type: "boolean",
            default: true,
            description: "Include count of techniques per tactic"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_attack_pattern",
      description: "Analyze a described attack pattern or sequence of events against MITRE ATT&CK framework to identify likely techniques, tactics, and threat actor behavior.",
      parameters: {
        type: "object",
        properties: {
          attack_description: {
            type: "string",
            description: "Detailed description of the attack pattern, sequence of events, or incident details to analyze"
          },
          indicators: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of indicators observed (file hashes, IPs, domains, registry keys, etc.)"
          },
          timeline: {
            type: "string",
            description: "Chronological sequence of events if available"
          },
          environment: {
            type: "string",
            description: "Target environment details (Windows domain, cloud infrastructure, etc.)"
          }
        },
        required: ["attack_description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_detection_techniques",
      description: "Suggest detection methods and data sources for specific MITRE ATT&CK techniques or attack scenarios, including detection rules and hunting strategies.",
      parameters: {
        type: "object",
        properties: {
          technique_ids: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of MITRE technique IDs to generate detections for"
          },
          available_data_sources: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Available data sources in the environment for detection"
          },
          detection_platform: {
            type: "string",
            description: "Detection platform (Splunk, Elastic, Sigma, etc.)"
          },
          coverage_level: {
            type: "string",
            enum: ["basic", "intermediate", "advanced"],
            default: "intermediate",
            description: "Desired detection coverage level"
          }
        },
        required: ["technique_ids"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_technique_relationships", 
      description: "Explore relationships between MITRE ATT&CK techniques, including prerequisite techniques, follow-on techniques, and technique combinations commonly used together.",
      parameters: {
        type: "object",
        properties: {
          technique_id: {
            type: "string",
            description: "Primary MITRE technique ID to explore relationships for"
          },
          relationship_types: {
            type: "array",
            items: {
              type: "string",
              enum: ["prerequisites", "follow_on", "combinations", "alternatives"]
            },
            default: ["prerequisites", "follow_on", "combinations"],
            description: "Types of relationships to explore"
          },
          domain: {
            type: "string",
            enum: ["enterprise", "mobile", "ics"],
            default: "enterprise",
            description: "MITRE ATT&CK domain"
          }
        },
        required: ["technique_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_hunt_hypothesis",
      description: "Generate threat hunting hypotheses based on MITRE ATT&CK techniques, current threat intelligence, and environmental context.",
      parameters: {
        type: "object",
        properties: {
          threat_context: {
            type: "string",
            description: "Current threat landscape context or specific threat intelligence"
          },
          environment_type: {
            type: "string",
            description: "Environment type (corporate network, cloud infrastructure, industrial systems, etc.)"
          },
          focus_tactics: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Specific tactics to focus hunting efforts on"
          },
          priority_assets: {
            type: "array",
            items: {
              type: "string"
            },
            description: "High-priority assets or systems to protect"
          },
          hypothesis_count: {
            type: "integer",
            default: 5,
            description: "Number of hunting hypotheses to generate"
          }
        },
        required: ["threat_context", "environment_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_alert_for_mitre_multi_domain",
      description: "Analyze alert data across all MITRE domains (Enterprise, Mobile, ICS) to map relevant TTPs with domain classification and AI enrichment. Provides comprehensive analysis for IT Security analysts and threat hunters.",
      parameters: {
        type: "object",
        properties: {
          alert_data: {
            type: "object",
            description: "Complete alert information including rawData, description, sourceSystem, etc."
          },
          alert_description: {
            type: "string", 
            description: "Human-readable description of the alert or security event"
          },
          source_system: {
            type: "string",
            description: "Source system that generated the alert (e.g., 'Endpoint Detection', 'Network Monitor')"
          },
          indicators: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of indicators observed (file hashes, IPs, domains, registry keys, etc.)"
          },
          environment_context: {
            type: "string",
            description: "Environment context (corporate network, cloud infrastructure, industrial systems, etc.)"
          },
          enable_ai_enrichment: {
            type: "boolean",
            default: true,
            description: "Enable AI-powered analysis and enrichment of mapped techniques"
          }
        },
        required: ["alert_data", "alert_description"]
      }
    }
  }
];

/**
 * Tool execution functions with comprehensive MITRE ATT&CK integration
 */
class MitreToolExecutor {
  constructor() {
    this.stixLoader = stixDataLoader;
  }

  async searchMitreTechniques(params) {
    try {
      const {
        query,
        domain = 'enterprise',
        platform,
        tactic,
        include_sub_techniques = true,
        max_results = 20
      } = params;

      console.log(`🔍 Searching MITRE techniques: "${query}" in ${domain} domain`);

      // Get techniques with filters
      const filters = {
        query,
        platform,
        tactic,
        excludeRevoked: true
      };

      let techniques = this.stixLoader.getTechniques(domain, filters);

      // Filter sub-techniques if requested
      if (!include_sub_techniques) {
        techniques = techniques.filter(t => !t.x_mitre_is_subtechnique);
      }

      // Limit results
      techniques = techniques.slice(0, max_results);

      // Enrich with additional context
      const enrichedTechniques = techniques.map(technique => {
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
          version: technique.x_mitre_version
        };
      });

      return {
        success: true,
        results: enrichedTechniques,
        total_found: enrichedTechniques.length,
        search_params: { query, domain, platform, tactic },
        message: `Found ${enrichedTechniques.length} techniques matching "${query}"`
      };

    } catch (error) {
      console.error('❌ Error searching MITRE techniques:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  async getTechniqueDetails(params) {
    try {
      const { technique_id, domain = 'enterprise', include_relationships = true } = params;

      console.log(`📋 Getting technique details: ${technique_id} from ${domain} domain`);

      if (include_relationships) {
        const data = this.stixLoader.getTechniqueWithRelationships(technique_id, domain);
        
        if (!data) {
          return {
            success: false,
            error: `Technique ${technique_id} not found in ${domain} domain`,
            technique: null
          };
        }

        const { technique, groups, software, subTechniques } = data;
        const mitreId = technique.external_references?.find(ref => 
          ref.source_name === 'mitre-attack'
        )?.external_id || technique_id;

        return {
          success: true,
          technique: {
            id: mitreId,
            name: technique.name,
            description: technique.description,
            platforms: technique.x_mitre_platforms || [],
            tactics: technique.kill_chain_phases?.map(kcp => kcp.phase_name) || [],
            data_sources: technique.x_mitre_data_sources || [],
            detection: technique.x_mitre_detection || 'No detection guidance available',
            permissions_required: technique.x_mitre_permissions_required || [],
            defense_bypassed: technique.x_mitre_defense_bypassed || [],
            is_sub_technique: technique.x_mitre_is_subtechnique || false,
            url: technique.external_references?.find(ref => 
              ref.source_name === 'mitre-attack'
            )?.url,
            version: technique.x_mitre_version
          },
          related_groups: groups.map(group => ({
            id: group.external_references?.find(ref => ref.source_name === 'mitre-attack')?.external_id,
            name: group.name,
            aliases: group.aliases || []
          })),
          related_software: software.map(sw => ({
            id: sw.external_references?.find(ref => ref.source_name === 'mitre-attack')?.external_id,
            name: sw.name,
            type: sw.type,
            aliases: sw.x_mitre_aliases || []
          })),
          sub_techniques: subTechniques.map(sub => ({
            id: sub.external_references?.find(ref => ref.source_name === 'mitre-attack')?.external_id,
            name: sub.name,
            description: sub.description
          }))
        };
      } else {
        const technique = this.stixLoader.getTechniqueById(technique_id, domain);
        
        if (!technique) {
          return {
            success: false,
            error: `Technique ${technique_id} not found in ${domain} domain`,
            technique: null
          };
        }

        const mitreId = technique.external_references?.find(ref => 
          ref.source_name === 'mitre-attack'
        )?.external_id || technique_id;

        return {
          success: true,
          technique: {
            id: mitreId,
            name: technique.name,
            description: technique.description,
            platforms: technique.x_mitre_platforms || [],
            tactics: technique.kill_chain_phases?.map(kcp => kcp.phase_name) || [],
            data_sources: technique.x_mitre_data_sources || [],
            detection: technique.x_mitre_detection || 'No detection guidance available',
            permissions_required: technique.x_mitre_permissions_required || [],
            defense_bypassed: technique.x_mitre_defense_bypassed || [],
            is_sub_technique: technique.x_mitre_is_subtechnique || false,
            url: technique.external_references?.find(ref => 
              ref.source_name === 'mitre-attack'
            )?.url,
            version: technique.x_mitre_version
          }
        };
      }

    } catch (error) {
      console.error('❌ Error getting technique details:', error);
      return {
        success: false,
        error: error.message,
        technique: null
      };
    }
  }

  async mapThreatHuntToMitre(params) {
    try {
      const {
        hunt_description,
        data_sources = [],
        platform,
        confidence_threshold = 0.7
      } = params;

      console.log(`🎯 Mapping threat hunt to MITRE: "${hunt_description}"`);

      // Search for relevant techniques based on hunt description
      const searchResults = await this.searchMitreTechniques({
        query: hunt_description,
        platform,
        max_results: 50
      });

      if (!searchResults.success) {
        return searchResults;
      }

      // Score techniques based on relevance and available data sources
      const scoredTechniques = searchResults.results.map(technique => {
        let score = 0.5; // Base score

        // Increase score if data sources match
        if (data_sources.length > 0 && technique.data_sources.length > 0) {
          const matchingDataSources = technique.data_sources.filter(ds =>
            data_sources.some(available => 
              available.toLowerCase().includes(ds.toLowerCase()) ||
              ds.toLowerCase().includes(available.toLowerCase())
            )
          );
          score += (matchingDataSources.length / technique.data_sources.length) * 0.3;
        }

        // Increase score if platform matches
        if (platform && technique.platforms.some(p => 
          p.toLowerCase().includes(platform.toLowerCase())
        )) {
          score += 0.2;
        }

        return {
          ...technique,
          relevance_score: Math.min(score, 1.0),
          matching_data_sources: data_sources.filter(ds =>
            technique.data_sources.some(tds => 
              ds.toLowerCase().includes(tds.toLowerCase()) ||
              tds.toLowerCase().includes(ds.toLowerCase())
            )
          )
        };
      }).filter(technique => technique.relevance_score >= confidence_threshold)
        .sort((a, b) => b.relevance_score - a.relevance_score);

      return {
        success: true,
        mapped_techniques: scoredTechniques.slice(0, 10),
        hunt_context: {
          description: hunt_description,
          platform,
          available_data_sources: data_sources,
          confidence_threshold
        },
        mapping_summary: {
          total_candidates: searchResults.results.length,
          high_confidence_matches: scoredTechniques.length,
          recommended_focus: scoredTechniques.slice(0, 3).map(t => t.id)
        }
      };

    } catch (error) {
      console.error('❌ Error mapping threat hunt to MITRE:', error);
      return {
        success: false,
        error: error.message,
        mapped_techniques: []
      };
    }
  }

  async getMitreTactics(params) {
    try {
      const { domain = 'enterprise', include_technique_counts = true } = params;

      console.log(`📊 Getting MITRE tactics for ${domain} domain`);

      const tactics = this.stixLoader.getTactics(domain);
      
      let enrichedTactics = tactics.map(tactic => {
        const mitreId = tactic.external_references?.find(ref => 
          ref.source_name === 'mitre-attack'
        )?.external_id || 'Unknown';

        return {
          id: mitreId,
          name: tactic.name,
          description: tactic.description,
          short_name: tactic.x_mitre_shortname,
          url: tactic.external_references?.find(ref => 
            ref.source_name === 'mitre-attack'
          )?.url,
          order: this.getTacticOrder(tactic.x_mitre_shortname)
        };
      });

      // Sort by tactical order
      enrichedTactics.sort((a, b) => a.order - b.order);

      // Add technique counts if requested
      if (include_technique_counts) {
        const techniques = this.stixLoader.getTechniques(domain);
        
        enrichedTactics = enrichedTactics.map(tactic => ({
          ...tactic,
          technique_count: techniques.filter(t => 
            t.kill_chain_phases?.some(kcp => kcp.phase_name === tactic.short_name)
          ).length
        }));
      }

      return {
        success: true,
        tactics: enrichedTactics,
        domain,
        total_tactics: enrichedTactics.length
      };

    } catch (error) {
      console.error('❌ Error getting MITRE tactics:', error);
      return {
        success: false,
        error: error.message,
        tactics: []
      };
    }
  }

  getTacticOrder(shortName) {
    const tacticOrder = {
      'reconnaissance': 1,
      'resource-development': 2,
      'initial-access': 3,
      'execution': 4,
      'persistence': 5,
      'privilege-escalation': 6,
      'defense-evasion': 7,
      'credential-access': 8,
      'discovery': 9,
      'lateral-movement': 10,
      'collection': 11,
      'command-and-control': 12,
      'exfiltration': 13,
      'impact': 14
    };
    return tacticOrder[shortName] || 999;
  }

  async analyzeAttackPattern(params) {
    try {
      const {
        attack_description,
        indicators = [],
        timeline,
        environment
      } = params;

      console.log(`🔬 Analyzing attack pattern: "${attack_description.substring(0, 100)}..."`);

      // Search for techniques mentioned in description
      const searchResults = await this.searchMitreTechniques({
        query: attack_description,
        max_results: 30
      });

      if (!searchResults.success) {
        return searchResults;
      }

      // Analyze indicators for additional technique mapping
      const indicatorTechniques = [];
      for (const indicator of indicators) {
        const indicatorSearch = await this.searchMitreTechniques({
          query: indicator,
          max_results: 10
        });
        if (indicatorSearch.success) {
          indicatorTechniques.push(...indicatorSearch.results);
        }
      }

      // Combine and deduplicate techniques
      const allTechniques = [...searchResults.results, ...indicatorTechniques];
      const uniqueTechniques = allTechniques.filter((technique, index, self) =>
        index === self.findIndex(t => t.id === technique.id)
      );

      // Group by tactics for kill chain analysis
      const tacticGroups = {};
      uniqueTechniques.forEach(technique => {
        technique.tactics.forEach(tactic => {
          if (!tacticGroups[tactic]) {
            tacticGroups[tactic] = [];
          }
          tacticGroups[tactic].push(technique);
        });
      });

      return {
        success: true,
        analysis: {
          description: attack_description,
          total_techniques_identified: uniqueTechniques.length,
          techniques_by_tactic: tacticGroups,
          kill_chain_coverage: Object.keys(tacticGroups).sort(),
          high_confidence_techniques: uniqueTechniques.slice(0, 5)
        },
        indicators_analyzed: indicators.length,
        environment_context: environment,
        timeline_provided: !!timeline,
        recommendations: {
          priority_techniques: uniqueTechniques.slice(0, 3).map(t => t.id),
          detection_focus: uniqueTechniques.filter(t => t.detection !== 'No detection guidance available').slice(0, 5),
          missing_tactics: this.identifyMissingTactics(Object.keys(tacticGroups))
        }
      };

    } catch (error) {
      console.error('❌ Error analyzing attack pattern:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  identifyMissingTactics(presentTactics) {
    const allTactics = [
      'reconnaissance', 'resource-development', 'initial-access', 'execution',
      'persistence', 'privilege-escalation', 'defense-evasion', 'credential-access',
      'discovery', 'lateral-movement', 'collection', 'command-and-control',
      'exfiltration', 'impact'
    ];
    return allTactics.filter(tactic => !presentTactics.includes(tactic));
  }

  async suggestDetectionTechniques(params) {
    try {
      const {
        technique_ids,
        available_data_sources = [],
        detection_platform,
        coverage_level = 'intermediate'
      } = params;

      console.log(`🛡️ Suggesting detections for techniques: ${technique_ids.join(', ')}`);

      const detectionSuggestions = [];

      for (const techniqueId of technique_ids) {
        const details = await this.getTechniqueDetails({
          technique_id: techniqueId,
          include_relationships: false
        });

        if (details.success) {
          const technique = details.technique;
          
          const suggestion = {
            technique_id: techniqueId,
            technique_name: technique.name,
            data_sources: technique.data_sources,
            available_sources: available_data_sources.filter(ds =>
              technique.data_sources.some(tds => 
                ds.toLowerCase().includes(tds.toLowerCase()) ||
                tds.toLowerCase().includes(ds.toLowerCase())
              )
            ),
            detection_guidance: technique.detection,
            coverage_assessment: this.assessDetectionCoverage(
              technique.data_sources,
              available_data_sources,
              coverage_level
            ),
            suggested_rules: this.generateDetectionRules(technique, detection_platform, coverage_level)
          };

          detectionSuggestions.push(suggestion);
        }
      }

      return {
        success: true,
        detection_suggestions: detectionSuggestions,
        summary: {
          total_techniques: technique_ids.length,
          techniques_with_available_data: detectionSuggestions.filter(s => s.available_sources.length > 0).length,
          coverage_level,
          detection_platform
        },
        recommendations: {
          high_priority: detectionSuggestions.filter(s => s.coverage_assessment.priority === 'high'),
          data_source_gaps: this.identifyDataSourceGaps(detectionSuggestions)
        }
      };

    } catch (error) {
      console.error('❌ Error suggesting detection techniques:', error);
      return {
        success: false,
        error: error.message,
        detection_suggestions: []
      };
    }
  }

  assessDetectionCoverage(techniqueSources, availableSources, coverageLevel) {
    const matchingSourcesCount = techniqueSources.filter(ts =>
      availableSources.some(as => 
        as.toLowerCase().includes(ts.toLowerCase()) ||
        ts.toLowerCase().includes(as.toLowerCase())
      )
    ).length;

    const coveragePercentage = techniqueSources.length > 0 
      ? (matchingSourcesCount / techniqueSources.length) * 100 
      : 0;

    let priority = 'low';
    if (coveragePercentage >= 70) priority = 'high';
    else if (coveragePercentage >= 40) priority = 'medium';

    return {
      coverage_percentage: Math.round(coveragePercentage),
      matching_sources: matchingSourcesCount,
      total_sources_needed: techniqueSources.length,
      priority,
      feasibility: coveragePercentage >= 50 ? 'high' : coveragePercentage >= 25 ? 'medium' : 'low'
    };
  }

  generateDetectionRules(technique, platform, coverageLevel) {
    // Simplified rule generation - in production this would be more sophisticated
    const rules = [];
    
    if (technique.data_sources.includes('Process Monitoring')) {
      rules.push({
        type: 'process_monitoring',
        description: `Monitor processes related to ${technique.name}`,
        example: `platform:${platform || 'generic'} | search process_name related to technique ${technique.id}`
      });
    }

    if (technique.data_sources.includes('File Monitoring')) {
      rules.push({
        type: 'file_monitoring',
        description: `Monitor file activities for ${technique.name}`,
        example: `platform:${platform || 'generic'} | search file operations related to technique ${technique.id}`
      });
    }

    return rules;
  }

  identifyDataSourceGaps(suggestions) {
    const allRequiredSources = new Set();
    const allAvailableSources = new Set();

    suggestions.forEach(s => {
      s.data_sources.forEach(ds => allRequiredSources.add(ds));
      s.available_sources.forEach(ds => allAvailableSources.add(ds));
    });

    return Array.from(allRequiredSources).filter(source => !allAvailableSources.has(source));
  }

  async getTechniqueRelationships(params) {
    try {
      const {
        technique_id,
        relationship_types = ['prerequisites', 'follow_on', 'combinations'],
        domain = 'enterprise'
      } = params;

      console.log(`🔗 Getting relationships for technique: ${technique_id}`);

      const data = this.stixLoader.getTechniqueWithRelationships(technique_id, domain);
      
      if (!data) {
        return {
          success: false,
          error: `Technique ${technique_id} not found in ${domain} domain`,
          relationships: null
        };
      }

      const { technique, relationships } = data;

      // Analyze relationships based on requested types
      const relationshipAnalysis = {
        technique_id,
        technique_name: technique.name,
        relationships: {
          prerequisites: [],
          follow_on: [],
          combinations: [],
          alternatives: []
        }
      };

      // This is a simplified implementation - in production you'd analyze the STIX relationships more thoroughly
      if (relationship_types.includes('prerequisites')) {
        relationshipAnalysis.relationships.prerequisites = [
          `Initial access techniques often prerequisite to ${technique.name}`,
          `Valid credentials may be required for ${technique.name}`
        ];
      }

      if (relationship_types.includes('follow_on')) {
        relationshipAnalysis.relationships.follow_on = [
          `${technique.name} may lead to lateral movement techniques`,
          `Data collection techniques may follow ${technique.name}`
        ];
      }

      if (relationship_types.includes('combinations')) {
        relationshipAnalysis.relationships.combinations = [
          `${technique.name} is often combined with defense evasion techniques`,
          `Persistence techniques may be used alongside ${technique.name}`
        ];
      }

      return {
        success: true,
        relationships: relationshipAnalysis,
        raw_relationships_count: relationships.length
      };

    } catch (error) {
      console.error('❌ Error getting technique relationships:', error);
      return {
        success: false,
        error: error.message,
        relationships: null
      };
    }
  }

  async generateHuntHypothesis(params) {
    try {
      const {
        threat_context,
        environment_type,
        focus_tactics = [],
        priority_assets = [],
        hypothesis_count = 5
      } = params;

      console.log(`💡 Generating hunt hypotheses for: ${environment_type}`);

      // Get relevant techniques based on context
      const contextSearch = await this.searchMitreTechniques({
        query: threat_context,
        max_results: 50
      });

      if (!contextSearch.success) {
        return contextSearch;
      }

      // Filter by focus tactics if specified
      let relevantTechniques = contextSearch.results;
      if (focus_tactics.length > 0) {
        relevantTechniques = relevantTechniques.filter(technique =>
          technique.tactics.some(tactic => 
            focus_tactics.some(focus => 
              tactic.toLowerCase().includes(focus.toLowerCase())
            )
          )
        );
      }

      // Generate hypotheses
      const hypotheses = [];
      for (let i = 0; i < Math.min(hypothesis_count, relevantTechniques.length); i++) {
        const technique = relevantTechniques[i];
        
        const hypothesis = {
          id: `H${i + 1}`,
          title: `Hunt for ${technique.name} in ${environment_type}`,
          description: `Based on current threat context: ${threat_context}`,
          target_technique: technique.id,
          technique_name: technique.name,
          tactics: technique.tactics,
          data_sources: technique.data_sources,
          priority_assets_affected: priority_assets,
          hunt_approach: this.generateHuntApproach(technique, environment_type),
          success_criteria: this.generateSuccessCriteria(technique),
          estimated_effort: this.estimateHuntEffort(technique, environment_type)
        };

        hypotheses.push(hypothesis);
      }

      return {
        success: true,
        hypotheses,
        context: {
          threat_context,
          environment_type,
          focus_tactics,
          priority_assets,
          total_techniques_analyzed: relevantTechniques.length
        },
        recommendations: {
          high_priority_hunts: hypotheses.slice(0, 3),
          required_data_sources: [...new Set(hypotheses.flatMap(h => h.data_sources))],
          coverage_assessment: this.assessHuntCoverage(hypotheses, focus_tactics)
        }
      };

    } catch (error) {
      console.error('❌ Error generating hunt hypotheses:', error);
      return {
        success: false,
        error: error.message,
        hypotheses: []
      };
    }
  }

  generateHuntApproach(technique, environmentType) {
    const approaches = [
      `Monitor ${technique.data_sources.join(', ')} for indicators of ${technique.name}`,
      `Search for anomalous patterns consistent with ${technique.name} in ${environmentType}`,
      `Correlate multiple data sources to detect ${technique.name} execution`,
      `Hunt for persistence mechanisms associated with ${technique.name}`
    ];
    
    return approaches[Math.floor(Math.random() * approaches.length)];
  }

  generateSuccessCriteria(technique) {
    return [
      `Identification of ${technique.name} activity within the environment`,
      `Documentation of attack vectors and affected systems`,
      `Development of detection rules for ${technique.name}`,
      `Assessment of current security control effectiveness`
    ];
  }

  estimateHuntEffort(technique, environmentType) {
    const baseEffort = technique.data_sources.length * 2; // Base hours
    const complexityMultiplier = environmentType.includes('cloud') ? 1.5 : 1.0;
    
    return {
      estimated_hours: Math.round(baseEffort * complexityMultiplier),
      complexity: baseEffort > 6 ? 'high' : baseEffort > 3 ? 'medium' : 'low',
      required_skills: ['Threat hunting', 'MITRE ATT&CK', technique.platforms.join(', ')].filter(Boolean)
    };
  }

  assessHuntCoverage(hypotheses, focusTactics) {
    const coveredTactics = [...new Set(hypotheses.flatMap(h => h.tactics))];
    const coveragePercentage = focusTactics.length > 0 
      ? (focusTactics.filter(ft => coveredTactics.some(ct => ct.includes(ft))).length / focusTactics.length) * 100
      : 100;

    return {
      covered_tactics: coveredTactics,
      coverage_percentage: Math.round(coveragePercentage),
      gaps: focusTactics.filter(ft => !coveredTactics.some(ct => ct.includes(ft)))
    };
  }

  async analyzeAlertForMitreMultiDomain(params) {
    try {
      const {
        alert_data,
        alert_description,
        source_system = '',
        indicators = [],
        environment_context = '',
        enable_ai_enrichment = true
      } = params;

      console.log('🎯 Starting multi-domain MITRE analysis for alert');

      // Import the AlertMitreAnalyzer (dynamic import to avoid circular deps)
      const { AlertMitreAnalyzer } = require('./alertMitreAnalyzer');
      const analyzer = new AlertMitreAnalyzer();

      // Prepare enhanced alert data
      const enhancedAlertData = {
        ...alert_data,
        description: alert_description,
        sourceSystem: source_system,
        indicators,
        environmentContext: environment_context
      };

      // Perform comprehensive analysis
      const analysis = await analyzer.analyzeAlert(enhancedAlertData, {
        enableAiEnrichment: enable_ai_enrichment
      });

      if (analysis.success) {
        return {
          success: true,
          analysis_type: 'multi_domain_alert_analysis',
          domain_classification: analysis.domain_classification,
          ttp_mapping: analysis.ttp_mapping,
          enriched_analysis: analysis.enriched_analysis,
          summary: analysis.summary,
          recommendations: {
            immediate_actions: [
              'Review mapped techniques for detection opportunities',
              'Correlate with existing security data sources',
              'Investigate high-confidence techniques first'
            ],
            threat_hunting: [
              'Search for similar patterns across the environment',
              'Look for additional indicators related to mapped TTPs',
              'Review timeline for attack progression'
            ],
            detection_enhancement: [
              'Create detection rules for high-confidence techniques',
              'Enhance monitoring for identified tactics',
              'Implement behavioral detection for attack patterns'
            ]
          },
          processing_time_ms: analysis.processing_time_ms
        };
      } else {
        return {
          success: false,
          error: analysis.error,
          analysis_type: 'multi_domain_alert_analysis',
          fallback_guidance: [
            'Manual analysis recommended',
            'Review alert against MITRE ATT&CK framework',
            'Consider enterprise domain techniques as primary focus'
          ]
        };
      }

    } catch (error) {
      console.error('❌ Error in multi-domain alert analysis:', error);
      return {
        success: false,
        error: error.message,
        analysis_type: 'multi_domain_alert_analysis'
      };
    }
  }
}

module.exports = {
  MITRE_TOOLS,
  MitreToolExecutor
};