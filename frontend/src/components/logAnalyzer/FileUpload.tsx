import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { uploadLogFile } from '../../store/logAnalyzerAsync';
import logAnalyzerService from '../../services/logAnalyzerService';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  uploadError: string | null;
  loading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  onSuccess,
  uploadError,
  loading
}) => {
  const dispatch = useDispatch();
  const { uploadProgress } = useSelector((state: RootState) => state.logAnalyzer);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    const validation = logAnalyzerService.validateFile(file);
    
    if (validation.isValid) {
      setSelectedFile(file);
      setValidationErrors([]);
    } else {
      setSelectedFile(null);
      setValidationErrors(validation.errors);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await dispatch(uploadLogFile(selectedFile)).unwrap();
      onSuccess();
      handleClose();
    } catch (error) {
      // Error is handled by the async thunk
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setValidationErrors([]);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" aria-hidden="true" />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-soc-dark-900 shadow-xl rounded-lg border border-gray-200 dark:border-soc-dark-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Log File
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Upload Area */}
          <div className="mb-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-opensoc-500 bg-opensoc-50 dark:bg-opensoc-900/20'
                  : 'border-gray-300 dark:border-soc-dark-600 hover:border-opensoc-400 dark:hover:border-opensoc-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt,.out,.err,.trace"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                LOG, TXT, OUT, ERR, TRACE files (max 50MB)
              </p>
            </div>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg border border-gray-200 dark:border-soc-dark-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-opensoc-600 flex-shrink-0" />
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {logAnalyzerService.formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                {!loading && (
                  <button
                    onClick={removeFile}
                    className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Validation Errors
                  </h4>
                  <ul className="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Upload Failed
                  </h4>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {uploadError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-soc-dark-700 rounded-full h-2">
                <div
                  className="bg-opensoc-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || validationErrors.length > 0 || loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;