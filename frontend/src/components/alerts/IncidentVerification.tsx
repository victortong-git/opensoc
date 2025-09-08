import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Target,
  Zap,
  Search,
  ArrowRight,
  Save,
  Loader2,
  Info
} from 'lucide-react';
import { Alert } from '../../types';
import alertService from '../../services/alertService';

interface IncidentVerificationProps {
  alert: Alert;
  onUpdate?: () => void;
}

interface VerificationCriteria {
  initialValidation: {
    hasReporterInfo: boolean;
    hasTimelineInfo: boolean;
    hasLocationInfo: boolean;
    hasTechnicalDetails: boolean;
    assessment: string;
  };
  falsePositiveIndicators: {
    score: number;
    indicators: string[];
    assessment: string;
  };
  impactAssessment: {
    businessCriticality: 'low' | 'medium' | 'high' | 'critical';
    affectedSystems: string[];
    dataAtRisk: string;
    operationalImpact: string;
  };
  technicalValidation: {
    hasValidIOCs: boolean;
    behaviorAnalysis: string;
    networkActivity: string;
    systemChanges: string;
  };
  contextGathering: {
    similarRecentAlerts: boolean;
    knownThreats: string[];
    environmentalFactors: string[];
  };
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

interface ConfirmationDetails {
  isConfirmedIncident?: boolean;
  confirmationStatus: 'pending' | 'confirmed' | 'false_positive' | 'requires_investigation';
  socManagerNotes?: string;
  evidenceCollected?: string[];
  verificationStepsTaken?: string[];
  finalRecommendation?: 'create_incident' | 'continue_monitoring' | 'close_alert';
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
}

const IncidentVerification: React.FC<IncidentVerificationProps> = ({ alert, onUpdate }) => {
  const [verificationData, setVerificationData] = useState<IncidentVerificationData | null>(null);
  const [confirmationDetails, setConfirmationDetails] = useState<ConfirmationDetails>({
    confirmationStatus: 'pending',
    socManagerNotes: '',
    evidenceCollected: [],
    verificationStepsTaken: [],
    finalRecommendation: 'continue_monitoring'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Extract verification data from AI analysis if available
    if (alert.aiAnalysis?.incidentVerification) {
      setVerificationData(alert.aiAnalysis.incidentVerification);
    }

    // Load existing confirmation details if available
    if (alert.incidentConfirmationDetails) {
      setConfirmationDetails(prev => ({
        ...prev,
        ...alert.incidentConfirmationDetails
      }));
    }
  }, [alert]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleSaveConfirmation = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await alertService.updateIncidentConfirmation(alert.id, {
        confirmationDetails: {
          ...confirmationDetails,
          updatedAt: new Date().toISOString()
        }
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to save confirmation details:', error);
      setError('Failed to save confirmation details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'false_positive': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'requires_investigation': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-red-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (!verificationData && !alert.aiAnalysis) {
    return (
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-opensoc-400" />
          <h3 className="text-lg font-semibold text-white">Incident Verification</h3>
        </div>
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">
            Run AI analysis first to get incident verification recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-opensoc-400" />
          <h3 className="text-lg font-semibold text-white">Incident Verification</h3>
        </div>
        
        {verificationData && (
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-slate-400">Incident Likelihood: </span>
              <span className={`font-medium ${getConfidenceColor(verificationData.confidence)}`}>
                {verificationData.confidence}%
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
              verificationData.isLikelyIncident 
                ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                : 'text-green-400 bg-green-500/10 border-green-500/20'
            }`}>
              {verificationData.isLikelyIncident ? 'Likely Incident' : 'Unlikely Incident'}
            </div>
          </div>
        )}
      </div>

      {/* AI Assessment Summary */}
      {verificationData && (
        <div className="mb-6 p-4 bg-soc-dark-800 rounded-lg border border-soc-dark-600">
          <h4 className="text-sm font-medium text-white mb-2">AI Assessment</h4>
          <p className="text-sm text-slate-300">{verificationData.reasoning}</p>
        </div>
      )}

      {/* Verification Criteria */}
      {verificationData?.verificationCriteria && (
        <div className="space-y-4 mb-6">
          {/* Initial Validation */}
          <div className="border border-soc-dark-600 rounded-lg">
            <button
              onClick={() => toggleSection('initial')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-soc-dark-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-white">Initial Validation</span>
              </div>
              <ArrowRight className={`h-4 w-4 text-slate-400 transform transition-transform ${
                expandedSections.has('initial') ? 'rotate-90' : ''
              }`} />
            </button>
            {expandedSections.has('initial') && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    {verificationData.verificationCriteria.initialValidation.hasReporterInfo ? 
                      <CheckCircle className="h-4 w-4 text-green-400" /> : 
                      <XCircle className="h-4 w-4 text-red-400" />
                    }
                    <span className="text-slate-300">Reporter Information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {verificationData.verificationCriteria.initialValidation.hasTimelineInfo ? 
                      <CheckCircle className="h-4 w-4 text-green-400" /> : 
                      <XCircle className="h-4 w-4 text-red-400" />
                    }
                    <span className="text-slate-300">Timeline Information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {verificationData.verificationCriteria.initialValidation.hasLocationInfo ? 
                      <CheckCircle className="h-4 w-4 text-green-400" /> : 
                      <XCircle className="h-4 w-4 text-red-400" />
                    }
                    <span className="text-slate-300">Location Information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {verificationData.verificationCriteria.initialValidation.hasTechnicalDetails ? 
                      <CheckCircle className="h-4 w-4 text-green-400" /> : 
                      <XCircle className="h-4 w-4 text-red-400" />
                    }
                    <span className="text-slate-300">Technical Details</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 bg-soc-dark-900 rounded p-3">
                  {verificationData.verificationCriteria.initialValidation.assessment}
                </p>
              </div>
            )}
          </div>

          {/* False Positive Analysis */}
          <div className="border border-soc-dark-600 rounded-lg">
            <button
              onClick={() => toggleSection('falsePositive')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-soc-dark-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-green-400" />
                <span className="font-medium text-white">False Positive Analysis</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  verificationData.verificationCriteria.falsePositiveIndicators.score <= 3 ? 'bg-red-500/20 text-red-400' :
                  verificationData.verificationCriteria.falsePositiveIndicators.score <= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  Score: {verificationData.verificationCriteria.falsePositiveIndicators.score}/10
                </span>
              </div>
              <ArrowRight className={`h-4 w-4 text-slate-400 transform transition-transform ${
                expandedSections.has('falsePositive') ? 'rotate-90' : ''
              }`} />
            </button>
            {expandedSections.has('falsePositive') && (
              <div className="px-4 pb-4 space-y-3">
                {verificationData.verificationCriteria.falsePositiveIndicators.indicators.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-white">Indicators:</span>
                    <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
                      {verificationData.verificationCriteria.falsePositiveIndicators.indicators.map((indicator, index) => (
                        <li key={index}>{indicator}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-slate-400 bg-soc-dark-900 rounded p-3">
                  {verificationData.verificationCriteria.falsePositiveIndicators.assessment}
                </p>
              </div>
            )}
          </div>

          {/* Impact Assessment */}
          <div className="border border-soc-dark-600 rounded-lg">
            <button
              onClick={() => toggleSection('impact')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-soc-dark-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-orange-400" />
                <span className="font-medium text-white">Impact Assessment</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  verificationData.verificationCriteria.impactAssessment.businessCriticality === 'critical' ? 'bg-red-500/20 text-red-400' :
                  verificationData.verificationCriteria.impactAssessment.businessCriticality === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  verificationData.verificationCriteria.impactAssessment.businessCriticality === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {verificationData.verificationCriteria.impactAssessment.businessCriticality}
                </span>
              </div>
              <ArrowRight className={`h-4 w-4 text-slate-400 transform transition-transform ${
                expandedSections.has('impact') ? 'rotate-90' : ''
              }`} />
            </button>
            {expandedSections.has('impact') && (
              <div className="px-4 pb-4 space-y-3 text-sm">
                {verificationData.verificationCriteria.impactAssessment.affectedSystems.length > 0 && (
                  <div>
                    <span className="font-medium text-white">Affected Systems:</span>
                    <p className="text-slate-300 mt-1">
                      {verificationData.verificationCriteria.impactAssessment.affectedSystems.join(', ')}
                    </p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-white">Data at Risk:</span>
                  <p className="text-slate-300 mt-1">
                    {verificationData.verificationCriteria.impactAssessment.dataAtRisk}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-white">Operational Impact:</span>
                  <p className="text-slate-300 mt-1">
                    {verificationData.verificationCriteria.impactAssessment.operationalImpact}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {verificationData?.recommendedVerificationActions && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <Zap className="h-4 w-4 text-yellow-400 mr-2" />
            Recommended Verification Actions
          </h4>
          <div className="grid gap-4">
            {verificationData.recommendedVerificationActions.immediate.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="text-sm font-medium text-red-400">Immediate Actions:</span>
                <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
                  {verificationData.recommendedVerificationActions.immediate.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {verificationData.recommendedVerificationActions.investigation.length > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="text-sm font-medium text-blue-400">Investigation Actions:</span>
                <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
                  {verificationData.recommendedVerificationActions.investigation.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOC Manager Confirmation */}
      <div className="border-t border-soc-dark-600 pt-6">
        <h4 className="text-sm font-medium text-white mb-4 flex items-center">
          <User className="h-4 w-4 text-opensoc-400 mr-2" />
          SOC Manager Confirmation
        </h4>
        
        <div className="space-y-4">
          {/* Confirmation Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Verification Status
            </label>
            <select
              value={confirmationDetails.confirmationStatus}
              onChange={(e) => setConfirmationDetails(prev => ({
                ...prev,
                confirmationStatus: e.target.value as any
              }))}
              className="input-field w-full"
            >
              <option value="pending">Pending Review</option>
              <option value="confirmed">Confirmed Incident</option>
              <option value="false_positive">False Positive</option>
              <option value="requires_investigation">Requires Further Investigation</option>
            </select>
          </div>

          {/* SOC Manager Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes & Assessment
            </label>
            <textarea
              value={confirmationDetails.socManagerNotes}
              onChange={(e) => setConfirmationDetails(prev => ({
                ...prev,
                socManagerNotes: e.target.value
              }))}
              className="input-field w-full h-24 resize-none"
              placeholder="Add your assessment notes, additional findings, or recommendations..."
            />
          </div>

          {/* Final Recommendation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Recommended Action
            </label>
            <select
              value={confirmationDetails.finalRecommendation}
              onChange={(e) => setConfirmationDetails(prev => ({
                ...prev,
                finalRecommendation: e.target.value as any
              }))}
              className="input-field w-full"
            >
              <option value="continue_monitoring">Continue Monitoring</option>
              <option value="create_incident">Create Incident Record</option>
              <option value="close_alert">Close Alert</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveConfirmation}
              disabled={isSaving}
              className="btn-primary flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Confirmation</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-3">
              {error}
            </div>
          )}

          {/* Status Display */}
          {confirmationDetails.confirmationStatus !== 'pending' && (
            <div className={`p-3 rounded-lg border ${getStatusColor(confirmationDetails.confirmationStatus)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Status: {confirmationDetails.confirmationStatus.replace('_', ' ').toUpperCase()}
                </span>
                {confirmationDetails.updatedAt && (
                  <span className="text-xs text-slate-400">
                    Updated {new Date(confirmationDetails.updatedAt).toLocaleDateString()}
                    {confirmationDetails.updatedByName && ` by ${confirmationDetails.updatedByName}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentVerification;