import React from 'react';
import { Edit, Copy, Trash2 } from 'lucide-react';
import RecordId from '../common/RecordId';
import TestDataChip from '../common/TestDataChip';

interface ThreatHuntEvent {
  id: string;
  name: string;
  description: string;
  huntType: string;
  priority: string;
  status: string;
  hunter?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  isTestData?: boolean;
}

interface ThreatHuntTableBodyProps {
  events: ThreatHuntEvent[];
  selectedEventIds: string[];
  onSelectEvent: (eventId: string) => void;
  onViewEvent: (event: ThreatHuntEvent) => void;
  onEditEvent: (event: ThreatHuntEvent) => void;
  onCloneEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getHuntingTypeIcon: (type: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
}

const ThreatHuntTableBody: React.FC<ThreatHuntTableBodyProps> = ({
  events,
  selectedEventIds,
  onSelectEvent,
  onViewEvent,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  getStatusColor,
  getPriorityColor,
  getHuntingTypeIcon,
  formatDate
}) => {
  return (
    <tbody className="bg-soc-dark-900">
      {events.map((event) => (
        <tr key={event.id} className="table-row group">
          {/* Checkbox */}
          <td className="checkbox-col">
            <input
              type="checkbox"
              checked={selectedEventIds.includes(event.id)}
              onChange={() => onSelectEvent(event.id)}
              className="rounded border-soc-dark-600 bg-soc-dark-800 text-opensoc-600 focus:ring-opensoc-500"
            />
          </td>

          {/* Hunt Details (Title + Metadata) */}
          <td className="title-col">
            <div className="alert-details">
              {/* Primary: Hunt Name (Clickable) */}
              <div className="alert-title">
                <button
                  onClick={() => onViewEvent(event)}
                  className="font-medium text-white hover:text-opensoc-400 cursor-pointer text-left transition-colors duration-200 w-full"
                  title="Click to view hunt details"
                >
                  <div className="truncate">{event.name}</div>
                </button>
              </div>
              
              {/* Secondary: Metadata Row */}
              <div className="alert-metadata">
                <RecordId type="hunt" id={event.id} variant="inline" className="text-xs" />
                {event.isTestData && <TestDataChip size="sm" />}
                {/* Mobile: Show priority and hunter in metadata */}
                <div className="mobile-priority">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                    {event.priority.toUpperCase()}
                  </span>
                </div>
                <span className="mobile-hunter">
                  {event.hunter ? `${event.hunter.firstName} ${event.hunter.lastName}` : 'Unassigned'}
                </span>
                {/* Mobile: Show time in metadata */}
                <span className="mobile-time">
                  {formatDate(event.createdAt)}
                </span>
              </div>
              
              {/* Description (shown on larger screens) */}
              <div className="desktop-description">
                <p className="text-slate-400 text-xs line-clamp-1 mt-1">
                  {event.description}
                </p>
              </div>
            </div>
          </td>

          {/* Type */}
          <td className="system-col">
            <div className="system-info">
              <div className="flex items-center space-x-2">
                {getHuntingTypeIcon(event.huntType)}
                <span className="text-sm capitalize truncate">
                  {event.huntType?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
            </div>
          </td>

          {/* Priority (Desktop only) */}
          <td className="source-col desktop-only">
            <div className="source-info">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                {event.priority.toUpperCase()}
              </span>
            </div>
          </td>

          {/* Status & Actions */}
          <td className="analysis-col">
            <div className="analysis-content">
              {/* Status */}
              <div className="ai-analysis">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              {/* Mobile: Quick actions */}
              <div className="mobile-actions">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
                    title="Edit hunt"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloneEvent(event.id);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
                    title="Clone hunt"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete hunt"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </td>

          {/* Hunter (Desktop/Tablet) */}
          <td className="status-col desktop-tablet-only">
            <div className="hunter-info">
              <div className="text-sm">
                <div className="text-white truncate">
                  {event.hunter ? `${event.hunter.firstName} ${event.hunter.lastName}` : 'Unassigned'}
                </div>
                <div className="text-slate-400 text-xs truncate">
                  {event.hunter?.email}
                </div>
              </div>
            </div>
          </td>

          {/* Created (Desktop/Tablet only) */}
          <td className="time-col desktop-tablet-only">
            <div className="time-display" title={formatDate(event.createdAt)}>
              {formatDate(event.createdAt)}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export default ThreatHuntTableBody;