import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Wrench
} from 'lucide-react';

interface ToolExecution {
  toolName: string;
  displayName: string;
  category: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: string;
  endTime?: string;
  duration?: number;
  parameters?: Record<string, any>;
  result?: any;
  error?: string;
  confidence?: number;
  reasoning?: string;
}

interface ToolExecutionIndicatorProps {
  executions: ToolExecution[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  showParameters?: boolean;
  showResults?: boolean;
  onParametersToggle?: () => void;
  onResultsToggle?: () => void;
}

const ToolExecutionIndicator: React.FC<ToolExecutionIndicatorProps> = ({
  executions,
  isVisible,
  onToggleVisibility,
  showParameters = false,
  showResults = false,
  onParametersToggle,
  onResultsToggle
}) => {
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);

  if (executions.length === 0) return null;

  // Calculate summary statistics
  const totalExecutions = executions.length;
  const completedExecutions = executions.filter(e => e.status === 'completed').length;
  const runningExecutions = executions.filter(e => e.status === 'running').length;
  const errorExecutions = executions.filter(e => e.status === 'error').length;
  const averageDuration = executions
    .filter(e => e.duration)
    .reduce((sum, e) => sum + (e.duration || 0), 0) / 
    Math.max(1, executions.filter(e => e.duration).length);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-slate-400" />;
      case 'running':
        return <Loader className="h-4 w-4 text-opensoc-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-slate-400';
      case 'running':
        return 'text-opensoc-500';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatParameters = (params?: Record<string, any>) => {
    if (!params) return 'None';
    return Object.entries(params)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  const formatResult = (result?: any) => {
    if (!result) return 'No result';
    if (typeof result === 'string') return result;
    if (typeof result === 'object') {
      // Try to extract meaningful summary
      if (result.success !== undefined) {
        return `Success: ${result.success}${result.summary ? ` - ${result.summary}` : ''}`;
      }
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security_alerts':
        return <AlertTriangle className="h-4 w-4" />;
      case 'incident_management':
        return <CheckCircle className="h-4 w-4" />;
      case 'reporting':
        return <Settings className="h-4 w-4" />;
      case 'context_retrieval':
        return <Eye className="h-4 w-4" />;
      case 'threat_intelligence':
        return <Zap className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg shadow-lg">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-soc-dark-700 transition-colors"
        onClick={onToggleVisibility}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isVisible ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            <Wrench className="h-4 w-4 text-opensoc-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">
              AI Tools Execution
            </h3>
            <p className="text-xs text-slate-400">
              {totalExecutions} tool{totalExecutions !== 1 ? 's' : ''} • 
              {runningExecutions > 0 && ` ${runningExecutions} running •`}
              {` ${completedExecutions} completed`}
              {errorExecutions > 0 && ` • ${errorExecutions} failed`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Summary indicators */}
          {runningExecutions > 0 && (
            <div className="flex items-center space-x-1">
              <Loader className="h-3 w-3 text-opensoc-500 animate-spin" />
              <span className="text-xs text-opensoc-500">{runningExecutions}</span>
            </div>
          )}
          {completedExecutions > 0 && (
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">{completedExecutions}</span>
            </div>
          )}
          {errorExecutions > 0 && (
            <div className="flex items-center space-x-1">
              <XCircle className="h-3 w-3 text-red-400" />
              <span className="text-xs text-red-400">{errorExecutions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isVisible && (
        <div className="border-t border-soc-dark-600">
          {/* Controls */}
          <div className="p-3 bg-soc-dark-900/50 border-b border-soc-dark-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">Avg Duration:</span>
                  <span className="text-white">{formatDuration(averageDuration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">Success Rate:</span>
                  <span className="text-white">
                    {totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onParametersToggle && (
                  <button
                    onClick={onParametersToggle}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      showParameters 
                        ? 'bg-opensoc-600 text-white' 
                        : 'bg-soc-dark-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Params
                  </button>
                )}
                {onResultsToggle && (
                  <button
                    onClick={onResultsToggle}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      showResults 
                        ? 'bg-opensoc-600 text-white' 
                        : 'bg-soc-dark-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Results
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tool Executions List */}
          <div className="max-h-80 overflow-y-auto">
            {executions.map((execution, index) => {
              const isExpanded = expandedExecution === execution.toolName;
              
              return (
                <div 
                  key={`${execution.toolName}-${index}`}
                  className="border-b border-soc-dark-700 last:border-b-0"
                >
                  {/* Tool Execution Header */}
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-soc-dark-700/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedExecution(isExpanded ? null : execution.toolName)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                        )}
                        {getCategoryIcon(execution.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white truncate">
                            {execution.displayName}
                          </span>
                          {execution.confidence && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded">
                              {Math.round(execution.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <span>{execution.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{formatDuration(execution.duration)}</span>
                          {execution.reasoning && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-40">{execution.reasoning}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      <span className={`text-xs ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-3 space-y-3 bg-soc-dark-900/30">
                      {/* Timing */}
                      <div className="text-xs">
                        <span className="text-slate-400">Started:</span>
                        <span className="text-white ml-2">
                          {new Date(execution.startTime).toLocaleTimeString()}
                        </span>
                        {execution.endTime && (
                          <>
                            <span className="text-slate-400 ml-4">Completed:</span>
                            <span className="text-white ml-2">
                              {new Date(execution.endTime).toLocaleTimeString()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Parameters */}
                      {showParameters && execution.parameters && (
                        <div className="text-xs">
                          <span className="text-slate-400">Parameters:</span>
                          <div className="mt-1 p-2 bg-soc-dark-800 rounded text-slate-300 font-mono text-xs overflow-x-auto">
                            {formatParameters(execution.parameters)}
                          </div>
                        </div>
                      )}

                      {/* Result */}
                      {showResults && (execution.result || execution.error) && (
                        <div className="text-xs">
                          <span className="text-slate-400">
                            {execution.error ? 'Error:' : 'Result:'}
                          </span>
                          <div className={`mt-1 p-2 rounded font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto ${
                            execution.error 
                              ? 'bg-red-900/20 text-red-300 border border-red-600/30'
                              : 'bg-soc-dark-800 text-slate-300'
                          }`}>
                            {execution.error || formatResult(execution.result)}
                          </div>
                        </div>
                      )}

                      {/* Reasoning */}
                      {execution.reasoning && (
                        <div className="text-xs">
                          <span className="text-slate-400">AI Reasoning:</span>
                          <div className="mt-1 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-blue-200 text-xs">
                            {execution.reasoning}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 bg-soc-dark-900/50 text-center">
            <p className="text-xs text-slate-400">
              Tool execution powered by gpt-oss • Real-time progress tracking
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolExecutionIndicator;