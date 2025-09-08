import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Target,
  Pause,
  Play,
  Square,
  Settings,
  XCircle
} from 'lucide-react';
import { RootState } from '../../store';
import { fetchFileDetails } from '../../store/logAnalyzerAsync';
import { updateFileProcessingStats } from '../../store/logAnalyzerSlice';
import aiAnalysisJobService, { AIAnalysisJob, JobProgress } from '../../services/aiAnalysisJobService';
import websocketService from '../../services/websocketService';
import toastNotificationService from '../../services/toastNotificationService';
import { consolidateAlertCounts, AlertCountSources, ConsolidatedAlertCounts } from '../../utils/alertUtils';
import { createWebSocketHandlers } from './aiJobWebSocketHandlers';
import BatchSizeSelector from './BatchSizeSelector';
import { useJobControlActions } from './useJobControlActions';
import JobStatistics from './JobStatistics';

interface AIJobProgressPanelProps {
  fileId: string;
}

const AIJobProgressPanel: React.FC<AIJobProgressPanelProps> = ({ fileId }) => {
  const dispatch = useDispatch();
  const { selectedFile } = useSelector((state: RootState) => state.logAnalyzer);
  
  const [currentJob, setCurrentJob] = useState<AIAnalysisJob | null>(null);
  const [lastKnownJob, setLastKnownJob] = useState<AIAnalysisJob | null>(null);
  const [completedJob, setCompletedJob] = useState<AIAnalysisJob | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showCompletedResults, setShowCompletedResults] = useState(false);
  // isLoading is now provided by the useJobControlActions hook
  const [showBatchSizeSelector, setShowBatchSizeSelector] = useState(false);
  const [selectedBatchSize, setSelectedBatchSize] = useState<number>(10);
  const [selectedBatchCount, setSelectedBatchCount] = useState<number | null>(2);
  const [maxBatches, setMaxBatches] = useState<number>(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [realtimeBatchInfo, setRealtimeBatchInfo] = useState<{
    batchNumber?: number;
    timestamp?: Date;
    processingTime?: number;
    recentBatches: Array<{batchNumber: number, completedAt: Date, processingTime?: number}>;
  }>({ recentBatches: [] });
  const [completionDetectionInProgress, setCompletionDetectionInProgress] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const completionTimeoutRef = useRef<number | null>(null);
  const completionDetectionTimeoutRef = useRef<number | null>(null);
  const maxPollingAttempts = 50; // Prevent infinite polling - 50 attempts * 5s = 4+ minutes max
  const maxCompletionDetectionTime = 30000; // 30 seconds max for completion detection

  // Storage keys for persistence
  const completedJobStorageKey = `aiJob_completed_${fileId}`;
  const showCompletedResultsStorageKey = `aiJob_showCompleted_${fileId}`;

  // Use job control actions hook
  const {
    isLoading: hookIsLoading,
    handleStartAnalysis: startAnalysis,
    handlePauseJob,
    handleResumeJob,
    handleCancelJob,
    handleUpdateBatchSize,
    refreshStatus
  } = useJobControlActions({
    fileId,
    currentJob,
    lastKnownJob,
    setCurrentJob,
    setLastKnownJob,
    setIsVisible,
    setOptimisticStatus,
    setLastActionTime
  });

  // WebSocket-driven job status updates with minimal polling fallback
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let wsSubscriptions: string[] = [];

    // Function to stop polling when job completes
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const loadInitialJobState = async () => {
      try {
        // First, try to restore completed job from localStorage
        const storedCompletedJob = localStorage.getItem(completedJobStorageKey);
        const storedShowCompleted = localStorage.getItem(showCompletedResultsStorageKey) === 'true';
        
        if (storedCompletedJob && storedShowCompleted) {
          console.log('🔄 Restoring completed job from localStorage');
          try {
            const restoredJob = JSON.parse(storedCompletedJob);
            console.log('✅ Restored job data:', restoredJob);
            
            // Set all states together to avoid null reference during renders
            setCompletedJob(restoredJob);
            setCurrentJob(restoredJob);
            setShowCompletedResults(true);
            setIsVisible(true);
            
            console.log('✅ LocalStorage restoration complete');
          } catch (parseError) {
            console.warn('Failed to parse stored completed job:', parseError);
            // Clear invalid data
            localStorage.removeItem(completedJobStorageKey);
            localStorage.removeItem(showCompletedResultsStorageKey);
          }
        }
        
        const response = await aiAnalysisJobService.getActiveJob(fileId);
        if (response.data) {
          setCurrentJob(response.data);
          setLastKnownJob(response.data); // Always track the last known job state
          setIsVisible(true);
          setSelectedBatchSize(response.data.batchSize);
          
          // Clear optimistic status if real status is stable
          if (optimisticStatus && !aiAnalysisJobService.isTransitioning(response.data)) {
            setOptimisticStatus(null);
          }
        } else {
          // No active job found - check completion detection using lastKnownJob
          if (lastKnownJob && !showCompletedResults && !completedJob) {
            console.log('🎯 COMPLETION DETECTED via loadInitialJobState: Had lastKnownJob, now no active job');
            console.log(`   Last known job: ${lastKnownJob.id}, status: ${lastKnownJob.status}, progress: ${lastKnownJob.currentBatch}/${lastKnownJob.totalBatches}`);
            
            // The job completed and is no longer active - manually trigger completion
            const completionData = {
              jobId: lastKnownJob.id,
              fileId: lastKnownJob.fileId,
              organizationId: lastKnownJob.organizationId,
              userId: lastKnownJob.userId,
              status: 'completed' as const,
              batchSize: lastKnownJob.batchSize,
              currentBatch: lastKnownJob.currentBatch || lastKnownJob.totalBatches,
              totalBatches: lastKnownJob.totalBatches,
              totalLines: lastKnownJob.totalLines,
              linesProcessed: lastKnownJob.linesProcessed || (lastKnownJob.currentBatch * lastKnownJob.batchSize),
              issuesFound: lastKnownJob.issuesFound || 0,
              alertsCreated: lastKnownJob.alertsCreated || 0,
              startTime: lastKnownJob.startTime,
              endTime: new Date().toISOString(),
              createdAt: lastKnownJob.createdAt,
              updatedAt: new Date().toISOString(),
              logFile: lastKnownJob.logFile,
              timestamp: new Date()
            };
            
            console.log('✅ Triggering completion handler via loadInitialJobState with data:', completionData);
            handleAnalysisCompleted(completionData);
            return; // Stop here since we detected completion
          }
          
          // No active job found - check if we have completed results to preserve OR if completion detection is in progress
          if (!showCompletedResults && !completedJob && !completionDetectionInProgress) {
            console.log('⚠️ AIJobProgressPanel: No active job and no completed results, clearing state');
            // Only clear state if we don't have completed results to show AND completion detection is not in progress
            setCurrentJob(null);
            setLastKnownJob(null); // Clear last known job when completely resetting
            setIsVisible(false);
            setOptimisticStatus(null);
            setPollingAttempts(0); // Reset polling attempts
          } else {
            console.log('✅ AIJobProgressPanel: No active job but preserving completed state', {
              showCompletedResults,
              hasCompletedJob: !!completedJob
            });
            // If we have completed results, preserve visibility and stop polling
            if (showCompletedResults || completedJob) {
              setIsVisible(true);
              stopPolling();
            }
          }
        }
      } catch (error) {
        console.error('Error fetching active job:', error);
        if (!showCompletedResults && !completedJob && !completionDetectionInProgress) {
          setCurrentJob(null);
          setLastKnownJob(null); // Clear last known job on error if no completed results
          setIsVisible(false);
          setOptimisticStatus(null);
          setPollingAttempts(0); // Reset polling attempts
        } else {
          console.log('✅ AIJobProgressPanel: Error fetching active job but preserving completed state or completion detection in progress');
        }
      }
    };

    // Create WebSocket handlers using the extracted utility
    const webSocketHandlers = createWebSocketHandlers({
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
      getCurrentJob: () => currentJob,
      getLastKnownJob: () => lastKnownJob
    });

    const {
      handleBatchStarted,
      handleBatchCompleted,
      handleAnalysisProgress,
      handleAnalysisStarted,
      handleAnalysisCompleted,
      handleAnalysisCancelled,
      handleAnalysisPaused
    } = webSocketHandlers;






    // Setup WebSocket subscriptions for real-time updates
    const setupWebSocketSubscriptions = async () => {
      try {
        await websocketService.connect();
        
        // Subscribe to all relevant events for this file
        wsSubscriptions = [
          websocketService.subscribe('ai_batch_started', handleBatchStarted, fileId),
          websocketService.subscribe('ai_batch_completed', handleBatchCompleted, fileId),
          websocketService.subscribe('ai_analysis_progress', handleAnalysisProgress, fileId),
          websocketService.subscribe('ai_analysis_started', handleAnalysisStarted, fileId),
          websocketService.subscribe('ai_analysis_completed', handleAnalysisCompleted, fileId),
          websocketService.subscribe('ai_analysis_cancelled', handleAnalysisCancelled, fileId),
          websocketService.subscribe('ai_analysis_paused', handleAnalysisPaused, fileId)
        ];
        
        console.log('WebSocket subscriptions established for file:', fileId);
      } catch (error) {
        console.warn('WebSocket setup failed, using polling fallback:', error.message);
      }
    };

    // Initial load
    loadInitialJobState();
    setupWebSocketSubscriptions();
    
    // Enhanced fallback polling with completion detection
    const startPolling = () => {
      if (pollInterval) return; // Already polling
      
      pollInterval = setInterval(async () => {
        // Poll if WebSocket is disconnected OR if we have an active job without completed results
        const shouldPoll = !websocketService.isConnected() || (currentJob && !showCompletedResults);
        
        if (shouldPoll) {
          console.log('🔄 Polling for job status updates...');
          
          try {
            const response = await aiAnalysisJobService.getActiveJob(fileId);
            
            if (response.data) {
              const jobData = response.data;
              console.log(`📊 Polled job status: ${jobData.status}, progress: ${jobData.currentBatch}/${jobData.totalBatches}`);
              
              // Log any status transitions
              if (currentJob && currentJob.status !== jobData.status) {
                console.log('🔄 Job status transition detected via polling:', {
                  jobId: jobData.id,
                  from: currentJob.status,
                  to: jobData.status,
                  currentBatch: jobData.currentBatch,
                  totalBatches: jobData.totalBatches,
                  timestamp: new Date().toISOString()
                });
              }
              
              // Check if job reached final batch - start completion timeout
              if (jobData.currentBatch >= jobData.totalBatches && jobData.status === 'running') {
                if (!completionTimeoutRef.current) {
                  console.log('⏰ Job reached final batch - starting completion timeout');
                  completionTimeoutRef.current = Date.now();
                } else {
                  const timeWaiting = Date.now() - completionTimeoutRef.current;
                  console.log(`⏱️ Completion timeout progress: ${timeWaiting}ms / 15000ms`);
                  
                  if (timeWaiting > 15000) { // 15 second timeout
                    console.log('🚨 Completion timeout reached - forcing completion');
                    console.log('🔄 Ensuring lastKnownJob is set before timeout completion', {
                      currentJobId: currentJob?.id,
                      lastKnownJobId: lastKnownJob?.id,
                      polledJobId: jobData.id
                    });
                    
                    // Set completion detection flag to prevent state interference
                    setCompletionDetectionInProgress(true);
                    
                    // Start completion detection timeout if not already started
                    if (!completionDetectionTimeoutRef.current) {
                      completionDetectionTimeoutRef.current = Date.now();
                      console.log('⏱️ Started completion detection timeout via timeout completion (30s max)');
                    }
                    
                    // Ensure lastKnownJob has the most recent data before completion
                    if (!lastKnownJob || lastKnownJob.id !== jobData.id) {
                      setLastKnownJob(jobData);
                    }
                    
                    const completionData = {
                      jobId: jobData.id,
                      fileId: jobData.fileId,
                      organizationId: jobData.organizationId,
                      userId: jobData.userId,
                      status: 'completed',
                      batchSize: jobData.batchSize,
                      currentBatch: jobData.currentBatch,
                      totalBatches: jobData.totalBatches,
                      totalLines: jobData.totalLines,
                      linesProcessed: jobData.linesProcessed || (jobData.currentBatch * jobData.batchSize),
                      issuesFound: jobData.issuesFound || 0,
                      alertsCreated: jobData.alertsCreated || 0,
                      startTime: jobData.startTime,
                      endTime: new Date().toISOString(),
                      createdAt: jobData.createdAt,
                      updatedAt: new Date().toISOString(),
                      logFile: jobData.logFile,
                      timestamp: new Date()
                    };
                    
                    completionTimeoutRef.current = null; // Reset timeout
                    console.log('🎯 Triggering timeout completion handler with preserved job data');
                    handleAnalysisCompleted(completionData);
                    return;
                  }
                }
              } else {
                // Reset timeout if not at final batch
                if (completionTimeoutRef.current) {
                  console.log('🔄 Job moved away from final batch - resetting timeout');
                  completionTimeoutRef.current = null;
                }
              }
              
              // Check if job completed since last poll
              if (currentJob && currentJob.status !== 'completed' && jobData.status === 'completed') {
                console.log('✅ Job completion detected via polling - triggering completion handler');
                
                // Manually trigger completion handler since WebSocket event was missed
                const completionData = {
                  jobId: jobData.id,
                  fileId: jobData.fileId,
                  organizationId: jobData.organizationId,
                  userId: jobData.userId,
                  status: 'completed',
                  batchSize: jobData.batchSize,
                  currentBatch: jobData.currentBatch,
                  totalBatches: jobData.totalBatches,
                  totalLines: jobData.totalLines,
                  linesProcessed: jobData.linesProcessed,
                  issuesFound: jobData.issuesFound,
                  alertsCreated: jobData.alertsCreated,
                  startTime: jobData.startTime,
                  endTime: jobData.endTime,
                  createdAt: jobData.createdAt,
                  updatedAt: new Date().toISOString(),
                  logFile: jobData.logFile,
                  timestamp: new Date()
                };
                
                handleAnalysisCompleted(completionData);
                return; // Stop polling since job is complete
              }
              
              // Check if job was cancelled since last poll
              if (currentJob && currentJob.status !== 'cancelled' && jobData.status === 'cancelled') {
                console.log('🛑 Job cancellation detected via polling - triggering cancellation handler');
                
                const cancellationData = {
                  jobId: jobData.id,
                  fileId: jobData.fileId,
                  status: 'cancelled',
                  currentBatch: jobData.currentBatch,
                  linesProcessed: jobData.linesProcessed,
                  timestamp: new Date()
                };
                
                handleAnalysisCancelled(cancellationData);
                return; // Stop polling since job is cancelled
              }
              
              // Update current job state
              setCurrentJob(jobData);
              setLastKnownJob(jobData); // Always track the last known job state
              setSelectedBatchSize(jobData.batchSize);
              
            } else {
              // No active job found - check if we had a job that just completed using both currentJob and lastKnownJob
              const jobForCompletion = currentJob || lastKnownJob;
              
              if (jobForCompletion && !showCompletedResults && !completionDetectionInProgress) {
                console.log('🎯 COMPLETION DETECTED via polling: Had job, now no active job');
                console.log(`   Previous job: ${jobForCompletion.id}, status: ${jobForCompletion.status}, progress: ${jobForCompletion.currentBatch}/${jobForCompletion.totalBatches}`);
                
                // Set completion detection flag to prevent state interference
                setCompletionDetectionInProgress(true);
                
                // Start completion detection timeout to ensure we don't get stuck
                if (!completionDetectionTimeoutRef.current) {
                  completionDetectionTimeoutRef.current = Date.now();
                  console.log('⏱️ Started completion detection timeout (30s max)');
                }
                
                // Clear any pending timeout since we detected completion
                if (completionTimeoutRef.current) {
                  console.log('⏰ Clearing completion timeout - job disappeared');
                  completionTimeoutRef.current = null;
                }
                
                // The job completed and is no longer active - manually trigger completion
                const completionData = {
                  jobId: jobForCompletion.id,
                  fileId: jobForCompletion.fileId,
                  organizationId: jobForCompletion.organizationId,
                  userId: jobForCompletion.userId,
                  status: 'completed' as const,
                  batchSize: jobForCompletion.batchSize,
                  currentBatch: jobForCompletion.currentBatch || jobForCompletion.totalBatches,
                  totalBatches: jobForCompletion.totalBatches,
                  totalLines: jobForCompletion.totalLines,
                  linesProcessed: jobForCompletion.linesProcessed || (jobForCompletion.currentBatch * jobForCompletion.batchSize),
                  issuesFound: jobForCompletion.issuesFound || 0,
                  alertsCreated: jobForCompletion.alertsCreated || 0,
                  startTime: jobForCompletion.startTime,
                  endTime: new Date().toISOString(),
                  createdAt: jobForCompletion.createdAt,
                  updatedAt: new Date().toISOString(),
                  logFile: jobForCompletion.logFile,
                  timestamp: new Date()
                };
                
                console.log('✅ Triggering completion handler via polling with data:', completionData);
                handleAnalysisCompleted(completionData);
                return; // Stop polling since we detected completion
                
              } else if (showCompletedResults || completedJob) {
                console.log('📊 No active job but preserving completed results');
                stopPolling(); // Stop polling when job is done
              } else {
                // Check if completion detection timeout has been exceeded
                if (completionDetectionInProgress && completionDetectionTimeoutRef.current) {
                  const detectionTime = Date.now() - completionDetectionTimeoutRef.current;
                  if (detectionTime > maxCompletionDetectionTime) {
                    console.log('🚫 Completion detection timeout exceeded - resetting completion detection state');
                    setCompletionDetectionInProgress(false);
                    completionDetectionTimeoutRef.current = null;
                    setPollingAttempts(0);
                    return;
                  } else {
                    console.log(`⏱️ Completion detection in progress: ${detectionTime}ms / ${maxCompletionDetectionTime}ms`);
                  }
                }
                
                // Increment polling attempts to prevent infinite polling
                const newPollingAttempts = pollingAttempts + 1;
                setPollingAttempts(newPollingAttempts);
                
                if (newPollingAttempts >= maxPollingAttempts) {
                  console.log(`🚫 Maximum polling attempts (${maxPollingAttempts}) reached - stopping polling to prevent infinite loop`);
                  stopPolling();
                  setPollingAttempts(0); // Reset for future use
                  // Also reset completion detection if it was in progress
                  if (completionDetectionInProgress) {
                    setCompletionDetectionInProgress(false);
                    completionDetectionTimeoutRef.current = null;
                  }
                } else {
                  console.log(`📊 No active job found via polling - no previous job to complete (attempt ${newPollingAttempts}/${maxPollingAttempts})`);
                }
              }
            }
          } catch (error) {
            console.warn('Polling error:', error);
          }
        }
      }, 5000); // Poll every 5 seconds when needed
    };

    // Start polling only if we don't have completed results
    if (!showCompletedResults) {
      startPolling();
    }

    // Cleanup
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      wsSubscriptions.forEach(id => websocketService.unsubscribe(id));
    };
  }, [fileId]); // Removed lastActionTime to prevent unnecessary effect re-runs

  // Calculate max batches when batch size or selected file changes
  useEffect(() => {
    if (selectedFile?.totalLines && selectedBatchSize) {
      const calculated = Math.ceil(selectedFile.totalLines / selectedBatchSize);
      setMaxBatches(calculated);
      // Reset selected count if it exceeds new max
      if (selectedBatchCount && selectedBatchCount > calculated) {
        setSelectedBatchCount(calculated);
      }
    }
  }, [selectedFile?.totalLines, selectedBatchSize, selectedBatchCount]);





  const getStatusIcon = () => {
    if (!currentJob) return <Settings className="h-4 w-4" />;
    
    const displayStatus = optimisticStatus || aiAnalysisJobService.getDisplayStatus(currentJob);
    
    switch (displayStatus) {
      case 'queued':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'pausing':
        return <Pause className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'cancelling':
        return <XCircle className="h-4 w-4 text-red-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  // Handle starting a new analysis from completed state - Simple reset approach
  const handleStartNewAnalysis = () => {
    console.log('🔄 Starting new analysis - resetting to initial state');
    
    // Clear localStorage for this file
    try {
      localStorage.removeItem(completedJobStorageKey);
      localStorage.removeItem(showCompletedResultsStorageKey);
      console.log('🗑️ Cleared completed job from localStorage');
    } catch (error) {
      console.warn('Failed to clear completed job from localStorage:', error);
    }
    
    // Reset to initial state - exactly like component first load
    setCurrentJob(null);
    setLastKnownJob(null);
    setCompletedJob(null);
    setShowCompletedResults(false);
    setIsVisible(false); // This triggers default BatchSizeSelector render
    setOptimisticStatus(null);
    setRealtimeBatchInfo({ recentBatches: [] });
    setShowCancelDialog(false);
    // Reset completion detection state
    setCompletionDetectionInProgress(false);
    setPollingAttempts(0);
    completionDetectionTimeoutRef.current = null;
    
    console.log('✅ State reset to initial conditions - letting existing logic handle batch selector');
  };

  // Direct wrapper for handleStartAnalysis from the hook - no double-click logic needed
  const handleStartAnalysis = async () => {
    try {
      await startAnalysis(selectedBatchSize, selectedBatchCount);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  // Debug logging for visibility decisions
  console.log('🔍 AIJobProgressPanel visibility check:', { 
    isVisible, 
    hasCurrentJob: !!currentJob, 
    hasCompletedJob: !!completedJob,
    showCompletedResults,
    shouldShow: isVisible || currentJob || showCompletedResults || completedJob
  });

  if (!isVisible && !currentJob && !showCompletedResults && !completedJob) {
    return (
      <BatchSizeSelector
        selectedBatchSize={selectedBatchSize}
        onBatchSizeChange={setSelectedBatchSize}
        selectedBatchCount={selectedBatchCount}
        onBatchCountChange={setSelectedBatchCount}
        maxBatches={maxBatches}
        totalLines={selectedFile?.totalLines || undefined}
        isLoading={hookIsLoading}
        onStartAnalysis={handleStartAnalysis}
        onCancel={() => {
          // No cancel action needed for default state
        }}
        showBatchSizeSelector={true}
        isForNewAnalysis={true}
      />
    );
  }


  // Improved job data management - prioritize currentJob, fallback to completed
  const jobToDisplay = currentJob || (showCompletedResults ? completedJob : lastKnownJob);
  
  // Safety check: if we should show job progress but don't have job data, and we're not showing batch selector
  // Return loading state only when we expect to have job data but don't
  if (isVisible && !jobToDisplay && !showBatchSizeSelector && currentJob === null && !completedJob) {
    console.log('⚠️ Should show job progress but no job data available - showing loading state');
    return (
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg border border-gray-200 dark:border-soc-dark-700 p-6">
        <div className="flex items-center justify-center space-y-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Loading analysis data...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Enhanced progress calculation with fallback
  let progress: JobProgress | null = null;
  try {
    if (jobToDisplay) {
      progress = aiAnalysisJobService.calculateProgress(jobToDisplay);
    }
  } catch (error) {
    console.error('❌ Progress calculation failed:', error, 'Job data:', jobToDisplay);
  }

  // Provide fallback progress if calculation fails but we have job data
  if (jobToDisplay && !progress) {
    console.warn('⚠️ Using fallback progress calculation');
    progress = {
      percentage: 0,
      linesProcessed: jobToDisplay.linesProcessed || 0,
      totalLines: jobToDisplay.totalLines || 1,
      currentBatch: jobToDisplay.currentBatch || 0,
      totalBatches: jobToDisplay.totalBatches || 0,
      issuesFound: jobToDisplay.issuesFound || 0,
      alertsCreated: jobToDisplay.alertsCreated || 0
    };
  }

  // Consolidate alert count data for consistent display
  let consolidatedProgressCounts: ConsolidatedAlertCounts | null = null;
  if (progress && jobToDisplay) {
    const alertCountSources: AlertCountSources = {
      jobProgress: {
        alertsCreated: progress.alertsCreated || 0,
        issuesFound: progress.issuesFound || 0
      }
    };

    consolidatedProgressCounts = consolidateAlertCounts(
      alertCountSources,
      `AIJobProgressPanel-${fileId}-${jobToDisplay.id}`
    );

    // Update progress object with consolidated values for consistency
    if (consolidatedProgressCounts) {
      progress.alertsCreated = consolidatedProgressCounts.alertsCreated;
      progress.issuesFound = consolidatedProgressCounts.securityIssues;
    }
  }

  // Show placeholder if we should be visible but don't have complete data
  // EXCEPT when we're showing the batch selector (for new analysis)
  if ((isVisible || showCompletedResults) && (!jobToDisplay || !progress) && !showBatchSizeSelector) {
    console.log('🔄 Showing placeholder - missing job data but should be visible');
    return (
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg border border-gray-200 dark:border-soc-dark-700 p-6">
        <div className="flex items-center justify-center space-y-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Loading analysis data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Final safety check - if we get here without job data, something is wrong
  // EXCEPT when we're showing the batch selector (for new analysis)
  if ((!jobToDisplay || !progress) && !showBatchSizeSelector) {
    console.error('🚨 No job data available but visibility conditions suggest we should show something');
    return null;
  }

  return (
    <div className="bg-white dark:bg-soc-dark-900 rounded-lg border border-gray-200 dark:border-soc-dark-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-opensoc-100 dark:bg-opensoc-900/20 rounded-lg">
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Security Analysis
              {showCompletedResults && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  - Results
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                aiAnalysisJobService.getDisplayStatusColor(
                  optimisticStatus || (jobToDisplay ? aiAnalysisJobService.getDisplayStatus(jobToDisplay) : 'unknown')
                )
              }`}>
                {aiAnalysisJobService.getDisplayStatusText(
                  optimisticStatus || (jobToDisplay ? aiAnalysisJobService.getDisplayStatus(jobToDisplay) : 'unknown')
                )}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Batch Size: {jobToDisplay?.batchSize || 0}
              </span>
              {showCompletedResults && jobToDisplay?.endTime && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Completed: {new Date(jobToDisplay.endTime).toLocaleTimeString()}
                </span>
              )}
              {(optimisticStatus || (jobToDisplay && aiAnalysisJobService.isTransitioning(jobToDisplay))) && (
                <div className="animate-pulse">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center space-x-2">
          {!showCompletedResults && (
            // Active job controls
            <>
              {currentJob && aiAnalysisJobService.canBePaused(currentJob) && (
                <button
                  onClick={handlePauseJob}
                  disabled={hookIsLoading}
                  className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Pause Analysis"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}

              {currentJob && aiAnalysisJobService.canBeResumed(currentJob) && (
                <button
                  onClick={handleResumeJob}
                  disabled={hookIsLoading}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Resume Analysis"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}

              {/* Settings button for paused jobs to change batch size */}
              {currentJob && currentJob.status === 'paused' && (
                <button
                  onClick={() => setShowBatchSizeSelector(!showBatchSizeSelector)}
                  className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
                  title="Change Batch Size"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}

              {currentJob && aiAnalysisJobService.canBeCancelled(currentJob) && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={hookIsLoading}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Cancel Analysis"
                >
                  <Square className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Batch Size Selector for Paused Jobs */}
      {!showCompletedResults && currentJob && (currentJob.status === 'paused' || aiAnalysisJobService.getDisplayStatus(currentJob) === 'paused') && showBatchSizeSelector && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Change Batch Size
            </label>
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Current: {currentJob.batchSize}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {[1, 5, 10, 25, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => setSelectedBatchSize(size)}
                className={`px-3 py-2 text-sm rounded border ${
                  selectedBatchSize === size
                    ? 'bg-yellow-600 text-white border-yellow-600'
                    : 'bg-white dark:bg-soc-dark-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-soc-dark-600 hover:bg-gray-50 dark:hover:bg-soc-dark-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                try {
                  setLastActionTime(Date.now());
                  
                  // Update the local state optimistically
                  setCurrentJob({ ...currentJob, batchSize: selectedBatchSize });
                  setShowBatchSizeSelector(false);
                  
                  // Immediate status refresh to sync with backend
                  setTimeout(() => refreshStatus(), 500);
                  
                  toastNotificationService.showNotification({
                    title: '⚙️ Batch Size Updated',
                    body: `Analysis will resume with batch size ${selectedBatchSize}`
                  });
                } catch (error: any) {
                  // Revert optimistic update on error
                  setSelectedBatchSize(currentJob.batchSize);
                  setShowBatchSizeSelector(true);
                  
                  toastNotificationService.showNotification({
                    title: '❌ Update Failed',
                    body: error.response?.data?.message || 'Failed to update batch size'
                  });
                } finally {
                  // Loading state is handled by the hook
                }
              }}
              disabled={hookIsLoading || selectedBatchSize === currentJob.batchSize}
              className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hookIsLoading ? 'Updating...' : 'Apply Changes'}
            </button>
            <button
              onClick={() => {
                setShowBatchSizeSelector(false);
                setSelectedBatchSize(currentJob.batchSize); // Reset to current
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            {selectedBatchSize <= 10 ? 'Slower processing, minimal resource usage' :
             selectedBatchSize <= 50 ? 'Balanced performance and resource usage' :
             'Faster processing, higher resource usage'}
          </p>
        </div>
      )}

      {/* Progress Bar and Statistics - Hidden when completed to avoid duplication */}
      {!showCompletedResults && progress && jobToDisplay && (
      <div>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <div className="flex items-center space-x-2">
            <span>Job Progress: {progress.percentage}%</span>
            {currentJob && currentJob.status === 'running' && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                <div className="animate-pulse h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></div>
                Active
              </span>
            )}
          </div>
          <div className="text-right">
            <div>
              {progress.linesProcessed.toLocaleString()} / {progress.totalLines.toLocaleString()} lines (job scope)
              {jobToDisplay.maxBatches && jobToDisplay.maxBatches < Math.ceil(progress.totalLines / jobToDisplay.batchSize) && (
                <span className="text-xs text-opensoc-600 dark:text-opensoc-400 ml-1">
                  (limit: {(jobToDisplay.maxBatches * jobToDisplay.batchSize).toLocaleString()} lines)
                </span>
              )}
            </div>
            {jobToDisplay.currentBatch > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Batch {jobToDisplay.currentBatch} / {jobToDisplay.totalBatches}
                {jobToDisplay.maxBatches && jobToDisplay.maxBatches < Math.ceil(progress.totalLines / jobToDisplay.batchSize) && (
                  <span className="text-opensoc-600 dark:text-opensoc-400 font-medium ml-1">(limited)</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-soc-dark-700 rounded-full h-3 relative overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              currentJob && currentJob.status === 'running' 
                ? 'bg-gradient-to-r from-opensoc-500 to-opensoc-600 animate-pulse' 
                : 'bg-opensoc-600'
            }`}
            style={{ width: `${progress.percentage}%` }}
          ></div>
          {currentJob && currentJob.status === 'running' && progress.percentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 animate-pulse"></div>
          )}
        </div>
        {currentJob && currentJob.status === 'running' && currentJob.currentBatch > 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <span>Current batch size: {currentJob.batchSize} lines</span>
            {progress.estimatedTimeRemaining && (
              <span>
                ETA: {aiAnalysisJobService.formatTimeRemaining(progress.estimatedTimeRemaining)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legacy statistics section removed - now handled by JobStatistics component */}
      </div>
      )}  {/* Close the !showCompletedResults condition */}

      {/* Job Statistics Component */}
      {jobToDisplay && progress && (
        <JobStatistics
          jobToDisplay={jobToDisplay}
          progress={progress}
          showCompletedResults={showCompletedResults}
          currentJob={currentJob}
          realtimeBatchInfo={realtimeBatchInfo}
          onStartNewAnalysis={handleStartNewAnalysis}
        />
      )}

      {/* All legacy statistics, completion summary, real-time batch info, and enhanced progress info sections removed - now handled by JobStatistics component */}



      {/* Error Message */}
      {jobToDisplay?.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              {jobToDisplay?.errorMessage}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-soc-dark-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cancel Analysis?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this analysis? Progress will be lost and you'll need to start over.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 btn-secondary"
              >
                Keep Running
              </button>
              <button
                onClick={handleCancelJob}
                disabled={hookIsLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hookIsLoading ? 'Cancelling...' : 'Cancel Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIJobProgressPanel;