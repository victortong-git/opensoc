import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { RootState } from '../../store';
import { setFilters } from '../../store/alertsSlice';

const AlertsFilters: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.alerts);

  const severityOptions = [
    { value: 5, label: 'Critical', color: 'bg-red-500' },
    { value: 4, label: 'High', color: 'bg-orange-500' },
    { value: 3, label: 'Medium', color: 'bg-yellow-500' },
    { value: 2, label: 'Low', color: 'bg-blue-500' },
    { value: 1, label: 'Info', color: 'bg-gray-500' },
  ];

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'false_positive', label: 'False Positive' },
  ];

  const sourceSystemOptions = [
    'Windows Defender ATP',
    'Windows Event Logs',
    'Network IDS',
    'OSSEC',
    'Web Application Firewall',
    'Antivirus',
    'Firewall'
  ];

  const handleSeverityChange = (severity: number) => {
    const currentSeverities = filters.severity || [];
    const updatedSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter(s => s !== severity)
      : [...currentSeverities, severity];
    
    dispatch(setFilters({ ...filters, severity: updatedSeverities }));
  };

  const handleStatusChange = (status: string) => {
    const currentStatuses = filters.status || [];
    const updatedStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    dispatch(setFilters({ ...filters, status: updatedStatuses }));
  };

  const handleSourceSystemChange = (sourceSystem: string) => {
    const currentSources = filters.sourceSystem || [];
    const updatedSources = currentSources.includes(sourceSystem)
      ? currentSources.filter(s => s !== sourceSystem)
      : [...currentSources, sourceSystem];
    
    dispatch(setFilters({ ...filters, sourceSystem: updatedSources }));
  };

  const clearAllFilters = () => {
    dispatch(setFilters({}));
  };

  const hasActiveFilters = 
    (filters.severity && filters.severity.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.sourceSystem && filters.sourceSystem.length > 0);

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Filter Alerts</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-opensoc-400 hover:text-opensoc-300 flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Severity Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Severity Level
        </label>
        <div className="flex flex-wrap gap-2">
          {severityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSeverityChange(option.value)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                filters.severity?.includes(option.value)
                  ? 'border-opensoc-500 bg-opensoc-500/20 text-white'
                  : 'border-soc-dark-600 bg-soc-dark-800 text-slate-300 hover:border-opensoc-500/50'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                filters.status?.includes(option.value)
                  ? 'border-opensoc-500 bg-opensoc-500/20 text-white'
                  : 'border-soc-dark-600 bg-soc-dark-800 text-slate-300 hover:border-opensoc-500/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source System Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Source System
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sourceSystemOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleSourceSystemChange(option)}
              className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                filters.sourceSystem?.includes(option)
                  ? 'border-opensoc-500 bg-opensoc-500/20 text-white'
                  : 'border-soc-dark-600 bg-soc-dark-800 text-slate-300 hover:border-opensoc-500/50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Filter - Placeholder for future implementation */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Time Range
        </label>
        <div className="flex space-x-2">
          <select className="input-field text-sm">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Custom range...</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-soc-dark-700">
          <div className="text-sm text-slate-400 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-2">
            {filters.severity?.map((severity) => {
              const option = severityOptions.find(opt => opt.value === severity);
              return (
                <span
                  key={`severity-${severity}`}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-opensoc-500/20 text-opensoc-300 rounded text-xs"
                >
                  <div className={`w-2 h-2 rounded-full ${option?.color}`}></div>
                  <span>{option?.label}</span>
                  <button
                    onClick={() => handleSeverityChange(severity)}
                    className="text-opensoc-400 hover:text-opensoc-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            
            {filters.status?.map((status) => (
              <span
                key={`status-${status}`}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-opensoc-500/20 text-opensoc-300 rounded text-xs"
              >
                <span>{status.replace('_', ' ')}</span>
                <button
                  onClick={() => handleStatusChange(status)}
                  className="text-opensoc-400 hover:text-opensoc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            {filters.sourceSystem?.map((source) => (
              <span
                key={`source-${source}`}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-opensoc-500/20 text-opensoc-300 rounded text-xs"
              >
                <span>{source}</span>
                <button
                  onClick={() => handleSourceSystemChange(source)}
                  className="text-opensoc-400 hover:text-opensoc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsFilters;