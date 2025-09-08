import React from 'react';
import {
  Clock,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  Play
} from 'lucide-react';

interface AutomationSummaryProps {
  executionTimeline?: any[];
  automationRecommendations?: any;
  threatAssessment?: any;
  processingTimeMs?: number;
}

const AutomationSummary: React.FC<AutomationSummaryProps> = ({
  executionTimeline,
  automationRecommendations,
  threatAssessment,
  processingTimeMs
}) => {
  const getRecommendationIcon = (action: string) => {
    if (action.toLowerCase().includes('isolate') || action.toLowerCase().includes('block')) {
      return <Shield className="h-4 w-4 text-red-400" />;
    }
    if (action.toLowerCase().includes('monitor') || action.toLowerCase().includes('scan')) {
      return <Eye className="h-4 w-4 text-blue-400" />;
    }
    return <Zap className="h-4 w-4 text-orange-400" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-soc-dark-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Automation Executive Summary</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center bg-soc-dark-900 p-4 rounded">
            <div className="text-2xl font-bold text-white">{processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : 'N/A'}</div>
            <p className="text-xs text-gray-400">Processing Time</p>
          </div>
          <div className="text-center bg-soc-dark-900 p-4 rounded">
            <div className="text-2xl font-bold text-green-400">{executionTimeline?.filter(step => step.status === 'completed').length || 0}</div>
            <p className="text-xs text-gray-400">Steps Completed</p>
          </div>
          <div className="text-center bg-soc-dark-900 p-4 rounded">
            <div className={`inline-flex px-3 py-1 rounded text-sm font-medium ${getPriorityColor(automationRecommendations?.automation_priority)}`}>
              {automationRecommendations?.automation_priority || 'Unknown'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Automation Priority</p>
          </div>
          <div className="text-center bg-soc-dark-900 p-4 rounded">
            <div className="text-2xl font-bold text-white">
              {threatAssessment?.threat_level || 'UNKNOWN'}
            </div>
            <p className="text-xs text-gray-400">Threat Level</p>
          </div>
        </div>
      </div>

      {/* Immediate Actions */}
      {automationRecommendations?.immediate_actions && automationRecommendations.immediate_actions.length > 0 && (
        <div className="bg-soc-dark-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <span>Immediate Actions Required</span>
          </h4>
          <div className="space-y-2">
            {automationRecommendations.immediate_actions.map((action: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-soc-dark-900 rounded border-l-4 border-l-orange-500">
                {getRecommendationIcon(action)}
                <span className="text-gray-300 text-sm">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Script Execution Order */}
      {automationRecommendations?.script_execution_order && automationRecommendations.script_execution_order.length > 0 && (
        <div className="bg-soc-dark-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Play className="h-5 w-5 text-green-400" />
            <span>Recommended Execution Order</span>
          </h4>
          <div className="space-y-2">
            {automationRecommendations.script_execution_order.map((scriptName: string, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-soc-dark-900 rounded">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <span className="text-white font-mono text-sm">{scriptName}</span>
                <span className="text-xs text-gray-400">Priority {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Timeline */}
      {executionTimeline && executionTimeline.length > 0 && (
        <div className="bg-soc-dark-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Execution Timeline</span>
          </h4>
          <div className="space-y-3">
            {executionTimeline.map((step: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-soc-dark-900 rounded">
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : step.status === 'failed' ? (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium capitalize">{step.step.replace(/_/g, ' ')}</span>
                    {step.duration_ms && (
                      <span className="text-xs text-gray-400">{step.duration_ms}ms</span>
                    )}
                  </div>
                  {step.timestamp && (
                    <p className="text-xs text-gray-400">{step.timestamp}</p>
                  )}
                  {step.results_count !== undefined && (
                    <p className="text-xs text-blue-300">{step.results_count} results</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Recommendations */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-medium mb-2">Automation Safety Guidelines</h4>
            <div className="text-yellow-400 text-sm space-y-1">
              <p>• All scripts require manual review before production execution</p>
              <p>• Test in isolated environment first to validate functionality</p>
              <p>• Ensure proper backup and rollback procedures are available</p>
              <p>• Monitor script execution progress and verify expected outcomes</p>
              <p>• Maintain audit logs of all automated actions performed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationSummary;