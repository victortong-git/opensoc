import { createAsyncThunk } from '@reduxjs/toolkit';
import threatHuntingService, { 
  // New simplified interfaces
  ThreatHunt,
  ThreatHuntTTP,
  ThreatHuntReport,
  HuntTypes,
  // Legacy interfaces
  ThreatHuntingEvent, 
  PaginationParams,
  ThreatHuntingStats,
  Asset,
  MitreTechnique
} from '../services/threatHuntingService';
import { 
  // New hunt management actions
  setHuntsLoading,
  setHuntLoading,
  setHuntTypesLoading,
  setTTPsLoading,
  setReportsLoading,
  setHuntTypes,
  setHunts,
  addHunt,
  updateHunt,
  removeHunt,
  setSelectedHunt,
  setHuntTTPs,
  setSelectedHuntTTPs,
  addHuntTTPs,
  setHuntReports,
  setSelectedHuntReports,
  addHuntReport,
  
  // Legacy actions
  setEventsLoading,
  setEventLoading,
  setStatsLoading,
  setAssetsLoading,
  setTechniquesLoading,
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  setSelectedEvent,
  
  // Shared actions
  setPagination,
  setStats,
  setAvailableAssets,
  setAvailableTechniques,
  setError,
  clearError
} from './threatHuntingSlice';
import { toastNotificationService } from '../services/toastNotificationService';

// === NEW SIMPLIFIED THREAT HUNTING API ACTIONS ===

// Fetch professional hunt types
export const fetchHuntTypes = createAsyncThunk(
  'threatHunting/fetchHuntTypes',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setHuntTypesLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getHuntTypes();
      
      if (response.success) {
        dispatch(setHuntTypes(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch hunt types');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch hunt types';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setHuntTypesLoading(false));
    }
  }
);

// Fetch threat hunts with pagination and filters (new simplified API)
export const fetchThreatHunts = createAsyncThunk(
  'threatHunting/fetchHunts',
  async (params: PaginationParams = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setHuntsLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getThreatHunts(params);
      
      if (response.success) {
        dispatch(setHunts(response.data));
        dispatch(setPagination(response.pagination));
        return response;
      } else {
        throw new Error('Failed to fetch threat hunts');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch threat hunts';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setHuntsLoading(false));
    }
  }
);

// Fetch single threat hunt by ID (new simplified API)
export const fetchThreatHuntById = createAsyncThunk(
  'threatHunting/fetchHuntById',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setHuntLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getThreatHuntById(id);
      
      if (response.success) {
        dispatch(setSelectedHunt(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch threat hunt');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch threat hunt';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setHuntLoading(false));
    }
  }
);

// Create new threat hunt (new simplified API)
export const createThreatHunt = createAsyncThunk(
  'threatHunting/createHunt',
  async (huntData: Partial<ThreatHunt>, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.createThreatHunt(huntData);
      
      if (response.success) {
        dispatch(addHunt(response.data));
        toastNotificationService.showNotification({
          title: '🎯 Success',
          body: `Professional threat hunt "${response.data.name}" created successfully`,
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create threat hunt');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create threat hunt';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Update existing threat hunt (new simplified API)
export const updateThreatHunt = createAsyncThunk(
  'threatHunting/updateHunt',
  async ({ id, huntData }: { id: string; huntData: Partial<ThreatHunt> }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.updateThreatHunt(id, huntData);
      
      if (response.success) {
        dispatch(updateHunt(response.data));
        toastNotificationService.showNotification({
          title: '✅ Success',
          body: `Threat hunt "${response.data.name}" updated successfully`,
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update threat hunt');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update threat hunt';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete threat hunt (new simplified API)
export const deleteThreatHunt = createAsyncThunk(
  'threatHunting/deleteHunt',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.deleteThreatHunt(id);
      
      if (response.success) {
        dispatch(removeHunt(id));
        toastNotificationService.showNotification({
          title: '🗑️ Success',
          body: 'Threat hunt deleted successfully',
        });
        return id;
      } else {
        throw new Error('Failed to delete threat hunt');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete threat hunt';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Clone existing threat hunt (new simplified API)
export const cloneThreatHunt = createAsyncThunk(
  'threatHunting/cloneHunt',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.cloneThreatHunt(id);
      
      if (response.success) {
        dispatch(addHunt(response.data));
        toastNotificationService.showNotification({
          title: '📋 Success',
          body: `Threat hunt "${response.data.name}" cloned successfully`,
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to clone threat hunt');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clone threat hunt';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// === TTP MANAGEMENT ACTIONS ===

// Fetch TTPs for a specific threat hunt
export const fetchHuntTTPs = createAsyncThunk(
  'threatHunting/fetchHuntTTPs',
  async (huntId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setTTPsLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getHuntTTPs(huntId);
      
      if (response.success) {
        dispatch(setHuntTTPs({ huntId, ttps: response.data }));
        dispatch(setSelectedHuntTTPs(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch hunt TTPs');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch hunt TTPs';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setTTPsLoading(false));
    }
  }
);

// Add TTPs to a threat hunt
export const addThreatHuntTTPs = createAsyncThunk(
  'threatHunting/addHuntTTPs',
  async ({ huntId, ttps }: { huntId: string; ttps: Partial<ThreatHuntTTP>[] }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.addHuntTTPs(huntId, ttps);
      
      if (response.success) {
        dispatch(addHuntTTPs({ huntId, ttps: response.data }));
        toastNotificationService.showNotification({
          title: '🎯 Success',
          body: `${response.data.length} MITRE ATT&CK TTPs added to hunt`,
        });
        return response.data;
      } else {
        throw new Error('Failed to add hunt TTPs');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add hunt TTPs';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// === PROFESSIONAL REPORTING ACTIONS ===

// Fetch reports for a specific threat hunt
export const fetchHuntReports = createAsyncThunk(
  'threatHunting/fetchHuntReports',
  async (huntId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setReportsLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getHuntReports(huntId);
      
      if (response.success) {
        dispatch(setHuntReports({ huntId, reports: response.data }));
        dispatch(setSelectedHuntReports(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch hunt reports');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch hunt reports';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setReportsLoading(false));
    }
  }
);

// Generate a professional threat hunt report
export const generateThreatHuntReport = createAsyncThunk(
  'threatHunting/generateHuntReport',
  async ({ huntId, reportData }: { huntId: string; reportData: Partial<ThreatHuntReport> }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.generateHuntReport(huntId, reportData);
      
      if (response.success) {
        dispatch(addHuntReport({ huntId, report: response.data }));
        toastNotificationService.showNotification({
          title: '📊 Success',
          body: `Professional report "${response.data.reportTitle}" generated successfully`,
        });
        return response.data;
      } else {
        throw new Error('Failed to generate hunt report');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate hunt report';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// === THREAT INTELLIGENCE INTEGRATION ACTIONS ===

// Create threat hunt from threat intelligence context
export const createHuntFromThreatIntel = createAsyncThunk(
  'threatHunting/createHuntFromThreatIntel',
  async ({ 
    sourceType, 
    sourceId, 
    huntData 
  }: { 
    sourceType: 'ioc' | 'threat_actor' | 'campaign'; 
    sourceId: string; 
    huntData: Partial<ThreatHunt> 
  }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.createHuntFromThreatIntel(sourceType, sourceId, huntData);
      
      if (response.success) {
        dispatch(addHunt(response.data));
        toastNotificationService.showNotification({
          title: '🔗 Success',
          body: `Threat hunt created from ${sourceType} intelligence`,
        });
        return response.data;
      } else {
        throw new Error('Failed to create hunt from threat intelligence');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create hunt from threat intelligence';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: '❌ Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Refresh threat hunting data (hunts and stats)
export const refreshThreatHuntingData = createAsyncThunk(
  'threatHunting/refreshData',
  async (params: PaginationParams = {}, { dispatch }) => {
    try {
      await Promise.all([
        dispatch(fetchThreatHunts(params)),
        dispatch(fetchThreatHuntingStats()),
        dispatch(fetchHuntTypes()),
      ]);
    } catch (error: any) {
      console.error('Error refreshing threat hunting data:', error);
    }
  }
);

// === LEGACY THREAT HUNTING EVENT ACTIONS (BACKWARDS COMPATIBILITY) ===

// Fetch threat hunting events with pagination and filters
export const fetchThreatHuntingEvents = createAsyncThunk(
  'threatHunting/fetchEvents',
  async (params: PaginationParams = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setEventsLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getThreatHuntingEvents(params);
      
      if (response.success) {
        dispatch(setEvents(response.data));
        dispatch(setPagination(response.pagination));
        return response;
      } else {
        throw new Error('Failed to fetch threat hunting events');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch threat hunting events';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setEventsLoading(false));
    }
  }
);

// Fetch single threat hunting event by ID
export const fetchThreatHuntingEventById = createAsyncThunk(
  'threatHunting/fetchEventById',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setEventLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getThreatHuntingEventById(id);
      
      if (response.success) {
        dispatch(setSelectedEvent(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch threat hunting event');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch threat hunting event';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setEventLoading(false));
    }
  }
);

// Create new threat hunting event
export const createThreatHuntingEvent = createAsyncThunk(
  'threatHunting/createEvent',
  async (eventData: Partial<ThreatHuntingEvent>, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.createThreatHuntingEvent(eventData);
      
      if (response.success) {
        dispatch(addEvent(response.data));
        toastNotificationService.showNotification({
          title: 'Success',
          body: 'Threat hunting event created successfully',
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create threat hunting event');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create threat hunting event';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: 'Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Update existing threat hunting event
export const updateThreatHuntingEvent = createAsyncThunk(
  'threatHunting/updateEvent',
  async ({ id, eventData }: { id: string; eventData: Partial<ThreatHuntingEvent> }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.updateThreatHuntingEvent(id, eventData);
      
      if (response.success) {
        dispatch(updateEvent(response.data));
        toastNotificationService.showNotification({
          title: 'Success',
          body: 'Threat hunting event updated successfully',
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update threat hunting event');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update threat hunting event';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: 'Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete threat hunting event
export const deleteThreatHuntingEvent = createAsyncThunk(
  'threatHunting/deleteEvent',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.deleteThreatHuntingEvent(id);
      
      if (response.success) {
        dispatch(removeEvent(id));
        toastNotificationService.showNotification({
          title: 'Success',
          body: 'Threat hunting event deleted successfully',
        });
        return id;
      } else {
        throw new Error('Failed to delete threat hunting event');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete threat hunting event';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: 'Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Clone existing threat hunting event
export const cloneThreatHuntingEvent = createAsyncThunk(
  'threatHunting/cloneEvent',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(clearError());
      
      const response = await threatHuntingService.cloneThreatHuntingEvent(id);
      
      if (response.success) {
        dispatch(addEvent(response.data));
        toastNotificationService.showNotification({
          title: 'Success',
          body: 'Threat hunting event cloned successfully',
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to clone threat hunting event');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clone threat hunting event';
      dispatch(setError(errorMessage));
      toastNotificationService.showNotification({
        title: 'Error',
        body: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch threat hunting statistics
export const fetchThreatHuntingStats = createAsyncThunk(
  'threatHunting/fetchStats',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setStatsLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getThreatHuntingStats();
      
      if (response.success) {
        dispatch(setStats(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch threat hunting statistics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch threat hunting statistics';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setStatsLoading(false));
    }
  }
);

// Fetch assets for hunting scope selection
export const fetchAssetsForHunting = createAsyncThunk(
  'threatHunting/fetchAssets',
  async (params: {
    search?: string;
    assetType?: string;
    criticality?: string;
    status?: string;
  } = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAssetsLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getAssetsForHunting(params);
      
      if (response.success) {
        dispatch(setAvailableAssets(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch assets');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch assets';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setAssetsLoading(false));
    }
  }
);

// Fetch MITRE techniques for hunting planning
export const fetchMitreTechniquesForHunting = createAsyncThunk(
  'threatHunting/fetchTechniques',
  async (params: {
    search?: string;
    tacticId?: string;
  } = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setTechniquesLoading(true));
      dispatch(clearError());
      
      const response = await threatHuntingService.getMitreTechniquesForHunting(params);
      
      if (response.success) {
        dispatch(setAvailableTechniques(response.data));
        return response.data;
      } else {
        throw new Error('Failed to fetch MITRE techniques');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch MITRE techniques';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setTechniquesLoading(false));
    }
  }
);

// Legacy refresh function is now handled by the enhanced refreshThreatHuntingData above