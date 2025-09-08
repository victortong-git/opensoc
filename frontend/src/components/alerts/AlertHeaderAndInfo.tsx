import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Server,
  Clock,
  User,
  Shield,
  ExternalLink
} from 'lucide-react';
import { Alert } from '../../types';
import { getSecurityEventTypeInfo } from '../../utils/securityEventTypes';

export interface AlertHeaderAndInfoProps {
  alert: Alert;
  // Form management props
  isEditing: boolean;
  updating: boolean;
  editFormData: {
    title: string;
    description: string;
    severity: number;
    assignedAgent: string;
    assetName: string;
  };
  setEditFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    severity: number;
    assignedAgent: string;
    assetName: string;
  }>>;
  handleStatusChange: (newStatus: Alert['status']) => Promise<void>;
  handleEditSave: () => Promise<void>;
  handleEditToggle: () => void;
  getSeverityColor: (severity: number) => string;
  getStatusColor: (status: string) => string;
  // Date utilities
  safeParseDate: (dateValue: string | Date) => Date;
  safeFormatDistance: (dateValue: string | Date) => string;
  // Success message props
  incidentCreationSuccess: any | null;
}

/**
 * Alert Header and Basic Information Component
 * Displays alert header with navigation, status controls, and basic alert information
 */
const AlertHeaderAndInfo: React.FC<AlertHeaderAndInfoProps> = ({
  alert,
  isEditing,
  updating,
  editFormData,
  setEditFormData,
  handleStatusChange,
  handleEditSave,
  handleEditToggle,
  getSeverityColor,
  getStatusColor,
  safeParseDate,
  safeFormatDistance,
  incidentCreationSuccess
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Enhanced Header */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 border-b border-soc-dark-700 bg-soc-dark-950">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/alerts')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <nav className="text-sm">
              <span className="text-slate-400">Dashboard</span>
              <ChevronRight className="h-4 w-4 mx-2 inline text-slate-500" />
              <button 
                onClick={() => navigate('/alerts')}
                className="text-opensoc-400 hover:text-opensoc-300"
              >
                Alerts
              </button>
              <ChevronRight className="h-4 w-4 mx-2 inline text-slate-500" />
              <span className="text-white">Alert Details</span>
            </nav>
          </div>
          
          <button
            onClick={() => navigate('/alerts')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Alerts</span>
          </button>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg border text-lg font-bold ${getSeverityColor(alert.severity)}`}>
              SEV {alert.severity}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{alert.title}</h2>
              <p className="text-sm text-slate-400">Alert ID: {alert.id}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={alert.status}
              onChange={(e) => handleStatusChange(e.target.value as Alert['status'])}
              disabled={updating}
              data-testid="alert-status"
              className={`px-2 py-1 rounded text-sm font-medium border-0 ${getStatusColor(alert.status)} ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
            >
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {incidentCreationSuccess && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <h3 className="text-green-400 font-medium">Incident Created Successfully!</h3>
              <p className="text-green-300 text-sm">
                Incident "{incidentCreationSuccess.title}" has been created from this alert.
              </p>
            </div>
            <button
              onClick={() => navigate(`/incidents/${incidentCreationSuccess.id}`)}
              className="btn-secondary text-sm"
            >
              View Incident
            </button>
          </div>
        </div>
      )}

      {/* Alert Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Alert Information</h3>
            {isEditing && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEditSave}
                  disabled={updating}
                  className="btn-primary text-sm px-3 py-1 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleEditToggle}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4 space-y-3">
            {/* Title - Editable */}
            <div className="flex justify-between items-start">
              <span className="text-slate-400">Title:</span>
              <div className="flex-1 ml-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-2 py-1 text-white text-sm"
                  />
                ) : (
                  <span className="text-white font-medium">{alert.title}</span>
                )}
              </div>
            </div>

            {/* Severity - Editable */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Severity:</span>
              {isEditing ? (
                <select
                  value={editFormData.severity}
                  onChange={(e) => setEditFormData({...editFormData, severity: Number(e.target.value)})}
                  className="bg-soc-dark-900 border border-soc-dark-700 rounded px-2 py-1 text-white text-sm"
                >
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>Severity {num}</option>
                  ))}
                </select>
              ) : (
                <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                  Severity {alert.severity}
                </span>
              )}
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
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-opensoc-400" />
                <span className="text-white font-medium">{alert.sourceSystem}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Event Time:</span>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-opensoc-400" />
                <span className="text-white font-mono">
                  {safeParseDate(alert.eventTime).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Age:</span>
              <span className="text-white">
                {safeFormatDistance(alert.eventTime)}
              </span>
            </div>
            
            {/* Assigned Agent - Editable */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Assigned Agent:</span>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-opensoc-400" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.assignedAgent}
                    onChange={(e) => setEditFormData({...editFormData, assignedAgent: e.target.value})}
                    placeholder="Enter agent name"
                    className="bg-soc-dark-900 border border-soc-dark-700 rounded px-2 py-1 text-white text-sm"
                  />
                ) : (
                  <span className="text-opensoc-400">{alert.assignedAgent || 'Unassigned'}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Asset Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Affected Asset</h3>
          
          <div className="p-4 bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-5 w-5 text-opensoc-400" />
              {isEditing ? (
                <input
                  type="text"
                  value={editFormData.assetName}
                  onChange={(e) => setEditFormData({...editFormData, assetName: e.target.value})}
                  placeholder="Enter asset name"
                  className="flex-1 bg-soc-dark-900 border border-soc-dark-700 rounded px-2 py-1 text-white text-sm"
                />
              ) : (
                <span className="font-medium text-white">{alert.assetName || 'Unknown Asset'}</span>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              {alert.assetId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset ID:</span>
                  <span className="text-white font-mono">{alert.assetId}</span>
                </div>
              )}
              
              <button className="w-full text-left text-opensoc-400 hover:text-opensoc-300 flex items-center justify-between">
                <span>View Asset Details</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description - Editable */}
      <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-3">Description</h3>
        {isEditing ? (
          <textarea
            value={editFormData.description}
            onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
            rows={4}
            className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-slate-300 leading-relaxed resize-none"
            placeholder="Enter alert description"
          />
        ) : (
          <p className="text-slate-300 leading-relaxed">{alert.description}</p>
        )}
      </div>
    </>
  );
};

export default AlertHeaderAndInfo;