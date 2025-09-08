import React from 'react';
import { Loader2 } from 'lucide-react';
import { Alert } from '../../types';
import IncidentCreateModal from '../incidents/IncidentCreateModal';
import OneClickAnalysisModal from './OneClickAnalysisModal';
import AnalysisErrorBoundary from './analysis/AnalysisErrorBoundary';

export interface AlertModalsProps {
  alert: Alert;
  // Incident Modal
  showIncidentModal: boolean;
  setShowIncidentModal: (show: boolean) => void;
  handleIncidentCreated: (incident: any) => void;
  // One Click Analysis Modal
  showOneClickAnalysisModal: boolean;
  setShowOneClickAnalysisModal: (show: boolean) => void;
  handleOneClickAnalysisComplete: (results: any) => void;
  // Resolve Alert Modal
  showResolveModal: boolean;
  setShowResolveModal: (show: boolean) => void;
  resolveFormData: {
    resolution: 'resolved' | 'false_positive';
    remarks: string;
    reasoning: string;
  };
  setResolveFormData: React.Dispatch<React.SetStateAction<{
    resolution: 'resolved' | 'false_positive';
    remarks: string;
    reasoning: string;
  }>>;
  handleResolveSubmit: (e: React.FormEvent) => Promise<void>;
  updating: boolean;
}

/**
 * Alert Modals Component
 * Contains all modal components used in Alert Details page
 */
const AlertModals: React.FC<AlertModalsProps> = ({
  alert,
  showIncidentModal,
  setShowIncidentModal,
  handleIncidentCreated,
  showOneClickAnalysisModal,
  setShowOneClickAnalysisModal,
  handleOneClickAnalysisComplete,
  showResolveModal,
  setShowResolveModal,
  resolveFormData,
  setResolveFormData,
  handleResolveSubmit,
  updating
}) => {
  return (
    <>
      {/* Incident Creation Modal */}
      {showIncidentModal && (
        <IncidentCreateModal
          isOpen={showIncidentModal}
          onClose={() => setShowIncidentModal(false)}
          onSuccess={handleIncidentCreated}
          sourceAlert={alert}
        />
      )}

      {/* One Click Analysis Modal with Error Boundary */}
      <AnalysisErrorBoundary onClose={() => setShowOneClickAnalysisModal(false)}>
        <OneClickAnalysisModal
          isOpen={showOneClickAnalysisModal}
          onClose={() => setShowOneClickAnalysisModal(false)}
          alert={alert}
          onAnalysisComplete={handleOneClickAnalysisComplete}
        />
      </AnalysisErrorBoundary>

      {/* Resolve Alert Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {resolveFormData.resolution === 'false_positive' ? 'Mark as False Positive' : 'Resolve Alert'}
            </h2>
            
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resolution Type
                </label>
                <select
                  value={resolveFormData.resolution}
                  onChange={(e) => setResolveFormData({
                    ...resolveFormData,
                    resolution: e.target.value as 'resolved' | 'false_positive'
                  })}
                  className="w-full px-3 py-2 bg-soc-dark-800 border border-soc-dark-700 rounded-lg text-white focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
                >
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False Positive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resolution Remarks <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolveFormData.remarks}
                  onChange={(e) => setResolveFormData({
                    ...resolveFormData,
                    remarks: e.target.value
                  })}
                  placeholder="Explain why this alert is being resolved/marked as false positive..."
                  rows={4}
                  className="w-full px-3 py-2 bg-soc-dark-800 border border-soc-dark-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Reasoning (Optional)
                </label>
                <textarea
                  value={resolveFormData.reasoning}
                  onChange={(e) => setResolveFormData({
                    ...resolveFormData,
                    reasoning: e.target.value
                  })}
                  placeholder="Additional technical details or context..."
                  rows={3}
                  className="w-full px-3 py-2 bg-soc-dark-800 border border-soc-dark-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={updating || !resolveFormData.remarks.trim()}
                  className="flex-1 bg-opensoc-600 hover:bg-opensoc-700 disabled:bg-opensoc-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {updating ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {resolveFormData.resolution === 'false_positive' ? 'Marking...' : 'Resolving...'}
                    </div>
                  ) : (
                    resolveFormData.resolution === 'false_positive' ? 'Mark as False Positive' : 'Resolve Alert'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolveFormData({
                      resolution: 'resolved',
                      remarks: '',
                      reasoning: ''
                    });
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-soc-dark-700 hover:bg-soc-dark-600 text-white rounded-lg border border-soc-dark-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertModals;