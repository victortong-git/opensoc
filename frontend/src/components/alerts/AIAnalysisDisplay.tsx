import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bot,
  Loader2,
  Shield,
  ExternalLink,
  FileText,
  Star,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Alert } from '../../types';
import { AlertAIAnalysis, AIClassificationResult } from '../../services/alertService';
import { getSecurityEventTypeInfo } from '../../utils/securityEventTypes';

export interface AIAnalysisDisplayProps {
  alert: Alert;
  aiAnalysis: AlertAIAnalysis | null;
  aiClassification: AIClassificationResult | null;
  aiLoading: boolean;
  aiError: string | null;
  aiProgress: number;
  setAiError: (error: string | null) => void;
}

/**
 * AI Analysis Display Component
 * Shows AI analysis results, classification, and loading states
 */
const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  alert,
  aiAnalysis,
  aiClassification,
  aiLoading,
  aiError,
  aiProgress,
  setAiError
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Bot className="h-5 w-5 text-opensoc-400" />
          <span>AI Alert Analysis</span>
        </h3>
        <div className="flex items-center space-x-3">
          {aiAnalysis?.processingTimeMs && (
            <span className="text-xs text-slate-400">
              Generated in {aiAnalysis.processingTimeMs}ms
            </span>
          )}
          {aiLoading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Loader2 className="h-3 w-3 animate-spin text-opensoc-400" />
                <span>Analyzing alert...</span>
                {aiProgress > 0 && <span className="text-xs">({Math.round(aiProgress)}%)</span>}
              </div>
              <div className="w-full bg-soc-dark-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-opensoc-600 to-opensoc-400 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${aiProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-400">
                AI analysis typically takes 15-20 seconds
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Classification Section */}
      {aiClassification && (
        <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">AI Classification</h3>
            <div className="flex items-center space-x-1 text-purple-400">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-xs">Classification Complete</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Security Event Type */}
            {aiClassification.securityEventType && aiClassification.securityEventType !== 'pending' && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Security Event Type</h4>
                <div className="bg-soc-dark-900/50 p-3 rounded border">
                  <div className="flex items-center space-x-2 mb-2">
                    {(() => {
                      const eventTypeInfo = getSecurityEventTypeInfo(aiClassification.securityEventType);
                      const Icon = eventTypeInfo.icon;
                      return (
                        <>
                          <Icon className="h-4 w-4 text-opensoc-400" />
                          <span className={`px-2 py-1 rounded text-xs border font-medium ${eventTypeInfo.color} ${eventTypeInfo.bgColor} ${eventTypeInfo.borderColor}`}>
                            {eventTypeInfo.label}
                          </span>
                          <span className="text-xs text-slate-400">({eventTypeInfo.category})</span>
                        </>
                      );
                    })()}
                  </div>
                  {aiClassification.securityEventTypeReasoning && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiClassification.securityEventTypeReasoning}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Classification Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Confidence</span>
                </div>
                <div className="text-sm font-medium text-purple-300">
                  {aiClassification.overallConfidence}%
                </div>
              </div>

              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="flex items-center space-x-2 mb-1">
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Correlation</span>
                </div>
                <div className={`text-sm font-medium capitalize ${
                  aiClassification.correlationPotential === 'high' ? 'text-red-400' :
                  aiClassification.correlationPotential === 'medium' ? 'text-orange-400' :
                  'text-green-400'
                }`}>
                  {aiClassification.correlationPotential}
                </div>
              </div>

              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-slate-400">Tags</span>
                </div>
                <div className="text-sm font-medium text-green-300">
                  {aiClassification.tagCount || 0}
                </div>
              </div>
            </div>

            {/* Correlation Reasoning */}
            {aiClassification.correlationReasoning && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Correlation Analysis</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-soc-dark-900/30 p-3 rounded border-l-2 border-blue-500">
                  {aiClassification.correlationReasoning}
                </p>
              </div>
            )}

            {/* Processing Info */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-soc-dark-600">
              <span>Classification completed {aiClassification.classificationTimestamp ? formatDistanceToNow(new Date(aiClassification.classificationTimestamp), { addSuffix: true }) : ''}</span>
              <span>Processing: {aiClassification.processingTimeMs}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
        {aiAnalysis ? (
          <div className="space-y-4">
            {/* Analysis Summary */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Summary</h4>
              <p className="text-sm text-slate-200 p-3 bg-soc-dark-900/30 rounded border-l-2 border-opensoc-500">
                {aiAnalysis.summary}
              </p>
            </div>

            {/* Risk Assessment & Confidence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-slate-400">Risk Level</span>
                </div>
                <div className={`text-sm font-medium border px-2 py-1 rounded ${
                  aiAnalysis.riskAssessment.level === 'critical' ? 'text-red-400 bg-red-500/20 border-red-500/30' :
                  aiAnalysis.riskAssessment.level === 'high' ? 'text-orange-400 bg-orange-500/20 border-orange-500/30' :
                  aiAnalysis.riskAssessment.level === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                  'text-green-400 bg-green-500/20 border-green-500/30'
                }`}>
                  {aiAnalysis.riskAssessment.level.toUpperCase()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Score: {aiAnalysis.riskAssessment.score}/10
                </div>
              </div>

              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-slate-400">Confidence</span>
                </div>
                <div className={`text-sm font-medium border px-2 py-1 rounded ${
                  aiAnalysis.confidence >= 90 ? 'text-green-400 bg-green-500/20 border-green-500/30' :
                  aiAnalysis.confidence >= 75 ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                  aiAnalysis.confidence >= 60 ? 'text-orange-400 bg-orange-500/20 border-orange-500/30' :
                  'text-red-400 bg-red-500/20 border-red-500/30'
                }`}>
                  {aiAnalysis.confidence}%
                </div>
                <div className="flex-1 bg-soc-dark-700 rounded-full h-1 mt-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1 rounded-full"
                    style={{ width: `${aiAnalysis.confidence}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-soc-dark-900/50 p-3 rounded border">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Processing</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {aiAnalysis.processingTimeMs || 'N/A'}ms
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Model: {aiAnalysis.aiModel || 'gpt-oss:20b'}
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {aiAnalysis.riskAssessment.factors && aiAnalysis.riskAssessment.factors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Risk Factors</h4>
                <div className="space-y-1">
                  {aiAnalysis.riskAssessment.factors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs">
                      <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Detailed Analysis</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {aiAnalysis.explanation}
              </p>
            </div>

            {/* Recommended Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Immediate Actions</h4>
                <div className="space-y-1">
                  {aiAnalysis.recommendedActions.immediate.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs">
                      <Zap className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Follow-up Actions</h4>
                <div className="space-y-1">
                  {aiAnalysis.recommendedActions.followUp.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs">
                      <FileText className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Metadata */}
            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-soc-dark-700">
              <span>
                Generated: {new Date(aiAnalysis.analysisTimestamp).toLocaleString()}
              </span>
              <span>Analysis Type: Alert Classification</span>
            </div>

            {aiAnalysis.note && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <p className="text-xs text-yellow-300">{aiAnalysis.note}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">No AI Analysis Available</h4>
            
            {aiError ? (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Analysis Failed</span>
                </div>
                <p className="text-sm text-red-300">{aiError}</p>
                <button
                  onClick={() => setAiError(null)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <p className="text-slate-400 mb-4">Click "Analyze Alert" to generate AI insights for this alert.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisDisplay;