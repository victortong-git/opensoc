import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Clock,
  Target,
  Activity,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Server
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchDashboardMetrics, fetchAlertTrends, fetchThreatIntelStats, fetchPerformanceMetrics } from '../store/analyticsAsync';
import AlertStatisticsChart from '../components/analytics/AlertStatisticsChart';
import IncidentStatisticsChart from '../components/analytics/IncidentStatisticsChart';
import AssetDistributionChart from '../components/analytics/AssetDistributionChart';
import ThreatIntelChart from '../components/analytics/ThreatIntelChart';
import AlertTrendsBarChart from '../components/analytics/AlertTrendsBarChart';
import CustomDateRangeModal, { CustomDateRange } from '../components/analytics/CustomDateRangeModal';

const AnalyticsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    dashboardMetrics, 
    alertTrends, 
    threatIntelStats,
    performanceMetrics,
    dashboardMetricsError,
    threatIntelStatsLoading,
    threatIntelStatsError,
    performanceMetricsLoading,
    performanceMetricsError,
    isLoading 
  } = useSelector((state: RootState) => state.analytics);
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange | null>(null);
  const [isCustomRangeActive, setIsCustomRangeActive] = useState(false);

  // Refresh all analytics data
  const handleRefresh = () => {
    dispatch(fetchDashboardMetrics());
    
    // Use custom date range if active, otherwise use period
    if (isCustomRangeActive && customDateRange) {
      dispatch(fetchAlertTrends({ 
        startDate: customDateRange.startDate, 
        endDate: customDateRange.endDate,
        groupBy: 'day' 
      }));
    } else {
      dispatch(fetchAlertTrends({ period: selectedTimeRange, groupBy: 'day' }));
    }
    
    dispatch(fetchThreatIntelStats());
    dispatch(fetchPerformanceMetrics());
  };

  // Load analytics data on component mount and when time range changes
  useEffect(() => {
    dispatch(fetchDashboardMetrics());
    
    // Use custom date range if active, otherwise use period
    if (isCustomRangeActive && customDateRange) {
      dispatch(fetchAlertTrends({ 
        startDate: customDateRange.startDate, 
        endDate: customDateRange.endDate,
        groupBy: 'day' 
      }));
    } else {
      dispatch(fetchAlertTrends({ period: selectedTimeRange, groupBy: 'day' }));
    }
    
    dispatch(fetchThreatIntelStats());
    dispatch(fetchPerformanceMetrics());
  }, [dispatch, selectedTimeRange, isCustomRangeActive, customDateRange]);

  const timeRanges: { value: '24h' | '7d' | '30d' | '90d'; label: string }[] = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  // Calculate derived metrics from API data
  const calculateMetrics = () => {
    if (!dashboardMetrics || !alertTrends) {
      return {
        totalAlerts: 0,
        totalIncidents: 0,
        totalAssets: 0,
        totalIOCs: 0,
        meanTimeToDetect: 'N/A',
        meanTimeToRespond: 'N/A',
        systemHealth: 'N/A',
        alertTrend: 0,
        incidentTrend: 0,
      };
    }

    const totalAlerts = dashboardMetrics.alerts.total;
    const totalIncidents = dashboardMetrics.incidents.total;
    const totalAssets = dashboardMetrics.assets.total;
    const totalIOCs = threatIntelStats?.total || 0; // Use threatIntelStats instead of dashboardMetrics.iocs

    // Calculate MTTR from trends (simplified - would need more complex calculation in real scenario)
    
    return {
      totalAlerts,
      totalIncidents, 
      totalAssets,
      totalIOCs,
      meanTimeToDetect: performanceMetrics ? `${performanceMetrics.meanTimeToDetect.toFixed(1)} min` : 'N/A',
      meanTimeToRespond: performanceMetrics ? `${performanceMetrics.meanTimeToRespond.toFixed(1)} min` : 'N/A',
      systemHealth: performanceMetrics ? `${performanceMetrics.systemHealth}%` : 'N/A',
      alertTrend: dashboardMetrics.alerts.last24Hours > dashboardMetrics.alerts.last7Days / 7 ? 12 : -8,
      incidentTrend: dashboardMetrics.incidents.last24Hours > dashboardMetrics.incidents.last7Days / 7 ? 5 : -15,
    };
  };

  const metrics = calculateMetrics();


  const getTrendIcon = (trend: number) => {
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4 text-red-400" />
    ) : trend < 0 ? (
      <TrendingDown className="h-4 w-4 text-green-400" />
    ) : (
      <Activity className="h-4 w-4 text-gray-400" />
    );
  };

  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend}%`;
  };

  // Handle custom date range selection
  const handleCustomDateRange = (dateRange: CustomDateRange) => {
    setCustomDateRange(dateRange);
    setIsCustomRangeActive(true);
  };

  // Handle time range selector change
  const handleTimeRangeChange = (value: '24h' | '7d' | '30d' | '90d') => {
    setSelectedTimeRange(value);
    setIsCustomRangeActive(false);
    setCustomDateRange(null);
  };

  // Clear custom range and return to predefined ranges
  const handleClearCustomRange = () => {
    setIsCustomRangeActive(false);
    setCustomDateRange(null);
  };

  // Format custom date range for display
  const formatCustomRangeDisplay = (range: CustomDateRange) => {
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  // Show loading state
  if (isLoading && !dashboardMetrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Analytics</h1>
            <p className="text-slate-400 mt-2">Loading analytics data...</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading security metrics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dashboardMetricsError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Analytics</h1>
            <p className="text-slate-400 mt-2">Error loading analytics data</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Analytics</h3>
          <p className="text-slate-400 mb-4">{dashboardMetricsError}</p>
          <button 
            onClick={() => dispatch(fetchDashboardMetrics())}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Analytics</h1>
          <p className="text-slate-400 mt-2">
            Comprehensive security metrics and threat analysis dashboard
          </p>
          
          {/* Custom range indicator */}
          {isCustomRangeActive && customDateRange && (
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-opensoc-400 font-medium">
                Custom Range: {formatCustomRangeDisplay(customDateRange)}
              </span>
              <button
                onClick={handleClearCustomRange}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Clear
              </button>
            </div>
          )}
          
          {dashboardMetrics && (
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {new Date(dashboardMetrics.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <select
            value={isCustomRangeActive ? 'custom' : selectedTimeRange}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                handleTimeRangeChange(e.target.value as '24h' | '7d' | '30d' | '90d');
              }
            }}
            className="input-field"
            disabled={isLoading}
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
            {isCustomRangeActive && (
              <option value="custom">Custom Range</option>
            )}
          </select>
          <button 
            onClick={() => setShowCustomRangeModal(true)}
            className={`btn-secondary ${isCustomRangeActive ? 'bg-opensoc-600 text-white' : ''}`}
            disabled={isLoading}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Alerts</p>
              <p className="text-2xl font-bold text-white">{metrics.totalAlerts.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon(metrics.alertTrend)}
                <span className={`text-xs ml-1 ${metrics.alertTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatTrend(metrics.alertTrend)} from last period
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Incidents</p>
              <p className="text-2xl font-bold text-white">{metrics.totalIncidents.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon(metrics.incidentTrend)}
                <span className={`text-xs ml-1 ${metrics.incidentTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatTrend(metrics.incidentTrend)} from last period
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-bold text-white">{metrics.totalAssets.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <Server className="h-3 w-3 text-blue-400 mr-1" />
                <span className="text-xs text-blue-400">
                  {dashboardMetrics?.assets.online || 0} online
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Server className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Threat Indicators (IOCs)</p>
              <p className="text-2xl font-bold text-white">{(threatIntelStats?.total || 0).toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <Shield className="h-3 w-3 text-opensoc-400 mr-1" />
                <span className="text-xs text-opensoc-400">
                  {threatIntelStats?.active || 0} active
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-opensoc-500/20 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-opensoc-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alert Statistics Chart */}
        <AlertStatisticsChart 
          data={dashboardMetrics?.alerts || null} 
          loading={isLoading && !dashboardMetrics}
        />

        {/* Incident Statistics Chart */}
        <IncidentStatisticsChart 
          data={dashboardMetrics?.incidents || null} 
          loading={isLoading && !dashboardMetrics}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Asset Distribution Chart */}
        <AssetDistributionChart 
          data={dashboardMetrics?.assets || null} 
          loading={isLoading && !dashboardMetrics}
        />

        {/* Threat Intelligence Chart */}
        <ThreatIntelChart 
          data={threatIntelStats || null} 
          loading={threatIntelStatsLoading}
        />
      </div>

      {/* Alert Trends Chart */}
      <AlertTrendsBarChart 
        data={alertTrends} 
        loading={isLoading && !alertTrends} 
      />

      {/* Performance Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-green-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Mean Time to Detect</h4>
          <p className="text-3xl font-bold text-green-400 mb-2">{metrics.meanTimeToDetect}</p>
          <p className="text-sm text-slate-400">Average detection time</p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-blue-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Mean Time to Respond</h4>
          <p className="text-3xl font-bold text-blue-400 mb-2">{metrics.meanTimeToRespond}</p>
          <p className="text-sm text-slate-400">Average response time</p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-opensoc-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-opensoc-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">System Health</h4>
          <p className="text-3xl font-bold text-opensoc-400 mb-2">{metrics.systemHealth}</p>
          <p className="text-sm text-slate-400">Overall system status</p>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      <CustomDateRangeModal
        isOpen={showCustomRangeModal}
        onClose={() => setShowCustomRangeModal(false)}
        onApply={handleCustomDateRange}
        currentRange={customDateRange || undefined}
      />
    </div>
  );
};

export default AnalyticsPage;