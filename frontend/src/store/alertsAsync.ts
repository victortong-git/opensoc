import { createAsyncThunk } from '@reduxjs/toolkit';
import alertService from '../services/alertService';
// Remove unused Alert import - Alert type is used only in return types

// Fetch alerts with pagination and filters
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    severity?: number | number[];
    status?: string | string[];
    sourceSystem?: string | string[];
    assetId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) => {
    const response = await alertService.getAlerts(params);
    return response;
  }
);

// Fetch single alert
export const fetchAlert = createAsyncThunk(
  'alerts/fetchAlert',
  async (alertId: string) => {
    const alert = await alertService.getAlert(alertId);
    return alert;
  }
);

// Update alert
export const updateAlert = createAsyncThunk(
  'alerts/updateAlert',
  async ({ 
    id, 
    updates 
  }: { 
    id: string; 
    updates: {
      title?: string;
      description?: string;
      severity?: number;
      status?: 'new' | 'investigating' | 'resolved' | 'false_positive';
      assignedAgent?: string;
      enrichmentData?: Record<string, any>;
    }
  }) => {
    const alert = await alertService.updateAlert(id, updates);
    return alert;
  }
);

// Bulk update alerts
export const bulkUpdateAlerts = createAsyncThunk(
  'alerts/bulkUpdateAlerts',
  async ({
    alertIds,
    updates
  }: {
    alertIds: string[];
    updates: {
      status?: 'new' | 'investigating' | 'resolved' | 'false_positive';
      assignedAgent?: string;
    };
  }) => {
    const result = await alertService.bulkUpdateAlerts({
      alertIds,
      updateData: updates
    });
    return { alertIds, updates, updatedCount: result.updatedCount };
  }
);

// Resolve alert
export const resolveAlert = createAsyncThunk(
  'alerts/resolveAlert',
  async ({ 
    id, 
    resolution = 'resolved' 
  }: { 
    id: string; 
    resolution?: 'resolved' | 'false_positive' 
  }) => {
    const alert = await alertService.resolveAlert(id, { resolution });
    return alert;
  }
);

// Escalate alert to incident
export const escalateAlert = createAsyncThunk(
  'alerts/escalateAlert',
  async ({
    id,
    escalationData
  }: {
    id: string;
    escalationData: {
      title?: string;
      description?: string;
      severity?: number;
      category?: string;
      assignedTo?: string;
    };
  }) => {
    const result = await alertService.escalateAlert(id, escalationData);
    return result;
  }
);

// Create new alert
export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (alertData: {
    title: string;
    description?: string;
    severity: number;
    sourceSystem: string;
    eventTime: Date;
    assetId?: string;
    assetName?: string;
    rawData?: Record<string, any>;
    enrichmentData?: Record<string, any>;
    assignedAgent?: string;
  }) => {
    const alert = await alertService.createAlert(alertData);
    return alert;
  }
);

// Delete alert
export const deleteAlert = createAsyncThunk(
  'alerts/deleteAlert',
  async (alertId: string) => {
    await alertService.deleteAlert(alertId);
    return alertId;
  }
);

// Fetch alert statistics
export const fetchAlertStats = createAsyncThunk(
  'alerts/fetchAlertStats',
  async (days?: number) => {
    const stats = await alertService.getAlertStats(days);
    return stats;
  }
);