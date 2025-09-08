import React from 'react';

interface AlertTableHeaderProps {
  selectedAlerts: string[];
  totalAlerts: number;
  onSelectAll: () => void;
}

const AlertTableHeader: React.FC<AlertTableHeaderProps> = ({
  selectedAlerts,
  totalAlerts,
  onSelectAll
}) => {
  return (
    <thead className="bg-soc-dark-800">
      <tr>
        <th className="table-header checkbox-col">
          <input
            type="checkbox"
            checked={selectedAlerts.length === totalAlerts}
            onChange={onSelectAll}
            className="rounded border-soc-dark-600 bg-soc-dark-800 text-opensoc-600 focus:ring-opensoc-500"
          />
        </th>
        
        <th className="table-header severity-col">
          Severity
        </th>
        
        <th className="table-header title-col">
          Alert Details
        </th>
        
        <th className="table-header system-col">
          <span className="desktop-header">Asset</span>
          <span className="tablet-header">System</span>
        </th>
        
        <th className="table-header source-col desktop-only">
          Source
        </th>
        
        <th className="table-header analysis-col">
          <span className="desktop-header">AI Analysis</span>
          <span className="mobile-header">Analysis</span>
        </th>
        
        <th className="table-header status-col">
          <span className="desktop-header">Status</span>
          <span className="mobile-header hidden">Status</span>
        </th>
        
        <th className="table-header time-col desktop-tablet-only">
          Time
        </th>
        
        <th className="table-header actions-col desktop-tablet-only">
          Actions
        </th>
      </tr>
    </thead>
  );
};

export default AlertTableHeader;