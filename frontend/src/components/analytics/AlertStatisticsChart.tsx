import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface AlertData {
  total: number;
  active: number;
  last24Hours: number;
  last7Days: number;
  byStatus: Array<{
    status: string;
    count: string;
  }>;
  bySeverity: Array<{
    severity: string;
    count: string;
  }>;
}

interface AlertStatisticsChartProps {
  data: AlertData | null;
  loading?: boolean;
}

const AlertStatisticsChart: React.FC<AlertStatisticsChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Alert Statistics</h3>
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-soc-dark-800/50 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-soc-dark-800/50 rounded"></div>
            <div className="h-24 bg-soc-dark-800/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Alert Statistics</h3>
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400">No alert data available</p>
        </div>
      </div>
    );
  }

  // Transform severity data for pie chart
  const severityData = data.bySeverity.map(item => ({
    name: `Severity ${item.severity}`,
    value: parseInt(item.count),
    severity: item.severity
  }));

  // Transform status data for bar chart
  const statusData = data.byStatus.map(item => ({
    name: item.status.replace('_', ' ').toUpperCase(),
    value: parseInt(item.count),
    status: item.status
  }));

  // Mock trend data for mini line chart
  const trendData = [
    { day: 'Mon', alerts: Math.floor(data.last7Days * 0.12) },
    { day: 'Tue', alerts: Math.floor(data.last7Days * 0.15) },
    { day: 'Wed', alerts: Math.floor(data.last7Days * 0.18) },
    { day: 'Thu', alerts: Math.floor(data.last7Days * 0.14) },
    { day: 'Fri', alerts: Math.floor(data.last7Days * 0.16) },
    { day: 'Sat', alerts: Math.floor(data.last7Days * 0.13) },
    { day: 'Sun', alerts: Math.floor(data.last7Days * 0.12) }
  ];

  // Color schemes
  const severityColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#6b7280'];
  const statusColors = ['#ef4444', '#eab308', '#22c55e', '#6b7280'];

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{payload[0].payload.name}</p>
          <p className="text-slate-300">{`Count: ${payload[0].value}`}</p>
          <p className="text-slate-400 text-sm">{`${((payload[0].value / data.total) * 100).toFixed(1)}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const trend = data.last24Hours > (data.last7Days / 7) ? 'up' : 'down';
  const trendPercentage = Math.abs(((data.last24Hours - (data.last7Days / 7)) / (data.last7Days / 7)) * 100);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Alert Statistics</h3>
        <AlertTriangle className="h-5 w-5 text-red-400" />
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{data.total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Alerts</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-red-400">{data.active.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Active Alerts</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-400">{data.last24Hours.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Last 24h</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{data.last7Days.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Last 7 days</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution Donut Chart */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Severity Distribution</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={70}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={severityColors[index % severityColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {severityData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: severityColors[index] }}
                  ></div>
                  <span className="text-xs text-slate-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Status Distribution</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    content={customTooltip}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 7-Day Trend Mini Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">7-Day Trend</h4>
            <div className="flex items-center space-x-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-400" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                {trendPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line
                  type="monotone"
                  dataKey="alerts"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4 }}
                />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-2 shadow-lg">
                          <p className="text-white text-sm">{`${label}: ${payload[0].value} alerts`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertStatisticsChart;