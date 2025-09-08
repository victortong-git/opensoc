import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Brain,
  Settings,
  Bot
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { AgentActivity } from '../../types';

interface AgentActivityTimelineProps {
  activities: AgentActivity[];
  showAllActivities?: boolean;
  maxActivities?: number;
}

const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({
  activities,
  showAllActivities = false,
  maxActivities = 10
}) => {
  const displayActivities = showAllActivities ? activities : activities.slice(0, maxActivities);

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

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'learning_update':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'collaboration':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-orange-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'task_completed':
        return 'border-green-500/30';
      case 'learning_update':
        return 'border-purple-500/30';
      case 'collaboration':
        return 'border-blue-500/30';
      case 'error':
        return 'border-red-500/30';
      case 'maintenance':
        return 'border-orange-500/30';
      default:
        return 'border-slate-500/30';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No recent activities to show</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => (
        <div key={activity.id} className="relative">
          {/* Timeline line */}
          {index < displayActivities.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-8 bg-soc-dark-700"></div>
          )}
          
          <div className={`flex space-x-4 p-4 rounded-lg border bg-soc-dark-800/30 ${getActivityColor(activity.activityType)}`}>
            {/* Icon */}
            <div className="flex-shrink-0 p-2 bg-soc-dark-700 rounded-full">
              {getActivityIcon(activity.activityType)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{activity.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <Bot className="h-3 w-3 text-opensoc-400" />
                      <span className="text-xs text-opensoc-400">{activity.agentName}</span>
                    </div>
                    {activity.humanInvolved && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-blue-400">{activity.humanInvolved}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${getImpactBadge(activity.impact)}`}>
                    {activity.impact} impact
                  </span>
                  <span className="text-xs text-slate-500">
                    {safeFormatDistance(activity.timestamp)}
                  </span>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm mb-3">{activity.description}</p>
              
              {/* Metadata */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="bg-soc-dark-900/50 p-3 rounded border">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="text-slate-300 font-medium">
                          {typeof value === 'string' || typeof value === 'number' 
                            ? value.toString() 
                            : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {!showAllActivities && activities.length > maxActivities && (
        <div className="text-center pt-4 border-t border-soc-dark-700">
          <p className="text-slate-400 text-sm">
            Showing {maxActivities} of {activities.length} activities
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentActivityTimeline;