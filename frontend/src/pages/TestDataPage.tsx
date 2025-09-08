import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play,
  Trash2,
  AlertTriangle,
  FileText,
  Server,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  Upload,
  Users,
  Target,
  Monitor,
  Smartphone,
  Router,
  Cloud,
  HardDrive,
  Globe,
  Link,
  File,
  Mail,
  Key
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import {
  checkAIStatus,
  generateTestData,
  createTestAlerts,
  createTestIncidents,
  createTestAssets,
  createTestIOCs,
  createTestPlaybooks,
  createTestThreatActors,
  createTestThreatCampaigns,
  fetchTestDataStats,
  cleanupTestData,
  setSelectedDataType,
  setSelectedScenario,
  setShowPreviewModal,
  clearErrors,
} from '../store/testDataSlice';
import testDataService from '../services/testDataService';
import ToastService from '../services/toastService';

interface TestDataConfig {
  dataType: 'alert' | 'incident' | 'asset' | 'ioc' | 'playbook' | 'threat_actor' | 'threat_campaign';
  quantity: number;
  severityDistribution: {
    critical: number; // Level 5
    high: number;     // Level 4
    medium: number;   // Level 3
    low: number;      // Level 2
    info: number;     // Level 1
  };
  timeRange: 'last_24h' | 'last_7d' | 'last_30d' | 'custom';
  customTimeStart?: string;
  customTimeEnd?: string;
  targetAssets: string[];
  scenario: string;
  customDescription?: string;
  customRequirements?: string;
  customExamples?: string;
}


const TestDataPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const {
    aiStatus = { connected: false, modelAvailable: false },
    aiStatusLoading,
    aiStatusError,
    isGenerating,
    generationProgress,
    generationStep,
    generationError,
    generatedData,
    fullGeneratedData,
    stats,
    statsLoading,
    statsError,
    showPreviewModal,
    selectedDataType = 'alert',
    selectedScenario = 'mixed',
    isCreating,
    createError,
    lastCreateResult,
    isCleaningUp,
    cleanupError,
    lastCleanupResult,
  } = useSelector((state: RootState) => state.testData);

  // Local config state
  const [config, setConfig] = useState<TestDataConfig>({
    dataType: selectedDataType,
    quantity: 5,
    severityDistribution: {
      critical: 10,
      high: 20,
      medium: 30,
      low: 25,
      info: 15,
    },
    timeRange: 'last_24h',
    targetAssets: [],
    scenario: selectedScenario,
    customDescription: '',
    customRequirements: '',
    customExamples: '',
  });

  // Status polling state
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [statusPollingEnabled, setStatusPollingEnabled] = useState(true);

  // Get scenarios from service
  const testScenarios = testDataService.getTestScenarios();

  // Refresh test data statistics
  const handleRefresh = () => {
    dispatch(fetchTestDataStats());
    dispatch(clearErrors());
  };

  useEffect(() => {
    // Initialize on component mount
    dispatch(checkAIStatus()).then(() => {
      setLastStatusCheck(new Date());
    });
    dispatch(fetchTestDataStats());
    dispatch(clearErrors());
  }, [dispatch]);

  // Real-time status polling every 30 seconds
  useEffect(() => {
    if (!statusPollingEnabled) return;

    const intervalId = setInterval(() => {
      dispatch(checkAIStatus()).then(() => {
        setLastStatusCheck(new Date());
      });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [dispatch, statusPollingEnabled]);

  // Update local config when Redux state changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      dataType: selectedDataType,
      scenario: selectedScenario,
    }));
  }, [selectedDataType, selectedScenario]);

  const handleCheckAIConnection = () => {
    dispatch(checkAIStatus()).then(() => {
      setLastStatusCheck(new Date());
    });
  };

  const handleToggleStatusPolling = () => {
    setStatusPollingEnabled(!statusPollingEnabled);
  };

  const formatLastChecked = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const handleConfigChange = (field: keyof TestDataConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Update Redux state for data type and scenario
    if (field === 'dataType') {
      dispatch(setSelectedDataType(value));
    } else if (field === 'scenario') {
      dispatch(setSelectedScenario(value));
    }
  };

  const handleSeverityDistributionChange = (severity: keyof TestDataConfig['severityDistribution'], value: number) => {
    if (!config.severityDistribution) return;
    
    setConfig(prev => ({
      ...prev,
      severityDistribution: {
        ...prev.severityDistribution!,
        [severity]: value,
      },
    }));
  };

  const handleGenerateTestData = async () => {
    const generationConfig = {
      ...config,
      preview: true,
    };
    
    try {
      const result = await dispatch(generateTestData(generationConfig)).unwrap();
      
      // Show success toast with specific details
      ToastService.aiGenerationSuccess(
        config.dataType,
        result.quantity || config.quantity
      );
    } catch (error) {
      // Show error toast 
      ToastService.testDataError(config.dataType, (error as Error).message);
    }
  };

  const handleImportTestData = async () => {
    if (!fullGeneratedData || fullGeneratedData.length === 0) return;
    
    try {
      // Send raw AI-generated data to backend - let backend handle all UUID generation
      let result;
      if (config.dataType === 'alert') {
        result = await dispatch(createTestAlerts(fullGeneratedData as any[])).unwrap();
      } else if (config.dataType === 'incident') {
        result = await dispatch(createTestIncidents(fullGeneratedData as any[])).unwrap();
      } else if (config.dataType === 'asset') {
        result = await dispatch(createTestAssets(fullGeneratedData as any[])).unwrap();
      } else if (config.dataType === 'ioc') {
        result = await dispatch(createTestIOCs(fullGeneratedData as any[])).unwrap();
      } else if (config.dataType === 'playbook') {
        result = await dispatch(createTestPlaybooks(fullGeneratedData as any[])).unwrap();
      } else if (config.dataType === 'threat_actor') {
        result = await dispatch(createTestThreatActors(fullGeneratedData as any[])).unwrap();
      } else if (config.dataType === 'threat_campaign') {
        result = await dispatch(createTestThreatCampaigns(fullGeneratedData as any[])).unwrap();
      }
      
      if (result) {
        ToastService.success(result.message || `Successfully created test ${config.dataType}s!`);
        // Refresh statistics after successful creation
        dispatch(fetchTestDataStats());
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Enhanced error messages for common asset creation issues
      let enhancedMessage = errorMessage;
      if (config.dataType === 'asset') {
        if (errorMessage.includes('validation') || errorMessage.includes('400')) {
          enhancedMessage = `Asset validation failed: ${errorMessage}. Please check IP addresses, asset types, and required fields.`;
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          enhancedMessage = `Network error creating assets: ${errorMessage}. Please check your connection and try again.`;
        } else if (errorMessage.includes('database') || errorMessage.includes('constraint')) {
          enhancedMessage = `Database error creating assets: ${errorMessage}. This may be due to duplicate data or schema issues.`;
        }
      }
      
      ToastService.error(`Failed to create test ${config.dataType}s: ${enhancedMessage}`);
    }
  };

  const handleCleanupTestData = async () => {
    if (window.confirm('Are you sure you want to delete all test data? This action cannot be undone.')) {
      try {
        const result = await dispatch(cleanupTestData()).unwrap();
        ToastService.success(result.message || 'Test data cleaned up successfully!');
      } catch (error) {
        ToastService.error(`Failed to cleanup test data: ${(error as Error).message}`);
      }
    }
  };

  const handleClosePreview = () => {
    dispatch(setShowPreviewModal(false));
  };

  // Effect to show preview modal when data is generated
  useEffect(() => {
    if (generatedData.length > 0 && !isGenerating) {
      dispatch(setShowPreviewModal(true));
    }
  }, [generatedData, isGenerating, dispatch]);

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

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'workstation': return <Monitor className="h-4 w-4" />;
      case 'mobile_device': return <Smartphone className="h-4 w-4" />;
      case 'network_device': return <Router className="h-4 w-4" />;
      case 'cloud_service': return <Cloud className="h-4 w-4" />;
      case 'virtual_machine': return <HardDrive className="h-4 w-4" />;
      case 'iot_device': return <Globe className="h-4 w-4" />;
      case 'container': return <Settings className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getAssetCompleteness = (item: any) => {
    const requiredFields = ['name', 'assetType'];
    const optionalFields = ['ipAddress', 'hostname', 'osType', 'operatingSystem', 'owner', 'location', 'description'];
    
    const completedRequired = requiredFields.filter(field => item[field] && item[field] !== null).length;
    const completedOptional = optionalFields.filter(field => item[field] && item[field] !== null).length;
    
    const requiredPercent = (completedRequired / requiredFields.length) * 100;
    const totalPercent = ((completedRequired + completedOptional) / (requiredFields.length + optionalFields.length)) * 100;
    
    return {
      requiredPercent,
      totalPercent,
      isValid: requiredPercent === 100,
      completedRequired,
      totalRequired: requiredFields.length,
      completedOptional,
      totalOptional: optionalFields.length
    };
  };

  const getIOCIcon = (iocType: string) => {
    switch (iocType) {
      case 'ip': return <Globe className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'url': return <Link className="h-4 w-4" />;
      case 'file_hash': return <File className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'registry_key': return <Key className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getIOCCompleteness = (item: any) => {
    const requiredFields = ['type', 'value', 'confidence', 'severity', 'source'];
    const optionalFields = ['description', 'tags', 'firstSeen', 'lastSeen', 'mitreAttack'];
    
    const completedRequired = requiredFields.filter(field => item[field] && item[field] !== null).length;
    const completedOptional = optionalFields.filter(field => item[field] && item[field] !== null && (!Array.isArray(item[field]) || item[field].length > 0)).length;
    
    const requiredPercent = (completedRequired / requiredFields.length) * 100;
    const totalPercent = ((completedRequired + completedOptional) / (requiredFields.length + optionalFields.length)) * 100;
    
    return {
      requiredPercent,
      totalPercent,
      isValid: requiredPercent === 100,
      completedRequired,
      totalRequired: requiredFields.length,
      completedOptional,
      totalOptional: optionalFields.length
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Test Data Generator</h1>
          <p className="text-slate-400 mt-2">
            Generate realistic test data for SOC testing and AI agent automation
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            aiStatus?.connected 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {aiStatus?.connected ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>Ollama AI {aiStatus?.connected ? 'Connected' : 'Unavailable'}</span>
            {lastStatusCheck && (
              <span className="text-xs opacity-70">
                ({formatLastChecked(lastStatusCheck)})
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleCheckAIConnection} 
            disabled={aiStatusLoading}
            className="btn-secondary relative"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${aiStatusLoading ? 'animate-spin' : ''}`} />
            Check Connection
            {statusPollingEnabled && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                   title="Auto-refresh enabled" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Type Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Data Type & Scenario</h3>
            <div className="grid grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
              {(['alert', 'incident', 'asset', 'ioc', 'playbook', 'threat_actor', 'threat_campaign'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleConfigChange('dataType', type)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    config.dataType === type
                      ? 'border-opensoc-500 bg-opensoc-500/10'
                      : 'border-soc-dark-700 hover:border-opensoc-600'
                  }`}
                >
                  {type === 'alert' && <AlertTriangle className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  {type === 'incident' && <FileText className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  {type === 'asset' && <Server className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  {type === 'ioc' && <Shield className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  {type === 'playbook' && <Settings className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  {type === 'threat_actor' && <Users className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  {type === 'threat_campaign' && <Target className="h-8 w-8 text-opensoc-400 mx-auto mb-2" />}
                  <div className="text-white font-medium capitalize">
                    {type === 'ioc' ? 'IOCs' : 
                     type === 'playbook' ? 'Playbooks' :
                     type === 'threat_actor' ? 'Threat Actors' :
                     type === 'threat_campaign' ? 'Threat Campaigns' :
                     `${type}s`}
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Test Scenario</label>
              <select
                value={selectedScenario}
                onChange={(e) => handleConfigChange('scenario', e.target.value)}
                className="input-field w-full"
              >
                {(testScenarios[config.dataType] || []).map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-1">
                {testScenarios[config.dataType]?.find(s => s.id === selectedScenario)?.description}
              </p>
            </div>
          </div>

          {/* Generation Options */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Generation Options</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.quantity}
                  onChange={(e) => handleConfigChange('quantity', parseInt(e.target.value))}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Time Range</label>
                <select
                  value={config.timeRange}
                  onChange={(e) => handleConfigChange('timeRange', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="last_24h">Last 24 Hours</option>
                  <option value="last_7d">Last 7 Days</option>
                  <option value="last_30d">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {config.dataType === 'alert' && (
              <div>
                <label className="block text-sm text-slate-400 mb-3">Severity Distribution (%)</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(config.severityDistribution).map(([severity, value]) => (
                    <div key={severity}>
                      <label className="block text-xs text-slate-500 mb-1 capitalize">
                        {severity === 'critical' ? 'Critical (5)' : 
                         severity === 'high' ? 'High (4)' :
                         severity === 'medium' ? 'Medium (3)' :
                         severity === 'low' ? 'Low (2)' : 'Info (1)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => handleSeverityDistributionChange(
                          severity as keyof TestDataConfig['severityDistribution'], 
                          parseInt(e.target.value)
                        )}
                        className="input-field w-full text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Generation Controls */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleGenerateTestData}
                disabled={isGenerating}
                className="btn-primary w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Test Data
                  </>
                )}
              </button>

              <button
                onClick={handleCleanupTestData}
                disabled={isCleaningUp}
                className="btn-secondary w-full text-red-400 border-red-500/20 hover:bg-red-500/10"
              >
                {isCleaningUp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Cleanup Test Data
              </button>
            </div>

            {isGenerating && (
              <div className="mt-4 p-3 bg-soc-dark-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{generationStep}</span>
                  <span className="text-sm text-slate-400">{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-soc-dark-700 rounded-full h-2">
                  <div
                    className="bg-opensoc-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Generation Parameters */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Custom Generation Parameters (Optional)</h3>
            <p className="text-sm text-slate-400 mb-4">Provide additional context to enhance AI generation for {config.dataType}s</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Additional Context</label>
                <textarea
                  value={config.customDescription || ''}
                  onChange={(e) => handleConfigChange('customDescription', e.target.value)}
                  placeholder="Provide specific context about the scenario or use case..."
                  className="input-field w-full h-20 resize-none"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Optional: Describe specific context or requirements for this {config.dataType} generation
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Specific Requirements</label>
                <textarea
                  value={config.customRequirements || ''}
                  onChange={(e) => handleConfigChange('customRequirements', e.target.value)}
                  placeholder="Any specific constraints, patterns, or requirements..."
                  className="input-field w-full h-16 resize-none"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Optional: Specify constraints or patterns for the generated {config.dataType}s
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Example Data</label>
                <textarea
                  value={config.customExamples || ''}
                  onChange={(e) => handleConfigChange('customExamples', e.target.value)}
                  placeholder="Provide examples of the kind of data you want..."
                  className="input-field w-full h-16 resize-none"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Optional: Provide examples to guide the AI generation
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {(generationError || createError || cleanupError || aiStatusError) && (
            <div className="card bg-red-500/10 border-red-500/20">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Error</h3>
              <div className="space-y-3 text-sm text-red-300">
                {generationError && (
                  <div>
                    <div className="font-medium">Generation Error:</div>
                    <div className="text-xs bg-red-900/20 p-2 rounded mt-1">{generationError}</div>
                  </div>
                )}
                {createError && (
                  <div>
                    <div className="font-medium">Creation Error:</div>
                    <div className="text-xs bg-red-900/20 p-2 rounded mt-1">{createError}</div>
                    {config.dataType === 'asset' && (
                      <div className="text-xs text-red-400 mt-2">
                        💡 <strong>Asset Creation Tips:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-red-300">
                          <li>Ensure IP addresses are valid (IPv4/IPv6)</li>
                          <li>Check that asset types match allowed values</li>
                          <li>Verify all required fields are provided</li>
                          <li>Asset names should be unique within organization</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {cleanupError && (
                  <div>
                    <div className="font-medium">Cleanup Error:</div>
                    <div className="text-xs bg-red-900/20 p-2 rounded mt-1">{cleanupError}</div>
                  </div>
                )}
                {aiStatusError && (
                  <div>
                    <div className="font-medium">AI Status Error:</div>
                    <div className="text-xs bg-red-900/20 p-2 rounded mt-1">{aiStatusError}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Messages */}
          {(lastCreateResult?.success || lastCleanupResult?.success) && (
            <div className="card bg-green-500/10 border-green-500/20">
              <h3 className="text-lg font-semibold text-green-400 mb-3">Success</h3>
              <div className="space-y-2 text-sm text-green-300">
                {lastCreateResult?.success && <div>{lastCreateResult.message}</div>}
                {lastCleanupResult?.success && <div>{lastCleanupResult.message}</div>}
              </div>
            </div>
          )}

          {/* AI Provider Status */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">AI Provider</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleStatusPolling}
                  className={`text-xs px-2 py-1 rounded ${
                    statusPollingEnabled 
                      ? 'text-green-400 bg-green-500/20 hover:bg-green-500/30' 
                      : 'text-gray-400 bg-gray-500/20 hover:bg-gray-500/30'
                  }`}
                  title={statusPollingEnabled ? 'Auto-refresh enabled (30s)' : 'Auto-refresh disabled'}
                >
                  {statusPollingEnabled ? '🔄 Auto' : '⏸️ Manual'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Host</span>
                <span className="text-white font-mono text-sm">
                  {aiStatus?.endpoint || '192.168.8.21:11434'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Model</span>
                <span className="text-white">
                  {aiStatus?.targetModel || 'gpt-oss:20b'}
                </span>
              </div>
              {aiStatus?.serverVersion && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Version</span>
                  <span className="text-white text-sm">v{aiStatus.serverVersion}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <div className="flex items-center space-x-2">
                  <span className={`${aiStatus?.connected ? 'text-green-400' : 'text-red-400'}`}>
                    {aiStatus?.connected ? '✅ Connected' : '❌ Unavailable'}
                  </span>
                  {aiStatusLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Checked</span>
                <span className="text-white text-sm">
                  {formatLastChecked(lastStatusCheck)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Models</span>
                <span className="text-white text-sm">
                  {aiStatus?.totalModels || aiStatus?.availableModels?.length || 0} available
                </span>
              </div>
              {aiStatus?.responseTime && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-white text-sm">{aiStatus.responseTime}ms</span>
                </div>
              )}
              {!aiStatus?.connected && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-sm text-red-400 font-medium mb-2">
                    ⚠️ AI Service Unavailable
                  </div>
                  <div className="text-xs text-red-300 space-y-1">
                    <div>• Test data generation will fail</div>
                    <div>• Check network connectivity</div>
                    <div>• Verify Ollama server is running</div>
                  </div>
                  <button
                    onClick={() => window.open('/docker/agentic-soc/test_ollama.sh', '_blank')}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    📋 Run connectivity test
                  </button>
                </div>
              )}
              {aiStatusError && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                  Error: {aiStatusError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-900 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Preview Generated Data</h3>
              <button
                onClick={handleClosePreview}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {generatedData.map((item: any, index) => (
                <div key={item.id || index} className="p-4 bg-soc-dark-800 rounded-lg">
                  {config.dataType === 'asset' ? (
                    // Asset-specific display
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAssetIcon(item.assetType || 'server')}
                          <h4 className="text-white font-medium">{item.name || `Asset ${index + 1}`}</h4>
                          {(() => {
                            const completeness = getAssetCompleteness(item);
                            return (
                              <div className="flex items-center gap-1">
                                {completeness.isValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-400" title="All required fields present" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-400" title="Missing required fields" />
                                )}
                                <span className="text-xs text-slate-400" title={`${Math.round(completeness.totalPercent)}% complete`}>
                                  {Math.round(completeness.totalPercent)}%
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.criticality && (
                            <div className={`px-2 py-1 rounded text-xs ${
                              item.criticality === 'critical' ? 'text-red-400 bg-red-500/20' :
                              item.criticality === 'high' ? 'text-orange-400 bg-orange-500/20' :
                              item.criticality === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                              'text-blue-400 bg-blue-500/20'
                            }`}>
                              {item.criticality?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {item.description || `${item.assetType || 'Asset'} located at ${item.location || 'unknown location'}`}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Type:</span>
                          <span className="text-white capitalize">{item.assetType?.replace('_', ' ') || 'Unknown'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Status:</span>
                          <span className={`capitalize ${
                            item.status === 'active' ? 'text-green-400' :
                            item.status === 'inactive' ? 'text-red-400' :
                            item.status === 'maintenance' ? 'text-yellow-400' :
                            'text-slate-400'
                          }`}>{item.status || 'active'}</span>
                        </span>
                        {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                        {item.hostname && <span>Host: {item.hostname}</span>}
                        {item.osType && <span>OS: {item.osType}</span>}
                        {item.operatingSystem && <span>OS: {item.operatingSystem}</span>}
                        {item.owner && <span>Owner: {item.owner}</span>}
                        {item.environment && <span>Env: {item.environment}</span>}
                      </div>
                    </>
                  ) : config.dataType === 'ioc' ? (
                    // IOC-specific display
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getIOCIcon(item.type || 'ip')}
                          <h4 className="text-white font-medium">{item.value || `IOC ${index + 1}`}</h4>
                          {(() => {
                            const completeness = getIOCCompleteness(item);
                            return (
                              <div className="flex items-center gap-1">
                                {completeness.isValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-400" title="All required fields present" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-400" title="Missing required fields" />
                                )}
                                <span className="text-xs text-slate-400" title={`${Math.round(completeness.totalPercent)}% complete`}>
                                  {Math.round(completeness.totalPercent)}%
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.confidence && (
                            <div className={`px-2 py-1 rounded text-xs ${
                              item.confidence === 'very_high' ? 'text-red-400 bg-red-500/20' :
                              item.confidence === 'high' ? 'text-orange-400 bg-orange-500/20' :
                              item.confidence === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                              'text-gray-400 bg-gray-500/20'
                            }`}>
                              {item.confidence?.replace('_', ' ').toUpperCase()}
                            </div>
                          )}
                          {item.severity && (
                            <div className={`px-2 py-1 rounded text-xs ${
                              item.severity >= 4 ? 'text-red-400 bg-red-500/20' :
                              item.severity >= 3 ? 'text-orange-400 bg-orange-500/20' :
                              item.severity >= 2 ? 'text-yellow-400 bg-yellow-500/20' :
                              'text-blue-400 bg-blue-500/20'
                            }`}>
                              SEV {item.severity}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {item.description || `${item.type?.toUpperCase() || 'Unknown'} indicator`}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Type:</span>
                          <span className="text-white capitalize">{item.type?.toUpperCase() || 'Unknown'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Source:</span>
                          <span className="text-white">{item.source || 'Unknown'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Status:</span>
                          <span className={`capitalize ${
                            item.isActive ? 'text-green-400' : 'text-red-400'
                          }`}>{item.isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                        {item.tags && item.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">Tags:</span>
                            <span className="text-white">{item.tags.slice(0, 3).join(', ')}</span>
                          </span>
                        )}
                        {item.mitreAttack && item.mitreAttack.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">MITRE:</span>
                            <span className="text-white">{item.mitreAttack.slice(0, 2).join(', ')}</span>
                          </span>
                        )}
                        {item.firstSeen && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">First Seen:</span>
                            <span className="text-white">{new Date(item.firstSeen).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </>
                  ) : config.dataType === 'playbook' ? (
                    // Playbook-specific display
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{item.name || `Playbook ${index + 1}`}</h4>
                        <div className={`px-2 py-1 rounded text-xs ${
                          item.triggerType === 'automatic' ? 'text-green-400 bg-green-500/20' :
                          'text-blue-400 bg-blue-500/20'
                        }`}>
                          {item.triggerType?.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">{item.description || 'Security response playbook'}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <span>Category: {item.category}</span>
                        <span>Steps: {item.steps?.length || 0}</span>
                        {item.isActive !== undefined && <span>Active: {item.isActive ? 'Yes' : 'No'}</span>}
                        {item.successRate && <span>Success Rate: {item.successRate}%</span>}
                      </div>
                    </>
                  ) : config.dataType === 'threat_actor' ? (
                    // Threat Actor-specific display
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{item.name || `Threat Actor ${index + 1}`}</h4>
                        <div className={`px-2 py-1 rounded text-xs ${
                          item.sophistication === 'expert' ? 'text-red-400 bg-red-500/20' :
                          item.sophistication === 'advanced' ? 'text-orange-400 bg-orange-500/20' :
                          item.sophistication === 'intermediate' ? 'text-yellow-400 bg-yellow-500/20' :
                          'text-gray-400 bg-gray-500/20'
                        }`}>
                          {item.sophistication?.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">{item.description || 'Threat actor profile'}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        {item.origin && <span>Origin: {item.origin}</span>}
                        {item.motivation?.length > 0 && <span>Motivation: {item.motivation.join(', ')}</span>}
                        {item.aliases?.length > 0 && <span>Aliases: {item.aliases.join(', ')}</span>}
                        {item.isActive !== undefined && <span>Active: {item.isActive ? 'Yes' : 'No'}</span>}
                      </div>
                    </>
                  ) : config.dataType === 'threat_campaign' ? (
                    // Threat Campaign-specific display
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{item.name || `Campaign ${index + 1}`}</h4>
                        <div className="flex gap-2">
                          {item.severity && (
                            <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(item.severity)}`}>
                              SEV {item.severity}
                            </div>
                          )}
                          {item.confidence && (
                            <div className={`px-2 py-1 rounded text-xs ${
                              item.confidence === 'very_high' ? 'text-red-400 bg-red-500/20' :
                              item.confidence === 'high' ? 'text-orange-400 bg-orange-500/20' :
                              item.confidence === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                              'text-gray-400 bg-gray-500/20'
                            }`}>
                              {item.confidence?.replace('_', ' ').toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">{item.description || 'Threat campaign analysis'}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        {item.isActive !== undefined && <span>Active: {item.isActive ? 'Yes' : 'No'}</span>}
                        {item.targetSectors?.length > 0 && <span>Targets: {item.targetSectors.join(', ')}</span>}
                        {item.victimCount && <span>Victims: {item.victimCount}</span>}
                        {item.startDate && <span>Started: {new Date(item.startDate).toLocaleDateString()}</span>}
                      </div>
                    </>
                  ) : (
                    // Default display for alerts, incidents, and other types
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{item.title || item.name || `Item ${index + 1}`}</h4>
                        {item.severity && (
                          <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(item.severity)}`}>
                            SEV {item.severity}
                          </div>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <span>Status: {item.status}</span>
                        {item.sourceSystem && <span>Source: {item.sourceSystem}</span>}
                        {item.category && <span>Category: {item.category}</span>}
                        {item.assetName && <span>Asset: {item.assetName}</span>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClosePreview}
                className="btn-secondary"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleImportTestData}
                disabled={isCreating}
                className="btn-primary"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Test Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDataPage;