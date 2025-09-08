import { apiRequest } from './api';

export interface AIAnalysisJob {
  id: string;
  fileId: string;
  organizationId: string;
  userId: string;
  status: 'queued' | 'running' | 'paused' | 'cancelled' | 'completed' | 'error';
  batchSize: number;
  currentBatch: number;
  totalBatches: number;
  maxBatches?: number;
  linesProcessed: number;
  totalLines: number;
  issuesFound: number;
  alertsCreated: number;
  pauseRequested: boolean;
  cancelRequested: boolean;
  startTime?: string;
  endTime?: string;
  estimatedEndTime?: string;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  logFile?: {
    originalName: string;
    totalLines: number;
  };
}

export interface CreateJobRequest {
  batchSize?: number;
  maxBatches?: number;
}

export interface JobResponse {
  success: boolean;
  data: AIAnalysisJob;
  message?: string;
}

export interface JobsResponse {
  success: boolean;
  data: AIAnalysisJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface JobProgress {
  percentage: number;
  linesProcessed: number;
  totalLines: number;
  currentBatch: number;
  totalBatches: number;
  issuesFound: number;
  alertsCreated: number;
  estimatedTimeRemaining?: number;
}

class AIAnalysisJobService {
  private baseURL: string;

  constructor() {
    this.baseURL = '/log-analyzer';
  }

  /**
   * Create a new AI analysis job
   */
  async createJob(fileId: string, batchSize: number = 50, maxBatches?: number | null): Promise<JobResponse> {
    return await apiRequest.post<AIAnalysisJob>(
      `${this.baseURL}/files/${fileId}/analysis-jobs`,
      { 
        batchSize,
        ...(maxBatches && { maxBatches })
      }
    );
  }

  /**
   * Get job status and details
   */
  async getJobStatus(fileId: string, jobId: string): Promise<JobResponse> {
    return await apiRequest.get<AIAnalysisJob>(
      `${this.baseURL}/files/${fileId}/analysis-jobs/${jobId}`
    );
  }

  /**
   * Pause a running job
   */
  async pauseJob(fileId: string, jobId: string): Promise<JobResponse> {
    return await apiRequest.put<AIAnalysisJob>(
      `${this.baseURL}/files/${fileId}/analysis-jobs/${jobId}/pause`,
      {}
    );
  }

  /**
   * Resume a paused job
   */
  async resumeJob(fileId: string, jobId: string): Promise<JobResponse> {
    return await apiRequest.put<AIAnalysisJob>(
      `${this.baseURL}/files/${fileId}/analysis-jobs/${jobId}/resume`,
      {}
    );
  }

  /**
   * Cancel a job
   */
  async cancelJob(fileId: string, jobId: string): Promise<JobResponse> {
    return await apiRequest.delete<AIAnalysisJob>(
      `${this.baseURL}/files/${fileId}/analysis-jobs/${jobId}`
    );
  }

  /**
   * Get active job for a specific file
   */
  async getActiveJob(fileId: string): Promise<JobResponse> {
    return await apiRequest.get<AIAnalysisJob>(
      `${this.baseURL}/files/${fileId}/analysis-jobs/active`
    );
  }

  /**
   * Get all jobs with optional filtering
   */
  async getJobs(params: {
    page?: number;
    limit?: number;
    status?: string;
    fileId?: string;
  } = {}): Promise<JobsResponse> {
    const config = { params };
    return await apiRequest.get<AIAnalysisJob[]>(`${this.baseURL}/analysis-jobs`, config);
  }

  /**
   * Calculate job progress
   */
  calculateProgress(job: AIAnalysisJob): JobProgress {
    // Enhanced validation and error handling
    if (!job) {
      throw new Error('Job data is null or undefined');
    }

    // Validate essential fields with detailed logging
    const essentialFields = ['linesProcessed', 'totalLines', 'currentBatch', 'totalBatches'];
    const missingFields = essentialFields.filter(field => job[field] === undefined);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing job fields for progress calculation:', missingFields, 'Job:', job);
    }

    // Use the data as provided by backend with enhanced fallbacks
    const effectiveLinesProcessed = Math.max(0, job.linesProcessed || 0);
    const totalLines = Math.max(1, job.totalLines || 1);
    const currentBatch = Math.max(0, job.currentBatch || 0);
    const totalBatches = Math.max(1, job.totalBatches || 1);
    
    // Calculate percentage with additional validation
    let percentage = 0;
    if (totalLines > 0) {
      percentage = Math.round((effectiveLinesProcessed / totalLines) * 100);
      // Additional validation for edge cases
      if (percentage > 100) {
        console.warn('⚠️ Progress exceeds 100%:', { effectiveLinesProcessed, totalLines, percentage });
        percentage = 100;
      }
    }
    
    let estimatedTimeRemaining: number | undefined;
    try {
      if (job.startTime && currentBatch > 0 && job.status === 'running') {
        const elapsedMs = Date.now() - new Date(job.startTime).getTime();
        const remainingBatches = totalBatches - currentBatch;
        if (remainingBatches > 0 && currentBatch > 0 && elapsedMs > 0) {
          const avgTimePerBatch = elapsedMs / currentBatch;
          estimatedTimeRemaining = Math.round(remainingBatches * avgTimePerBatch);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error calculating estimated time remaining:', error);
    }

    const result = {
      percentage: Math.min(Math.max(0, percentage), 100), // Ensure 0-100 range
      linesProcessed: effectiveLinesProcessed,
      totalLines,
      currentBatch,
      totalBatches,
      issuesFound: Math.max(0, job.issuesFound || 0),
      alertsCreated: Math.max(0, job.alertsCreated || 0),
      estimatedTimeRemaining
    };

    // Log the calculation for debugging
    console.log('📊 Progress calculation:', { 
      input: { 
        linesProcessed: job.linesProcessed, 
        totalLines: job.totalLines, 
        currentBatch: job.currentBatch, 
        totalBatches: job.totalBatches,
        status: job.status 
      }, 
      output: result 
    });

    return result;
  }

  /**
   * Format time remaining as human readable string
   */
  formatTimeRemaining(milliseconds: number): string {
    if (!milliseconds || milliseconds <= 0) return 'Calculating...';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get status color for UI display
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'queued':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  }

  /**
   * Get status icon for UI display
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'queued':
        return 'clock';
      case 'running':
        return 'activity';
      case 'paused':
        return 'pause';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'x-circle';
      case 'error':
        return 'alert-triangle';
      default:
        return 'help-circle';
    }
  }

  /**
   * Check if job can be paused
   */
  canBePaused(job: AIAnalysisJob): boolean {
    return job.status === 'running' && !job.pauseRequested;
  }

  /**
   * Check if job can be resumed
   */
  canBeResumed(job: AIAnalysisJob): boolean {
    return job.status === 'paused';
  }

  /**
   * Check if job can be cancelled
   */
  canBeCancelled(job: AIAnalysisJob): boolean {
    return ['queued', 'running', 'paused'].includes(job.status) && !job.cancelRequested;
  }

  /**
   * Check if job is in terminal state
   */
  isCompleted(job: AIAnalysisJob): boolean {
    return ['completed', 'cancelled', 'error'].includes(job.status);
  }

  /**
   * Check if job is active
   */
  isActive(job: AIAnalysisJob): boolean {
    return ['queued', 'running', 'paused'].includes(job.status);
  }

  /**
   * Get the display status that should be shown to user
   */
  getDisplayStatus(job: AIAnalysisJob): string {
    // Handle pending requests with intermediate states
    if (job.cancelRequested) {
      return 'cancelling';
    }
    
    if (job.pauseRequested && job.status === 'running') {
      return 'pausing';
    }
    
    // Return actual status for other cases
    return job.status;
  }

  /**
   * Check if job is in a transitional state
   */
  isTransitioning(job: AIAnalysisJob): boolean {
    return job.pauseRequested || job.cancelRequested;
  }

  /**
   * Get status color based on display status
   */
  getDisplayStatusColor(displayStatus: string): string {
    switch (displayStatus) {
      case 'queued':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'running':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pausing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'cancelling':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
      case 'completed':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'error':
        return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }

  /**
   * Get display text for status
   */
  getDisplayStatusText(displayStatus: string): string {
    switch (displayStatus) {
      case 'queued':
        return 'Queued';
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'pausing':
        return 'Pausing...';
      case 'cancelling':
        return 'Cancelling...';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);
    }
  }
}

// Export singleton instance
export const aiAnalysisJobService = new AIAnalysisJobService();
export default aiAnalysisJobService;