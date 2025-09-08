import React, { useState } from 'react';
import logAnalyzerService from '../../services/logAnalyzerService';
import { X, Save, FileText, AlertCircle } from 'lucide-react';

interface AddLineModalProps {
  isOpen: boolean;
  fileId: string;
  onClose: () => void;
  onSuccess: () => void;
  loading?: boolean;
}

const AddLineModal: React.FC<AddLineModalProps> = ({
  isOpen,
  fileId,
  onClose,
  onSuccess,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.content.trim()) {
      errors.push('Content is required');
    } else if (formData.content.length > 10000) {
      errors.push('Content must be less than 10000 characters');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormData({ content: value });
    
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await logAnalyzerService.createLine(fileId, {
        content: formData.content.trim()
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create line';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ content: '' });
    setValidationErrors([]);
    setSubmitError(null);
    onClose();
  };

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
              <FileText className="h-5 w-5 mr-2 text-opensoc-600" />
              Add New Line
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
            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Line Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-opensoc-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="Enter log line content..."
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Character count: {formData.content.length}/10000
              </div>
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
                      Creation Failed
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
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Line
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

export default AddLineModal;