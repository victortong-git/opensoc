import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
  Settings,
  Bell,
  Shield,
  Database,
  Slack,
  Globe,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Pause,
  Play,
  Loader2,
  Palette,
  Trash,
  AlertCircle,
  Key,
  Copy,
  RefreshCw,
  ExternalLink,
  FileText
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import {
  fetchSystemSettings,
  fetchAlertRules,
  fetchSettingsStats,
  fetchDataCounts,
  clearData,
  updateSystemSetting,
  deleteAlertRule,
  toggleAlertRule,
  setSelectedSetting,
  setSelectedAlertRule,
  setShowCreateAlertRuleModal,
  setShowEditAlertRuleModal,
  setShowEditSettingModal,
} from '../store/settingsSlice';
import ThemeToggle from '../components/common/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import apiKeysService, { ApiKey, CreateApiKeyRequest } from '../services/apiKeysService';

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: (id: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-opensoc-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showFullKey, setShowFullKey] = useState<string | null>(null); // Track which key to show in full
  const [showRegenerateModal, setShowRegenerateModal] = useState<string | null>(null); // Track which key to regenerate
  const [showTestScript, setShowTestScript] = useState<string | null>(null); // Track which key's test script to show
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null); // Track which key is being edited
  const [editApiKeyName, setEditApiKeyName] = useState<string>(''); // Store the edited name

  const {
    systemSettings,
    systemSettingsLoading,
    systemSettingsError,
    alertRules,
    alertRulesLoading,
    alertRulesError,
    alertRulesPagination,
    stats,
    statsLoading,
    dataCounts,
    dataCountsLoading,
    dataCountsError,
    clearDataLoading,
    clearDataError,
  } = useSelector((state: RootState) => state.settings);

  // Refresh all settings data
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        dispatch(fetchSystemSettings()),
        dispatch(fetchAlertRules()),
        dispatch(fetchSettingsStats())
      ]);
      
      if (activeTab === 'cleardata') {
        await dispatch(fetchDataCounts());
      }
      if (activeTab === 'apikeys') {
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation state to set active tab
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      // Clear the state to prevent persisting across navigation
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    dispatch(fetchSystemSettings());
    dispatch(fetchAlertRules());
    dispatch(fetchSettingsStats());
    if (activeTab === 'cleardata') {
      dispatch(fetchDataCounts());
    }
    if (activeTab === 'apikeys') {
      fetchApiKeys();
    }
  }, [dispatch, activeTab]);

  // API Keys functions
  const fetchApiKeys = async () => {
    setApiKeysLoading(true);
    setApiKeysError(null);
    try {
      const response = await apiKeysService.getApiKeys();
      setApiKeys(response.apiKeys);
    } catch (error: any) {
      // Handle permission denied errors specifically
      if (error.response?.status === 403 && error.response?.data?.message?.includes('Required roles')) {
        setApiKeysError('Access denied: Only administrators can manage API keys. Please contact your system administrator.');
      } else {
        setApiKeysError(error.response?.data?.message || 'Failed to load API keys');
      }
      console.error('Error fetching API keys:', error);
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) return;
    
    setApiKeysLoading(true);
    try {
      const response = await apiKeysService.createApiKey({
        name: newApiKeyName.trim(),
        permissions: ['create_alerts']
      });
      
      setShowApiKey(response.apiKey.key);
      setApiKeys([response.apiKey]);
      setNewApiKeyName('');
      setShowCreateApiKeyModal(false);
      
      alert('API key created successfully! Please copy and save it securely.');
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('Required roles')) {
        setApiKeysError('Access denied: Only administrators can manage API keys.');
      } else {
        setApiKeysError(error.response?.data?.message || 'Failed to create API key');
      }
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleDeactivateApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this API key? This action cannot be undone.')) return;
    
    try {
      await apiKeysService.deactivateApiKey(id);
      setApiKeys(apiKeys.filter(key => key.id !== id));
      alert('API key deactivated successfully');
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('Required roles')) {
        alert('Access denied: Only administrators can manage API keys.');
      } else {
        alert(error.response?.data?.message || 'Failed to deactivate API key');
      }
    }
  };

  const handleRegenerateApiKey = async (id: string) => {
    setApiKeysLoading(true);
    try {
      const response = await apiKeysService.regenerateApiKey(id);
      
      // Update the API key in the list
      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, keyPrefix: response.apiKey.keyPrefix } : key
      ));
      
      // Show the new key temporarily
      setShowApiKey(response.apiKey.key);
      setShowFullKey(id); // Auto-show the regenerated key
      setShowRegenerateModal(null);
      
      alert('API key regenerated successfully! Please copy and save the new key securely.');
      
      // Auto-hide the key after 30 seconds for security
      setTimeout(() => {
        setShowFullKey(null);
      }, 30000);
      
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('Required roles')) {
        setApiKeysError('Access denied: Only administrators can manage API keys.');
      } else {
        setApiKeysError(error.response?.data?.message || 'Failed to regenerate API key');
      }
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleUpdateApiKeyName = async (id: string) => {
    if (!editApiKeyName.trim()) {
      setEditingApiKey(null);
      return;
    }
    
    setApiKeysLoading(true);
    try {
      const response = await apiKeysService.updateApiKey(id, { name: editApiKeyName.trim() });
      
      // Update the API key in the list
      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, name: response.apiKey.name } : key
      ));
      
      setEditingApiKey(null);
      setEditApiKeyName('');
      alert('API key name updated successfully');
      
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('Required roles')) {
        setApiKeysError('Access denied: Only administrators can manage API keys.');
      } else {
        setApiKeysError(error.response?.data?.message || 'Failed to update API key name');
      }
    } finally {
      setApiKeysLoading(false);
    }
  };

  const startEditingApiKey = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey.id);
    setEditApiKeyName(apiKey.name);
  };

  const cancelEditingApiKey = () => {
    setEditingApiKey(null);
    setEditApiKeyName('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const handleUpdateSetting = (settingId: string, newValue: any) => {
    dispatch(updateSystemSetting({ id: settingId, data: { value: newValue } }));
  };

  const handleDeleteAlertRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      dispatch(deleteAlertRule(ruleId));
    }
  };

  const handleToggleAlertRule = (ruleId: string) => {
    dispatch(toggleAlertRule(ruleId));
  };

  const handleCreateAlertRule = () => {
    dispatch(setShowCreateAlertRuleModal(true));
  };

  const handleEditAlertRule = (rule: any) => {
    dispatch(setSelectedAlertRule(rule));
    dispatch(setShowEditAlertRuleModal(true));
  };

  const handleEditSetting = (setting: any) => {
    dispatch(setSelectedSetting(setting));
    dispatch(setShowEditSettingModal(true));
  };

  const saveChanges = () => {
    // This is handled automatically by the updateSystemSetting action
    setUnsavedChanges(false);
  };

  const resetChanges = () => {
    // Refetch settings to reset to server state
    dispatch(fetchSystemSettings());
    setUnsavedChanges(false);
  };

  const handleClearData = async (type: 'alerts' | 'incidents' | 'assets' | 'threatintel' | 'playbooks' | 'notifications') => {
    const dataTypeNames: { [key: string]: string } = {
      alerts: 'Alerts with Timeline Events',
      incidents: 'Incidents with Timeline Events',
      assets: 'Assets',
      threatintel: 'Threat Intelligence',
      playbooks: 'Playbooks',
      notifications: 'Notifications'
    };

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete all ${dataTypeNames[type]}?\n\n` +
      'This action cannot be undone and will remove all related data from your organization.'
    );

    if (confirmed) {
      try {
        await dispatch(clearData(type)).unwrap();
        // Refetch data counts after successful clear
        dispatch(fetchDataCounts());
        alert(`Successfully cleared ${dataTypeNames[type]}`);
      } catch (error) {
        console.error('Error clearing data:', error);
        alert(`Failed to clear ${dataTypeNames[type]}. Please try again.`);
      }
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/20';
      case 1: return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'alerts', label: 'Alert Rules', icon: AlertTriangle },
    { id: 'apikeys', label: 'API Keys', icon: Key },
    { id: 'cleardata', label: 'Clear Data', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-slate-400 mt-2">
            Configure system behavior, security policies, and integrations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {unsavedChanges && (
            <>
              <button onClick={resetChanges} className="btn-secondary">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
              <button onClick={saveChanges} className="btn-primary">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </>
          )}
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {unsavedChanges && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="flex-1">
              <p className="text-yellow-200 font-medium">Unsaved Changes</p>
              <p className="text-yellow-300 text-sm">You have unsaved configuration changes. Don't forget to save them.</p>
            </div>
            <button onClick={saveChanges} className="btn-primary text-sm py-1 px-3">
              Save Now
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="flex space-x-6">
        <div className="w-64 space-y-2">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {systemSettingsLoading ? (
                <div className="card flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-opensoc-500" />
                  <span className="ml-2 text-slate-400">Loading settings...</span>
                </div>
              ) : systemSettingsError ? (
                <div className="card bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400">Error loading settings: {systemSettingsError}</p>
                </div>
              ) : (
                <>
                  <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
                    <div className="space-y-4">
                      {systemSettings.filter(s => s.category === 'System').map(setting => (
                        <div key={setting.id} className="flex items-center justify-between py-3">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{setting.name}</h4>
                            <p className="text-slate-400 text-sm">{setting.description}</p>
                          </div>
                          <div className="w-48">
                            {setting.type === 'boolean' ? (
                              <button
                                onClick={() => handleUpdateSetting(setting.id, !setting.value)}
                                disabled={!setting.isEditable}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  setting.value ? 'bg-opensoc-600' : 'bg-gray-600'
                                } ${!setting.isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    setting.value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            ) : (
                              <input
                                type={setting.type === 'number' ? 'number' : 'text'}
                                value={setting.value}
                                onChange={(e) => handleUpdateSetting(setting.id, setting.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                                disabled={!setting.isEditable}
                                className="input-field w-full"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Data Retention</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Alert Retention (days)</label>
                    <input type="number" defaultValue={90} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Log Retention (days)</label>
                    <input type="number" defaultValue={365} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Incident Retention (days)</label>
                    <input type="number" defaultValue={730} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Audit Log Retention (days)</label>
                    <input type="number" defaultValue={2555} className="input-field w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Settings */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Theme Preferences</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">Color Theme</h4>
                    <p className="text-slate-400 text-sm mb-4">
                      Choose your preferred color theme. System setting will follow your operating system's theme.
                    </p>
                    <ThemeToggle variant="dropdown" className="w-full max-w-sm" />
                  </div>

                  <div className="border-t border-soc-dark-700 pt-6">
                    <h4 className="text-white font-medium mb-3">Theme Preview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Light Theme Preview */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                          <div className="h-2 bg-opensoc-200 rounded w-2/3"></div>
                        </div>
                        <div className="mt-3 text-xs text-gray-600 font-medium">Light Theme</div>
                      </div>

                      {/* Dark Theme Preview */}
                      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-soc-dark-700 rounded-full"></div>
                          <div className="w-3 h-3 bg-soc-dark-600 rounded-full"></div>
                          <div className="w-3 h-3 bg-soc-dark-500 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 bg-soc-dark-700 rounded w-3/4"></div>
                          <div className="h-2 bg-soc-dark-600 rounded w-1/2"></div>
                          <div className="h-2 bg-opensoc-600 rounded w-2/3"></div>
                        </div>
                        <div className="mt-3 text-xs text-slate-400 font-medium">Dark Theme</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Compact Mode</h4>
                      <p className="text-slate-400 text-sm">Reduce spacing and padding for a more condensed view</p>
                    </div>
                    <div className="w-48">
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-600"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">High Contrast</h4>
                      <p className="text-slate-400 text-sm">Increase contrast for better accessibility</p>
                    </div>
                    <div className="w-48">
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-600"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Animations</h4>
                      <p className="text-slate-400 text-sm">Enable smooth transitions and animations</p>
                    </div>
                    <div className="w-48">
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-opensoc-600"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {systemSettings.filter(s => s.category === 'Notifications').map(setting => (
                    <div key={setting.id} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{setting.name}</h4>
                        <p className="text-slate-400 text-sm">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSetting(setting.id, !setting.value)}
                        disabled={!setting.isEditable}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.value ? 'bg-opensoc-600' : 'bg-gray-600'
                        } ${!setting.isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            setting.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-soc-dark-700">
                  <h4 className="text-white font-medium mb-4">Email Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">SMTP Server</label>
                      <input type="text" defaultValue="smtp.company.com" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">SMTP Port</label>
                      <input type="number" defaultValue={587} className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Username</label>
                      <input type="text" defaultValue="notifications@company.com" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">From Address</label>
                      <input type="email" defaultValue="opensoc@company.com" className="input-field w-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Slack Integration</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Slack className="h-6 w-6 text-slate-400" />
                    <div>
                      <p className="text-white">Slack Webhook</p>
                      <p className="text-slate-400 text-sm">Send alerts to Slack channels</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Webhook URL</label>
                    <input 
                      type="text" 
                      defaultValue="https://hooks.slack.com/services/..." 
                      className="input-field w-full font-mono text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Default Channel</label>
                    <input type="text" defaultValue="#security-alerts" className="input-field w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Authentication & Access</h3>
                <div className="space-y-4">
                  {systemSettings.filter(s => s.category === 'Security').map(setting => (
                    <div key={setting.id} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium">{setting.name}</h4>
                          {!setting.isEditable && <Shield className="h-4 w-4 text-yellow-400" />}
                        </div>
                        <p className="text-slate-400 text-sm">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSetting(setting.id, !setting.value)}
                        disabled={!setting.isEditable}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.value ? 'bg-opensoc-600' : 'bg-gray-600'
                        } ${!setting.isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            setting.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Password Policy</h3>
                  <button
                    onClick={() => setShowPasswordSettings(!showPasswordSettings)}
                    className="text-opensoc-400 hover:text-opensoc-300 text-sm"
                  >
                    {showPasswordSettings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {showPasswordSettings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Minimum Length</label>
                      <input type="number" defaultValue={12} className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Password Expiry (days)</label>
                      <input type="number" defaultValue={90} className="input-field w-full" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-slate-300 text-sm">Require uppercase letters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-slate-300 text-sm">Require numbers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-slate-300 text-sm">Require special characters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-slate-300 text-sm">Prevent password reuse</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Session Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Session Timeout (minutes)</label>
                    <input type="number" defaultValue={60} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Max Concurrent Sessions</label>
                    <input type="number" defaultValue={3} className="input-field w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Alert Rules {alertRulesLoading ? '(Loading...)' : `(${alertRulesPagination.totalItems})`}
                </h3>
                <button className="btn-primary" onClick={handleCreateAlertRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </button>
              </div>

              {alertRulesLoading ? (
                <div className="card flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-opensoc-500" />
                  <span className="ml-2 text-slate-400">Loading alert rules...</span>
                </div>
              ) : alertRulesError ? (
                <div className="card bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400">Error loading alert rules: {alertRulesError}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="card hover:bg-soc-dark-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(rule.severity)}`}>
                              SEV {rule.severity}
                            </div>
                            {rule.isEnabled ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <Pause className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium">{rule.name}</h4>
                            <p className="text-slate-400 text-sm">{rule.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-slate-500">Category: {rule.category}</span>
                              <span className="text-xs text-slate-500">{rule.conditions.length} conditions</span>
                              <span className="text-xs text-slate-500">{rule.actions.length} actions</span>
                              <span className="text-xs text-slate-500">Triggered: {rule.triggerCount} times</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-soc-dark-700 rounded"
                            onClick={() => handleEditAlertRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-soc-dark-700 rounded"
                            onClick={() => handleDeleteAlertRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-soc-dark-700 rounded"
                            onClick={() => handleToggleAlertRule(rule.id)}
                          >
                            {rule.isEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cleardata' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Clear Data</h3>
                  <p className="text-slate-400 text-sm">Permanently delete data by category. This action cannot be undone.</p>
                </div>
              </div>

              {clearDataError && (
                <div className="card bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400">Error: {clearDataError}</p>
                </div>
              )}

              {dataCountsLoading ? (
                <div className="card flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-opensoc-500" />
                  <span className="ml-2 text-slate-400">Loading data counts...</span>
                </div>
              ) : dataCountsError ? (
                <div className="card bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400">Error loading data counts: {dataCountsError}</p>
                  <p className="text-red-300 text-sm mt-2">
                    This feature requires admin privileges. Please ensure you're logged in as an admin user.
                  </p>
                </div>
              ) : dataCounts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Alerts with Timeline Events */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Alerts</h4>
                          <p className="text-slate-400 text-sm">Including timeline events</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1">
                        {dataCounts.dataCounts.alerts.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        {dataCounts.dataCounts.alerts.alerts} alerts, {dataCounts.dataCounts.alerts.timelineEvents} events
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearData('alerts')}
                      disabled={clearDataLoading.alerts || dataCounts.dataCounts.alerts.total === 0}
                      className="btn-secondary text-red-400 hover:text-red-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearDataLoading.alerts ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Alerts
                        </>
                      )}
                    </button>
                  </div>

                  {/* Incidents with Timeline Events */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Incidents</h4>
                          <p className="text-slate-400 text-sm">Including timeline events</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1">
                        {dataCounts.dataCounts.incidents.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        {dataCounts.dataCounts.incidents.incidents} incidents, {dataCounts.dataCounts.incidents.timelineEvents} events
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearData('incidents')}
                      disabled={clearDataLoading.incidents || dataCounts.dataCounts.incidents.total === 0}
                      className="btn-secondary text-red-400 hover:text-red-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearDataLoading.incidents ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Incidents
                        </>
                      )}
                    </button>
                  </div>

                  {/* Assets */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Globe className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Assets</h4>
                          <p className="text-slate-400 text-sm">Network and system assets</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1">
                        {dataCounts.dataCounts.assets.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        Total assets
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearData('assets')}
                      disabled={clearDataLoading.assets || dataCounts.dataCounts.assets.total === 0}
                      className="btn-secondary text-red-400 hover:text-red-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearDataLoading.assets ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Assets
                        </>
                      )}
                    </button>
                  </div>

                  {/* Threat Intelligence */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Threat Intel</h4>
                          <p className="text-slate-400 text-sm">IOCs and indicators</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1">
                        {dataCounts.dataCounts.threatIntel.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        IOCs and indicators
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearData('threatintel')}
                      disabled={clearDataLoading.threatintel || dataCounts.dataCounts.threatIntel.total === 0}
                      className="btn-secondary text-red-400 hover:text-red-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearDataLoading.threatintel ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Threat Intel
                        </>
                      )}
                    </button>
                  </div>

                  {/* Playbooks */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Play className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Playbooks</h4>
                          <p className="text-slate-400 text-sm">Automated response workflows</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1">
                        {dataCounts.dataCounts.playbooks.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        Response playbooks
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearData('playbooks')}
                      disabled={clearDataLoading.playbooks || dataCounts.dataCounts.playbooks.total === 0}
                      className="btn-secondary text-red-400 hover:text-red-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearDataLoading.playbooks ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Playbooks
                        </>
                      )}
                    </button>
                  </div>

                  {/* Notifications */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                          <Bell className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Notifications</h4>
                          <p className="text-slate-400 text-sm">System notifications</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1">
                        {dataCounts.dataCounts.notifications.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        System notifications
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearData('notifications')}
                      disabled={clearDataLoading.notifications || dataCounts.dataCounts.notifications.total === 0}
                      className="btn-secondary text-red-400 hover:text-red-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearDataLoading.notifications ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Notifications
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <p className="text-slate-400">No data counts available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'apikeys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">API Keys</h3>
                  <p className="text-slate-400 mt-2">
                    Manage API keys for external system integration. Each organization can have one active API key.
                  </p>
                </div>
                
                {apiKeys.length === 0 && (
                  <button 
                    onClick={() => setShowCreateApiKeyModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate API Key
                  </button>
                )}
              </div>

              {apiKeysError && (
                <div className="card bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400">{apiKeysError}</p>
                </div>
              )}

              {apiKeysLoading ? (
                <div className="card flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-opensoc-500" />
                  <span className="ml-2 text-slate-400">Loading API keys...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.length === 0 ? (
                    <div className="card text-center py-8">
                      <Key className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-white font-medium mb-2">No API Keys</h4>
                      <p className="text-slate-400 mb-4">
                        Create an API key to enable external system integration
                      </p>
                      <button 
                        onClick={() => setShowCreateApiKeyModal(true)}
                        className="btn-primary"
                      >
                        Generate Your First API Key
                      </button>
                    </div>
                  ) : (
                    apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="card">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-opensoc-600/20 rounded-lg flex items-center justify-center">
                              <Key className="h-6 w-6 text-opensoc-400" />
                            </div>
                            <div className="flex-1">
                              {editingApiKey === apiKey.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editApiKeyName}
                                    onChange={(e) => setEditApiKeyName(e.target.value)}
                                    className="input-field text-sm flex-1"
                                    placeholder="Enter API key name"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateApiKeyName(apiKey.id);
                                      if (e.key === 'Escape') cancelEditingApiKey();
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateApiKeyName(apiKey.id)}
                                    className="btn-primary px-2 py-1 text-xs"
                                    disabled={!editApiKeyName.trim()}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={cancelEditingApiKey}
                                    className="btn-secondary px-2 py-1 text-xs"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-white font-semibold">{apiKey.name}</h4>
                                  <button
                                    onClick={() => startEditingApiKey(apiKey)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                    title="Edit API key name"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-slate-400 text-sm">
                                Created {new Date(apiKey.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {apiKey.isActive ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                                INACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">API Key</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={(() => {
                                  // Simple show/hide logic
                                  if (showFullKey === apiKey.id) {
                                    return showApiKey || "API key not available - regenerate to get full key";
                                  }
                                  // Default: show masked version
                                  return `${apiKey.keyPrefix}••••••••••••••••••••••••••••••••••`;
                                })()}
                                readOnly
                                className="input-field flex-1 font-mono text-sm"
                              />
                              <button
                                onClick={() => {
                                  const newShowState = showFullKey === apiKey.id ? null : apiKey.id;
                                  setShowFullKey(newShowState);
                                  // Also control test script visibility with the same button
                                  setShowTestScript(newShowState);
                                }}
                                className="btn-secondary p-2"
                                title={showFullKey === apiKey.id ? "Hide API key and test script" : "Show API key and test script"}
                              >
                                {showFullKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => {
                                  const keyToCopy = showFullKey === apiKey.id 
                                    ? (showApiKey || "API key not available - regenerate to get full key")
                                    : `${apiKey.keyPrefix}••••••••••••••••••••••••••••••••••`;
                                  copyToClipboard(keyToCopy);
                                }}
                                className="btn-secondary p-2"
                                title="Copy to clipboard"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {showFullKey === apiKey.id 
                                ? "API key and test script are visible. Click the eye icon to hide them." 
                                : "API key is masked. Click the eye icon to show key and test script."
                              }
                            </p>
                            
                            {/* Integration Instructions */}
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <FileText className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <p className="text-blue-200 font-medium">Quick Integration Test Script</p>
                                  {showFullKey === apiKey.id ? (
                                    <p className="text-blue-300 mt-1">
                                      ✅ Test script is visible below. Copy or download it to test your API integration.
                                    </p>
                                  ) : (
                                    <p className="text-blue-300 mt-1">
                                      👁️ <span className="font-medium">Click the eye icon above</span> to show your API key and test script
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Permissions</label>
                              <div className="flex flex-wrap gap-1">
                                {apiKey.permissions.map(permission => (
                                  <span 
                                    key={permission}
                                    className="px-2 py-1 bg-opensoc-600/20 text-opensoc-300 text-xs rounded"
                                  >
                                    {permission.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Last Used</label>
                              <p className="text-white text-sm">
                                {apiKey.lastUsedAt 
                                  ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                                  : 'Never'
                                }
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Usage Count</label>
                              <p className="text-white text-sm">
                                {apiKey.metadata?.usageCount || 0} requests
                              </p>
                            </div>
                          </div>

                          {/* Quick Start Integration Test Script */}
                          {apiKey.isActive && showTestScript === apiKey.id && (
                            <div className="mt-4 p-4 bg-opensoc-800/20 border border-opensoc-600/20 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-opensoc-600/20 rounded-lg flex items-center justify-center">
                                    <Key className="h-4 w-4 text-opensoc-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-white font-medium text-sm">Quick Start Integration Test</h5>
                                    <p className="text-slate-400 text-xs">
                                      {showApiKey 
                                        ? "Ready-to-use test script with your real API key embedded"
                                        : "Template script - replace YOUR_API_KEY_HERE with your actual key"
                                      }
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const apiKeyValue = showApiKey || 'YOUR_API_KEY_HERE';
                                    const scriptContent = [
                                      '#!/bin/bash',
                                      '',
                                      '# OpenSOC API Integration Test Script',
                                      `# Generated for: ${apiKey.name}`,
                                      `# Created: ${new Date().toLocaleDateString()}`,
                                      ...(showApiKey ? [] : [
                                        '',
                                        '# IMPORTANT: Replace YOUR_API_KEY_HERE with your actual API key',
                                        '# You can find your key by regenerating it or copying it when visible'
                                      ]),
                                      '',
                                      'API_BASE_URL="http://localhost:3001/api"',
                                      `API_KEY="${apiKeyValue}"`,
                                      '',
                                      'echo "🚀 Testing OpenSOC API Integration..."',
                                      '',
                                      '# Test 1: Health Check',
                                      'echo "📡 Testing API health..."',
                                      'curl -s "$API_BASE_URL/external/health" \\',
                                      '  -H "Authorization: Bearer $API_KEY" | jq \'.\'',
                                      '',
                                      '# Test 2: Create Test Alert',
                                      'echo "🚨 Creating test alert..."',
                                      'curl -s -X POST "$API_BASE_URL/external/alerts" \\',
                                      '  -H "Content-Type: application/json" \\',
                                      '  -H "Authorization: Bearer $API_KEY" \\',
                                      '  -d \'{',
                                      '    "title": "Test Alert from Integration Script",',
                                      '    "description": "This is a test alert created via API integration",',
                                      '    "severity": 2,',
                                      '    "sourceSystem": "Integration Test",',
                                      '    "eventTime": "\'$(date -u +\'%Y-%m-%dT%H:%M:%SZ\')\'",',
                                      '    "assetName": "Test System",',
                                      '    "category": "test",',
                                      '    "rawData": {',
                                      '      "test": true,',
                                      '      "script": "api_key_integration_test.sh"',
                                      '    }',
                                      '  }\' | jq \'.\'',
                                      '',
                                      'echo "✅ Integration test complete!"'
                                    ].join('\n');
                                    
                                    const element = document.createElement('a');
                                    const file = new Blob([scriptContent], {type: 'text/plain'});
                                    element.href = URL.createObjectURL(file);
                                    element.download = 'api_key_integration_test.sh';
                                    document.body.appendChild(element);
                                    element.click();
                                    document.body.removeChild(element);
                                  }}
                                  className="btn-secondary text-xs px-2 py-1"
                                  title="Download integration test script"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </button>
                              </div>
                              
                              <div className="relative">
                                <pre className="text-xs text-slate-300 bg-soc-dark-900 p-3 rounded border overflow-x-auto font-mono">
{[
  '#!/bin/bash',
  '',
  '# OpenSOC API Integration Test Script  ',
  'API_BASE_URL="http://localhost:3001/api"',
  `API_KEY="${showApiKey || 'YOUR_API_KEY_HERE'}"`,
  '',
  'echo "🚀 Testing OpenSOC API Integration..."',
  '',
  '# Health Check',
  'curl -s "$API_BASE_URL/external/health" \\',
  '  -H "Authorization: Bearer $API_KEY"',
  '',
  '# Create Test Alert',
  'curl -s -X POST "$API_BASE_URL/external/alerts" \\',
  '  -H "Content-Type: application/json" \\',
  '  -H "Authorization: Bearer $API_KEY" \\',
  '  -d \'{',
  '    "title": "Test Alert",',
  '    "description": "API integration test",',
  '    "severity": 2,',
  '    "sourceSystem": "Test System",',
  '    "eventTime": "\'$(date -u +\'%Y-%m-%dT%H:%M:%SZ\')\'",',
  '    "assetName": "Test Asset",',
  '    "category": "test"',
  '  }\''
].join('\n')}
                                </pre>
                                <button
                                  onClick={() => {
                                    const copyContent = [
                                      '#!/bin/bash',
                                      '',
                                      '# OpenSOC API Integration Test Script',
                                      'API_BASE_URL="http://localhost:3001/api"',
                                      `API_KEY="${showApiKey || 'YOUR_API_KEY_HERE'}"`,
                                      '',
                                      'echo "🚀 Testing OpenSOC API Integration..."',
                                      '',
                                      '# Health Check',
                                      'curl -s "$API_BASE_URL/external/health" \\',
                                      '  -H "Authorization: Bearer $API_KEY"',
                                      '',
                                      '# Create Test Alert',
                                      'curl -s -X POST "$API_BASE_URL/external/alerts" \\',
                                      '  -H "Content-Type: application/json" \\',
                                      '  -H "Authorization: Bearer $API_KEY" \\',
                                      '  -d \'{',
                                      '    "title": "Test Alert",',
                                      '    "description": "API integration test",',
                                      '    "severity": 2,',
                                      '    "sourceSystem": "Test System",',
                                      '    "eventTime": "\'$(date -u +\'%Y-%m-%dT%H:%M:%SZ\')\'",',
                                      '    "assetName": "Test Asset",',
                                      '    "category": "test"',
                                      '  }\''
                                    ].join('\n');
                                    copyToClipboard(copyContent);
                                  }}
                                  className="absolute top-2 right-2 btn-secondary p-1 text-xs opacity-70 hover:opacity-100"
                                  title="Copy script to clipboard"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                              
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <div className="text-slate-400">
                                  💡 Make executable with: <code className="bg-soc-dark-900 px-1 rounded">chmod +x api_key_integration_test.sh</code>
                                </div>
                                <div className="text-slate-500">
                                  Requires: curl, jq (optional for pretty output)
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-soc-dark-700">
                            <div className="text-sm text-slate-400">
                              Created by {apiKey.creator ? `${apiKey.creator.firstName} ${apiKey.creator.lastName}` : 'System'}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => window.open('/integration', '_blank')}
                                className="btn-secondary text-sm"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Integration Guide
                              </button>
                              {apiKey.isActive && (
                                <button
                                  onClick={() => setShowRegenerateModal(apiKey.id)}
                                  className="btn-secondary text-opensoc-400 text-sm"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate
                                </button>
                              )}
                              {apiKey.isActive && (
                                <button
                                  onClick={() => handleDeactivateApiKey(apiKey.id)}
                                  className="btn-secondary text-red-400 text-sm"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create API Key Modal */}
          {showCreateApiKeyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-soc-dark-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">Create API Key</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">API Key Name</label>
                    <input
                      type="text"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="e.g., Production Integration, SIEM Connector"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-200 text-sm font-medium">Security Notice</p>
                        <p className="text-yellow-300 text-xs mt-1">
                          The API key will only be shown once. Please copy and store it securely.
                          You can only have one active API key per organization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateApiKeyModal(false);
                      setNewApiKeyName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={!newApiKeyName.trim() || apiKeysLoading}
                    className="btn-primary"
                  >
                    {apiKeysLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Generate API Key
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regenerate API Key Modal */}
          {showRegenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-soc-dark-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">Regenerate API Key</h3>
                
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-200 text-sm font-medium">Warning: This action cannot be undone</p>
                        <ul className="text-red-300 text-xs mt-2 space-y-1">
                          <li>• Your current API key will be immediately invalidated</li>
                          <li>• All external systems using the old key will stop working</li>
                          <li>• You must update all integrations with the new key</li>
                          <li>• The new key will only be shown once</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-200 text-sm font-medium">Before proceeding:</p>
                        <ul className="text-yellow-300 text-xs mt-1 space-y-1">
                          <li>• Make sure you can update all systems using this key</li>
                          <li>• Consider doing this during a maintenance window</li>
                          <li>• Have the Integration Guide open for reference</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRegenerateModal(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRegenerateApiKey(showRegenerateModal)}
                    disabled={apiKeysLoading}
                    className="btn-primary bg-red-600 hover:bg-red-700"
                  >
                    {apiKeysLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate API Key
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">External Integrations</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  { name: 'VirusTotal', status: 'connected', description: 'File and URL analysis', icon: Shield },
                  { name: 'MISP', status: 'connected', description: 'Threat intelligence sharing', icon: Globe },
                  { name: 'Splunk', status: 'disconnected', description: 'Log aggregation and analysis', icon: Database },
                  { name: 'Microsoft Sentinel', status: 'available', description: 'Cloud SIEM integration', icon: Eye },
                  { name: 'Elasticsearch', status: 'connected', description: 'Search and analytics', icon: Database },
                  { name: 'JIRA', status: 'available', description: 'Issue tracking integration', icon: Settings }
                ].map((integration, index) => (
                  <div key={index} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-soc-dark-700 rounded-lg flex items-center justify-center">
                          <integration.icon className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{integration.name}</h4>
                          <p className="text-slate-400 text-sm">{integration.description}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        integration.status === 'connected' ? 'bg-green-500/20 text-green-400' :
                        integration.status === 'disconnected' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {integration.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {integration.status === 'connected' ? (
                        <>
                          <button className="btn-secondary text-sm flex-1">Configure</button>
                          <button className="btn-secondary text-sm px-3 text-red-400">Disconnect</button>
                        </>
                      ) : integration.status === 'disconnected' ? (
                        <button className="btn-secondary text-sm flex-1">Reconnect</button>
                      ) : (
                        <button className="btn-primary text-sm flex-1">Connect</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;