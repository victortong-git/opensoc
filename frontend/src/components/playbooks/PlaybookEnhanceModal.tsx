import React, { useState } from 'react';
import { 
  X,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'decision';
  timeout: number;
  isRequired: boolean;
  order: number;
}

interface Enhancement {
  id: string;
  type: 'new_step' | 'improve_step' | 'optimize_config' | 'security_enhancement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  originalStep?: PlaybookStep;
  suggestedStep?: PlaybookStep;
  reasoning: string;
  applied: boolean;
}

interface PlaybookEnhanceModalProps {
  playbook: any;
  isOpen: boolean;
  onClose: () => void;
  onApplyEnhancements: (enhancements: Enhancement[]) => void;
  isAnalyzing: boolean;
}

const PlaybookEnhanceModal: React.FC<PlaybookEnhanceModalProps> = ({
  playbook,
  isOpen,
  onClose,
  onApplyEnhancements,
  isAnalyzing
}) => {
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [selectedEnhancements, setSelectedEnhancements] = useState<Set<string>>(new Set());
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Load real AI enhancement data when modal opens
  React.useEffect(() => {
    if (isOpen && !analysisComplete && !isAnalyzing) {
      // Check if we have enhancement data from the API call
      const enhancementData = (window as any).latestEnhancementData;
      if (enhancementData && enhancementData.enhancements) {
        console.log('📊 Loading real AI enhancement data:', enhancementData.enhancements.length, 'suggestions');
        setEnhancements(enhancementData.enhancements);
        setAnalysisComplete(true);
      }
    }
  }, [isOpen, isAnalyzing, analysisComplete]);

  // Reset state when modal opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setAnalysisComplete(false);
      setEnhancements([]);
      setSelectedEnhancements(new Set());
    }
  }, [isOpen]);

  if (!isOpen || !playbook) return null;

  const toggleEnhancement = (enhancementId: string) => {
    const newSelected = new Set(selectedEnhancements);
    if (newSelected.has(enhancementId)) {
      newSelected.delete(enhancementId);
    } else {
      newSelected.add(enhancementId);
    }
    setSelectedEnhancements(newSelected);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_step': return <Sparkles className="h-4 w-4 text-purple-400" />;
      case 'improve_step': return <ArrowRight className="h-4 w-4 text-blue-400" />;
      case 'optimize_config': return <Clock className="h-4 w-4 text-green-400" />;
      case 'security_enhancement': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleApplySelected = () => {
    const selectedEnhancementsList = enhancements.filter(e => selectedEnhancements.has(e.id));
    onApplyEnhancements(selectedEnhancementsList);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Playbook Enhancement</h2>
                <p className="text-sm text-slate-400">
                  Analyzing "{playbook.name}" for optimization opportunities
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Analysis Status */}
          {isAnalyzing && (
            <div className="card p-6 mb-6 bg-purple-500/10 border-purple-500/20">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 text-purple-400 animate-spin" />
                <div>
                  <h3 className="text-white font-medium">Analyzing Playbook...</h3>
                  <p className="text-purple-300 text-sm">
                    AI is evaluating security gaps, optimization opportunities, and best practices
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Data Available */}
          {!isAnalyzing && !analysisComplete && (
            <div className="card p-6 mb-6 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <h3 className="text-white font-medium">No Enhancement Data Available</h3>
                  <p className="text-yellow-300 text-sm">
                    Close this modal and click "Enhance with AI" again to trigger analysis
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhancement Results */}
          {!isAnalyzing && analysisComplete && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{enhancements.length}</p>
                    <p className="text-sm text-slate-400">Total Suggestions</p>
                  </div>
                </div>
                <div className="card">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {enhancements.filter(e => e.impact === 'high').length}
                    </p>
                    <p className="text-sm text-slate-400">High Impact</p>
                  </div>
                </div>
                <div className="card">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {enhancements.filter(e => e.impact === 'medium').length}
                    </p>
                    <p className="text-sm text-slate-400">Medium Impact</p>
                  </div>
                </div>
                <div className="card">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{selectedEnhancements.size}</p>
                    <p className="text-sm text-slate-400">Selected</p>
                  </div>
                </div>
              </div>

              {/* Enhancement List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Recommended Enhancements</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedEnhancements(new Set(enhancements.map(e => e.id)))}
                      className="text-sm text-opensoc-400 hover:text-opensoc-300"
                    >
                      Select All
                    </button>
                    <span className="text-slate-500">|</span>
                    <button
                      onClick={() => setSelectedEnhancements(new Set())}
                      className="text-sm text-slate-400 hover:text-slate-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {enhancements.map((enhancement) => (
                    <div
                      key={enhancement.id}
                      className={`card cursor-pointer transition-all ${
                        selectedEnhancements.has(enhancement.id)
                          ? 'border-opensoc-500 bg-opensoc-500/5'
                          : 'hover:border-soc-dark-600'
                      }`}
                      onClick={() => toggleEnhancement(enhancement.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedEnhancements.has(enhancement.id)}
                            onChange={() => toggleEnhancement(enhancement.id)}
                            className="w-4 h-4 text-opensoc-600 bg-soc-dark-800 border-soc-dark-600 rounded focus:ring-opensoc-500 focus:ring-2"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getTypeIcon(enhancement.type)}
                            <h4 className="text-white font-medium">{enhancement.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded ${getImpactColor(enhancement.impact)}`}>
                              {enhancement.impact.toUpperCase()} IMPACT
                            </span>
                            <span className="px-2 py-1 bg-slate-600/20 text-slate-300 text-xs rounded">
                              {enhancement.category}
                            </span>
                          </div>
                          
                          <p className="text-slate-300 text-sm mb-3">{enhancement.description}</p>
                          
                          <div className="bg-soc-dark-800/50 p-3 rounded text-xs">
                            <p className="text-slate-400 mb-1">
                              <strong>Reasoning:</strong>
                            </p>
                            <p className="text-slate-300">{enhancement.reasoning}</p>
                          </div>

                          {/* Step Details */}
                          {enhancement.suggestedStep && (
                            <div className="mt-3 p-3 bg-opensoc-600/10 border border-opensoc-600/20 rounded">
                              <div className="flex items-center space-x-2 mb-2">
                                {enhancement.suggestedStep.type === 'automated' ? (
                                  <Bot className="h-4 w-4 text-green-400" />
                                ) : (
                                  <User className="h-4 w-4 text-blue-400" />
                                )}
                                <span className="text-white font-medium text-sm">
                                  {enhancement.suggestedStep.name}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  enhancement.suggestedStep.type === 'automated' 
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {enhancement.suggestedStep.type}
                                </span>
                              </div>
                              <p className="text-slate-300 text-xs mb-2">
                                {enhancement.suggestedStep.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-slate-400">
                                <span>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {Math.floor(enhancement.suggestedStep.timeout / 60)}m timeout
                                </span>
                                <span>
                                  {enhancement.suggestedStep.isRequired ? 'Required' : 'Optional'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-6 border-t border-soc-dark-700">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
            
            {!isAnalyzing && analysisComplete && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEnhancements([]);
                    setSelectedEnhancements(new Set());
                    setAnalysisComplete(false);
                    // Clear stored data and close modal to trigger new analysis
                    (window as any).latestEnhancementData = null;
                    onClose();
                    // Note: User will need to click "Enhance with AI" button again
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Re-analyze</span>
                </button>
                <button
                  onClick={handleApplySelected}
                  disabled={selectedEnhancements.size === 0}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Apply Selected ({selectedEnhancements.size})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookEnhanceModal;