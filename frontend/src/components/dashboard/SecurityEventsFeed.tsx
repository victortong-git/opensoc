import React from 'react';
import { Activity, Shield, AlertTriangle, Server } from 'lucide-react';
import { SecurityEvent } from '../../types';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SecurityEventsFeedProps {
  events: SecurityEvent[];
}

const SecurityEventsFeed: React.FC<SecurityEventsFeedProps> = ({ events }) => {
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

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'authentication failure':
        return { icon: Shield, color: 'text-yellow-400' };
      case 'malware detected':
        return { icon: AlertTriangle, color: 'text-red-400' };
      case 'connection blocked':
        return { icon: Server, color: 'text-blue-400' };
      default:
        return { icon: Activity, color: 'text-slate-400' };
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-white">Live Security Feed</h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">LIVE</span>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          {events.length} events
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No recent security events</p>
            <p className="text-slate-500 text-sm">Events will appear here in real-time</p>
          </div>
        ) : (
          events.map((event, index) => {
            const { icon: Icon, color } = getEventIcon(event.eventType || 'unknown');
            
            return (
              <div
                key={event.id}
                className={`p-3 bg-soc-dark-800/30 border-l-2 ${getSeverityColor(event.severity)} rounded-r-lg hover:bg-soc-dark-800/50 transition-colors ${
                  index === 0 ? 'animate-fade-in' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-soc-dark-700 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {event.eventType || 'Security Event'}
                      </h4>
                      <span className="text-xs text-slate-500 ml-2">
                        {safeFormatDistance(event.eventTime)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Source: {event.source}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(event.severity)} text-white`}>
                          SEV{event.severity}
                        </span>
                      </div>
                      {event.parsedData?.description && (
                        <div className="text-xs text-slate-400 mt-1">
                          {event.parsedData.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-soc-dark-700">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Auto-refreshing every 30 seconds</span>
            <button className="text-opensoc-400 hover:text-opensoc-300 transition-colors">
              View full event log →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityEventsFeed;