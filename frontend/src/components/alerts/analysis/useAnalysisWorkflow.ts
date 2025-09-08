import { useState, useEffect, useCallback } from 'react';
import { Bot, Zap, Shield } from 'lucide-react';
import { AnalysisStep, TimingMetrics } from './AnalysisTypes';
import { calculateTimingMetrics } from './TimingCalculations';
import alertService from '../../../services/alertService';

export const useAnalysisWorkflow = (alert: any) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalAnalysisStartTime, setTotalAnalysisStartTime] = useState<number | null>(null);
  const [totalAnalysisEndTime, setTotalAnalysisEndTime] = useState<number | null>(null);
  
  const [steps, setSteps] = useState<AnalysisStep[]>([
    {
      id: 'classification',
      name: 'AI Classification',
      description: 'Classifying Alert Event',
      icon: Bot,
      status: 'pending',
      progress: 0,
      manualBaseline: 15
    },
    {
      id: 'analysis', 
      name: 'AI Alert Analysis',
      description: 'Analyzing Alert Event',
      icon: Zap,
      status: 'pending',
      progress: 0,
      manualBaseline: 40
    },
    {
      id: 'mitre',
      name: 'MITRE ATT&CK Analysis', 
      description: 'MITRE ATT&CK Analysis',
      icon: Shield,
      status: 'pending',
      progress: 0,
      manualBaseline: 45
    }
  ]);

  // Real-time timer update for running steps - MOVED UP to maintain hook order
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        // Force re-render to update elapsed times by updating a counter
        // This approach avoids creating new array references
        setSteps(prevSteps => 
          prevSteps.map(step => ({
            ...step,
            // Add a timestamp for running steps to trigger re-render
            ...(step.status === 'running' ? { lastUpdate: Date.now() } : {})
          }))
        );
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const resetAnalysis = useCallback(() => {
    console.log('🔄 OneClickAnalysis: Resetting workflow state (MANUAL ONLY)');
    setSteps([
      {
        id: 'classification',
        name: 'AI Classification',
        description: 'Classifying Alert Event',
        icon: Bot,
        status: 'pending',
        progress: 0,
        manualBaseline: 15
      },
      {
        id: 'analysis', 
        name: 'AI Alert Analysis',
        description: 'Analyzing Alert Event',
        icon: Zap,
        status: 'pending',
        progress: 0,
        manualBaseline: 40
      },
      {
        id: 'mitre',
        name: 'MITRE ATT&CK Analysis', 
        description: 'MITRE ATT&CK Analysis',
        icon: Shield,
        status: 'pending',
        progress: 0,
        manualBaseline: 45
      }
    ]);
    setOverallProgress(0);
    setCurrentStepIndex(0);
    setIsProcessing(false);
    setTotalAnalysisStartTime(null);
    setTotalAnalysisEndTime(null);
  }, []); // Empty dependency array since it doesn't depend on any props/state

  const updateStepStatus = (
    stepId: string, 
    status: AnalysisStep['status'], 
    progress?: number, 
    error?: string, 
    timing?: { startTime?: number, endTime?: number }
  ) => {
    setSteps(prevSteps => 
      prevSteps.map(step => {
        if (step.id === stepId) {
          const updates: Partial<AnalysisStep> = {
            status,
            progress: progress ?? step.progress,
            error
          };
          
          if (timing?.startTime) {
            updates.startTime = timing.startTime;
          }
          
          if (timing?.endTime) {
            updates.endTime = timing.endTime;
            if (step.startTime) {
              updates.actualDuration = timing.endTime - step.startTime;
              updates.timeSaved = step.manualBaseline - (updates.actualDuration / 60000);
            }
          }
          
          return { ...step, ...updates };
        }
        return step;
      })
    );
  };

  const executeStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex];
    if (!alert || !step) return false;

    const stepStartTime = Date.now();
    setCurrentStepIndex(stepIndex);
    updateStepStatus(step.id, 'running', 0, undefined, { startTime: stepStartTime });

    // Start progress simulation for user feedback
    const progressInterval = setInterval(() => {
      updateStepStatus(step.id, 'running', Math.min(90, Math.random() * 10 + (stepIndex * 30)));
    }, 1000);

    try {
      console.log(`🚀 Starting ${step.name} at ${new Date(stepStartTime).toLocaleTimeString()}`);
      let result;
      
      // Helper function to handle rate limiting with retry logic
      const executeWithRetry = async (apiCall: () => Promise<any>, maxRetries = 3): Promise<any> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await apiCall();
            return response;
          } catch (error: any) {
            // Handle rate limiting specifically
            if (error.response?.status === 429) {
              console.log(`⚠️ Rate limit hit on attempt ${attempt}/${maxRetries} for ${step.name}`);
              if (attempt < maxRetries) {
                // Exponential backoff: wait 2^attempt seconds
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
            }
            throw error;
          }
        }
      };
      
      // Use the same API calls as the working individual buttons with retry logic
      switch (step.id) {
        case 'classification':
          result = await executeWithRetry(() => alertService.aiClassification(alert.id));
          if (!result.success) throw new Error(result.error || 'Classification failed');
          break;
          
        case 'analysis':
          result = await executeWithRetry(() => alertService.analyzeAlert(alert.id));
          if (!result.success) throw new Error(result.error || 'Analysis failed');
          break;
          
        case 'mitre':
          result = await executeWithRetry(() => alertService.analyzeMitreAttack(alert.id));
          if (!result.success) throw new Error(result.error || 'MITRE analysis failed');
          break;
          
        default:
          throw new Error('Unknown analysis step');
      }

      // Clear progress simulation and mark complete with timing
      clearInterval(progressInterval);
      const stepEndTime = Date.now();
      const duration = stepEndTime - stepStartTime;
      console.log(`✅ Completed ${step.name} in ${(duration / 1000).toFixed(1)}s`);
      
      updateStepStatus(step.id, 'completed', 100, undefined, { endTime: stepEndTime });
      
      // Update overall progress
      const completedSteps = stepIndex + 1;
      const newOverallProgress = (completedSteps / steps.length) * 100;
      setOverallProgress(newOverallProgress);

      return true;
    } catch (error: any) {
      clearInterval(progressInterval);
      let errorMessage = error.message;
      if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }
      updateStepStatus(step.id, 'error', 0, errorMessage);
      return false;
    }
  }, [alert]); // Removed 'steps' dependency - function will access current steps via closure

  const startAnalysis = useCallback(async (): Promise<boolean> => {
    if (!alert) return false;

    console.log('🎬 Starting One Click Analysis workflow');
    const totalStartTime = Date.now();
    setTotalAnalysisStartTime(totalStartTime);
    setIsProcessing(true);

    try {
      // Execute steps sequentially using the same logic as working individual buttons
      for (let i = 0; i < steps.length; i++) {
        const success = await executeStep(i);
        if (!success) {
          // Stop on first error
          setIsProcessing(false);
          return false;
        }
      }

      // All steps completed successfully
      const totalEndTime = Date.now();
      setTotalAnalysisEndTime(totalEndTime);
      const totalDuration = totalEndTime - totalStartTime;
      
      console.log(`🎉 Analysis completed in ${(totalDuration / 1000).toFixed(1)}s`);
      
      setOverallProgress(100);
      setIsProcessing(false);
      
      return true;
    } catch (error: any) {
      console.error('Analysis workflow failed:', error);
      setIsProcessing(false);
      return false;
    }
  }, [alert]); // Removed 'steps' dependency to prevent recreation on every step update

  const retryStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    return await executeStep(stepIndex);
  }, [executeStep]);

  const continueFromStep = useCallback(async (startStepIndex: number): Promise<boolean> => {
    if (!alert) return false;

    console.log(`🔄 Continuing analysis from step ${startStepIndex + 1}`);
    setIsProcessing(true);

    try {
      // Execute remaining steps sequentially from the specified index
      for (let i = startStepIndex; i < steps.length; i++) {
        const success = await executeStep(i);
        if (!success) {
          // Stop on first error
          setIsProcessing(false);
          return false;
        }
      }

      // All remaining steps completed successfully
      if (!totalAnalysisEndTime && totalAnalysisStartTime) {
        const totalEndTime = Date.now();
        setTotalAnalysisEndTime(totalEndTime);
        const totalDuration = totalEndTime - totalAnalysisStartTime;
        console.log(`🎉 Analysis completed in ${(totalDuration / 1000).toFixed(1)}s`);
      }
      
      setOverallProgress(100);
      setIsProcessing(false);
      
      return true;
    } catch (error: any) {
      console.error('Continue workflow failed:', error);
      setIsProcessing(false);
      return false;
    }
  }, [alert, steps, executeStep, totalAnalysisStartTime, totalAnalysisEndTime]);

  const getTimingMetrics = useCallback((): TimingMetrics => {
    return calculateTimingMetrics(steps, totalAnalysisStartTime, totalAnalysisEndTime);
  }, [steps, totalAnalysisStartTime, totalAnalysisEndTime]);


  return {
    steps,
    isProcessing,
    overallProgress,
    currentStepIndex,
    resetAnalysis,
    startAnalysis,
    retryStep,
    continueFromStep,
    getTimingMetrics
  };
};