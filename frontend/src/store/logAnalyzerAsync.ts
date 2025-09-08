import { createAsyncThunk } from '@reduxjs/toolkit';
import logAnalyzerService from '../services/logAnalyzerService';
import { 
  setLoading, 
  setError, 
  setUploadError,
  setFiles, 
  addFile, 
  updateFile, 
  removeFile,
  setSelectedFile,
  setFileLines,
  clearFileLines,
  setStorageStats,
  setUploadProgress,
  resetUploadProgress,
  LogLinesFilterParams
} from './logAnalyzerSlice';
import { RootState } from './index';

// Upload file
export const uploadLogFile = createAsyncThunk(
  'logAnalyzer/uploadFile',
  async (file: File, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'upload', value: true }));
      dispatch(resetUploadProgress());
      dispatch(setUploadError(null));

      const response = await logAnalyzerService.uploadFile(file, (progress) => {
        dispatch(setUploadProgress(progress));
      });

      dispatch(addFile(response.data));
      dispatch(resetUploadProgress());
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      dispatch(setUploadError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'upload', value: false }));
    }
  }
);

// Fetch files
export const fetchLogFiles = createAsyncThunk(
  'logAnalyzer/fetchFiles',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'files', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.getFiles(params);
      
      dispatch(setFiles({
        files: response.data,
        pagination: response.pagination
      }));
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch files';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'files', value: false }));
    }
  }
);

// Fetch file details
export const fetchFileDetails = createAsyncThunk(
  'logAnalyzer/fetchFileDetails',
  async (fileId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'fileDetails', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.getFileDetails(fileId);
      
      dispatch(setSelectedFile(response.data));
      dispatch(updateFile(response.data));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch file details';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'fileDetails', value: false }));
    }
  }
);

// Fetch file lines
export const fetchFileLines = createAsyncThunk(
  'logAnalyzer/fetchFileLines',
  async (params: LogLinesFilterParams & { fileId: string }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'lines', value: true }));
      dispatch(setError(null));

      const { fileId, ...filterParams } = params;
      
      const response = await logAnalyzerService.getFileLines(
        fileId,
        filterParams
      );
      
      dispatch(setFileLines({
        lines: response.data,
        pagination: response.pagination
      }));
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch file lines';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'lines', value: false }));
    }
  }
);

// Empty file lines
export const emptyFileLines = createAsyncThunk(
  'logAnalyzer/emptyFileLines',
  async (fileId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'cleanup', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.emptyFileLines(fileId);
      
      // Clear lines from state
      dispatch(clearFileLines());
      
      // Update file details to reflect the change
      dispatch(fetchFileDetails(fileId));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to empty file lines';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'cleanup', value: false }));
    }
  }
);

// Delete file
export const deleteLogFile = createAsyncThunk(
  'logAnalyzer/deleteFile',
  async (fileId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'cleanup', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.deleteFile(fileId);
      
      // Remove file from state
      dispatch(removeFile(fileId));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete file';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'cleanup', value: false }));
    }
  }
);

// Bulk cleanup
export const bulkCleanup = createAsyncThunk(
  'logAnalyzer/bulkCleanup',
  async (params: {
    action: 'empty_lines' | 'delete_files';
    olderThanDays?: number;
    fileIds?: string[];
  }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'cleanup', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.bulkCleanup(params);
      
      // Refresh files list after cleanup
      dispatch(fetchLogFiles({ page: 1 }));
      
      // Refresh storage stats
      dispatch(fetchStorageStats());
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Bulk cleanup failed';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'cleanup', value: false }));
    }
  }
);

// Fetch storage stats
export const fetchStorageStats = createAsyncThunk(
  'logAnalyzer/fetchStorageStats',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'stats', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.getStorageStats();
      
      dispatch(setStorageStats(response.data));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch storage stats';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'stats', value: false }));
    }
  }
);

// Refresh file status (for polling during processing)
export const refreshFileStatus = createAsyncThunk(
  'logAnalyzer/refreshFileStatus',
  async (fileId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentFile = state.logAnalyzer.files.find(f => f.id === fileId);
      
      // Only refresh if file is still processing
      if (currentFile && ['uploading', 'processing'].includes(currentFile.status)) {
        const response = await logAnalyzerService.getFileDetails(fileId);
        dispatch(updateFile(response.data));
        
        if (state.logAnalyzer.selectedFile?.id === fileId) {
          dispatch(setSelectedFile(response.data));
        }
        
        return response.data;
      }
      
      return currentFile;
    } catch (error: any) {
      // Don't dispatch error for refresh operations to avoid UI noise
      return rejectWithValue(error.message);
    }
  }
);

// Analyze file security using AI
export const analyzeFileSecurity = createAsyncThunk(
  'logAnalyzer/analyzeFileSecurity',
  async ({ fileId, batchSize = 50 }: { fileId: string; batchSize?: number }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'securityAnalysis', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.analyzeFileSecurity(fileId, batchSize);
      
      // Refresh file lines to get updated security analysis data
      dispatch(fetchFileLines({ fileId, page: 1 }));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Security analysis failed';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'securityAnalysis', value: false }));
    }
  }
);

// Fetch security analysis stats
export const fetchSecurityAnalysisStats = createAsyncThunk(
  'logAnalyzer/fetchSecurityAnalysisStats',
  async (fileId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'securityStats', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.getSecurityAnalysisStats(fileId);
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch security stats';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'securityStats', value: false }));
    }
  }
);

// Fetch security issues for a file
export const fetchFileSecurityIssues = createAsyncThunk(
  'logAnalyzer/fetchFileSecurityIssues',
  async ({ 
    fileId, 
    page = 1, 
    limit = 20, 
    severity, 
    issueType 
  }: { 
    fileId: string; 
    page?: number; 
    limit?: number; 
    severity?: 'low' | 'medium' | 'high' | 'critical'; 
    issueType?: string; 
  }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ key: 'securityIssues', value: true }));
      dispatch(setError(null));

      const response = await logAnalyzerService.getFileSecurityIssues(fileId, {
        page,
        limit,
        severity,
        issueType
      });
      
      return {
        issues: response.data,
        pagination: response.pagination
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch security issues';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading({ key: 'securityIssues', value: false }));
    }
  }
);

export default {
  uploadLogFile,
  fetchLogFiles,
  fetchFileDetails,
  fetchFileLines,
  emptyFileLines,
  deleteLogFile,
  bulkCleanup,
  fetchStorageStats,
  refreshFileStatus,
  analyzeFileSecurity,
  fetchSecurityAnalysisStats,
  fetchFileSecurityIssues,
};