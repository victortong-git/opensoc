import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, FileText, Server, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { RootState } from '../store';
import { fetchDashboardStart, fetchDashboardSuccess, fetchDashboardFailure } from '../store/dashboardSlice';
import dashboardService from '../services/dashboardService';
import dashboardWebSocketService from '../services/dashboardWebSocketService';
import AlertTrendsChart from '../components/dashboard/AlertTrendsChart';
import IncidentTrendsChart from '../components/dashboard/IncidentTrendsChart';
import IncidentWorkflowWidget from '../components/dashboard/IncidentWorkflowWidget';
import RecentIncidentsFeed from '../components/dashboard/RecentIncidentsFeed';
import ResponseMetrics from '../components/dashboard/ResponseMetrics';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const { stats, isLoading, error } = useSelector((state: RootState) => state.dashboard);
  const { token } = useSelector((state: RootState) => state.auth);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alertTrends, setAlertTrends] = useState<any[]>([]);
  const [incidentTrends, setIncidentTrends] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [workflowDistribution, setWorkflowDistribution] = useState<any>({});
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [responseMetrics, setResponseMetrics] = useState<any>(null);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [aiAgentsStatus, setAIAgentsStatus] = useState<any[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const isInitialLoad = useRef(true);

  // Load dashboard data from API
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      dispatch(fetchDashboardStart());
      setIsLoadingEnhanced(true);
    }
    
    try {
      // Load all dashboard data in parallel
      const [
        statsResponse, 
        alertTrendsResponse,
        incidentTrendsResponse, 
        incidentsResponse,
        responseMetricsResponse,
        teamPerformanceResponse,
        aiAgentsResponse
      ] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getAlertTrends(24),
        dashboardService.getIncidentTrends(24),
        dashboardService.getIncidents(5),
        dashboardService.getResponseMetrics(),
        dashboardService.getTeamPerformance(),
        dashboardService.getAIAgentsStatus()
      ]);
      
      // Update dashboard data
      setDashboardData(statsResponse);
      dispatch(fetchDashboardSuccess({
        stats: statsResponse.stats,
        recentEvents: statsResponse.recentEvents || []
      }));

      // Update alert trends
      setAlertTrends(alertTrendsResponse.alertTrends || []);

      // Update incident trends
      setIncidentTrends(incidentTrendsResponse.incidentTrends || []);

      // Update incidents data
      setIncidents(incidentsResponse.incidents || []);
      setWorkflowDistribution(incidentsResponse.workflowDistribution || {});
      setTotalIncidents(incidentsResponse.totalIncidents || 0);

      // Update response metrics
      setResponseMetrics(responseMetricsResponse);

      // Update team performance
      setTeamPerformance(teamPerformanceResponse.teamPerformance || []);

      // Update AI agents status
      setAIAgentsStatus(aiAgentsResponse.aiAgents || []);

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Dashboard API error:', error);
      dispatch(fetchDashboardFailure((error as any)?.message || 'Failed to load dashboard data'));
    } finally {
      if (showLoading) {
        setIsLoadingEnhanced(false);
      }
    }
  }, [dispatch]);

  // Manual refresh function
  const handleRefresh = () => {
    loadData(true);
  };

  // Update WebSocket service token when auth token changes
  useEffect(() => {
    if (token) {
      dashboardWebSocketService.setToken(token);
    }
  }, [token]);

  // Initialize WebSocket connection and load initial data
  useEffect(() => {
    let isComponentMounted = true;

    const initializeDashboard = async () => {
      // Load initial data
      if (isInitialLoad.current) {
        await loadData(true);
        isInitialLoad.current = false;
      }

      // Initialize WebSocket connection only if we have a token
      if (token) {
        try {
          await dashboardWebSocketService.initializeWebSocket();
          if (isComponentMounted) {
            setWsConnected(true);
          }
        } catch (error) {
          console.error('Failed to initialize dashboard WebSocket:', error);
          if (isComponentMounted) {
            setWsConnected(false);
            // Fallback to polling every 30 seconds if WebSocket fails
            const fallbackInterval = setInterval(() => {
              if (isComponentMounted) {
                loadData(false);
              }
            }, 30000);
            
            return () => {
              clearInterval(fallbackInterval);
            };
          }
        }
      } else {
        console.warn('No authentication token available, skipping WebSocket initialization');
        // Still use polling as fallback
        const fallbackInterval = setInterval(() => {
          if (isComponentMounted) {
            loadData(false);
          }
        }, 30000);
        
        return () => {
          clearInterval(fallbackInterval);
        };
      }
    };

    initializeDashboard();

    return () => {
      isComponentMounted = false;
      dashboardWebSocketService.disconnectWebSocket();
    };
  }, [loadData, token]);

  // Setup WebSocket event listeners
  useEffect(() => {
    const handleConnectionStatusChange = (connected: boolean) => {
      setWsConnected(connected);
      if (!connected) {
        // If disconnected, fallback to periodic refresh
        const fallbackInterval = setInterval(() => loadData(false), 30000);
        return () => clearInterval(fallbackInterval);
      }
    };

    const handleStatsUpdate = (data: any) => {
      console.log('📊 Dashboard stats updated via WebSocket');
      setDashboardData(prev => ({ ...prev, ...data }));
      if (data.stats) {
        dispatch(fetchDashboardSuccess({
          stats: data.stats,
          recentEvents: data.recentEvents || []
        }));
      }
      setLastUpdated(new Date());
    };

    const handleAlertTrendsUpdate = (data: any) => {
      console.log('📊 Alert trends updated via WebSocket');
      setAlertTrends(data.alertTrends || []);
      setLastUpdated(new Date());
    };

    const handleIncidentTrendsUpdate = (data: any) => {
      console.log('📊 Incident trends updated via WebSocket');
      setIncidentTrends(data.incidentTrends || []);
      setLastUpdated(new Date());
    };

    const handleIncidentsUpdate = (data: any) => {
      console.log('📊 Incidents updated via WebSocket');
      setIncidents(data.incidents || []);
      setWorkflowDistribution(data.workflowDistribution || {});
      setTotalIncidents(data.totalIncidents || 0);
      setLastUpdated(new Date());
    };

    const handleResponseMetricsUpdate = (data: any) => {
      console.log('📊 Response metrics updated via WebSocket');
      setResponseMetrics(data.responseMetrics);
      setLastUpdated(new Date());
    };

    const handleTeamPerformanceUpdate = (data: any) => {
      console.log('📊 Team performance updated via WebSocket');
      setTeamPerformance(data.teamPerformance || []);
      setLastUpdated(new Date());
    };

    const handleAIAgentsUpdate = (data: any) => {
      console.log('📊 AI agents updated via WebSocket');
      setAIAgentsStatus(data.aiAgents || []);
      setLastUpdated(new Date());
    };

    const handleDashboardUpdate = (data: any) => {
      console.log('📊 Full dashboard updated via WebSocket');
      // Handle comprehensive dashboard update
      if (data.stats) handleStatsUpdate(data);
      if (data.alertTrends) handleAlertTrendsUpdate(data);
      if (data.incidentTrends) handleIncidentTrendsUpdate(data);
      if (data.incidents) handleIncidentsUpdate(data);
      if (data.responseMetrics) handleResponseMetricsUpdate(data);
      if (data.teamPerformance) handleTeamPerformanceUpdate(data);
      if (data.aiAgents) handleAIAgentsUpdate(data);
    };

    // Register WebSocket event listeners
    dashboardWebSocketService.on('connection_status_changed', handleConnectionStatusChange);
    dashboardWebSocketService.on('dashboard_stats_updated', handleStatsUpdate);
    dashboardWebSocketService.on('dashboard_alert_trends_updated', handleAlertTrendsUpdate);
    dashboardWebSocketService.on('dashboard_incident_trends_updated', handleIncidentTrendsUpdate);
    dashboardWebSocketService.on('dashboard_incidents_updated', handleIncidentsUpdate);
    dashboardWebSocketService.on('dashboard_response_metrics_updated', handleResponseMetricsUpdate);
    dashboardWebSocketService.on('dashboard_team_performance_updated', handleTeamPerformanceUpdate);
    dashboardWebSocketService.on('dashboard_ai_agents_updated', handleAIAgentsUpdate);
    dashboardWebSocketService.on('dashboard_updated', handleDashboardUpdate);

    return () => {
      // Cleanup event listeners
      dashboardWebSocketService.off('connection_status_changed', handleConnectionStatusChange);
      dashboardWebSocketService.off('dashboard_stats_updated', handleStatsUpdate);
      dashboardWebSocketService.off('dashboard_alert_trends_updated', handleAlertTrendsUpdate);
      dashboardWebSocketService.off('dashboard_incident_trends_updated', handleIncidentTrendsUpdate);
      dashboardWebSocketService.off('dashboard_incidents_updated', handleIncidentsUpdate);
      dashboardWebSocketService.off('dashboard_response_metrics_updated', handleResponseMetricsUpdate);
      dashboardWebSocketService.off('dashboard_team_performance_updated', handleTeamPerformanceUpdate);
      dashboardWebSocketService.off('dashboard_ai_agents_updated', handleAIAgentsUpdate);
      dashboardWebSocketService.off('dashboard_updated', handleDashboardUpdate);
    };
  }, [dispatch, loadData]);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Show loading state
  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayStats = stats || {
    totalAlerts: 0,
    criticalAlerts: 0,
    newAlerts: 0,
    activeIncidents: 0,
    resolvedIncidents: 0,
    averageResponseTime: 0,
    threatLevel: 'Low',
    onlineAssets: 0,
    totalAssets: 0,
    lastUpdated: new Date().toISOString()
  };
  const assets = dashboardData?.assets || [];

  return (
    <div className="min-h-screen bg-soc-dark-900" data-testid="dashboard">
      <div className="space-y-6 max-w-full overflow-x-hidden p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Operations Dashboard</h1>
            <p className="text-slate-400 mt-1">Real-time security monitoring and incident response</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2">
              {wsConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">Polling</span>
                </>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="btn-secondary flex items-center space-x-2"
              disabled={isLoadingEnhanced}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingEnhanced ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="text-right">
              <div className="text-lg font-mono text-white">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-slate-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-200">Dashboard API error. Showing available data.</span>
            </div>
          </div>
        )}

        {/* Row 1: Enhanced Triage Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Incident Likely Alerts Card */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Incident Likely</h3>
                <p className="text-3xl font-bold text-red-400">{displayStats.incidentLikelyAlerts || 0}</p>
                <p className="text-sm text-slate-500 mt-1">High priority</p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Review Required Alerts Card */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Review Required</h3>
                <p className="text-3xl font-bold text-orange-400">{displayStats.reviewRequiredAlerts || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Medium priority</p>
              </div>
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Analysis Uncertain Alerts Card */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Analysis Uncertain</h3>
                <p className="text-3xl font-bold text-yellow-400">{displayStats.analysisUncertainAlerts || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Needs review</p>
              </div>
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Active Incidents Card */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Active Incidents</h3>
                <p className="text-3xl font-bold text-blue-400">{displayStats.activeIncidents || 0}</p>
                <p className="text-sm text-slate-500 mt-1">In progress</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* SLA Compliance Card */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">AI Triage Rate</h3>
                <p className="text-3xl font-bold text-green-400">{displayStats.aiTriageRate || 85}%</p>
                <p className="text-sm text-slate-500 mt-1">Auto-triaged</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Clock className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Main Trend Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Alert Trends Chart */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Alert Triage Trends</h2>
              <div className="text-sm text-slate-400">Last 24 hours</div>
            </div>
            <div className="h-80">
              <AlertTrendsChart 
                data={alertTrends} 
                loading={isLoadingEnhanced} 
              />
            </div>
          </div>

          {/* Incident Trends Chart */}
          <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Incident Trends by Status</h2>
              <div className="text-sm text-slate-400">Last 24 hours</div>
            </div>
            <div className="h-80">
              <IncidentTrendsChart 
                data={incidentTrends} 
                loading={isLoadingEnhanced} 
                showSeverity={false}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Operational Overview */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Assets Overview - Takes 3 columns (60%) */}
          <div className="xl:col-span-3">
            <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700 h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Infrastructure Status</h2>
                <div className="text-sm text-slate-400">{assets?.length || 0} assets monitored</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {assets && assets.length > 0 ? assets.slice(0, 8).map((asset: any) => (
                  <div key={asset.id} className="p-4 bg-soc-dark-900 rounded-lg border border-soc-dark-600 hover:border-soc-dark-500 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <Server className="h-5 w-5 text-blue-400" />
                      <div className={`w-3 h-3 rounded-full ${
                        asset.status === 'online' ? 'bg-green-500' :
                        asset.status === 'offline' ? 'bg-red-500' :
                        asset.status === 'maintenance' ? 'bg-yellow-500' :
                        asset.status === 'compromised' ? 'bg-red-600' :
                        'bg-gray-500'
                      }`}></div>
                    </div>
                    <p className="text-sm font-medium text-white truncate mb-1">{asset.name}</p>
                    <p className="text-xs text-slate-400 capitalize mb-1">{asset.assetType}</p>
                    <p className="text-xs text-slate-500">{asset.ipAddress}</p>
                  </div>
                )) : (
                  <div className="col-span-full text-center text-slate-400 py-12">
                    <Server className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-lg font-medium">No assets data available</p>
                    <p className="text-sm mt-2">Assets will appear here once monitoring begins</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Critical Incidents - Takes 2 columns (40%) */}
          <div className="xl:col-span-2">
            <RecentIncidentsFeed 
              incidents={incidents} 
              loading={isLoadingEnhanced}
              onIncidentClick={(incidentId) => {
                console.log('Navigate to incident:', incidentId);
              }}
            />
          </div>
        </div>

        {/* Row 4: Enhanced Incident Workflow */}
        <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6">
          <IncidentWorkflowWidget 
            workflowDistribution={workflowDistribution}
            totalIncidents={totalIncidents}
            loading={isLoadingEnhanced}
            onStageClick={(stage) => {
              console.log('Filtering incidents by stage:', stage);
              // TODO: Navigate to incidents page with stage filter
            }}
          />
        </div>

        {/* Row 5: Response Metrics, System Status, and AI Agents */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Response Metrics - Takes 1 column */}
          <div className="xl:col-span-1">
            {responseMetrics && (
              <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6 h-80">
                <ResponseMetrics 
                  averageResponseTime={responseMetrics.averageResponseTime}
                  slaCompliance={responseMetrics.slaCompliance}
                  incidentsByCategory={responseMetrics.incidentsByCategory}
                  teamPerformance={teamPerformance}
                  loading={isLoadingEnhanced}
                  compact={true}
                />
              </div>
            )}
          </div>

          {/* System Status - Takes 1 column */}
          <div className="xl:col-span-1">
            <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700 h-80">
              <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Threat Level</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    displayStats.threatLevel === 'High' ? 'bg-red-500 text-white' :
                    displayStats.threatLevel === 'Medium' ? 'bg-yellow-500 text-black' :
                    'bg-green-500 text-white'
                  }`}>
                    {displayStats.threatLevel || 'Low'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assets Online</span>
                  <span className="text-white font-medium">{displayStats.onlineAssets || 0}/{displayStats.totalAssets || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Alerts</span>
                  <span className="text-white font-medium">{displayStats.newAlerts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="text-slate-500 text-sm">
                    {displayStats.lastUpdated ? 
                      new Date(displayStats.lastUpdated).toLocaleTimeString() : 
                      currentTime.toLocaleTimeString()
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Agents - Takes 1 column */}
          <div className="xl:col-span-1">
            <div className="bg-soc-dark-800 rounded-lg p-6 border border-soc-dark-700 h-80 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">AI Agents</h3>
              <div className="space-y-3">
                {aiAgentsStatus.map((agent) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'active': return 'bg-green-500';
                      case 'processing': return 'bg-yellow-500';
                      case 'inactive': return 'bg-gray-500';
                      case 'error': return 'bg-red-500';
                      default: return 'bg-gray-500';
                    }
                  };
                  
                  const getStatusTextColor = (status: string) => {
                    switch (status) {
                      case 'active': return 'text-green-400';
                      case 'processing': return 'text-yellow-400';
                      case 'inactive': return 'text-gray-400';
                      case 'error': return 'text-red-400';
                      default: return 'text-gray-400';
                    }
                  };

                  return (
                    <div key={agent.name} className="flex justify-between items-center py-2">
                      <span className="text-slate-300 font-medium">{agent.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                        <span className={`text-sm capitalize ${getStatusTextColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {aiAgentsStatus.length === 0 && (
                  <div className="text-slate-500 text-sm text-center py-6">
                    <div className="animate-pulse">Loading AI agents status...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;