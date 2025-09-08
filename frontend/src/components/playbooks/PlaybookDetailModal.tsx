import React from 'react';
import { 
  X,
  Play,
  Edit,
  Clock,
  Bot,
  User,
  Sparkles,
  Search
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import RecordId from '../common/RecordId';

interface PlaybookDetailModalProps {
  playbook: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (playbook: any) => void;
  onEnhance?: (playbook: any) => void;
  onReview?: (playbook: any) => void;
}

const PlaybookDetailModal: React.FC<PlaybookDetailModalProps> = ({ 
  playbook, 
  isOpen, 
  onClose, 
  onEdit,
  onEnhance,
  onReview
}) => {
  if (!isOpen || !playbook) return null;

  // Safe date parsing helper
  const safeParseDate = (dateValue: string | Date): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      try {
        return parseISO(dateValue);
      } catch {
        return new Date(dateValue);
      }
    }
    return new Date();
  };

  // Safe date formatting helper
  const safeFormatDistance = (dateValue: string | Date): string => {
    try {
      const parsedDate = safeParseDate(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-opensoc-500/20 rounded-lg">
                <Play className="h-6 w-6 text-opensoc-400" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h2 className="text-xl font-semibold text-white">{playbook.name}</h2>
                  <RecordId type="playbook" id={playbook.id} variant="badge" showPrefix={true} />
                </div>
                <p className="text-sm text-slate-400">{playbook.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">Playbook Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${playbook.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {playbook.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trigger Type:</span>
                    <span className="text-white capitalize">{playbook.triggerType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="text-white capitalize">{playbook.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white">{safeFormatDistance(playbook.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">Performance Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Success Rate:</span>
                    <span className="text-white font-medium">{playbook.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Executions:</span>
                    <span className="text-white font-medium">{playbook.executionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg. Duration:</span>
                    <span className="text-white font-medium">{Math.floor(playbook.averageExecutionTime / 60)}m {playbook.averageExecutionTime % 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Execution:</span>
                    <span className="text-white">{playbook.lastExecutedAt ? safeFormatDistance(playbook.lastExecutedAt) : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Steps */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Execution Steps ({playbook.steps.length})</h3>
              <div className="space-y-3">
                {playbook.steps.map((step: any, index: number) => (
                  <div key={step.id ? step.id : `step-${index}`} className="bg-soc-dark-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-opensoc-400 font-medium">#{index + 1}</span>
                        {step.type === 'automated' ? (
                          <Bot className="h-4 w-4 text-green-400" />
                        ) : (
                          <User className="h-4 w-4 text-blue-400" />
                        )}
                        <span className="text-white font-medium">{step.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${step.type === 'automated' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {step.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{Math.floor(step.timeout / 60)}m {step.timeout % 60}s timeout</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">{step.description}</p>
                    {step.config && Object.keys(step.config).length > 0 && (
                      <div className="bg-soc-dark-700/50 p-2 rounded text-xs font-mono text-slate-400">
                        Config: {JSON.stringify(step.config, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Triggers and Conditions */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Triggers & Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-soc-dark-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Trigger Conditions</h4>
                  {playbook.triggerConditions && playbook.triggerConditions.length > 0 ? (
                    <div className="space-y-1">
                      {playbook.triggerConditions.map((condition: any, index: number) => (
                        <div key={index} className="text-xs font-mono text-opensoc-300 bg-soc-dark-700/50 p-2 rounded">
                          {condition.field} {condition.operator} {condition.value}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No specific conditions defined</p>
                  )}
                </div>

                <div className="bg-soc-dark-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Execution Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Auto Execute:</span>
                      <span className="text-white">{playbook.autoExecute ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Retry Count:</span>
                      <span className="text-white">{playbook.retryCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timeout:</span>
                      <span className="text-white">{Math.floor(playbook.timeout / 60)}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Executions */}
            {playbook.executionHistory && playbook.executionHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Recent Executions</h3>
                <div className="space-y-2">
                  {playbook.executionHistory.slice(0, 5).map((execution: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg text-sm">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${execution.status === 'completed' ? 'bg-green-400' : execution.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-white">Execution #{execution.id}</span>
                        <span className="text-slate-400">{safeFormatDistance(execution.startedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${execution.status === 'completed' ? 'bg-green-500/20 text-green-400' : execution.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {execution.status}
                        </span>
                        <span className="text-slate-400">{execution.duration}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {playbook.tags && playbook.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {playbook.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-opensoc-600/20 text-opensoc-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6 pt-6 border-t border-soc-dark-700">
            <div className="flex space-x-3">
              {onEnhance && (
                <button 
                  onClick={() => onEnhance(playbook)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Enhance with AI</span>
                </button>
              )}
              {onReview && (
                <button 
                  onClick={() => onReview(playbook)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>AI Review</span>
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
              <button 
                onClick={() => onEdit(playbook)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button className="btn-primary flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span>Execute Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookDetailModal;