import React from 'react';
import {
  FileText,
  Bot,
  AlertCircle,
  Eye,
  Loader2,
  Zap,
  Shield,
  Play,
  Settings,
  Trash2
} from 'lucide-react';
import { Alert } from '../../types';

export interface AlertSidebarActionsProps {
  alert: Alert;
  // Form management props
  isEditing: boolean;
  updating: boolean;
  // Action handlers
  handleEditToggle: () => void;
  handleEditSave: () => Promise<void>;
  setShowIncidentModal: (show: boolean) => void;
  setShowOneClickAnalysisModal: (show: boolean) => void;
  // AI Analysis handlers
  handleAIClassification: () => Promise<void>;
  handleAnalyzeAlert: () => Promise<void>;
  handleMitreAnalysis: () => Promise<void>;
  handleGenerateImmediatePlaybook: () => Promise<void>;
  handleGenerateInvestigationPlaybook: () => Promise<void>;
  // Orchestration handlers
  handleOrchestrationAnalysis: () => Promise<void>;
  handleMCPOrchestrationAnalysis: () => Promise<void>;
  setShowOrchestrationModal: (show: boolean) => void;
  setShowOrchestrationMCPModal: (show: boolean) => void;
  // AI state props
  aiClassificationLoading: boolean;
  aiClassificationError: string | null;
  setAiClassificationError: (error: string | null) => void;
  aiLoading: boolean;
  aiError: string | null;
  setAiError: (error: string | null) => void;
  mitreAnalysisLoading: boolean;
  mitreAnalysisError: string | null;
  setMitreAnalysisError: (error: string | null) => void;
  immediatePlaybookLoading: boolean;
  investigationPlaybookLoading: boolean;
  playbookError: string | null;
  setPlaybookError: (error: string | null) => void;
  // Orchestration state props
  orchestrationLoading: boolean;
  orchestrationError: string | null;
  setOrchestrationError: (error: string | null) => void;
  // MCP Orchestration state props
  orchestrationMCPLoading: boolean;
  orchestrationMCPError: string | null;
  setOrchestrationMCPError: (error: string | null) => void;
  // Delete functionality
  onDeleteAlert?: () => void;
}

/**
 * Alert Sidebar Actions Component
 * Contains all action buttons and controls for the alert detail sidebar
 */
const AlertSidebarActions: React.FC<AlertSidebarActionsProps> = ({
  alert,
  isEditing,
  updating,
  handleEditToggle,
  handleEditSave,
  setShowIncidentModal,
  setShowOneClickAnalysisModal,
  handleAIClassification,
  handleAnalyzeAlert,
  handleMitreAnalysis,
  handleGenerateImmediatePlaybook,
  handleGenerateInvestigationPlaybook,
  handleOrchestrationAnalysis,
  handleMCPOrchestrationAnalysis,
  setShowOrchestrationModal,
  setShowOrchestrationMCPModal,
  aiClassificationLoading,
  aiClassificationError,
  setAiClassificationError,
  aiLoading,
  aiError,
  setAiError,
  mitreAnalysisLoading,
  mitreAnalysisError,
  setMitreAnalysisError,
  immediatePlaybookLoading,
  investigationPlaybookLoading,
  playbookError,
  setPlaybookError,
  orchestrationLoading,
  orchestrationError,
  setOrchestrationError,
  orchestrationMCPLoading,
  orchestrationMCPError,
  setOrchestrationMCPError,
  onDeleteAlert
}) => {
  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
      <div className="space-y-3">
        {!isEditing ? (
          <button 
            onClick={handleEditToggle}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Edit Alert</span>
          </button>
        ) : (
          <div className="bg-soc-dark-900/50 border border-opensoc-500/20 rounded-lg p-3">
            <p className="text-opensoc-400 text-sm text-center mb-2">Edit Mode Active</p>
            <div className="flex space-x-2">
              <button
                onClick={handleEditSave}
                disabled={updating}
                className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleEditToggle}
                className="btn-secondary flex-1 text-sm py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setShowIncidentModal(true)}
          disabled={isEditing}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          <span>Create Incident</span>
        </button>

        {onDeleteAlert && (
          <button 
            onClick={onDeleteAlert}
            disabled={isEditing}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Alert</span>
          </button>
        )}

        {/* One Click Analysis Button */}
        <button 
          onClick={() => setShowOneClickAnalysisModal(true)}
          disabled={isEditing || aiClassificationLoading || aiLoading || mitreAnalysisLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-800 disabled:to-slate-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          title="Run comprehensive AI analysis - Classification, Alert Analysis, and MITRE ATT&CK in sequence"
        >
          <Play className="h-4 w-4" />
          <span>One Click Analysis</span>
        </button>

        {/* Orchestration and Automation (API) Button */}
        <button 
          onClick={() => setShowOrchestrationModal(true)}
          disabled={isEditing || orchestrationLoading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-slate-800 disabled:to-slate-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          title="Advanced AI orchestration with VirusTotal, ThreatFox analysis via NAT HTTP API"
        >
          {orchestrationLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Orchestrating (API)...</span>
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              <span>Orchestration and Automation (API)</span>
            </>
          )}
        </button>

        {/* Orchestration and Automation (MCP) Button */}
        <button 
          onClick={() => setShowOrchestrationMCPModal(true)}
          disabled={isEditing || orchestrationMCPLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          title="Advanced AI orchestration with VirusTotal, ThreatFox analysis via MCP protocol"
        >
          {orchestrationMCPLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Orchestrating (MCP)...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Orchestration and Automation (MCP)</span>
            </>
          )}
        </button>

        {/* Orchestration API Error */}
        {orchestrationError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Orchestration (API) Failed</p>
                <p className="text-xs text-red-400 mt-1">{orchestrationError}</p>
              </div>
            </div>
            <button
              onClick={() => setOrchestrationError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Orchestration MCP Error */}
        {orchestrationMCPError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Orchestration (MCP) Failed</p>
                <p className="text-xs text-red-400 mt-1">{orchestrationMCPError}</p>
              </div>
            </div>
            <button
              onClick={() => setOrchestrationMCPError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-soc-dark-700 my-2"></div>

        {/* AI Classification Button */}
        <button 
          onClick={handleAIClassification}
          disabled={isEditing || aiClassificationLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-800 disabled:to-purple-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          title="Generate AI-powered contextual tags and security event classification"
        >
          {aiClassificationLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Classifying...</span>
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              <span>AI Classification</span>
            </>
          )}
        </button>

        {/* AI Classification Error */}
        {aiClassificationError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Classification Failed</p>
                <p className="text-xs text-red-400 mt-1">{aiClassificationError}</p>
              </div>
            </div>
            <button
              onClick={() => setAiClassificationError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* AI Alert Analysis Button */}
        <button 
          onClick={handleAnalyzeAlert}
          disabled={isEditing || aiLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-800 disabled:to-indigo-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          title="Generate comprehensive AI-powered analysis and insights for this alert"
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Alert...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>AI Alert Analysis</span>
            </>
          )}
        </button>

        {/* AI Alert Analysis Error */}
        {aiError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">AI Analysis Failed</p>
                <p className="text-xs text-red-400 mt-1">{aiError}</p>
              </div>
            </div>
            <button
              onClick={() => setAiError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MITRE ATT&CK Analysis Button */}
        <button 
          onClick={handleMitreAnalysis}
          disabled={isEditing || mitreAnalysisLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          title="Analyze alert using multi-domain MITRE ATT&CK framework (Enterprise, Mobile, ICS) with AI enrichment"
        >
          {mitreAnalysisLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing MITRE ATT&CK...</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>MITRE ATT&CK Analysis</span>
            </>
          )}
        </button>

        {/* MITRE Analysis Error */}
        {mitreAnalysisError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">MITRE Analysis Failed</p>
                <p className="text-xs text-red-400 mt-1">{mitreAnalysisError}</p>
              </div>
            </div>
            <button
              onClick={() => setMitreAnalysisError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* AI Analysis Requirement Warning */}
        {!alert?.aiAnalysis && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-300 font-medium">AI Analysis Required</p>
                <p className="text-xs text-yellow-400 mt-1">
                  Run "AI Alert Analysis" first to enable playbook generation. Playbooks use AI analysis as context input.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Immediate Playbook Button */}
        <button 
          onClick={handleGenerateImmediatePlaybook}
          disabled={isEditing || immediatePlaybookLoading || !alert?.aiAnalysis}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            isEditing || immediatePlaybookLoading || !alert?.aiAnalysis 
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-60 border border-slate-500' 
              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
          }`}
          title={!alert?.aiAnalysis ? "Requires AI analysis - click 'AI Alert Analysis' first" : "Generate immediate action playbook for urgent containment steps"}
        >
          {immediatePlaybookLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Generate Immediate Playbook</span>
              {!alert?.aiAnalysis && (
                <span className="text-xs opacity-75">(Requires AI Analysis)</span>
              )}
            </>
          )}
        </button>

        {/* Generate Investigation Playbook Button */}
        <button 
          onClick={handleGenerateInvestigationPlaybook}
          disabled={isEditing || investigationPlaybookLoading || !alert?.aiAnalysis}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            isEditing || investigationPlaybookLoading || !alert?.aiAnalysis 
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-60 border border-slate-500' 
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
          }`}
          title={!alert?.aiAnalysis ? "Requires AI analysis - click 'AI Alert Analysis' first" : "Generate investigation playbook for detailed forensic procedures"}
        >
          {investigationPlaybookLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>Generate Investigation Playbook</span>
              {!alert?.aiAnalysis && (
                <span className="text-xs opacity-75">(Requires AI Analysis)</span>
              )}
            </>
          )}
        </button>

        {/* Playbook Generation Error */}
        {playbookError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Playbook Generation Failed</p>
                <p className="text-xs text-red-400 mt-1">{playbookError}</p>
              </div>
            </div>
            <button
              onClick={() => setPlaybookError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertSidebarActions;