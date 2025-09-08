import React from 'react';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Shield, 
  Users, 
  CheckCircle,
  PieChart
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResponseMetricsProps {
  averageResponseTime: number;
  slaCompliance: number;
  incidentsByCategory: Array<{ name: string; value: number; color: string }>;
  teamPerformance: Array<{ name: string; resolved: number; active: number }>;
  loading?: boolean;
  compact?: boolean;
}

const ResponseMetrics: React.FC<ResponseMetricsProps> = ({
  averageResponseTime,
  slaCompliance,
  incidentsByCategory,
  teamPerformance,
  loading = false,
  compact = false
}) => {
  const getSLAColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSLABgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-2">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-slate-300">{data.value} incidents</p>
          <p className="text-slate-400 text-xs">{((data.value / incidentsByCategory.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-opensoc-500"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="h-full">
        <h3 className="text-lg font-semibold text-white mb-4">Response Metrics</h3>
        
        <div className="space-y-4">
          {/* Average Response Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-slate-400 text-sm">Response Time</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{averageResponseTime}m</div>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-slate-400 text-sm">SLA Compliance</span>
            </div>
            <div className={`text-lg font-bold ${getSLAColor(slaCompliance)}`}>
              {slaCompliance}%
            </div>
          </div>

          {/* Mini pie chart or summary */}
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Top Categories</span>
            </div>
            <div className="space-y-1">
              {incidentsByCategory.slice(0, 3).map((category, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-slate-300 capitalize">
                      {category.name.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-white font-medium">{category.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Time & SLA Metrics */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Response Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Response Time */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-slate-400">Average Response Time</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {averageResponseTime}
              <span className="text-sm text-slate-400 ml-1">minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <TrendingUp className="h-3 w-3" />
              <span>12% improvement from last week</span>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-slate-400">SLA Compliance</span>
            </div>
            <div className={`text-2xl font-bold ${getSLAColor(slaCompliance)}`}>
              {slaCompliance}%
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getSLABgColor(slaCompliance)}`}
                style={{ width: `${slaCompliance}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Incident Distribution */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Incident Distribution</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={incidentsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {incidentsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={customTooltip} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend & Stats */}
          <div className="space-y-3">
            {incidentsByCategory.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-slate-300 capitalize">
                    {category.name.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{category.value}</div>
                  <div className="text-xs text-slate-400">
                    {((category.value / incidentsByCategory.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Team Performance</h3>
        
        <div className="space-y-4">
          {teamPerformance.map((member, index) => {
            const total = member.resolved + member.active;
            const resolvedPercentage = total > 0 ? (member.resolved / total) * 100 : 0;
            
            return (
              <div key={index} className="p-4 bg-slate-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">{member.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">{member.resolved} resolved</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3 text-yellow-400" />
                      <span className="text-yellow-400">{member.active} active</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${resolvedPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-12">
                    {resolvedPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


export default ResponseMetrics;