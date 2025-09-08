import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IncidentTrendData {
  time: string;
  timestamp: string;
  open: number;
  investigating: number;
  contained: number;
  resolved: number;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface IncidentTrendsChartProps {
  data: IncidentTrendData[];
  loading?: boolean;
  showSeverity?: boolean;
}

const IncidentTrendsChart: React.FC<IncidentTrendsChartProps> = ({ 
  data, 
  loading = false, 
  showSeverity = false 
}) => {
  const [selectedLines, setSelectedLines] = useState({
    open: true,
    investigating: true,
    contained: true,
    resolved: true,
    total: true,
    critical: true, // Always show critical when severity is enabled
    high: true,     // Always show high when severity is enabled
    medium: false,  // Hide medium by default for cleaner view
    low: false      // Hide low by default for cleaner view
  });

  const toggleLine = (lineKey: keyof typeof selectedLines) => {
    setSelectedLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const getStatusLines = () => [
    {
      key: 'open',
      name: 'Open',
      stroke: '#ef4444',
      strokeWidth: 3,
      dot: { fill: '#ef4444', strokeWidth: 2, r: 4 }
    },
    {
      key: 'investigating',
      name: 'Investigating',
      stroke: '#eab308',
      strokeWidth: 2,
      dot: { fill: '#eab308', strokeWidth: 2, r: 3 }
    },
    {
      key: 'contained',
      name: 'Contained',
      stroke: '#3b82f6',
      strokeWidth: 2,
      dot: { fill: '#3b82f6', strokeWidth: 2, r: 3 }
    },
    {
      key: 'resolved',
      name: 'Resolved',
      stroke: '#10b981',
      strokeWidth: 2,
      dot: { fill: '#10b981', strokeWidth: 2, r: 3 }
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

  const getSeverityLines = () => showSeverity ? [
    {
      key: 'critical',
      name: 'Critical (5)',
      stroke: '#dc2626',
      strokeWidth: 3,
      dot: { fill: '#dc2626', strokeWidth: 2, r: 4 }
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
      stroke: '#fbbf24',
      strokeWidth: 2,
      dot: { fill: '#fbbf24', strokeWidth: 2, r: 3 }
    },
    {
      key: 'low',
      name: 'Low (1-2)',
      stroke: '#60a5fa',
      strokeWidth: 2,
      dot: { fill: '#60a5fa', strokeWidth: 2, r: 3 }
    }
  ] : [];

  const getLineConfig = () => {
    return [...getStatusLines(), ...getSeverityLines()];
  };

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Helper function to get status icons
  const getStatusIcon = (key: string): string => {
    const iconMap: { [key: string]: string } = {
      open: '🔴',
      investigating: '🟡',
      contained: '🔵',
      resolved: '🟢',
      total: '📊',
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    };
    return iconMap[key] || '⚪';
  };

  // Helper function to calculate trend indicator
  const getTrendIndicator = (currentValue: number, previousValue: number): string => {
    if (currentValue > previousValue) return '↗️';
    if (currentValue < previousValue) return '↘️';
    return '→';
  };

  // Helper function to get trend from data
  const getTrendForDataPoint = (key: string, currentIndex: number): string => {
    if (currentIndex === 0 || !data[currentIndex - 1]) return '→';
    const current = data[currentIndex][key as keyof IncidentTrendData] as number || 0;
    const previous = data[currentIndex - 1][key as keyof IncidentTrendData] as number || 0;
    return getTrendIndicator(current, previous);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Separate status and severity data
      const statusKeys = ['open', 'investigating', 'contained', 'resolved', 'total'];
      const severityKeys = ['critical', 'high', 'medium', 'low'];
      
      const statusData = payload.filter((entry: any) => statusKeys.includes(entry.dataKey));
      const severityData = payload.filter((entry: any) => severityKeys.includes(entry.dataKey));
      
      // Helper to render a data row
      const renderDataRow = (data: any[], title: string, emoji: string) => {
        const filteredData = data.filter(entry => entry.value > 0); // Hide zero values
        if (filteredData.length === 0) return null;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">{emoji} {title}:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {filteredData.map((entry: any, index: number) => (
                <div key={index} className="flex items-center space-x-1.5 bg-slate-800/40 px-2 py-1 rounded">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-slate-300 text-xs font-medium whitespace-nowrap">
                    {entry.name}
                  </span>
                  <span className="text-white text-xs font-bold">
                    {formatNumber(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      };
      
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 shadow-xl max-w-2xl">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-700/50">
            <div className="w-2 h-2 bg-opensoc-500 rounded-full"></div>
            <p className="text-white font-semibold text-sm">{label}</p>
          </div>
          
          {/* Content in compact rows */}
          <div className="space-y-3">
            {/* Status Row */}
            {renderDataRow(statusData, "Status", "📊")}
            
            {/* Severity Row (only if showSeverity and has data) */}
            {showSeverity && severityData.length > 0 && renderDataRow(severityData, "Severity", "🎯")}
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
        <span className="text-slate-400 ml-3">Loading incident trends...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-2">No incident trend data available</div>
          <div className="text-sm text-slate-500">Data will appear once incidents are created</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Interactive Legend */}
      <div className={`${showSeverity ? 'space-y-4' : 'space-y-3'} pb-2`}>
        {/* Status Legend Row */}
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {showSeverity && (
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                  📊 Status
                </span>
              </div>
            )}
            {getStatusLines().map((line) => (
              <button
                key={line.key}
                onClick={() => toggleLine(line.key as keyof typeof selectedLines)}
                className={`flex items-center space-x-2 px-2 py-1 rounded transition-opacity ${
                  selectedLines[line.key as keyof typeof selectedLines] 
                    ? 'opacity-100' 
                    : 'opacity-50'
                }`}
                title={`Click to ${selectedLines[line.key as keyof typeof selectedLines] ? 'hide' : 'show'} ${line.name}`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: line.stroke }}
                ></div>
                <span className="text-sm text-slate-300">{line.name}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {data.reduce((sum, item) => sum + (item[line.key as keyof IncidentTrendData] as number || 0), 0)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Severity Legend Row */}
        {showSeverity && getSeverityLines().length > 0 && (
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                  🎯 Severity
                </span>
              </div>
              {getSeverityLines().map((line) => (
                <button
                  key={line.key}
                  onClick={() => toggleLine(line.key as keyof typeof selectedLines)}
                  className={`flex items-center space-x-2 px-2 py-1 rounded transition-opacity ${
                    selectedLines[line.key as keyof typeof selectedLines] 
                      ? 'opacity-100' 
                      : 'opacity-50'
                  }`}
                  title={`Click to ${selectedLines[line.key as keyof typeof selectedLines] ? 'hide' : 'show'} ${line.name}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: line.stroke }}
                  ></div>
                  <span className="text-sm text-slate-300">{line.name}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {data.reduce((sum, item) => sum + (item[line.key as keyof IncidentTrendData] as number || 0), 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Single instruction text at bottom */}
        <div className="flex justify-center">
          <div className="text-xs text-slate-500">
            Click legend items to toggle visibility
          </div>
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
        {getStatusLines().map((line) => {
          const total = data.reduce((sum, item) => sum + (item[line.key as keyof IncidentTrendData] as number || 0), 0);
          const latest = data[data.length - 1]?.[line.key as keyof IncidentTrendData] as number || 0;
          
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

export default IncidentTrendsChart;