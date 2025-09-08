import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '../../types';
import AlertTableHeader from './AlertTableHeader';
import AlertTableBody from './AlertTableBody';

interface AlertsProfessionalTableProps {
  alerts: Alert[];
  isLoading: boolean;
  selectedAlerts: string[];
  onSelectAlert: (alertId: string) => void;
  onSelectAll: () => void;
  onViewAlert: (alert: Alert) => void;
  onStatusChange: (alertId: string, status: Alert['status']) => void;
  onDeleteAlert: (alertId: string) => void;
  getSeverityColor: (severity: number) => string;
  getStatusColor: (status: string) => string;
  getConfidenceColor: (confidence: number) => string;
  getAIInsights: (alertId: string) => any;
  safeFormatDistance: (dateValue: string | Date) => string;
  onTriggerAIAnalysis: (alertId: string) => void;
  analyzingAlerts: Set<string>;
  deletingAlerts?: Set<string>;
}

const AlertsProfessionalTable: React.FC<AlertsProfessionalTableProps> = ({
  alerts,
  isLoading,
  selectedAlerts,
  onSelectAlert,
  onSelectAll,
  onViewAlert,
  onStatusChange,
  onDeleteAlert,
  getSeverityColor,
  getStatusColor,
  getConfidenceColor,
  getAIInsights,
  safeFormatDistance,
  onTriggerAIAnalysis,
  analyzingAlerts,
  deletingAlerts
}) => {
  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No alerts found</h3>
          <p className="text-slate-400">No alerts match your current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="responsive-table-wrapper">
        <table className="professional-responsive-table">
          <AlertTableHeader 
            selectedAlerts={selectedAlerts}
            totalAlerts={alerts.length}
            onSelectAll={onSelectAll}
          />
          <AlertTableBody 
            alerts={alerts}
            selectedAlerts={selectedAlerts}
            onSelectAlert={onSelectAlert}
            onViewAlert={onViewAlert}
            onStatusChange={onStatusChange}
            onDeleteAlert={onDeleteAlert}
            getSeverityColor={getSeverityColor}
            getStatusColor={getStatusColor}
            getConfidenceColor={getConfidenceColor}
            getAIInsights={getAIInsights}
            safeFormatDistance={safeFormatDistance}
            onTriggerAIAnalysis={onTriggerAIAnalysis}
            analyzingAlerts={analyzingAlerts}
            deletingAlerts={deletingAlerts}
          />
        </table>
      </div>
    </div>
  );
};

export default AlertsProfessionalTable;