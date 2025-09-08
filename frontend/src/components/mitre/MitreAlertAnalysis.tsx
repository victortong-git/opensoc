import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  Shield, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  Zap,
  Globe,
  Activity,
  Link2,
  Download,
  Share,
  Grid3X3
} from 'lucide-react';
import type { MitreAnalysisResponse, MitreTechnique } from '../../services/alertService';
import TechniqueDetailModal from './TechniqueDetailModal';
import AlertTtpCorrelation from './AlertTtpCorrelation';
import ActionableRecommendations from './ActionableRecommendations';
import MitreMatrixVisualization from './MitreMatrixVisualization';

interface MitreAlertAnalysisProps {
  analysisData: MitreAnalysisResponse;
  onTechniqueClick?: (techniqueId: string) => void;
  isLoading?: boolean;
  alertData?: {
    id: string;
    title: string;
    description: string;
    sourceSystem: string;
    assetName: string;
    severity: string;
    rawData: any;
    securityEventType: string;
  };
}

const MitreAlertAnalysis: React.FC<MitreAlertAnalysisProps> = ({
  analysisData,
  onTechniqueClick,
  isLoading = false,
  alertData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'techniques' | 'matrix' | 'correlation' | 'recommendations' | 'guidance'>('overview');
  const [showAllTechniques, setShowAllTechniques] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    domains: true,
    tactics: true,
    recommendations: true
  });
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-5 w-5 text-opensoc-400 animate-pulse" />
          <h3 className="text-lg font-medium text-white">MITRE ATT&CK Analysis</h3>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-soc-dark-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-soc-dark-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle both API response format and direct data format
  const actualData = analysisData.data || analysisData;
  const isSuccess = analysisData.success !== false; // Default to true if not explicitly false
  
  // Debug logging for component data structure
  /* console.log('🔍 MitreAlertAnalysis received data:', {
    hasSuccess: !!analysisData.success,
    hasData: !!analysisData.data,
    successValue: analysisData.success,
    dataKeys: analysisData.data ? Object.keys(analysisData.data) : [],
    directDataKeys: Object.keys(analysisData),
    willShowError: !isSuccess || (!actualData.domain_classification && !actualData.ttp_mapping),
    hasDirectEnrichedAnalysis: !!analysisData.enriched_analysis,
    analysisDataType: typeof analysisData,
    actualDataKeys: actualData ? Object.keys(actualData) : [],
    fixedStructure: 'Using actualData for analysis results'
  }); */

  if (!isSuccess || (!actualData.domain_classification && !actualData.ttp_mapping)) {
    return (
      <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-medium text-white">MITRE ATT&CK Analysis</h3>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-300 font-medium">Analysis Failed</p>
              <p className="text-xs text-red-400 mt-1">{analysisData.error}</p>
              {analysisData.fallback_guidance && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-red-300 mb-1">Recommended Actions:</p>
                  <ul className="text-xs text-red-400 space-y-1">
                    {analysisData.fallback_guidance.map((guidance, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span>•</span>
                        <span>{guidance}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle both data structures: { success, data } and direct data
  const analysis = actualData;
  const domains = analysis.domain_classification.classified_domains;
  const techniques = analysis.ttp_mapping.techniques;
  const summary = analysis.summary;
  const killChain = summary.kill_chain_coverage;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDomainBadgeColor = (domain: string) => {
    switch (domain) {
      case 'enterprise': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'mobile': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ics': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTechniqueConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 0.6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (score >= 0.4) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const handleTechniqueSelect = (technique: MitreTechnique) => {
    setSelectedTechnique(technique);
    setShowTechniqueModal(true);
    if (onTechniqueClick) {
      onTechniqueClick(technique.id);
    }
  };

  const exportAnalysis = () => {
    const exportData = {
      alert_id: actualData.alert_id,
      analysis_timestamp: actualData.analysis_timestamp,
      techniques: techniques.map(t => ({
        id: t.id,
        name: t.name,
        confidence: t.confidence_score,
        tactics: t.tactics
      })),
      domains: domains,
      summary: summary
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mitre-analysis-${actualData.alert_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayedTechniques = showAllTechniques ? techniques : techniques.slice(0, 6);
  const hasMoreTechniques = techniques.length > 6;

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-soc-dark-700">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-opensoc-400" />
          <h3 className="text-lg font-medium text-white">MITRE ATT&CK Analysis</h3>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{analysis.processing_time_ms}ms</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {analysis.enriched_analysis.success && (
            <span className="px-2 py-1 text-xs bg-opensoc-500/20 text-opensoc-300 border border-opensoc-500/30 rounded">
              🤖 AI Enhanced
            </span>
          )}
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
            {summary.total_techniques_mapped} Techniques
          </span>
          
          {/* Export and Share Buttons */}
          <button
            onClick={exportAnalysis}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/30 rounded transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => navigator.share?.({
              title: `MITRE Analysis - Alert ${actualData.alert_id}`,
              text: `Found ${summary.total_techniques_mapped} techniques across ${domains.length} domains`,
              url: window.location.href
            })}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/30 rounded transition-colors"
          >
            <Share className="h-3 w-3" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-soc-dark-700 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'techniques', label: 'Techniques', icon: Target },
          { id: 'matrix', label: 'Matrix View', icon: Grid3X3 },
          { id: 'correlation', label: 'Alert Correlation', icon: Link2 },
          { id: 'recommendations', label: 'Actionable', icon: Zap },
          { id: 'guidance', label: 'AI Guidance', icon: CheckCircle }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-opensoc-500/20 text-opensoc-300 border-b-2 border-opensoc-500'
                  : 'text-slate-400 hover:text-white hover:bg-soc-dark-700/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Domain Classification */}
            <div>
              <button
                onClick={() => toggleSection('domains')}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Domain Classification</span>
                </h4>
                {expandedSections.domains ? 
                  <ChevronUp className="h-4 w-4 text-slate-400" /> : 
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                }
              </button>
              
              {expandedSections.domains && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {domains.map((domain, index) => {
                      const score = analysis.domain_classification.domain_scores[domain];
                      return (
                        <div key={domain} className={`px-3 py-1 rounded border text-xs font-medium ${getDomainBadgeColor(domain)}`}>
                          <div className="flex items-center space-x-2">
                            <span className="capitalize">{domain.replace('-attack', '')}</span>
                            {index === 0 && <span className="text-xs opacity-75">(Primary)</span>}
                            <span className="text-xs opacity-75">
                              {Math.round(score * 100)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400">
                    Primary domain: <span className="text-white font-medium">{analysis.domain_classification.analysis_summary.primary_domain}</span>
                    {' • '}
                    Confidence: <span className="text-white font-medium">{Math.round(analysis.domain_classification.analysis_summary.confidence * 100)}%</span>
                  </p>
                </div>
              )}
            </div>

            {/* Kill Chain Coverage */}
            <div>
              <button
                onClick={() => toggleSection('tactics')}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Kill Chain Coverage ({killChain.coverage_percentage}%)</span>
                </h4>
                {expandedSections.tactics ? 
                  <ChevronUp className="h-4 w-4 text-slate-400" /> : 
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                }
              </button>
              
              {expandedSections.tactics && (
                <div className="mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-green-300 mb-2">Covered Tactics ({killChain.covered_tactics.length})</p>
                      <div className="space-y-1">
                        {killChain.covered_tactics.map(tactic => (
                          <div key={tactic} className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-slate-300 capitalize">{tactic.replace('-', ' ')}</span>
                            <span className="text-slate-500">
                              ({killChain.tactic_breakdown[tactic]?.length || 0})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {killChain.missing_tactics.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">Missing Tactics ({killChain.missing_tactics.length})</p>
                        <div className="space-y-1">
                          {killChain.missing_tactics.slice(0, 5).map(tactic => (
                            <div key={tactic} className="flex items-center space-x-2 text-xs">
                              <div className="h-3 w-3 border border-slate-600 rounded-full" />
                              <span className="text-slate-500 capitalize">{tactic.replace('-', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="text-lg font-bold text-white">{summary.total_techniques_mapped}</div>
                <div className="text-xs text-slate-400">Total Techniques</div>
              </div>
              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="text-lg font-bold text-green-400">{summary.high_confidence_techniques}</div>
                <div className="text-xs text-slate-400">High Confidence</div>
              </div>
              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="text-lg font-bold text-blue-400">{domains.length}</div>
                <div className="text-xs text-slate-400">Domains Analyzed</div>
              </div>
              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="text-lg font-bold text-purple-400">{killChain.coverage_percentage}%</div>
                <div className="text-xs text-slate-400">Kill Chain Coverage</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'techniques' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {displayedTechniques.length} of {techniques.length} mapped techniques
              </p>
              {hasMoreTechniques && (
                <button
                  onClick={() => setShowAllTechniques(!showAllTechniques)}
                  className="text-sm text-opensoc-400 hover:text-opensoc-300 flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>{showAllTechniques ? 'Show Less' : `Show All (${techniques.length})`}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {displayedTechniques.map((technique, index) => (
                <div
                  key={technique.id}
                  className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-4 hover:bg-soc-dark-900/70 transition-colors cursor-pointer"
                  onClick={() => handleTechniqueSelect(technique)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="text-sm font-medium text-white hover:text-opensoc-400 transition-colors">
                          {technique.id}: {technique.name}
                        </h5>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded border font-medium ${getDomainBadgeColor(technique.source_domain)}`}>
                            {technique.source_domain.replace('-attack', '')}
                          </span>
                          {technique.confidence_score && (
                            <span className={`px-2 py-1 text-xs rounded border font-medium ${getTechniqueConfidenceColor(technique.confidence_score)}`}>
                              {Math.round(technique.confidence_score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-300 mb-2 line-clamp-2">
                        {technique.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {technique.tactics.slice(0, 3).map(tactic => (
                          <span key={tactic} className="px-2 py-1 text-xs bg-slate-500/20 text-slate-300 rounded">
                            {tactic.replace('-', ' ')}
                          </span>
                        ))}
                        {technique.tactics.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-slate-500/20 text-slate-400 rounded">
                            +{technique.tactics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ExternalLink className="h-4 w-4 text-slate-400 ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'matrix' && (
          <MitreMatrixVisualization
            techniques={techniques}
            domain={domains[0] || 'enterprise'}
            onTechniqueClick={handleTechniqueSelect}
          />
        )}

        {activeTab === 'correlation' && alertData && (
          <AlertTtpCorrelation
            alert={alertData}
            techniques={techniques}
            analysisContext={{
              searchQuery: analysis.ttp_mapping?.search_query || '',
              domainsAnalyzed: domains,
              processingTime: analysis.processing_time_ms
            }}
          />
        )}

        {activeTab === 'recommendations' && (
          <ActionableRecommendations
            techniques={techniques}
            alertContext={{
              severity: alertData?.severity || 'medium',
              sourceSystem: alertData?.sourceSystem || '',
              assetCriticality: 'standard'
            }}
            aiGuidance={analysis.enriched_analysis?.analyst_guidance || []}
          />
        )}

        {activeTab === 'guidance' && (
          <div className="space-y-6">
            {/* Show AI Analysis if available */}
            {analysis.enriched_analysis?.success && analysis.enriched_analysis?.ai_analysis && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>AI Analysis</span>
                </h4>
                <div className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-4">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // Custom styling for markdown elements
                        h1: ({children}) => <h1 className="text-lg font-semibold text-white mb-3">{children}</h1>,
                        h2: ({children}) => <h2 className="text-md font-medium text-slate-200 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-medium text-slate-300 mb-2">{children}</h3>,
                        p: ({children}) => <p className="text-sm text-slate-300 mb-2">{children}</p>,
                        ul: ({children}) => <ul className="text-sm text-slate-300 mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({children}) => <ol className="text-sm text-slate-300 mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-slate-200">{children}</strong>,
                        em: ({children}) => <em className="italic text-slate-300">{children}</em>,
                        code: ({children}) => <code className="bg-soc-dark-800 px-1 py-0.5 rounded text-xs font-mono text-opensoc-400">{children}</code>,
                        pre: ({children}) => <pre className="bg-soc-dark-800 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-2">{children}</pre>
                      }}
                    >
                      {analysis.enriched_analysis.ai_analysis}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Always show guidance section with enhanced fallback */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Analyst Guidance</span>
              </h4>
              <div className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-4">
                {(() => {
                  const guidance = analysis.enriched_analysis?.analyst_guidance;
                  if (Array.isArray(guidance) && guidance.length > 0) {
                    return (
                      <div className="space-y-2">
                        {guidance.map((item, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-opensoc-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({children}) => <span className="text-slate-300">{children}</span>,
                                  strong: ({children}) => <strong className="font-semibold text-slate-200">{children}</strong>,
                                  em: ({children}) => <em className="italic text-slate-300">{children}</em>,
                                  code: ({children}) => <code className="bg-soc-dark-800 px-1 py-0.5 rounded text-xs font-mono text-opensoc-400">{children}</code>
                                }}
                              >
                                {item}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (typeof guidance === 'string') {
                    return (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({children}) => <h1 className="text-md font-semibold text-white mb-2">{children}</h1>,
                            h2: ({children}) => <h2 className="text-sm font-medium text-slate-200 mb-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-medium text-slate-300 mb-1">{children}</h3>,
                            p: ({children}) => <p className="text-sm text-slate-300 mb-2">{children}</p>,
                            ul: ({children}) => <ul className="text-sm text-slate-300 mb-2 ml-4 list-disc">{children}</ul>,
                            ol: ({children}) => <ol className="text-sm text-slate-300 mb-2 ml-4 list-decimal">{children}</ol>,
                            li: ({children}) => <li className="mb-1">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-slate-200">{children}</strong>,
                            em: ({children}) => <em className="italic text-slate-300">{children}</em>,
                            code: ({children}) => <code className="bg-soc-dark-800 px-1 py-0.5 rounded text-xs font-mono text-opensoc-400">{children}</code>,
                            pre: ({children}) => <pre className="bg-soc-dark-800 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-2">{children}</pre>
                          }}
                        >
                          {guidance}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  
                  // Show helpful fallback when no AI guidance available
                  return (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-400 mb-3">
                        AI-powered guidance is not available for this analysis. Based on the mapped MITRE ATT&CK techniques, consider these general recommendations:
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300">Review the {techniques?.length || 0} mapped techniques in the Techniques tab</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300">Examine detection methods and data sources for each technique</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300">Use the Matrix View to understand attack progression</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300">Check Actionable tab for specific countermeasures</span>
                        </div>
                        {domains && domains.length > 0 && (
                          <div className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300">Focus on {domains.join(' and ')} domain-specific security controls</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Technique Detail Modal */}
      {selectedTechnique && (
        <TechniqueDetailModal
          technique={selectedTechnique}
          alertContext={alertData ? {
            alertId: alertData.id,
            correlationReason: `Mapped to alert based on ${selectedTechnique.confidence_score ? Math.round(selectedTechnique.confidence_score * 100) : 50}% confidence match`,
            confidenceScore: selectedTechnique.confidence_score || 0.5,
            matchedIndicators: [
              alertData.securityEventType || 'Unknown event',
              alertData.sourceSystem,
              ...(selectedTechnique.platforms.filter(p => 
                alertData.assetName?.toLowerCase().includes(p.toLowerCase())
              ))
            ].filter(Boolean)
          } : undefined}
          isOpen={showTechniqueModal}
          onClose={() => {
            setShowTechniqueModal(false);
            setSelectedTechnique(null);
          }}
        />
      )}
    </div>
  );
};

export default MitreAlertAnalysis;