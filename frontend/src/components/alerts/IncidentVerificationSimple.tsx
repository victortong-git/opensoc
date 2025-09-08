import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Eye,
  ChevronDown,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Alert } from '../../types';

interface IncidentVerificationProps {
  alert: Alert;
  onUpdate?: () => void;
}

interface IncidentVerificationData {
  isLikelyIncident: boolean;
  confidence: number;
  reasoning: string;
  verificationCriteria: {
    hasReporterInfo: boolean;
    hasTimelineInfo: boolean;
    hasTechnicalDetails: boolean;
    falsePositiveScore: number;
    businessCriticality: string;
  };
  recommendedActions: {
    immediate: string[];
    investigation: string[];
  };
  artifactsToCollect: string[];
  processingTimeMs?: number;
  aiModel?: string;
  verificationTimestamp?: string;
}

const IncidentVerificationSimple: React.FC<IncidentVerificationProps> = ({ alert, onUpdate }) => {
  const [verificationData, setVerificationData] = useState<IncidentVerificationData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Extract verification data from AI analysis if available
    if (alert.aiAnalysis?.incidentVerification) {
      setVerificationData(alert.aiAnalysis.incidentVerification);
    }
  }, [alert.aiAnalysis]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (!verificationData) {
    return null;
  }

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <h4 className="text-lg font-semibold text-opensoc-300 flex items-center space-x-2">
        <Shield className="w-5 h-5" />
        <span>Incident Verification Assessment</span>
      </h4>

      {/* Main Assessment */}
      <div className="bg-soc-dark-900/30 rounded-lg border border-opensoc-500/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              verificationData.isLikelyIncident 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}>
              {verificationData.isLikelyIncident ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h5 className="font-medium text-opensoc-300">
                {verificationData.isLikelyIncident ? 'Likely Incident' : 'Unlikely Incident'}
              </h5>
              <p className="text-sm text-gray-400">
                {verificationData.confidence}% confidence
              </p>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="border-l-2 border-opensoc-500 pl-4 ml-2 mb-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            {verificationData.reasoning}
          </p>
        </div>

        {/* Verification Criteria */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('criteria')}
            className="w-full flex items-center justify-between text-left p-3 rounded-lg bg-soc-dark-700/50 hover:bg-soc-dark-700/70 transition-colors"
          >
            <span className="font-medium text-opensoc-300">Verification Criteria</span>
            {isExpanded('criteria') ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {isExpanded('criteria') && (
            <div className="pl-4 space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  {verificationData.verificationCriteria.hasReporterInfo ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-gray-300">Reporter Information</span>
                </div>
                <div className="flex items-center space-x-2">
                  {verificationData.verificationCriteria.hasTimelineInfo ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-gray-300">Timeline Information</span>
                </div>
                <div className="flex items-center space-x-2">
                  {verificationData.verificationCriteria.hasTechnicalDetails ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-gray-300">Technical Details</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                    verificationData.verificationCriteria.falsePositiveScore <= 3 ? 'bg-red-500 text-white' :
                    verificationData.verificationCriteria.falsePositiveScore <= 6 ? 'bg-yellow-500 text-black' :
                    'bg-green-500 text-white'
                  }`}>
                    {verificationData.verificationCriteria.falsePositiveScore}
                  </div>
                  <span className="text-gray-300">False Positive Score</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-soc-dark-900/50 rounded border-l-2 border-opensoc-500">
                <span className="text-xs text-gray-400">Business Criticality: </span>
                <span className={`text-xs font-medium ${
                  verificationData.verificationCriteria.businessCriticality === 'critical' ? 'text-red-400' :
                  verificationData.verificationCriteria.businessCriticality === 'high' ? 'text-orange-400' :
                  verificationData.verificationCriteria.businessCriticality === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {verificationData.verificationCriteria.businessCriticality}
                </span>
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <button
            onClick={() => toggleSection('actions')}
            className="w-full flex items-center justify-between text-left p-3 rounded-lg bg-soc-dark-700/50 hover:bg-soc-dark-700/70 transition-colors"
          >
            <span className="font-medium text-opensoc-300">Recommended Verification Actions</span>
            {isExpanded('actions') ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {isExpanded('actions') && (
            <div className="pl-4 space-y-3">
              {verificationData.recommendedActions.immediate.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-red-400 mb-2">Immediate Actions</h6>
                  <ul className="space-y-1">
                    {verificationData.recommendedActions.immediate.map((action, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                        <ArrowRight className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationData.recommendedActions.investigation.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-yellow-400 mb-2">Investigation Steps</h6>
                  <ul className="space-y-1">
                    {verificationData.recommendedActions.investigation.map((action, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                        <ArrowRight className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Evidence to Collect */}
          {verificationData.artifactsToCollect.length > 0 && (
            <>
              <button
                onClick={() => toggleSection('evidence')}
                className="w-full flex items-center justify-between text-left p-3 rounded-lg bg-soc-dark-700/50 hover:bg-soc-dark-700/70 transition-colors"
              >
                <span className="font-medium text-opensoc-300">Evidence to Collect</span>
                {isExpanded('evidence') ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded('evidence') && (
                <div className="pl-4">
                  <ul className="space-y-1">
                    {verificationData.artifactsToCollect.map((artifact, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                        <Eye className="w-4 h-4 text-opensoc-500 mt-0.5 flex-shrink-0" />
                        <span>{artifact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Processing Info */}
        {verificationData.processingTimeMs && (
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-4">
            <span>Processing: {verificationData.processingTimeMs}ms</span>
            {verificationData.aiModel && <span>Model: {verificationData.aiModel}</span>}
            {verificationData.verificationTimestamp && (
              <span>Generated: {new Date(verificationData.verificationTimestamp).toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentVerificationSimple;