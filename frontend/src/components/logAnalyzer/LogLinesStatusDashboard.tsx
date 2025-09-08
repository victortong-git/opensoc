import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { consolidateAlertCounts, AlertCountSources } from '../../utils/alertUtils';

interface LogLinesStatusDashboardProps {
  fileId: string;
  securityStats: any;
  onStatsUpdate: (stats: any) => void;
}

interface StatusCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const LogLinesStatusDashboard: React.FC<LogLinesStatusDashboardProps> = ({ 
  fileId, 
  securityStats, 
  onStatsUpdate 
}) => {
  const { selectedFile, linesPagination } = useSelector((state: RootState) => state.logAnalyzer);

  // Real-time updates are now handled by WebSocket in LogLinesPage
  // This component will receive fresh stats via props when analysis progresses

  const calculateAnalysisProgress = () => {
    if (!selectedFile) return 0;
    
    // For file-level analysis progress, we should use security stats (actual analyzed lines)
    // NOT currentLinesCount which tracks job processing progress
    const totalFileLines = selectedFile.totalLines || 0;
    
    // Use security stats for actual analysis progress (lines that have been analyzed)
    if (securityStats?.analyzedLines !== undefined && totalFileLines > 0) {
      const analyzed = securityStats.analyzedLines;
      return Math.round((analyzed / totalFileLines) * 100);
    }

    // Fallback to pre-calculated progress from backend if available
    if (securityStats?.analysisProgress !== undefined) {
      return Math.round(securityStats.analysisProgress);
    }
    
    return 0;
  };

  const getEstimatedTimeRemaining = () => {
    if (!selectedFile || !securityStats) return 'N/A';
    
    const total = selectedFile.totalLines || 0;
    const analyzed = securityStats.analyzedLines || 0;
    const remaining = total - analyzed;
    
    if (remaining <= 0) return 'Completed';
    if (analyzed === 0) return 'N/A';
    
    // Estimate based on historical analysis rate
    // Assume 10 lines per batch, 30 seconds per batch
    const estimatedBatches = Math.ceil(remaining / 10);
    const estimatedMinutes = Math.ceil((estimatedBatches * 30) / 60);
    
    if (estimatedMinutes < 1) return '< 1 min';
    if (estimatedMinutes < 60) return `${estimatedMinutes} min`;
    return `${Math.round(estimatedMinutes / 60)} hr`;
  };

  // Consolidate alert count data from available sources
  const alertCountSources: AlertCountSources = {
    securityStats: securityStats ? {
      alertsCreated: securityStats.alertsCreated || 0,
      securityIssues: securityStats.securityIssues || 0
    } : undefined
  };

  const consolidatedCounts = consolidateAlertCounts(
    alertCountSources,
    `LogLinesStatusDashboard-${fileId}`
  );

  const alertsCreatedValue = consolidatedCounts.alertsCreated;
  const securityIssuesValue = consolidatedCounts.securityIssues;

  const statusCards: StatusCard[] = [
    {
      title: 'Total Lines',
      value: selectedFile?.totalLines?.toLocaleString() || '0',
      subtitle: `${((selectedFile?.fileSize || 0) / 1024 / 1024).toFixed(2)}MB`,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'File Analysis Progress',
      value: `${calculateAnalysisProgress()}%`,
      subtitle: `ETA: ${getEstimatedTimeRemaining()}`,
      icon: Activity,
      color: 'indigo',
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: 'Security Issues',
      value: securityIssuesValue,
      subtitle: `${securityStats?.severityBreakdown?.critical || 0} critical`,
      icon: AlertTriangle,
      color: securityIssuesValue > 0 ? 'red' : 'green'
    },
    {
      title: 'Alerts Created',
      value: alertsCreatedValue,
      subtitle: `From security issues (${consolidatedCounts.source.replace('_', ' ')})`,
      icon: Shield,
      color: 'orange'
    }
  ];

  const getProgressBarColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const progress = calculateAnalysisProgress();

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900/20`}>
                  <card.icon className={`h-5 w-5 text-${card.color}-600 dark:text-${card.color}-400`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                </div>
              </div>
              {card.trend && (
                <div className={`flex items-center text-sm ${
                  card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {card.trend.value}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Progress Bar */}
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Target className="h-5 w-5 mr-2" />
            File Analysis Progress (All Records)
          </h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {securityStats?.analyzedLines || 0} of {selectedFile?.totalLines || 0} lines analyzed (entire file)
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {progress}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-soc-dark-800 rounded-full h-3">
            <div
              className={`${getProgressBarColor(progress)} h-3 rounded-full transition-all duration-300 ease-in-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Started {selectedFile?.createdAt ? new Date(selectedFile.createdAt).toLocaleTimeString() : 'N/A'}</span>
            <span>ETA: {getEstimatedTimeRemaining()}</span>
          </div>
        </div>
      </div>

      {/* Security Summary */}
      {securityStats && securityStats.securityIssuesFound > 0 && (
        <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Shield className="h-5 w-5 mr-2 text-red-500" />
            Security Issues Detected
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {securityStats.criticalIssues || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {securityStats.highIssues || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {securityStats.mediumIssues || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {securityStats.lowIssues || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Low</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogLinesStatusDashboard;