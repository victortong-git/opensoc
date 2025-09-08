import React from 'react';
import { Activity, CheckCircle, Zap } from 'lucide-react';
import { AIAnalysisJob, JobProgress } from '../../services/aiAnalysisJobService';
import aiAnalysisJobService from '../../services/aiAnalysisJobService';

interface JobStatisticsProps {
  jobToDisplay: AIAnalysisJob;
  progress: JobProgress;
  showCompletedResults: boolean;
  currentJob: AIAnalysisJob | null;
  realtimeBatchInfo: {
    batchNumber?: number;
    timestamp?: Date;
    processingTime?: number;
    recentBatches: Array<{batchNumber: number, completedAt: Date, processingTime?: number}>;
  };
  onStartNewAnalysis: () => void;
}

const JobStatistics: React.FC<JobStatisticsProps> = ({
  jobToDisplay,
  progress,
  showCompletedResults,
  currentJob,
  realtimeBatchInfo,
  onStartNewAnalysis
}) => {
  const renderProgressStatistics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {jobToDisplay.currentBatch}/{jobToDisplay.totalBatches}
          {jobToDisplay.maxBatches && jobToDisplay.maxBatches < Math.ceil(jobToDisplay.totalLines / jobToDisplay.batchSize) && (
            <span className="text-xs text-opensoc-600 dark:text-opensoc-400 ml-1">
              (limited)
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Batches
          {jobToDisplay.status === 'running' && jobToDisplay.currentBatch < jobToDisplay.totalBatches && (
            <span className="text-green-600 dark:text-green-400 ml-1">• Active</span>
          )}
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
        <div className="text-lg font-semibold text-red-600 dark:text-red-400">
          {progress.issuesFound}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Issues Found</div>
      </div>
      
      <div className="p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
        <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
          {progress.alertsCreated}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Alerts Created
          {progress.issuesFound > 0 && progress.alertsCreated === 0 && (
            <span className="block text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
              (Low severity issues don't create alerts)
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {progress.estimatedTimeRemaining 
            ? aiAnalysisJobService.formatTimeRemaining(progress.estimatedTimeRemaining)
            : 'N/A'
          }
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">ETA</div>
      </div>
    </div>
  );

  const renderCompletionSummary = () => (
    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center">
        <CheckCircle className="h-4 w-4 mr-2" />
        Analysis Complete!
      </h4>
      <div className="mb-3 text-sm text-green-700 dark:text-green-300">
        Successfully processed {jobToDisplay.linesProcessed?.toLocaleString() || 0} lines • Found {jobToDisplay.issuesFound || 0} security issues
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        <div className="text-center">
          <div className="font-medium text-green-700 dark:text-green-300">
            {jobToDisplay.currentBatch}
          </div>
          <div className="text-green-600 dark:text-green-400">Batches Processed</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-700 dark:text-green-300">
            {jobToDisplay.linesProcessed?.toLocaleString() || 0}
          </div>
          <div className="text-green-600 dark:text-green-400">Lines Analyzed</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-700 dark:text-green-300">
            {jobToDisplay.issuesFound || 0}
          </div>
          <div className="text-green-600 dark:text-green-400">Issues Found</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-700 dark:text-green-300">
            {jobToDisplay.alertsCreated || 0}
          </div>
          <div className="text-green-600 dark:text-green-400">
            Alerts Created
            {(jobToDisplay.issuesFound || 0) > 0 && (jobToDisplay.alertsCreated || 0) === 0 && (
              <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                (Low severity issues)
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-700 dark:text-green-300">
            {jobToDisplay.startTime && jobToDisplay.endTime ? 
              `${Math.round((new Date(jobToDisplay.endTime).getTime() - new Date(jobToDisplay.startTime).getTime()) / 1000)}s` 
              : 'N/A'}
          </div>
          <div className="text-green-600 dark:text-green-400">Total Time</div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
        <button
          onClick={onStartNewAnalysis}
          className="w-full px-4 py-2 bg-opensoc-600 text-white text-sm rounded-lg hover:bg-opensoc-700 transition-colors flex items-center justify-center"
          title="Start New Analysis"
        >
          <Zap className="h-4 w-4 mr-2" />
          Start New Analysis
        </button>
      </div>
    </div>
  );

  const renderRealtimeBatchInfo = () => {
    if (!currentJob || currentJob.status !== 'running' || realtimeBatchInfo.recentBatches.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center">
          <Activity className="h-4 w-4 mr-2 animate-pulse" />
          Recent Batch Completions
        </h4>
        <div className="space-y-2">
          {realtimeBatchInfo.recentBatches.slice(-3).map((batch, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Batch {batch.batchNumber}/{currentJob.totalBatches} completed
              </span>
              <div className="flex items-center space-x-2">
                {batch.processingTime && (
                  <span className="text-blue-600 dark:text-blue-400">
                    {(batch.processingTime / 1000).toFixed(1)}s
                  </span>
                )}
                <span className="text-blue-500 dark:text-blue-400">
                  {batch.completedAt.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        {!showCompletedResults && progress && jobToDisplay.currentBatch < jobToDisplay.totalBatches && (
          <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
              {realtimeBatchInfo.batchNumber && realtimeBatchInfo.batchNumber <= jobToDisplay.totalBatches ? (
                `Processing batch ${realtimeBatchInfo.batchNumber} of ${jobToDisplay.totalBatches}...`
              ) : (
                `Batch ${jobToDisplay.currentBatch} of ${jobToDisplay.totalBatches} in progress...`
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEnhancedProgressInfo = () => {
    if (showCompletedResults || !['running', 'cancelled'].includes(jobToDisplay.status)) {
      return null;
    }

    return (
      <div className={`mt-4 p-3 rounded-lg border ${
          jobToDisplay.status === 'cancelled'
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center ${
              jobToDisplay.status === 'cancelled'
              ? 'text-orange-700 dark:text-orange-300'
              : 'text-green-700 dark:text-green-300'
          }`}>
            <div className={`h-2 w-2 rounded-full mr-2 ${
              jobToDisplay.status === 'running' ? 'animate-pulse bg-green-500' : 'bg-orange-500'
            }`}></div>
            <span className="font-medium">
              {jobToDisplay.status === 'cancelled' ? 
                'Analysis cancelled' :
                (currentJob && currentJob.currentBatch > 0 ? 'Processing' : 'Starting') + ' analysis...'
              }
            </span>
          </div>
          <span className={`text-xs ${
              jobToDisplay.status === 'cancelled'
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {progress.linesProcessed.toLocaleString()} / {progress.totalLines.toLocaleString()} lines (job scope)
          </span>
        </div>
        
        {realtimeBatchInfo.recentBatches.length > 0 && (() => {
          const batchesWithTiming = realtimeBatchInfo.recentBatches.filter(b => b.processingTime && b.processingTime > 0);
          
          if (batchesWithTiming.length === 0) {
            return (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                Collecting batch timing data...
                <span className="ml-2 text-green-500 dark:text-green-500">
                  ({realtimeBatchInfo.recentBatches.length} batch{realtimeBatchInfo.recentBatches.length !== 1 ? 'es' : ''} tracked)
                </span>
              </div>
            );
          }
          
          const avgTime = batchesWithTiming.reduce((acc, b) => acc + (b.processingTime || 0), 0) / batchesWithTiming.length / 1000;
          
          return (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              Average batch time: {avgTime.toFixed(1)}s
              <span className="ml-2 text-green-500 dark:text-green-500">
                ({batchesWithTiming.length} of {realtimeBatchInfo.recentBatches.length} timed)
              </span>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <>
      {!showCompletedResults && renderProgressStatistics()}
      {showCompletedResults && renderCompletionSummary()}
      {renderRealtimeBatchInfo()}
      {renderEnhancedProgressInfo()}
    </>
  );
};

export default JobStatistics;