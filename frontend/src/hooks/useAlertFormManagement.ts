import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert } from '../types';
import alertService from '../services/alertService';
import { AppDispatch } from '../store';
import { fetchAlert } from '../store/alertsAsync';

export interface UseAlertFormManagementReturn {
  // Form state
  isEditing: boolean;
  updating: boolean;
  showResolveModal: boolean;
  incidentCreationSuccess: any | null;
  
  // Form data
  editFormData: {
    title: string;
    description: string;
    severity: number;
    assignedAgent: string;
    assetName: string;
  };
  resolveFormData: {
    resolution: 'resolved' | 'false_positive';
    remarks: string;
    reasoning: string;
  };
  
  // Form handlers
  handleStatusChange: (newStatus: Alert['status']) => Promise<void>;
  handleIncidentCreated: (incident: any) => void;
  handleResolveSubmit: (e: React.FormEvent) => Promise<void>;
  handleEditToggle: () => void;
  handleEditSave: () => Promise<void>;
  
  // Form data setters
  setEditFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    severity: number;
    assignedAgent: string;
    assetName: string;
  }>>;
  setResolveFormData: React.Dispatch<React.SetStateAction<{
    resolution: 'resolved' | 'false_positive';
    remarks: string;
    reasoning: string;
  }>>;
  setShowResolveModal: (show: boolean) => void;
  setIncidentCreationSuccess: (incident: any | null) => void;
  
  // Utility functions
  getSeverityColor: (severity: number) => string;
  getStatusColor: (status: string) => string;
}

/**
 * Custom hook for managing alert form operations and state
 * Handles alert editing, status changes, resolution, and related form operations
 */
export const useAlertFormManagement = (
  alert: Alert | null,
  alertId: string | undefined,
  updateAlert: {
    setAlert: (alert: Alert | null) => void;
    loadTimeline: (alertId: string) => Promise<void>;
    loadRelatedIncidents: (alertId: string) => Promise<void>;
  }
): UseAlertFormManagementReturn => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [incidentCreationSuccess, setIncidentCreationSuccess] = useState<any | null>(null);
  
  // Form data state
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    severity: number;
    assignedAgent: string;
    assetName: string;
  }>({
    title: '',
    description: '',
    severity: 1,
    assignedAgent: '',
    assetName: ''
  });
  
  const [resolveFormData, setResolveFormData] = useState<{
    resolution: 'resolved' | 'false_positive';
    remarks: string;
    reasoning: string;
  }>({
    resolution: 'resolved',
    remarks: '',
    reasoning: ''
  });

  // Update edit form data when alert changes
  useEffect(() => {
    if (alert) {
      setEditFormData({
        title: alert.title || '',
        description: alert.description || '',
        severity: alert.severity || 1,
        assignedAgent: alert.assignedAgent || '',
        assetName: alert.assetName || ''
      });
    }
  }, [alert]);

  /**
   * Handle alert status change
   */
  const handleStatusChange = async (newStatus: Alert['status']) => {
    if (!alert) return;
    
    // If changing to resolved or false_positive, show resolve modal
    if (newStatus === 'resolved' || newStatus === 'false_positive') {
      setResolveFormData({
        resolution: newStatus,
        remarks: '',
        reasoning: ''
      });
      setShowResolveModal(true);
      return;
    }
    
    // For other status changes, update directly
    try {
      setUpdating(true);
      await alertService.updateAlert(alert.id, { status: newStatus });
      
      // Update local state
      updateAlert.setAlert({ ...alert, status: newStatus, updatedAt: new Date().toISOString() as any });
      
      // Refresh alert data from store
      dispatch(fetchAlert(alert.id));
    } catch (error) {
      console.error('Failed to update alert status:', error);
      // Could add a toast notification here
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handle incident creation success
   */
  const handleIncidentCreated = (incident: any) => {
    setIncidentCreationSuccess(incident);
    
    // Refresh related incidents
    if (alertId) {
      updateAlert.loadRelatedIncidents(alertId);
    }
    
    // Update alert status to investigating
    if (alert && incident?.status === 'created' && alert.status !== 'investigating') {
      handleStatusChange('investigating');
    }
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setIncidentCreationSuccess(null);
    }, 5000);
    
    // Refresh store to get latest alert status
    if (alertId) {
      dispatch(fetchAlert(alertId));
    }
  };

  /**
   * Handle resolve form submission
   */
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alert) return;

    if (!resolveFormData.remarks.trim()) {
      window.alert('Please provide resolve remarks explaining the resolution decision.');
      return;
    }

    try {
      setUpdating(true);
      const response = await alertService.resolveAlert(alert.id, {
        resolution: resolveFormData.resolution,
        remarks: resolveFormData.remarks.trim(),
        reasoning: resolveFormData.reasoning.trim() || undefined
      });

      // Update local state with the resolved alert
      updateAlert.setAlert(response.alert);
      
      // Close modal and reset form
      setShowResolveModal(false);
      setResolveFormData({
        resolution: 'resolved',
        remarks: '',
        reasoning: ''
      });

      // Refresh alert data from store
      dispatch(fetchAlert(alert.id));
      
      // Refresh timeline to show resolution event
      await updateAlert.loadTimeline(alert.id);
      
      console.log('Alert resolved successfully with remarks');
    } catch (error: any) {
      console.error('Failed to resolve alert:', error);
      window.alert(`Failed to resolve alert: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handle edit mode toggle
   */
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data to original values
      if (alert) {
        setEditFormData({
          title: alert.title || '',
          description: alert.description || '',
          severity: alert.severity || 1,
          assignedAgent: alert.assignedAgent || '',
          assetName: alert.assetName || ''
        });
      }
    }
    setIsEditing(!isEditing);
  };

  /**
   * Handle edit form save
   */
  const handleEditSave = async () => {
    if (!alert) return;
    
    try {
      setUpdating(true);
      
      // Prepare update data, removing empty strings to avoid validation issues
      const updateData: any = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        severity: editFormData.severity,
      };
      
      // Handle assignedAgent - set to null if empty to avoid validation issues
      if (editFormData.assignedAgent.trim()) {
        updateData.assignedAgent = editFormData.assignedAgent.trim();
      } else {
        updateData.assignedAgent = null;
      }
      
      console.log('Updating alert with data:', updateData);
      await alertService.updateAlert(alert.id, updateData);
      
      // Update local state
      updateAlert.setAlert({
        ...alert,
        title: editFormData.title,
        description: editFormData.description,
        severity: editFormData.severity as 1 | 2 | 3 | 4 | 5,
        assignedAgent: editFormData.assignedAgent,
        assetName: editFormData.assetName,
        updatedAt: new Date().toISOString() as any
      });
      
      // Exit edit mode
      setIsEditing(false);
      
      // Refresh alert data from store
      dispatch(fetchAlert(alert.id));
      
      console.log('Alert updated successfully');
    } catch (error: any) {
      console.error('Failed to update alert:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show error to user - for now just console, could add toast later
      window.alert('Failed to update alert. Please check console for details.');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Get severity color classes
   */
  const getSeverityColor = (severity: number): string => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 4: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 3: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 2: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 1: return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  /**
   * Get status color classes
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'resolved': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'false_positive': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return {
    // Form state
    isEditing,
    updating,
    showResolveModal,
    incidentCreationSuccess,
    
    // Form data
    editFormData,
    resolveFormData,
    
    // Form handlers
    handleStatusChange,
    handleIncidentCreated,
    handleResolveSubmit,
    handleEditToggle,
    handleEditSave,
    
    // Form data setters
    setEditFormData,
    setResolveFormData,
    setShowResolveModal,
    setIncidentCreationSuccess,
    
    // Utility functions
    getSeverityColor,
    getStatusColor
  };
};