import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Loader, 
  Search, 
  Brain, 
  Wrench,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ProcessStep {
  step: string;
  status: 'starting' | 'complete' | 'error';
  message: string;
  details?: any;
  duration?: number;
  timestamp: string;
}

interface ProcessStepsProps {
  steps: ProcessStep[];
  isProcessing: boolean;
  defaultCollapsed?: boolean;
}

const getStepIcon = (step: string) => {
  switch (step) {
    case 'query_analysis':
      return Target;
    case 'rag_search':
      return Search;
    case 'tool_selection':
      return Wrench;
    case 'ai_generation':
      return Brain;
    default:
      return Circle;
  }
};

const getStepTitle = (step: string) => {
  switch (step) {
    case 'query_analysis':
      return 'Understanding your request';
    case 'rag_search':
      return 'Searching security data';
    case 'tool_selection':
      return 'Choosing analysis tools';
    case 'ai_generation':
      return 'Generating response';
    default:
      return step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'complete':
      return CheckCircle;
    case 'starting':
      return Loader;
    case 'error':
      return AlertCircle;
    default:
      return Circle;
  }
};

const formatDuration = (duration?: number) => {
  if (!duration) return '';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
};

const ProcessSteps: React.FC<ProcessStepsProps> = ({ steps, isProcessing, defaultCollapsed = true }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (steps.length === 0 && !isProcessing) {
    return null;
  }

  const toggleStep = (stepKey: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepKey)) {
      newExpanded.delete(stepKey);
    } else {
      newExpanded.add(stepKey);
    }
    setExpandedSteps(newExpanded);
  };

  // Group steps by step name and keep the latest status for each
  const processedSteps = steps.reduce((acc, step) => {
    const key = step.step;
    if (!acc[key] || new Date(step.timestamp) > new Date(acc[key].timestamp)) {
      acc[key] = step;
    }
    return acc;
  }, {} as Record<string, ProcessStep>);

  const stepOrder = ['query_analysis', 'rag_search', 'tool_selection', 'ai_generation'];
  const orderedSteps = stepOrder
    .map(stepName => processedSteps[stepName])
    .filter(Boolean);

  // Get current activity for compact view
  const getCurrentActivity = () => {
    if (!isProcessing && orderedSteps.length === 0) return null;
    
    const activeStep = orderedSteps.find(step => step.status === 'starting');
    const completedSteps = orderedSteps.filter(step => step.status === 'complete').length;
    const totalSteps = Math.max(orderedSteps.length, isProcessing ? 4 : 0);
    
    if (activeStep) {
      return {
        message: getStepTitle(activeStep.step),
        progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        isActive: true
      };
    } else if (isProcessing) {
      return {
        message: 'Starting analysis',
        progress: 0,
        isActive: true
      };
    } else if (orderedSteps.length > 0) {
      return {
        message: 'Analysis complete',
        progress: 100,
        isActive: false
      };
    }
    return null;
  };

  const currentActivity = getCurrentActivity();

  if (!currentActivity) return null;

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-600 rounded-lg mb-4 text-sm">
      {isCollapsed ? (
        // Compact View (GitHub Copilot Style)
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-soc-dark-600/30 transition-colors cursor-pointer"
        >
          <Brain className="w-4 h-4 text-opensoc-500 flex-shrink-0" />
          
          {currentActivity.isActive && (
            <Loader className="w-3 h-3 animate-spin text-opensoc-500 flex-shrink-0" />
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                🤖 {currentActivity.message}...
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-1 w-full bg-soc-dark-600 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-opensoc-500 to-opensoc-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${currentActivity.progress}%` }}
              />
            </div>
            
            {currentActivity.progress < 100 && (
              <div className="text-xs text-slate-400 mt-1">
                {Math.round(currentActivity.progress)}% complete
              </div>
            )}
          </div>
          
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>
      ) : (
        // Expanded View (Detailed Steps)
        <div className="p-3">
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-full flex items-center gap-2 mb-3 text-left hover:bg-soc-dark-600/30 transition-colors cursor-pointer p-2 -m-2 rounded"
          >
            <Brain className="w-4 h-4 text-opensoc-500" />
            <span className="font-medium text-white">Processing Steps</span>
            {isProcessing && <Loader className="w-3 h-3 animate-spin text-opensoc-500" />}
            <div className="flex-1" />
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          <div className="space-y-2">
            {orderedSteps.map((step, index) => {
              const StepIcon = getStepIcon(step.step);
              const StatusIcon = getStatusIcon(step.status);
              const isStepExpanded = expandedSteps.has(step.step);
              const hasDetails = step.details && Object.keys(step.details).length > 0;

              return (
                <div key={step.step} className="border border-soc-dark-600 rounded-md bg-soc-dark-700/30">
                  <button
                    onClick={() => hasDetails && toggleStep(step.step)}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-soc-dark-600/30 transition-colors ${
                      hasDetails ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StepIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      
                      <StatusIcon 
                        className={`w-4 h-4 flex-shrink-0 ${
                          step.status === 'complete' ? 'text-green-400' : 
                          step.status === 'starting' ? 'text-opensoc-500 animate-spin' :
                          step.status === 'error' ? 'text-red-400' : 'text-slate-500'
                        }`} 
                      />
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {getStepTitle(step.step)}
                          </span>
                          {step.duration && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(step.duration)}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 truncate">
                          {step.message}
                        </div>
                      </div>
                    </div>

                    {hasDetails && (
                      <div className="flex-shrink-0">
                        {isStepExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    )}
                  </button>

                  {isStepExpanded && hasDetails && (
                    <div className="px-3 pb-3 border-t border-soc-dark-600 bg-soc-dark-800/30">
                      <div className="mt-3 space-y-2">
                        {Object.entries(step.details).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="text-xs text-slate-200 bg-soc-dark-700 p-2 rounded border border-soc-dark-600">
                              {Array.isArray(value) ? (
                                <ul className="space-y-1">
                                  {value.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-1">
                                      <span className="w-1 h-1 bg-slate-500 rounded-full flex-shrink-0"></span>
                                      {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                                    </li>
                                  ))}
                                </ul>
                              ) : typeof value === 'object' ? (
                                <pre className="whitespace-pre-wrap text-xs">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <span>{String(value)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessSteps;