/**
 * Alert MITRE ATT&CK Multi-Domain Analyzer
 * Combines domain classification with comprehensive TTP mapping across Enterprise, Mobile, and ICS domains
 */

const { DomainClassifier } = require('./domainClassifier');
const stixDataLoader = require('../utils/stixDataLoader');
const aiGenerationService = require('../../services/aiGenerationService');

class AlertMitreAnalyzer {
  constructor() {
    this.domainClassifier = new DomainClassifier();
    this.stixLoader = stixDataLoader;
  }

  /**
   * Perform comprehensive MITRE analysis for an alert
   * Step 1: Classify relevant domains
   * Step 2: Search all relevant domains for TTPs
   * Step 3: AI-powered enrichment and contextualization
   * @param {Object} alertData - Complete alert information
   * @param {Object} options - Analysis options
   * @returns {Object} Comprehensive MITRE analysis results
   */
  async analyzeAlert(alertData, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Starting multi-domain MITRE analysis for alert ${alertData.id}`);

      // Step 1: Domain Classification
      console.log('📊 Step 1: Classifying MITRE domains...');
      const domainClassification = await this.classifyAlertDomains(alertData);
      
      if (!domainClassification.success) {
        throw new Error(`Domain classification failed: ${domainClassification.error}`);
      }

      // Step 2: Multi-Domain TTP Mapping
      console.log('🔍 Step 2: Mapping TTPs across domains...');
      const ttpMapping = await this.mapTtpsMultiDomain(alertData, domainClassification);

      // Step 3: AI Enrichment
      console.log('🤖 Step 3: AI-powered enrichment...');
      console.log(`🔧 AI Enrichment Options:`, JSON.stringify(options, null, 2));
      console.log(`📊 Domain Classification Results:`, {
        success: domainClassification.success,
        domains: domainClassification.classified_domains,
        primaryDomain: domainClassification.classified_domains?.[0]
      });
      console.log(`🎯 TTP Mapping Results:`, {
        success: ttpMapping.success,
        totalTechniques: ttpMapping.total_techniques,
        highConfidenceTechniques: ttpMapping.techniques?.filter(t => t.confidence_score > 0.7).length || 0
      });
      
      const enrichedAnalysis = await this.enrichWithAI(alertData, domainClassification, ttpMapping, options);
      
      console.log(`✅ AI Enrichment Results:`, {
        success: enrichedAnalysis.success,
        hasAiAnalysis: !!enrichedAnalysis.ai_analysis,
        hasAnalystGuidance: !!enrichedAnalysis.analyst_guidance,
        guidanceType: Array.isArray(enrichedAnalysis.analyst_guidance) ? 'array' : typeof enrichedAnalysis.analyst_guidance,
        error: enrichedAnalysis.error || null
      });

      // Compile final results
      const analysisResult = {
        success: true,
        alert_id: alertData.id,
        analysis_timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        
        // Step 1 Results
        domain_classification: domainClassification,
        
        // Step 2 Results  
        ttp_mapping: ttpMapping,
        
        // Step 3 Results
        enriched_analysis: enrichedAnalysis,
        
        // Summary
        summary: {
          classified_domains: domainClassification.classified_domains,
          total_techniques_mapped: ttpMapping.total_techniques,
          high_confidence_techniques: ttpMapping.techniques.filter(t => t.confidence_score > 0.7).length,
          kill_chain_coverage: this.analyzeKillChainCoverage(ttpMapping.techniques),
          ai_enhancement_applied: enrichedAnalysis.success
        }
      };

      console.log(`✅ Multi-domain MITRE analysis complete: ${ttpMapping.total_techniques} techniques mapped`);
      return analysisResult;

    } catch (error) {
      console.error('❌ Error in multi-domain MITRE analysis:', error);
      return {
        success: false,
        error: error.message,
        alert_id: alertData.id,
        processing_time_ms: Date.now() - startTime,
        analysis_timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Classify alert to determine relevant MITRE domains
   * @param {Object} alertData - Alert information
   * @returns {Object} Domain classification results
   */
  async classifyAlertDomains(alertData) {
    try {
      return await this.domainClassifier.classifyAlertDomains({
        rawData: alertData.rawData || {},
        description: alertData.description || '',
        sourceSystem: alertData.sourceSystem || '',
        assetName: alertData.assetName || '',
        securityEventType: alertData.securityEventType || ''
      });
    } catch (error) {
      console.error('❌ Domain classification error:', error);
      return {
        success: false,
        error: error.message,
        classified_domains: ['enterprise'] // Fallback
      };
    }
  }

  /**
   * Map TTPs across multiple domains
   * @param {Object} alertData - Alert information  
   * @param {Object} domainClassification - Domain classification results
   * @returns {Object} Multi-domain TTP mapping results
   */
  async mapTtpsMultiDomain(alertData, domainClassification) {
    try {
      const domains = domainClassification.classified_domains || ['enterprise'];
      
      // Extract search terms from alert
      const searchQuery = this.buildSearchQuery(alertData);
      
      console.log(`🔍 Searching for TTPs using query: "${searchQuery}"`);
      console.log(`🎯 Target domains: ${domains.join(', ')}`);
      
      // Validate search query is not empty
      if (!searchQuery || searchQuery.trim().length === 0) {
        console.log('❌ Search query is empty - cannot search for techniques');
        return {
          success: false,
          error: 'Empty search query generated from alert data',
          search_query: searchQuery,
          domains_searched: domains,
          techniques: []
        };
      }

      // Search across all relevant domains
      const searchResults = this.stixLoader.searchMultipleDomains(
        searchQuery,
        domains,
        {
          excludeRevoked: true,
          include_sub_techniques: true
        }
      );
      
      console.log(`📊 Raw search results: ${searchResults.techniques?.length || 0} techniques found`);
      console.log(`🔍 Search metadata:`, JSON.stringify(searchResults.search_metadata || {}, null, 2));

      // Score and rank techniques based on relevance
      const scoredTechniques = this.scoreTechniqueRelevance(
        searchResults.techniques,
        alertData,
        domainClassification
      );
      
      console.log(`🎯 After scoring: ${scoredTechniques.length} techniques remain`);
      if (scoredTechniques.length > 0) {
        console.log(`📈 Top 5 scored techniques:`);
        scoredTechniques.slice(0, 5).forEach((tech, idx) => {
          console.log(`   ${idx + 1}. ${tech.id}: ${tech.name} (score: ${tech.confidence_score.toFixed(3)})`);
        });
      }

      // Limit to top techniques but ensure we have good coverage
      const topTechniques = scoredTechniques.slice(0, 20);

      return {
        success: true,
        search_query: searchQuery,
        domains_searched: domains,
        total_techniques: topTechniques.length,
        techniques: topTechniques,
        domain_breakdown: searchResults.domain_breakdown,
        search_metadata: searchResults.search_metadata
      };

    } catch (error) {
      console.error('❌ TTP mapping error:', error);
      return {
        success: false,
        error: error.message,
        techniques: []
      };
    }
  }

  /**
   * Build optimized search query from alert data
   * @param {Object} alertData - Alert information
   * @returns {string} Optimized search query
   */
  buildSearchQuery(alertData) {
    console.log('🔍 Building search query from alert data...');
    console.log(`📋 Alert ID: ${alertData.id}`);
    console.log(`📝 Alert Title: "${alertData.title || 'NO TITLE'}"`);
    console.log(`📄 Description Length: ${alertData.description?.length || 0} characters`);
    console.log(`🏢 Source System: "${alertData.sourceSystem || 'NO SOURCE'}"`);
    console.log(`🏷️ Security Event Type: "${alertData.securityEventType || 'NO TYPE'}"`);
    
    const searchTerms = [];

    // Add title keywords first (often more focused than description)
    if (alertData.title && alertData.title.trim().length > 0) {
      const titleKeywords = alertData.title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 2 && 
          !['alert', 'detected', 'found', 'system', 'event', 'security', 'the', 'and', 'for', 'with'].includes(word)
        );
      console.log(`🎯 Title keywords: [${titleKeywords.join(', ')}]`);
      searchTerms.push(...titleKeywords.slice(0, 3)); // Top 3 from title
    }

    // Add description keywords
    if (alertData.description && alertData.description.trim().length > 0) {
      // Extract meaningful keywords (filter out common words)
      const keywords = alertData.description
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !['alert', 'detected', 'found', 'system', 'event', 'security', 'that', 'this', 'with', 'from', 'have', 'been', 'will'].includes(word)
        );
      console.log(`📝 Description keywords: [${keywords.slice(0, 8).join(', ')}]`);
      searchTerms.push(...keywords.slice(0, 5)); // Top 5 keywords
    }

    // Add source system context
    if (alertData.sourceSystem && alertData.sourceSystem.trim().length > 0) {
      const sourceSystem = alertData.sourceSystem.toLowerCase().trim();
      searchTerms.push(sourceSystem);
      console.log(`🏢 Added source system: "${sourceSystem}"`);
    }

    // Add security event type
    if (alertData.securityEventType && alertData.securityEventType !== 'pending' && alertData.securityEventType.trim().length > 0) {
      const eventType = alertData.securityEventType.toLowerCase().trim();
      searchTerms.push(eventType);
      console.log(`🏷️ Added event type: "${eventType}"`);
    }

    // Extract indicators from raw data
    if (alertData.rawData) {
      const rawText = JSON.stringify(alertData.rawData).toLowerCase();
      console.log(`🔍 Raw data size: ${rawText.length} characters`);
      
      // Look for file extensions
      const fileExtensions = rawText.match(/\.(exe|dll|bat|ps1|sh|py|js)\b/g);
      if (fileExtensions) {
        const uniqueExtensions = [...new Set(fileExtensions)];
        searchTerms.push(...uniqueExtensions.slice(0, 3));
        console.log(`📁 File extensions found: [${uniqueExtensions.slice(0, 3).join(', ')}]`);
      }

      // Look for process names
      const processNames = rawText.match(/\b(cmd|powershell|bash|python|node|explorer|chrome|firefox)\b/g);
      if (processNames) {
        const uniqueProcesses = [...new Set(processNames)];
        searchTerms.push(...uniqueProcesses.slice(0, 3));
        console.log(`⚙️ Process names found: [${uniqueProcesses.slice(0, 3).join(', ')}]`);
      }
    }

    // Create optimized query
    const uniqueTerms = [...new Set(searchTerms)];
    const finalQuery = uniqueTerms.slice(0, 8).join(' '); // Limit to avoid too broad searches
    
    console.log(`🔍 Search Query Generation Results:`);
    console.log(`   - Raw terms collected: ${searchTerms.length}`);
    console.log(`   - Unique terms: ${uniqueTerms.length}`);
    console.log(`   - Final terms: [${uniqueTerms.slice(0, 8).join(', ')}]`);
    console.log(`   - Final query: "${finalQuery}"`);
    
    return finalQuery;
  }

  /**
   * Score technique relevance to alert
   * @param {Array} techniques - MITRE techniques
   * @param {Object} alertData - Alert information
   * @param {Object} domainClassification - Domain classification results
   * @returns {Array} Scored and sorted techniques
   */
  scoreTechniqueRelevance(techniques, alertData, domainClassification) {
    return techniques.map(technique => {
      let score = 0.5; // Base score

      // Domain relevance bonus
      const domainScore = domainClassification.domain_scores[technique.source_domain] || 0;
      score += domainScore * 0.3;

      // Multi-domain techniques get bonus
      if (technique.additional_domains && technique.additional_domains.length > 0) {
        score += 0.2;
      }

      // Platform matching
      if (alertData.assetName || alertData.rawData) {
        const assetText = (alertData.assetName + ' ' + JSON.stringify(alertData.rawData)).toLowerCase();
        const platformMatches = technique.platforms.filter(platform => 
          assetText.includes(platform.toLowerCase())
        );
        score += platformMatches.length * 0.15;
      }

      // Data source availability (if we can detect)
      if (technique.data_sources && technique.data_sources.length > 0) {
        score += 0.1;
      }

      // Sub-technique penalty (prefer parent techniques for overview)
      if (technique.is_sub_technique) {
        score -= 0.1;
      }

      return {
        ...technique,
        confidence_score: Math.min(score, 1.0),
        relevance_factors: {
          domain_score: domainScore,
          multi_domain: technique.additional_domains?.length || 0,
          platform_matches: technique.platforms.length,
          has_detection: technique.detection !== 'No detection guidance available'
        }
      };
    }).sort((a, b) => b.confidence_score - a.confidence_score);
  }

  /**
   * Analyze kill chain coverage
   * @param {Array} techniques - Mapped techniques
   * @returns {Object} Kill chain analysis
   */
  analyzeKillChainCoverage(techniques) {
    const tacticCoverage = {};
    const allTactics = [
      'reconnaissance', 'resource-development', 'initial-access', 'execution',
      'persistence', 'privilege-escalation', 'defense-evasion', 'credential-access',
      'discovery', 'lateral-movement', 'collection', 'command-and-control',
      'exfiltration', 'impact'
    ];

    techniques.forEach(technique => {
      technique.tactics.forEach(tactic => {
        if (!tacticCoverage[tactic]) {
          tacticCoverage[tactic] = [];
        }
        tacticCoverage[tactic].push(technique.id);
      });
    });

    const coveredTactics = Object.keys(tacticCoverage);
    const missingTactics = allTactics.filter(tactic => !coveredTactics.includes(tactic));

    return {
      covered_tactics: coveredTactics,
      missing_tactics: missingTactics,
      coverage_percentage: Math.round((coveredTactics.length / allTactics.length) * 100),
      tactic_breakdown: tacticCoverage
    };
  }

  /**
   * AI-powered enrichment of MITRE analysis
   * @param {Object} alertData - Alert information
   * @param {Object} domainClassification - Domain classification
   * @param {Object} ttpMapping - TTP mapping results
   * @param {Object} options - Analysis options
   * @returns {Object} AI enrichment results
   */
  async enrichWithAI(alertData, domainClassification, ttpMapping, options = {}) {
    const enrichmentStartTime = Date.now();
    console.log('🤖 ======= STARTING AI ENRICHMENT =======');
    console.log(`🎯 Alert ID: ${alertData.id}`);
    console.log(`📊 Organization ID: ${alertData.organizationId || 1}`);
    console.log(`🔧 Options:`, JSON.stringify(options, null, 2));

    try {
      // Validate input data
      console.log('🔍 Validating TTP mapping data...');
      console.log(`📈 TTP Mapping Success: ${ttpMapping.success}`);
      console.log(`🎯 Total Techniques Found: ${ttpMapping.techniques ? ttpMapping.techniques.length : 0}`);
      
      if (!ttpMapping.success || ttpMapping.techniques.length === 0) {
        console.log('❌ No techniques available for AI enrichment - investigating root cause...');
        
        // Enhanced debugging to identify why technique mapping failed
        console.log('🔍 TTP Mapping Debug Info:');
        console.log(`  - TTP Success: ${ttpMapping.success}`);
        console.log(`  - Search Query: "${ttpMapping.search_query || 'NOT GENERATED'}"`);
        console.log(`  - Domains Searched: ${JSON.stringify(ttpMapping.domains_searched || [])}`);
        console.log(`  - Raw Techniques Found: ${ttpMapping.total_techniques || 0}`);
        console.log(`  - Domain Breakdown: ${JSON.stringify(ttpMapping.domain_breakdown || {})}`);
        console.log(`  - Search Metadata: ${JSON.stringify(ttpMapping.search_metadata || {})}`);
        
        console.log('🔍 Domain Classification Debug Info:');
        console.log(`  - Classification Success: ${domainClassification.success}`);
        console.log(`  - Classified Domains: ${JSON.stringify(domainClassification.classified_domains || [])}`);
        console.log(`  - Primary Domain: ${domainClassification.classified_domains?.[0] || 'NONE'}`);
        
        console.log('🔍 Alert Data Debug Info:');
        console.log(`  - Alert Title: "${alertData.title || 'NO TITLE'}"`);
        console.log(`  - Alert Description Length: ${alertData.description?.length || 0} chars`);
        console.log(`  - Source System: "${alertData.sourceSystem || 'NO SOURCE'}"`);
        console.log(`  - Security Event Type: "${alertData.securityEventType || 'NO TYPE'}"`);
        
        return {
          success: false,
          error: 'No MITRE techniques mapped - technique search failed',
          analyst_guidance: 'MITRE technique mapping failed. Check STIX data availability and search query generation.',
          debug_info: {
            ttp_mapping_failed: !ttpMapping.success,
            zero_techniques: ttpMapping.techniques?.length === 0,
            search_query: ttpMapping.search_query,
            domains_searched: ttpMapping.domains_searched,
            classification_domains: domainClassification.classified_domains
          }
        };
      }

      const topTechniques = ttpMapping.techniques.slice(0, 10);
      console.log(`🔝 Using top ${topTechniques.length} techniques for enrichment:`);
      topTechniques.forEach((tech, idx) => {
        console.log(`   ${idx + 1}. ${tech.id}: ${tech.name} (confidence: ${tech.confidence_score.toFixed(2)})`);
      });

      console.log('🏗️ Building AI enrichment prompt...');
      const prompt = this.buildAIEnrichmentPrompt(
        alertData,
        domainClassification,
        topTechniques
      );
      console.log(`📝 Prompt length: ${prompt.length} characters`);
      console.log(`📄 Prompt preview: "${prompt.substring(0, 200)}..."`);

      console.log('🤖 Calling AI generation service...');
      const aiCallParams = {
        prompt,
        organizationId: alertData.organizationId || 1,
        userId: null,
        contextType: 'alert_mitre_analysis',
        contextId: alertData.id,
        model: null,
        maxTokens: 2000,
        temperature: 0.3
      };
      console.log('📋 AI Service Parameters:', {
        promptLength: aiCallParams.prompt.length,
        organizationId: aiCallParams.organizationId,
        contextType: aiCallParams.contextType,
        contextId: aiCallParams.contextId,
        maxTokens: aiCallParams.maxTokens,
        temperature: aiCallParams.temperature
      });

      const aiResponse = await aiGenerationService.generateTestResponse(aiCallParams);
      
      console.log('📥 Raw AI Response Structure:', {
        hasResponse: !!aiResponse,
        responseKeys: aiResponse ? Object.keys(aiResponse) : [],
        hasResponseField: !!(aiResponse?.response),
        hasContentField: !!(aiResponse?.content),
        responseType: typeof aiResponse?.response,
        contentType: typeof aiResponse?.content,
        hasModel: !!(aiResponse?.model),
        hasUsage: !!(aiResponse?.usage)
      });

      // Extract response content (same pattern as working Alert AI)
      const aiResponseContent = aiResponse.response || aiResponse.content;
      
      console.log('🎯 AI Response Content Analysis:', {
        hasContent: !!aiResponseContent,
        contentType: typeof aiResponseContent,
        contentLength: aiResponseContent ? aiResponseContent.length : 0,
        contentPreview: aiResponseContent ? aiResponseContent.substring(0, 300) + '...' : 'NO CONTENT'
      });
      
      if (aiResponseContent) {
        console.log('✅ AI enrichment successful! Extracting analyst guidance...');
        
        const analystGuidance = this.extractAnalystGuidance(aiResponseContent);
        console.log('📋 Extracted Analyst Guidance:', {
          guidanceType: Array.isArray(analystGuidance) ? 'array' : typeof analystGuidance,
          guidanceCount: Array.isArray(analystGuidance) ? analystGuidance.length : 1,
          guidancePreview: Array.isArray(analystGuidance) ? 
            analystGuidance.slice(0, 3).map((g, i) => `${i + 1}. ${g}`) : 
            [analystGuidance]
        });

        const processingTime = Date.now() - enrichmentStartTime;
        console.log(`⏱️ AI Enrichment completed in ${processingTime}ms`);
        
        const enrichmentResult = {
          success: true,
          ai_analysis: aiResponseContent,
          analyst_guidance: analystGuidance,
          processing_time_ms: aiResponse.usage?.totalTokens || processingTime,
          ai_model: aiResponse.model
        };

        console.log('🎉 AI Enrichment Result Summary:', {
          success: enrichmentResult.success,
          hasAiAnalysis: !!enrichmentResult.ai_analysis,
          aiAnalysisLength: enrichmentResult.ai_analysis ? enrichmentResult.ai_analysis.length : 0,
          guidanceCount: Array.isArray(enrichmentResult.analyst_guidance) ? enrichmentResult.analyst_guidance.length : 1,
          processingTimeMs: enrichmentResult.processing_time_ms,
          aiModel: enrichmentResult.ai_model
        });
        console.log('🤖 ======= AI ENRICHMENT COMPLETED SUCCESSFULLY =======');

        return enrichmentResult;
      } else {
        console.log('❌ AI enrichment failed - no response content received');
        console.log('🔍 AI Response Debug Info:', {
          fullResponse: aiResponse,
          responseKeys: aiResponse ? Object.keys(aiResponse) : 'NO RESPONSE OBJECT'
        });
        
        return {
          success: false,
          error: 'AI enrichment failed - no response content',
          analyst_guidance: 'Manual analysis recommended for mapped MITRE techniques.'
        };
      }

    } catch (error) {
      const processingTime = Date.now() - enrichmentStartTime;
      console.error('❌ ======= AI ENRICHMENT FAILED =======');
      console.error(`🚨 Error Type: ${error.constructor.name}`);
      console.error(`💥 Error Message: ${error.message}`);
      console.error(`📍 Error Stack: ${error.stack}`);
      console.error(`⏱️ Failed after ${processingTime}ms`);
      console.error('🔧 Alert Context:', {
        alertId: alertData.id,
        organizationId: alertData.organizationId,
        techniqueCount: ttpMapping.techniques ? ttpMapping.techniques.length : 0
      });
      console.error('🤖 ======= AI ENRICHMENT ERROR END =======');
      
      return {
        success: false,
        error: error.message,
        analyst_guidance: 'AI enrichment unavailable. Review mapped techniques manually.'
      };
    }
  }

  /**
   * Build AI enrichment prompt
   * @param {Object} alertData - Alert data
   * @param {Object} domainClassification - Domain classification
   * @param {Array} techniques - Top techniques
   * @returns {string} AI prompt
   */
  buildAIEnrichmentPrompt(alertData, domainClassification, techniques) {
    const techniqueList = techniques.map(t => 
      `- ${t.id}: ${t.name} (${t.source_domain} domain, confidence: ${t.confidence_score.toFixed(2)})`
    ).join('\n');

    return `# MITRE ATT&CK Alert Analysis

## Alert Information
- **Alert ID**: ${alertData.id}
- **Title**: ${alertData.title}
- **Description**: ${alertData.description}
- **Source System**: ${alertData.sourceSystem}
- **Asset**: ${alertData.assetName || 'Unknown'}
- **Severity**: ${alertData.severity}

## Domain Classification
Relevant MITRE domains: ${domainClassification.classified_domains.join(', ')}

## Mapped MITRE Techniques
${techniqueList}

## Analysis Request
As a cybersecurity expert, provide a comprehensive analysis focusing on:

1. **Attack Pattern Assessment**: Analyze the mapped techniques to identify the likely attack pattern or campaign type
2. **Threat Context**: Explain what these techniques suggest about the attacker's objectives and capabilities  
3. **Detection Priorities**: Recommend which of these techniques should be prioritized for detection and monitoring
4. **Analyst Actions**: Provide specific, actionable steps for IT security analysts and threat hunters
5. **Environment Context**: Consider the multi-domain nature (Enterprise/Mobile/ICS) and provide domain-specific guidance

Provide practical, actionable recommendations that security analysts can immediately implement.`;
  }

  /**
   * Extract analyst guidance from AI response
   * @param {string} aiContent - AI response content
   * @returns {Array} Structured analyst guidance
   */
  extractAnalystGuidance(aiContent) {
    console.log('🔍 ======= EXTRACTING ANALYST GUIDANCE =======');
    console.log(`📄 AI Content Length: ${aiContent.length} characters`);
    console.log(`📋 AI Content Preview: "${aiContent.substring(0, 500)}..."`);
    
    const guidance = [];
    
    // Simple extraction - in production could use more sophisticated parsing
    const lines = aiContent.split('\n');
    console.log(`📊 Total Lines to Process: ${lines.length}`);
    
    let inGuidanceSection = false;
    let sectionStartLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.toLowerCase().includes('analyst actions') || 
          line.toLowerCase().includes('recommendations')) {
        inGuidanceSection = true;
        sectionStartLine = i;
        console.log(`✅ Found guidance section at line ${i + 1}: "${line.trim()}"`);
        continue;
      }
      
      if (inGuidanceSection && line.trim().startsWith('-')) {
        const guidanceItem = line.trim().substring(1).trim();
        guidance.push(guidanceItem);
        console.log(`📝 Extracted guidance ${guidance.length}: "${guidanceItem}"`);
      }
    }

    console.log(`🎯 Guidance Extraction Results:`);
    console.log(`   - Section Found: ${inGuidanceSection}`);
    console.log(`   - Section Start Line: ${sectionStartLine + 1}`);
    console.log(`   - Items Extracted: ${guidance.length}`);

    // Fallback guidance if extraction fails
    if (guidance.length === 0) {
      console.log('⚠️ No guidance extracted from AI response, using fallback guidance');
      guidance.push(
        'Review the mapped MITRE techniques for detection opportunities',
        'Correlate with existing security logs and data sources',
        'Consider threat hunting activities based on identified TTPs',
        'Update detection rules to cover high-confidence techniques'
      );
      console.log(`🔄 Fallback guidance applied: ${guidance.length} items`);
    }

    console.log('🔍 ======= GUIDANCE EXTRACTION COMPLETED =======');
    return guidance;
  }
}

module.exports = {
  AlertMitreAnalyzer
};