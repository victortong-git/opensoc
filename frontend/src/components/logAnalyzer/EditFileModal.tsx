import React, { useState, useEffect } from 'react';
import { LogFileMeta } from '../../store/logAnalyzerSlice';
import logAnalyzerService from '../../services/logAnalyzerService';
import { X, Save, FileText, AlertCircle } from 'lucide-react';

interface EditFileModalProps {
  isOpen: boolean;
  file: LogFileMeta | null;
  onClose: () => void;
  onSuccess: (updatedFile: LogFileMeta) => void;
  loading?: boolean;
}

const EditFileModal: React.FC<EditFileModalProps> = ({
  isOpen,
  file,
  onClose,
  onSuccess,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    originalName: '',
    status: 'completed' as 'uploading' | 'processing' | 'completed' | 'error',
    errorMessage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when file changes
  useEffect(() => {
    if (file) {
      setFormData({
        originalName: file.originalName || '',
        status: file.status as any || 'completed',
        errorMessage: file.errorMessage || ''
      });
      setValidationErrors([]);
      setSubmitError(null);
    }
  }, [file]);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.originalName.trim()) {
      errors.push('File name is required');
    } else if (formData.originalName.length > 255) {
      errors.push('File name must be less than 255 characters');
    }

    if (formData.errorMessage && formData.errorMessage.length > 1000) {
      errors.push('Error message must be less than 1000 characters');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        originalName: formData.originalName.trim(),
        status: formData.status,
        errorMessage: formData.errorMessage.trim() || undefined
      };

      const response = await logAnalyzerService.updateFile(file.id, updateData);
      onSuccess(response.data);
      handleClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update file';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      originalName: '',
      status: 'completed',
      errorMessage: ''
    });
    setValidationErrors([]);
    setSubmitError(null);
    onClose();
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" aria-hidden="true" />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-soc-dark-900 shadow-xl rounded-lg border border-gray-200 dark:border-soc-dark-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="h-5 w-5 mr-2 text-opensoc-600" />
              Edit File
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Name */}
            <div>
              <label htmlFor="originalName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Name
              </label>
              <input
                type="text"
                id="originalName"
                name="originalName"
                value={formData.originalName}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
                placeholder="Enter file name..."
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
              >
                <option value="uploading">Uploading</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Error Message */}
            <div>
              <label htmlFor="errorMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Error Message
                <span className="text-gray-500 dark:text-gray-400 font-normal"> (optional)</span>
              </label>
              <textarea
                id="errorMessage"
                name="errorMessage"
                value={formData.errorMessage}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-opensoc-500 focus:border-transparent resize-none"
                placeholder="Enter error message if status is error..."
              />
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-2">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Update Failed
                    </h4>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {submitError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || validationErrors.length > 0}
                className="btn-primary flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update File
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditFileModal;