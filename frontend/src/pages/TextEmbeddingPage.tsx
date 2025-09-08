import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader,
  BarChart3,
  Info,
  Settings,
  Zap,
  Activity,
  Clock
} from 'lucide-react';

interface EmbeddingStatus {
  total: number;
  embedded: number;
  pending: number;
  percentage: number;
  error?: string;
}

interface EmbeddingStats {
  totalRecords: number;
  embeddedRecords: number;
  overallCoverage: number;
  modelInfo: {
    name: string;
    dimensions: number;
    initialized: boolean;
  };
  searchCapabilities: Record<string, {
    available: boolean;
    coverage: number;
    count: number;
  }>;
}

const TextEmbeddingPage: React.FC = () => {
  const [embeddingStatus, setEmbeddingStatus] = useState<Record<string, EmbeddingStatus>>({});
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dataTypes = [
    { key: 'alerts', label: 'Security Alerts', icon: AlertTriangle, description: 'Security events and alerts from various sources' },
    { key: 'incidents', label: 'Security Incidents', icon: AlertTriangle, description: 'Escalated security incidents requiring response' },
    { key: 'assets', label: 'Asset Inventory', icon: Database, description: 'Network assets, servers, and endpoints' },
    { key: 'iocs', label: 'Threat Intelligence', icon: Activity, description: 'Indicators of Compromise (IOCs) and threat data' },
    { key: 'playbooks', label: 'Response Playbooks', icon: CheckCircle2, description: 'Security response procedures and workflows' }
  ];

  useEffect(() => {
    loadEmbeddingData();
  }, []);

  const loadEmbeddingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load embedding status and stats in parallel
      const [statusResponse, statsResponse] = await Promise.all([
        fetch('/api/embeddings/status', { headers }),
        fetch('/api/embeddings/stats', { headers })
      ]);

      if (!statusResponse.ok || !statsResponse.ok) {
        const errorData = !statusResponse.ok ? await statusResponse.json() : await statsResponse.json();
        throw new Error(errorData.message || errorData.error || 'Failed to load embedding data');
      }

      const statusData = await statusResponse.json();
      const statsData = await statsResponse.json();

      if (statusData.success) {
        setEmbeddingStatus(statusData.data);
      }

      if (statsData.success) {
        setEmbeddingStats(statsData.data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load embedding data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmbeddings = async (modelType: string) => {
    setIsGenerating(prev => ({ ...prev, [modelType]: true }));
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelType: modelType.slice(0, -1), // Remove 's' from plural
          batchSize: 50
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate embeddings');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate embeddings');
      }

      // Refresh data after generation
      await loadEmbeddingData();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate embeddings';
      setError(`Generation failed for ${modelType}: ${errorMessage}`);
      // Still refresh data to show current status
      try {
        await loadEmbeddingData();
      } catch (refreshError) {
        console.error('Failed to refresh data after error:', refreshError);
      }
    } finally {
      setIsGenerating(prev => ({ ...prev, [modelType]: false }));
    }
  };

  const generateAllEmbeddings = async () => {
    const allTypes = dataTypes.map(type => type.key);
    setIsGenerating(
      allTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
    );
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/embeddings/generate-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchSize: 50
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate embeddings');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate embeddings');
      }

      // Refresh data after generation
      await loadEmbeddingData();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate embeddings';
      setError(`Batch generation failed: ${errorMessage}`);
      // Still refresh data to show current status
      try {
        await loadEmbeddingData();
      } catch (refreshError) {
        console.error('Failed to refresh data after error:', refreshError);
      }
    } finally {
      setIsGenerating({});
    }
  };

  const initializeModel = async () => {
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/embeddings/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to initialize embedding model');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize embedding model');
      }

      // Refresh stats after initialization
      await loadEmbeddingData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize embedding model');
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-opensoc-500" />
          <span className="ml-3 text-lg text-slate-300">Loading embedding data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-opensoc-600 rounded-lg flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Text Embedding Management</h1>
            <p className="text-slate-400">
              Manage vector embeddings for RAG-powered AI SOC Consultant
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={loadEmbeddingData}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={generateAllEmbeddings}
            disabled={Object.values(isGenerating).some(Boolean)}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Generate All</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium">Error</h4>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      {embeddingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-opensoc-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Overall Coverage</h3>
                <p className={`text-2xl font-bold ${getStatusColor(embeddingStats.overallCoverage)}`}>
                  {embeddingStats.overallCoverage}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Total Records</h3>
                <p className="text-2xl font-bold text-white">{embeddingStats.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Embedded</h3>
                <p className="text-2xl font-bold text-green-400">
                  {embeddingStats.embeddedRecords.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Model Status</h3>
                <p className={`text-sm font-medium ${embeddingStats.modelInfo.initialized ? 'text-green-400' : 'text-yellow-400'}`}>
                  {embeddingStats.modelInfo.initialized ? 'Initialized' : 'Not Initialized'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Information */}
      {embeddingStats?.modelInfo && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Embedding Model Information</span>
            </h2>
            
            {!embeddingStats.modelInfo.initialized && (
              <button
                onClick={initializeModel}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Initialize Model</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Model Name</label>
              <p className="text-white font-mono text-sm">{embeddingStats.modelInfo.name}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Dimensions</label>
              <p className="text-white font-mono text-sm">{embeddingStats.modelInfo.dimensions}D</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  embeddingStats.modelInfo.initialized ? 'bg-green-500' : 
                  embeddingStats.modelInfo.error ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className={`text-sm font-medium ${
                  embeddingStats.modelInfo.initialized ? 'text-green-400' : 
                  embeddingStats.modelInfo.error ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {embeddingStats.modelInfo.initialized ? 'Ready' : 
                   embeddingStats.modelInfo.error ? 'Failed to Initialize' : 'Needs Initialization'}
                </span>
              </div>
            </div>
          </div>

          {/* Show initialization error if exists */}
          {embeddingStats.modelInfo.error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h4 className="text-red-400 font-medium text-sm mb-1">Initialization Error:</h4>
              <p className="text-red-300 text-xs">{embeddingStats.modelInfo.error}</p>
              <p className="text-slate-400 text-xs mt-2">
                You can still generate embeddings using the configured model. 
                The system will attempt to initialize the model when needed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Data Type Status */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Embedding Status by Data Type</span>
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {dataTypes.map(({ key, label, icon: Icon, description }) => {
            const status = embeddingStatus[key];
            const isGeneratingCurrent = isGenerating[key];
            
            if (!status) return null;

            return (
              <div key={key} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-opensoc-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{label}</h3>
                      <p className="text-sm text-slate-400">{description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => generateEmbeddings(key)}
                    disabled={isGeneratingCurrent}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    {isGeneratingCurrent ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>{status.pending === 0 ? 'Regenerate' : 'Generate'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Embedding Progress</span>
                    <span className={`text-sm font-medium ${getStatusColor(status.percentage)}`}>
                      {status.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-soc-dark-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(status.percentage)}`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Total Records</label>
                    <p className="text-white font-semibold">{status.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Embedded</label>
                    <p className="text-green-400 font-semibold">{status.embedded.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Pending</label>
                    <p className="text-yellow-400 font-semibold">{status.pending.toLocaleString()}</p>
                  </div>
                </div>

                {/* Error Display */}
                {status.error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">Error: {status.error}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center justify-center text-slate-500 text-sm">
          <Clock className="h-4 w-4 mr-2" />
          <span>Last updated: {lastUpdated.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default TextEmbeddingPage;