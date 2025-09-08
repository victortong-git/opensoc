import React, { useState, useEffect } from 'react';
import { 
  Bot,
  Wifi,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Database,
  Activity,
  Eye,
  EyeOff,
  TestTube2,
  RefreshCw,
  MessageSquare,
  Send,
  Monitor
} from 'lucide-react';
import { aiProviderApi, AIProvider, AIProviderConfig, GlobalSettings, TestMessageResult } from '../services/aiProviderApi';

interface AIProviderPageState {
  config: AIProviderConfig | null;
  isLoading: boolean;
  isTestingConnection: string | null;
  isTestingMessage: string | null;
  unsavedChanges: boolean;
  showAdvancedSettings: boolean;
  error: string | null;
  pendingChanges: { [providerId: string]: Partial<AIProvider> };
  testMessages: { [providerId: string]: string };
  testResponses: { [providerId: string]: TestMessageResult | null };
  testErrors: { [providerId: string]: string | null };
}

const AIProviderPage: React.FC = () => {
  const [state, setState] = useState<AIProviderPageState>({
    config: null,
    isLoading: true,
    isTestingConnection: null,
    isTestingMessage: null,
    unsavedChanges: false,
    showAdvancedSettings: false,
    error: null,
    pendingChanges: {},
    testMessages: {},
    testResponses: {},
    testErrors: {},
  });

  const [stats, setStats] = useState({
    totalProviders: 0,
    enabledProviders: 0,
    connectedProviders: 0,
    avgResponseTime: 0,
    availableModels: 0,
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await loadProviders();
      await loadStats();
    };
    loadInitialData();
  }, []);

  const loadProviders = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const data = await aiProviderApi.getProviders();
      
      // Initialize test messages with "Hello" for each provider
      const testMessages: { [key: string]: string } = {};
      data.providers.forEach(provider => {
        testMessages[provider.id] = 'Hello';
      });
      
      setState(prev => ({ 
        ...prev, 
        config: data, 
        isLoading: false,
        testMessages: { ...prev.testMessages, ...testMessages }
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to load AI providers', 
        isLoading: false 
      }));
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await aiProviderApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const updateProviderLocal = (providerId: string, updates: Partial<AIProvider>) => {
    setState(prev => ({
      ...prev,
      unsavedChanges: true,
      pendingChanges: {
        ...prev.pendingChanges,
        [providerId]: {
          ...prev.pendingChanges[providerId],
          ...updates
        }
      },
      config: prev.config ? {
        ...prev.config,
        providers: prev.config.providers.map(p => 
          p.id === providerId ? { ...p, ...prev.pendingChanges[providerId], ...updates } : p
        )
      } : null
    }));
  };

  const saveProviderChanges = async (providerId: string) => {
    if (!state.config || !state.pendingChanges[providerId]) return;
    
    try {
      const updates = state.pendingChanges[providerId];
      const response = await aiProviderApi.updateProvider(providerId, updates);
      
      setState(prev => ({
        ...prev,
        config: prev.config ? {
          ...prev.config,
          providers: prev.config.providers.map(p => 
            p.id === providerId ? { ...p, ...response.provider } : p
          )
        } : null,
        pendingChanges: {
          ...prev.pendingChanges,
          [providerId]: {}
        },
        unsavedChanges: Object.keys(prev.pendingChanges).some(id => 
          id !== providerId && Object.keys(prev.pendingChanges[id] || {}).length > 0
        ),
        error: null
      }));

      // Only reload stats if there were actual changes that affect stats
      if (updates.isEnabled !== undefined || updates.isConnected !== undefined) {
        await loadStats();
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update provider'
      }));
    }
  };

  const updateProvider = async (providerId: string, updates: Partial<AIProvider>) => {
    if (!state.config) return;
    
    try {
      const response = await aiProviderApi.updateProvider(providerId, updates);
      
      setState(prev => ({
        ...prev,
        config: prev.config ? {
          ...prev.config,
          providers: prev.config.providers.map(p => 
            p.id === providerId ? { ...p, ...response.provider } : p
          )
        } : null,
        unsavedChanges: false
      }));

      await loadStats();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update provider'
      }));
    }
  };

  const updateGlobalSettings = async (updates: GlobalSettings) => {
    if (!state.config) return;
    
    try {
      await aiProviderApi.updateGlobalSettings(updates);
      
      setState(prev => ({
        ...prev,
        config: prev.config ? {
          ...prev.config,
          globalSettings: { ...prev.config.globalSettings, ...updates }
        } : null,
        unsavedChanges: false
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update global settings'
      }));
    }
  };

  const setActiveProvider = async (providerId: string) => {
    try {
      await aiProviderApi.setActiveProvider(providerId);
      
      setState(prev => ({
        ...prev,
        config: prev.config ? {
          ...prev.config,
          activeProviderId: providerId
        } : null
      }));

      // Always update stats when changing active provider
      await loadStats();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to set active provider'
      }));
    }
  };

  const testConnection = async (providerId: string) => {
    setState(prev => ({ ...prev, isTestingConnection: providerId }));
    
    try {
      const response = await aiProviderApi.testConnection(providerId);
      
      setState(prev => ({
        ...prev,
        config: prev.config ? {
          ...prev.config,
          providers: prev.config.providers.map(p => 
            p.id === providerId ? { ...p, ...response.provider } : p
          )
        } : null,
        isTestingConnection: null
      }));

      // Always update stats after connection test
      await loadStats();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Connection test failed',
        isTestingConnection: null
      }));
    }
  };

  const updateTestMessage = (providerId: string, message: string) => {
    setState(prev => ({
      ...prev,
      testMessages: {
        ...prev.testMessages,
        [providerId]: message
      }
    }));
  };

  const testMessage = async (providerId: string) => {
    const message = state.testMessages[providerId] || 'Hello';
    setState(prev => ({ ...prev, isTestingMessage: providerId, testErrors: { ...prev.testErrors, [providerId]: null } }));
    
    try {
      const response = await aiProviderApi.testMessage(providerId, message);
      
      setState(prev => ({
        ...prev,
        testResponses: {
          ...prev.testResponses,
          [providerId]: response.result
        },
        isTestingMessage: null
      }));

      // Update stats if connection status changed
      await loadStats();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        testErrors: {
          ...prev.testErrors,
          [providerId]: error.message || 'Message test failed'
        },
        isTestingMessage: null
      }));
    }
  };

  const getDefaultPort = (type: 'ollama' | 'vllm' | 'lmstudio'): number => {
    if (type === 'ollama') return 11434;
    if (type === 'lmstudio') return 1234;
    return 8000; // vllm and others
  };

  const getProviderIcon = (type: 'ollama' | 'vllm' | 'lmstudio') => {
    if (type === 'ollama') {
      return <Bot className="h-5 w-5 text-blue-400" />;
    } else if (type === 'lmstudio') {
      return <Monitor className="h-5 w-5 text-green-400" />;
    } else {
      return <Zap className="h-5 w-5 text-purple-400" />; // vllm
    }
  };

  const getConnectionStatus = (provider: AIProvider) => {
    if (!provider.isEnabled) {
      return { icon: <XCircle className="h-4 w-4 text-gray-400" />, text: 'Disabled', color: 'text-gray-400' };
    }
    if (provider.isConnected) {
      return { icon: <CheckCircle className="h-4 w-4 text-green-400" />, text: 'Connected', color: 'text-green-400' };
    }
    return { icon: <AlertTriangle className="h-4 w-4 text-red-400" />, text: 'Disconnected', color: 'text-red-400' };
  };

  const formatLastHealthCheck = (date: Date | string | null): string => {
    if (!date) return 'Never';
    
    const healthCheckDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - healthCheckDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-opensoc-400" />
        <span className="ml-3 text-lg">Loading AI providers...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-red-200 font-medium">Error</p>
            <p className="text-red-300 text-sm">{state.error}</p>
          </div>
          <button 
            onClick={loadProviders}
            className="btn-primary text-sm py-1 px-3"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state.config) {
    return null;
  }

  const activeProvider = state.config.providers.find(p => p.id === state.config?.activeProviderId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Provider Configuration</h1>
          <p className="text-slate-400 mt-2">
            Configure AI providers for security analysis and automation
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Provider</p>
              <p className="text-xl font-bold text-white">
                {activeProvider?.name || 'None'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Connected</p>
              <p className="text-xl font-bold text-white">
                {stats.connectedProviders}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Wifi className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg Response</p>
              <p className="text-xl font-bold text-white">
                {stats.avgResponseTime}ms
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Available Models</p>
              <p className="text-xl font-bold text-white">{stats.availableModels}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Provider Configurations */}
      <div className="space-y-6">
        {state.config.providers.map((provider) => {
          const status = getConnectionStatus(provider);
          
          return (
            <div key={provider.id} className="card">
              <div className="space-y-6">
                {/* Provider Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-soc-dark-700 rounded-lg flex items-center justify-center">
                      {getProviderIcon(provider.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                        <span className="px-2 py-1 bg-soc-dark-700 text-xs text-slate-300 rounded uppercase">
                          {provider.type}
                        </span>
                        {state.config?.activeProviderId === provider.id && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{provider.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {status.icon}
                      <span className={`text-sm ${status.color}`}>{status.text}</span>
                    </div>
                    
                    <button
                      onClick={() => testConnection(provider.id)}
                      disabled={state.isTestingConnection === provider.id}
                      className="btn-secondary text-sm flex items-center space-x-2"
                    >
                      {state.isTestingConnection === provider.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <TestTube2 className="h-4 w-4" />
                          <span>Test</span>
                        </>
                      )}
                    </button>

                    {!provider.isEnabled ? (
                      <button
                        onClick={() => updateProvider(provider.id, { isEnabled: true })}
                        className="btn-primary text-sm"
                      >
                        Enable
                      </button>
                    ) : state.config?.activeProviderId !== provider.id ? (
                      <button
                        onClick={() => setActiveProvider(provider.id)}
                        className="btn-primary text-sm"
                      >
                        Set Active
                      </button>
                    ) : (
                      <button
                        onClick={() => updateProvider(provider.id, { isEnabled: false })}
                        className="btn-secondary text-sm"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>

                {/* Connection Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Connection Status</p>
                    <div className="flex items-center space-x-2">
                      {status.icon}
                      <span className={status.color}>{status.text}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Last Health Check</p>
                    <p className="text-white">{formatLastHealthCheck(provider.lastHealthCheck)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Response Time</p>
                    <p className="text-white">
                      {provider.isConnected ? `${provider.responseTime}ms` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Selected Model</p>
                    <p className="text-white">{provider.selectedModel}</p>
                  </div>
                </div>

                {/* AI Response Test Section */}
                <div className="border-t border-soc-dark-700 pt-6">
                  <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-opensoc-400" />
                    <span>Test AI Response</span>
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={state.testMessages[provider.id] || 'Hello'}
                        onChange={(e) => updateTestMessage(provider.id, e.target.value)}
                        placeholder="Enter test message..."
                        className="input-field flex-1"
                        disabled={state.isTestingMessage === provider.id}
                      />
                      <button
                        onClick={() => testMessage(provider.id)}
                        disabled={state.isTestingMessage === provider.id || !provider.isEnabled}
                        className="btn-primary flex items-center space-x-2 whitespace-nowrap"
                      >
                        {state.isTestingMessage === provider.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Test</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Test Response Display */}
                    {state.testResponses[provider.id] && (
                      <div className="space-y-3">
                        <div className="bg-soc-dark-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Response:</span>
                            <div className="flex items-center space-x-4 text-xs text-slate-400">
                              <span>{state.testResponses[provider.id]?.responseTime}ms</span>
                              {state.testResponses[provider.id]?.success ? (
                                <span className="text-green-400 flex items-center space-x-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Success</span>
                                </span>
                              ) : (
                                <span className="text-red-400 flex items-center space-x-1">
                                  <XCircle className="h-3 w-3" />
                                  <span>Failed</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {state.testResponses[provider.id]?.success ? (
                            <p className="text-white text-sm whitespace-pre-wrap">
                              {state.testResponses[provider.id]?.response}
                            </p>
                          ) : (
                            <p className="text-red-300 text-sm">
                              {state.testResponses[provider.id]?.error || 'Test failed'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Test Error Display */}
                    {state.testErrors[provider.id] && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <span className="text-red-300 text-sm">{state.testErrors[provider.id]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Connection Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Host/IP Address</label>
                        <input
                          type="text"
                          value={provider.host}
                          onChange={(e) => updateProviderLocal(provider.id, { host: e.target.value })}
                          placeholder="localhost"
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          Port (Default: {getDefaultPort(provider.type)})
                        </label>
                        <input
                          type="number"
                          value={provider.port}
                          onChange={(e) => updateProviderLocal(provider.id, { port: parseInt(e.target.value) || getDefaultPort(provider.type) })}
                          placeholder={getDefaultPort(provider.type).toString()}
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">AI Model</label>
                      <select
                        value={provider.selectedModel}
                        onChange={(e) => updateProviderLocal(provider.id, { selectedModel: e.target.value })}
                        className="input-field w-full"
                      >
                        {provider.availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Model Parameters</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Max Output Tokens</label>
                        <input
                          type="number"
                          value={provider.maxTokens}
                          onChange={(e) => updateProviderLocal(provider.id, { maxTokens: parseInt(e.target.value) || 4096 })}
                          min="1024"
                          max="32768"
                          step="512"
                          className="input-field w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Max Token Window</label>
                        <input
                          type="number"
                          value={provider.maxTokenWindow}
                          onChange={(e) => updateProviderLocal(provider.id, { maxTokenWindow: parseInt(e.target.value) || 8192 })}
                          min="2048"
                          max="65536"
                          step="1024"
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Temperature ({provider.temperature})
                      </label>
                      <input
                        type="range"
                        value={provider.temperature}
                        onChange={(e) => updateProviderLocal(provider.id, { temperature: parseFloat(e.target.value) })}
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full h-2 bg-soc-dark-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Focused</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Provider Description</label>
                      <textarea
                        value={provider.description}
                        onChange={(e) => updateProviderLocal(provider.id, { description: e.target.value })}
                        className="input-field w-full h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Save Button */}
                {state.pendingChanges[provider.id] && Object.keys(state.pendingChanges[provider.id] || {}).length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-soc-dark-700">
                    <button
                      onClick={() => saveProviderChanges(provider.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Settings */}
      <div className="card">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Global Settings</h3>
            <button
              onClick={() => setState(prev => ({ ...prev, showAdvancedSettings: !prev.showAdvancedSettings }))}
              className="text-opensoc-400 hover:text-opensoc-300 flex items-center space-x-2"
            >
              {state.showAdvancedSettings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{state.showAdvancedSettings ? 'Hide' : 'Show'} Advanced</span>
            </button>
          </div>

          {state.showAdvancedSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">Connection Settings</h4>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">AI Generation Timeout (seconds)</label>
                  <input
                    type="number"
                    value={state.config.globalSettings.timeout}
                    onChange={(e) => updateGlobalSettings({ timeout: parseInt(e.target.value) || 300 })}
                    min="30"
                    max="900"
                    className="input-field w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Recommended: 300s (Fast GPU), 600s (Slow GPU), 900s (CPU only)
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Retry Attempts</label>
                  <input
                    type="number"
                    value={state.config.globalSettings.retryAttempts}
                    onChange={(e) => updateGlobalSettings({ retryAttempts: parseInt(e.target.value) || 3 })}
                    min="1"
                    max="10"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Health Check Interval (seconds)</label>
                  <input
                    type="number"
                    value={state.config.globalSettings.healthCheckInterval}
                    onChange={(e) => updateGlobalSettings({ healthCheckInterval: parseInt(e.target.value) || 300 })}
                    min="60"
                    max="3600"
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">Monitoring & Logging</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableLogging"
                      checked={state.config.globalSettings.enableLogging}
                      onChange={(e) => updateGlobalSettings({ enableLogging: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="enableLogging" className="text-slate-300 text-sm">
                      Enable request/response logging
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableMetrics"
                      checked={state.config.globalSettings.enableMetrics}
                      onChange={(e) => updateGlobalSettings({ enableMetrics: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="enableMetrics" className="text-slate-300 text-sm">
                      Enable performance metrics collection
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIProviderPage;