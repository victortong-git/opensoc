import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, Zap, Trash2, MoreHorizontal } from 'lucide-react';
import { Alert } from '../../types';
import RecordId from '../common/RecordId';
import TestDataChip from '../common/TestDataChip';
import alertService from '../../services/alertService';

interface AlertTableBodyProps {
  alerts: Alert[];
  selectedAlerts: string[];
  onSelectAlert: (alertId: string) => void;
  onViewAlert: (alert: Alert) => void;
  onStatusChange: (alertId: string, status: Alert['status']) => void;
  onDeleteAlert: (alertId: string) => void;
  getSeverityColor: (severity: number) => string;
  getStatusColor: (status: string) => string;
  getConfidenceColor: (confidence: number) => string;
  getAIInsights: (alertId: string) => any;
  safeFormatDistance: (dateValue: string | Date) => string;
  onTriggerAIAnalysis: (alertId: string) => void;
  analyzingAlerts: Set<string>;
  deletingAlerts?: Set<string>;
}

const AlertTableBody: React.FC<AlertTableBodyProps> = ({
  alerts,
  selectedAlerts,
  onSelectAlert,
  onViewAlert,
  onStatusChange,
  onDeleteAlert,
  getSeverityColor,
  getStatusColor,
  getConfidenceColor,
  getAIInsights,
  safeFormatDistance,
  onTriggerAIAnalysis,
  analyzingAlerts,
  deletingAlerts = new Set()
}) => {
  const navigate = useNavigate();
  const [incidentCounts, setIncidentCounts] = useState<Record<string, number>>({});

  // Load incident counts for visible alerts
  useEffect(() => {
    const loadIncidentCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const alert of alerts) {
        try {
          const response = await alertService.getAlertIncidents(alert.id);
          counts[alert.id] = response.count || 0;
        } catch (error) {
          console.error(`Failed to load incident count for alert ${alert.id}:`, error);
          counts[alert.id] = 0;
        }
      }
      
      setIncidentCounts(counts);
    };

    if (alerts.length > 0) {
      loadIncidentCounts();
    }
  }, [alerts]);

  return (
    <tbody className="bg-soc-dark-900">
      {alerts.map((alert) => {
        const aiInsights = getAIInsights(alert.id);
        return (
          <tr key={alert.id} className="table-row group">
            {/* Checkbox */}
            <td className="checkbox-col">
              <input
                type="checkbox"
                checked={selectedAlerts.includes(alert.id)}
                onChange={() => onSelectAlert(alert.id)}
                className="rounded border-soc-dark-600 bg-soc-dark-800 text-opensoc-600 focus:ring-opensoc-500"
              />
            </td>

            {/* Severity */}
            <td className="severity-col">
              <div className="severity-badge">
                <span className={`severity-indicator ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
              </div>
            </td>

            {/* Alert Details (Title + Metadata) */}
            <td className="title-col">
              <div className="alert-details">
                {/* Primary: Alert Title */}
                <div className="alert-title">
                  <button
                    onClick={() => onViewAlert(alert)}
                    className="font-medium text-white hover:text-opensoc-400 cursor-pointer text-left transition-colors duration-200 w-full"
                    title="Click to view alert details"
                  >
                    <div className="truncate">{alert.title}</div>
                  </button>
                </div>
                
                {/* Secondary: Metadata Row */}
                <div className="alert-metadata">
                  <RecordId type="alert" id={alert.id} variant="inline" className="text-xs" />
                  {alert.isTestData && <TestDataChip size="sm" />}
                  {incidentCounts[alert.id] > 0 && (
                    <div 
                      className="incident-badge"
                      title={`${incidentCounts[alert.id]} related incident${incidentCounts[alert.id] !== 1 ? 's' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/incidents');
                      }}
                    >
                      <FileText className="h-3 w-3 text-opensoc-400" />
                      <span className="text-xs text-opensoc-400 font-medium">
                        {incidentCounts[alert.id]}
                      </span>
                    </div>
                  )}
                  {/* Mobile: Show time in metadata */}
                  <span className="mobile-time">
                    {safeFormatDistance(alert.eventTime)}
                  </span>
                </div>
              </div>
            </td>

            {/* System Column (Asset on desktop, Asset+Source on tablet) */}
            <td className="system-col">
              <div className="system-info">
                <div className="desktop-asset" title={alert.assetName}>
                  {alert.assetName}
                </div>
                <div className="tablet-combined">
                  <div className="asset-name" title={alert.assetName}>
                    {alert.assetName}
                  </div>
                  <div className="source-name" title={alert.sourceSystem}>
                    {alert.sourceSystem}
                  </div>
                </div>
              </div>
            </td>

            {/* Source (Desktop only) */}
            <td className="source-col desktop-only">
              <div className="source-info">
                <span className="source-text" title={alert.sourceSystem}>
                  {alert.sourceSystem}
                </span>
              </div>
            </td>

            {/* Analysis Column (AI Analysis on desktop, AI+Status on mobile) */}
            <td className="analysis-col">
              <div className="analysis-content">
                {/* AI Analysis */}
                <div className="ai-analysis">
                  {analyzingAlerts.has(alert.id) ? (
                    <div className="ai-loading">
                      <Loader2 className="h-3 w-3 animate-spin text-opensoc-400" />
                      <span className="loading-text">Analyzing...</span>
                    </div>
                  ) : aiInsights ? (
                    <div className="ai-results">
                      <span className={`confidence-badge ${getConfidenceColor(aiInsights.confidence)}`}>
                        {aiInsights.confidence.toFixed(0)}%
                      </span>
                      <div className="ai-decision" title={aiInsights.aiDecision}>
                        {aiInsights.aiDecision.length > 8 
                          ? `${aiInsights.aiDecision.substring(0, 8)}...` 
                          : aiInsights.aiDecision}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAIAnalysis(alert.id);
                      }}
                      className="ai-trigger-btn"
                      title="Trigger AI Analysis"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      AI
                    </button>
                  )}
                </div>
                
                {/* Mobile: Show status in analysis column */}
                <div className="mobile-status">
                  <select
                    value={alert.status}
                    onChange={(e) => onStatusChange(alert.id, e.target.value as Alert['status'])}
                    className={`status-select ${getStatusColor(alert.status)}`}
                  >
                    <option value="new">New</option>
                    <option value="incident_likely">Incident Likely</option>
                    <option value="analysis_uncertain">Analysis Uncertain</option>
                    <option value="review_required">Review Required</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
              </div>
            </td>

            {/* Status (Desktop/Tablet) */}
            <td className="status-col">
              <select
                value={alert.status}
                onChange={(e) => onStatusChange(alert.id, e.target.value as Alert['status'])}
                className={`status-select ${getStatusColor(alert.status)}`}
              >
                <option value="new">New</option>
                <option value="incident_likely">Incident Likely</option>
                <option value="analysis_uncertain">Analysis Uncertain</option>
                <option value="review_required">Review Required</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </td>

            {/* Time (Desktop/Tablet only) */}
            <td className="time-col desktop-tablet-only">
              <div className="time-display" title={safeFormatDistance(alert.eventTime)}>
                {safeFormatDistance(alert.eventTime)}
              </div>
            </td>

            {/* Actions (Desktop/Tablet only) */}
            <td className="actions-col desktop-tablet-only">
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAlert(alert.id);
                  }}
                  disabled={deletingAlerts.has(alert.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                           rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete alert"
                >
                  {deletingAlerts.has(alert.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

export default AlertTableBody;