import React, { useState } from 'react';
import { 
  Activity, 
  Link2, 
  Target, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Search,
  FileText,
  Network,
  Monitor,
  Shield,
  Clock
} from 'lucide-react';
import type { MitreTechnique } from '../../services/alertService';

interface AlertData {
  id: string;
  title: string;
  description: string;
  sourceSystem: string;
  assetName: string;
  severity: string;
  rawData: any;
  securityEventType: string;
}

interface CorrelationMapping {
  technique: MitreTechnique;
  correlationFactors: {
    keywordMatches: string[];
    behaviorMatches: string[];
    contextMatches: string[];
    platformMatches: string[];
  };
  correlationStrength: number;
  evidenceChain: string[];
}

interface AlertTtpCorrelationProps {
  alert: AlertData;
  techniques: MitreTechnique[];
  analysisContext?: {
    searchQuery: string;
    domainsAnalyzed: string[];
    processingTime: number;
  };
}

const AlertTtpCorrelation: React.FC<AlertTtpCorrelationProps> = ({
  alert,
  techniques,
  analysisContext
}) => {
  const [expandedTechniques, setExpandedTechniques] = useState<Set<string>>(new Set());
  const [showAllCorrelations, setShowAllCorrelations] = useState(false);

  const toggleTechniqueExpansion = (techniqueId: string) => {
    const newExpanded = new Set(expandedTechniques);
    if (newExpanded.has(techniqueId)) {
      newExpanded.delete(techniqueId);
    } else {
      newExpanded.add(techniqueId);
    }
    setExpandedTechniques(newExpanded);
  };

  // Generate correlation analysis for each technique
  const generateCorrelationMapping = (technique: MitreTechnique): CorrelationMapping => {
    const alertText = `${alert.title} ${alert.description} ${JSON.stringify(alert.rawData)}`.toLowerCase();
    const keywordMatches: string[] = [];
    const behaviorMatches: string[] = [];
    const contextMatches: string[] = [];
    const platformMatches: string[] = [];
    const evidenceChain: string[] = [];

    // Analyze keyword matches
    const techniqueKeywords = technique.name.toLowerCase().split(' ');
    techniqueKeywords.forEach(keyword => {
      if (keyword.length > 3 && alertText.includes(keyword)) {
        keywordMatches.push(keyword);
        evidenceChain.push(`Keyword "${keyword}" found in alert data`);
      }
    });

    // Analyze behavior patterns
    if (alert.securityEventType) {
      const eventType = alert.securityEventType.toLowerCase();
      if (technique.tactics.some(tactic => eventType.includes(tactic.replace('-', ' ')))) {
        behaviorMatches.push(`Event type matches ${technique.tactics.join(', ')} tactics`);
        evidenceChain.push(`Security event type "${alert.securityEventType}" aligns with technique tactics`);
      }
    }

    // Analyze platform matches
    if (alert.assetName) {
      const assetInfo = alert.assetName.toLowerCase();
      technique.platforms.forEach(platform => {
        if (assetInfo.includes(platform.toLowerCase())) {
          platformMatches.push(platform);
          evidenceChain.push(`Asset platform "${platform}" matches technique requirements`);
        }
      });
    }

    // Analyze context matches
    if (alert.sourceSystem) {
      const sourceSystem = alert.sourceSystem.toLowerCase();
      if (technique.data_sources?.some(ds => sourceSystem.includes(ds.toLowerCase().split(' ')[0]))) {
        contextMatches.push('Source system provides relevant data');
        evidenceChain.push(`Source system "${alert.sourceSystem}" can detect this technique`);
      }
    }

    // Calculate correlation strength
    const totalMatches = keywordMatches.length + behaviorMatches.length + 
                        contextMatches.length + platformMatches.length;
    const correlationStrength = Math.min(totalMatches / 5, 1); // Normalize to 0-1

    return {
      technique,
      correlationFactors: {
        keywordMatches,
        behaviorMatches,
        contextMatches,
        platformMatches
      },
      correlationStrength,
      evidenceChain
    };
  };

  const correlationMappings = techniques.map(generateCorrelationMapping)
    .sort((a, b) => b.correlationStrength - a.correlationStrength);

  const displayedMappings = showAllCorrelations 
    ? correlationMappings 
    : correlationMappings.slice(0, 5);

  const getCorrelationColor = (strength: number) => {
    if (strength >= 0.7) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (strength >= 0.5) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (strength >= 0.3) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link2 className="h-5 w-5 text-opensoc-400" />
            <h3 className="text-lg font-medium text-white">Alert-to-TTP Correlation Analysis</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{correlationMappings.length} techniques analyzed</span>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="p-4 border-b border-soc-dark-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-soc-dark-900/50 p-3 rounded border">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Search Query</span>
            </div>
            <p className="text-xs text-slate-400 break-words">
              {analysisContext?.searchQuery || 'N/A'}
            </p>
          </div>
          
          <div className="bg-soc-dark-900/50 p-3 rounded border">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-slate-300">High Confidence</span>
            </div>
            <p className="text-lg font-bold text-green-400">
              {correlationMappings.filter(m => m.correlationStrength >= 0.7).length}
            </p>
          </div>
          
          <div className="bg-soc-dark-900/50 p-3 rounded border">
            <div className="flex items-center space-x-2 mb-1">
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Domains</span>
            </div>
            <p className="text-xs text-slate-400">
              {analysisContext?.domainsAnalyzed?.join(', ') || 'enterprise'}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Context */}
      <div className="p-4 border-b border-soc-dark-700">
        <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>Alert Context</span>
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-medium text-slate-400">Title:</span>
                <p className="text-sm text-white">{alert.title}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Monitor className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-medium text-slate-400">Asset:</span>
                <p className="text-sm text-white">{alert.assetName || 'Unknown'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Network className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-medium text-slate-400">Source:</span>
                <p className="text-sm text-white">{alert.sourceSystem}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Search className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-medium text-slate-400">Event Type:</span>
                <p className="text-sm text-white">{alert.securityEventType || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Correlation Mappings */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-300">Technique Correlations</h4>
          {correlationMappings.length > 5 && (
            <button
              onClick={() => setShowAllCorrelations(!showAllCorrelations)}
              className="text-sm text-opensoc-400 hover:text-opensoc-300 transition-colors"
            >
              {showAllCorrelations ? 'Show Less' : `Show All ${correlationMappings.length}`}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {displayedMappings.map((mapping) => (
            <div key={mapping.technique.id} className="border border-soc-dark-700 rounded-lg">
              <div 
                className="p-3 cursor-pointer hover:bg-soc-dark-900/50 transition-colors"
                onClick={() => toggleTechniqueExpansion(mapping.technique.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {expandedTechniques.has(mapping.technique.id) ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-white">
                        {mapping.technique.id}: {mapping.technique.name}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs rounded border ${getCorrelationColor(mapping.correlationStrength)}`}>
                      {Math.round(mapping.correlationStrength * 100)}% match
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>{mapping.evidenceChain.length} evidence points</span>
                  </div>
                </div>
              </div>

              {expandedTechniques.has(mapping.technique.id) && (
                <div className="px-3 pb-3 border-t border-soc-dark-700">
                  <div className="pt-3 space-y-4">
                    {/* Evidence Chain */}
                    <div>
                      <h5 className="text-xs font-medium text-slate-400 mb-2">Evidence Chain</h5>
                      <div className="space-y-1">
                        {mapping.evidenceChain.map((evidence, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="h-1.5 w-1.5 bg-opensoc-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-xs text-slate-300">{evidence}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correlation Factors */}
                    <div className="grid grid-cols-2 gap-4">
                      {mapping.correlationFactors.keywordMatches.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-green-400 mb-1">Keyword Matches</h6>
                          <div className="flex flex-wrap gap-1">
                            {mapping.correlationFactors.keywordMatches.map((keyword, index) => (
                              <span key={index} className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-300 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {mapping.correlationFactors.behaviorMatches.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-blue-400 mb-1">Behavior Matches</h6>
                          <div className="space-y-1">
                            {mapping.correlationFactors.behaviorMatches.map((behavior, index) => (
                              <p key={index} className="text-xs text-blue-300">{behavior}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {mapping.correlationFactors.platformMatches.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-yellow-400 mb-1">Platform Matches</h6>
                          <div className="flex flex-wrap gap-1">
                            {mapping.correlationFactors.platformMatches.map((platform, index) => (
                              <span key={index} className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {mapping.correlationFactors.contextMatches.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-purple-400 mb-1">Context Matches</h6>
                          <div className="space-y-1">
                            {mapping.correlationFactors.contextMatches.map((context, index) => (
                              <p key={index} className="text-xs text-purple-300">{context}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {correlationMappings.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No technique correlations found for this alert.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertTtpCorrelation;