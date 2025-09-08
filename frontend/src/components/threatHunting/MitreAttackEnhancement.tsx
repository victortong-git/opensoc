import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Bot, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  Shield, 
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mitreEnhancementService, { ThreatHuntMitreEnhancement } from '../../services/mitreEnhancementService';
import { parseMitreAnalysis, MitreAnalysisSection } from '../../utils/mitreAnalysisParser';
import { getTacticColor, getTechniqueUrl } from '../../services/attackService';
import toastNotificationService from '../../services/toastNotificationService';

interface MitreAttackEnhancementProps {
  huntId: string;
  huntData: {
    name: string;
    description: string;
    huntType: string;
    scope: string;
    methodology?: string;
    hypothesis?: string;
    targetSystems?: string;
  };
  isViewMode?: boolean;
  onEnhancementComplete?: (data: {
    mitreTactics: string[];
    mitreTechniques: string[];
    mitreAnalysis: string;
  }) => void;
}

interface ToolCallProgress {
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  completionTime?: Date;
  result?: any;
  error?: string;
}

const MitreAttackEnhancement: React.FC<MitreAttackEnhancementProps> = ({
  huntId,
  huntData,
  isViewMode = false,
  onEnhancementComplete
}) => {
  const [enhancement, setEnhancement] = useState<ThreatHuntMitreEnhancement | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolProgress, setToolProgress] = useState<ToolCallProgress[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Load existing enhancement on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadExistingEnhancement = async () => {
      if (!huntId || huntId === 'ai-generation-placeholder-id') return;
      
      setIsLoading(true);
      try {
        const existing = await mitreEnhancementService.getMitreEnhancement(huntId);
        if (existing && isMounted) {
          setEnhancement(existing);
        }
      } catch (error) {
        // Expected for hunts without existing enhancements - suppress console spam
        if (isMounted && error.response?.status !== 404) {
          console.warn('Error loading MITRE enhancement:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadExistingEnhancement();

    return () => {
      isMounted = false;
    };
  }, [huntId]); // Only re-run when huntId changes

  const handleEnhanceWithMitre = async () => {
    // Prevent multiple simultaneous enhancement requests
    if (isEnhancing || isLoading) {
      console.debug('🔄 MITRE enhancement already in progress, ignoring duplicate request');
      return;
    }

    setIsEnhancing(true);
    setError(null);
    setToolProgress([
      { toolName: 'search_mitre_techniques', status: 'pending' },
      { toolName: 'map_threat_hunt_to_mitre', status: 'pending' },
      { toolName: 'analyze_attack_pattern', status: 'pending' },
      { toolName: 'get_technique_details', status: 'pending' }
    ]);

    try {
      try {
        toastNotificationService.showNotification({
          title: 'MITRE Enhancement Started',
          body: 'Using AI tool calling with high reasoning effort...',
          tag: `mitre_enhance_start_${huntId}`
        });
      } catch (toastError) {
        console.log('Toast notification failed, continuing with enhancement...');
      }

      // Simulate tool progress updates
      setTimeout(() => updateToolProgress('search_mitre_techniques', 'running'), 500);
      setTimeout(() => updateToolProgress('search_mitre_techniques', 'completed'), 2000);
      setTimeout(() => updateToolProgress('map_threat_hunt_to_mitre', 'running'), 2500);
      setTimeout(() => updateToolProgress('map_threat_hunt_to_mitre', 'completed'), 5000);
      setTimeout(() => updateToolProgress('analyze_attack_pattern', 'running'), 5500);
      setTimeout(() => updateToolProgress('analyze_attack_pattern', 'completed'), 8000);
      setTimeout(() => updateToolProgress('get_technique_details', 'running'), 8500);

      const result = await mitreEnhancementService.enhanceThreatHuntWithMitre(huntId, huntData);
      
      updateToolProgress('get_technique_details', 'completed');
      setEnhancement(result);
      
      // Call the callback to update parent form with MITRE data
      if (onEnhancementComplete && result.mappedTechniques?.length > 0) {
        const mitreTactics = [...new Set(result.mappedTechniques.flatMap(t => t.tactics || []))];
        const mitreTechniques = result.mappedTechniques.map(t => t.techniqueId);
        // Try multiple sources for the analysis text
        const mitreAnalysis = result.analysisStructured?.originalText || 
                            result.analysisStructured?.summary ||
                            (result.analysisStructured?.sections?.map(s => s.content).join('\n\n')) ||
                            '';
        
        onEnhancementComplete({
          mitreTactics,
          mitreTechniques,
          mitreAnalysis
        });

        console.log('🔄 Updated parent form with MITRE data:', { 
          tactics: mitreTactics.length, 
          techniques: mitreTechniques.length,
          analysisLength: mitreAnalysis.length
        });
      }
      
      try {
        toastNotificationService.showNotification({
          title: 'MITRE Enhancement Completed',
          body: `Mapped ${result.mappedTechniques.length} techniques using tool calling`,
          tag: `mitre_enhance_success_${huntId}`
        });
      } catch (toastError) {
        console.log('Completion toast notification failed');
      }

    } catch (error) {
      console.error('MITRE enhancement failed:', error);
      setError(error.message);
      
      try {
        toastNotificationService.showNotification({
          title: 'MITRE Enhancement Failed',
          body: error.message,
          tag: `mitre_enhance_error_${huntId}`
        });
      } catch (toastError) {
        console.log('Error toast notification failed');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleClearMitreAnalysis = async () => {
    try {
      setIsClearing(true);
      setError(null);

      console.log(`🗑️ Clearing MITRE analysis for hunt ${huntId}`);

      // Call the service to clear the enhancement
      await mitreEnhancementService.clearMitreEnhancement(huntId);

      // Clear local state
      setEnhancement(null);
      setToolProgress([]);
      setExpandedSections(new Set());
      setShowClearConfirmation(false);

      // Show success notification
      try {
        toastNotificationService.showNotification({
          title: 'MITRE Analysis Cleared',
          body: 'MITRE ATT&CK analysis data has been successfully cleared',
          tag: `mitre_clear_success_${huntId}`
        });
      } catch (toastError) {
        console.log('Clear toast notification failed');
      }

      console.log(`✅ Successfully cleared MITRE analysis for hunt ${huntId}`);

    } catch (error) {
      console.error('Failed to clear MITRE analysis:', error);
      setError(`Failed to clear MITRE analysis: ${error.message}`);
      
      // Show error notification
      try {
        toastNotificationService.showNotification({
          title: 'Clear Failed',
          body: `Failed to clear MITRE analysis: ${error.message}`,
          tag: `mitre_clear_error_${huntId}`
        });
      } catch (toastError) {
        console.log('Error toast notification failed');
      }
    } finally {
      setIsClearing(false);
    }
  };

  const updateToolProgress = (toolName: string, status: ToolCallProgress['status']) => {
    setToolProgress(prev => prev.map(tool => 
      tool.toolName === toolName 
        ? { 
            ...tool, 
            status,
            startTime: status === 'running' ? new Date() : tool.startTime,
            completionTime: status === 'completed' || status === 'failed' ? new Date() : tool.completionTime
          }
        : tool
    ));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getSectionIcon = (type: MitreAnalysisSection['type']) => {
    switch (type) {
      case 'mapping': return <Target className="h-4 w-4" />;
      case 'assessment': return <AlertTriangle className="h-4 w-4" />;
      case 'detection': return <Search className="h-4 w-4" />;
      case 'mitigation': return <Shield className="h-4 w-4" />;
      case 'iocs': return <Activity className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getSectionColorClass = (color: string) => {
    const colorClasses = {
      'purple': 'border-purple-500/30 bg-purple-500/10',
      'red': 'border-red-500/30 bg-red-500/10',
      'blue': 'border-blue-500/30 bg-blue-500/10',
      'green': 'border-green-500/30 bg-green-500/10',
      'orange': 'border-orange-500/30 bg-orange-500/10',
      'gray': 'border-gray-500/30 bg-gray-500/10'
    };
    return colorClasses[color] || colorClasses.gray;
  };

  if (isLoading) {
    return (
      <div className="bg-soc-dark-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 text-opensoc-400 animate-spin" />
          <span className="text-slate-400">Loading MITRE enhancement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhancement Header */}
      <div className="bg-soc-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">MITRE ATT&CK Enhancement</h3>
              <p className="text-slate-400 text-sm">
                AI-powered threat hunting enhancement using tool calling with high reasoning
              </p>
            </div>
          </div>
          
          {!isViewMode && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEnhanceWithMitre}
                disabled={isEnhancing || isClearing}
                className="btn-primary flex items-center space-x-2"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{enhancement ? 'Re-enhance' : 'Enhance'} with MITRE</span>
                  </>
                )}
              </button>
              
              {enhancement && (
                <button
                  onClick={() => setShowClearConfirmation(true)}
                  disabled={isEnhancing || isClearing}
                  className="btn-secondary text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 flex items-center space-x-2"
                  title="Clear MITRE analysis data"
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Clear Analysis</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tool Calling Progress */}
      {(isEnhancing || toolProgress.some(t => t.status !== 'pending')) && (
        <div className="bg-soc-dark-800 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Bot className="h-4 w-4 text-opensoc-400" />
            <span>AI Tool Calling Progress</span>
          </h4>
          <div className="space-y-3">
            {toolProgress.map((tool, index) => (
              <div key={tool.toolName} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {tool.status === 'pending' && <Clock className="h-4 w-4 text-slate-500" />}
                  {tool.status === 'running' && <Loader2 className="h-4 w-4 text-opensoc-400 animate-spin" />}
                  {tool.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-400" />}
                  {tool.status === 'failed' && <XCircle className="h-4 w-4 text-red-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white capitalize">
                    {tool.toolName.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-slate-400">
                    {tool.status === 'pending' && 'Waiting...'}
                    {tool.status === 'running' && 'Executing with high reasoning...'}
                    {tool.status === 'completed' && 'Completed successfully'}
                    {tool.status === 'failed' && `Failed: ${tool.error}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-medium">Enhancement Failed</span>
          </div>
          <p className="text-red-300 text-sm mt-2">{error}</p>
        </div>
      )}

      {/* Enhancement Results */}
      {enhancement && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-slate-400">Mapped Techniques</span>
              </div>
              <p className="text-xl font-bold text-white">
                {enhancement.mappedTechniques?.length || 0}
              </p>
            </div>

            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-opensoc-400" />
                <span className="text-sm text-slate-400">Confidence Score</span>
              </div>
              <p className="text-xl font-bold text-white">
                {Math.round((enhancement.confidenceScore || 0) * 100)}%
              </p>
            </div>

            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="h-4 w-4 text-green-400" />
                <span className="text-sm text-slate-400">Tool Calls</span>
              </div>
              <p className="text-xl font-bold text-white">
                {enhancement.toolCallingSummary?.totalToolCalls || 0}
              </p>
            </div>
          </div>

          {/* Mapped Techniques */}
          {enhancement.mappedTechniques?.length > 0 && (
            <div className="bg-soc-dark-800 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-400" />
                <span>Mapped MITRE Techniques</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {enhancement.mappedTechniques?.map((technique) => (
                  <div
                    key={technique.techniqueId}
                    className="bg-soc-dark-900 rounded-lg p-4 border border-soc-dark-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <a
                            href={getTechniqueUrl(technique.techniqueId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-opensoc-400 hover:text-opensoc-300 font-mono text-sm flex items-center space-x-1"
                          >
                            <span>{technique.techniqueId}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            {Math.round(technique.confidenceScore * 100)}%
                          </span>
                        </div>
                        <h5 className="text-white font-medium text-sm mb-2">
                          {technique.name}
                        </h5>
                        <p className="text-slate-400 text-xs mb-3 line-clamp-2">
                          {technique.description}
                        </p>
                      </div>
                    </div>

                    {/* Tactics */}
                    <div className="mb-3">
                      <span className="text-slate-400 text-xs block mb-1">Tactics:</span>
                      <div className="flex flex-wrap gap-1">
                        {technique.tactics.map((tactic, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${getTacticColor(tactic)}`}
                          >
                            {tactic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="mb-3">
                      <span className="text-slate-400 text-xs block mb-1">Platforms:</span>
                      <div className="flex flex-wrap gap-1">
                        {technique.platforms.map((platform, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-slate-500/20 text-slate-300 rounded text-xs"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Detection Methods */}
                    {technique.detectionMethods.length > 0 && (
                      <div>
                        <span className="text-slate-400 text-xs block mb-1">Detection:</span>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {technique.detectionMethods.slice(0, 2).map((method, index) => (
                            <li key={index}>• {method}</li>
                          ))}
                          {technique.detectionMethods.length > 2 && (
                            <li className="text-slate-500">
                              +{technique.detectionMethods.length - 2} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured Analysis Sections */}
          {enhancement.analysisStructured?.sections?.length > 0 && (
            <div className="bg-soc-dark-800 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                <Bot className="h-5 w-5 text-opensoc-400" />
                <span>AI Analysis Sections</span>
                <span className="text-xs px-2 py-1 bg-opensoc-500/20 text-opensoc-300 rounded">
                  High Reasoning
                </span>
              </h4>
              <div className="space-y-4">
                {enhancement.analysisStructured?.sections?.map((section) => (
                  <div
                    key={section.id}
                    className={`border rounded-lg ${getSectionColorClass(section.color)}`}
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-black/20 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getSectionIcon(section.type)}
                        <span className="text-white font-medium">{section.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 capitalize">{section.type}</span>
                        {expandedSections.has(section.id) ? '−' : '+'}
                      </div>
                    </button>
                    
                    {expandedSections.has(section.id) && (
                      <div className="px-4 pb-4">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {section.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detection Strategies */}
          {enhancement.detectionStrategies?.length > 0 && (
            <div className="bg-soc-dark-800 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                <Search className="h-5 w-5 text-blue-400" />
                <span>Detection Strategies</span>
              </h4>
              <div className="space-y-4">
                {enhancement.detectionStrategies?.map((strategy, index) => (
                  <div key={index} className="bg-soc-dark-900 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-opensoc-400 font-mono text-sm">
                        {strategy.techniqueId}
                      </span>
                      <span className="text-white text-sm font-medium">
                        {strategy.techniqueName}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{strategy.strategy}</p>
                    
                    {/* Data Sources */}
                    <div className="mb-2">
                      <span className="text-slate-400 text-xs">Data Sources: </span>
                      <span className="text-slate-300 text-xs">
                        {strategy.dataSources.join(', ')}
                      </span>
                    </div>

                    {/* Sample Queries */}
                    {strategy.queries.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-slate-400 text-xs cursor-pointer hover:text-white">
                          Sample Hunting Queries ({strategy.queries.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {strategy.queries.map((query, qIndex) => (
                            <div key={qIndex} className="bg-soc-dark-700 rounded p-2">
                              <code className="text-xs text-green-300 font-mono">
                                {query}
                              </code>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool Calling Summary */}
          {enhancement.toolCallingSummary && (
            <div className="bg-soc-dark-800 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-400" />
                <span>Tool Calling Summary</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {enhancement.toolCallingSummary?.totalToolCalls || 0}
                  </div>
                  <div className="text-slate-400 text-xs">Total Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">
                    {enhancement.toolCallingSummary?.successfulCalls || enhancement.toolCallingSummary?.totalToolCalls || 0}
                  </div>
                  <div className="text-slate-400 text-xs">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-opensoc-400">
                    {enhancement.toolCallingSummary?.processingTimeMs || 0}ms
                  </div>
                  <div className="text-slate-400 text-xs">Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">
                    {enhancement.aiReasoningEffort?.toUpperCase() || 'HIGH'}
                  </div>
                  <div className="text-slate-400 text-xs">Reasoning Effort</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Enhancement State */}
      {!enhancement && !isEnhancing && !isLoading && (
        <div className="bg-soc-dark-800 rounded-lg p-8 text-center">
          <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No MITRE Enhancement Yet</h3>
          <p className="text-slate-400 mb-4">
            Enhance this threat hunt with AI-powered MITRE ATT&CK mapping to get comprehensive TTPs, 
            detection strategies, and hunting guidance.
          </p>
          <button
            onClick={handleEnhanceWithMitre}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Sparkles className="h-4 w-4" />
            <span>Enhance with MITRE ATT&CK</span>
          </button>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-800 border border-soc-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Clear MITRE Analysis</h3>
            </div>
            
            <p className="text-slate-400 mb-6">
              Are you sure you want to clear all MITRE ATT&CK analysis data for this threat hunt? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearConfirmation(false)}
                disabled={isClearing}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleClearMitreAnalysis();
                }}
                disabled={isClearing}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Clear Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MitreAttackEnhancement;