import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AlertTrendData {
  time: string;
  timestamp: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface AlertTrendsChartProps {
  data: AlertTrendData[];
  loading?: boolean;
}

const AlertTrendsChart: React.FC<AlertTrendsChartProps> = ({ data, loading = false }) => {
  const [selectedLines, setSelectedLines] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true,
    total: true
  });

  const toggleLine = (lineKey: keyof typeof selectedLines) => {
    setSelectedLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const getLineConfig = () => [
    {
      key: 'critical',
      name: 'Critical (5)',
      stroke: '#ef4444',
      strokeWidth: 3,
      dot: { fill: '#ef4444', strokeWidth: 2, r: 4 }
    },
    {
      key: 'high', 
      name: 'High (4)',
      stroke: '#f97316',
      strokeWidth: 2,
      dot: { fill: '#f97316', strokeWidth: 2, r: 3 }
    },
    {
      key: 'medium',
      name: 'Medium (3)', 
      stroke: '#eab308',
      strokeWidth: 2,
      dot: { fill: '#eab308', strokeWidth: 2, r: 3 }
    },
    {
      key: 'low',
      name: 'Low (1-2)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      dot: { fill: '#3b82f6', strokeWidth: 2, r: 3 }
    },
    {
      key: 'total',
      name: 'Total',
      stroke: '#0ea5e9',
      strokeWidth: 2,
      dot: { fill: '#0ea5e9', strokeWidth: 2, r: 4 },
      strokeDasharray: '5 5'
    }
  ];

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
          <p className="text-white font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-slate-300 text-sm">{entry.name}</span>
                </div>
                <span className="text-white font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="loading-spinner"></div>
        <span className="text-slate-400 ml-3">Loading alert trends...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-2">No alert trend data available</div>
          <div className="text-sm text-slate-500">Data will appear once alerts are created</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {getLineConfig().map((line) => (
            <button
              key={line.key}
              onClick={() => toggleLine(line.key as keyof typeof selectedLines)}
              className={`flex items-center space-x-2 px-2 py-1 rounded transition-opacity ${
                selectedLines[line.key as keyof typeof selectedLines] 
                  ? 'opacity-100' 
                  : 'opacity-50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: line.stroke }}
              ></div>
              <span className="text-sm text-slate-300">{line.name}</span>
              <span className="text-xs text-slate-400 font-mono">
                {data.reduce((sum, item) => sum + (item[line.key as keyof AlertTrendData] as number || 0), 0)}
              </span>
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          Click legend items to toggle visibility
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            
            {getLineConfig().map((line) => (
              selectedLines[line.key as keyof typeof selectedLines] && (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  dot={line.dot}
                  strokeDasharray={line.strokeDasharray}
                  connectNulls={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-700">
        {getLineConfig().map((line) => {
          const total = data.reduce((sum, item) => sum + (item[line.key as keyof AlertTrendData] as number || 0), 0);
          const latest = data[data.length - 1]?.[line.key as keyof AlertTrendData] as number || 0;
          
          return (
            <div key={line.key} className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: line.stroke }}
                ></div>
                <span className="text-xs text-slate-400">{line.name}</span>
              </div>
              <div className="text-lg font-bold text-white">{total}</div>
              <div className="text-xs text-slate-500">
                Latest: {latest}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertTrendsChart;