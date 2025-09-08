import React from 'react';
import { StorageStats } from '../../store/logAnalyzerSlice';
import logAnalyzerService from '../../services/logAnalyzerService';
import { HardDrive, Database, FileText, Hash } from 'lucide-react';

interface SpaceUsageWidgetProps {
  stats: StorageStats;
}

const SpaceUsageWidget: React.FC<SpaceUsageWidgetProps> = ({ stats }) => {
  const getStorageUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600 dark:text-green-400';
    if (percentage < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStorageBarColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate processing metrics
  const avgFileSize = stats.totalFiles > 0 ? stats.totalFileSize / stats.totalFiles : 0;
  const avgLinesPerFile = stats.totalFiles > 0 ? stats.totalLines / stats.totalFiles : 0;
  const processingProgress = stats.totalLines > 0 ? (stats.currentLinesInDb / stats.totalLines) * 100 : 0;
  const linesNotInDb = stats.totalLines - stats.currentLinesInDb;
  const filesProcessedCount = stats.totalFiles; // All uploaded files
  const pendingProcessingLines = Math.max(0, linesNotInDb);

  return (
    <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <HardDrive className="h-5 w-5 mr-2 text-opensoc-600" />
        File Processing Statistics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Files */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {logAnalyzerService.formatNumber(stats.totalFiles)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Files</div>
          {avgFileSize > 0 && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Avg: {logAnalyzerService.formatFileSize(avgFileSize)}
            </div>
          )}
        </div>

        {/* Total Storage */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-3">
            <HardDrive className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {logAnalyzerService.formatFileSize(stats.totalFileSize)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Storage</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Physical files
          </div>
        </div>

        {/* Total Lines */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-3">
            <Hash className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {logAnalyzerService.formatNumber(stats.totalLines)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Lines Total</div>
          {avgLinesPerFile > 0 && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Avg: {logAnalyzerService.formatNumber(Math.round(avgLinesPerFile))}
            </div>
          )}
        </div>

        {/* Lines Processed */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg mx-auto mb-3">
            <Database className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {logAnalyzerService.formatNumber(stats.currentLinesInDb)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Lines Processed</div>
          <div className={`text-xs mt-1 ${getStorageUsageColor(processingProgress)}`}>
            {processingProgress.toFixed(1)}% complete
          </div>
        </div>
      </div>

      {/* Additional Processing Metrics */}
      {stats.completedFiles !== undefined && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Files by Status */}
          <div className="text-center p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.completedFiles || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed Files</div>
          </div>
          
          {stats.processingFiles > 0 && (
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {stats.processingFiles}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Processing</div>
            </div>
          )}
          
          {stats.errorFiles > 0 && (
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.errorFiles}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Error Files</div>
            </div>
          )}
          
          {stats.processingSuccessRate !== undefined && (
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.processingSuccessRate}%
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Success Rate</div>
            </div>
          )}
        </div>
      )}

      {/* Processing Progress Bar */}
      {stats.totalLines > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Log Processing Progress</span>
            <span className={getStorageUsageColor(processingProgress)}>
              {processingProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-soc-dark-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStorageBarColor(processingProgress)}`}
              style={{ width: `${Math.min(100, processingProgress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0% (Not processed)</span>
            <span>100% (Fully processed)</span>
          </div>
          {pendingProcessingLines > 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">{logAnalyzerService.formatNumber(pendingProcessingLines)}</span> lines pending processing
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-soc-dark-700">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Upload Directory:</span>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate" title={stats.uploadDirectory}>
              {stats.uploadDirectory}
            </div>
          </div>
          
          {stats.totalFiles > 0 && (
            <>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Avg File Size:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {logAnalyzerService.formatFileSize(avgFileSize)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500 dark:text-gray-400">Avg Lines/File:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {logAnalyzerService.formatNumber(Math.round(avgLinesPerFile))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Processing Status */}
      {processingProgress < 100 && stats.totalFiles > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="ml-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Processing in Progress
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {processingProgress < 50 
                  ? `${logAnalyzerService.formatNumber(pendingProcessingLines)} lines are still being processed. This may take some time for large files.`
                  : `Processing is nearly complete. ${logAnalyzerService.formatNumber(pendingProcessingLines)} lines remaining.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Complete */}
      {processingProgress >= 100 && stats.totalFiles > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start">
            <Database className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="ml-2">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                Processing Complete
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All log lines have been successfully processed and are available for analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceUsageWidget;