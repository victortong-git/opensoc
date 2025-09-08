import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface AlertTrendData {
  period: string;
  total_alerts: string;
  critical_alerts: string;
  new_alerts: string;
  investigating_alerts: string;
  resolved_alerts: string;
}

interface AlertTrendsData {
  period: string;
  groupBy: string;
  trends: AlertTrendData[];
  summary: {
    totalPeriods: number;
    totalAlerts: number;
    criticalAlerts: number;
  };
}

interface AlertTrendsBarChartProps {
  data: AlertTrendsData | null;
  loading?: boolean;
}

const AlertTrendsBarChart: React.FC<AlertTrendsBarChartProps> = ({ data, loading = false }) => {
  // Transform data for Recharts
  const transformedData = React.useMemo(() => {
    if (!data || !data.trends) return [];
    
    return data.trends.map((trend, index) => ({
      period: new Date(trend.period).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(data.groupBy === 'hour' ? { hour: 'numeric' } : {})
      }),
      periodFull: trend.period,
      totalAlerts: parseInt(trend.total_alerts) || 0,
      criticalAlerts: parseInt(trend.critical_alerts) || 0,
      newAlerts: parseInt(trend.new_alerts) || 0,
      investigatingAlerts: parseInt(trend.investigating_alerts) || 0,
      resolvedAlerts: parseInt(trend.resolved_alerts) || 0,
      index
    }));
  }, [data]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-4 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center space-x-8">
              <span className="text-opensoc-400 text-sm">Total Alerts</span>
              <span className="text-white font-medium">{data.totalAlerts}</span>
            </div>
            <div className="flex justify-between items-center space-x-8">
              <span className="text-red-400 text-sm">Critical</span>
              <span className="text-white font-medium">{data.criticalAlerts}</span>
            </div>
            <div className="flex justify-between items-center space-x-8">
              <span className="text-yellow-400 text-sm">New</span>
              <span className="text-white font-medium">{data.newAlerts}</span>
            </div>
            <div className="flex justify-between items-center space-x-8">
              <span className="text-blue-400 text-sm">Investigating</span>
              <span className="text-white font-medium">{data.investigatingAlerts}</span>
            </div>
            <div className="flex justify-between items-center space-x-8">
              <span className="text-green-400 text-sm">Resolved</span>
              <span className="text-white font-medium">{data.resolvedAlerts}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Alert Trends Over Time</h3>
          <TrendingUp className="h-5 w-5 text-opensoc-400" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-soc-dark-800/50 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-soc-dark-800/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.trends || data.trends.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Alert Trends Over Time</h3>
          <TrendingUp className="h-5 w-5 text-opensoc-400" />
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No alert trends data available</p>
          <p className="text-sm text-slate-500">Data will appear once the analytics system processes alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Alert Trends Over Time</h3>
        <TrendingUp className="h-5 w-5 text-opensoc-400" />
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
          <p className="text-lg font-bold text-white">{data.summary.totalAlerts.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Total Alerts</p>
        </div>
        <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
          <p className="text-lg font-bold text-red-400">{data.summary.criticalAlerts.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Critical Alerts</p>
        </div>
        <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
          <p className="text-lg font-bold text-blue-400">{data.summary.totalPeriods}</p>
          <p className="text-xs text-slate-400">Time Periods</p>
        </div>
        <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
          <p className="text-lg font-bold text-opensoc-400">{data.period}</p>
          <p className="text-xs text-slate-400">Period</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={transformedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="period" 
              stroke="#64748b" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={{ stroke: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={{ stroke: '#64748b' }}
            />
            <Tooltip content={customTooltip} />
            <Legend 
              wrapperStyle={{ color: '#64748b', fontSize: '12px' }}
              iconType="circle"
            />
            
            {/* Bars for different alert types */}
            <Bar 
              dataKey="criticalAlerts" 
              name="Critical" 
              fill="#ef4444" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="newAlerts" 
              name="New" 
              fill="#eab308" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="investigatingAlerts" 
              name="Investigating" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="resolvedAlerts" 
              name="Resolved" 
              fill="#22c55e" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-soc-dark-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-opensoc-600 rounded-full"></div>
            <span className="text-xs text-slate-400">Grouped by {data.groupBy}</span>
          </div>
          <div className="text-xs text-slate-500">
            Showing {transformedData.length} data points
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Last updated: {data.summary.totalAlerts > 0 ? 'Recently' : 'No data'}
        </div>
      </div>
    </div>
  );
};

export default AlertTrendsBarChart;