import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

/**
 * Alert Loading State Component
 * Shows loading state while alert data is being fetched
 */
export const AlertLoadingState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Loading Alert...</h1>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Alerts</span>
        </button>
      </div>
      
      <div className="card p-12 text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-slate-400">Loading alert details...</p>
      </div>
    </div>
  );
};

export interface AlertErrorStateProps {
  error?: string | null;
}

/**
 * Alert Error State Component
 * Shows error state when alert cannot be found or loaded
 */
export const AlertErrorState: React.FC<AlertErrorStateProps> = ({ error }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alert Not Found</h1>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Alerts</span>
        </button>
      </div>
      
      <div className="card p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Alert Not Found</h3>
        <p className="text-slate-400">{error || 'The requested alert could not be found.'}</p>
      </div>
    </div>
  );
};