import { apiRequest } from './api';
import { LogFileMeta, LogFileLine, StorageStats, Pagination, LogLinesFilterParams } from '../store/logAnalyzerSlice';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

interface CleanupResult {
  processedFiles: number;
  deletedLinesCount: number;
  deletedFilesCount: number;
  errors: Array<{
    fileId: string;
    filename: string;
    error: string;
  }>;
}

interface SecurityAnalysisResult {
  totalAnalyzed: number;
  securityIssuesFound: number;
  alertsCreated: number;
  errors: Array<{
    logLineId: string;
    lineNumber: number;
    error: string;
  }>;
  batchStats: Array<{
    analyzed: number;
    issuesFound: number;
    alertsCreated: number;
    errors: Array<any>;
  }>;
}

interface SecurityAnalysisStats {
  totalLines: number;
  analyzedLines: number;
  securityIssues: number;
  alertsCreated: number;
  severityBreakdown: {
    low?: number;
    medium?: number;
    high?: number;
    critical?: number;
  };
  analysisProgress: number;
}

class LogAnalyzerService {
  private baseURL: string;

  constructor() {
    this.baseURL = '/log-analyzer';
  }

  /**
   * Upload a log file
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<LogFileMeta>> {
    const formData = new FormData();
    formData.append('logFile', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    return await apiRequest.post<LogFileMeta>(`${this.baseURL}/upload`, formData, config);
  }

  /**
   * Get all log files
   */
  async getFiles(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<LogFileMeta>> {
    const config = {
      params,
    };

    return await apiRequest.get<LogFileMeta[]>(`${this.baseURL}/files`, config);
  }

  /**
   * Get file details
   */
  async getFileDetails(fileId: string): Promise<ApiResponse<LogFileMeta>> {
    return await apiRequest.get<LogFileMeta>(`${this.baseURL}/files/${fileId}`);
  }

  /**
   * Update file metadata
   */
  async updateFile(fileId: string, updateData: Partial<LogFileMeta>): Promise<ApiResponse<LogFileMeta>> {
    return await apiRequest.put<LogFileMeta>(`${this.baseURL}/files/${fileId}`, updateData);
  }

  /**
   * Create a new log line
   */
  async createLine(fileId: string, lineData: { content: string; parsedData?: any }): Promise<ApiResponse<LogFileLine>> {
    return await apiRequest.post<LogFileLine>(`${this.baseURL}/files/${fileId}/lines`, lineData);
  }

  /**
   * Update an existing log line
   */
  async updateLine(fileId: string, lineId: string, updateData: { content?: string; parsedData?: any }): Promise<ApiResponse<LogFileLine>> {
    return await apiRequest.put<LogFileLine>(`${this.baseURL}/files/${fileId}/lines/${lineId}`, updateData);
  }

  /**
   * Delete a specific log line
   */
  async deleteLine(fileId: string, lineId: string): Promise<ApiResponse<{ message: string }>> {
    return await apiRequest.delete<{ message: string }>(`${this.baseURL}/files/${fileId}/lines/${lineId}`);
  }

  /**
   * Get file lines with pagination
   */
  async getFileLines(
    fileId: string,
    params: LogLinesFilterParams = {}
  ): Promise<PaginatedResponse<LogFileLine>> {
    // Filter out undefined, null, and empty string values to prevent validation errors
    const filteredParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filteredParams[key] = value;
      }
    });

    const config = {
      params: filteredParams,
    };

    return await apiRequest.get<LogFileLine[]>(`${this.baseURL}/files/${fileId}/lines`, config);
  }

  /**
   * Empty all lines for a file (keep metadata)
   */
  async emptyFileLines(fileId: string): Promise<ApiResponse<{ deletedLinesCount: number }>> {
    return await apiRequest.delete<{ deletedLinesCount: number }>(`${this.baseURL}/files/${fileId}/lines`);
  }

  /**
   * Delete file completely
   */
  async deleteFile(fileId: string): Promise<ApiResponse<{ message: string }>> {
    return await apiRequest.delete<{ message: string }>(`${this.baseURL}/files/${fileId}`);
  }

  /**
   * Bulk cleanup operations
   */
  async bulkCleanup(params: {
    action: 'empty_lines' | 'delete_files';
    olderThanDays?: number;
    fileIds?: string[];
  }): Promise<ApiResponse<CleanupResult>> {
    return await apiRequest.post<CleanupResult>(`${this.baseURL}/cleanup`, params);
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<ApiResponse<StorageStats>> {
    return await apiRequest.get<StorageStats>(`${this.baseURL}/stats`);
  }

  /**
   * Analyze file for security issues using AI
   */
  async analyzeFileSecurity(fileId: string, batchSize: number = 50): Promise<ApiResponse<SecurityAnalysisResult>> {
    return await apiRequest.post<SecurityAnalysisResult>(`${this.baseURL}/files/${fileId}/analyze-security`, {
      batchSize
    });
  }

  /**
   * Get security analysis statistics for a file
   */
  async getSecurityAnalysisStats(fileId: string): Promise<ApiResponse<SecurityAnalysisStats>> {
    return await apiRequest.get<SecurityAnalysisStats>(`${this.baseURL}/files/${fileId}/security-stats`);
  }

  /**
   * Get security issues found in a file
   */
  async getFileSecurityIssues(
    fileId: string,
    params: {
      page?: number;
      limit?: number;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      issueType?: string;
    } = {}
  ): Promise<PaginatedResponse<LogFileLine>> {
    const config = {
      params,
    };

    return await apiRequest.get<LogFileLine[]>(`${this.baseURL}/files/${fileId}/security-issues`, config);
  }

  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'uploading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file type is supported
   */
  isSupportedFileType(filename: string): boolean {
    const supportedExtensions = ['log', 'txt', 'out', 'err', 'trace'];
    const extension = this.getFileExtension(filename);
    return supportedExtensions.includes(extension);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (50MB)`);
    }

    // Check file type
    if (!this.isSupportedFileType(file.name)) {
      errors.push('File type not supported. Allowed types: .log, .txt, .out, .err, .trace');
    }

    // Check for empty file
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new LogAnalyzerService();