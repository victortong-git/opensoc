import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LogFileMeta {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  totalLines: number | null;
  uploadDate: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  organizationId: string;
  userId: string;
  currentLinesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogFileLine {
  id: string;
  logFileMetaId: string;
  lineNumber: number;
  content: string;
  parsedData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Security analysis fields
  securityAnalyzed?: boolean;
  hasSecurityIssue?: boolean;
  securityIssueDescription?: string;
  securityIssueSeverity?: 'low' | 'medium' | 'high' | 'critical';
  securityIssueType?: string;
  aiAnalysisTimestamp?: string;
  aiAnalysisMetadata?: Record<string, any>;
  createdAlertId?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalFileSize: number;
  totalLines: number;
  currentLinesInDb: number;
  uploadDirectory: string;
  
  // Processing status statistics
  completedFiles?: number;
  processingFiles?: number;
  uploadingFiles?: number;
  errorFiles?: number;
  
  // Processing progress metrics
  processingProgress?: number;
  pendingLines?: number;
  
  // Security analysis statistics
  analyzedLines?: number;
  securityIssues?: number;
  alertsCreated?: number;
  securityAnalysisProgress?: number;
  
  // Calculated metrics
  avgFileSize?: number;
  avgLinesPerFile?: number;
  processingSuccessRate?: number;
}

export interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LogLinesFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  securityStatus?: string;
  severity?: string;
  analysisStatus?: string;
  hasAlerts?: boolean;
  logLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
}

export interface LogAnalyzerState {
  // File management
  files: LogFileMeta[];
  selectedFile: LogFileMeta | null;
  fileLines: LogFileLine[];
  
  // Pagination
  filesPagination: Pagination | null;
  linesPagination: Pagination | null;
  
  // Loading states
  loading: {
    files: boolean;
    fileDetails: boolean;
    lines: boolean;
    upload: boolean;
    cleanup: boolean;
    stats: boolean;
    securityAnalysis: boolean;
    securityStats: boolean;
    securityIssues: boolean;
  };
  
  // Upload progress
  uploadProgress: number;
  
  // Storage statistics
  storageStats: StorageStats | null;
  
  // Security analysis
  securityAnalysisStats: {
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
  } | null;
  
  securityIssues: LogFileLine[];
  securityIssuesPagination: Pagination | null;
  
  // Filters and search
  filters: {
    status?: string;
    search?: string;
  };
  
  // Line filters (all filter parameters for log lines)
  linesFilters: {
    search?: string;
    securityStatus?: string;
    severity?: string;
    analysisStatus?: string;
    hasAlerts?: string;
    logLevel?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
  };
  
  linesSearch: string;
  
  // Error handling
  error: string | null;
  uploadError: string | null;
}

const initialState: LogAnalyzerState = {
  files: [],
  selectedFile: null,
  fileLines: [],
  filesPagination: null,
  linesPagination: null,
  loading: {
    files: false,
    fileDetails: false,
    lines: false,
    upload: false,
    cleanup: false,
    stats: false,
    securityAnalysis: false,
    securityStats: false,
    securityIssues: false,
  },
  uploadProgress: 0,
  storageStats: null,
  securityAnalysisStats: null,
  securityIssues: [],
  securityIssuesPagination: null,
  filters: {},
  linesFilters: {},
  linesSearch: '',
  error: null,
  uploadError: null,
};

const logAnalyzerSlice = createSlice({
  name: 'logAnalyzer',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<{ key: keyof LogAnalyzerState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setUploadError: (state, action: PayloadAction<string | null>) => {
      state.uploadError = action.payload;
    },
    
    // Files management
    setFiles: (state, action: PayloadAction<{ files: LogFileMeta[]; pagination: Pagination }>) => {
      state.files = action.payload.files;
      state.filesPagination = action.payload.pagination;
    },
    
    addFile: (state, action: PayloadAction<LogFileMeta>) => {
      state.files.unshift(action.payload);
    },
    
    updateFile: (state, action: PayloadAction<LogFileMeta>) => {
      const index = state.files.findIndex(file => file.id === action.payload.id);
      if (index !== -1) {
        state.files[index] = action.payload;
      }
      if (state.selectedFile?.id === action.payload.id) {
        state.selectedFile = action.payload;
      }
    },

    updateFileProcessingStats: (state, action: PayloadAction<{
      fileId: string;
      linesProcessed?: number;
      currentLinesCount?: number;
      status?: 'uploading' | 'processing' | 'completed' | 'error';
    }>) => {
      const { fileId, linesProcessed, currentLinesCount, status } = action.payload;
      
      // Update in files array
      const fileIndex = state.files.findIndex(file => file.id === fileId);
      if (fileIndex !== -1) {
        if (linesProcessed !== undefined) state.files[fileIndex].currentLinesCount = linesProcessed;
        if (currentLinesCount !== undefined) state.files[fileIndex].currentLinesCount = currentLinesCount;
        if (status !== undefined) state.files[fileIndex].status = status;
      }
      
      // Update selected file if it matches
      if (state.selectedFile?.id === fileId) {
        if (linesProcessed !== undefined) state.selectedFile.currentLinesCount = linesProcessed;
        if (currentLinesCount !== undefined) state.selectedFile.currentLinesCount = currentLinesCount;
        if (status !== undefined) state.selectedFile.status = status;
      }
    },
    
    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter(file => file.id !== action.payload);
      if (state.selectedFile?.id === action.payload) {
        state.selectedFile = null;
        state.fileLines = [];
        state.linesPagination = null;
      }
    },
    
    // Selected file and lines
    setSelectedFile: (state, action: PayloadAction<LogFileMeta | null>) => {
      state.selectedFile = action.payload;
      if (!action.payload) {
        state.fileLines = [];
        state.linesPagination = null;
      }
    },
    
    setFileLines: (state, action: PayloadAction<{ lines: LogFileLine[]; pagination: Pagination }>) => {
      state.fileLines = action.payload.lines;
      state.linesPagination = action.payload.pagination;
    },
    
    clearFileLines: (state) => {
      state.fileLines = [];
      state.linesPagination = null;
      if (state.selectedFile) {
        state.selectedFile.currentLinesCount = 0;
      }
    },
    
    // Upload progress
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
      state.uploadError = null;
    },
    
    // Storage stats
    setStorageStats: (state, action: PayloadAction<StorageStats>) => {
      state.storageStats = action.payload;
    },
    
    // Filters and search
    setFilters: (state, action: PayloadAction<Partial<LogAnalyzerState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = {};
    },
    
    setLinesSearch: (state, action: PayloadAction<string>) => {
      state.linesSearch = action.payload;
    },
    
    // Lines filters management
    setLinesFilters: (state, action: PayloadAction<Partial<LogAnalyzerState['linesFilters']>>) => {
      state.linesFilters = { ...state.linesFilters, ...action.payload };
    },
    
    clearLinesFilters: (state) => {
      state.linesFilters = {};
    },
    
    // Reset state
    resetState: (state) => {
      return { ...initialState };
    },
  },
});

export const {
  setLoading,
  setError,
  setUploadError,
  setFiles,
  addFile,
  updateFile,
  updateFileProcessingStats,
  removeFile,
  setSelectedFile,
  setFileLines,
  clearFileLines,
  setUploadProgress,
  resetUploadProgress,
  setStorageStats,
  setFilters,
  clearFilters,
  setLinesSearch,
  setLinesFilters,
  clearLinesFilters,
  resetState,
} = logAnalyzerSlice.actions;

export default logAnalyzerSlice.reducer;