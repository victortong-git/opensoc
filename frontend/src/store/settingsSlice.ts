import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import settingsService, {
  SystemSetting,
  AlertRule,
  SettingsStatsResponse,
  SystemSettingsQueryParams,
  AlertRulesQueryParams,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  UpdateSystemSettingRequest,
  DataCountsResponse,
} from '../services/settingsService';
import { Theme } from '../contexts/ThemeContext';

// State interface
interface SettingsState {
  // System Settings
  systemSettings: SystemSetting[];
  systemSettingsLoading: boolean;
  systemSettingsError: string | null;

  // Alert Rules
  alertRules: AlertRule[];
  alertRulesLoading: boolean;
  alertRulesError: string | null;
  alertRulesPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Statistics
  stats: SettingsStatsResponse | null;
  statsLoading: boolean;
  statsError: string | null;

  // Clear Data
  dataCounts: DataCountsResponse | null;
  dataCountsLoading: boolean;
  dataCountsError: string | null;
  clearDataLoading: { [key: string]: boolean };
  clearDataError: string | null;

  // Theme Preferences
  theme: Theme;
  
  // UI State
  selectedSetting: SystemSetting | null;
  selectedAlertRule: AlertRule | null;
  showCreateAlertRuleModal: boolean;
  showEditAlertRuleModal: boolean;
  showEditSettingModal: boolean;
}

const initialState: SettingsState = {
  // System Settings
  systemSettings: [],
  systemSettingsLoading: false,
  systemSettingsError: null,

  // Alert Rules
  alertRules: [],
  alertRulesLoading: false,
  alertRulesError: null,
  alertRulesPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false,
  },

  // Statistics
  stats: null,
  statsLoading: false,
  statsError: null,

  // Clear Data
  dataCounts: null,
  dataCountsLoading: false,
  dataCountsError: null,
  clearDataLoading: {},
  clearDataError: null,

  // Theme Preferences
  theme: 'system',
  
  // UI State
  selectedSetting: null,
  selectedAlertRule: null,
  showCreateAlertRuleModal: false,
  showEditAlertRuleModal: false,
  showEditSettingModal: false,
};

// Async thunks for System Settings
export const fetchSystemSettings = createAsyncThunk(
  'settings/fetchSystemSettings',
  async (params?: SystemSettingsQueryParams) => {
    const response = await settingsService.getSystemSettings(params);
    return response;
  }
);

export const updateSystemSetting = createAsyncThunk(
  'settings/updateSystemSetting',
  async ({ id, data }: { id: string; data: UpdateSystemSettingRequest }) => {
    const response = await settingsService.updateSystemSetting(id, data);
    return response;
  }
);

// Async thunks for Alert Rules
export const fetchAlertRules = createAsyncThunk(
  'settings/fetchAlertRules',
  async (params?: AlertRulesQueryParams) => {
    const response = await settingsService.getAlertRules(params);
    return response;
  }
);

export const createAlertRule = createAsyncThunk(
  'settings/createAlertRule',
  async (data: CreateAlertRuleRequest) => {
    const response = await settingsService.createAlertRule(data);
    return response;
  }
);

export const updateAlertRule = createAsyncThunk(
  'settings/updateAlertRule',
  async ({ id, data }: { id: string; data: UpdateAlertRuleRequest }) => {
    const response = await settingsService.updateAlertRule(id, data);
    return response;
  }
);

export const deleteAlertRule = createAsyncThunk(
  'settings/deleteAlertRule',
  async (id: string) => {
    await settingsService.deleteAlertRule(id);
    return id;
  }
);

export const toggleAlertRule = createAsyncThunk(
  'settings/toggleAlertRule',
  async (id: string) => {
    const response = await settingsService.toggleAlertRule(id);
    return response;
  }
);

// Async thunks for Statistics
export const fetchSettingsStats = createAsyncThunk(
  'settings/fetchSettingsStats',
  async () => {
    const response = await settingsService.getSettingsStats();
    return response;
  }
);

// Async thunks for Clear Data
export const fetchDataCounts = createAsyncThunk(
  'settings/fetchDataCounts',
  async () => {
    const response = await settingsService.getDataCounts();
    return response;
  }
);

export const clearData = createAsyncThunk(
  'settings/clearData',
  async (type: 'alerts' | 'incidents' | 'assets' | 'threatintel' | 'playbooks' | 'notifications') => {
    const response = await settingsService.clearData(type);
    return { type, response };
  }
);

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // UI actions
    setSelectedSetting: (state, action: PayloadAction<SystemSetting | null>) => {
      state.selectedSetting = action.payload;
    },
    setSelectedAlertRule: (state, action: PayloadAction<AlertRule | null>) => {
      state.selectedAlertRule = action.payload;
    },
    setShowCreateAlertRuleModal: (state, action: PayloadAction<boolean>) => {
      state.showCreateAlertRuleModal = action.payload;
    },
    setShowEditAlertRuleModal: (state, action: PayloadAction<boolean>) => {
      state.showEditAlertRuleModal = action.payload;
    },
    setShowEditSettingModal: (state, action: PayloadAction<boolean>) => {
      state.showEditSettingModal = action.payload;
    },
    
    // Theme actions
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      // Also persist to localStorage
      try {
        localStorage.setItem('opensoc-theme', action.payload);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    },
    
    // Clear errors
    clearSystemSettingsError: (state) => {
      state.systemSettingsError = null;
    },
    clearAlertRulesError: (state) => {
      state.alertRulesError = null;
    },
    clearStatsError: (state) => {
      state.statsError = null;
    },
    clearDataCountsError: (state) => {
      state.dataCountsError = null;
    },
    clearClearDataError: (state) => {
      state.clearDataError = null;
    },
  },
  extraReducers: (builder) => {
    // System Settings
    builder
      .addCase(fetchSystemSettings.pending, (state) => {
        state.systemSettingsLoading = true;
        state.systemSettingsError = null;
      })
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        state.systemSettingsLoading = false;
        state.systemSettings = action.payload?.settings || [];
      })
      .addCase(fetchSystemSettings.rejected, (state, action) => {
        state.systemSettingsLoading = false;
        state.systemSettingsError = action.error.message || 'Failed to fetch system settings';
      })
      
      .addCase(updateSystemSetting.fulfilled, (state, action) => {
        if (action.payload?.setting) {
          const index = state.systemSettings.findIndex(setting => setting.id === action.payload.setting.id);
          if (index !== -1) {
            state.systemSettings[index] = action.payload.setting;
          }
        }
        state.selectedSetting = null;
        state.showEditSettingModal = false;
      });

    // Alert Rules
    builder
      .addCase(fetchAlertRules.pending, (state) => {
        state.alertRulesLoading = true;
        state.alertRulesError = null;
      })
      .addCase(fetchAlertRules.fulfilled, (state, action) => {
        state.alertRulesLoading = false;
        state.alertRules = action.payload?.alertRules || [];
        state.alertRulesPagination = action.payload?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
          hasNext: false,
          hasPrev: false,
        };
      })
      .addCase(fetchAlertRules.rejected, (state, action) => {
        state.alertRulesLoading = false;
        state.alertRulesError = action.error.message || 'Failed to fetch alert rules';
      })
      
      .addCase(createAlertRule.fulfilled, (state, action) => {
        state.alertRules.unshift(action.payload.alertRule);
        state.showCreateAlertRuleModal = false;
      })
      
      .addCase(updateAlertRule.fulfilled, (state, action) => {
        const index = state.alertRules.findIndex(rule => rule.id === action.payload.alertRule.id);
        if (index !== -1) {
          state.alertRules[index] = action.payload.alertRule;
        }
        state.selectedAlertRule = null;
        state.showEditAlertRuleModal = false;
      })
      
      .addCase(deleteAlertRule.fulfilled, (state, action) => {
        state.alertRules = state.alertRules.filter(rule => rule.id !== action.payload);
        state.selectedAlertRule = null;
      })
      
      .addCase(toggleAlertRule.fulfilled, (state, action) => {
        const index = state.alertRules.findIndex(rule => rule.id === action.payload.alertRule.id);
        if (index !== -1) {
          state.alertRules[index] = action.payload.alertRule;
        }
      });

    // Statistics
    builder
      .addCase(fetchSettingsStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchSettingsStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSettingsStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.error.message || 'Failed to fetch settings statistics';
      });

    // Clear Data
    builder
      .addCase(fetchDataCounts.pending, (state) => {
        state.dataCountsLoading = true;
        state.dataCountsError = null;
      })
      .addCase(fetchDataCounts.fulfilled, (state, action) => {
        state.dataCountsLoading = false;
        state.dataCounts = action.payload;
      })
      .addCase(fetchDataCounts.rejected, (state, action) => {
        state.dataCountsLoading = false;
        state.dataCountsError = action.error.message || 'Failed to fetch data counts';
      })

      .addCase(clearData.pending, (state, action) => {
        state.clearDataLoading[action.meta.arg] = true;
        state.clearDataError = null;
      })
      .addCase(clearData.fulfilled, (state, action) => {
        state.clearDataLoading[action.payload.type] = false;
        // Reset the data counts to trigger a refetch
        state.dataCounts = null;
      })
      .addCase(clearData.rejected, (state, action) => {
        state.clearDataLoading[action.meta.arg] = false;
        state.clearDataError = action.error.message || 'Failed to clear data';
      });
  },
});

export const {
  setSelectedSetting,
  setSelectedAlertRule,
  setShowCreateAlertRuleModal,
  setShowEditAlertRuleModal,
  setShowEditSettingModal,
  setTheme,
  clearSystemSettingsError,
  clearAlertRulesError,
  clearStatsError,
  clearDataCountsError,
  clearClearDataError,
} = settingsSlice.actions;

export default settingsSlice.reducer;