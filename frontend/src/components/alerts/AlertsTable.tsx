import React from 'react';
import { Alert } from '../../types';
import AlertsProfessionalTable from './AlertsProfessionalTable';

interface AlertsTableProps {
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

const AlertsTable: React.FC<AlertsTableProps> = (props) => {
  return <AlertsProfessionalTable {...props} />;
};

export default AlertsTable;