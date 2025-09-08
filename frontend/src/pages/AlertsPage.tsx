import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  ChevronDown,
  Bot,
  Brain,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { setFilters, setPagination, setPageSize } from '../store/alertsSlice';
import { fetchAlerts, updateAlert, bulkUpdateAlerts, resolveAlert } from '../store/alertsAsync';
import { Alert } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import AlertsFilters from '../components/alerts/AlertsFilters';
import Pagination from '../components/common/Pagination';
import RowsPerPageSelector from '../components/common/RowsPerPageSelector';
import RecordId from '../components/common/RecordId';
import TestDataChip from '../components/common/TestDataChip';
import AlertTrendsChart from '../components/dashboard/AlertTrendsChart';
import AlertsTable from '../components/alerts/AlertsTable';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import TimeRangeSelector, { TIME_RANGE_OPTIONS } from '../components/common/TimeRangeSelector';
import dashboardService from '../services/dashboardService';
import alertService from '../services/alertService';

const AlertsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { filteredAlerts, isLoading, filters, pagination } = useSelector((state: RootState) => state.alerts);
  
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertTrends, setAlertTrends] = useState<any[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [analyzingAlerts, setAnalyzingAlerts] = useState<Set<string>>(new Set());
  const [deletingAlerts, setDeletingAlerts] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);

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

  // Load alerts on component mount
  useEffect(() => {
    dispatch(fetchAlerts({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      ...filters
    }));
  }, [dispatch, filters, pagination.currentPage, pagination.itemsPerPage]);

  // Load alert trends
  useEffect(() => {
    const loadAlertTrends = async () => {
      try {
        setIsLoadingTrends(true);
        const selectedOption = TIME_RANGE_OPTIONS.find(option => option.value === selectedTimeRange);
        const hours = selectedOption?.hours || 24;
        const trendsResponse = await dashboardService.getAlertTrends(hours);
        setAlertTrends(trendsResponse.alertTrends || []);
      } catch (error) {
        console.error('Failed to load alert trends:', error);
      } finally {
        setIsLoadingTrends(false);
      }
    };

    loadAlertTrends();
  }, [selectedTimeRange]);

  const handleRefresh = () => {
    dispatch(fetchAlerts({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      ...filters
    }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    dispatch(setFilters({ ...filters, search: value }));
  };

  const handleStatusChange = (alertId: string, status: Alert['status']) => {
    dispatch(updateAlert({
      id: alertId,
      updates: { status }
    }));
  };

  const handleBulkStatusChange = (status: Alert['status']) => {
    dispatch(bulkUpdateAlerts({
      alertIds: selectedAlerts,
      updates: { status }
    }));
    setSelectedAlerts([]);
  };


  const handleViewAlert = (alert: Alert) => {
    navigate(`/alerts/${alert.id}`);
  };

  const handlePageChange = (page: number) => {
    dispatch(setPagination({ page, limit: pagination.itemsPerPage }));
    dispatch(fetchAlerts({
      page,
      limit: pagination.itemsPerPage,
      ...filters
    }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setPageSize(pageSize));
    dispatch(fetchAlerts({
      page: 1, // Reset to page 1 when changing page size
      limit: pageSize,
      ...filters
    }));
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    }
  };

  const handleTriggerAIAnalysis = async (alertId: string) => {
    // Add alert to analyzing set
    setAnalyzingAlerts(prev => new Set(prev).add(alertId));
    
    console.log(`🤖 Starting AI analysis for alert ${alertId} from list view...`);
    const startTime = Date.now();

    try {
      const result = await alertService.analyzeAlert(alertId);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ AI analysis completed successfully in ${duration}ms for alert ${alertId}`);
        console.log(`   Confidence: ${result.analysis?.confidence}%`);
        
        // Refresh the alerts to get updated AI analysis
        dispatch(fetchAlerts({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          ...filters
        }));
      } else {
        console.error(`❌ AI Analysis failed after ${duration}ms for alert ${alertId}:`, result.error);
        // TODO: Show error notification to user with specific error message
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ AI Analysis exception after ${duration}ms for alert ${alertId}:`, error);
      
      // Log detailed error information
      console.error('🔍 AI Analysis Error Debug Info:', {
        alertId,
        duration: `${duration}ms`,
        errorCode: error?.code,
        httpStatus: error?.response?.status,
        errorMessage: error?.message,
        responseData: error?.response?.data
      });
      
      // TODO: Show user-friendly error notification
    } finally {
      // Remove alert from analyzing set
      setAnalyzingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
      
      console.log(`🏁 AI analysis process completed for alert ${alertId}`);
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    const alert = filteredAlerts.find(a => a.id === alertId);
    if (alert) {
      setAlertToDelete(alert);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!alertToDelete) return;

    try {
      setDeletingAlerts(prev => new Set(prev).add(alertToDelete.id));
      
      await alertService.deleteAlert(alertToDelete.id);
      
      // Refresh alerts list
      dispatch(fetchAlerts({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      }));
      
      setDeleteModalOpen(false);
      setAlertToDelete(null);
      
    } catch (error) {
      console.error('Failed to delete alert:', error);
    } finally {
      setDeletingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertToDelete.id);
        return newSet;
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setAlertToDelete(null);
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'bg-red-500 text-white';
      case 4: return 'bg-orange-500 text-white';
      case 3: return 'bg-yellow-500 text-black';
      case 2: return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-red-400 bg-red-500/20';
      case 'incident_likely': return 'text-red-500 bg-red-600/25 border-red-500/30';
      case 'analysis_uncertain': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'review_required': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/20';
      case 'resolved': return 'text-green-400 bg-green-500/20';
      case 'false_positive': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (confidence >= 75) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (confidence >= 60) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  // Get AI insights for an alert
  const getAIInsights = (alertId: string): any => {
    const alert = filteredAlerts.find(a => a.id === alertId);
    if (!alert) return null;

    // Return aiInsights if available (legacy format)
    if (alert.aiInsights) {
      return {
        confidence: alert.aiInsights.confidence || 0,
        aiDecision: alert.aiInsights.recommendation || 'Unknown',
        humanOverride: alert.aiInsights.humanOverride || false,
        timestamp: alert.aiAnalysisTimestamp
      };
    }

    // Return aiAnalysis if available (new format)
    if (alert.aiAnalysis) {
      return {
        confidence: alert.aiAnalysis.confidence || 0,
        aiDecision: alert.aiAnalysis.summary || 'Analysis completed',
        riskLevel: alert.aiAnalysis.riskAssessment?.level,
        timestamp: alert.aiAnalysisTimestamp,
        humanOverride: false
      };
    }

    return null;
  };

  // Calculate alert statistics from current data
  const calculateAlertStats = () => {
    if (!filteredAlerts || filteredAlerts.length === 0) {
      return {
        total: pagination.totalItems,
        critical: 0,
        high: 0,
        new: 0,
        investigating: 0,
        incidentLikely: 0,
        reviewRequired: 0,
        analysisUncertain: 0,
        last24h: 0,
        criticalTrend: 0,
        newTrend: 0,
        incidentTrend: 0
      };
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const stats = {
      total: pagination.totalItems,
      critical: filteredAlerts.filter(alert => alert.severity === 5).length,
      high: filteredAlerts.filter(alert => alert.severity === 4).length,
      new: filteredAlerts.filter(alert => alert.status === 'new').length,
      investigating: filteredAlerts.filter(alert => alert.status === 'investigating').length,
      incidentLikely: filteredAlerts.filter(alert => alert.status === 'incident_likely').length,
      reviewRequired: filteredAlerts.filter(alert => alert.status === 'review_required').length,
      analysisUncertain: filteredAlerts.filter(alert => alert.status === 'analysis_uncertain').length,
      last24h: filteredAlerts.filter(alert => {
        try {
          const alertTime = safeParseDate(alert.eventTime);
          return alertTime >= last24Hours;
        } catch {
          return false;
        }
      }).length,
      criticalTrend: Math.floor(Math.random() * 21) - 10, // Placeholder - would come from API
      newTrend: Math.floor(Math.random() * 21) - 10, // Placeholder - would come from API
      incidentTrend: Math.floor(Math.random() * 21) - 10 // Placeholder - would come from API
    };

    return stats;
  };

  const alertStats = calculateAlertStats();

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Alerts</h1>
          <p className="text-slate-400 mt-1">
            Monitor and manage security alerts across your environment
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Total Alerts */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Total Alerts</p>
              <p className="text-lg sm:text-2xl font-bold text-white">{alertStats.total.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {alertStats.newTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-400 mr-1" />
                ) : alertStats.newTrend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-400 mr-1" />
                ) : (
                  <Activity className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span className={`text-xs hidden sm:inline ${
                  alertStats.newTrend > 0 ? 'text-red-400' : 
                  alertStats.newTrend < 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {alertStats.newTrend > 0 ? '+' : ''}{alertStats.newTrend}% from last week
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Critical Alerts</p>
              <p className="text-lg sm:text-2xl font-bold text-red-400">{alertStats.critical.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {alertStats.criticalTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-400 mr-1" />
                ) : alertStats.criticalTrend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-400 mr-1" />
                ) : (
                  <Activity className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span className={`text-xs hidden sm:inline ${
                  alertStats.criticalTrend > 0 ? 'text-red-400' : 
                  alertStats.criticalTrend < 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {alertStats.criticalTrend > 0 ? '+' : ''}{alertStats.criticalTrend}% from last week
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-400" />
            </div>
          </div>
        </div>

        {/* New Alerts */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">New Alerts</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-400">{alertStats.new.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <Clock className="h-3 w-3 text-yellow-400 mr-1" />
                <span className="text-xs text-yellow-400 hidden sm:inline">
                  Require attention
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Incident Likely */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Incident Likely</p>
              <p className="text-lg sm:text-2xl font-bold text-red-500">{alertStats.incidentLikely.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {alertStats.incidentTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-400 mr-1" />
                ) : alertStats.incidentTrend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-400 mr-1" />
                ) : (
                  <Activity className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span className={`text-xs hidden sm:inline ${
                  alertStats.incidentTrend > 0 ? 'text-red-400' : 
                  alertStats.incidentTrend < 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {alertStats.incidentTrend > 0 ? '+' : ''}{alertStats.incidentTrend}% from last week
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-600/25 rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Alert Status Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Alert Status</h3>
            <Shield className="h-5 w-5 text-opensoc-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-slate-300">New</span>
              </div>
              <span className="text-white font-medium">{alertStats.new}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                <span className="text-slate-300">Incident Likely</span>
              </div>
              <span className="text-white font-medium">{alertStats.incidentLikely}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-slate-300">Review Required</span>
              </div>
              <span className="text-white font-medium">{alertStats.reviewRequired}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-slate-300">Analysis Uncertain</span>
              </div>
              <span className="text-white font-medium">{alertStats.analysisUncertain}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-slate-300">Investigating</span>
              </div>
              <span className="text-white font-medium">{alertStats.investigating}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-slate-300">Resolved</span>
              </div>
              <span className="text-white font-medium">
                {filteredAlerts.filter(alert => alert.status === 'resolved').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-slate-300">False Positive</span>
              </div>
              <span className="text-white font-medium">
                {filteredAlerts.filter(alert => alert.status === 'false_positive').length}
              </span>
            </div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Severity Distribution</h3>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                <span className="text-slate-300">Critical (5)</span>
              </div>
              <span className="text-white font-medium">{alertStats.critical}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-slate-300">High (4)</span>
              </div>
              <span className="text-white font-medium">{alertStats.high}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-slate-300">Medium (3)</span>
              </div>
              <span className="text-white font-medium">
                {filteredAlerts.filter(alert => alert.severity === 3).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-slate-300">Low (1-2)</span>
              </div>
              <span className="text-white font-medium">
                {filteredAlerts.filter(alert => alert.severity <= 2).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Trends Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Alert Trends by Severity</h2>
          <TimeRangeSelector
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
            disabled={isLoadingTrends}
          />
        </div>
        <AlertTrendsChart 
          data={alertTrends} 
          loading={isLoadingTrends} 
        />
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-full lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts by title, description, or asset..."
                className="input-field pl-10 pr-4 py-2 w-full"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-opensoc-600 text-white' : ''}`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Bulk Actions */}
            {selectedAlerts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <span className="text-sm text-slate-400 text-center sm:text-left">
                  {selectedAlerts.length} selected
                </span>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => handleBulkStatusChange('resolved')}
                    className="btn-success flex items-center justify-center space-x-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('false_positive')}
                    className="btn-secondary flex items-center justify-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>False Positive</span>
                  </button>
                </div>
              </div>
            )}

            <RowsPerPageSelector
              value={pagination.itemsPerPage}
              onChange={handlePageSizeChange}
              disabled={isLoading}
            />

            <div className="text-sm text-slate-400">
              {pagination.totalItems} alerts
            </div>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-soc-dark-700">
            <AlertsFilters />
          </div>
        )}
      </div>

      {/* Alerts Table */}
      <AlertsTable
        alerts={filteredAlerts}
        isLoading={isLoading}
        selectedAlerts={selectedAlerts}
        onSelectAlert={handleSelectAlert}
        onSelectAll={handleSelectAll}
        onViewAlert={handleViewAlert}
        onStatusChange={handleStatusChange}
        onDeleteAlert={handleDeleteAlert}
        getSeverityColor={getSeverityColor}
        getStatusColor={getStatusColor}
        getConfidenceColor={getConfidenceColor}
        getAIInsights={getAIInsights}
        safeFormatDistance={safeFormatDistance}
        onTriggerAIAnalysis={handleTriggerAIAnalysis}
        analyzingAlerts={analyzingAlerts}
        deletingAlerts={deletingAlerts}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Alert"
        message={`Are you sure you want to delete the alert "${alertToDelete?.title}"? This action cannot be undone.`}
        itemName={alertToDelete?.title || ''}
        itemType="alert"
        isDangerous={false}
        isLoading={alertToDelete ? deletingAlerts.has(alertToDelete.id) : false}
      />

    </div>
  );
};

export default AlertsPage;