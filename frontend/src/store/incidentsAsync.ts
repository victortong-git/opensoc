import { createAsyncThunk } from '@reduxjs/toolkit';
import incidentService from '../services/incidentService';
import { Incident } from '../types';

// Fetch incidents with pagination and filters
export const fetchIncidents = createAsyncThunk(
  'incidents/fetchIncidents',
  async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    severity?: number | number[];
    status?: string | string[];
    category?: string | string[];
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) => {
    const response = await incidentService.getIncidents(params);
    return response;
  }
);

// Fetch single incident
export const fetchIncident = createAsyncThunk(
  'incidents/fetchIncident',
  async (incidentId: string) => {
    const incident = await incidentService.getIncident(incidentId);
    return incident;
  }
);

// Update incident
export const updateIncident = createAsyncThunk(
  'incidents/updateIncident',
  async ({ 
    id, 
    updates 
  }: { 
    id: string; 
    updates: {
      title?: string;
      description?: string;
      severity?: number;
      status?: 'open' | 'investigating' | 'contained' | 'resolved';
      category?: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
      assignedTo?: string;
      metadata?: Record<string, any>;
    }
  }) => {
    const incident = await incidentService.updateIncident(id, updates);
    return incident;
  }
);

// Resolve incident
export const resolveIncident = createAsyncThunk(
  'incidents/resolveIncident',
  async ({ 
    id, 
    resolution 
  }: { 
    id: string; 
    resolution: string;
  }) => {
    const incident = await incidentService.resolveIncident(id, resolution);
    return incident;
  }
);

// Create new incident
export const createIncident = createAsyncThunk(
  'incidents/createIncident',
  async (incidentData: {
    title: string;
    description?: string;
    severity: number;
    category?: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
    assignedTo?: string;
    alertIds?: string[];
    metadata?: Record<string, any>;
  }) => {
    const incident = await incidentService.createIncident(incidentData);
    return incident;
  }
);

// Delete incident
export const deleteIncident = createAsyncThunk(
  'incidents/deleteIncident',
  async (incidentId: string) => {
    await incidentService.deleteIncident(incidentId);
    return incidentId;
  }
);

// Add timeline event to incident
export const addTimelineEvent = createAsyncThunk(
  'incidents/addTimelineEvent',
  async ({
    incidentId,
    eventData
  }: {
    incidentId: string;
    eventData: {
      type: 'alert' | 'action' | 'note' | 'status_change' | 'escalation';
      title: string;
      description?: string;
    };
  }) => {
    const timelineEvent = await incidentService.addTimelineEvent(incidentId, eventData);
    return { incidentId, timelineEvent };
  }
);

// Fetch incident statistics
export const fetchIncidentStats = createAsyncThunk(
  'incidents/fetchIncidentStats',
  async (days?: number) => {
    const stats = await incidentService.getIncidentStats(days);
    return stats;
  }
);