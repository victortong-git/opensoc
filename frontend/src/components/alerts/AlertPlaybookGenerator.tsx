import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  FileText, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Trash2,
  Eye,
  RefreshCcw,
  Download
} from 'lucide-react';
import { Alert } from '../../types';
import alertService from '../../services/alertService';
import { formatDistanceToNow } from 'date-fns';

interface AlertPlaybookGeneratorProps {
  alert: Alert;
  onPlaybooksGenerated?: () => void;
  refreshTrigger?: number;
}

interface GeneratedPlaybook {
  id: string;
  name: string;
  description: string;
  playbookType: 'immediate_action' | 'investigation';
  category: string;
  steps: PlaybookStep[];
  createdAt: string;
  metadata?: {
    aiGenerationMetadata?: {
      estimatedTime?: string;
      prerequisites?: string[];
      successCriteria?: string[];
      deliverables?: string[];
    };
  };
}

interface PlaybookStep {
  id: number;
  title: string;
  description: string;
  expectedTime?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  tools?: string[];
  commands?: string[];
  validation?: string;
  escalationCondition?: string;
  artifacts?: string[];
  documentation?: string;
}

const AlertPlaybookGenerator: React.FC<AlertPlaybookGeneratorProps> = ({ 
  alert, 
  onPlaybooksGenerated,
  refreshTrigger 
}) => {
  const [playbooks, setPlaybooks] = useState<GeneratedPlaybook[]>([]);
  const [loading, setLoading] = useState(false);
  const [immediateLoading, setImmediateLoading] = useState(false);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<{
    hasPlaybooks: boolean;
    canGenerate: boolean;
    playbooksGeneratedAt?: string;
  } | null>(null);
  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Load playbook generation status on component mount
  useEffect(() => {
    loadGenerationStatus();
    // Always attempt to load existing playbooks - don't rely on alert.generatedPlaybookIds
    loadExistingPlaybooks();
  }, [alert.id]);

  // Refresh playbooks when trigger changes (triggered by parent component)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadExistingPlaybooks();
      loadGenerationStatus();
    }
  }, [refreshTrigger]);

  const loadGenerationStatus = async () => {
    try {
      const response = await alertService.getPlaybookGenerationStatus(alert.id);
      if (response.success) {
        setGenerationStatus({
          hasPlaybooks: response.status.hasGeneratedPlaybooks,
          canGenerate: response.status.canGeneratePlaybooks,
          playbooksGeneratedAt: response.status.playbooksGeneratedAt
        });
      }
    } catch (error) {
      console.error('Failed to load playbook generation status:', error);
    }
  };

  const loadExistingPlaybooks = async () => {
    try {
      const response = await alertService.getAlertPlaybooks(alert.id);
      if (response.success) {
        setPlaybooks(response.playbooks);
      }
    } catch (error) {
      console.error('Failed to load existing playbooks:', error);
    }
  };

  const handleGeneratePlaybooks = async (forceRegenerate = false) => {
    if (!alert.aiAnalysis) {
      setError('AI analysis must be completed before generating playbooks');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await alertService.generatePlaybooks(alert.id, { forceRegenerate });
      
      if (response.success) {
        setPlaybooks(response.playbooks);
        setGenerationStatus({
          hasPlaybooks: true,
          canGenerate: true,
          playbooksGeneratedAt: new Date().toISOString()
        });
        
        // Notify parent component
        if (onPlaybooksGenerated) {
          onPlaybooksGenerated();
        }
      } else {
        setError(response.error || 'Failed to generate playbooks');
      }
    } catch (error: any) {
      console.error('Playbook generation failed:', error);
      setError(error.response?.data?.error || 'Failed to generate playbooks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImmediatePlaybook = async () => {
    if (!alert.aiAnalysis) {
      setError('AI analysis must be completed before generating playbooks');
      return;
    }

    setImmediateLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await alertService.generateImmediatePlaybook(alert.id);
      
      if (response.success && response.playbook) {
        // Update playbooks list immediately
        setPlaybooks(prev => {
          const filtered = prev.filter(p => p.playbookType !== 'immediate_action');
          return [...filtered, response.playbook!];
        });
        
        setGenerationStatus({
          hasPlaybooks: true,
          canGenerate: true,
          playbooksGeneratedAt: response.timestamp
        });

        setSuccessMessage('Immediate action playbook generated successfully!');
        
        // Clear success message after a few seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);

        // Note: Removed problematic onPlaybooksGenerated callback that causes page reload
      } else {
        setError(response.error || 'Failed to generate immediate action playbook');
      }
    } catch (error: any) {
      console.error('Immediate action playbook generation failed:', error);
      setError(error.response?.data?.error || 'Failed to generate immediate action playbook. Please try again.');
    } finally {
      setImmediateLoading(false);
    }
  };

  const handleGenerateInvestigationPlaybook = async () => {
    if (!alert.aiAnalysis) {
      setError('AI analysis must be completed before generating playbooks');
      return;
    }

    setInvestigationLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await alertService.generateInvestigationPlaybook(alert.id);
      
      if (response.success && response.playbook) {
        // Update playbooks list immediately
        setPlaybooks(prev => {
          const filtered = prev.filter(p => p.playbookType !== 'investigation');
          return [...filtered, response.playbook!];
        });
        
        setGenerationStatus({
          hasPlaybooks: true,
          canGenerate: true,
          playbooksGeneratedAt: response.timestamp
        });

        setSuccessMessage('Investigation playbook generated successfully!');
        
        // Clear success message after a few seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);

        // Note: Removed problematic onPlaybooksGenerated callback that causes page reload
      } else {
        setError(response.error || 'Failed to generate investigation playbook');
      }
    } catch (error: any) {
      console.error('Investigation playbook generation failed:', error);
      setError(error.response?.data?.error || 'Failed to generate investigation playbook. Please try again.');
    } finally {
      setInvestigationLoading(false);
    }
  };

  const handleDeletePlaybooks = async () => {
    if (!confirm('Are you sure you want to delete all generated playbooks for this alert?')) {
      return;
    }

    try {
      const response = await alertService.deleteAlertPlaybooks(alert.id);
      if (response.success) {
        setPlaybooks([]);
        setGenerationStatus(prev => prev ? { ...prev, hasPlaybooks: false } : null);
      }
    } catch (error) {
      console.error('Failed to delete playbooks:', error);
    }
  };

  const togglePlaybookExpansion = (playbookId: string) => {
    setExpandedPlaybook(expandedPlaybook === playbookId ? null : playbookId);
  };

  const toggleStepExpansion = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const handleDownloadPDF = async (playbook: GeneratedPlaybook) => {
    try {
      console.log(`📄 Downloading PDF for playbook: ${playbook.name}`);
      
      const blob = await alertService.exportPlaybookPDF(alert.id, playbook.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const playbookType = playbook.playbookType.replace('_', '-');
      const alertTitle = alert.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${playbookType}-playbook-${alertTitle}-${timestamp}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ PDF downloaded successfully`);
    } catch (error: any) {
      console.error('PDF download failed:', error);
      setError(error.message || 'Failed to download PDF');
    }
  };

  const getPlaybookTypeIcon = (type: string) => {
    switch (type) {
      case 'immediate_action':
        return { icon: Zap, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
      case 'investigation':
        return { icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
      default:
        return { icon: FileText, color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' };
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const canGeneratePlaybooks = !!alert.aiAnalysis;
  const hasExistingPlaybooks = generationStatus?.hasPlaybooks || playbooks.length > 0;

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-soc-dark-700">
        <div className="flex items-center space-x-3">
          <Bot className="h-5 w-5 text-opensoc-400" />
          <div>
            <h3 className="text-lg font-medium text-white">AI Playbook Generator</h3>
            <p className="text-sm text-slate-400">
              View and manage generated incident response playbooks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasExistingPlaybooks && (
            <>
              <button
                onClick={handleDeletePlaybooks}
                className="text-red-400 hover:text-red-300 p-1"
                title="Delete generated playbooks"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status Messages */}
        {!canGeneratePlaybooks && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                AI analysis must be completed before generating playbooks
              </span>
            </div>
          </div>
        )}

        {canGeneratePlaybooks && !hasExistingPlaybooks && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <Bot className="h-4 w-4 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300">Ready for Playbook Generation</p>
                <p className="text-xs text-blue-400 mt-1">
                  Use the <strong>Generate Immediate Playbook</strong> and <strong>Generate Investigation Playbook</strong> buttons 
                  in the Actions box to create customized incident response procedures.
                </p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="mt-2 text-xs text-green-400 hover:text-green-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Generated Playbooks */}
        {playbooks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-white">Generated Playbooks</h4>
              {generationStatus?.playbooksGeneratedAt && (
                <span className="text-xs text-slate-400">
                  Generated {formatDistanceToNow(new Date(generationStatus.playbooksGeneratedAt), { addSuffix: true })}
                </span>
              )}
            </div>

            {playbooks.map((playbook) => {
              const typeInfo = getPlaybookTypeIcon(playbook.playbookType);
              const TypeIcon = typeInfo.icon;
              const isExpanded = expandedPlaybook === playbook.id;

              return (
                <div
                  key={playbook.id}
                  className={`border border-soc-dark-600 rounded-lg overflow-hidden ${typeInfo.bgColor} ${typeInfo.borderColor}`}
                >
                  {/* Playbook Header */}
                  <div
                    className="p-3 cursor-pointer hover:bg-soc-dark-700/30"
                    onClick={() => togglePlaybookExpansion(playbook.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                        <div>
                          <h5 className="font-medium text-white">{playbook.name}</h5>
                          <p className="text-sm text-slate-400">{playbook.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded border ${typeInfo.color} ${typeInfo.bgColor} ${typeInfo.borderColor}`}>
                          {playbook.playbookType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor('medium')}`}>
                          {playbook.steps.length} steps
                        </span>
                        
                        {/* Download PDF Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(playbook);
                          }}
                          className="text-green-400 hover:text-green-300 p-1 rounded"
                          title="Download playbook as PDF"
                        >
                          <Download className="h-3 w-3" />
                        </button>

                        {/* Individual Regenerate Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playbook.playbookType === 'immediate_action') {
                              handleGenerateImmediatePlaybook();
                            } else {
                              handleGenerateInvestigationPlaybook();
                            }
                          }}
                          disabled={immediateLoading || investigationLoading}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded"
                          title={`Regenerate ${playbook.playbookType === 'immediate_action' ? 'immediate action' : 'investigation'} playbook`}
                        >
                          <RefreshCcw className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-soc-dark-600 bg-soc-dark-900/50">
                      {/* Playbook Metadata */}
                      <div className="p-3 border-b border-soc-dark-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Category:</span>
                            <span className="ml-2 text-white">{playbook.category}</span>
                          </div>
                          {playbook.metadata?.aiGenerationMetadata?.estimatedTime && (
                            <div>
                              <span className="text-slate-400">Estimated Time:</span>
                              <span className="ml-2 text-white">{playbook.metadata.aiGenerationMetadata.estimatedTime}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="p-3">
                        <h6 className="text-sm font-medium text-white mb-3">Playbook Steps</h6>
                        <div className="space-y-3">
                          {playbook.steps.map((step, index) => {
                            const stepKey = `${playbook.id}-step-${index}`;
                            const isStepExpanded = expandedStep === stepKey;

                            return (
                              <div
                                key={`${playbook.id}-step-${index}`}
                                className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg"
                              >
                                <div
                                  className="p-3 cursor-pointer hover:bg-soc-dark-700"
                                  onClick={() => toggleStepExpansion(stepKey)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0 w-6 h-6 bg-opensoc-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <h6 className="font-medium text-white">{step.title}</h6>
                                        {step.expectedTime && (
                                          <div className="flex items-center space-x-2 mt-1">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs text-slate-400">{step.expectedTime}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {step.priority && (
                                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(step.priority)}`}>
                                          {step.priority.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isStepExpanded && (
                                  <div className="border-t border-soc-dark-600 p-3 bg-soc-dark-900/30">
                                    <div className="space-y-3 text-sm">
                                      <div>
                                        <h6 className="text-slate-300 font-medium mb-1">Instructions</h6>
                                        <p className="text-slate-400">{step.description}</p>
                                      </div>

                                      {step.tools && step.tools.length > 0 && (
                                        <div>
                                          <h6 className="text-slate-300 font-medium mb-1">Tools Required</h6>
                                          <div className="flex flex-wrap gap-1">
                                            {step.tools.map((tool, idx) => (
                                              <span
                                                key={`${playbook.id}-step-${index}-tool-${idx}`}
                                                className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded"
                                              >
                                                {tool}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {step.commands && step.commands.length > 0 && (
                                        <div>
                                          <h6 className="text-slate-300 font-medium mb-1">Commands</h6>
                                          <div className="space-y-1">
                                            {step.commands.map((command, idx) => (
                                              <div
                                                key={`${playbook.id}-step-${index}-command-${idx}`}
                                                className="bg-soc-dark-950 border border-soc-dark-700 rounded p-2 font-mono text-xs text-green-300"
                                              >
                                                {command}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {step.validation && (
                                        <div>
                                          <h6 className="text-slate-300 font-medium mb-1">Validation</h6>
                                          <p className="text-slate-400 text-xs">{step.validation}</p>
                                        </div>
                                      )}

                                      {step.escalationCondition && (
                                        <div>
                                          <h6 className="text-slate-300 font-medium mb-1">Escalation</h6>
                                          <p className="text-orange-300 text-xs">{step.escalationCondition}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-soc-dark-600 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500">
                            Created {formatDistanceToNow(new Date(playbook.createdAt), { addSuffix: true })}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              className="text-opensoc-400 hover:text-opensoc-300 text-xs flex items-center space-x-1"
                              onClick={() => window.open(`/playbooks/${playbook.id}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View Full Playbook</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No Playbooks State */}
        {playbooks.length === 0 && !loading && canGeneratePlaybooks && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">No Playbooks Generated</h4>
            <p className="text-slate-400 mb-4">
              Use the playbook generation buttons in the Actions box to create AI-powered incident response playbooks.
            </p>
            <div className="text-sm text-slate-500 mb-4">
              <p>Available playbook types:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Immediate Action Playbook</strong> - for urgent containment</li>
                <li><strong>Investigation Playbook</strong> - for detailed forensic analysis</li>
              </ul>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 text-opensoc-400 mx-auto mb-4 animate-spin" />
            <h4 className="text-lg font-medium text-white mb-2">Generating Playbooks...</h4>
            <p className="text-slate-400 mb-4">
              AI is analyzing the alert and creating customized response playbooks.
            </p>
            <div className="text-xs text-slate-500">
              This typically takes 30-60 seconds. Please be patient while AI creates your custom playbooks.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertPlaybookGenerator;