import React, { useState } from 'react';
import { 
  X,
  Bot,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  Target
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'decision';
  estimatedTime: number;
  isRequired: boolean;
}

interface AIGeneratedPlaybook {
  id: string;
  name: string;
  description: string;
  category: 'incident_response' | 'threat_hunting' | 'vulnerability_management' | 'compliance';
  severity: number;
  confidence: number;
  steps: PlaybookStep[];
  triggers: string[];
  generatedBy: string;
  generatedAt: Date;
  status: 'draft' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
}

interface PlaybookReviewModalProps {
  playbook: AIGeneratedPlaybook;
  onClose: () => void;
  onReview: (playbook: AIGeneratedPlaybook, action: 'approve' | 'reject', notes: string) => void;
}

const PlaybookReviewModal: React.FC<PlaybookReviewModalProps> = ({ playbook, onClose, onReview }) => {
  const [reviewNotes, setReviewNotes] = useState(playbook.reviewNotes || '');

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'incident_response': return <Shield className="h-4 w-4 text-red-400" />;
      case 'threat_hunting': return <Target className="h-4 w-4 text-purple-400" />;
      case 'vulnerability_management': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'compliance': return <CheckCircle className="h-4 w-4 text-blue-400" />;
      default: return <Bot className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/20';
      case 1: return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'automated': return <Bot className="h-4 w-4 text-green-400" />;
      case 'manual': return <User className="h-4 w-4 text-blue-400" />;
      case 'decision': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <Bot className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleReview = (action: 'approve' | 'reject') => {
    onReview(playbook, action, reviewNotes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-opensoc-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Review AI-Generated Playbook</h2>
              <p className="text-slate-400 text-sm">{playbook.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Playbook Overview */}
            <div className="space-y-4">
              <div className="card !p-4">
                <h3 className="text-lg font-medium text-white mb-3">Playbook Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 text-sm">Category:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {getCategoryIcon(playbook.category)}
                      <span className="text-white capitalize">{playbook.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">AI Confidence:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-soc-dark-700 rounded-full h-2">
                        <div 
                          className="bg-opensoc-500 h-2 rounded-full" 
                          style={{ width: `${playbook.confidence}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{playbook.confidence}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Severity:</span>
                    <div className={`inline-flex px-2 py-1 rounded text-xs mt-1 ${getSeverityColor(playbook.severity)}`}>
                      SEV {playbook.severity}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Generated:</span>
                    <p className="text-white">{safeFormatDistance(playbook.generatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="card !p-4">
                <h3 className="text-lg font-medium text-white mb-3">Description</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{playbook.description}</p>
              </div>

              <div className="card !p-4">
                <h3 className="text-lg font-medium text-white mb-3">Triggers</h3>
                <div className="space-y-2">
                  {playbook.triggers.map((trigger, index) => (
                    <div key={index} className="bg-soc-dark-800 px-3 py-2 rounded font-mono text-sm text-opensoc-300">
                      {trigger}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Execution Steps */}
            <div className="space-y-4">
              <div className="card !p-4">
                <h3 className="text-lg font-medium text-white mb-3">Execution Steps ({playbook.steps.length})</h3>
                <div className="space-y-3">
                  {playbook.steps.map((step, index) => (
                    <div key={step.id ? step.id : `step-${index}`} className="bg-soc-dark-800/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-opensoc-400 font-medium text-sm">#{index + 1}</span>
                          {getStepTypeIcon(step.type)}
                          <span className="text-white font-medium text-sm">{step.name}</span>
                          {step.isRequired && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Required</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{step.estimatedTime}m</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs">{step.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-soc-dark-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Total Estimated Time:</span>
                    <span className="text-white font-medium">
                      {playbook.steps.reduce((acc, step) => acc + step.estimatedTime, 0)} minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 card !p-4">
            <h3 className="text-lg font-medium text-white mb-3">Review Notes</h3>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add your review notes, suggestions, or modifications..."
              className="input-field w-full h-24 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-between p-6 border-t border-soc-dark-700">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <div className="flex space-x-3">
            <button 
              onClick={() => handleReview('reject')}
              className="btn-danger"
            >
              Reject
            </button>
            <button 
              onClick={() => handleReview('approve')}
              className="btn-primary"
            >
              Approve & Deploy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookReviewModal;