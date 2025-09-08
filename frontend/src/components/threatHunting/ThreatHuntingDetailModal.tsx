import React from 'react';
import { X, Eye, Target, Clock, User, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import { ThreatHuntingEvent } from '../../services/threatHuntingService';
import RecordId from '../common/RecordId';
import TestDataChip from '../common/TestDataChip';

interface ThreatHuntingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ThreatHuntingEvent | null;
}

const ThreatHuntingDetailModal: React.FC<ThreatHuntingDetailModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!isOpen || !event) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'text-blue-400 bg-blue-500/20';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getHuntingTypeIcon = (type: string) => {
    switch (type) {
      case 'proactive': return <Target className="h-4 w-4" />;
      case 'reactive': return <AlertTriangle className="h-4 w-4" />;
      case 'intel_driven': return <BarChart3 className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-opensoc-500/20 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-opensoc-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-xl font-bold text-white">{event.name}</h2>
                <RecordId type="hunt" id={event.id} variant="inline" />
                {event.isTestData && <TestDataChip size="sm" />}
              </div>
              <p className="text-slate-400 text-sm">Threat hunting event details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getHuntingTypeIcon(event.huntingType)}
                <span className="text-sm text-slate-400">Type</span>
              </div>
              <p className="text-white font-medium capitalize">
                {event.huntingType.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Priority</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                {event.priority.toUpperCase()}
              </span>
            </div>

            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Status</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                {event.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="bg-soc-dark-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Confidence</span>
              </div>
              <p className="text-white font-medium capitalize">
                {event.confidence.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Description and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Description</h3>
                <div className="bg-soc-dark-800 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">Scope</h3>
                <div className="bg-soc-dark-800 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{event.scope}</p>
                </div>
              </div>

              {event.hypothesis && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Hypothesis</h3>
                  <div className="bg-soc-dark-800 rounded-lg p-4">
                    <p className="text-slate-300 whitespace-pre-wrap">{event.hypothesis}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Hunter and Timing */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Hunt Details</h3>
                <div className="bg-soc-dark-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hunter</span>
                    <div className="text-right">
                      {event.hunter ? (
                        <div>
                          <p className="text-white">{event.hunter.firstName} {event.hunter.lastName}</p>
                          <p className="text-slate-400 text-xs">{event.hunter.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Severity</span>
                    <span className="text-white">{event.severity}/5</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estimated Hours</span>
                    <span className="text-white">{event.estimatedHours || 'N/A'}h</span>
                  </div>

                  {event.actualHours && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Actual Hours</span>
                      <span className="text-white">{event.actualHours}h</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Created</span>
                    <span className="text-white">{formatDateShort(event.createdAt)}</span>
                  </div>

                  {event.startDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Started</span>
                      <span className="text-white">{formatDateShort(event.startDate)}</span>
                    </div>
                  )}

                  {event.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ended</span>
                      <span className="text-white">{formatDateShort(event.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Tags</h3>
                  <div className="bg-soc-dark-800 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-opensoc-500/20 text-opensoc-300 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MITRE ATT&CK TTPs */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
              MITRE ATT&CK TTPs
            </h3>
            <div className="bg-soc-dark-800 rounded-lg p-4">
              {(event.mitreTactics && event.mitreTactics.length > 0) || 
               (event.mitreTechniques && event.mitreTechniques.length > 0) ? (
                <div className="space-y-3">
                  {event.mitreTactics && event.mitreTactics.length > 0 && (
                    <div>
                      <span className="text-sm text-slate-400 block mb-2">Tactics:</span>
                      <div className="flex flex-wrap gap-2">
                        {event.mitreTactics.map((tactic, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                          >
                            {tactic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {event.mitreTechniques && event.mitreTechniques.length > 0 && (
                    <div>
                      <span className="text-sm text-slate-400 block mb-2">Techniques:</span>
                      <div className="flex flex-wrap gap-2">
                        {event.mitreTechniques.map((technique, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm"
                          >
                            {technique}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">No TTPs assigned to this hunt</p>
              )}
            </div>
          </div>

          {/* Findings and Actions */}
          {((event.findings && Object.keys(event.findings).length > 0) || 
            (event.iocsDiscovered && event.iocsDiscovered.length > 0) || 
            (event.recommendedActions && event.recommendedActions.length > 0)) && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Results & Actions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {event.iocsDiscovered && event.iocsDiscovered.length > 0 && (
                  <div className="bg-soc-dark-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">IOCs Discovered</h4>
                    <ul className="space-y-1">
                      {event.iocsDiscovered.map((ioc, index) => (
                        <li key={index} className="text-slate-300 text-sm font-mono">
                          {ioc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.recommendedActions && event.recommendedActions.length > 0 && (
                  <div className="bg-soc-dark-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Recommended Actions</h4>
                    <ul className="space-y-1">
                      {event.recommendedActions.map((action, index) => (
                        <li key={index} className="text-slate-300 text-sm">
                          • {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Items */}
          {((event.relatedIncidents && event.relatedIncidents.length > 0) || 
            (event.relatedAlerts && event.relatedAlerts.length > 0)) && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Related Items</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {event.relatedIncidents && event.relatedIncidents.length > 0 && (
                  <div className="bg-soc-dark-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Related Incidents</h4>
                    <p className="text-slate-300">{event.relatedIncidents.length} incident(s)</p>
                  </div>
                )}

                {event.relatedAlerts && event.relatedAlerts.length > 0 && (
                  <div className="bg-soc-dark-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Related Alerts</h4>
                    <p className="text-slate-300">{event.relatedAlerts.length} alert(s)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-soc-dark-700">
          <button
            type="button"
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

export default ThreatHuntingDetailModal;