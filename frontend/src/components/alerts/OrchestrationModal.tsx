import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Clock,
  Settings,
  Activity,
  Shield,
  Code,
  Download,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { Alert } from '../../types';
import notificationService from '../../services/notificationService';
import { apiRequest } from '../../services/api';

interface OrchestrationProgress {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration_ms?: number;
  results_count?: number;
  timestamp?: string;
  message?: string;
  progress?: number;
  currentActivity?: string;
  estimatedTimeRemaining?: string;
}

interface OrchestrationResult {
  id: string;
  alertId: string;
  orchestrationStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  virustotalAnalysis?: any;
  threatfoxAnalysis?: any;
  extractedIocs?: any[];
  threatAssessment?: any;
  generatedScripts?: any;
  scriptLanguage?: string;
  automationRecommendations?: any;
  assetContext?: any;
  executionTimeline?: OrchestrationProgress[];
  confidenceScores?: any;
  analysisTimestamp: string;
  processingTimeMs?: number;
  errorDetails?: any;
}

interface OrchestrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert;
  protocol: 'api' | 'mcp';
  onOrchestrationComplete?: (result: OrchestrationResult) => void;
}

const OrchestrationModal: React.FC<OrchestrationModalProps> = ({
  isOpen,
  onClose,
  alert,
  protocol,
  onOrchestrationComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'threats' | 'scripts' | 'timeline'>('progress');
  const [progress, setProgress] = useState<OrchestrationProgress[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<string>('');

  // Load existing orchestration results when modal opens
  useEffect(() => {
    if (isOpen && alert?.id) {
      // Clear any stale state when modal reopens
      setOrchestrationResult(null);
      setError(null);
      
      // Force fresh load of results
      loadExistingResults().then(() => {
        console.log('✅ Fresh results loaded on modal open');
      }).catch((error) => {
        console.warn('⚠️ No existing results found:', error.message);
      });
    }
  }, [isOpen, alert?.id]);

  // WebSocket connection for real-time progress updates
  useEffect(() => {
    if (isOpen && alert?.id) {
      // Join orchestration updates when modal opens
      notificationService.joinOrchestrationUpdates(alert.id);

      // Listen for progress updates
      const handleProgress = (data: any) => {
        console.log('📊 Orchestration progress received:', data);
        if (data.alertId === alert.id) {
          // Update progress percentage
          if (data.progress !== undefined) {
            setCurrentProgress(data.progress);
            console.log(`🎯 Updated progress to: ${data.progress}%`);
          }
          
          // Update current activity
          if (data.currentActivity) {
            setCurrentActivity(data.currentActivity);
          } else if (data.message) {
            setCurrentActivity(data.message);
          }
          
          // Update the progress steps array
          if (data.step && data.status) {
            setProgress(prev => {
              const updated = prev.map(step => 
                step.step === data.step 
                  ? { ...step, status: data.status, message: data.message || step.message }
                  : step
              );
              console.log(`📋 Updated step "${data.step}" to "${data.status}"`);
              return updated;
            });
          }

          // If we receive 100% progress, prepare for completion
          if (data.progress === 100 && data.status === 'completed') {
            console.log('🎉 Preparing for completion state');
            setCurrentActivity('Analysis completed successfully!');
            // Give a moment for the progress bar to update, then load results
            setTimeout(() => {
              loadExistingResults();
            }, 500);
          }
        }
      };

      // Listen for completion
      const handleComplete = (data: any) => {
        console.log('✅ Orchestration completed:', data);
        if (data.alertId === alert.id) {
          console.log('🏁 Processing completion event for alert:', data.alertId);
          
          // Update all completion states immediately
          setLoading(false);
          setCurrentProgress(100);
          setCurrentActivity('Analysis completed successfully!');
          setError(null); // Clear any previous errors
          
          // Mark all progress steps as completed
          setProgress(prev => prev.map(step => ({
            ...step,
            status: 'completed' as const
          })));
          
          // Clear current state and force fresh reload
          setOrchestrationResult(null);
          
          // Load the completed results with a slight delay to ensure backend has saved
          setTimeout(() => {
            loadExistingResults().then(() => {
              console.log('📊 Results loaded, switching to threats tab');
              setActiveTab('threats');
            }).catch((error) => {
              console.error('❌ Failed to load results after completion:', error);
              setError('Results loaded but display failed. Try refreshing.');
            });
          }, 1000);
        }
      };

      // Listen for errors
      const handleError = (data: any) => {
        console.log('❌ Orchestration error:', data);
        if (data.alertId === alert.id) {
          setLoading(false);
          setError(data.error?.message || data.error || 'Orchestration analysis failed');
          setCurrentActivity('Analysis failed');
          setCurrentProgress(0); // Reset progress on error
          
          // Mark current step as failed
          if (data.step) {
            setProgress(prev => prev.map(step => 
              step.step === data.step 
                ? { ...step, status: 'failed' as const, message: data.error?.message || 'Failed' }
                : step
            ));
          }
        }
      };

      // Add event listeners
      notificationService.on('orchestrationProgress', handleProgress);
      notificationService.on('orchestrationComplete', handleComplete);
      notificationService.on('orchestrationError', handleError);

      return () => {
        // Clean up event listeners and leave room
        notificationService.off('orchestrationProgress', handleProgress);
        notificationService.off('orchestrationComplete', handleComplete);
        notificationService.off('orchestrationError', handleError);
        notificationService.leaveOrchestrationUpdates(alert.id);
      };
    }
  }, [isOpen, alert?.id]);

  const loadExistingResults = async () => {
    try {
      console.log('🔄 Loading NAT results for alert:', alert.id);
      
      // Use unified NAT results endpoint - works for both API and MCP
      const data = await apiRequest.getOptional(`/alerts/${alert.id}/nat-results`);
      console.log('📊 Received NAT data:', data);
      
      if (data && data.success && data.orchestrationResult) {
        setOrchestrationResult(data.orchestrationResult);
        
        // Update progress timeline if available
        if (data.orchestrationResult.executionTimeline) {
          setProgress(data.orchestrationResult.executionTimeline);
        }
        
        // If orchestration is completed, ensure UI reflects that
        if (data.orchestrationResult.orchestrationStatus === 'completed') {
          setLoading(false);
          setCurrentProgress(100);
          setCurrentActivity('Analysis completed successfully!');
          console.log('✅ Orchestration results loaded and status updated');
        }
        
        return true; // Success
      } else {
        console.warn('⚠️ No orchestration results found in response');
        return false;
      }
    } catch (error) {
      console.error('❌ Error loading orchestration results:', error);
      throw error; // Re-throw to handle in caller
    }
  };

  const executeOrchestration = async () => {
    setLoading(true);
    setError(null);
    setProgress([]);
    setActiveTab('progress');

    try {
      // Initialize progress steps for workflow
      const initialProgress: OrchestrationProgress[] = [
        { step: 'virustotal_analysis', status: 'pending' },
        { step: 'script_generation', status: 'pending' }
      ];
      setProgress(initialProgress);

      const endpoint = protocol === 'mcp' ? `/alerts/${alert.id}/orchestration-mcp` : `/alerts/${alert.id}/orchestration`;
      const data = await apiRequest.post(endpoint, {});

      if (data.success) {
        setOrchestrationResult(data.orchestrationResult);
        if (data.orchestrationResult?.executionTimeline) {
          setProgress(data.orchestrationResult.executionTimeline);
        }
        setActiveTab('threats');
        onOrchestrationComplete?.(data.orchestrationResult);
      } else {
        const errorMessage = data.error || `${protocol.toUpperCase()} orchestration analysis failed`;
        setError(errorMessage);
        console.error(`❌ ${protocol.toUpperCase()} orchestration failed:`, errorMessage);
      }
    } catch (error: any) {
      console.error(`❌ ${protocol.toUpperCase()} orchestration error:`, error);
      
      // Enhanced error handling for MCP vs API failures
      let errorMessage = 'Failed to connect to orchestration service';
      
      if (protocol === 'mcp') {
        if (error.response?.status === 500) {
          errorMessage = 'MCP server error - check server connection and configuration';
        } else if (error.response?.status === 404) {
          errorMessage = 'MCP orchestration endpoint not found - verify backend configuration';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'MCP request timeout - server may be overloaded';
        } else if (error.message?.includes('network')) {
          errorMessage = 'Network error connecting to MCP server';
        } else {
          errorMessage = `MCP orchestration failed: ${error.message || 'Unknown error'}`;
        }
      } else {
        if (error.response?.status === 500) {
          errorMessage = 'NAT API server error - check server status';
        } else if (error.response?.status === 404) {
          errorMessage = 'API orchestration endpoint not found';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'API request timeout - analysis may be processing';
        } else {
          errorMessage = `API orchestration failed: ${error.message || 'Unknown error'}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = async () => {
    try {
      const endpoint = protocol === 'mcp' ? `/alerts/${alert.id}/orchestration-mcp` : `/alerts/${alert.id}/orchestration`;
      await apiRequest.delete(endpoint);
      
      // Clear UI state
      setOrchestrationResult(null);
      setProgress([]);
      setError(null);
      setActiveTab('progress');
      
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // No orchestration results to delete - still clear the UI state
        setOrchestrationResult(null);
        setProgress([]);
        setError(null);
        setActiveTab('progress');
      } else {
        console.error('Error clearing orchestration results:', error);
      }
    }
  };

  const copyScriptToClipboard = (scriptContent: string) => {
    navigator.clipboard.writeText(scriptContent);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepName = (step: string) => {
    const stepNames = {
      'virustotal_analysis': 'VirusTotal Analysis',
      'script_generation': 'Automation Script Generation'
    };
    return stepNames[step] || step;
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              protocol === 'mcp' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                : 'bg-gradient-to-r from-orange-600 to-red-600'
            }`}>
              {protocol === 'mcp' ? (
                <Zap className="h-6 w-6 text-white" />
              ) : (
                <Settings className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Orchestration and Automation ({protocol.toUpperCase()})
              </h2>
              <p className="text-sm text-gray-400">
                Advanced AI threat analysis via {protocol === 'mcp' ? 'MCP Protocol' : 'NAT HTTP API'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {orchestrationResult && (
              <button
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Clear Results
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-soc-dark-800 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-soc-dark-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'progress'
                  ? 'bg-soc-dark-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-soc-dark-700/50'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Progress
            </button>
            <button
              onClick={() => setActiveTab('threats')}
              disabled={!orchestrationResult}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'threats'
                  ? 'bg-soc-dark-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-soc-dark-700/50'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Threat Intel
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              disabled={!orchestrationResult?.generatedScripts}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'scripts'
                  ? 'bg-soc-dark-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-soc-dark-700/50'
              }`}
            >
              <Code className="h-4 w-4 inline mr-2" />
              Scripts
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              disabled={!orchestrationResult}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'timeline'
                  ? 'bg-soc-dark-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-soc-dark-700/50'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Timeline
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {!orchestrationResult ? (
                <>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Ready for Orchestration Analysis</h3>
                    <p className="text-gray-400 mb-6">
                      Execute comprehensive threat intelligence analysis with automated script generation
                    </p>
                    <button
                      onClick={executeOrchestration}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 mx-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Executing Orchestration...</span>
                        </>
                      ) : (
                        <>
                          <Settings className="h-5 w-5" />
                          <span>Start Orchestration Analysis</span>
                        </>
                      )}
                    </button>
                  </div>

                  {(progress.length > 0 || loading) && (
                    <div className="bg-soc-dark-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-4">Analysis Progress</h4>
                      
                      {/* Overall Progress Bar */}
                      {loading && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">Overall Progress</span>
                            <span className="text-sm text-gray-400">{currentProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${currentProgress}%` }}
                            ></div>
                          </div>
                          {currentActivity && (
                            <div className="flex items-center mt-3 p-3 bg-soc-dark-700 rounded-lg">
                              <Loader2 className="h-4 w-4 animate-spin text-orange-500 mr-3" />
                              <div>
                                <p className="text-sm text-white font-medium">Current Activity</p>
                                <p className="text-xs text-gray-400">{currentActivity}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Step-by-step Progress */}
                      <div className="space-y-3">
                        {progress.map((step, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            {getStepIcon(step.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">{getStepName(step.step)}</span>
                                {step.duration_ms && (
                                  <span className="text-xs text-gray-400">{step.duration_ms}ms</span>
                                )}
                              </div>
                              {step.message && (
                                <p className="text-xs text-gray-400 mt-1">{step.message}</p>
                              )}
                              {step.results_count !== undefined && (
                                <p className="text-xs text-gray-400">{step.results_count} results</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <div>
                      <h4 className="text-green-300 font-medium">Orchestration Analysis Complete</h4>
                      <p className="text-gray-400 text-sm">
                        Completed in {orchestrationResult.processingTimeMs}ms with {orchestrationResult.extractedIocs?.length || 0} IOCs analyzed
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Threat Level:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getThreatLevelColor(orchestrationResult.threatAssessment?.threat_level)}`}>
                        {orchestrationResult.threatAssessment?.threat_level || 'UNKNOWN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Script Language:</span>
                      <span className="ml-2 text-white">{orchestrationResult.scriptLanguage || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-red-300 font-medium">Orchestration Failed</h4>
                      <p className="text-red-400 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'threats' && orchestrationResult && (
            <div className="space-y-6">
              {/* Threat Assessment Summary */}
              {orchestrationResult.threatAssessment && (
                <div className="bg-soc-dark-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Threat Assessment</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`px-3 py-2 rounded-lg border font-semibold ${getThreatLevelColor(orchestrationResult.threatAssessment.threat_level)}`}>
                        {orchestrationResult.threatAssessment.threat_level}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Threat Level</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{orchestrationResult.threatAssessment.risk_score}%</div>
                      <p className="text-xs text-gray-400">Risk Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{orchestrationResult.threatAssessment.malicious_iocs}/{orchestrationResult.threatAssessment.total_iocs}</div>
                      <p className="text-xs text-gray-400">Malicious IOCs</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{orchestrationResult.threatAssessment.threat_families?.length || 0}</div>
                      <p className="text-xs text-gray-400">Threat Families</p>
                    </div>
                  </div>
                  {orchestrationResult.threatAssessment.threat_families?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm mb-2">Identified Threat Families:</p>
                      <div className="flex flex-wrap gap-2">
                        {orchestrationResult.threatAssessment.threat_families.map((family: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                            {family}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IOCs Analysis */}
              {orchestrationResult.extractedIocs && orchestrationResult.extractedIocs.length > 0 && (
                <div className="bg-soc-dark-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4">Extracted IOCs ({orchestrationResult.extractedIocs.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {orchestrationResult.extractedIocs.map((ioc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-soc-dark-900 p-3 rounded">
                        <div>
                          <span className="text-white font-mono text-sm">{ioc.value}</span>
                          <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">{ioc.type}</span>
                        </div>
                        <span className="text-xs text-gray-400">{ioc.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scripts' && orchestrationResult?.generatedScripts && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Generated Automation Scripts</span>
                </h4>
                <span className="text-sm text-gray-400">Language: {orchestrationResult.scriptLanguage}</span>
              </div>

              {Object.entries(orchestrationResult.generatedScripts).map(([scriptName, scriptData]: [string, any]) => (
                <div key={scriptName} className="bg-soc-dark-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-soc-dark-700">
                    <div>
                      <h5 className="text-white font-medium">{scriptName}</h5>
                      <p className="text-sm text-gray-400">{scriptData.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyScriptToClipboard(scriptData.content)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([scriptData.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = scriptName;
                          a.click();
                        }}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
                        title="Download script"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 text-sm text-gray-300 font-mono bg-black/30 overflow-x-auto">
                    <code>{scriptData.content}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'timeline' && orchestrationResult && (
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Execution Timeline</span>
              </h4>

              {progress.length > 0 && (
                <div className="space-y-3">
                  {progress.map((step, index) => (
                    <div key={index} className="bg-soc-dark-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStepIcon(step.status)}
                          <div>
                            <h5 className="text-white font-medium">{getStepName(step.step)}</h5>
                            {step.timestamp && (
                              <p className="text-xs text-gray-400">{step.timestamp}</p>
                            )}
                          </div>
                        </div>
                        {step.duration_ms && (
                          <span className="text-sm text-gray-400">{step.duration_ms}ms</span>
                        )}
                      </div>
                      {step.results_count !== undefined && (
                        <p className="text-sm text-gray-300 mt-2">{step.results_count} results processed</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-soc-dark-700 bg-soc-dark-800/50">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <ExternalLink className="h-4 w-4" />
            <span>Powered by NVIDIA NAT Agent Toolkit</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-soc-dark-700 hover:bg-soc-dark-600 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrchestrationModal;