import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import dashboardSlice from './dashboardSlice';
import alertsSlice from './alertsSlice';
import incidentsSlice from './incidentsSlice';
import assetsSlice from './assetsSlice';
import analyticsSlice from './analyticsSlice';
import usersSlice from './usersSlice';
import threatIntelSlice from './threatIntelSlice';
import aiAgentsSlice from './aiAgentsSlice';
import playbooksSlice from './playbooksSlice';
import settingsSlice from './settingsSlice';
import testDataSlice from './testDataSlice';
import chatSlice from './chatSlice';
import embeddingSlice from './embeddingSlice';
import searchSlice from './searchSlice';
import logAnalyzerSlice from './logAnalyzerSlice';
import threatHuntingSlice from './threatHuntingSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    alerts: alertsSlice,
    incidents: incidentsSlice,
    assets: assetsSlice,
    analytics: analyticsSlice,
    users: usersSlice,
    threatIntel: threatIntelSlice,
    aiAgents: aiAgentsSlice,
    playbooks: playbooksSlice,
    settings: settingsSlice,
    testData: testDataSlice,
    chat: chatSlice,
    embedding: embeddingSlice,
    search: searchSlice,
    logAnalyzer: logAnalyzerSlice,
    threatHunting: threatHuntingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredActionsPaths: ['payload.eventTime', 'payload.createdAt', 'payload.updatedAt', 'payload.lastSeen', 'payload.resolvedAt', 'payload.lastUpdated', 'payload.timestamp', 'payload.lastActivity'],
        ignoredPaths: ['dashboard.recentEvents', 'alerts.alerts', 'incidents.incidents', 'assets.assets', 'aiAgents.agents', 'aiAgents.activities', 'playbooks.playbooks', 'settings.systemSettings', 'settings.alertRules', 'testData.generatedData', 'testData.fullGeneratedData', 'chat.messages', 'chat.conversations', 'chat.stats', 'chat.lastUpdated', 'embedding.stats', 'embedding.lastUpdated', 'search.results', 'search.quickResults', 'logAnalyzer.files', 'logAnalyzer.fileLines', 'logAnalyzer.selectedFile', 'threatHunting.events', 'threatHunting.selectedEvent', 'threatHunting.stats'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;