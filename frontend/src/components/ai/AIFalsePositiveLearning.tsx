import React, { useState } from 'react';
import {
  Bot,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Brain,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Search
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { AIFalsePositiveEvent, FalsePositiveHumanReview } from '../../types';
import { mockFalsePositiveEvents } from '../../data/mockData';

interface AIFalsePositiveLearningProps {
  onReviewSubmit?: (eventId: string, review: Partial<FalsePositiveHumanReview>) => void;
}

const AIFalsePositiveLearning: React.FC<AIFalsePositiveLearningProps> = ({
  onReviewSubmit
}) => {
  const [selectedEvent, setSelectedEvent] = useState<AIFalsePositiveEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);

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
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    humanDecision: 'agree_false_positive' as FalsePositiveHumanReview['humanDecision'],
    confidence: 85,
    reasoning: '',
    feedbackCategory: 'accurate' as FalsePositiveHumanReview['feedbackCategory'],
    suggestedImprovements: '',
    additionalContext: ''
  });

  const events = mockFalsePositiveEvents;
  
  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesStatus = !statusFilter || event.status === statusFilter;
    const matchesAgent = !agentFilter || event.agentName.includes(agentFilter);
    const matchesSearch = !searchTerm || 
      event.eventDetails.alertTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.agentReasoning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventDetails.assetName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesAgent && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'reviewed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'disputed': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'approved': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'true_positive': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'false_positive': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'needs_investigation': return <Eye className="h-4 w-4 text-yellow-400" />;
      default: return <Brain className="h-4 w-4 text-slate-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    if (confidence >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleReviewSubmit = (eventId: string) => {
    const review: Partial<FalsePositiveHumanReview> = {
      ...reviewForm,
      reviewerId: '2', // Current user - would come from auth context
      reviewerName: 'John Smith', // Current user - would come from auth context
      reviewTime: 0, // Would be calculated based on time spent
      reviewedAt: new Date()
    };
    
    if (onReviewSubmit) {
      onReviewSubmit(eventId, review);
    }
    
    setShowReviewForm(false);
    setSelectedEvent(null);
    // Reset form
    setReviewForm({
      humanDecision: 'agree_false_positive',
      confidence: 85,
      reasoning: '',
      feedbackCategory: 'accurate',
      suggestedImprovements: '',
      additionalContext: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">AI False Positive Learning System</h2>
          <p className="text-slate-400 mt-1">
            Review AI agent decisions and provide feedback for continuous model improvement
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-slate-400">
            {events.filter(e => e.status === 'pending_review').length} pending reviews
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-opensoc-400" />
            <div>
              <div className="text-2xl font-bold text-white">{events.length}</div>
              <div className="text-sm text-slate-400">Total Events</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {events.filter(e => e.status === 'pending_review').length}
              </div>
              <div className="text-sm text-slate-400">Pending Review</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-green-400">
                {Math.round(events.filter(e => e.humanReview?.humanDecision === 'agree_false_positive').length / events.filter(e => e.humanReview).length * 100) || 0}%
              </div>
              <div className="text-sm text-slate-400">Agent Accuracy</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {events.filter(e => e.humanReview).reduce((sum, e) => sum + (e.humanReview?.reviewTime || 0), 0) 
                  / Math.max(events.filter(e => e.humanReview).length, 1) / 60 || 0}m
              </div>
              <div className="text-sm text-slate-400">Avg Review Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search events by alert title, reasoning..."
                className="input-field pl-10 pr-4 py-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="disputed">Disputed</option>
              <option value="approved">Approved</option>
            </select>

            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Agents</option>
              <option value="SOC Analyst">SOC Analyst Agent</option>
              <option value="Incident Response">Incident Response Agent</option>
              <option value="Threat Intelligence">Threat Intelligence Agent</option>
            </select>

            <div className="text-sm text-slate-400">
              {filteredEvents.length} events
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-soc-dark-800">
              <tr>
                <th className="table-header">Event Details</th>
                <th className="table-header">AI Decision</th>
                <th className="table-header">Human Review</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-soc-dark-900">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="table-row">
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="font-medium text-white text-sm">
                        {event.eventDetails.alertTitle}
                      </div>
                      <div className="text-xs text-slate-400">
                        {event.eventDetails.assetName} • {event.eventDetails.sourceSystem}
                      </div>
                      <div className="text-xs text-slate-500">
                        {safeFormatDistance(event.eventDetails.eventTime)}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getDecisionIcon(event.agentDecision)}
                        <span className="text-white text-sm capitalize">
                          {event.agentDecision.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Confidence:</span>
                        <span className={`text-xs font-medium ${getConfidenceColor(event.agentConfidence)}`}>
                          {event.agentConfidence.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        by {event.agentName}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {event.humanReview ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {event.humanReview.humanDecision === 'agree_false_positive' && <ThumbsUp className="h-3 w-3 text-green-400" />}
                          {event.humanReview.humanDecision === 'agree_true_positive' && <ThumbsUp className="h-3 w-3 text-green-400" />}
                          {event.humanReview.humanDecision === 'disagree' && <ThumbsDown className="h-3 w-3 text-red-400" />}
                          {event.humanReview.humanDecision === 'needs_more_info' && <MessageCircle className="h-3 w-3 text-yellow-400" />}
                          <span className="text-sm text-white capitalize">
                            {event.humanReview.humanDecision.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-opensoc-400">
                          by {event.humanReview.reviewerName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {Math.floor(event.humanReview.reviewTime / 60)}m review
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No review yet</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!event.humanReview && (
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowReviewForm(true);
                          }}
                          className="btn-primary text-xs px-2 py-1"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && !showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
              <div className="flex items-center space-x-3">
                {getDecisionIcon(selectedEvent.agentDecision)}
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedEvent.eventDetails.alertTitle}</h2>
                  <p className="text-sm text-slate-400">Event ID: {selectedEvent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Decision Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">AI Agent Decision</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Agent:</span>
                      <span className="text-white">{selectedEvent.agentName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Decision:</span>
                      <div className="flex items-center space-x-2">
                        {getDecisionIcon(selectedEvent.agentDecision)}
                        <span className="text-white capitalize">{selectedEvent.agentDecision.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className={`font-medium ${getConfidenceColor(selectedEvent.agentConfidence)}`}>
                        {selectedEvent.agentConfidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-sm">AI Reasoning:</span>
                    <p className="text-white text-sm mt-1 p-3 bg-soc-dark-800/30 rounded border-l-2 border-opensoc-500">
                      {selectedEvent.agentReasoning}
                    </p>
                  </div>
                </div>

                {/* Alert Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Alert Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Severity:</span>
                      <span className={`font-bold ${
                        selectedEvent.eventDetails.alertSeverity >= 4 ? 'text-red-400' :
                        selectedEvent.eventDetails.alertSeverity >= 3 ? 'text-orange-400' :
                        'text-yellow-400'
                      }`}>
                        {selectedEvent.eventDetails.alertSeverity}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Source System:</span>
                      <span className="text-white">{selectedEvent.eventDetails.sourceSystem}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Affected Asset:</span>
                      <span className="text-opensoc-400">{selectedEvent.eventDetails.assetName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Event Time:</span>
                      <span className="text-white text-sm">
                        {selectedEvent.eventDetails.eventTime.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Human Review */}
              {selectedEvent.humanReview && (
                <div className="mt-6 pt-6 border-t border-soc-dark-700">
                  <h3 className="text-lg font-medium text-white mb-4">Human Review</h3>
                  
                  <div className="bg-soc-dark-800/30 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 text-sm">Reviewer Decision:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          {selectedEvent.humanReview.humanDecision === 'agree_false_positive' && <ThumbsUp className="h-4 w-4 text-green-400" />}
                          {selectedEvent.humanReview.humanDecision === 'agree_true_positive' && <ThumbsUp className="h-4 w-4 text-green-400" />}
                          {selectedEvent.humanReview.humanDecision === 'disagree' && <ThumbsDown className="h-4 w-4 text-red-400" />}
                          {selectedEvent.humanReview.humanDecision === 'needs_more_info' && <MessageCircle className="h-4 w-4 text-yellow-400" />}
                          <span className="text-white capitalize">
                            {selectedEvent.humanReview.humanDecision.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-slate-400 text-sm">Reviewer Confidence:</span>
                        <div className={`text-lg font-medium mt-1 ${getConfidenceColor(selectedEvent.humanReview.confidence)}`}>
                          {selectedEvent.humanReview.confidence}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-sm">Human Reasoning:</span>
                      <p className="text-white text-sm mt-1 p-3 bg-soc-dark-800/50 rounded">
                        {selectedEvent.humanReview.reasoning}
                      </p>
                    </div>

                    {selectedEvent.humanReview.suggestedImprovements && (
                      <div>
                        <span className="text-slate-400 text-sm">Suggested Improvements:</span>
                        <p className="text-slate-300 text-sm mt-1 p-3 bg-soc-dark-800/50 rounded">
                          {selectedEvent.humanReview.suggestedImprovements}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Reviewed by {selectedEvent.humanReview.reviewerName}
                      </span>
                      <span className="text-slate-500">
                        {safeFormatDistance(selectedEvent.humanReview.reviewedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
              {!selectedEvent.humanReview && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn-primary"
                >
                  Provide Review
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-soc-dark-700">
              <h2 className="text-xl font-semibold text-white">Review AI Decision</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedEvent.eventDetails.alertTitle}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Decision
                </label>
                <select
                  value={reviewForm.humanDecision}
                  onChange={(e) => setReviewForm({ ...reviewForm, humanDecision: e.target.value as any })}
                  className="input-field w-full"
                >
                  <option value="agree_false_positive">Agree - False Positive</option>
                  <option value="agree_true_positive">Agree - True Positive</option>
                  <option value="disagree">Disagree with AI</option>
                  <option value="needs_more_info">Needs More Information</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confidence Level: {reviewForm.confidence}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={reviewForm.confidence}
                  onChange={(e) => setReviewForm({ ...reviewForm, confidence: Number(e.target.value) })}
                  className="w-full h-2 bg-soc-dark-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Reasoning *
                </label>
                <textarea
                  value={reviewForm.reasoning}
                  onChange={(e) => setReviewForm({ ...reviewForm, reasoning: e.target.value })}
                  className="input-field w-full h-24 resize-none"
                  placeholder="Explain your decision and reasoning..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Feedback Category
                </label>
                <select
                  value={reviewForm.feedbackCategory}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedbackCategory: e.target.value as any })}
                  className="input-field w-full"
                >
                  <option value="accurate">AI analysis was accurate</option>
                  <option value="partially_accurate">AI analysis was partially accurate</option>
                  <option value="inaccurate">AI analysis was inaccurate</option>
                  <option value="missing_context">AI missed important context</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Suggested Improvements (Optional)
                </label>
                <textarea
                  value={reviewForm.suggestedImprovements}
                  onChange={(e) => setReviewForm({ ...reviewForm, suggestedImprovements: e.target.value })}
                  className="input-field w-full h-20 resize-none"
                  placeholder="How can the AI agent improve its analysis?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={reviewForm.additionalContext}
                  onChange={(e) => setReviewForm({ ...reviewForm, additionalContext: e.target.value })}
                  className="input-field w-full h-20 resize-none"
                  placeholder="Any additional context that would help future analysis..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setSelectedEvent(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewSubmit(selectedEvent.id)}
                disabled={!reviewForm.reasoning.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFalsePositiveLearning;