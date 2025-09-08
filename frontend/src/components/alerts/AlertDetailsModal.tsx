import React, { useState, useEffect } from 'react';
import { X, Server, User, Shield, FileText, ExternalLink, Bot, Clock, CheckCircle, AlertCircle, Eye, Star, Loader2, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { Alert } from '../../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import alertService, { AlertAIAnalysis, AIClassificationResult, AIAnalysisResult } from '../../services/alertService';
import IncidentCreateModal from '../incidents/IncidentCreateModal';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { fetchAlert } from '../../store/alertsAsync';
import { getSecurityEventTypeInfo } from '../../utils/securityEventTypes';

interface AlertDetailsModalProps {
  alert: Alert;
  onClose: () => void;
  onStatusChange: (status: Alert['status']) => void;
  onIncidentClick?: (incidentId: string) => void; // Callback to navigate to incident
}

// Helper function to safely parse dates
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

const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  alert,
  onClose,
  onStatusChange,
  onIncidentClick
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showAIDetails, setShowAIDetails] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AlertAIAnalysis | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  
  // Related incidents state
  const [relatedIncidents, setRelatedIncidents] = useState<any[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  
  // Incident creation success state
  const [incidentCreationSuccess, setIncidentCreationSuccess] = useState<any | null>(null);

  // Load existing AI analysis when modal opens and fetch fresh alert data
  useEffect(() => {
    // Always fetch fresh alert data when modal opens to ensure we have the latest information
    dispatch(fetchAlert(alert.id));
    
    // Load existing AI analysis from current alert prop
    if (alert.aiAnalysis) {
      setAiAnalysis(alert.aiAnalysis);
    }
    
    // Fetch related incidents
    fetchRelatedIncidents();
  }, [alert.id, dispatch]);

  // Fetch related incidents
  const fetchRelatedIncidents = async () => {
    setIncidentsLoading(true);
    setIncidentsError(null);
    
    try {
      const response = await alertService.getAlertIncidents(alert.id);
      
      if (response.success) {
        setRelatedIncidents(response.incidents);
      } else {
        setIncidentsError(response.error || 'Failed to fetch related incidents');
        setRelatedIncidents([]);
      }
    } catch (error) {
      console.error('Failed to fetch related incidents:', error);
      setIncidentsError('Failed to fetch related incidents');
      setRelatedIncidents([]);
    } finally {
      setIncidentsLoading(false);
    }
  };

  // Update AI analysis when alert prop changes (from Redux store updates)
  useEffect(() => {
    if (alert.aiAnalysis) {
      setAiAnalysis(alert.aiAnalysis);
    } else {
      setAiAnalysis(null);
    }
  }, [alert.aiAnalysis]);

  // Handle AI Analysis request
  const handleAIAnalysis = async () => {
    // If analysis exists, show confirmation dialog for re-analysis
    if (aiAnalysis && !aiAnalysisError) {
      const confirmed = window.confirm(
        'This alert already has an AI analysis. Are you sure you want to generate a new analysis? This will replace the existing one.'
      );
      if (!confirmed) {
        return;
      }
    }

    setAiAnalysisLoading(true);
    setAiAnalysisError(null);

    try {
      const response = await alertService.analyzeAlert(alert.id);
      if (response.success && response.analysis) {
        setAiAnalysis(response.analysis);
        
        // Refresh the alert data in Redux store to ensure persistence
        // This fetches the latest alert data (including AI analysis) from the API
        // and updates both selectedAlert and the alerts list
        await dispatch(fetchAlert(alert.id));
      } else {
        // Only show error message, no fallback analysis
        setAiAnalysisError(response.error || 'AI Service is not available. Please try again later.');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiAnalysisError('AI Service is not available. Please try again later.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Handle incident creation success
  const handleIncidentCreated = (incident: any) => {
    console.log('Incident created successfully:', incident);
    
    // Set success state for showing notification
    setIncidentCreationSuccess(incident);
    
    // Update alert status to investigating if not already
    if (alert.status === 'new') {
      onStatusChange('investigating');
    }
    
    // Refresh related incidents to include the new one
    fetchRelatedIncidents();
    
    // Clear success notification after 5 seconds
    setTimeout(() => {
      setIncidentCreationSuccess(null);
    }, 5000);
  };

  // Handle incident click navigation
  const handleIncidentClick = (incidentId: string) => {
    if (onIncidentClick) {
      onIncidentClick(incidentId);
      onClose(); // Close alert modal when navigating to incident
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (confidence >= 75) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (confidence >= 60) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };
  

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 4: return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 3: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 2: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-red-400 bg-red-500/20';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/20';
      case 'resolved': return 'text-green-400 bg-green-500/20';
      case 'false_positive': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg border text-lg font-bold ${getSeverityColor(alert.severity)}`}>
              SEV {alert.severity}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{alert.title}</h2>
              <p className="text-sm text-slate-400">Alert ID: {alert.id}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Alert Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Alert Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={alert.status}
                    onChange={(e) => onStatusChange(e.target.value as Alert['status'])}
                    className={`px-2 py-1 rounded text-sm font-medium border-0 ${getStatusColor(alert.status)}`}
                  >
                    <option value="new">New</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>

                {/* Security Event Type */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Event Type:</span>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const eventTypeInfo = getSecurityEventTypeInfo(alert.securityEventType || 'pending');
                      const Icon = eventTypeInfo.icon;
                      return (
                        <>
                          <Icon className="h-4 w-4 text-opensoc-400" />
                          <span 
                            className={`px-2 py-1 rounded text-xs border font-medium ${eventTypeInfo.color} ${eventTypeInfo.bgColor} ${eventTypeInfo.borderColor}`}
                            title={`${eventTypeInfo.description} (${eventTypeInfo.category})`}
                          >
                            {eventTypeInfo.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Source System:</span>
                  <span className="text-white font-medium">{alert.sourceSystem}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Event Time:</span>
                  <span className="text-white font-mono">
                    {safeParseDate(alert.eventTime).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Age:</span>
                  <span className="text-white">
                    {safeFormatDistance(alert.eventTime)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Agent:</span>
                  <span className="text-opensoc-400">{alert.assignedAgent}</span>
                </div>
              </div>
            </div>

            {/* Asset Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Affected Asset</h3>
              
              <div className="p-4 bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Server className="h-5 w-5 text-opensoc-400" />
                  <span className="font-medium text-white">{alert.assetName}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset ID:</span>
                    <span className="text-white font-mono">{alert.assetId}</span>
                  </div>
                  
                  <button className="w-full text-left text-opensoc-400 hover:text-opensoc-300 flex items-center justify-between">
                    <span>View Asset Details</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Description</h3>
            <p className="text-slate-300 leading-relaxed">{alert.description}</p>
          </div>



          {/* AI Analysis Error */}
          {aiAnalysisError && !aiAnalysis && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-red-400" />
                  <span>AI Analysis</span>
                </h3>
              </div>
              
              <div className="bg-soc-dark-800/50 border border-red-500/20 rounded-lg p-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Analysis Error</span>
                  </div>
                  <p className="text-sm text-slate-300">{aiAnalysisError}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {aiAnalysis && (
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
                  <button
                    onClick={() => setShowAIDetails(!showAIDetails)}
                    className="btn-secondary text-sm px-3 py-1 flex items-center space-x-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{showAIDetails ? 'Hide Details' : 'View Details'}</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
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
                        <div className={`text-sm font-medium border px-2 py-1 rounded ${getRiskLevelColor(aiAnalysis.riskAssessment.level)}`}>
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
                        <div className={`text-sm font-medium border px-2 py-1 rounded ${getConfidenceColor(aiAnalysis.confidence)}`}>
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

                    {/* Security Event Type Classification */}
                    {aiAnalysis.securityEventType && aiAnalysis.securityEventType !== 'pending' && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Security Event Classification</h4>
                        <div className="bg-soc-dark-900/50 p-3 rounded border">
                          <div className="flex items-center space-x-2 mb-2">
                            {(() => {
                              const eventTypeInfo = getSecurityEventTypeInfo(aiAnalysis.securityEventType);
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
                          {aiAnalysis.securityEventTypeReasoning && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {aiAnalysis.securityEventTypeReasoning}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enrichment Data Integration */}
                    {alert.enrichmentData && Object.keys(alert.enrichmentData).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Threat Intelligence</h4>
                        <div className="bg-soc-dark-900/30 p-3 rounded border space-y-3">
                          {alert.enrichmentData.mitreTactics && (
                            <div>
                              <span className="text-xs font-medium text-slate-400">MITRE ATT&CK Tactics:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {alert.enrichmentData.mitreTactics.map((tactic: string, index: number) => (
                                  <span key={index} className="px-2 py-0.5 bg-opensoc-500/20 text-opensoc-300 rounded text-xs">
                                    {tactic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {alert.enrichmentData.iocMatches && alert.enrichmentData.iocMatches.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-slate-400">IOC Matches:</span>
                              <div className="mt-1 space-y-1">
                                {alert.enrichmentData.iocMatches.map((ioc: string, index: number) => (
                                  <div key={index} className="flex items-center space-x-2 text-xs">
                                    <AlertCircle className="h-3 w-3 text-red-400" />
                                    <span className="font-mono text-red-400">{ioc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {alert.enrichmentData.riskScore && (
                            <div>
                              <span className="text-xs font-medium text-slate-400">Pre-analysis Risk Score:</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex-1 bg-soc-dark-700 rounded-full h-1">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-1 rounded-full"
                                    style={{ width: `${alert.enrichmentData.riskScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-white font-medium">{alert.enrichmentData.riskScore}/100</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                              <CheckCircle className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Details */}
                    {showAIDetails && (
                      <div className="space-y-4 pt-4 border-t border-soc-dark-700">
                        {/* Evidence Used */}
                        <div>
                          <span className="text-sm font-medium text-slate-400 mb-2 block">Evidence Analyzed:</span>
                          <div className="space-y-1">
                            <div className="flex items-start space-x-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">Alert severity level and source system reputation</span>
                            </div>
                            <div className="flex items-start space-x-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">Raw event data and system behavior patterns</span>
                            </div>
                            <div className="flex items-start space-x-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">Asset criticality and historical incident data</span>
                            </div>
                            {alert.enrichmentData?.iocMatches && (
                              <div className="flex items-start space-x-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-300">Threat intelligence IOC matches and reputation data</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Analysis Metadata */}
                        <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-soc-dark-700">
                          <span>
                            Generated: {new Date(aiAnalysis.analysisTimestamp).toLocaleString()}
                          </span>
                          <span>Analysis Type: Alert Classification</span>
                        </div>
                      </div>
                    )}

                    {aiAnalysis.note && (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <p className="text-xs text-yellow-300">{aiAnalysis.note}</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Raw Event Data */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Raw Event Data</h3>
            <div className="bg-soc-dark-950 border border-soc-dark-700 rounded-lg p-4">
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(alert.rawData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Related Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Alert created</p>
                    <p className="text-xs text-slate-400">{safeParseDate(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Assigned to {alert.assignedAgent}</p>
                    <p className="text-xs text-slate-400">{safeParseDate(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {alert.status !== 'new' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-white">Status updated to {alert.status}</p>
                      <p className="text-xs text-slate-400">{safeParseDate(alert.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Creation Success Notification */}
            {incidentCreationSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-400">Incident Created Successfully!</h4>
                      <p className="text-sm text-green-300 mt-1">
                        {incidentCreationSuccess.title}
                      </p>
                      <p className="text-xs text-green-400/70 mt-1">
                        ID: {incidentCreationSuccess.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleIncidentClick(incidentCreationSuccess.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View Incident</span>
                    </button>
                    <button
                      onClick={() => setIncidentCreationSuccess(null)}
                      className="text-green-400 hover:text-green-300 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Related Incidents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <span>Related Incidents</span>
                  {relatedIncidents.length > 0 && (
                    <span className="text-sm text-slate-400">({relatedIncidents.length})</span>
                  )}
                </h3>
                
                {incidentsLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>

              {incidentsError ? (
                <div className="text-center py-6 text-slate-400 bg-soc-dark-800 border border-soc-dark-700 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <p className="text-sm">{incidentsError}</p>
                  <button 
                    onClick={fetchRelatedIncidents}
                    className="mt-2 text-xs text-opensoc-400 hover:text-opensoc-300"
                  >
                    Retry
                  </button>
                </div>
              ) : relatedIncidents.length === 0 && !incidentsLoading ? (
                <div className="text-center py-6 text-slate-400 bg-soc-dark-800 border border-soc-dark-700 rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm">No incidents have been created from this alert yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Create an incident to track this alert's investigation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {relatedIncidents.map((incident: any) => (
                    <div
                      key={incident.id}
                      onClick={() => handleIncidentClick(incident.id)}
                      className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4 hover:bg-soc-dark-750 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-white group-hover:text-opensoc-400 transition-colors">
                              {incident.title}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded border ${
                              incident.severity >= 4 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                              incident.severity >= 3 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                              'text-green-400 bg-green-500/10 border-green-500/30'
                            }`}>
                              Severity {incident.severity}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded border ${
                              incident.status === 'resolved' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                              incident.status === 'investigating' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                              'text-red-400 bg-red-500/10 border-red-500/30'
                            }`}>
                              {incident.status?.toUpperCase()}
                            </span>
                          </div>
                          
                          {incident.description && (
                            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                              {incident.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span>{safeFormatDistance(incident.createdAt)}</span>
                            {incident.assignedToName && <span>Assigned: {incident.assignedToName}</span>}
                            {incident.category && <span>{incident.category.replace('_', ' ')}</span>}
                          </div>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-opensoc-400 transition-colors flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowIncidentModal(true)}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Create Incident</span>
                </button>
                
                <button 
                  onClick={handleAIAnalysis}
                  disabled={aiAnalysisLoading}
                  className={`btn-secondary w-full flex items-center justify-center space-x-2 ${aiAnalysisLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={aiAnalysis && !aiAnalysisError ? 'Generate new AI analysis (will replace existing)' : 'Generate AI analysis'}
                >
                  {aiAnalysisLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span>
                    {aiAnalysisLoading 
                      ? 'Analyzing...' 
                      : aiAnalysis && !aiAnalysisError 
                        ? 'Re-analyze' 
                        : 'AI Analysis'
                    }
                  </span>
                </button>
                
                {/* Analysis timestamp display */}
                {alert.aiAnalysisTimestamp && aiAnalysis && !aiAnalysisError && (
                  <div className="text-xs text-slate-400 text-center mt-1">
                    Last analyzed: {safeFormatDistance(alert.aiAnalysisTimestamp)}
                  </div>
                )}
                
                <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Assign to Me</span>
                </button>
                
                <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>View in SIEM</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Incident Creation Modal */}
      <IncidentCreateModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSuccess={handleIncidentCreated}
        alertId={alert.id}
      />
    </div>
  );
};

export default AlertDetailsModal;