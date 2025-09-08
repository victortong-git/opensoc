import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  itemType?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName = '',
  itemType = 'item',
  isDangerous = false,
  isLoading = false,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const requiresTypeConfirmation = isDangerous && itemName;
  const confirmationRequired = requiresTypeConfirmation ? itemName : '';

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requiresTypeConfirmation && confirmationText !== confirmationRequired) {
      return;
    }
    await onConfirm();
  };

  const canConfirm = !requiresTypeConfirmation || confirmationText === confirmationRequired;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isDangerous ? 'bg-red-100 dark:bg-red-900' : 'bg-orange-100 dark:bg-orange-900'
            }`}>
              {isDangerous ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <Trash2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>

          {requiresTypeConfirmation && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Type <span className="font-medium text-gray-900 dark:text-white">{confirmationRequired}</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-red-500 focus:border-red-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={`Enter "${confirmationRequired}" to confirm`}
              />
            </div>
          )}

          {isDangerous && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete the {itemType} and all associated data.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 
                     rounded-md hover:bg-gray-50 dark:hover:bg-slate-600
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isDangerous 
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                        : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                      } focus:ring-2 focus:ring-offset-2`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </div>
            ) : (
              `Delete ${itemType}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;