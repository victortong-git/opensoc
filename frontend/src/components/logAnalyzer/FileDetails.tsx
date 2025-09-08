import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { LogFileMeta } from '../../store/logAnalyzerSlice';
import { emptyFileLines, deleteLogFile } from '../../store/logAnalyzerAsync';
import logAnalyzerService from '../../services/logAnalyzerService';
import { 
  FileText, 
  Calendar, 
  HardDrive, 
  Hash, 
  User, 
  Trash2, 
  FileX, 
  CheckCircle, 
  AlertTriangle,
  Loader,
  Edit
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import EditFileModal from './EditFileModal';

interface FileDetailsProps {
  file: LogFileMeta;
  loading: boolean;
  onFileUpdate?: (updatedFile: LogFileMeta) => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({ file, loading, onFileUpdate }) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleEmptyLines = async () => {
    setActionLoading('empty');
    try {
      await dispatch(emptyFileLines(file.id)).unwrap();
      setShowEmptyConfirm(false);
    } catch (error) {
      // Error is handled by the async thunk
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFile = async () => {
    setActionLoading('delete');
    try {
      await dispatch(deleteLogFile(file.id)).unwrap();
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error is handled by the async thunk
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileUpdate = (updatedFile: LogFileMeta) => {
    if (onFileUpdate) {
      onFileUpdate(updatedFile);
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'uploading':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        formatted: format(date, 'PPpp'),
        relative: formatDistanceToNow(date, { addSuffix: true })
      };
    } catch {
      return {
        formatted: 'Unknown',
        relative: 'Unknown'
      };
    }
  };

  const uploadDate = formatDate(file.uploadDate);

  if (loading) {
    return (
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-soc-dark-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-soc-dark-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-soc-dark-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-soc-dark-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {file.originalName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file.filename}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              disabled={actionLoading !== null}
              className="btn-primary text-sm flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
            {file.status === 'completed' && (file.currentLinesCount || 0) > 0 && (
              <button
                onClick={() => setShowEmptyConfirm(true)}
                disabled={actionLoading !== null}
                className="btn-secondary text-sm flex items-center"
              >
                <FileX className="h-4 w-4 mr-1" />
                Empty Lines
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading !== null}
              className="btn-danger text-sm flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete File
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              logAnalyzerService.getStatusColor(file.status)
            }`}>
              {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
            </span>
            
            {file.status === 'processing' && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Processing file...
              </span>
            )}
          </div>
          
          {file.status === 'error' && file.errorMessage && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{file.errorMessage}</p>
            </div>
          )}
        </div>

        {/* File Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              File Properties
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <HardDrive className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400 mr-2">Size:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {logAnalyzerService.formatFileSize(file.fileSize)}
                </span>
              </div>
              
              {file.totalLines && (
                <div className="flex items-center text-sm">
                  <Hash className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Total Lines:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {logAnalyzerService.formatNumber(file.totalLines)}
                  </span>
                </div>
              )}
              
              {file.currentLinesCount !== undefined && (
                <div className="flex items-center text-sm">
                  <Hash className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Lines in DB:</span>
                  <span className={`font-medium ${
                    file.currentLinesCount === 0 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {logAnalyzerService.formatNumber(file.currentLinesCount)}
                    {file.currentLinesCount === 0 && ' (cleared)'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400 mr-2">Uploaded:</span>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {uploadDate.relative}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {uploadDate.formatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Processing Info
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400 mr-2">File Type:</span>
                <span className="font-medium text-gray-900 dark:text-white uppercase">
                  {logAnalyzerService.getFileExtension(file.originalName) || 'TXT'}
                </span>
              </div>
              
              {file.status === 'completed' && file.totalLines && file.currentLinesCount !== undefined && (
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Progress:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {((file.currentLinesCount / file.totalLines) * 100).toFixed(1)}% stored
                  </span>
                </div>
              )}
              
              {file.status === 'processing' && (
                <div className="flex items-center text-sm">
                  <Loader className="h-4 w-4 text-yellow-500 animate-spin mr-2" />
                  <span className="text-yellow-600 dark:text-yellow-400">
                    Processing lines...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty Lines Confirmation Modal */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-soc-dark-900 shadow-xl rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Empty File Lines
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will remove all log lines from the database while keeping the file metadata. 
                The action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmptyConfirm(false)}
                  disabled={actionLoading === 'empty'}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmptyLines}
                  disabled={actionLoading === 'empty'}
                  className="btn-danger"
                >
                  {actionLoading === 'empty' ? 'Emptying...' : 'Empty Lines'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-soc-dark-900 shadow-xl rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete File
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete the file, all its lines from the database, and the 
                physical file from storage. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading === 'delete'}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFile}
                  disabled={actionLoading === 'delete'}
                  className="btn-danger"
                >
                  {actionLoading === 'delete' ? 'Deleting...' : 'Delete File'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit File Modal */}
      <EditFileModal
        isOpen={showEditModal}
        file={file}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleFileUpdate}
      />
    </div>
  );
};

export default FileDetails;