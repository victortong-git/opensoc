import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, User, ExternalLink, CheckCircle, Activity, FileText } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Incident } from '../../types';
import incidentService from '../../services/incidentService';

interface IncidentDetailsModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onAlertClick?: (alertId: string) => void; // Callback to navigate to alert
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

const getSeverityColor = (severity: number) => {
  switch (severity) {
    case 5: return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 4: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 3: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 2: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 1: return 'text-green-400 bg-green-500/10 border-green-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'investigating': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'contained': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'resolved': return 'text-green-400 bg-green-500/10 border-green-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident: initialIncident,
  isOpen,
  onClose,
  onAlertClick
}) => {
  const [incident, setIncident] = useState(initialIncident);
  const [loading, setLoading] = useState(false);
  const [relatedAlerts, setRelatedAlerts] = useState<any[]>([]);

  // Fetch fresh incident data when modal opens
  useEffect(() => {
    if (isOpen && initialIncident.id) {
      fetchIncidentDetails();
    }
  }, [isOpen, initialIncident.id]);

  const fetchIncidentDetails = async () => {
    setLoading(true);
    try {
      const freshIncident = await incidentService.getIncident(initialIncident.id);
      setIncident(freshIncident);
      
      // Extract related alerts if available
      if ('relatedAlerts' in freshIncident && (freshIncident as any).relatedAlerts) {
        setRelatedAlerts((freshIncident as any).relatedAlerts);
      }
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = (alertId: string) => {
    if (onAlertClick) {
      onAlertClick(alertId);
      onClose(); // Close the incident modal when navigating to alert
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">{incident.title}</h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(incident.severity)}`}>
                  Severity {incident.severity}
                </span>
                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(incident.status)}`}>
                  {incident.status?.toUpperCase()}
                </span>
                {incident.category && (
                  <span className="text-xs text-slate-400 bg-slate-500/10 border border-slate-500/30 px-2 py-1 rounded">
                    {incident.category.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-opensoc-400 mx-auto"></div>
                <p className="text-slate-400 mt-2">Loading incident details...</p>
              </div>
            )}

            {!loading && (
              <>
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Incident Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300">Created</label>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span>{safeFormatDistance(incident.createdAt)}</span>
                      </div>
                    </div>

                    {incident.assignedToName && (
                      <div>
                        <label className="text-sm font-medium text-slate-300">Assigned To</label>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <User className="h-4 w-4" />
                          <span>{incident.assignedToName}</span>
                        </div>
                      </div>
                    )}

                    {incident.resolvedAt && (
                      <div>
                        <label className="text-sm font-medium text-slate-300">Resolved</label>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>{safeFormatDistance(incident.resolvedAt)}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-slate-300">Alert Count</label>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{incident.alertCount || 0} alert{incident.alertCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {incident.description && (
                    <div>
                      <label className="text-sm font-medium text-slate-300">Description</label>
                      <div className="mt-1 text-slate-400 whitespace-pre-wrap bg-soc-dark-800 border border-soc-dark-700 rounded p-3">
                        {incident.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Related Alerts */}
                {relatedAlerts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <span>Related Alerts ({relatedAlerts.length})</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {relatedAlerts.map((alert: any) => (
                        <div
                          key={alert.id}
                          className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4 hover:bg-soc-dark-750 transition-colors cursor-pointer"
                          onClick={() => handleAlertClick(alert.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-white hover:text-opensoc-400">
                                  {alert.title}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(alert.severity)}`}>
                                  Severity {alert.severity}
                                </span>
                                <span className="text-xs text-slate-400 bg-slate-500/10 border border-slate-500/30 px-2 py-1 rounded">
                                  {alert.status?.toUpperCase()}
                                </span>
                              </div>
                              
                              {alert.description && (
                                <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                                  {alert.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                <span>{alert.sourceSystem}</span>
                                {alert.assetName && <span>Asset: {alert.assetName}</span>}
                                <span>{safeFormatDistance(alert.eventTime)}</span>
                              </div>
                            </div>
                            
                            <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {incident.metadata && Object.keys(incident.metadata).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span>Additional Information</span>
                    </h3>
                    
                    <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4">
                      {incident.metadata.responseplan && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300">Response Plan</label>
                          <div className="mt-1 text-slate-400 whitespace-pre-wrap">
                            {incident.metadata.responseplan}
                          </div>
                        </div>
                      )}
                      
                      {incident.metadata.impactAssessment && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300">Impact Assessment</label>
                          <div className="mt-1 text-slate-400 whitespace-pre-wrap">
                            {incident.metadata.impactAssessment}
                          </div>
                        </div>
                      )}
                      
                      {incident.metadata.investigationPlan && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300">Investigation Plan</label>
                          <div className="mt-1 text-slate-400 whitespace-pre-wrap">
                            {incident.metadata.investigationPlan}
                          </div>
                        </div>
                      )}
                      
                      {incident.metadata.containmentStrategy && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300">Containment Strategy</label>
                          <div className="mt-1 text-slate-400 whitespace-pre-wrap">
                            {incident.metadata.containmentStrategy}
                          </div>
                        </div>
                      )}
                      
                      {incident.metadata.estimatedTimeline && (
                        <div>
                          <label className="text-sm font-medium text-slate-300">Estimated Timeline</label>
                          <div className="mt-1 text-slate-400">
                            {incident.metadata.estimatedTimeline}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline Events */}
                {incident.timeline && incident.timeline.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      <span>Timeline</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {incident.timeline.map((event: any, index: number) => (
                        <div key={event.id || index} className="flex space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 mt-2 bg-opensoc-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white">{event.title}</h4>
                              <span className="text-xs text-slate-500">
                                {safeFormatDistance(event.timestamp)}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                            )}
                            {event.userName && (
                              <p className="text-xs text-slate-500 mt-1">by {event.userName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700 bg-soc-dark-950 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsModal;