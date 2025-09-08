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
  RadialBarChart,
  RadialBar
} from 'recharts';
import { Server, Shield, Wifi, WifiOff } from 'lucide-react';

interface AssetData {
  total: number;
  online: number;
  byType: Array<{
    type: string;
    count: string;
  }>;
  byStatus: Array<{
    status: string;
    count: string;
  }>;
  riskDistribution: Array<{
    risk_level: string;
    count: string;
  }>;
}

interface AssetDistributionChartProps {
  data: AssetData | null;
  loading?: boolean;
}

const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Asset Distribution</h3>
          <Server className="h-5 w-5 text-blue-400" />
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
          <h3 className="text-lg font-semibold text-white">Asset Distribution</h3>
          <Server className="h-5 w-5 text-blue-400" />
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400">No asset data available</p>
        </div>
      </div>
    );
  }

  // Transform type data for pie chart
  const typeData = data.byType.map(item => ({
    name: item.type.replace('_', ' ').toUpperCase(),
    value: parseInt(item.count),
    type: item.type
  }));

  // Transform status data for stacked bar chart
  const statusData = data.byStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: parseInt(item.count),
    status: item.status
  }));

  // Transform risk data for radial bar chart
  const riskData = data.riskDistribution.map((item) => ({
    name: item.risk_level,
    value: parseInt(item.count),
    fill: getRiskColor(item.risk_level)
  }));

  // Color schemes
  const typeColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const statusColors = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];

  function getRiskColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{payload[0].payload.name || label}</p>
          <p className="text-slate-300">{`Count: ${payload[0].value}`}</p>
          <p className="text-slate-400 text-sm">{`${((payload[0].value / data.total) * 100).toFixed(1)}% of total`}</p>
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

  // Calculate uptime percentage
  const uptimePercentage = data.total > 0 ? ((data.online / data.total) * 100).toFixed(1) : '0';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Asset Distribution</h3>
        <Server className="h-5 w-5 text-blue-400" />
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{data.total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Assets</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <p className="text-2xl font-bold text-green-400">{data.online.toLocaleString()}</p>
            </div>
            <p className="text-xs text-slate-400">Online Assets</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="h-4 w-4 text-red-400" />
              <p className="text-2xl font-bold text-red-400">{(data.total - data.online).toLocaleString()}</p>
            </div>
            <p className="text-xs text-slate-400">Offline Assets</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{uptimePercentage}%</p>
            <p className="text-xs text-slate-400">Uptime Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Type Distribution Pie Chart */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">By Asset Type</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {typeData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: typeColors[index % typeColors.length] }}
                  ></div>
                  <span className="text-xs text-slate-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">By Status</h4>
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
                    width={70}
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

        {/* Risk Level Radial Chart */}
        <div>
          <h4 className="text-sm font-medium text-white mb-4">Risk Distribution</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={riskData}>
                  <RadialBar
                    label={{ position: 'insideStart', fill: 'white', fontSize: 12 }}
                    background
                    dataKey="value"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-3 shadow-lg">
                            <p className="text-white font-medium">{payload[0].payload.name} Risk</p>
                            <p className="text-slate-300">{`Count: ${payload[0].value}`}</p>
                            <p className="text-slate-400 text-sm">
                              {`${((payload[0].value / data.total) * 100).toFixed(1)}% of total assets`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Level Summary */}
            <div className="space-y-4">
              {riskData.map((item) => {
                const percentage = ((item.value / data.total) * 100).toFixed(1);
                return (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.fill }}
                        ></div>
                        <span className="text-white font-medium capitalize">{item.name} Risk</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{item.value}</p>
                      <p className="text-xs text-slate-400">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Asset Health Summary */}
        <div className="bg-soc-dark-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-green-400" />
              <div>
                <h4 className="text-white font-medium">Asset Health Score</h4>
                <p className="text-xs text-slate-400">Based on uptime and risk factors</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">
                {Math.max(0, 100 - ((riskData.find(r => r.name === 'Critical')?.value || 0) * 2)).toFixed(0)}
              </p>
              <p className="text-xs text-slate-400">Health Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDistributionChart;