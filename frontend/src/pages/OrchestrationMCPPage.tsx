import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Play, 
  Activity,
  AlertTriangle,
  Info,
  Terminal,
  ExternalLink,
  X,
  Zap
} from 'lucide-react';

interface MCPServerStatus {
  isHealthy: boolean;
  serverName: string;
  containerStatus: 'running' | 'stopped' | 'error' | 'unknown';
  containerHealth: string;
  lastChecked: Date;
  endpoint: string;
  error?: string;
}

interface MCPTool {
  name: string;
  description: string;
  type: 'function';
  status: 'available' | 'error';
}

interface TestResult {
  testName: string;
  status: 'success' | 'error' | 'running';
  message: string;
  timestamp: Date;
  duration?: number;
  rawOutput?: string;
  fullResponse?: string;
}

const OrchestrationMCPPage: React.FC = () => {
  const [mcpStatus, setMcpStatus] = useState<MCPServerStatus>({
    isHealthy: false,
    serverName: '',
    containerStatus: 'stopped',
    containerHealth: 'unknown',
    lastChecked: new Date(),
    endpoint: ''
  });
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [toolsSource, setToolsSource] = useState<'mcp' | 'none'>('none');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingCalculation, setIsTestingCalculation] = useState(false);
  const [isRefreshingTools, setIsRefreshingTools] = useState(false);
  const [calculationInput, setCalculationInput] = useState('Calculate 25 * 4 + 10');
  const [testingTools, setTestingTools] = useState<Set<string>>(new Set());
  const [requestInProgress, setRequestInProgress] = useState<Set<string>>(new Set());
  const [isTestingVirusTotal, setIsTestingVirusTotal] = useState(false);
  const [virusTotalInput, setVirusTotalInput] = useState('');
  const [virusTotalTestType, setVirusTotalTestType] = useState<'hash' | 'url' | 'domain'>('hash');
  const initializedonRef = useRef(false);

  // Fetch tools directly from MCP server using HTTP API
  const fetchMCPTools = async () => {
    if (requestInProgress.has('tools')) {
      console.log('🔄 Tools request already in progress, skipping...');
      return;
    }
    
    setRequestInProgress(prev => new Set(prev).add('tools'));
    setIsRefreshingTools(true);
    try {
      const response = await fetch('/api/orchestration/mcp/workflows', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        if (response.status === 500) {
          console.warn('⚠️ MCP server temporarily unavailable (500 error) - retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryResponse = await fetch('/api/orchestration/mcp/workflows');
          if (!retryResponse.ok) {
            throw new Error(`Server error: ${retryResponse.status}`);
          }
          const retryData = await retryResponse.json();
          if (retryData.success && retryData.workflows) {
            setAvailableTools(retryData.workflows);
            setToolsSource('mcp');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.workflows) {
        setAvailableTools(data.workflows);
        setToolsSource('mcp');
        console.log(`✅ Loaded ${data.workflows.length} MCP tools`);
      } else {
        console.error('Failed to fetch MCP tools:', data.error);
        setToolsSource('none');
        setAvailableTools([]);
      }
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error.message);
      setToolsSource('none');
      setAvailableTools([]);
      
      setTestResults(prev => [...prev, {
        testName: 'MCP Tool Discovery',
        status: 'error',
        message: `Failed to load MCP tools: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsRefreshingTools(false);
      setRequestInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete('tools');
        return newSet;
      });
    }
  };

  // Fetch MCP server status
  const fetchMCPStatus = async () => {
    if (requestInProgress.has('status')) {
      console.log('🔄 Status request already in progress, skipping...');
      return;
    }
    
    setRequestInProgress(prev => new Set(prev).add('status'));
    setIsLoading(true);
    try {
      const response = await fetch('/api/orchestration/mcp/status');
      const data = await response.json();
      
      setMcpStatus({
        isHealthy: data.isHealthy,
        serverName: data.serverName || 'OpenSOC NAT MCP Server',
        containerStatus: data.containerStatus,
        containerHealth: data.containerHealth || 'unknown',
        lastChecked: new Date(),
        endpoint: data.endpoint || 'http://localhost:9901',
        error: data.error
      });

      try {
        await fetchMCPTools();
      } catch (toolError) {
        console.warn('Tool discovery failed but continuing with status check:', toolError);
        setAvailableTools([]);
        setToolsSource('none');
      }
      
    } catch (error) {
      setMcpStatus({
        isHealthy: false,
        serverName: 'Unknown',
        containerStatus: 'error',
        containerHealth: 'error',
        lastChecked: new Date(),
        endpoint: 'Unknown',
        error: 'Failed to connect to backend'
      });
    } finally {
      setIsLoading(false);
      setRequestInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete('status');
        return newSet;
      });
    }
  };

  // Test calculation via MCP
  const testCalculationAgent = async () => {
    setIsTestingCalculation(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/mcp/test-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: calculationInput })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      // Handle both successful and error responses properly
      const result: TestResult = {
        testName: 'MCP Calculation Test',
        status: response.ok && data.success ? 'success' : 'error',
        message: response.ok ? (data.message || data.error || 'No response') : `HTTP ${response.status}: ${data.message || data.error || 'Server error'}`,
        timestamp: new Date(),
        duration,
        rawOutput: data.rawOutput || data.error,
        fullResponse: data
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName: 'MCP Calculation Test',
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : error}`,
        timestamp: new Date(),
        duration
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsTestingCalculation(false);
    }
  };

  // Test connection to MCP server
  const testConnection = async () => {
    setIsTestingConnection(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/mcp/test-connection', {
        method: 'POST'
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: 'MCP Connection Test',
        status: data.success ? 'success' : 'error',
        message: data.message || data.error || 'No response',
        timestamp: new Date(),
        duration
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const result: TestResult = {
        testName: 'MCP Connection Test',
        status: 'error',
        message: `Connection failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Test VirusTotal analyzer via MCP
  const testVirusTotalAnalyzer = async () => {
    setIsTestingVirusTotal(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/mcp/test-virustotal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ioc: virusTotalInput || undefined,
          analysis_type: virusTotalTestType
        })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      // Handle both successful and error responses properly
      const result: TestResult = {
        testName: `MCP VirusTotal ${virusTotalTestType.toUpperCase()} Analysis`,
        status: response.ok && data.success ? 'success' : 'error',
        message: response.ok ? (data.message || data.error || 'No response') : `HTTP ${response.status}: ${data.message || data.error || 'Server error'}`,
        timestamp: new Date(),
        duration,
        rawOutput: data.rawOutput || data.error,
        fullResponse: data
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName: `MCP VirusTotal ${virusTotalTestType.toUpperCase()} Analysis`,
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : error}`,
        timestamp: new Date(),
        duration
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsTestingVirusTotal(false);
    }
  };

  // Test any MCP tool
  const testMCPTool = async (toolName: string, inputMessage: string) => {
    setTestingTools(prev => new Set(prev).add(toolName));
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/mcp/test-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowName: toolName, 
          inputMessage,
          timeout: 300 
        })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: `MCP ${toolName} Test`,
        status: data.success ? 'success' : 'error',
        message: data.message || data.error || 'No response',
        timestamp: new Date(),
        duration,
        rawOutput: data.rawOutput,
        fullResponse: data.fullResponse
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const result: TestResult = {
        testName: `MCP ${toolName} Test`,
        status: 'error',
        message: `Tool test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setTestingTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(toolName);
        return newSet;
      });
    }
  };

  // Auto-refresh status and tools every 30 seconds with error backoff
  useEffect(() => {
    if (initializedonRef.current) {
      return;
    }
    initializedonRef.current = true;
    
    let consecutiveErrors = 0;
    
    const fetchWithBackoff = async () => {
      try {
        await fetchMCPStatus();
        await fetchMCPTools();
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        console.warn(`MCP fetch failed (attempt ${consecutiveErrors}):`, error);
        
        if (consecutiveErrors >= 3) {
          console.warn('Stopping auto-refresh due to consecutive failures');
          clearInterval(interval);
        }
      }
    };
    
    fetchWithBackoff();
    const interval = setInterval(fetchWithBackoff, 30000);
    return () => {
      clearInterval(interval);
      initializedonRef.current = false;
    };
  }, []);

  const getStatusIcon = (status: MCPServerStatus['containerStatus']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'stopped':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'unknown':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: MCPServerStatus['containerStatus']) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'stopped': return 'text-red-400'; 
      case 'error': return 'text-orange-400';
      case 'unknown': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">NVIDIA NAT MCP Integration</h1>
            <p className="text-slate-400">Model Control Protocol (MCP) server integration with NVIDIA NeMo Agent Toolkit</p>
          </div>
        </div>
        
        {/* Overview */}
        <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2 text-purple-400" />
            NVIDIA NAT MCP Server Integration
          </h2>
          <p className="text-slate-300 leading-relaxed">
            OpenSOC integrates with <strong>NVIDIA NeMo Agent Toolkit (NAT)</strong> via the <strong>Model Control Protocol (MCP)</strong> 
            to provide standardized AI agent communication. This MCP server exposes NAT workflows as structured tools that can be 
            discovered and invoked by MCP-compatible clients, enabling advanced orchestration capabilities through the MCP protocol.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <a 
              href="https://docs.nvidia.com/nemo/agent-toolkit/latest/workflows/mcp/mcp-server.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              NVIDIA NAT MCP Documentation
            </a>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Protocol: MCP v1.0</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Port: 9901</span>
          </div>
        </div>
      </div>

      {/* MCP Server Status */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Server className="h-5 w-5 mr-2 text-purple-400" />
              MCP Server Status
            </h2>
            <button
              onClick={fetchMCPStatus}
              disabled={isLoading}
              className="btn-secondary text-sm"
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Server Health */}
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Server Health</span>
                {mcpStatus.isHealthy ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className={`font-medium ${mcpStatus.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                {mcpStatus.isHealthy ? 'Healthy' : 'Unhealthy'}
              </div>
              {mcpStatus.serverName && (
                <div className="text-xs text-slate-500 mt-1">{mcpStatus.serverName}</div>
              )}
            </div>

            {/* Container Status */}
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Container Status</span>
                {getStatusIcon(mcpStatus.containerStatus)}
              </div>
              <div className={`font-medium ${getStatusColor(mcpStatus.containerStatus)}`}>
                {mcpStatus.containerStatus === 'running' ? 'Running' : 
                 mcpStatus.containerStatus === 'stopped' ? 'Stopped' :
                 mcpStatus.containerStatus === 'error' ? 'Error' : 'Unknown'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                nvidia-nat-mcp ({mcpStatus.containerHealth})
              </div>
            </div>

            {/* Last Checked */}
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Last Checked</span>
                <Activity className="h-5 w-5 text-slate-400" />
              </div>
              <div className="font-medium text-white">
                {mcpStatus.lastChecked.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {Math.round((Date.now() - mcpStatus.lastChecked.getTime()) / 1000)}s ago
              </div>
            </div>
          </div>

          {/* Error Message */}
          {mcpStatus.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-medium">MCP Server Error</h4>
                  <p className="text-red-300 text-sm mt-1">{mcpStatus.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Functions */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Terminal className="h-5 w-5 mr-2 text-purple-400" />
            MCP Protocol Test Functions
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Test MCP server connectivity and tool functionality via Model Control Protocol
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Test Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing MCP Connection...
                </>
              ) : (
                <>
                  <Network className="h-4 w-4 mr-2" />
                  Test MCP Connection
                </>
              )}
            </button>
            
            <button
              onClick={testCalculationAgent}
              disabled={isTestingCalculation || !mcpStatus.isHealthy}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingCalculation ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing via MCP...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Send MCP Calculation Test
                </>
              )}
            </button>
            
            {testResults.length > 0 && (
              <button
                onClick={() => setTestResults([])}
                className="btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Results
              </button>
            )}
          </div>
          
          {/* Calculation Input */}
          <div className="bg-soc-dark-800/30 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              MCP Calculation Test Input
            </label>
            <input
              type="text"
              value={calculationInput}
              onChange={(e) => setCalculationInput(e.target.value)}
              placeholder="e.g., Calculate 25 * 4 + 10 or What is 50 - 12?"
              className="w-full bg-soc-dark-900 border border-soc-dark-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a calculation request to test MCP protocol tool calling
            </p>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Recent MCP Test Results</h3>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success' 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : result.status === 'error'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-yellow-500/10 border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : result.status === 'error' ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : (
                          <RefreshCw className="h-5 w-5 text-yellow-400 animate-spin" />
                        )}
                        <span className={`text-lg font-semibold ${
                          result.status === 'success' ? 'text-green-400' :
                          result.status === 'error' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {result.testName}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 font-mono">
                        {result.timestamp.toLocaleTimeString()}
                        {result.duration && ` (${result.duration}ms)`}
                      </div>
                    </div>
                    
                    {/* Summary Message */}
                    <div className={`mb-4 p-3 rounded-lg bg-opacity-20 ${
                      result.status === 'success' ? 'bg-green-500 border border-green-500/30' :
                      result.status === 'error' ? 'bg-red-500 border border-red-500/30' : 'bg-yellow-500 border border-yellow-500/30'
                    }`}>
                      <p className={`text-base leading-relaxed ${
                        result.status === 'success' ? 'text-green-200' :
                        result.status === 'error' ? 'text-red-200' : 'text-yellow-200'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                    
                    {/* MCP Response Details */}
                    {result.rawOutput && (
                      <details className="group">
                        <summary className="cursor-pointer flex items-center justify-between p-3 bg-soc-dark-800/40 rounded-lg border border-soc-dark-600 hover:bg-soc-dark-800/60 transition-colors">
                          <span className="text-sm font-medium text-slate-300">MCP Protocol Response Details</span>
                          <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="mt-3 bg-soc-dark-900/60 rounded-lg border border-soc-dark-600 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-300">MCP Tool Response</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(result.rawOutput || '')}
                              className="text-sm text-slate-400 hover:text-slate-300 px-3 py-1 rounded bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors"
                            >
                              Copy Response
                            </button>
                          </div>
                          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded border border-soc-dark-700 max-h-80 overflow-auto">
                            {result.rawOutput}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VirusTotal Testing */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-400" />
            MCP VirusTotal Analysis Testing
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Test VirusTotal analyzer tool via MCP protocol
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Test Type
              </label>
              <select
                value={virusTotalTestType}
                onChange={(e) => setVirusTotalTestType(e.target.value as 'hash' | 'url' | 'domain')}
                className="w-full bg-soc-dark-900 border border-soc-dark-600 rounded px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="hash">File Hash (SHA1)</option>
                <option value="url">URL</option>
                <option value="domain">Domain</option>
              </select>
            </div>

            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Sample Data
              </label>
              <button
                onClick={() => {
                  const samples = {
                    hash: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
                    url: 'https://www.google.com',
                    domain: 'google.com'
                  };
                  setVirusTotalInput(samples[virusTotalTestType]);
                }}
                className="w-full btn-secondary text-sm"
              >
                Use Safe Sample
              </button>
            </div>

            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Action
              </label>
              <button
                onClick={testVirusTotalAnalyzer}
                disabled={isTestingVirusTotal || !mcpStatus.isHealthy}
                className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingVirusTotal ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing via MCP...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test MCP VirusTotal
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Custom Input */}
          <div className="bg-soc-dark-800/30 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Custom Input (Optional)
            </label>
            <input
              type="text"
              value={virusTotalInput}
              onChange={(e) => setVirusTotalInput(e.target.value)}
              placeholder={`Enter ${virusTotalTestType} to analyze via MCP (leave empty to use safe sample)`}
              className="w-full bg-soc-dark-900 border border-soc-dark-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave empty to use safe sample data. Analysis performed via MCP protocol.
            </p>
          </div>
        </div>
      </div>

      {/* Available MCP Tools */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-400" />
                Available MCP Tools
              </h2>
              <div className="flex items-center space-x-3">
                <p className="text-slate-400 text-sm mt-1">
                  NAT tools published via Model Control Protocol
                </p>
                {toolsSource === 'mcp' && (
                  <span className="inline-block px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 mt-1">
                    MCP Discovery
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={fetchMCPTools}
              disabled={isRefreshingTools}
              className="btn-secondary text-sm"
              title="Refresh MCP tools"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingTools ? 'animate-spin' : ''}`} />
              {isRefreshingTools ? 'Discovering...' : 'Refresh Tools'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {availableTools.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No MCP tools discovered</p>
              <p className="text-slate-500 text-sm">
                {mcpStatus.isHealthy ? 'Click "Refresh Tools" to discover available MCP tools' : 'MCP server must be healthy to discover tools'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-sm">
                  Showing {availableTools.length} MCP tools 
                  {toolsSource === 'mcp' && <span className="text-purple-400 ml-1">(discovered via MCP protocol)</span>}
                </p>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTools.map((tool, index) => (
                <div
                  key={index}
                  className="bg-soc-dark-800/30 rounded-lg p-4 border border-soc-dark-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{tool.name}</h4>
                      <p className="text-slate-400 text-sm mt-1">{tool.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="inline-block px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                          MCP Tool
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {tool.status === 'available' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Tool Testing Interface */}
                  <div className="pt-3 border-t border-soc-dark-600">
                    <button
                      onClick={() => {
                        if (tool.name === 'code_execution') {
                          testMCPTool(tool.name, calculationInput);
                        } else if (tool.name === 'current_datetime') {
                          testMCPTool(tool.name, 'What is the current date and time?');
                        } else if (tool.name === 'virustotal_analyzer') {
                          testMCPTool(tool.name, 'Analyze this hash using VirusTotal: da39a3ee5e6b4b0d3255bfef95601890afd80709');
                        } else {
                          testMCPTool(tool.name, 'Test request from OpenSOC MCP client');
                        }
                      }}
                      disabled={testingTools.has(tool.name) || !mcpStatus.isHealthy}
                      className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingTools.has(tool.name) ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Testing {tool.name} via MCP...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-2" />
                          Test MCP Tool
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Information */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Info className="h-5 w-5 mr-2 text-purple-400" />
            MCP Technical Details
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">MCP Server Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-white font-mono">http://localhost:9901</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Health Check:</span>
                  <span className="text-white font-mono">/health</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocol:</span>
                  <span className="text-white">Model Control Protocol (MCP)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Container:</span>
                  <span className="text-white">agentic-soc-nvidia-nat-mcp</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">Integration Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Framework:</span>
                  <span className="text-white">NVIDIA NeMo Agent Toolkit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LLM Provider:</span>
                  <span className="text-white">Ollama (gpt-oss:20b)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Role:</span>
                  <span className="text-white">OpenSOC MCP Client</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Use Case:</span>
                  <span className="text-white">Standardized AI Tool Access</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-soc-dark-800/30 rounded-lg">
            <h4 className="text-white font-medium mb-2">About MCP Integration</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              The Model Control Protocol (MCP) provides a standardized way for applications to securely connect to 
              AI models and tools. This MCP server implementation exposes NVIDIA NAT workflows as discoverable tools 
              that can be invoked through structured protocol messages, enabling seamless integration with MCP-compatible 
              clients and providing an alternative to direct HTTP API communication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrchestrationMCPPage;