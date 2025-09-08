import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { initializeAuth } from './store/authSlice';
import authService from './services/authService';
import { Toaster } from './services/toastService';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import AssetsPage from './pages/AssetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import AIAgentsPage from './pages/AIAgentsPage';
import PlaybooksPage from './pages/PlaybooksPage';
import AIProviderPage from './pages/AIProviderPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import TestDataPage from './pages/TestDataPage';
import AIGenerationLogsPage from './pages/AIGenerationLogsPage';
import TextEmbeddingPage from './pages/TextEmbeddingPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import ProfilePage from './pages/ProfilePage';
import AlertDetailsPage from './pages/AlertDetailsPage';
import IncidentDetailsPage from './pages/IncidentDetailsPage';
import AssetDetailsPage from './pages/AssetDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import IntegrationHelpPage from './pages/IntegrationHelpPage';
import SearchPage from './pages/SearchPage';
import AgentProfilePage from './pages/AgentProfilePage';
import LogAnalyzerPage from './pages/LogAnalyzerPage';
import LogLinesPage from './pages/LogLinesPage';
import LLMLogsPage from './pages/LLMLogsPage';
import ThreatHuntingPage from './pages/ThreatHuntingPage';
import ThreatHuntCreatePage from './pages/ThreatHuntCreatePage';
import IOCDetailsPage from './pages/IOCDetailsPage';
import MitreAttackPage from './pages/MitreAttackPage';
import OrchestrationNATPage from './pages/OrchestrationNATPage';
import OrchestrationMCPPage from './pages/OrchestrationMCPPage';
import FineTuningDataExportPage from './pages/FineTuningDataExportPage';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const initializeApp = async () => {
      // Check for existing authentication
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getProfile();
          dispatch(initializeAuth(user));
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // If user profile fails but token is valid, try to get user from localStorage directly
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              // Convert to expected User format
              const user = {
                id: parsedUser.id,
                username: parsedUser.username,
                email: parsedUser.email,
                firstName: parsedUser.firstName,
                lastName: parsedUser.lastName,
                role: parsedUser.role,
                avatar: `https://ui-avatars.com/api/?name=${parsedUser.firstName}+${parsedUser.lastName}&background=0ea5e9&color=fff`,
                isActive: true,
                lastLogin: new Date().toISOString(),
                organizationId: parsedUser.organizationId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              dispatch(initializeAuth(user));
            } catch (parseError) {
              console.error('Failed to parse stored user:', parseError);
            }
          }
        }
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="opensoc-theme">
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="h-screen bg-white dark:bg-soc-dark-950 transition-colors duration-200">
          <Toaster />
          <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AlertsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alerts/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AlertDetailsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/incidents" 
            element={
              <ProtectedRoute>
                <Layout>
                  <IncidentsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/incidents/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <IncidentDetailsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assets" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AssetsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assets/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AssetDetailsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/threat-hunting" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ThreatHuntingPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/threat-hunting/create" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ThreatHuntCreatePage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/threat-hunting/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ThreatHuntCreatePage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mitre" 
            element={
              <ProtectedRoute>
                <Layout>
                  <MitreAttackPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orchestration/nat-server" 
            element={
              <ProtectedRoute>
                <Layout>
                  <OrchestrationNATPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orchestration/nat-mcp" 
            element={
              <ProtectedRoute>
                <Layout>
                  <OrchestrationMCPPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Feature pages */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/threat-intel" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ThreatIntelPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/threat-intel/iocs/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <IOCDetailsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-agents" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AIAgentsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-agents/:agentName" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AgentProfilePage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/playbooks" 
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaybooksPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-provider" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AIProviderPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-data" 
            element={
              <ProtectedRoute>
                <Layout>
                  <TestDataPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-generation-logs" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AIGenerationLogsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/text-embedding" 
            element={
              <ProtectedRoute>
                <Layout>
                  <TextEmbeddingPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat-history" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatHistoryPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Layout>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/integration" 
            element={
              <ProtectedRoute>
                <Layout>
                  <IntegrationHelpPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <Layout>
                  <SearchPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/log-analyzer" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LogAnalyzerPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/log-analyzer/:fileId/lines" 
            element={
              <ProtectedRoute>
                <LogLinesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/llm-logs" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LLMLogsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-tools/ai-model-fine-tuning" 
            element={
              <ProtectedRoute>
                <Layout>
                  <FineTuningDataExportPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          {/* Redirect old path for compatibility */}
          <Route 
            path="/ai-tools/fine-tuning-export" 
            element={<Navigate to="/ai-tools/ai-model-fine-tuning" replace />}
          />
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};


export default App;