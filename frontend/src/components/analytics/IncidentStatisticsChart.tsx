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
  AreaChart,
  Area
} from 'recharts';
import { Activity, Clock } from 'lucide-react';

interface IncidentData {
  total: number;
  open: number;
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

interface IncidentStatisticsChartProps {
  data: IncidentData | null;
  loading?: boolean;
}

const IncidentStatisticsChart: React.FC<IncidentStatisticsChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Incident Statistics</h3>
          <Activity className="h-5 w-5 text-orange-400" />
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
          <h3 className="text-lg font-semibold text-white">Incident Statistics</h3>
          <Activity className="h-5 w-5 text-orange-400" />
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400">No incident data available</p>
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

  // Mock resolution trend data for area chart
  const resolutionTrendData = [
    { day: 'Mon', resolved: Math.floor(data.last7Days * 0.15), created: Math.floor(data.last7Days * 0.18) },
    { day: 'Tue', resolved: Math.floor(data.last7Days * 0.12), created: Math.floor(data.last7Days * 0.14) },
    { day: 'Wed', resolved: Math.floor(data.last7Days * 0.16), created: Math.floor(data.last7Days * 0.13) },
    { day: 'Thu', resolved: Math.floor(data.last7Days * 0.14), created: Math.floor(data.last7Days * 0.16) },
    { day: 'Fri', resolved: Math.floor(data.last7Days * 0.13), created: Math.floor(data.last7Days * 0.15) },
    { day: 'Sat', resolved: Math.floor(data.last7Days * 0.15), created: Math.floor(data.last7Days * 0.12) },
    { day: 'Sun', resolved: Math.floor(data.last7Days * 0.15), created: Math.floor(data.last7Days * 0.12) }
  ];

  // Color schemes
  const severityColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#6b7280'];
  const statusColors = ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#6b7280'];

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{payload[0].payload.name || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-300">
              {entry.name}: {entry.value}
            </p>
          ))}
          {payload[0].payload.name && (
            <p className="text-slate-400 text-sm">
              {`${((payload[0].value / data.total) * 100).toFixed(1)}% of total`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    
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

  // Calculate resolution rate
  const resolutionRate = data.total > 0 ? (((data.total - data.open) / data.total) * 100).toFixed(1) : '0';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Incident Statistics</h3>
        <Activity className="h-5 w-5 text-orange-400" />
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{data.total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Incidents</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-400">{data.open.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Open Incidents</p>
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
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={customTooltip}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resolution Trend Area Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Resolution Trend (7 Days)</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-400">{resolutionRate}% Resolution Rate</span>
              </div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolutionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  content={customTooltip}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stackId="1"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.6}
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-slate-300">Created</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-slate-300">Resolved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentStatisticsChart;