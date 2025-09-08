import React from 'react';
import { useSelector } from 'react-redux';
import { FileText, Clock, User } from 'lucide-react';
import { RootState } from '../../store';
import { formatDistanceToNow, parseISO } from 'date-fns';

const IncidentsList: React.FC = () => {
  const { incidents } = useSelector((state: RootState) => state.incidents);

  // Fallback incident data when Redux store is empty (using string dates for Redux compatibility)
  const fallbackIncidents = [
    {
      id: 'demo-inc-1',
      title: 'DDoS Attack - Network Infrastructure',
      description: 'Distributed denial of service attack detected on primary network infrastructure. Traffic volume exceeding normal thresholds.',
      severity: 5,
      status: 'investigating',
      alertCount: 23,
      assignedToName: 'John Smith',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 'demo-inc-2',
      title: 'Malware Detection - Executive Workstation',
      description: 'Advanced persistent threat detected on executive workstation. Suspicious PowerShell activities and unauthorized file modifications.',
      severity: 4,
      status: 'contained',
      alertCount: 8,
      assignedToName: 'Sarah Johnson',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    },
    {
      id: 'demo-inc-3',
      title: 'Data Exfiltration Attempt',
      description: 'Unusual data transfer patterns detected from internal database servers to external endpoints.',
      severity: 5,
      status: 'open',
      alertCount: 12,
      assignedToName: 'Mike Chen',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    },
    {
      id: 'demo-inc-4',
      title: 'Brute Force Login Attempts',
      description: 'Multiple failed authentication attempts detected against administrative accounts from various IP addresses.',
      severity: 3,
      status: 'investigating',
      alertCount: 15,
      assignedToName: 'Alex Rodriguez',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    }
  ];

  // Use actual incidents if available, otherwise use fallback
  const displayIncidents = incidents.length > 0 ? incidents : fallbackIncidents;

  // Show only active incidents (limit to 5)
  const activeIncidents = displayIncidents
    .filter(incident => incident.status !== 'resolved')
    .slice(0, 5);

  // Safe date parsing helper
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

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Active Incidents</h2>
        <div className="text-sm text-slate-400">
          {activeIncidents.length} active
          {incidents.length === 0 && displayIncidents.length > 0 && (
            <span className="ml-2 text-xs text-yellow-400">(demo)</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {activeIncidents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No active incidents</p>
            <p className="text-slate-500 text-sm">All incidents have been resolved</p>
          </div>
        ) : (
          activeIncidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg hover:bg-soc-dark-800 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-white line-clamp-2">
                  {incident.title}
                </h3>
                <div className="flex items-center space-x-2 ml-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                    SEV{incident.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {incident.description}
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(incident.status)}`}>
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  <div className="flex items-center space-x-1 text-slate-400">
                    <FileText className="h-3 w-3" />
                    <span>{incident.alertCount} alerts</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-slate-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{incident.assignedToName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{safeFormatDistance(incident.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Progress indicator for investigating incidents */}
              {incident.status === 'investigating' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Investigation Progress</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-soc-dark-700 rounded-full h-1">
                    <div className="bg-yellow-500 h-1 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {activeIncidents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-soc-dark-700">
          <button className="text-sm text-opensoc-400 hover:text-opensoc-300 transition-colors">
            View all incidents →
          </button>
        </div>
      )}
    </div>
  );
};

export default IncidentsList;