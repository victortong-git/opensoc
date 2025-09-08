import { AIAnalysisJob } from '../../services/aiAnalysisJobService';
import { updateFileProcessingStats } from '../../store/logAnalyzerSlice';
import { Dispatch } from '@reduxjs/toolkit';

interface RealtimeBatchInfo {
  batchNumber?: number;
  timestamp?: Date;
  processingTime?: number;
  recentBatches: Array<{batchNumber: number, completedAt: Date, processingTime?: number}>;
}

interface WebSocketHandlerParams {
  fileId: string;
  dispatch: Dispatch;
  setRealtimeBatchInfo: React.Dispatch<React.SetStateAction<RealtimeBatchInfo>>;
  setCurrentJob: React.Dispatch<React.SetStateAction<AIAnalysisJob | null>>;
  setLastKnownJob: React.Dispatch<React.SetStateAction<AIAnalysisJob | null>>;
  setShowCompletedResults: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletedJob: React.Dispatch<React.SetStateAction<AIAnalysisJob | null>>;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setOptimisticStatus: React.Dispatch<React.SetStateAction<string | null>>;
  stopPolling: () => void;
  completionTimeoutRef: React.MutableRefObject<number | null>;
  getCurrentJob: () => AIAnalysisJob | null;
  getLastKnownJob: () => AIAnalysisJob | null;
}

export const createWebSocketHandlers = (params: WebSocketHandlerParams) => {
  const {
    fileId,
    dispatch,
    setRealtimeBatchInfo,
    setCurrentJob,
    setLastKnownJob,
    setShowCompletedResults,
    setCompletedJob,
    setIsVisible,
    setOptimisticStatus,
    stopPolling,
    completionTimeoutRef,
    getCurrentJob,
    getLastKnownJob
  } = params;

  const handleBatchStarted = (data: any) => {
    if (data.fileId === fileId) {
      console.log(`Batch ${data.batchNumber} started`);
      setRealtimeBatchInfo(prev => ({
        ...prev,
        batchNumber: data.batchNumber,
        timestamp: new Date(data.timestamp)
      }));
    }
  };

  const handleBatchCompleted = (data: any) => {
    if (data.fileId === fileId) {
      console.log(`Batch ${data.batchNumber} completed`);
      const completedAt = new Date(data.timestamp);
      
      setRealtimeBatchInfo(prev => {
        const newBatch = {
          batchNumber: data.batchNumber,
          completedAt,
          processingTime: data.batchResults?.processingTime
        };
        
        return {
          ...prev,
          batchNumber: data.batchNumber,
          timestamp: completedAt,
          processingTime: data.batchResults?.processingTime,
          recentBatches: [
            ...prev.recentBatches.slice(-4), // Keep last 5 batches
            newBatch
          ]
        };
      });
      
      // Update job state immediately from WebSocket data
      setCurrentJob(prev => prev ? {
        ...prev,
        currentBatch: data.currentBatch || data.batchNumber,
        linesProcessed: data.linesProcessed,
        issuesFound: data.issuesFound,
        alertsCreated: data.alertsCreated,
        estimatedEndTime: data.estimatedEndTime
      } : prev);

      // Update Redux store with latest processing statistics
      dispatch(updateFileProcessingStats({
        fileId,
        linesProcessed: data.linesProcessed
      }));
    }
  };

  const handleAnalysisProgress = (data: any) => {
    if (data.fileId === fileId) {
      console.log('📈 AIJobProgressPanel: Analysis progress via WebSocket', {
        jobId: data.jobId,
        currentBatch: data.currentBatch,
        linesProcessed: data.linesProcessed,
        issuesFound: data.issuesFound,
        alertsCreated: data.alertsCreated
      });
      
      setCurrentJob(prev => {
        if (prev) {
          const updated = {
            ...prev,
            currentBatch: data.currentBatch,
            linesProcessed: data.linesProcessed,
            issuesFound: data.issuesFound,
            alertsCreated: data.alertsCreated,
            estimatedEndTime: data.estimatedEndTime
          };
          
          // Log status changes for debugging
          if (prev.status !== updated.status) {
            console.log('🔄 Job status changed via progress:', {
              jobId: prev.id,
              from: prev.status,
              to: updated.status,
              currentBatch: updated.currentBatch,
              totalBatches: updated.totalBatches
            });
          }
          
          return updated;
        }
        return prev;
      });

      // Update Redux store with latest processing statistics
      dispatch(updateFileProcessingStats({
        fileId,
        linesProcessed: data.linesProcessed
      }));
    }
  };

  const handleAnalysisStarted = (data: any) => {
    if (data.fileId === fileId) {
      console.log('🚀 AIJobProgressPanel: Analysis started via WebSocket', {
        jobId: data.jobId,
        status: data.status,
        batchSize: data.batchSize,
        totalBatches: data.totalBatches
      });
      
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'running',
        startTime: data.startTime
      } : prev);

      setLastKnownJob(prev => prev ? {
        ...prev,
        status: 'running',
        startTime: data.startTime
      } : prev);

      // Clear optimistic status since we got real status update
      setOptimisticStatus(null);
    }
  };

  const handleAnalysisCompleted = (data: any) => {
    if (data.fileId === fileId) {
      // Try to get current job from state, but use provided data as fallback
      let jobForCompletion = getCurrentJob() || getLastKnownJob();
      
      // If no job in state but we have completion data, create job from the data
      if (!jobForCompletion && data.jobId) {
        console.log('📋 No current job in state, creating from completion data');
        jobForCompletion = {
          id: data.jobId,
          fileId: data.fileId,
          organizationId: data.organizationId || '',
          userId: data.userId || '',
          status: data.status || 'completed',
          batchSize: data.batchSize || 10,
          currentBatch: data.currentBatch || 0,
          totalBatches: data.totalBatches || 1,
          maxBatches: data.maxBatches,
          linesProcessed: data.linesProcessed || 0,
          totalLines: data.totalLines || 1,
          issuesFound: data.issuesFound || 0,
          alertsCreated: data.alertsCreated || 0,
          pauseRequested: false,
          cancelRequested: false,
          startTime: data.startTime,
          endTime: data.endTime,
          estimatedEndTime: data.estimatedEndTime,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          logFile: data.logFile
        } as AIAnalysisJob;
      }
      
      console.log('🎯 AIJobProgressPanel: Handling completion', {
        dataFileId: data.fileId,
        expectedFileId: fileId,
        jobId: data.jobId,
        hasCurrentJob: !!getCurrentJob(),
        hasLastKnownJob: !!getLastKnownJob(),
        jobForCompletion: jobForCompletion?.id,
        createdFromData: !getCurrentJob() && !getLastKnownJob() && !!data.jobId
      });
      
      if (!jobForCompletion) {
        console.warn('⚠️ Cannot handle completion: No current job, last known job, or completion data available');
        return;
      }

      // Create completed job data with all completion information
      const completedJobData: AIAnalysisJob = {
        ...jobForCompletion,
        status: 'completed',
        currentBatch: data.currentBatch || jobForCompletion.currentBatch,
        linesProcessed: data.linesProcessed || jobForCompletion.linesProcessed,
        issuesFound: data.issuesFound || jobForCompletion.issuesFound,
        alertsCreated: data.alertsCreated || jobForCompletion.alertsCreated,
        endTime: data.endTime || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Setting completion state with data:', completedJobData);
      
      // Set completion state
      setCompletedJob(completedJobData);
      setCurrentJob(completedJobData);
      // Ensure visibility states are set correctly for completion
      setShowCompletedResults(true);
      setIsVisible(true);
      // Clear any optimistic status
      setOptimisticStatus(null);
      // Clear completion timeout
      completionTimeoutRef.current = null;
      // Stop polling since job is completed
      stopPolling();
      
      // Persist completed job to localStorage for recovery
      try {
        localStorage.setItem(`completedJob_${fileId}`, JSON.stringify(completedJobData));
        console.log('💾 Persisted completed job to localStorage');
      } catch (error) {
        console.warn('Failed to persist completed job to localStorage:', error);
      }

      // Update Redux store with final statistics
      dispatch(updateFileProcessingStats({
        fileId,
        linesProcessed: completedJobData.linesProcessed
      }));
    }
  };

  const handleAnalysisCancelled = (data: any) => {
    if (data.fileId === fileId) {
      // Use getCurrentJob or getLastKnownJob as fallback
      const jobForCancellation = getCurrentJob() || getLastKnownJob();
      
      console.log('🛑 AIJobProgressPanel: Handling cancellation', {
        dataFileId: data.fileId,
        expectedFileId: fileId,
        jobId: data.jobId,
        hasCurrentJob: !!getCurrentJob(),
        hasLastKnownJob: !!getLastKnownJob(),
        jobForCancellation: jobForCancellation?.id
      });

      if (!jobForCancellation) {
        console.warn('⚠️ Cannot handle cancellation: No current job or last known job available');
        return;
      }

      // Create cancelled job data
      const cancelledJobData: AIAnalysisJob = {
        ...jobForCancellation,
        status: 'cancelled',
        cancelRequested: false, // Clear the request flag
        endTime: data.endTime || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🛑 Setting cancellation state with data:', cancelledJobData);
      
      // Set cancellation state
      setCompletedJob(cancelledJobData);
      setCurrentJob(cancelledJobData);
      // Ensure visibility states are set correctly for cancellation
      setShowCompletedResults(true);
      setIsVisible(true);
      // Clear any optimistic status
      setOptimisticStatus(null);
      // Stop polling since job is completed/cancelled
      stopPolling();
      
      // Persist cancelled job to localStorage
      try {
        localStorage.setItem(`completedJob_${fileId}`, JSON.stringify(cancelledJobData));
        console.log('💾 Persisted cancelled job to localStorage');
      } catch (error) {
        console.warn('Failed to persist cancelled job to localStorage:', error);
      }
    }
  };

  const handleAnalysisPaused = (data: any) => {
    if (data.fileId === fileId) {
      console.log('⏸️ Analysis paused via WebSocket');
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'paused',
        pauseRequested: false,
        currentBatch: data.currentBatch
      } : prev);
      setOptimisticStatus(null);
    }
  };

  return {
    handleBatchStarted,
    handleBatchCompleted,
    handleAnalysisProgress,
    handleAnalysisStarted,
    handleAnalysisCompleted,
    handleAnalysisCancelled,
    handleAnalysisPaused
  };
};