import { ComponentType } from 'react';

export interface AnalysisStep {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  error?: string;
  startTime?: number;
  endTime?: number;
  actualDuration?: number; // in milliseconds
  manualBaseline: number; // in minutes
  timeSaved?: number; // in minutes
  lastUpdate?: number; // for triggering re-renders of running steps
}

export interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: any;
  onAnalysisComplete: (updatedAlert: any) => void;
}

export interface TimingMetrics {
  totalAnalysisStartTime: number | null;
  totalAnalysisEndTime: number | null;
  totalManualTime: number;
  totalAITime: number;
  totalTimeSaved: number;
  efficiencyImprovement: number;
}