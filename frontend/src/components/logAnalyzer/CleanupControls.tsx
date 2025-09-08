import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { bulkCleanup } from '../../store/logAnalyzerAsync';
import { StorageStats } from '../../store/logAnalyzerSlice';
import logAnalyzerService from '../../services/logAnalyzerService';
import { Trash2, X, AlertTriangle, Calendar, Database, FileX } from 'lucide-react';

interface CleanupControlsProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  loading: boolean;
  storageStats: StorageStats | null;
}

const CleanupControls: React.FC<CleanupControlsProps> = ({
  isOpen,
  onClose,
  onComplete,
  loading,
  storageStats
}) => {
  const dispatch = useDispatch();
  const [cleanupType, setCleanupType] = useState<'empty_lines' | 'delete_files'>('empty_lines');
  const [olderThanDays, setOlderThanDays] = useState(30);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleCleanup = async () => {
    try {
      const result = await dispatch(bulkCleanup({
        action: cleanupType,
        olderThanDays
      })).unwrap();

      setLastResult(result);
      setShowConfirmation(false);
      onComplete();
    } catch (error) {
      // Error is handled by the async thunk
    }
  };

  const getEstimatedImpact = () => {
    if (!storageStats) return null;

    // This is a rough estimation - in a real implementation, 
    // you might want to call an API endpoint to get accurate counts
    const totalFiles = storageStats.totalFiles;
    const avgFilesAffected = Math.floor(totalFiles * 0.3); // Estimate 30% of files are older than threshold

    return {
      files: avgFilesAffected,
      storage: Math.floor(storageStats.totalFileSize * 0.3),
      lines: Math.floor(storageStats.currentLinesInDb * 0.3)
    };
  };

  const estimatedImpact = getEstimatedImpact();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" aria-hidden="true" />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-soc-dark-900 shadow-xl rounded-lg border border-gray-200 dark:border-soc-dark-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-600" />
              Cleanup Log Files
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Last Result */}
          {lastResult && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                Cleanup Completed Successfully
              </h4>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <div>• Processed {lastResult.processedFiles} files</div>
                {lastResult.deletedLinesCount > 0 && (
                  <div>• Deleted {logAnalyzerService.formatNumber(lastResult.deletedLinesCount)} lines</div>
                )}
                {lastResult.deletedFilesCount > 0 && (
                  <div>• Deleted {lastResult.deletedFilesCount} files</div>
                )}
                {lastResult.errors && lastResult.errors.length > 0 && (
                  <div className="text-yellow-700 dark:text-yellow-300">
                    • {lastResult.errors.length} errors occurred
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cleanup Options */}
          <div className="space-y-6">
            {/* Cleanup Type */}
            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
                Cleanup Action
              </label>
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="cleanupType"
                    value="empty_lines"
                    checked={cleanupType === 'empty_lines'}
                    onChange={(e) => setCleanupType(e.target.value as any)}
                    className="mt-1 mr-3"
                    disabled={loading}
                  />
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                      <FileX className="h-4 w-4 mr-2 text-orange-600" />
                      Empty Lines Only
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Remove log lines from database while keeping file metadata. 
                      Files can be re-processed later.
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="cleanupType"
                    value="delete_files"
                    checked={cleanupType === 'delete_files'}
                    onChange={(e) => setCleanupType(e.target.value as any)}
                    className="mt-1 mr-3"
                    disabled={loading}
                  />
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                      <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                      Delete Files Completely
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Permanently delete files, metadata, lines, and physical files. 
                      <strong className="text-red-600 dark:text-red-400">Cannot be undone.</strong>
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Age Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
                <Calendar className="h-4 w-4 inline mr-1" />
                File Age Threshold
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Files older than
                </span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={olderThanDays}
                  onChange={(e) => setOlderThanDays(parseInt(e.target.value) || 1)}
                  disabled={loading}
                  className="w-20 px-3 py-1 border border-gray-300 dark:border-soc-dark-600 rounded bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  days
                </span>
              </div>
            </div>

            {/* Estimated Impact */}
            {estimatedImpact && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Estimated Impact
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <div>• ~{estimatedImpact.files} files may be affected</div>
                  {cleanupType === 'delete_files' && (
                    <div>• ~{logAnalyzerService.formatFileSize(estimatedImpact.storage)} storage freed</div>
                  )}
                  <div>• ~{logAnalyzerService.formatNumber(estimatedImpact.lines)} database lines affected</div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  *These are estimates based on current data
                </p>
              </div>
            )}

            {/* Current Storage Stats */}
            {storageStats && (
              <div className="p-4 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Current Storage
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Files:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {logAnalyzerService.formatNumber(storageStats.totalFiles)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Storage:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {logAnalyzerService.formatFileSize(storageStats.totalFileSize)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Lines:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {logAnalyzerService.formatNumber(storageStats.currentLinesInDb)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Efficiency:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {storageStats.totalLines > 0 
                        ? `${((storageStats.currentLinesInDb / storageStats.totalLines) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="ml-2">
                  <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {cleanupType === 'delete_files' 
                      ? "This action will permanently delete files and cannot be undone. Make sure you have backups if needed."
                      : "This action will remove log lines from the database but keep file metadata. Files can be re-processed later if needed."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              disabled={loading}
              className={cleanupType === 'delete_files' ? 'btn-danger' : 'btn-warning'}
            >
              {cleanupType === 'delete_files' ? 'Delete Files' : 'Empty Lines'}
            </button>
          </div>

          {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" />
              <div className="relative bg-white dark:bg-soc-dark-900 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-soc-dark-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Confirm {cleanupType === 'delete_files' ? 'File Deletion' : 'Line Cleanup'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to {cleanupType === 'delete_files' ? 'delete' : 'empty'} files 
                  older than {olderThanDays} days? This action {cleanupType === 'delete_files' ? 'cannot be undone' : 'will remove log lines from the database'}.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className={cleanupType === 'delete_files' ? 'btn-danger' : 'btn-warning'}
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanupControls;