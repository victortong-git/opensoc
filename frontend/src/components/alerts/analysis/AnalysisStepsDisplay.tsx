import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AnalysisStep } from './AnalysisTypes';
import { formatDuration } from './TimingCalculations';

interface AnalysisStepsDisplayProps {
  steps: AnalysisStep[];
  isProcessing: boolean;
  onRetryStep: (stepIndex: number) => void;
}

const AnalysisStepsDisplay: React.FC<AnalysisStepsDisplayProps> = ({
  steps,
  isProcessing,
  onRetryStep
}) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="border border-soc-dark-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.status === 'completed' ? 'bg-green-600' :
                  step.status === 'running' ? 'bg-blue-600' :
                  step.status === 'error' ? 'bg-red-600' :
                  'bg-soc-dark-700'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : step.status === 'running' ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Icon className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">{step.name}</h4>
                    {step.status === 'completed' && step.actualDuration && (
                      <span className="text-xs text-green-400 font-mono">
                        {formatDuration(step.actualDuration)}
                      </span>
                    )}
                    {step.status === 'running' && step.startTime && (
                      <span className="text-xs text-blue-400 font-mono">
                        {formatDuration(Date.now() - step.startTime)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {step.status === 'running' ? step.description : 
                     step.status === 'completed' ? `Completed successfully (saved ${step.timeSaved?.toFixed(1) || '0'} min)` :
                     step.status === 'error' ? 'Failed - click retry to try again' :
                     `Manual baseline: ${step.manualBaseline} min`}
                  </p>
                </div>
              </div>
              
              {step.status === 'error' && (
                <button
                  onClick={() => onRetryStep(index)}
                  disabled={isProcessing}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
            
            {/* Step Progress Bar */}
            {step.status === 'running' && (
              <div className="w-full bg-soc-dark-900 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            )}
            
            {/* Error Message */}
            {step.status === 'error' && step.error && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
                {step.error}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnalysisStepsDisplay;