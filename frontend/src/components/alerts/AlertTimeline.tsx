import React, { useState } from 'react';
import {
  FileText,
  Bot,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import { AlertTimelineEvent, User as UserType } from '../../types';
import { formatDistanceToNow } from 'date-fns';

export interface AlertTimelineProps {
  timeline: AlertTimelineEvent[];
  timelineLoading: boolean;
  currentUser?: UserType | null;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

/**
 * Alert Timeline Component
 * Displays chronological timeline events for an alert
 */
const AlertTimeline: React.FC<AlertTimelineProps> = ({
  timeline,
  timelineLoading,
  currentUser,
  onDeleteEvent
}) => {
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteEvent = async (eventId: string) => {
    if (!onDeleteEvent) return;
    
    try {
      setDeletingEventId(eventId);
      await onDeleteEvent(eventId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete timeline event:', error);
    } finally {
      setDeletingEventId(null);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  
  const getTimelineEventIcon = (type: string) => {
    switch (type) {
      case 'alert_created':
        return { icon: AlertTriangle, color: 'bg-blue-500' };
      case 'ai_analysis_completed':
        return { icon: Bot, color: 'bg-green-500' };
      case 'ai_auto_resolved':
        return { icon: Bot, color: 'bg-purple-500' };
      case 'status_change':
        return { icon: CheckCircle, color: 'bg-yellow-500' };
      case 'user_action':
        return { icon: User, color: 'bg-orange-500' };
      case 'note':
        return { icon: FileText, color: 'bg-slate-500' };
      default:
        return { icon: Clock, color: 'bg-gray-500' };
    }
  };

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Timeline</h3>
        {timelineLoading && (
          <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
        )}
      </div>
      <div className="space-y-4">
        {timeline.length === 0 && !timelineLoading ? (
          <p className="text-sm text-slate-400">No timeline events available</p>
        ) : (
          timeline.map((event) => {
            const { icon: Icon, color } = getTimelineEventIcon(event.type);
            const isAIEvent = event.aiSource || event.type.includes('ai_');
            
            return (
              <div key={event.id} className="flex items-start space-x-3" data-testid="timeline-event">
                <div className={`flex items-center justify-center w-8 h-8 ${color} rounded-full text-white flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      {isAIEvent && (
                        <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                          🤖 AI
                        </span>
                      )}
                      {event.aiConfidence && (
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 border border-green-500/30 rounded-full">
                          {event.aiConfidence}% confidence
                        </span>
                      )}
                    </div>
                    {isAdmin && onDeleteEvent && (
                      <button
                        onClick={() => setShowDeleteConfirm(event.id)}
                        disabled={deletingEventId === event.id}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete timeline event"
                      >
                        {deletingEventId === event.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-1 break-words">{event.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </p>
                    {event.user && (
                      <p className="text-xs text-slate-400">
                        by {event.user.firstName} {event.user.lastName}
                      </p>
                    )}
                    {event.userName && !event.user && (
                      <p className="text-xs text-slate-400">
                        by {event.userName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Timeline Event</h3>
            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete this timeline event? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-soc-dark-700 border border-soc-dark-600 rounded-md hover:bg-soc-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
                disabled={deletingEventId === showDeleteConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-500 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingEventId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertTimeline;