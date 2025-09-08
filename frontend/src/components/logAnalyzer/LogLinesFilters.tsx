import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setLinesSearch, setLinesFilters, clearLinesFilters } from '../../store/logAnalyzerSlice';
import { fetchFileLines } from '../../store/logAnalyzerAsync';
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  Calendar, 
  Globe, 
  Tag, 
  RotateCcw,
  Filter
} from 'lucide-react';

interface LogLinesFiltersProps {
  fileId: string;
}

interface FilterState {
  search: string;
  securityStatus: string;
  severity: string;
  logLevel: string;
  dateFrom: string;
  dateTo: string;
  ipAddress: string;
  analysisStatus: string;
  hasAlerts: string;
}

const LogLinesFilters: React.FC<LogLinesFiltersProps> = ({ fileId }) => {
  const dispatch = useDispatch();
  const { linesSearch, linesPagination, linesFilters } = useSelector((state: RootState) => state.logAnalyzer);

  const [filters, setFilters] = useState<FilterState>({
    search: linesFilters.search || linesSearch || '',
    securityStatus: linesFilters.securityStatus || '',
    severity: linesFilters.severity || '',
    logLevel: linesFilters.logLevel || '',
    dateFrom: linesFilters.dateFrom || '',
    dateTo: linesFilters.dateTo || '',
    ipAddress: linesFilters.ipAddress || '',
    analysisStatus: linesFilters.analysisStatus || '',
    hasAlerts: linesFilters.hasAlerts || ''
  });

  const [isApplying, setIsApplying] = useState(false);

  // Initialize filters from Redux state
  useEffect(() => {
    setFilters({
      search: linesFilters.search || linesSearch || '',
      securityStatus: linesFilters.securityStatus || '',
      severity: linesFilters.severity || '',
      logLevel: linesFilters.logLevel || '',
      dateFrom: linesFilters.dateFrom || '',
      dateTo: linesFilters.dateTo || '',
      ipAddress: linesFilters.ipAddress || '',
      analysisStatus: linesFilters.analysisStatus || '',
      hasAlerts: linesFilters.hasAlerts || ''
    });
  }, [linesFilters, linesSearch]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    setIsApplying(true);
    try {
      // Build filter parameters
      const filterParams: any = {
        fileId,
        page: 1
      };

      // Only include non-empty filter parameters
      if (filters.search && filters.search.trim()) filterParams.search = filters.search;
      if (filters.securityStatus && filters.securityStatus.trim()) filterParams.securityStatus = filters.securityStatus;
      if (filters.severity && filters.severity.trim()) filterParams.severity = filters.severity;
      if (filters.logLevel && filters.logLevel.trim()) filterParams.logLevel = filters.logLevel;
      if (filters.dateFrom && filters.dateFrom.trim()) filterParams.dateFrom = filters.dateFrom;
      if (filters.dateTo && filters.dateTo.trim()) filterParams.dateTo = filters.dateTo;
      if (filters.ipAddress && filters.ipAddress.trim()) filterParams.ipAddress = filters.ipAddress;
      if (filters.analysisStatus && filters.analysisStatus.trim()) filterParams.analysisStatus = filters.analysisStatus;
      if (filters.hasAlerts && filters.hasAlerts.trim()) filterParams.hasAlerts = filters.hasAlerts === 'true';

      // Update Redux state with current filters
      dispatch(setLinesSearch(filters.search));
      dispatch(setLinesFilters({
        search: filters.search,
        securityStatus: filters.securityStatus,
        severity: filters.severity,
        logLevel: filters.logLevel,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        ipAddress: filters.ipAddress,
        analysisStatus: filters.analysisStatus,
        hasAlerts: filters.hasAlerts
      }));
      
      // Fetch filtered lines
      await dispatch(fetchFileLines(filterParams));
    } finally {
      setIsApplying(false);
    }
  };

  const resetFilters = () => {
    const emptyFilters = {
      search: '',
      securityStatus: '',
      severity: '',
      logLevel: '',
      dateFrom: '',
      dateTo: '',
      ipAddress: '',
      analysisStatus: '',
      hasAlerts: ''
    };
    
    setFilters(emptyFilters);
    dispatch(setLinesSearch(''));
    dispatch(clearLinesFilters());
    dispatch(fetchFileLines({ fileId, page: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Search className="h-4 w-4 mr-2" />
          Content Search
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search log content..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        />
      </div>

      {/* Security Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          Security Status
        </label>
        <select
          value={filters.securityStatus}
          onChange={(e) => handleFilterChange('securityStatus', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="not_analyzed">Not Analyzed</option>
          <option value="analyzing">Analyzing</option>
          <option value="safe">Safe</option>
          <option value="security_issue">Security Issues</option>
          <option value="alerts_created">Alerts Created</option>
        </select>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Severity
        </label>
        <select
          value={filters.severity}
          onChange={(e) => handleFilterChange('severity', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Log Level */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Log Level
        </label>
        <select
          value={filters.logLevel}
          onChange={(e) => handleFilterChange('logLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        >
          <option value="">All Levels</option>
          <option value="ERROR">ERROR</option>
          <option value="WARN">WARN</option>
          <option value="INFO">INFO</option>
          <option value="DEBUG">DEBUG</option>
          <option value="TRACE">TRACE</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Date Range
        </label>
        <div className="space-y-2">
          <input
            type="datetime-local"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            placeholder="From date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
          />
          <input
            type="datetime-local"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            placeholder="To date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* IP Address */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Globe className="h-4 w-4 mr-2" />
          IP Address
        </label>
        <input
          type="text"
          value={filters.ipAddress}
          onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
          placeholder="Filter by IP address..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        />
      </div>

      {/* Analysis Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Analysis Status
        </label>
        <select
          value={filters.analysisStatus}
          onChange={(e) => handleFilterChange('analysisStatus', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Has Alerts */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Alert Status
        </label>
        <select
          value={filters.hasAlerts}
          onChange={(e) => handleFilterChange('hasAlerts', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="true">Has Alerts</option>
          <option value="false">No Alerts</option>
        </select>
      </div>

      {/* Apply Filters Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-soc-dark-700">
        <button
          onClick={applyFilters}
          disabled={isApplying}
          className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
        >
          {isApplying ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Filter className="h-4 w-4 mr-2" />
          )}
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default LogLinesFilters;