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
  Line,
  LineChart
} from 'recharts';
import { Shield, Target, Database, TrendingUp } from 'lucide-react';

interface IOCData {
  total: number;
  active: number;
  recentCount: number;
  byType: Array<{
    type: string;
    count: string;
  }>;
  byConfidence: Array<{
    confidence: string;
    count: string;
  }>;
  bySeverity: Array<{
    severity: string;
    count: string;
  }>;
}

interface ThreatIntelChartProps {
  data: IOCData | null;
  loading?: boolean;
}

const ThreatIntelChart: React.FC<ThreatIntelChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Threat Intelligence</h3>
          <Shield className="h-5 w-5 text-opensoc-400" />
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
          <h3 className="text-lg font-semibold text-white">Threat Intelligence</h3>
          <Shield className="h-5 w-5 text-opensoc-400" />
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400">No threat intelligence data available</p>
        </div>
      </div>
    );
  }

  // Transform IOC type data for donut chart
  const typeData = data.byType.map(item => ({
    name: item.type.replace('_', ' ').toUpperCase(),
    value: parseInt(item.count),
    type: item.type
  }));

  // Transform confidence data for horizontal bar chart
  const confidenceData = data.byConfidence.map(item => ({
    name: item.confidence.replace('_', ' ').toUpperCase(),
    value: parseInt(item.count),
    confidence: item.confidence
  }));

  // Mock activity timeline data based on recent activity
  const activityData = [
    { hour: '00:00', detected: Math.floor(data.recentCount * 0.08) },
    { hour: '03:00', detected: Math.floor(data.recentCount * 0.05) },
    { hour: '06:00', detected: Math.floor(data.recentCount * 0.12) },
    { hour: '09:00', detected: Math.floor(data.recentCount * 0.15) },
    { hour: '12:00', detected: Math.floor(data.recentCount * 0.18) },
    { hour: '15:00', detected: Math.floor(data.recentCount * 0.16) },
    { hour: '18:00', detected: Math.floor(data.recentCount * 0.14) },
    { hour: '21:00', detected: Math.floor(data.recentCount * 0.12) }
  ];

  // Color schemes
  const typeColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

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

  // Calculate threat score
  const threatScore = Math.min(100, Math.floor(
    (data.active / data.total) * 60 + 
    (data.recentCount / data.total) * 20 + 
    20
  ));

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return '#22c55e';
      case 'medium': return '#3b82f6';
      case 'low': return '#eab308';
      default: return '#ef4444';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Threat Intelligence</h3>
        <Shield className="h-5 w-5 text-opensoc-400" />
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{data.total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total IOCs</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-opensoc-400">{data.active.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Active IOCs</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-400">{data.recentCount.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Recent</p>
          </div>
          <div className="text-center p-3 bg-soc-dark-800/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{((data.active / data.total) * 100).toFixed(1)}%</p>
            <p className="text-xs text-slate-400">Active Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IOC Types Donut Chart */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">IOC Types Distribution</h4>
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
                    innerRadius={30}
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

          {/* Confidence Levels Horizontal Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Confidence Levels</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceData} layout="horizontal">
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
                    {confidenceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getConfidenceColor(entry.confidence)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Threat Activity Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">24-Hour Activity Timeline</h4>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-opensoc-400" />
              <span className="text-sm text-opensoc-400">Activity Trend</span>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-medium">{`${label}: ${payload[0].value} IOCs detected`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#0ea5e9', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="detected"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#1e293b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Intelligence Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-soc-dark-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6 text-red-400" />
                <div>
                  <h4 className="text-white font-medium">Threat Score</h4>
                  <p className="text-xs text-slate-400">Based on active indicators and activity</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${threatScore > 75 ? 'text-red-400' : threatScore > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {threatScore}
                </p>
                <p className="text-xs text-slate-400">Score /100</p>
              </div>
            </div>
          </div>

          <div className="bg-soc-dark-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-6 w-6 text-opensoc-400" />
                <div>
                  <h4 className="text-white font-medium">Coverage Rate</h4>
                  <p className="text-xs text-slate-400">IOC database completeness</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-opensoc-400">
                  {Math.min(100, (data.total / 10000 * 100)).toFixed(0)}%
                </p>
                <p className="text-xs text-slate-400">Coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatIntelChart;