import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert } from '../../types';
import alertService from '../../services/alertService';
import { useAnalysisWorkflow } from './analysis/useAnalysisWorkflow';
import AnalysisStepsDisplay from './analysis/AnalysisStepsDisplay';
import CompletionSummaryModal from './analysis/CompletionSummaryModal';

interface OneClickAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  onAnalysisComplete: (updatedAlert: Alert) => void;
}

const OneClickAnalysisModal: React.FC<OneClickAnalysisModalProps> = ({
  isOpen,
  onClose,
  alert,
  onAnalysisComplete
}) => {
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  
  const {
    steps,
    isProcessing,
    overallProgress,
    resetAnalysis,
    startAnalysis,
    retryStep,
    continueFromStep,
    getTimingMetrics
  } = useAnalysisWorkflow(alert);

  // Reset modal state when opening (but don't auto-start analysis)
  useEffect(() => {
    if (isOpen) {
      // Only reset modal UI state, not analysis workflow
      setShowCompletionSummary(false);
      setShowCloseWarning(false);
      // Manual reset call removed to prevent auto-start
      console.log('🎯 OneClickAnalysis Modal opened - waiting for user to manually start');
    }
  }, [isOpen]); // Removed resetAnalysis dependency

  const handleResetAnalysis = () => {
    resetAnalysis();
    console.log('🔄 Manual reset triggered by user');
  };

  const handleStartAnalysis = async () => {
    console.log('🚀 User manually started One Click Analysis');
    const success = await startAnalysis();
    
    if (success) {
      // Fetch updated alert data
      const updatedAlert = await alertService.getAlert(alert!.id);
      onAnalysisComplete(updatedAlert);
      
      // Show completion summary
      setShowCompletionSummary(true);
    }
  };

  const handleRetryStep = async (stepIndex: number) => {
    const retrySuccess = await retryStep(stepIndex);
    
    if (retrySuccess) {
      // After successful retry, continue with remaining steps automatically
      const hasMoreSteps = stepIndex < steps.length - 1;
      
      if (hasMoreSteps) {
        console.log(`✅ Step ${stepIndex + 1} retry successful, continuing with remaining steps...`);
        const continueSuccess = await continueFromStep(stepIndex + 1);
        
        if (continueSuccess) {
          // All steps completed successfully
          const updatedAlert = await alertService.getAlert(alert!.id);
          onAnalysisComplete(updatedAlert);
          setShowCompletionSummary(true);
        }
      } else {
        // This was the last step, check if all are completed
        if (steps.every(s => s.status === 'completed')) {
          const updatedAlert = await alertService.getAlert(alert!.id);
          onAnalysisComplete(updatedAlert);
          setShowCompletionSummary(true);
        }
      }
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      setShowCloseWarning(true);
      return;
    }
    onClose();
  };

  const handleCompletionClose = () => {
    setShowCompletionSummary(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Play className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">One Click Analysis</h2>
              <p className="text-sm text-slate-400">Sequential AI analysis for comprehensive alert investigation</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-soc-dark-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Manual Start Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Play className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Manual Start Required</p>
                <p className="text-xs text-blue-400 mt-1">
                  Click "Start Analysis" below to begin the AI-powered sequential analysis. 
                  The process will run through Classification, Analysis, and MITRE ATT&CK steps automatically once started.
                </p>
              </div>
            </div>
          </div>

          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">Overall Progress</span>
              <span className="text-sm text-slate-400">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-soc-dark-900 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Analysis Steps */}
          <AnalysisStepsDisplay 
            steps={steps}
            isProcessing={isProcessing}
            onRetryStep={handleRetryStep}
          />

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-soc-dark-700">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Close'}
            </button>
            
            <div className="flex space-x-2">
              {!isProcessing && steps.some(s => s.status !== 'pending') && (
                <button
                  onClick={handleResetAnalysis}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
              
              {!isProcessing && steps.every(s => s.status === 'pending') && (
                <button
                  onClick={handleStartAnalysis}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Analysis</span>
                </button>
              )}
            </div>
            
            {overallProgress === 100 && !showCompletionSummary && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Analysis Complete!</span>
              </div>
            )}
          </div>
        </div>

        {/* Close Warning Modal */}
        {showCloseWarning && isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6 max-w-md">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Analysis in Progress</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    AI analysis is currently running and should not be interrupted. Closing now may result in incomplete analysis.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCloseWarning(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      Continue Analysis
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Force Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Summary Modal */}
        <CompletionSummaryModal
          isOpen={showCompletionSummary}
          onClose={handleCompletionClose}
          steps={steps}
          metrics={getTimingMetrics()}
        />
      </div>
    </div>
  );
};

export default OneClickAnalysisModal;