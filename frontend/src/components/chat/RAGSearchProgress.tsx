import React from 'react';
import { 
  Database, 
  AlertTriangle, 
  Shield, 
  FileText, 
  CheckCircle, 
  Clock, 
  Loader,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DataSourceProgress {
  dataSource: string;
  resultsFound: number;
  searchTime?: number;
  status: 'pending' | 'searching' | 'completed' | 'error';
  error?: string;
}

interface RAGSearchProgressProps {
  isVisible: boolean;
  isExpanded: boolean;
  stage: 'embedding' | 'searching' | 'completed' | 'error';
  message: string;
  progress: number;
  totalSources: number;
  searchBreakdown?: Array<{
    dataSource: string;
    resultsFound: number;
    searchTime: number;
    topSimilarity?: number;
  }>;
  totalResults?: number;
  totalSearchTime?: number;
  currentDataSource?: string;
  error?: string;
  onToggleExpanded?: () => void;
}

const RAGSearchProgress: React.FC<RAGSearchProgressProps> = ({
  isVisible,
  isExpanded,
  stage,
  message,
  progress,
  totalSources,
  searchBreakdown = [],
  totalResults = 0,
  totalSearchTime = 0,
  currentDataSource,
  error,
  onToggleExpanded
}) => {
  if (!isVisible) return null;

  // Helper function to get icon for data source
  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource.toLowerCase()) {
      case 'alerts':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'incidents':
        return <Shield className="h-4 w-4 text-orange-400" />;
      case 'assets':
        return <Database className="h-4 w-4 text-blue-400" />;
      case 'iocs':
        return <Database className="h-4 w-4 text-purple-400" />;
      case 'playbooks':
        return <FileText className="h-4 w-4 text-green-400" />;
      default:
        return <Database className="h-4 w-4 text-slate-400" />;
    }
  };

  // Helper function to get readable data source name
  const getDataSourceName = (dataSource: string) => {
    switch (dataSource.toLowerCase()) {
      case 'alerts':
        return 'Security Alerts';
      case 'incidents':
        return 'Incidents';
      case 'assets':
        return 'Assets';
      case 'iocs':
        return 'Threat Intel (IOCs)';
      case 'playbooks':
        return 'Playbooks';
      default:
        return dataSource.charAt(0).toUpperCase() + dataSource.slice(1);
    }
  };

  // Create progress items for all data sources
  const allDataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
  const progressItems: DataSourceProgress[] = allDataSources.map(source => {
    // Check if this source has completed search (in breakdown)
    const breakdown = searchBreakdown.find(item => item.dataSource === source);
    
    if (breakdown) {
      // Source has completed search
      return {
        dataSource: source,
        resultsFound: breakdown.resultsFound,
        searchTime: breakdown.searchTime,
        status: breakdown.error ? 'error' : 'completed',
        error: breakdown.error
      };
    }
    
    // Check if this source is currently being searched
    if (currentDataSource === source && stage === 'searching') {
      return {
        dataSource: source,
        resultsFound: 0,
        status: 'searching'
      };
    }
    
    // All other sources are pending
    return {
      dataSource: source,
      resultsFound: 0,
      status: 'pending'
    };
  });

  // Collapsed view for completed search
  if (!isExpanded && stage === 'completed') {
    return (
      <div className="bg-soc-dark-800/50 border border-soc-dark-600 rounded-lg p-3 mb-4">
        <button
          onClick={onToggleExpanded}
          className="flex items-center justify-between w-full text-left hover:bg-soc-dark-700/30 rounded transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-white">
                Searched {totalSources} sources • {totalResults} results found
              </span>
              <span className="text-xs text-slate-400 ml-2">
                {totalSearchTime}ms
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-600 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-opensoc-600/20 rounded-lg flex items-center justify-center">
          {stage === 'embedding' ? (
            <Search className="h-4 w-4 text-opensoc-400 animate-pulse" />
          ) : stage === 'searching' ? (
            <Loader className="h-4 w-4 text-opensoc-400 animate-spin" />
          ) : stage === 'completed' ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">
              {stage === 'embedding' && 'AI is generating search embeddings...'}
              {stage === 'searching' && 'AI is searching SOC data sources...'}
              {stage === 'completed' && 'Search completed successfully'}
              {stage === 'error' && 'Search failed'}
            </h4>
            <div className="flex items-center space-x-2">
              {stage === 'completed' && (
                <span className="text-xs text-slate-400">
                  {totalSearchTime}ms total
                </span>
              )}
              {stage === 'completed' && onToggleExpanded && (
                <button
                  onClick={onToggleExpanded}
                  className="p-1 hover:bg-soc-dark-700 rounded transition-colors"
                  title="Collapse search details"
                >
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{message}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {stage === 'searching' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Searching {progress} of {totalSources} data sources</span>
            <span>{Math.round((progress / totalSources) * 100)}%</span>
          </div>
          <div className="w-full bg-soc-dark-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-opensoc-600 to-opensoc-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(progress / totalSources) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Data Source Progress Items */}
      <div className="space-y-2">
        {progressItems.map((item) => (
          <div
            key={item.dataSource}
            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
              item.status === 'searching' 
                ? 'bg-opensoc-600/10 border border-opensoc-600/30' 
                : item.status === 'completed'
                ? 'bg-soc-dark-700/50'
                : 'bg-soc-dark-700/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              {getDataSourceIcon(item.dataSource)}
              <div>
                <div className="text-sm text-white">
                  {getDataSourceName(item.dataSource)}
                </div>
                {item.searchTime && (
                  <div className="text-xs text-slate-400">
                    {item.searchTime}ms
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {item.status === 'searching' ? (
                <div className="flex items-center space-x-2">
                  <Loader className="h-3 w-3 text-opensoc-400 animate-spin" />
                  <span className="text-xs text-opensoc-400">Searching...</span>
                </div>
              ) : item.status === 'completed' ? (
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${
                    item.resultsFound > 0 ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    {item.resultsFound} result{item.resultsFound !== 1 ? 's' : ''}
                  </span>
                  <CheckCircle className="h-3 w-3 text-green-400" />
                </div>
              ) : item.status === 'error' ? (
                <AlertTriangle className="h-3 w-3 text-red-400" />
              ) : (
                <Clock className="h-3 w-3 text-slate-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Search Completion Summary */}
      {stage === 'completed' && (
        <div className="mt-4 pt-3 border-t border-soc-dark-600">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Search completed • {totalResults} total results found
            </span>
            <span className="text-slate-400">
              {totalSearchTime}ms total search time
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {stage === 'error' && error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default RAGSearchProgress;