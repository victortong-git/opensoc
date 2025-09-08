/**
 * MITRE ATT&CK Domain Classifier
 * Analyzes alert data to determine relevant MITRE domains (Enterprise, Mobile, ICS)
 */

class DomainClassifier {
  constructor() {
    // Domain-specific indicators and keywords
    this.domainIndicators = {
      enterprise: {
        keywords: [
          'windows', 'linux', 'macos', 'process', 'registry', 'powershell',
          'cmd', 'exe', 'dll', 'network', 'smb', 'rdp', 'ssh', 'wmi',
          'active directory', 'domain controller', 'workstation', 'server',
          'file system', 'startup', 'service', 'task scheduler', 'event log',
          'credential', 'token', 'certificate', 'browser', 'email'
        ],
        platforms: [
          'windows', 'linux', 'macos', 'azure ad', 'office 365', 
          'google workspace', 'saas', 'iaas', 'containers'
        ],
        sources: [
          'endpoint', 'sysmon', 'windows event log', 'antivirus',
          'edr', 'network monitoring', 'proxy', 'firewall', 'dns'
        ],
        weight: 1.0
      },
      mobile: {
        keywords: [
          'android', 'ios', 'mobile', 'app', 'application', 'sms', 'mms',
          'gps', 'location', 'bluetooth', 'wifi', 'cellular', 'device',
          'smartphone', 'tablet', 'apk', 'ipa', 'jailbreak', 'root',
          'mdm', 'byod', 'mobile device', 'push notification'
        ],
        platforms: [
          'android', 'ios', 'mobile'
        ],
        sources: [
          'mdm', 'mobile security', 'app store', 'mobile threat defense',
          'mobile device management', 'emm'
        ],
        weight: 0.8
      },
      ics: {
        keywords: [
          'scada', 'plc', 'hmi', 'modbus', 'dnp3', 'industrial', 'ot',
          'operational technology', 'control system', 'dcs', 'historian',
          'engineering workstation', 'safety system', 'process control',
          'automation', 'manufacturing', 'utilities', 'energy', 'water',
          'oil', 'gas', 'chemical', 'critical infrastructure'
        ],
        platforms: [
          'windows', 'embedded', 'real-time os', 'industrial control'
        ],
        sources: [
          'ot monitoring', 'industrial security', 'network monitoring',
          'protocol analyzer', 'asset discovery'
        ],
        weight: 0.9
      }
    };

    // Environment context indicators
    this.environmentContext = {
      enterprise: ['corporate', 'office', 'business', 'enterprise', 'it'],
      mobile: ['byod', 'remote work', 'mobile workforce', 'personal device'],
      ics: ['factory', 'plant', 'facility', 'industrial', 'manufacturing', 'utility']
    };
  }

  /**
   * Classify alert data to determine relevant MITRE domains
   * @param {Object} alertData - Alert information to analyze
   * @returns {Object} Domain classification results with confidence scores
   */
  async classifyAlertDomains(alertData) {
    try {
      const {
        rawData = {},
        description = '',
        sourceSystem = '',
        assetName = '',
        assetContext = '',
        securityEventType = ''
      } = alertData;

      console.log('🎯 Classifying MITRE domains for alert');

      // Combine all text content for analysis
      const textContent = [
        description,
        sourceSystem,
        assetName,
        assetContext,
        securityEventType,
        JSON.stringify(rawData).toLowerCase()
      ].join(' ').toLowerCase();

      const domainScores = {};
      const domainDetails = {};

      // Analyze each domain
      for (const [domain, indicators] of Object.entries(this.domainIndicators)) {
        const analysis = this.analyzeDomainRelevance(textContent, domain, indicators);
        domainScores[domain] = analysis.score;
        domainDetails[domain] = analysis.details;
      }

      // Normalize scores and determine relevant domains
      const maxScore = Math.max(...Object.values(domainScores));
      const normalizedScores = {};
      const relevantDomains = [];

      for (const [domain, score] of Object.entries(domainScores)) {
        normalizedScores[domain] = maxScore > 0 ? score / maxScore : 0;
        
        // Consider domain relevant if score > 0.3 or if it's the highest score > 0.1
        if (normalizedScores[domain] > 0.3 || (score === maxScore && score > 0.1)) {
          relevantDomains.push(domain);
        }
      }

      // Ensure at least enterprise domain is included if no domains detected
      if (relevantDomains.length === 0) {
        relevantDomains.push('enterprise');
        normalizedScores.enterprise = Math.max(normalizedScores.enterprise, 0.5);
      }

      // Sort domains by relevance score
      relevantDomains.sort((a, b) => normalizedScores[b] - normalizedScores[a]);

      const result = {
        success: true,
        classified_domains: relevantDomains,
        domain_scores: normalizedScores,
        domain_details: domainDetails,
        analysis_summary: {
          primary_domain: relevantDomains[0],
          total_domains: relevantDomains.length,
          confidence: Math.max(...Object.values(normalizedScores)),
          text_analyzed: textContent.length
        }
      };

      console.log(`✅ Domain classification complete: ${relevantDomains.join(', ')}`);
      return result;

    } catch (error) {
      console.error('❌ Error classifying MITRE domains:', error);
      return {
        success: false,
        error: error.message,
        classified_domains: ['enterprise'], // Default fallback
        domain_scores: { enterprise: 0.5, mobile: 0.0, ics: 0.0 }
      };
    }
  }

  /**
   * Analyze domain relevance based on indicators
   * @param {string} textContent - Combined text content to analyze
   * @param {string} domain - Domain being analyzed
   * @param {Object} indicators - Domain-specific indicators
   * @returns {Object} Analysis results with score and details
   */
  analyzeDomainRelevance(textContent, domain, indicators) {
    let score = 0;
    const matchedIndicators = {
      keywords: [],
      platforms: [],
      sources: []
    };

    // Check keyword matches
    for (const keyword of indicators.keywords) {
      if (textContent.includes(keyword)) {
        score += 1 * indicators.weight;
        matchedIndicators.keywords.push(keyword);
      }
    }

    // Check platform matches (higher weight)
    for (const platform of indicators.platforms) {
      if (textContent.includes(platform)) {
        score += 2 * indicators.weight;
        matchedIndicators.platforms.push(platform);
      }
    }

    // Check source system matches
    for (const source of indicators.sources) {
      if (textContent.includes(source)) {
        score += 1.5 * indicators.weight;
        matchedIndicators.sources.push(source);
      }
    }

    // Environment context bonus
    if (this.environmentContext[domain]) {
      for (const context of this.environmentContext[domain]) {
        if (textContent.includes(context)) {
          score += 0.5 * indicators.weight;
        }
      }
    }

    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      details: {
        matched_keywords: matchedIndicators.keywords,
        matched_platforms: matchedIndicators.platforms,
        matched_sources: matchedIndicators.sources,
        total_matches: matchedIndicators.keywords.length + 
                      matchedIndicators.platforms.length + 
                      matchedIndicators.sources.length
      }
    };
  }

  /**
   * Get domain mapping recommendations
   * @param {Array} domains - Classified domains
   * @returns {Object} Mapping recommendations
   */
  getDomainMappingRecommendations(domains) {
    const recommendations = {
      search_order: domains,
      techniques_to_focus: {},
      detection_priorities: {}
    };

    // Domain-specific technique focus
    if (domains.includes('enterprise')) {
      recommendations.techniques_to_focus.enterprise = [
        'T1055', 'T1059', 'T1003', 'T1078', 'T1082', 'T1083'
      ];
      recommendations.detection_priorities.enterprise = [
        'Process Creation', 'Network Traffic', 'File Monitoring', 'Registry'
      ];
    }

    if (domains.includes('mobile')) {
      recommendations.techniques_to_focus.mobile = [
        'T1437', 'T1426', 'T1448', 'T1430', 'T1629'
      ];
      recommendations.detection_priorities.mobile = [
        'Application Monitoring', 'Network Traffic', 'Device Management'
      ];
    }

    if (domains.includes('ics')) {
      recommendations.techniques_to_focus.ics = [
        'T0883', 'T0884', 'T0885', 'T0886', 'T0887'
      ];
      recommendations.detection_priorities.ics = [
        'Network Protocol Monitoring', 'Process Monitoring', 'Asset Discovery'
      ];
    }

    return recommendations;
  }
}

module.exports = {
  DomainClassifier
};