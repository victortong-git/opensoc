import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  AlertTriangle, 
  FileText, 
  Server, 
  Clock
} from 'lucide-react';
import { RootState } from '../store';
import { fetchDashboardStart, fetchDashboardSuccess, fetchDashboardFailure, addRecentEvent } from '../store/dashboardSlice';
import { fetchAssets } from '../store/assetsAsync';
import { fetchIncidents } from '../store/incidentsAsync';
import dashboardService from '../services/dashboardService';
import MetricCard from '../components/dashboard/MetricCard';
import ThreatLevelIndicator from '../components/dashboard/ThreatLevelIndicator';
import AlertsChart from '../components/dashboard/AlertsChart';
import IncidentsList from '../components/dashboard/IncidentsList';
import SecurityEventsFeed from '../components/dashboard/SecurityEventsFeed';
import AssetStatusGrid from '../components/dashboard/AssetStatusGrid';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const { stats, recentEvents, isLoading, error } = useSelector((state: RootState) => state.dashboard);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize dashboard data and setup real-time updates
  useEffect(() => {
    // Load initial data from API
    const loadDashboardData = async () => {
      dispatch(fetchDashboardStart());
      try {
        const data = await dashboardService.getStats();
        console.log('Dashboard data loaded:', data);
        dispatch(fetchDashboardSuccess({
          stats: data.stats,
          recentEvents: data.recentEvents
        }));
        
        // Load assets and incidents for dashboard components
        dispatch(fetchAssets({}));
        dispatch(fetchIncidents({}));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        dispatch(fetchDashboardFailure(error.message || 'Failed to load dashboard data'));
        
        // Use fallback data when API fails
        const fallbackStats = {
          totalAlerts: 47,
          newAlerts: 8,
          criticalAlerts: 3,
          activeIncidents: 2,
          resolvedIncidents: 15,
          totalAssets: 87,
          onlineAssets: 84,
          offlineAssets: 2,
          compromisedAssets: 1,
          averageResponseTime: 12.5, // minutes
          threatLevel: 'high',
          systemHealth: 'warning',
          lastUpdated: new Date().toISOString()
        };
        
        const fallbackEvents = [
          {
            id: 'demo-1',
            eventTime: new Date(Date.now() - 300000).toISOString(),
            source: 'Security Monitor',
            eventType: 'Authentication Failure',
            severity: 3 as const,
            sourceIp: '192.168.1.45',
            assetId: 'demo-asset-1',
            assetName: 'WEB-SERVER-01',
            rawLog: 'Multiple failed login attempts detected',
            parsedData: {},
            organizationId: 'demo-org',
            createdAt: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: 'demo-2',
            eventTime: new Date(Date.now() - 600000).toISOString(),
            source: 'Network Monitor',
            eventType: 'Suspicious Traffic',
            severity: 2 as const,
            sourceIp: '10.0.0.234',
            assetId: 'demo-asset-2',
            assetName: 'DC-SERVER-01',
            rawLog: 'Unusual outbound traffic pattern detected',
            parsedData: {},
            organizationId: 'demo-org',
            createdAt: new Date(Date.now() - 600000).toISOString()
          }
        ];
        
        dispatch(fetchDashboardSuccess({
          stats: fallbackStats,
          recentEvents: fallbackEvents
        }));
        
        // Try to load assets and incidents separately even if dashboard fails
        dispatch(fetchAssets({}));
        dispatch(fetchIncidents({}));
      }
    };

    loadDashboardData();

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate real-time events
    const eventInterval = setInterval(() => {
      // Generate random security event
      const eventTypes = ['Authentication Failure', 'Firewall Block', 'Malware Detection', 'Suspicious Network Activity'];
      const sources = ['Windows Event Log', 'Firewall', 'Antivirus', 'Network IDS'];
      const severities = [2, 3, 4];
      
      const randomEvent = {
        id: `event-${Date.now()}`,
        eventTime: new Date().toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)],
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)] as 2 | 3 | 4,
        sourceIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
        assetId: 'asset-' + Math.floor(Math.random() * 5 + 1),
        assetName: `ASSET-${Math.floor(Math.random() * 100)}`,
        rawLog: 'Real-time security event simulation',
        parsedData: {},
        organizationId: 'org-1',
        createdAt: new Date().toISOString()
      };

      dispatch(addRecentEvent(randomEvent));
    }, 30000); // New event every 30 seconds

    return () => {
      clearInterval(timeInterval);
      clearInterval(eventInterval);
    };
  }, [dispatch]);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Use actual data if available, otherwise use fallback
  const displayStats = stats || {
    totalAlerts: 47,
    newAlerts: 8,
    criticalAlerts: 3,
    activeIncidents: 2,
    resolvedIncidents: 15,
    totalAssets: 87,
    onlineAssets: 84,
    offlineAssets: 2,
    compromisedAssets: 1,
    averageResponseTime: 12.5,
    threatLevel: 'high' as const,
    systemHealth: 'warning' as const
  };
  
  const displayEvents = recentEvents.length > 0 ? recentEvents : [];

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && !stats && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-200">
              Dashboard API unavailable. Showing demo data.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Operations Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Real-time security monitoring and incident response
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono text-white">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-sm text-slate-400">
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Threat Level Indicator */}
      <ThreatLevelIndicator level={displayStats.threatLevel} />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Alerts"
          value={displayStats.totalAlerts}
          change={+12}
          icon={AlertTriangle}
          color="red"
          subtitle={`${displayStats.newAlerts} new alerts`}
        />
        
        <MetricCard
          title="Active Incidents"
          value={displayStats.activeIncidents}
          change={-2}
          icon={FileText}
          color="orange"
          subtitle={`${displayStats.resolvedIncidents} resolved today`}
        />
        
        <MetricCard
          title="Assets Monitored"
          value={displayStats.totalAssets}
          change={+3}
          icon={Server}
          color="blue"
          subtitle={`${displayStats.onlineAssets} online`}
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${displayStats.averageResponseTime}m`}
          change={-8}
          icon={Clock}
          color="green"
          subtitle="Last 24 hours"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts Trend Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Alert Trends</h2>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Critical</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Medium</span>
                </div>
              </div>
            </div>
            <AlertsChart />
          </div>

          {/* Asset Status Overview */}
          <AssetStatusGrid />
        </div>

        {/* Right Column - Lists and Feeds */}
        <div className="space-y-6">
          {/* Recent Incidents */}
          <IncidentsList />
          
          {/* Live Security Events Feed */}
          <SecurityEventsFeed events={displayEvents} />
        </div>
      </div>

      {/* Bottom Section - Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Health */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Security Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Threat Detection</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-soc-dark-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm text-white">92%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Response Coverage</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-soc-dark-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <span className="text-sm text-white">87%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Asset Protection</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-soc-dark-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="text-sm text-white">78%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Threat Sources */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Threat Sources</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">External IPs</span>
              <span className="text-red-400 font-semibold">42%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Malware</span>
              <span className="text-orange-400 font-semibold">28%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Phishing</span>
              <span className="text-yellow-400 font-semibold">18%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Insider Threats</span>
              <span className="text-blue-400 font-semibold">12%</span>
            </div>
          </div>
        </div>

        {/* AI Agent Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">AI Agents</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">SOC Analyst</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Active</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Incident Response</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Active</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Threat Intel</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-400">Processing</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Report Generator</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;