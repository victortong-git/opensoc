import React from 'react';
import { X, CheckCircle, Clock, Zap, Star, AlertCircle } from 'lucide-react';
import { AnalysisStep, TimingMetrics } from './AnalysisTypes';
import { formatDuration, getTotalManualTime, getTotalAITime } from './TimingCalculations';

interface CompletionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: AnalysisStep[];
  metrics: TimingMetrics;
}

const CompletionSummaryModal: React.FC<CompletionSummaryModalProps> = ({
  isOpen,
  onClose,
  steps,
  metrics
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Analysis Complete!</h2>
              <p className="text-sm text-slate-400">Your comprehensive AI analysis has finished successfully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-soc-dark-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Total Analysis Time</p>
                  <p className="text-lg font-semibold text-white">
                    {metrics.totalAnalysisStartTime && metrics.totalAnalysisEndTime 
                      ? formatDuration(metrics.totalAnalysisEndTime - metrics.totalAnalysisStartTime)
                      : '0s'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-slate-400">Time Saved</p>
                  <p className="text-lg font-semibold text-green-400">
                    {metrics.totalTimeSaved.toFixed(1)} min
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-400">Efficiency Gain</p>
                  <p className="text-lg font-semibold text-purple-400">
                    {metrics.efficiencyImprovement.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Step-by-Step Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-soc-dark-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Analysis Step</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">AI Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Manual Baseline</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Time Saved</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <tr key={step.id} className="border-b border-soc-dark-800/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{step.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-blue-400 font-mono">
                          {step.actualDuration ? formatDuration(step.actualDuration) : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {step.manualBaseline} min
                        </td>
                        <td className="py-4 px-4 text-green-400 font-semibold">
                          {step.timeSaved ? `${step.timeSaved.toFixed(1)} min` : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          {step.status === 'completed' ? (
                            <div className="flex items-center space-x-2 text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Success</span>
                            </div>
                          ) : step.status === 'error' ? (
                            <div className="flex items-center space-x-2 text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Error</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">Skipped</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Effort Savings Summary */}
          <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-400" />
              <span>Effort Savings Analysis</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-300 mb-2">Manual Analysis Time (Traditional Method)</p>
                <p className="text-2xl font-bold text-white">{getTotalManualTime(steps)} minutes</p>
                <p className="text-sm text-slate-400">({(getTotalManualTime(steps) / 60).toFixed(1)} hours)</p>
              </div>
              <div>
                <p className="text-sm text-slate-300 mb-2">AI Analysis Time (One Click Method)</p>
                <p className="text-2xl font-bold text-green-400">{getTotalAITime(steps).toFixed(1)} minutes</p>
                <p className="text-sm text-slate-400">({(getTotalAITime(steps) / 60).toFixed(2)} hours)</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-green-600/10 rounded-lg">
              <p className="text-lg font-semibold text-green-400">
                🚀 You saved {metrics.totalTimeSaved.toFixed(1)} minutes ({metrics.efficiencyImprovement.toFixed(1)}% improvement)
              </p>
              <p className="text-sm text-slate-300 mt-1">
                This analysis completed {(getTotalManualTime(steps) / Math.max(getTotalAITime(steps), 0.1)).toFixed(1)}x faster than manual methods
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-soc-dark-700">
            <button
              onClick={() => {/* Go back logic would be handled by parent */}}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Back to Analysis
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Close & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionSummaryModal;