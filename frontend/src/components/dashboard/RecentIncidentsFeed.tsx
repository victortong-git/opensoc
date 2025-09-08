import React from 'react';
import { AlertTriangle, Activity, Shield, CheckCircle, Clock, User, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: number;
  status: string;
  category: string;
  assignedToName: string;
  alertCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RecentIncidentsFeedProps {
  incidents: Incident[];
  loading?: boolean;
  onIncidentClick?: (incidentId: string) => void;
}

const RecentIncidentsFeed: React.FC<RecentIncidentsFeedProps> = ({
  incidents,
  loading = false,
  onIncidentClick
}) => {
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-300 bg-red-500/20';
      case 'investigating': return 'text-yellow-300 bg-yellow-500/20';
      case 'contained': return 'text-blue-300 bg-blue-500/20';
      case 'resolved': return 'text-green-300 bg-green-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-3 w-3" />;
      case 'investigating': return <Activity className="h-3 w-3" />;
      case 'contained': return <Shield className="h-3 w-3" />;
      case 'resolved': return <CheckCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'malware': return 'text-red-400';
      case 'intrusion': return 'text-orange-400';
      case 'data_breach': return 'text-purple-400';
      case 'policy_violation': return 'text-yellow-400';
      case 'insider_threat': return 'text-pink-400';
      default: return 'text-slate-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700 h-full">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-opensoc-500"></div>
          <span className="text-slate-400 ml-3">Loading incidents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700 h-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Critical Incidents</h3>
        <div className="text-xs text-slate-400">
          High & Critical Severity Only
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto" style={{ height: 'calc(100% - 4rem)' }}>
        {incidents.length > 0 ? incidents.map((incident) => (
          <div 
            key={incident.id} 
            className="p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer"
            onClick={() => onIncidentClick?.(incident.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded border text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                  SEV {incident.severity}
                </span>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                  {getStatusIcon(incident.status)}
                  <span>{incident.status.toUpperCase()}</span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            {/* Title and Description */}
            <div className="mb-3">
              <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">
                {incident.title}
              </h4>
              <p className="text-slate-400 text-xs line-clamp-2">
                {incident.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Category:</span>
                <span className={`font-medium capitalize ${getCategoryColor(incident.category)}`}>
                  {incident.category?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Alerts:</span>
                <span className="text-white font-medium">{incident.alertCount}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <User className="h-3 w-3" />
                <span>{incident.assignedToName}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(incident.createdAt)}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center text-slate-400 py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent critical incidents</p>
            <p className="text-xs">This is a good sign!</p>
          </div>
        )}
      </div>

      {incidents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing {incidents.length} recent incident{incidents.length !== 1 ? 's' : ''}</span>
            <button 
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              onClick={() => {/* Navigate to incidents page */}}
            >
              <span>View all incidents</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentIncidentsFeed;