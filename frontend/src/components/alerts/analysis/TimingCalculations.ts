import { AnalysisStep, TimingMetrics } from './AnalysisTypes';

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
};

export const getTotalManualTime = (steps: AnalysisStep[]): number => {
  return steps.reduce((total, step) => total + step.manualBaseline, 0);
};

export const getTotalAITime = (steps: AnalysisStep[]): number => {
  const totalMs = steps.reduce((total, step) => total + (step.actualDuration || 0), 0);
  return totalMs / 60000; // Convert to minutes
};

export const getTotalTimeSaved = (steps: AnalysisStep[]): number => {
  return steps.reduce((total, step) => total + (step.timeSaved || 0), 0);
};

export const getEfficiencyImprovement = (steps: AnalysisStep[]): number => {
  const manualTime = getTotalManualTime(steps);
  const aiTime = getTotalAITime(steps);
  if (manualTime === 0) return 0;
  return ((manualTime - aiTime) / manualTime) * 100;
};

export const calculateTimingMetrics = (
  steps: AnalysisStep[],
  totalAnalysisStartTime: number | null,
  totalAnalysisEndTime: number | null
): TimingMetrics => {
  return {
    totalAnalysisStartTime,
    totalAnalysisEndTime,
    totalManualTime: getTotalManualTime(steps),
    totalAITime: getTotalAITime(steps),
    totalTimeSaved: getTotalTimeSaved(steps),
    efficiencyImprovement: getEfficiencyImprovement(steps)
  };
};