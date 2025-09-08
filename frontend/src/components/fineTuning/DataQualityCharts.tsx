import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import { DatasetStats } from '../../services/fineTuningService';

interface DataQualityChartsProps {
  stats: DatasetStats | null;
}

const DataQualityCharts: React.FC<DataQualityChartsProps> = ({ stats }) => {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'low': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Quality Distribution */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-opensoc-300 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Data Quality Distribution</span>
          </h3>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
              <div className="font-medium mb-2">Quality Based on User Confidence:</div>
              <div className="space-y-1">
                <div>• <span className="text-green-400">High (8-10)</span>: Very confident feedback</div>
                <div>• <span className="text-yellow-400">Medium (5-7)</span>: Moderately confident feedback</div>
                <div>• <span className="text-red-400">Low (1-4)</span>: Low confidence feedback</div>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stats && Object.entries(stats.qualityDistribution).map(([quality, count]) => (
            <div key={quality} className="text-center">
              <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getQualityColor(quality)}`}>
                <span className="font-semibold">{count}</span>
                <span className="text-sm capitalize">{quality}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {quality === 'high' && 'Confidence 8-10'}
                {quality === 'medium' && 'Confidence 5-7'}
                {quality === 'low' && 'Confidence 1-4'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Event Type Distribution */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4">Security Event Type Coverage</h3>
        <div className="space-y-2">
          {stats && Object.entries(stats.eventTypeDistribution)
            .sort(([,a], [,b]) => b - a)
            .map(([eventType, count]) => (
            <div key={eventType} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300 capitalize">{eventType.replace('_', ' ')}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-opensoc-500 h-2 rounded-full"
                    style={{ width: `${(count / (stats.totalAlerts || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white min-w-[3rem] text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataQualityCharts;