import { apiRequest } from './api';

export interface DatasetStats {
  totalAlerts: number;
  humanReviewedAlerts: number;
  verifiedAlerts: number;
  falsePositiveAlerts: number;
  resolvedAlerts: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  eventTypeDistribution: Record<string, number>;
  reviewerStats: {
    totalReviewers: number;
    avgConfidence: number;
  };
}

export interface ExportOptions {
  startDate: string;
  endDate: string;
  minConfidence: number;
  includeUnverified: boolean;
  format: 'jsonl' | 'json' | 'csv';
  datasetSplit: {
    training: number;
    validation: number;
    test: number;
  };
}

class FineTuningService {
  /**
   * Get fine-tuning dataset statistics
   */
  async getStats(): Promise<DatasetStats> {
    try {
      const response = await apiRequest.get('/ai-tools/fine-tuning/stats');

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch stats');
      }
    } catch (error: any) {
      console.error('Failed to fetch fine-tuning stats:', error);
      throw new Error(error.message || 'Failed to fetch fine-tuning statistics');
    }
  }

  /**
   * Export fine-tuning dataset
   */
  async exportDataset(options: ExportOptions): Promise<Blob> {
    try {
      const response = await fetch('/api/ai-tools/fine-tuning/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error: any) {
      console.error('Failed to export dataset:', error);
      throw new Error(error.message || 'Failed to export dataset');
    }
  }

  /**
   * Get quality metrics
   */
  async getQualityMetrics(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiRequest.get(`/ai-tools/fine-tuning/quality-metrics?${params.toString()}`);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch quality metrics');
      }
    } catch (error: any) {
      console.error('Failed to fetch quality metrics:', error);
      throw new Error(error.message || 'Failed to fetch quality metrics');
    }
  }
}

export const fineTuningService = new FineTuningService();
export default fineTuningService;