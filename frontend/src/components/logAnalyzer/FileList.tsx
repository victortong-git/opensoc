import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogFileMeta, Pagination } from '../../store/logAnalyzerSlice';
import logAnalyzerService from '../../services/logAnalyzerService';
import { FileText, Clock, CheckCircle, AlertTriangle, Loader, RefreshCw, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileListProps {
  files: LogFileMeta[];
  selectedFile: LogFileMeta | null;
  loading: boolean;
  pagination: Pagination | null;
  onFileSelect: (file: LogFileMeta) => void;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedFile,
  loading,
  pagination,
  onFileSelect,
  onPageChange,
  onRefresh
}) => {
  const navigate = useNavigate();

  const handleViewLines = (file: LogFileMeta, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent file selection
    navigate(`/log-analyzer/${file.id}/lines`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'uploading':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatUploadDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading && files.length === 0) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-soc-dark-700 rounded h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          No log files found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload your first log file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-soc-dark-700">
      {/* Header with refresh button */}
      {onRefresh && (
        <div className="p-2 bg-gray-50 dark:bg-soc-dark-800 border-b border-gray-200 dark:border-soc-dark-700">
          <div className="flex justify-end">
            <button
              onClick={onRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Refresh file list"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* File List */}
      <div className="max-h-96 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onFileSelect(file)}
            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-soc-dark-800 transition-colors ${
              selectedFile?.id === file.id
                ? 'bg-opensoc-50 dark:bg-opensoc-900/20 border-r-2 border-opensoc-500'
                : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-opensoc-600 flex-shrink-0 mt-0.5" />
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  {getStatusIcon(file.status)}
                </div>
                
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{logAnalyzerService.formatFileSize(file.fileSize)}</span>
                  {file.totalLines && (
                    <span>{logAnalyzerService.formatNumber(file.totalLines)} lines</span>
                  )}
                  <span>{formatUploadDate(file.uploadDate)}</span>
                </div>

                {/* Status Badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    logAnalyzerService.getStatusColor(file.status)
                  }`}>
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </span>
                </div>

                {/* Error Message */}
                {file.status === 'error' && file.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                    {file.errorMessage}
                  </div>
                )}

                {/* Lines Count Info */}
                {file.status === 'completed' && (file.currentLinesCount !== undefined) && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {file.currentLinesCount === 0 ? (
                      <span className="text-orange-600 dark:text-orange-400">Lines cleared</span>
                    ) : (
                      <span>
                        {logAnalyzerService.formatNumber(file.currentLinesCount)} lines in database
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {file.status === 'completed' && file.totalLines && file.totalLines > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => handleViewLines(file, e)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-opensoc-600 dark:text-opensoc-400 hover:text-opensoc-700 dark:hover:text-opensoc-300 bg-opensoc-50 dark:bg-opensoc-900/20 hover:bg-opensoc-100 dark:hover:bg-opensoc-900/40 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Log Lines
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-soc-dark-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {files.length} of {pagination.total} files
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded hover:bg-gray-100 dark:hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  pagination.pages - 4,
                  pagination.page - 2
                )) + i;
                
                if (pageNum > pagination.pages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-2 py-1 text-sm border rounded ${
                      pagination.page === pageNum
                        ? 'bg-opensoc-600 text-white border-opensoc-600'
                        : 'border-gray-300 dark:border-soc-dark-600 hover:bg-gray-100 dark:hover:bg-soc-dark-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded hover:bg-gray-100 dark:hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;