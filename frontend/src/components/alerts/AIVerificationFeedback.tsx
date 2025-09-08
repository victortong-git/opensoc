import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bot,
  User,
  Star,
  Target,
  Shield,
  Trash2
} from 'lucide-react';
import { Alert } from '../../types';
import alertService from '../../services/alertService';

interface AIVerificationFeedbackProps {
  alert: Alert;
  onFeedbackSubmit?: (feedbackData: any) => void;
}

interface FeedbackData {
  securityEventTypeCorrect?: boolean;
  eventTagsCorrect?: boolean;
  riskAssessmentCorrect?: boolean;
  recommendedActionsCorrect?: boolean;
  overallConfidence: number;
  correctedSecurityEventType?: string;
  correctedEventTags?: string[];
  comments?: string;
}

const AIVerificationFeedback: React.FC<AIVerificationFeedbackProps> = ({
  alert,
  onFeedbackSubmit
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    overallConfidence: 5,
    comments: ''
  });
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const hasAIAnalysis = alert.aiAnalysis || 
                        alert.securityEventType !== 'pending' || 
                        (alert.eventTags && alert.eventTags.length > 0) ||
                        alert.aiClassification;
  
  const hasExistingFeedback = alert.humanReviewStatus && alert.humanReviewStatus !== 'pending';
  const canProvideLabels = true; // Always allow human labeling for training data

  const handleQuickFeedback = (isCorrect: boolean) => {
    const quickFeedback = {
      securityEventTypeCorrect: isCorrect,
      eventTagsCorrect: isCorrect,
      riskAssessmentCorrect: isCorrect,
      recommendedActionsCorrect: isCorrect,
      overallConfidence: isCorrect ? 8 : 3,
      comments: isCorrect ? 'AI analysis appears correct' : 'AI analysis needs review'
    };
    
    console.log('🎯 Quick feedback generated:', quickFeedback);
    setFeedbackData(quickFeedback);
    onFeedbackSubmit?.(quickFeedback);
  };

  const handleDetailedSubmit = () => {
    console.log('🎯 Detailed feedback generated:', feedbackData);
    onFeedbackSubmit?.(feedbackData);
    setShowFeedbackForm(false);
  };

  const handleClearFeedback = async () => {
    setIsClearing(true);
    try {
      console.log('🗑️ Clearing feedback for alert:', alert.id);
      await alertService.clearAIFeedback(alert.id);
      
      // Update the alert in the parent component by triggering a re-fetch
      // This should reset the UI to show no feedback exists
      window.location.reload(); // Simple approach - could be improved with proper state management
      
    } catch (error: any) {
      console.error('Failed to clear feedback:', error);
      alert('Failed to clear feedback: ' + error.message);
    } finally {
      setIsClearing(false);
      setShowClearConfirmation(false);
    }
  };

  const handleClearConfirm = () => {
    setShowClearConfirmation(true);
  };

  const handleClearCancel = () => {
    setShowClearConfirmation(false);
  };

  const getFeedbackStatusIcon = () => {
    if (!hasExistingFeedback) return null;
    
    switch (alert.humanReviewStatus) {
      case 'reviewed':
        return <CheckCircle2 className="w-4 h-4 text-yellow-400" />;
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  // Only show component when AI analysis exists
  if (!hasAIAnalysis) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-opensoc-600/10 to-purple-600/10 border border-opensoc-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h4 className="text-lg font-semibold text-opensoc-300 flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Accuracy Review by User</span>
            {getFeedbackStatusIcon()}
          </h4>
          {!hasExistingFeedback ? (
            <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30 animate-pulse">
              🎯 Training Data Needed
            </span>
          ) : (
            <span className="px-2 py-1 bg-green-600/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
              ✅ Labeled for Training
            </span>
          )}
        </div>
        
        {hasExistingFeedback && (
          <div className="text-xs text-gray-400">
            Reviewed by {alert.reviewerUserName || 'SOC Analyst'} • {alert.feedbackTimestamp && new Date(alert.feedbackTimestamp).toLocaleString()}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm text-blue-300">
          <Shield className="w-4 h-4" />
          <span className="font-medium">🔒 100% Local & Private</span>
        </div>
        <p className="text-xs text-blue-200 mt-1 ml-6">
          Your feedback is stored locally in this system's database for AI model fine-tuning. No data is sent to external servers or third parties.
        </p>
      </div>

      {/* Quick Feedback Buttons */}
      {!hasExistingFeedback && (
        <div className="bg-soc-dark-900/30 rounded-lg border border-opensoc-500/20 p-4">
          <p className="text-sm text-gray-300 mb-3">Is the AI analysis correct?</p>
          <div className="flex space-x-3">
            <button
              onClick={() => handleQuickFeedback(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg border border-green-500/30 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Correct</span>
            </button>
            <button
              onClick={() => handleQuickFeedback(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-colors"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Incorrect</span>
            </button>
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-opensoc-600/20 hover:bg-opensoc-600/30 text-opensoc-400 rounded-lg border border-opensoc-500/30 transition-colors"
            >
              <Star className="w-4 h-4" />
              <span>Detailed Review</span>
            </button>
          </div>
        </div>
      )}

      {/* Existing Feedback Display */}
      {hasExistingFeedback && alert.aiClassificationFeedback && (
        <div className="bg-soc-dark-900/30 rounded-lg border border-opensoc-500/20 p-4">
          <h5 className="font-medium text-opensoc-300 mb-3 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>User Feedback</span>
          </h5>
          
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div className="flex items-center space-x-2">
              {alert.aiClassificationFeedback.securityEventTypeCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-gray-300">Event Type Classification</span>
            </div>
            <div className="flex items-center space-x-2">
              {alert.aiClassificationFeedback.eventTagsCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-gray-300">Event Tags</span>
            </div>
            <div className="flex items-center space-x-2">
              {alert.aiClassificationFeedback.riskAssessmentCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-gray-300">Risk Assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              {alert.aiClassificationFeedback.recommendedActionsCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-gray-300">Recommended Actions</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>Confidence: {alert.aiClassificationFeedback.overallConfidence}/10</span>
            <span>Status: {alert.humanReviewStatus}</span>
          </div>

          {alert.aiClassificationFeedback.comments && (
            <div className="mt-3 p-3 bg-soc-dark-700/50 rounded border-l-2 border-opensoc-500">
              <p className="text-sm text-gray-300">{alert.aiClassificationFeedback.comments}</p>
            </div>
          )}

          {/* Clear Data Label Button */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={handleClearConfirm}
              disabled={isClearing}
              className="flex items-center space-x-2 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 disabled:bg-gray-600/20 text-yellow-400 disabled:text-gray-500 rounded-lg border border-yellow-500/30 disabled:border-gray-500/30 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Clearing...' : 'Clear Data Label'}</span>
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Remove this feedback to allow re-labeling
            </p>
          </div>
        </div>
      )}

      {/* Detailed Feedback Form */}
      {showFeedbackForm && (
        <div className="bg-soc-dark-900/30 rounded-lg border border-opensoc-500/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-opensoc-300">
              Detailed AI Analysis Review
            </h5>
            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 text-xs rounded border border-yellow-500/30">
              Improves AI Training
            </span>
          </div>
          
          
          <div className="space-y-4">
            {/* Security Event Type Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Security Event Type: {alert.securityEventType}
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, securityEventTypeCorrect: true }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.securityEventTypeCorrect === true
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Correct</span>
                </button>
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, securityEventTypeCorrect: false }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.securityEventTypeCorrect === false
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Incorrect</span>
                </button>
              </div>
            </div>

            {/* Event Tags Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Tags: {alert.eventTags?.map(tag => tag.tag).join(', ') || 'None'}
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, eventTagsCorrect: true }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.eventTagsCorrect === true
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Correct</span>
                </button>
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, eventTagsCorrect: false }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.eventTagsCorrect === false
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Incorrect</span>
                </button>
              </div>
            </div>

            {/* Risk Assessment Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Assessment: {alert.aiAnalysis?.riskAssessment?.level || 'None'}
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, riskAssessmentCorrect: true }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.riskAssessmentCorrect === true
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Correct</span>
                </button>
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, riskAssessmentCorrect: false }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.riskAssessmentCorrect === false
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Incorrect</span>
                </button>
              </div>
            </div>

            {/* Recommended Actions Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recommended Actions: {alert.aiAnalysis?.recommendedActions ? 
                  `${alert.aiAnalysis.recommendedActions.immediate?.length || 0} immediate, ${alert.aiAnalysis.recommendedActions.followUp?.length || 0} follow-up` : 'None'}
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, recommendedActionsCorrect: true }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.recommendedActionsCorrect === true
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Correct</span>
                </button>
                <button
                  onClick={() => setFeedbackData(prev => ({ ...prev, recommendedActionsCorrect: false }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    feedbackData.recommendedActionsCorrect === false
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Incorrect</span>
                </button>
              </div>
            </div>

            {/* Overall Confidence Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Overall Confidence in Human Assessment (1-10): {feedbackData.overallConfidence}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={feedbackData.overallConfidence}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, overallConfidence: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={feedbackData.comments}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Provide specific feedback on what was wrong or additional context..."
                className="w-full px-3 py-2 bg-soc-dark-700 border border-gray-600 rounded-md text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleDetailedSubmit}
                className="px-4 py-2 bg-opensoc-600 hover:bg-opensoc-700 text-white rounded-lg transition-colors"
              >
                Submit Feedback
              </button>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Progress Footer */}
      <div className="mt-4 pt-3 border-t border-opensoc-500/20">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <Target className="w-3 h-3" />
            <span>Help improve AI accuracy</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Status:</span>
            <span className={`font-medium ${
              hasExistingFeedback ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {hasExistingFeedback ? 'Labeled' : 'Unlabeled'}
            </span>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-800 rounded-lg border border-opensoc-500/30 p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-opensoc-300">Clear Data Label</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to clear the existing feedback? This will remove your previous classification and allow you to re-label this alert.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleClearFeedback}
                disabled={isClearing}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? 'Clearing...' : 'Clear Label'}</span>
              </button>
              <button
                onClick={handleClearCancel}
                disabled={isClearing}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVerificationFeedback;