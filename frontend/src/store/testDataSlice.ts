import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import testDataService, {
  TestDataConfig,
  GeneratedAlert,
  GeneratedIncident,
  GeneratedAsset,
  GeneratedIOC,
  GeneratedPlaybook,
  GeneratedThreatActor,
  GeneratedThreatCampaign,
  AIStatus,
  GenerationResponse,
  TestDataStats,
  CreateTestDataResponse,
  CleanupResponse,
  CleanupOptions,
} from '../services/testDataService';

// State interface
interface TestDataState {
  // AI Connection
  aiStatus: AIStatus;
  aiStatusLoading: boolean;
  aiStatusError: string | null;

  // Generation
  isGenerating: boolean;
  generationProgress: number;
  generationStep: string;
  generationError: string | null;
  generatedData: (GeneratedAlert | GeneratedIncident | GeneratedAsset | GeneratedIOC | GeneratedPlaybook | GeneratedThreatActor | GeneratedThreatCampaign)[];
  fullGeneratedData: (GeneratedAlert | GeneratedIncident | GeneratedAsset | GeneratedIOC | GeneratedPlaybook | GeneratedThreatActor | GeneratedThreatCampaign)[];
  lastConfig: TestDataConfig | null;

  // Statistics
  stats: TestDataStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Creation
  isCreating: boolean;
  createError: string | null;
  lastCreateResult: CreateTestDataResponse | null;

  // Cleanup
  isCleaningUp: boolean;
  cleanupError: string | null;
  lastCleanupResult: CleanupResponse | null;

  // UI State
  showPreviewModal: boolean;
  selectedDataType: 'alert' | 'incident' | 'asset' | 'ioc' | 'playbook' | 'threat_actor' | 'threat_campaign';
  selectedScenario: string;
}

const initialState: TestDataState = {
  // AI Connection
  aiStatus: {
    connected: false,
    modelAvailable: false,
  },
  aiStatusLoading: false,
  aiStatusError: null,

  // Generation
  isGenerating: false,
  generationProgress: 0,
  generationStep: '',
  generationError: null,
  generatedData: [],
  fullGeneratedData: [],
  lastConfig: null,

  // Statistics
  stats: null,
  statsLoading: false,
  statsError: null,

  // Creation
  isCreating: false,
  createError: null,
  lastCreateResult: null,

  // Cleanup
  isCleaningUp: false,
  cleanupError: null,
  lastCleanupResult: null,

  // UI State
  showPreviewModal: false,
  selectedDataType: 'alert',
  selectedScenario: 'mixed',
};

// Async thunks
export const checkAIStatus = createAsyncThunk(
  'testData/checkAIStatus',
  async () => {
    const response = await testDataService.checkAIStatus();
    return response;
  }
);

export const generateTestData = createAsyncThunk(
  'testData/generateTestData',
  async (config: TestDataConfig, { dispatch }) => {
    // Simulate progress updates
    dispatch(setGenerationProgress({ progress: 10, step: 'Connecting to AI' }));
    
    const response = await testDataService.generateTestData(config);
    
    dispatch(setGenerationProgress({ progress: 60, step: 'Processing AI response' }));
    
    // Simulate additional processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    dispatch(setGenerationProgress({ progress: 80, step: 'Validating data format' }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    dispatch(setGenerationProgress({ progress: 100, step: 'Generation complete' }));
    
    return response;
  }
);

export const createTestAlerts = createAsyncThunk(
  'testData/createTestAlerts',
  async (alerts: GeneratedAlert[]) => {
    const response = await testDataService.createTestAlerts(alerts);
    return response;
  }
);

export const createTestIncidents = createAsyncThunk(
  'testData/createTestIncidents',
  async (incidents: GeneratedIncident[]) => {
    const response = await testDataService.createTestIncidents(incidents);
    return response;
  }
);

export const createTestAssets = createAsyncThunk(
  'testData/createTestAssets',
  async (assets: GeneratedAsset[]) => {
    const response = await testDataService.createTestAssets(assets);
    return response;
  }
);

export const createTestIOCs = createAsyncThunk(
  'testData/createTestIOCs',
  async (iocs: GeneratedIOC[]) => {
    const response = await testDataService.createTestIOCs(iocs);
    return response;
  }
);

export const createTestPlaybooks = createAsyncThunk(
  'testData/createTestPlaybooks',
  async (playbooks: GeneratedPlaybook[]) => {
    const response = await testDataService.createTestPlaybooks(playbooks);
    return response;
  }
);

export const createTestThreatActors = createAsyncThunk(
  'testData/createTestThreatActors',
  async (threatActors: GeneratedThreatActor[]) => {
    const response = await testDataService.createTestThreatActors(threatActors);
    return response;
  }
);

export const createTestThreatCampaigns = createAsyncThunk(
  'testData/createTestThreatCampaigns',
  async (threatCampaigns: GeneratedThreatCampaign[]) => {
    const response = await testDataService.createTestThreatCampaigns(threatCampaigns);
    return response;
  }
);

export const fetchTestDataStats = createAsyncThunk(
  'testData/fetchTestDataStats',
  async () => {
    const response = await testDataService.getTestDataStats();
    return response;
  }
);

export const cleanupTestData = createAsyncThunk(
  'testData/cleanupTestData',
  async (options?: CleanupOptions) => {
    const response = await testDataService.cleanupTestData(options);
    return response;
  }
);

// Test data slice
const testDataSlice = createSlice({
  name: 'testData',
  initialState,
  reducers: {
    // UI actions
    setShowPreviewModal: (state, action: PayloadAction<boolean>) => {
      state.showPreviewModal = action.payload;
    },
    setSelectedDataType: (state, action: PayloadAction<'alert' | 'incident' | 'asset' | 'ioc' | 'playbook' | 'threat_actor' | 'threat_campaign'>) => {
      state.selectedDataType = action.payload;
      // Reset scenario when data type changes
      if (action.payload === 'alert') {
        state.selectedScenario = 'mixed';
      } else if (action.payload === 'incident') {
        state.selectedScenario = 'apt_campaign';
      } else if (action.payload === 'asset') {
        state.selectedScenario = 'mixed_assets';
      } else if (action.payload === 'ioc') {
        state.selectedScenario = 'mixed_iocs';
      } else if (action.payload === 'playbook') {
        state.selectedScenario = 'incident_response';
      } else if (action.payload === 'threat_actor') {
        state.selectedScenario = 'mixed';
      } else if (action.payload === 'threat_campaign') {
        state.selectedScenario = 'mixed';
      }
    },
    setSelectedScenario: (state, action: PayloadAction<string>) => {
      state.selectedScenario = action.payload;
    },
    setGenerationProgress: (state, action: PayloadAction<{ progress: number; step: string }>) => {
      state.generationProgress = action.payload.progress;
      state.generationStep = action.payload.step;
    },
    clearGeneratedData: (state) => {
      state.generatedData = [];
      state.fullGeneratedData = [];
      state.generationProgress = 0;
      state.generationStep = '';
      state.generationError = null;
    },
    clearErrors: (state) => {
      state.aiStatusError = null;
      state.generationError = null;
      state.createError = null;
      state.cleanupError = null;
      state.statsError = null;
    },
    clearCreateResult: (state) => {
      state.lastCreateResult = null;
      state.createError = null;
    },
    clearCleanupResult: (state) => {
      state.lastCleanupResult = null;
      state.cleanupError = null;
    },
  },
  extraReducers: (builder) => {
    // AI Status
    builder
      .addCase(checkAIStatus.pending, (state) => {
        state.aiStatusLoading = true;
        state.aiStatusError = null;
      })
      .addCase(checkAIStatus.fulfilled, (state, action) => {
        state.aiStatusLoading = false;
        state.aiStatus = action.payload;
      })
      .addCase(checkAIStatus.rejected, (state, action) => {
        state.aiStatusLoading = false;
        state.aiStatusError = action.error.message || 'Failed to check AI status';
        // Assume AI is disconnected if check fails
        state.aiStatus = {
          connected: false,
          modelAvailable: false,
          error: action.error.message || 'Connection failed',
        };
      });

    // Generate Test Data
    builder
      .addCase(generateTestData.pending, (state, action) => {
        state.isGenerating = true;
        state.generationError = null;
        state.generationProgress = 0;
        state.generationStep = 'Starting generation...';
        state.lastConfig = action.meta.arg;
      })
      .addCase(generateTestData.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedData = action.payload.data || [];
        state.fullGeneratedData = action.payload.fullData || action.payload.data || [];
        state.generationProgress = 100;
        state.generationStep = 'Complete';
      })
      .addCase(generateTestData.rejected, (state, action) => {
        state.isGenerating = false;
        state.generationError = action.error.message || 'Failed to generate test data';
        state.generationProgress = 0;
        state.generationStep = 'Generation failed';
        // Clear any previous data on error
        state.generatedData = [];
        state.fullGeneratedData = [];
      });

    // Create Test Alerts
    builder
      .addCase(createTestAlerts.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestAlerts.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestAlerts.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test alerts';
      });

    // Create Test Incidents
    builder
      .addCase(createTestIncidents.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestIncidents.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestIncidents.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test incidents';
      });

    // Create Test Assets
    builder
      .addCase(createTestAssets.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestAssets.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestAssets.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test assets';
      });

    // Create Test IOCs
    builder
      .addCase(createTestIOCs.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestIOCs.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestIOCs.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test IOCs';
      });

    // Create Test Playbooks
    builder
      .addCase(createTestPlaybooks.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestPlaybooks.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestPlaybooks.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test playbooks';
      });

    // Create Test Threat Actors
    builder
      .addCase(createTestThreatActors.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestThreatActors.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestThreatActors.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test threat actors';
      });

    // Create Test Threat Campaigns
    builder
      .addCase(createTestThreatCampaigns.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTestThreatCampaigns.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreateResult = action.payload;
        // Clear generated data after successful creation
        state.generatedData = [];
        state.fullGeneratedData = [];
        state.showPreviewModal = false;
      })
      .addCase(createTestThreatCampaigns.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.error.message || 'Failed to create test threat campaigns';
      });

    // Fetch Test Data Stats
    builder
      .addCase(fetchTestDataStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchTestDataStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTestDataStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.error.message || 'Failed to fetch test data statistics';
      });

    // Cleanup Test Data
    builder
      .addCase(cleanupTestData.pending, (state) => {
        state.isCleaningUp = true;
        state.cleanupError = null;
      })
      .addCase(cleanupTestData.fulfilled, (state, action) => {
        state.isCleaningUp = false;
        state.lastCleanupResult = action.payload;
        // Refresh stats after cleanup
        state.stats = null;
      })
      .addCase(cleanupTestData.rejected, (state, action) => {
        state.isCleaningUp = false;
        state.cleanupError = action.error.message || 'Failed to cleanup test data';
      });
  },
});

export const {
  setShowPreviewModal,
  setSelectedDataType,
  setSelectedScenario,
  setGenerationProgress,
  clearGeneratedData,
  clearErrors,
  clearCreateResult,
  clearCleanupResult,
} = testDataSlice.actions;

export default testDataSlice.reducer;