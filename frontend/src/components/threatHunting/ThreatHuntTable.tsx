import React from 'react';
import { Target } from 'lucide-react';
import ThreatHuntTableHeader from './ThreatHuntTableHeader';
import ThreatHuntTableBody from './ThreatHuntTableBody';

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

interface ThreatHuntTableProps {
  events: ThreatHuntEvent[];
  isLoading: boolean;
  selectedEventIds: string[];
  onSelectEvent: (eventId: string) => void;
  onSelectAll: () => void;
  onViewEvent: (event: ThreatHuntEvent) => void;
  onEditEvent: (event: ThreatHuntEvent) => void;
  onCloneEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getHuntingTypeIcon: (type: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

const ThreatHuntTable: React.FC<ThreatHuntTableProps> = ({
  events,
  isLoading,
  selectedEventIds,
  onSelectEvent,
  onSelectAll,
  onViewEvent,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  getStatusColor,
  getPriorityColor,
  getHuntingTypeIcon,
  formatDate,
  sortBy,
  sortOrder,
  onSort
}) => {
  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading threat hunting events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="p-12 text-center">
          <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hunting events found</h3>
          <p className="text-slate-400">No hunting events match your current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="responsive-table-wrapper">
        <table className="professional-responsive-table">
          <ThreatHuntTableHeader 
            selectedEventIds={selectedEventIds}
            totalEvents={events.length}
            onSelectAll={onSelectAll}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
          <ThreatHuntTableBody 
            events={events}
            selectedEventIds={selectedEventIds}
            onSelectEvent={onSelectEvent}
            onViewEvent={onViewEvent}
            onEditEvent={onEditEvent}
            onCloneEvent={onCloneEvent}
            onDeleteEvent={onDeleteEvent}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getHuntingTypeIcon={getHuntingTypeIcon}
            formatDate={formatDate}
          />
        </table>
      </div>
    </div>
  );
};

export default ThreatHuntTable;