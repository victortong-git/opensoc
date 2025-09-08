import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  Clock, 
  Database, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Settings,
  Globe,
  Activity,
  Info
} from 'lucide-react';
import aiLlmLogsService, { AILLMLog } from '../../services/aiLlmLogsService';

interface LLMLogDetailsModalProps {
  logId: number;
  onClose: () => void;
}

const LLMLogDetailsModal: React.FC<LLMLogDetailsModalProps> = ({ logId, onClose }) => {
  const [log, setLog] = useState<AILLMLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'request' | 'response' | 'metadata'>('overview');
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);

  useEffect(() => {
    loadLogDetails();
  }, [logId]);

  const loadLogDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiLlmLogsService.getLogById(logId);
      setLog(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load log details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            Loading log details...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!log) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'request', label: 'Request', icon: Globe },
    { id: 'response', label: 'Response', icon: Activity },
    { id: 'metadata', label: 'Metadata', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {log.success ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                LLM Log Details - ID {log.id}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {log.providerName} • {log.modelName} • {aiLlmLogsService.formatTimestamp(log.requestTimestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status and Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center">
                    {log.success ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {log.success ? 'Success' : 'Failed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {aiLlmLogsService.formatDuration(log.durationMs)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Input Tokens</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {aiLlmLogsService.formatTokenCount(log.inputTokens)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Output Tokens</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {aiLlmLogsService.formatTokenCount(log.outputTokens)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Provider Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Provider Name</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.providerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Provider Type</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {aiLlmLogsService.getProviderTypeDisplay(log.providerType)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.modelName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">API URL</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{log.providerUrl}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Max Tokens</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.maxTokens || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Temperature</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.temperature || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Context Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Context Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Context Type</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {aiLlmLogsService.getContextTypeDisplay(log.contextType)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Context ID</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.contextId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">User</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {log.user ? `${log.user.username} (${log.user.email})` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Information */}
              {!log.success && log.errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Error Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-red-600 dark:text-red-400">HTTP Status</label>
                      <p className="text-sm text-red-800 dark:text-red-300">{log.httpStatusCode || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-red-600 dark:text-red-400">Error Message</label>
                      <p className="text-sm text-red-800 dark:text-red-300 font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded">
                        {log.errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'request' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Request Details</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowRawPrompt(!showRawPrompt)}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showRawPrompt ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showRawPrompt ? 'Hide' : 'Show'} Raw
                  </button>
                  <button
                    onClick={() => copyToClipboard(log.rawPrompt)}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={() => downloadContent(log.rawPrompt, `llm_request_${log.id}.txt`)}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>

              {/* Request Headers */}
              {log.requestHeaders && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Request Headers</h5>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                    {formatJSON(log.requestHeaders)}
                  </pre>
                </div>
              )}

              {/* Request Prompt */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Prompt</h5>
                <div className="bg-white dark:bg-gray-800 border rounded p-4 max-h-96 overflow-y-auto">
                  {showRawPrompt ? (
                    <pre className="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap">
                      {log.rawPrompt}
                    </pre>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {aiLlmLogsService.truncateText(log.rawPrompt, 500)}
                      {log.rawPrompt.length > 500 && (
                        <button
                          onClick={() => setShowRawPrompt(true)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-2"
                        >
                          Show more...
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Request Timing */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Timing</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Request Time</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {aiLlmLogsService.formatTimestamp(log.requestTimestamp)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Input Tokens</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {aiLlmLogsService.formatTokenCount(log.inputTokens)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Response Details</h4>
                {log.rawResponse && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowRawResponse(!showRawResponse)}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showRawResponse ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {showRawResponse ? 'Hide' : 'Show'} Raw
                    </button>
                    <button
                      onClick={() => copyToClipboard(log.rawResponse || '')}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={() => downloadContent(log.rawResponse || '', `llm_response_${log.id}.txt`)}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {/* Response Headers */}
              {log.responseHeaders && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Response Headers</h5>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                    {formatJSON(log.responseHeaders)}
                  </pre>
                </div>
              )}

              {/* Response Content */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Response Content</h5>
                <div className="bg-white dark:bg-gray-800 border rounded p-4 max-h-96 overflow-y-auto">
                  {log.rawResponse ? (
                    showRawResponse ? (
                      <pre className="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap">
                        {log.rawResponse}
                      </pre>
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {aiLlmLogsService.truncateText(log.rawResponse, 500)}
                        {log.rawResponse.length > 500 && (
                          <button
                            onClick={() => setShowRawResponse(true)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-2"
                          >
                            Show more...
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No response content available</p>
                  )}
                </div>
              </div>

              {/* Response Timing */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Response Timing</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Response Time</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {log.responseTimestamp ? aiLlmLogsService.formatTimestamp(log.responseTimestamp) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {aiLlmLogsService.formatDuration(log.durationMs)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Output Tokens</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {aiLlmLogsService.formatTokenCount(log.outputTokens)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Provider Metadata</h4>
              
              {/* Provider-specific metadata */}
              {log.providerMetadata && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Provider-Specific Data</h5>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                    {formatJSON(log.providerMetadata)}
                  </pre>
                </div>
              )}

              {/* System metadata */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">System Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Log ID</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{log.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Organization ID</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{log.organizationId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Provider ID</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{log.providerId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">HTTP Status Code</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{log.httpStatusCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                    <p className="text-sm text-gray-900 dark:text-white">{aiLlmLogsService.formatTimestamp(log.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</label>
                    <p className="text-sm text-gray-900 dark:text-white">{aiLlmLogsService.formatTimestamp(log.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Configuration snapshot */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Configuration Snapshot</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Max Tokens</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.maxTokens || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Token Window</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.tokenWindow || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Temperature</label>
                    <p className="text-sm text-gray-900 dark:text-white">{log.temperature || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Provider URL</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono break-all">{log.providerUrl}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {aiLlmLogsService.formatTimestamp(log.updatedAt)}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMLogDetailsModal;