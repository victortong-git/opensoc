/**
 * Query Classification Service
 * Intelligently classifies user queries to determine optimal retrieval method
 * Routes between specific record lookup, structured filtering, and semantic search
 */

const { models } = require('../database/models');
const { Op } = require('sequelize');

/**
 * Query Types for Intelligent Routing
 */
const QUERY_TYPES = {
  SPECIFIC_RECORD: 'specific_record',      // Exact ID/name lookups
  STRUCTURED_FILTER: 'structured_filter',  // Time ranges, field-based filtering
  SEMANTIC_SEARCH: 'semantic_search',     // Concept-based queries
  INTERACTIVE_WORKFLOW: 'interactive_workflow', // Multi-step processes requiring user input
  INFORMATION_GATHERING: 'information_gathering', // Requests that need clarification
  CONFIRMATION_REQUIRED: 'confirmation_required', // Actions needing user approval
  HYBRID: 'hybrid'                        // Complex queries needing multiple approaches
};

/**
 * Classification Patterns for Query Type Detection
 */
const CLASSIFICATION_PATTERNS = {
  // Specific Record Patterns
  SPECIFIC_RECORD: [
    // ID patterns
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/, // UUID
    /\b[A-Z]{2,4}-\d{3,6}\b/, // Alert/Incident IDs like ALT-1234
    /\b(alert|incident|asset|ioc)\s+([A-Za-z0-9-]+)\b/i, // "alert ABC-123"
    /\b(show|get|find|display)\s+(alert|incident|asset|ioc)\s+/i, // "show alert ..."
    /\b(details|information)\s+(for|about|on)\s+(alert|incident|asset)\s+/i, // "details for alert ..."
    
    // Named entities
    /\b(server|workstation|host)\s+([A-Za-z0-9.-]+)\b/i, // "server web01"
    /\b(user|account)\s+([A-Za-z0-9@.-]+)\b/i, // "user john.doe"
    /\b(domain|hostname)\s+([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i, // "domain example.com"
  ],
  
  // Structured Filter Patterns
  STRUCTURED_FILTER: [
    // Time-based filters
    /\b(last|past|recent|within)\s+(\d+)\s+(minute|hour|day|week|month)s?\b/i, // "last 24 hours"
    /\b(today|yesterday|this\s+week|last\s+week|this\s+month)\b/i, // "today", "last week"
    /\b(since|after|before|until)\s+\d{4}-\d{2}-\d{2}\b/, // "since 2024-01-01"
    /\b(from|between)\s+.+\s+(to|and)\s+/i, // "from Jan to Feb"
    
    // Severity/Priority filters
    /\b(critical|high|medium|low)\s+(severity|priority|alerts?|incidents?)\b/i, // "critical alerts"
    /\b(severity|priority)\s+(equals?|is|>=|<=|>|<)\s*\d+\b/i, // "severity >= 3"
    
    // Status filters
    /\b(new|investigating|resolved|false.positive)\s+(alerts?|incidents?)\b/i, // "new alerts"
    /\bstatus\s+(is|equals?|=)\s+(new|investigating|resolved)\b/i, // "status is new"
    
    // Source/Asset filters
    /\b(from|on|by)\s+(source|system|asset|server)\s+/i, // "from source system"
    /\bip\s+(address\s+)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/i, // "IP 192.168.1.1"
    /\b(subnet|network)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d+)\b/i, // "subnet 10.0.0.0/24"
    
    // Count/Statistics queries
    /\b(how\s+many|count|number\s+of)\b/i, // "how many alerts"
    /\b(total|sum|average|avg|min|max)\b/i, // "total incidents"
    /\btop\s+\d+\b/i, // "top 10"
  ],
  
  // Semantic Search Patterns
  SEMANTIC_SEARCH: [
    // Conceptual queries
    /\b(what|why|how|when|where|which|who)\b/i, // Question words
    /\b(explain|describe|tell\s+me\s+about|analyze)\b/i, // Explanation requests
    /\b(similar|related|like|comparable)\b/i, // Similarity queries
    /\b(pattern|trend|correlation|relationship)\b/i, // Pattern analysis
    /\b(malware|ransomware|phishing|trojan|virus|backdoor)\b/i, // Threat concepts
    /\b(attack|threat|vulnerability|exploit|breach)\b/i, // Security concepts
    /\b(recommendation|suggestion|advice|best\s+practice)\b/i, // Advisory queries
  ],

  // Interactive Workflow Patterns
  INTERACTIVE_WORKFLOW: [
    // Report generation
    /\b(generate|create|build|write)\s+(incident\s+)?report\b/i,
    /\b(incident|security)\s+(report|documentation|summary)\b/i,
    /\breport\s+(for|about|on)\s+(incident|attack|breach)\b/i,
    
    // Analysis requests
    /\b(analyze|investigate|examine)\s+(malware|virus|trojan|ransomware)\b/i,
    /\b(malware|ransomware|trojan)\s+(analysis|investigation|incident)\b/i,
    /\b(similar|related)\s+(malware|attack)\s+(incidents?|patterns?)\b/i,
    
    // Workflow initiation
    /\b(help\s+me|assist\s+with|guide\s+me)\s+(create|generate|analyze)\b/i,
    /\b(walk\s+me\s+through|step\s+by\s+step)\b/i,
    /\b(investigate|analyze)\s+(threat|attack|breach)\b/i,
  ],

  // Information Gathering Patterns
  INFORMATION_GATHERING: [
    // Question patterns
    /\b(what|which|how|where|when)\b.*\?/,
    /\b(tell\s+me\s+about|explain|describe)\s+\w+/i,
    /\b(more\s+information|details|specifics)\s+(about|on|for)\b/i,
    
    // Missing information indicators
    /\b(missing|need|require|lack)\s+\w+/i,
    /\b(don't\s+have|not\s+sure|unclear)\b/i,
    /\b(which\s+one|what\s+type|what\s+kind)\b/i,
    
    // Clarification requests
    /\b(can\s+you\s+clarify|please\s+explain|not\s+clear)\b/i,
    /\b(options|choices|alternatives)\b/i,
  ],

  // Confirmation Required Patterns  
  CONFIRMATION_REQUIRED: [
    // Action confirmation
    /\b(are\s+you\s+sure|confirm|proceed)\b/i,
    /\b(yes|no|cancel|abort)\b/i,
    /\b(looks\s+good|that's\s+correct|proceed)\b/i,
    
    // Selection confirmation
    /\b(option|choice)\s+\d+/i,
    /\b(select|choose|pick)\s+(this|that|option|number)\b/i,
    /\b(the\s+first|the\s+second|number\s+\d+)\b/i,
  ],
  
  // Hybrid patterns (complex queries)
  HYBRID: [
    // Multiple entities or complex conditions
    /\b(and|or|but|however|also|additionally)\b.*\b(alert|incident|asset|ioc)\b/i,
    /\b(compare|correlation|relationship)\b.*\b(between|with|among)\b/i, // "compare alerts between systems"
    /\b(trend|pattern).*\b(over\s+time|across|during)\b/i, // "trend analysis over time"
    /\b(impact|affected|related\s+to|caused\s+by)\b/i, // Impact analysis
  ]
};

/**
 * Field Extraction Patterns
 */
const FIELD_EXTRACTORS = {
  // Time extractors
  TIME_RANGES: [
    { pattern: /\b(\d+)\s+(minute|hour|day|week|month)s?\b/i, extractor: (match) => ({ value: parseInt(match[1]), unit: match[2].toLowerCase() }) },
    { pattern: /\b(today|yesterday)\b/i, extractor: (match) => ({ preset: match[1].toLowerCase() }) },
    { pattern: /\b(\d{4}-\d{2}-\d{2})\b/, extractor: (match) => ({ date: match[1] }) },
  ],
  
  // Severity extractors
  SEVERITY: [
    { pattern: /\b(critical|high|medium|low)\b/i, extractor: (match) => ({ level: match[1].toLowerCase() }) },
    { pattern: /\bseverity\s*[>=<]*\s*(\d+)\b/i, extractor: (match) => ({ value: parseInt(match[1]) }) },
  ],
  
  // Status extractors
  STATUS: [
    { pattern: /\b(new|investigating|resolved|false.positive|incident_likely|analysis_uncertain|review_required)\b/i, extractor: (match) => ({ status: match[1].toLowerCase().replace('.', '_') }) },
  ],
  
  // Network extractors
  NETWORK: [
    { pattern: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/, extractor: (match) => ({ ip: match[1] }) },
    { pattern: /\b([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/, extractor: (match) => ({ domain: match[1] }) },
  ],
  
  // ID extractors
  IDS: [
    { pattern: /\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/, extractor: (match) => ({ uuid: match[1] }) },
    { pattern: /\b([A-Z]{2,4}-\d{3,6})\b/, extractor: (match) => ({ recordId: match[1] }) },
  ]
};

class QueryClassificationService {
  constructor() {
    this.models = models;
  }

  /**
   * Main classification method - analyzes query and returns classification with metadata
   */
  async classifyQuery(query, context = {}) {
    try {
      console.log(`🧠 Classifying query: "${query}"`);
      
      const classification = {
        originalQuery: query,
        queryType: null,
        confidence: 0,
        extractedFields: {},
        suggestedTools: [],
        fallbackStrategy: [],
        metadata: {
          queryLength: query.length,
          hasQuestionWords: this.hasQuestionWords(query),
          hasSpecificEntities: this.hasSpecificEntities(query),
          complexity: this.assessComplexity(query)
        }
      };

      // Step 1: Pattern-based classification
      const patternScores = this.calculatePatternScores(query);
      
      // Step 2: Extract structured fields
      classification.extractedFields = this.extractFields(query);
      
      // Step 3: Determine primary query type
      const primaryType = this.determinePrimaryType(patternScores, classification.extractedFields);
      classification.queryType = primaryType.type;
      classification.confidence = primaryType.confidence;
      
      // Step 4: Generate tool suggestions
      classification.suggestedTools = this.suggestTools(classification);
      
      // Step 5: Create fallback strategy
      classification.fallbackStrategy = this.createFallbackStrategy(classification);
      
      console.log(`✅ Query classified as: ${classification.queryType} (${Math.round(classification.confidence * 100)}% confidence)`);
      
      return classification;
    } catch (error) {
      console.error('❌ Error classifying query:', error);
      
      // Return safe fallback classification
      return {
        originalQuery: query,
        queryType: QUERY_TYPES.SEMANTIC_SEARCH,
        confidence: 0.5,
        extractedFields: {},
        suggestedTools: ['smart_context_search'],
        fallbackStrategy: ['semantic_search', 'structured_filter'],
        error: error.message
      };
    }
  }

  /**
   * Calculate pattern scores for each query type
   */
  calculatePatternScores(query) {
    const scores = {
      [QUERY_TYPES.SPECIFIC_RECORD]: 0,
      [QUERY_TYPES.STRUCTURED_FILTER]: 0,
      [QUERY_TYPES.SEMANTIC_SEARCH]: 0,
      [QUERY_TYPES.HYBRID]: 0
    };

    // Check patterns for each category
    Object.entries(CLASSIFICATION_PATTERNS).forEach(([category, patterns]) => {
      const queryType = QUERY_TYPES[category];
      let categoryScore = 0;
      
      patterns.forEach(pattern => {
        const matches = query.match(pattern);
        if (matches) {
          categoryScore += 1;
          // Boost score for exact UUID matches
          if (category === 'SPECIFIC_RECORD' && pattern.source.includes('UUID')) {
            categoryScore += 2;
          }
        }
      });
      
      scores[queryType] = categoryScore;
    });

    return scores;
  }

  /**
   * Extract structured fields from query
   */
  extractFields(query) {
    const extractedFields = {};

    Object.entries(FIELD_EXTRACTORS).forEach(([fieldType, extractors]) => {
      extractors.forEach(({ pattern, extractor }) => {
        const match = query.match(pattern);
        if (match) {
          const extracted = extractor(match);
          extractedFields[fieldType.toLowerCase()] = extractedFields[fieldType.toLowerCase()] || [];
          extractedFields[fieldType.toLowerCase()].push(extracted);
        }
      });
    });

    return extractedFields;
  }

  /**
   * Determine primary query type based on scores and extracted fields
   */
  determinePrimaryType(patternScores, extractedFields) {
    // Calculate weighted scores
    let maxScore = 0;
    let primaryType = QUERY_TYPES.SEMANTIC_SEARCH; // Default fallback

    // Specific record gets highest priority if UUIDs or specific IDs found
    if (extractedFields.ids && extractedFields.ids.length > 0) {
      return { type: QUERY_TYPES.SPECIFIC_RECORD, confidence: 0.95 };
    }

    // Calculate scores with weights
    const weightedScores = {
      [QUERY_TYPES.SPECIFIC_RECORD]: patternScores[QUERY_TYPES.SPECIFIC_RECORD] * 1.5,
      [QUERY_TYPES.STRUCTURED_FILTER]: patternScores[QUERY_TYPES.STRUCTURED_FILTER] * 1.3,
      [QUERY_TYPES.SEMANTIC_SEARCH]: patternScores[QUERY_TYPES.SEMANTIC_SEARCH] * 1.0,
      [QUERY_TYPES.HYBRID]: patternScores[QUERY_TYPES.HYBRID] * 1.2
    };

    // Boost structured filter if time/severity/status fields found
    if (extractedFields.time_ranges || extractedFields.severity || extractedFields.status) {
      weightedScores[QUERY_TYPES.STRUCTURED_FILTER] += 2;
    }

    // Find max score
    Object.entries(weightedScores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score;
        primaryType = type;
      }
    });

    // Calculate confidence based on score and field extraction
    const confidence = this.calculateConfidence(maxScore, patternScores, extractedFields);

    return { type: primaryType, confidence };
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(maxScore, patternScores, extractedFields) {
    let confidence = Math.min(maxScore / 5, 0.8); // Base confidence from pattern matches
    
    // Boost confidence based on extracted fields
    const fieldCount = Object.keys(extractedFields).length;
    confidence += fieldCount * 0.05;
    
    // Boost for high-confidence patterns
    if (extractedFields.ids && extractedFields.ids.length > 0) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Suggest appropriate tools based on classification
   */
  suggestTools(classification) {
    const { queryType, extractedFields } = classification;
    const tools = [];

    switch (queryType) {
      case QUERY_TYPES.SPECIFIC_RECORD:
        if (extractedFields.ids) {
          tools.push('get_specific_alert_by_id', 'get_specific_incident_by_id');
        }
        tools.push('find_related_security_data');
        break;

      case QUERY_TYPES.STRUCTURED_FILTER:
        tools.push('get_alerts_by_criteria', 'get_incidents_by_criteria');
        if (extractedFields.network) {
          tools.push('search_assets_by_attributes');
        }
        break;

      case QUERY_TYPES.SEMANTIC_SEARCH:
        tools.push('smart_context_search', 'intelligent_knowledge_extraction');
        if (classification.metadata.hasSpecificEntities) {
          tools.push('contextual_threat_analysis');
        }
        break;

      case QUERY_TYPES.HYBRID:
        tools.push('smart_context_search', 'find_related_security_data', 'get_alerts_by_criteria');
        break;
    }

    return tools;
  }

  /**
   * Create fallback strategy if primary approach fails
   */
  createFallbackStrategy(classification) {
    const { queryType } = classification;
    const fallbacks = [];

    switch (queryType) {
      case QUERY_TYPES.SPECIFIC_RECORD:
        fallbacks.push('structured_filter', 'semantic_search');
        break;

      case QUERY_TYPES.STRUCTURED_FILTER:
        fallbacks.push('semantic_search', 'specific_record');
        break;

      case QUERY_TYPES.SEMANTIC_SEARCH:
        fallbacks.push('structured_filter', 'hybrid');
        break;

      case QUERY_TYPES.HYBRID:
        fallbacks.push('structured_filter', 'semantic_search');
        break;
    }

    return fallbacks;
  }

  /**
   * Helper methods
   */
  hasQuestionWords(query) {
    const questionWords = /\b(what|why|how|when|where|which|who)\b/i;
    return questionWords.test(query);
  }

  hasSpecificEntities(query) {
    const entityPatterns = [
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
      /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Domains
      /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/, // UUIDs
      /\b[A-Z]{2,4}-\d{3,6}\b/ // Alert/Incident IDs
    ];
    
    return entityPatterns.some(pattern => pattern.test(query));
  }

  assessComplexity(query) {
    const words = query.split(/\s+/).length;
    const hasConjunctions = /\b(and|or|but|however|also)\b/i.test(query);
    const hasMultipleClauses = (query.match(/[,;]/g) || []).length;
    
    if (words <= 5 && !hasConjunctions) return 'simple';
    if (words <= 15 && hasConjunctions) return 'medium';
    if (hasMultipleClauses || words > 15) return 'complex';
    
    return 'medium';
  }

  /**
   * Validate classification against actual database content
   */
  async validateClassification(classification) {
    const { queryType, extractedFields } = classification;
    const validationResults = {
      isValid: true,
      suggestions: [],
      potentialRecords: 0
    };

    try {
      // For specific record queries, check if records exist
      if (queryType === QUERY_TYPES.SPECIFIC_RECORD && extractedFields.ids) {
        for (const idGroup of extractedFields.ids) {
          if (idGroup.uuid) {
            // Check if UUID exists in any table
            const foundInAlerts = await this.models.Alert.count({ where: { id: idGroup.uuid } });
            const foundInIncidents = await this.models.Incident.count({ where: { id: idGroup.uuid } });
            validationResults.potentialRecords += foundInAlerts + foundInIncidents;
          }
        }

        if (validationResults.potentialRecords === 0) {
          validationResults.suggestions.push('No exact records found - consider semantic search');
        }
      }

      // For structured filters, estimate result count
      if (queryType === QUERY_TYPES.STRUCTURED_FILTER) {
        const sampleCount = await this.estimateResultCount(extractedFields);
        validationResults.potentialRecords = sampleCount;
        
        if (sampleCount === 0) {
          validationResults.suggestions.push('No records match filters - try broader criteria');
        } else if (sampleCount > 1000) {
          validationResults.suggestions.push('Very large result set - consider narrowing filters');
        }
      }

    } catch (error) {
      console.error('Error validating classification:', error);
      validationResults.isValid = false;
    }

    return validationResults;
  }

  /**
   * Estimate result count for structured queries
   */
  async estimateResultCount(extractedFields) {
    try {
      const whereClause = {};

      // Add time filters
      if (extractedFields.time_ranges) {
        const timeFilter = extractedFields.time_ranges[0];
        if (timeFilter.value && timeFilter.unit) {
          const hoursBack = this.convertToHours(timeFilter.value, timeFilter.unit);
          const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
          whereClause.eventTime = { [Op.gte]: cutoffTime };
        }
      }

      // Add severity filters
      if (extractedFields.severity) {
        const severityFilter = extractedFields.severity[0];
        if (severityFilter.value) {
          whereClause.severity = severityFilter.value;
        }
      }

      // Count alerts matching criteria
      const count = await this.models.Alert.count({ where: whereClause });
      return count;

    } catch (error) {
      console.error('Error estimating result count:', error);
      return -1;
    }
  }

  convertToHours(value, unit) {
    const multipliers = {
      'minute': 1/60,
      'hour': 1,
      'day': 24,
      'week': 24 * 7,
      'month': 24 * 30
    };
    return value * (multipliers[unit] || 1);
  }
}

module.exports = {
  QueryClassificationService,
  QUERY_TYPES,
  CLASSIFICATION_PATTERNS
};