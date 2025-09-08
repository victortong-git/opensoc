import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ThreatHuntTableHeaderProps {
  selectedEventIds: string[];
  totalEvents: number;
  onSelectAll: () => void;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

const ThreatHuntTableHeader: React.FC<ThreatHuntTableHeaderProps> = ({
  selectedEventIds,
  totalEvents,
  onSelectAll,
  sortBy,
  sortOrder,
  onSort
}) => {
  const renderSortButton = (column: string, label: string) => (
    <button
      onClick={() => onSort(column)}
      className="flex items-center space-x-1 hover:text-white transition-colors"
    >
      <span>{label}</span>
      {sortBy === column && (
        <TrendingUp className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  );

  return (
    <thead className="bg-soc-dark-800">
      <tr>
        {/* Checkbox */}
        <th className="checkbox-col">
          <input
            type="checkbox"
            checked={selectedEventIds.length === totalEvents && totalEvents > 0}
            onChange={onSelectAll}
            className="rounded border-soc-dark-600 bg-soc-dark-800 text-opensoc-600 focus:ring-opensoc-500"
          />
        </th>

        {/* Hunt Details */}
        <th className="title-col">
          <div className="desktop-header">
            {renderSortButton('name', 'Hunt Details')}
          </div>
          <div className="tablet-header">
            {renderSortButton('name', 'Hunt Details')}
          </div>
          <div className="mobile-header">
            {renderSortButton('name', 'Hunt')}
          </div>
        </th>

        {/* Type */}
        <th className="system-col">
          <div className="desktop-header">Type</div>
          <div className="tablet-header">Type</div>
          <div className="mobile-header">Type</div>
        </th>

        {/* Priority (Desktop/Tablet) */}
        <th className="source-col desktop-only">
          <div className="desktop-header">
            {renderSortButton('priority', 'Priority')}
          </div>
        </th>

        {/* Status & Analysis */}
        <th className="analysis-col">
          <div className="desktop-header">
            {renderSortButton('status', 'Status')}
          </div>
          <div className="tablet-header">
            {renderSortButton('status', 'Status')}
          </div>
          <div className="mobile-header">Status</div>
        </th>

        {/* Hunter (Desktop/Tablet) */}
        <th className="status-col desktop-tablet-only">
          <div className="desktop-header">Hunter</div>
          <div className="tablet-header">Hunter</div>
        </th>

        {/* Created (Desktop/Tablet) */}
        <th className="time-col desktop-tablet-only">
          <div className="desktop-header">
            {renderSortButton('createdAt', 'Created')}
          </div>
          <div className="tablet-header">
            {renderSortButton('createdAt', 'Created')}
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default ThreatHuntTableHeader;