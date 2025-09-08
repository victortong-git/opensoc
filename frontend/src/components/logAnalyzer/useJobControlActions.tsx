import { useState, useRef, useEffect } from 'react';
import aiAnalysisJobService, { AIAnalysisJob } from '../../services/aiAnalysisJobService';
import toastNotificationService from '../../services/toastNotificationService';

interface UseJobControlActionsProps {
  fileId: string;
  currentJob: AIAnalysisJob | null;
  lastKnownJob: AIAnalysisJob | null;
  setCurrentJob: (job: AIAnalysisJob) => void;
  setLastKnownJob: (job: AIAnalysisJob) => void;
  setIsVisible: (visible: boolean) => void;
  setOptimisticStatus: (status: string | null) => void;
  setLastActionTime: (time: number) => void;
}

export const useJobControlActions = ({
  fileId,
  currentJob,
  lastKnownJob,
  setCurrentJob,
  setLastKnownJob,
  setIsVisible,
  setOptimisticStatus,
  setLastActionTime
}: UseJobControlActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use refs to maintain current values in closures
  const currentJobRef = useRef(currentJob);
  const lastKnownJobRef = useRef(lastKnownJob);
  
  // Update refs when props change
  useEffect(() => {
    currentJobRef.current = currentJob;
  }, [currentJob]);
  
  useEffect(() => {
    lastKnownJobRef.current = lastKnownJob;
  }, [lastKnownJob]);

  const refreshStatus = async () => {
    try {
      const jobToRefresh = currentJobRef.current || lastKnownJobRef.current;
      if (jobToRefresh) {
        console.log(`🔄 Refreshing status for job ${jobToRefresh.id} (current status: ${jobToRefresh.status})`);
        const statusResponse = await aiAnalysisJobService.getJobStatus(fileId, jobToRefresh.id);
        
        if (statusResponse.data.status !== jobToRefresh.status) {
          console.log('🔄 Job status changed via refreshStatus:', {
            jobId: jobToRefresh.id,
            from: jobToRefresh.status,
            to: statusResponse.data.status,
            currentBatch: statusResponse.data.currentBatch,
            totalBatches: statusResponse.data.totalBatches,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`📊 Status refresh - no change: ${statusResponse.data.status} (batch ${statusResponse.data.currentBatch}/${statusResponse.data.totalBatches})`);
        }
        
        setCurrentJob(statusResponse.data);
        setLastKnownJob(statusResponse.data);
        
        if (!aiAnalysisJobService.isTransitioning(statusResponse.data)) {
          setOptimisticStatus(null);
        }
      } else {
        console.log('⚠️ refreshStatus called but no currentJob or lastKnownJob available');
      }
    } catch (error) {
      console.error('❌ Error refreshing job status:', error);
    }
  };

  const handleStartAnalysis = async (selectedBatchSize: number, selectedBatchCount: number | null) => {
    setIsLoading(true);
    setLastActionTime(Date.now());
    
    try {
      const response = await aiAnalysisJobService.createJob(fileId, selectedBatchSize, selectedBatchCount);
      console.log('✨ Job created successfully:', {
        jobId: response.data.id,
        status: response.data.status,
        batchSize: response.data.batchSize,
        totalBatches: response.data.totalBatches,
        currentBatch: response.data.currentBatch
      });
      
      setCurrentJob(response.data);
      setLastKnownJob(response.data);
      setIsVisible(true);
      
      console.log('🔄 Scheduling job status checks to catch queued→running transition...');
      const jobIdForChecks = response.data.id;
      setTimeout(() => {
        console.log('📊 First status check (200ms after creation)...');
        const currentJobCheck = currentJobRef.current;
        if (currentJobCheck && currentJobCheck.id === jobIdForChecks) {
          refreshStatus();
        } else {
          console.log('⚠️ Job state changed, skipping first scheduled status check');
        }
      }, 200);
      setTimeout(() => {
        console.log('📊 Second status check (1s after creation)...');
        const jobToCheck = currentJobRef.current || lastKnownJobRef.current;
        if (jobToCheck && jobToCheck.id === jobIdForChecks) {
          refreshStatus();
        } else {
          console.log('⚠️ Job state changed, skipping second scheduled status check');
        }
      }, 1000);
      setTimeout(() => {
        console.log('📊 Third status check (2s after creation)...');
        const jobToCheck = currentJobRef.current || lastKnownJobRef.current;
        if (jobToCheck && jobToCheck.id === jobIdForChecks) {
          refreshStatus();
        } else {
          console.log('⚠️ Job state changed, skipping third scheduled status check');
        }
      }, 2000);
      
      toastNotificationService.showNotification({
        title: '🤖 AI Analysis Started',
        body: selectedBatchCount 
          ? `Security analysis job created: ${selectedBatchCount} batches of ${selectedBatchSize} lines each`
          : `Security analysis job created with batch size ${selectedBatchSize} (all batches)`
      });

      return response.data;
    } catch (error: any) {
      console.error('Error starting analysis:', error);
      
      toastNotificationService.showNotification({
        title: '❌ Analysis Failed',
        body: error.response?.data?.message || 'Failed to start AI analysis'
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseJob = async () => {
    if (!currentJobRef.current) return;
    
    setIsLoading(true);
    setOptimisticStatus('pausing');
    setLastActionTime(Date.now());
    
    try {
      const response = await aiAnalysisJobService.pauseJob(fileId, currentJobRef.current.id);
      setCurrentJob(response.data);
      
      setTimeout(() => refreshStatus(), 500);
      
      toastNotificationService.showNotification({
        title: '⏸️ Analysis Pause Requested',
        body: 'AI analysis will pause after current batch completes'
      });
    } catch (error: any) {
      console.error('Error pausing job:', error);
      setOptimisticStatus(null);
      
      toastNotificationService.showNotification({
        title: '❌ Pause Failed',
        body: error.response?.data?.message || 'Failed to pause analysis'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeJob = async () => {
    if (!currentJobRef.current) return;
    
    setIsLoading(true);
    setOptimisticStatus('running');
    setLastActionTime(Date.now());
    
    try {
      const response = await aiAnalysisJobService.resumeJob(fileId, currentJobRef.current.id);
      setCurrentJob(response.data);
      
      setTimeout(() => refreshStatus(), 500);
      
      toastNotificationService.showNotification({
        title: '▶️ Analysis Resumed',
        body: 'AI analysis job has been resumed'
      });
    } catch (error: any) {
      console.error('Error resuming job:', error);
      setOptimisticStatus(null);
      
      toastNotificationService.showNotification({
        title: '❌ Resume Failed',
        body: error.response?.data?.message || 'Failed to resume analysis'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!currentJobRef.current) return;
    
    setIsLoading(true);
    setOptimisticStatus('cancelling');
    setLastActionTime(Date.now());
    
    const cancellationTimeout = setTimeout(() => {
      console.warn('Cancellation timeout reached - resetting UI state');
      setOptimisticStatus(null);
      setIsLoading(false);
      toastNotificationService.showNotification({
        title: '⚠️ Cancellation Timeout',
        body: 'Cancellation is taking longer than expected. Please refresh to see current status.'
      });
    }, 10000);
    
    try {
      await aiAnalysisJobService.cancelJob(fileId, currentJobRef.current.id);
      
      clearTimeout(cancellationTimeout);
      setTimeout(() => refreshStatus(), 500);
      
      toastNotificationService.showNotification({
        title: '🛑 Analysis Cancel Requested',
        body: 'AI analysis will be cancelled'
      });
    } catch (error: any) {
      console.error('Error cancelling job:', error);
      
      clearTimeout(cancellationTimeout);
      setOptimisticStatus(null);
      
      toastNotificationService.showNotification({
        title: '❌ Cancel Failed',
        body: error.response?.data?.message || 'Failed to cancel analysis'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBatchSize = async (newBatchSize: number) => {
    if (!currentJobRef.current) return;
    
    setIsLoading(true);
    setLastActionTime(Date.now());
    
    try {
      setCurrentJob({ ...currentJobRef.current, batchSize: newBatchSize });
      setTimeout(() => refreshStatus(), 500);
      
      toastNotificationService.showNotification({
        title: '⚙️ Batch Size Updated',
        body: `Analysis will resume with batch size ${newBatchSize}`
      });
    } catch (error: any) {
      toastNotificationService.showNotification({
        title: '❌ Update Failed',
        body: error.response?.data?.message || 'Failed to update batch size'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleStartAnalysis,
    handlePauseJob,
    handleResumeJob,
    handleCancelJob,
    handleUpdateBatchSize,
    refreshStatus
  };
};