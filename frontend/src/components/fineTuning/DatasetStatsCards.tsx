import React from 'react';
import { Database, Users, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { DatasetStats } from '../../services/fineTuningService';

interface DatasetStatsCardsProps {
  stats: DatasetStats | null;
}

const DatasetStatsCards: React.FC<DatasetStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6 text-opensoc-400" />
          <div>
            <p className="text-xl font-bold text-white">{stats?.totalAlerts || 0}</p>
            <p className="text-xs text-gray-400">Total Alerts</p>
          </div>
        </div>
      </div>

      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-yellow-400" />
          <div className="flex-1">
            <p className="text-xl font-bold text-white">{stats?.humanReviewedAlerts || 0}</p>
            <div className="flex items-center space-x-1">
              <p className="text-xs text-gray-400">Human Reviewed</p>
              <div className="group relative">
                <Info className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  <div className="text-center">Alerts that received user feedback for AI training</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
          <div className="flex-1">
            <p className="text-xl font-bold text-white">{stats?.qualityDistribution?.high || 0}</p>
            <div className="flex items-center space-x-1">
              <p className="text-xs text-gray-400">High Quality</p>
              <div className="group relative">
                <Info className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  <div className="text-center">High confidence feedback (8-10): User is very confident in their assessment</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-opensoc-400" />
          <div className="flex-1">
            <p className="text-xl font-bold text-white">{stats?.reviewerStats?.avgConfidence?.toFixed(1) || '0.0'}</p>
            <div className="flex items-center space-x-1">
              <p className="text-xs text-gray-400">Avg Confidence</p>
              <div className="group relative">
                <Info className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  <div className="text-center">Average confidence rating (1-10 scale) across all user feedback submissions</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetStatsCards;