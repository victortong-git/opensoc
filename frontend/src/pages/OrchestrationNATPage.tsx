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
  X
} from 'lucide-react';

interface NATServerStatus {
  isHealthy: boolean;
  serverName: string;
  containerStatus: 'running' | 'stopped' | 'error' | 'unknown';
  containerHealth: string;
  lastChecked: Date;
  endpoint: string;
  error?: string;
}

interface NATWorkflow {
  name: string;
  description: string;
  type: 'function' | 'workflow';
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

const OrchestrationNATPage: React.FC = () => {
  const [natStatus, setNatStatus] = useState<NATServerStatus>({
    isHealthy: false,
    serverName: '',
    containerStatus: 'stopped',
    containerHealth: 'unknown',
    lastChecked: new Date(),
    endpoint: ''
  });
  const [availableWorkflows, setAvailableWorkflows] = useState<NATWorkflow[]>([]);
  const [workflowsSource, setWorkflowsSource] = useState<'nat' | 'none'>('none');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingCalculation, setIsTestingCalculation] = useState(false);
  const [isRefreshingTools, setIsRefreshingTools] = useState(false);
  const [calculationInput, setCalculationInput] = useState('Calculate 15 * 8 + 23');
  const [testingTools, setTestingTools] = useState<Set<string>>(new Set());
  const [requestInProgress, setRequestInProgress] = useState<Set<string>>(new Set());
  const [isTestingVirusTotal, setIsTestingVirusTotal] = useState(false);
  const [virusTotalInput, setVirusTotalInput] = useState('');
  const [virusTotalTestType, setVirusTotalTestType] = useState<'hash' | 'url' | 'domain'>('hash');
  const initializedonRef = useRef(false);

  // Fetch workflows directly from NAT server using HTTP API
  const fetchNATWorkflows = async () => {
    if (requestInProgress.has('workflows')) {
      console.log('🔄 Workflows request already in progress, skipping...');
      return;
    }
    
    setRequestInProgress(prev => new Set(prev).add('workflows'));
    setIsRefreshingTools(true);
    try {
      const response = await fetch('/api/orchestration/nat/workflows', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 500) {
          console.warn('⚠️ NAT server temporarily unavailable (500 error) - retrying...');
          // Brief retry for 500 errors
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryResponse = await fetch('/api/orchestration/nat/workflows');
          if (!retryResponse.ok) {
            throw new Error(`Server error: ${retryResponse.status}`);
          }
          const retryData = await retryResponse.json();
          if (retryData.success && retryData.workflows) {
            setAvailableWorkflows(retryData.workflows);
            setWorkflowsSource('nat');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.workflows) {
        setAvailableWorkflows(data.workflows);
        setWorkflowsSource('nat');
        console.log(`✅ Loaded ${data.workflows.length} workflows from NAT server`);
      } else {
        console.error('Failed to fetch NAT workflows:', data.error);
        setWorkflowsSource('none');
        setAvailableWorkflows([]);
      }
    } catch (error) {
      console.error('Failed to fetch NAT workflows:', error.message);
      setWorkflowsSource('none');
      setAvailableWorkflows([]);
      
      // Add user-friendly error to test results
      setTestResults(prev => [...prev, {
        testName: 'Workflow Discovery',
        status: 'error',
        message: `Failed to load workflows: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsRefreshingTools(false);
      setRequestInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete('workflows');
        return newSet;
      });
    }
  };

  // Fetch NAT server status
  const fetchNATStatus = async () => {
    if (requestInProgress.has('status')) {
      console.log('🔄 Status request already in progress, skipping...');
      return;
    }
    
    setRequestInProgress(prev => new Set(prev).add('status'));
    setIsLoading(true);
    try {
      const response = await fetch('/api/orchestration/nat/status');
      const data = await response.json();
      
      setNatStatus({
        isHealthy: data.isHealthy,
        serverName: data.serverName || 'NVIDIA NAT Server',
        containerStatus: data.containerStatus,
        containerHealth: data.containerHealth || 'unknown',
        lastChecked: new Date(),
        endpoint: data.endpoint || 'http://localhost:8000',
        error: data.error
      });

      // Try to get real-time workflows from NAT server (but don't fail status if this times out)
      try {
        await fetchNATWorkflows();
      } catch (workflowError) {
        console.warn('Workflow discovery failed but continuing with status check:', workflowError);
        setAvailableWorkflows([]);
        setWorkflowsSource('none');
      }
      
      // Per coding_practice.md: no fallback mechanisms allowed - NAT must work or fail
    } catch (error) {
      setNatStatus({
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


  // Test calculation agent via NAT
  const testCalculationAgent = async () => {
    setIsTestingCalculation(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/nat/test-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: calculationInput })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: 'Calculation Test Agent',
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
        testName: 'Calculation Test Agent',
        status: 'error',
        message: `Connection failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsTestingCalculation(false);
    }
  };

  // Test connection to NAT server
  const testConnection = async () => {
    setIsTestingConnection(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/nat/test-connection', {
        method: 'POST'
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: 'NAT Connection Test',
        status: data.success ? 'success' : 'error',
        message: data.message || data.error || 'No response',
        timestamp: new Date(),
        duration
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const result: TestResult = {
        testName: 'NAT Connection Test',
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

  // Test VirusTotal analyzer via NAT
  const testVirusTotalAnalyzer = async () => {
    setIsTestingVirusTotal(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/nat/test-virustotal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: virusTotalInput || undefined,
          testType: virusTotalTestType
        })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: `VirusTotal ${virusTotalTestType.toUpperCase()} Analysis`,
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
        testName: `VirusTotal ${virusTotalTestType.toUpperCase()} Analysis`,
        status: 'error',
        message: `Connection failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsTestingVirusTotal(false);
    }
  };

  // Test any NAT workflow
  const testNATWorkflow = async (workflowName: string, inputMessage: string) => {
    setTestingTools(prev => new Set(prev).add(workflowName));
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/orchestration/nat/test-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowName, 
          inputMessage,
          timeout: 300 
        })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: `${workflowName} Test`,
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
        testName: `${workflowName} Test`,
        status: 'error',
        message: `Workflow test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setTestingTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(workflowName);
        return newSet;
      });
    }
  };

  // Auto-refresh status and tools every 30 seconds with error backoff
  useEffect(() => {
    // Prevent double initialization in React.StrictMode
    if (initializedonRef.current) {
      return;
    }
    initializedonRef.current = true;
    
    let consecutiveErrors = 0;
    
    const fetchWithBackoff = async () => {
      try {
        await fetchNATStatus();
        await fetchNATWorkflows();
        consecutiveErrors = 0; // Reset on success
      } catch (error) {
        consecutiveErrors++;
        console.warn(`NAT fetch failed (attempt ${consecutiveErrors}):`, error);
        
        // Stop auto-refresh after 3 consecutive failures to prevent console spam
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
      initializedonRef.current = false; // Reset for cleanup
    };
  }, []);

  const getStatusIcon = (status: NATServerStatus['containerStatus']) => {
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

  const getStatusColor = (status: NATServerStatus['containerStatus']) => {
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
          <Network className="h-8 w-8 text-opensoc-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">NVIDIA NAT Integration</h1>
            <p className="text-slate-400">NVIDIA NeMo Agent Toolkit orchestration and automation</p>
          </div>
        </div>
        
        {/* Overview */}
        <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2 text-opensoc-400" />
            NVIDIA NeMo Agent Toolkit Integration
          </h2>
          <p className="text-slate-300 leading-relaxed">
            OpenSOC leverages <strong>NVIDIA NeMo Agent Toolkit (NAT)</strong> to provide advanced orchestration 
            and automation capabilities. Through direct HTTP API integration, OpenSOC communicates with AI agents 
            and automation workflows powered by NVIDIA's enterprise-grade agent framework using NAT's native API endpoints.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <a 
              href="https://docs.nvidia.com/nemo/agent-toolkit/latest/quick-start/launching-ui.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-opensoc-400 hover:text-opensoc-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              NVIDIA NAT API Documentation
            </a>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Version: NAT 1.2.1</span>
          </div>
        </div>
      </div>

      {/* NAT Server Status */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Server className="h-5 w-5 mr-2 text-opensoc-400" />
              NAT Server Status
            </h2>
            <button
              onClick={fetchNATStatus}
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
                {natStatus.isHealthy ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className={`font-medium ${natStatus.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                {natStatus.isHealthy ? 'Healthy' : 'Unhealthy'}
              </div>
              {natStatus.serverName && (
                <div className="text-xs text-slate-500 mt-1">{natStatus.serverName}</div>
              )}
            </div>

            {/* Container Status */}
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Container Status</span>
                {getStatusIcon(natStatus.containerStatus)}
              </div>
              <div className={`font-medium ${getStatusColor(natStatus.containerStatus)}`}>
                {natStatus.containerStatus === 'running' ? 'Running' : 
                 natStatus.containerStatus === 'stopped' ? 'Stopped' :
                 natStatus.containerStatus === 'error' ? 'Error' : 'Unknown'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                nvidia-nat ({natStatus.containerHealth})
              </div>
            </div>

            {/* Last Checked */}
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Last Checked</span>
                <Activity className="h-5 w-5 text-slate-400" />
              </div>
              <div className="font-medium text-white">
                {natStatus.lastChecked.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {Math.round((Date.now() - natStatus.lastChecked.getTime()) / 1000)}s ago
              </div>
            </div>
          </div>

          {/* Error Message */}
          {natStatus.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-medium">NAT Server Error</h4>
                  <p className="text-red-300 text-sm mt-1">{natStatus.error}</p>
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
            <Terminal className="h-5 w-5 mr-2 text-opensoc-400" />
            MCP Test Functions
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Test MCP server connectivity and agent functionality
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
                  Testing Connection...
                </>
              ) : (
                <>
                  <Network className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </button>
            
            <button
              onClick={testCalculationAgent}
              disabled={isTestingCalculation || !natStatus.isHealthy}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingCalculation ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Calculation...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Send Calculation Test
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
              Calculation Test Input
            </label>
            <input
              type="text"
              value={calculationInput}
              onChange={(e) => setCalculationInput(e.target.value)}
              placeholder="e.g., Calculate 15 * 8 + 23 or What is 42 + 17?"
              className="w-full bg-soc-dark-900 border border-soc-dark-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-opensoc-400 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a calculation request to test the AI agent's tool-calling capability
            </p>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Recent Test Results</h3>
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
                    
                    {/* AI Response Highlight for Calculation Tests */}
                    {result.testName === 'Calculation Test Agent' && result.rawOutput && (
                      <div className="mt-4 space-y-4">
                        {/* Extract and highlight the actual AI calculation result */}
                        {(() => {
                          const aiResponseMatch = result.rawOutput.match(/🤖 ACTUAL AI RESPONSE from NVIDIA NAT \+ Ollama:\s*([^\n]+(?:\n(?!✅)[^\n]+)*)/s);
                          if (aiResponseMatch) {
                            return (
                              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                  <span className="text-blue-400 font-semibold text-lg">🤖 AI Calculation Result</span>
                                </div>
                                <div className="bg-black/40 rounded-lg p-4 border border-blue-500/20">
                                  <p className="text-white text-lg font-mono leading-relaxed whitespace-pre-wrap">
                                    {aiResponseMatch[1].trim()}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Collapsible Technical Details */}
                        <details className="group">
                          <summary className="cursor-pointer flex items-center justify-between p-3 bg-soc-dark-800/40 rounded-lg border border-soc-dark-600 hover:bg-soc-dark-800/60 transition-colors">
                            <span className="text-sm font-medium text-slate-300">Technical Details & Full Output</span>
                            <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="mt-3 space-y-3">
                            <div className="bg-soc-dark-900/60 rounded-lg border border-soc-dark-600 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-300">Complete AI Test Results</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(result.rawOutput || '')}
                                  className="text-sm text-slate-400 hover:text-slate-300 px-3 py-1 rounded bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors"
                                >
                                  Copy All
                                </button>
                              </div>
                              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded border border-soc-dark-700 max-h-80 overflow-auto">
                                {result.rawOutput}
                              </pre>
                            </div>
                            
                            {/* Raw NAT Agent Response */}
                            {result.fullResponse && result.fullResponse !== result.rawOutput && (
                              <div className="bg-soc-dark-800/40 rounded-lg border border-soc-dark-600 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-slate-300">Raw NAT Agent Debug Output</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(result.fullResponse || '')}
                                    className="text-sm text-slate-400 hover:text-slate-300 px-3 py-1 rounded bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors"
                                  >
                                    Copy Debug
                                  </button>
                                </div>
                                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded border border-soc-dark-700 max-h-80 overflow-auto">
                                  {result.fullResponse}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                    
                    {/* Connection Test and Other Test Types */}
                    {result.testName !== 'Calculation Test Agent' && (
                      <div className="mt-4">
                        {result.rawOutput && result.rawOutput !== result.message && result.rawOutput.length > 10 && (
                          <details className="group">
                            <summary className="cursor-pointer flex items-center justify-between p-3 bg-soc-dark-800/40 rounded-lg border border-soc-dark-600 hover:bg-soc-dark-800/60 transition-colors">
                              <span className="text-sm font-medium text-slate-300">Technical Details</span>
                              <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="mt-3 bg-soc-dark-900/60 rounded-lg border border-soc-dark-600 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-300">Raw Output</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(result.rawOutput || '')}
                                  className="text-sm text-slate-400 hover:text-slate-300 px-3 py-1 rounded bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded border border-soc-dark-700 max-h-64 overflow-auto">
                                {result.rawOutput}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
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
            <Activity className="h-5 w-5 mr-2 text-opensoc-400" />
            VirusTotal Analysis Testing
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Test VirusTotal analyzer with sample safe data
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Test Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Test Type
              </label>
              <select
                value={virusTotalTestType}
                onChange={(e) => setVirusTotalTestType(e.target.value as 'hash' | 'url' | 'domain')}
                className="w-full bg-soc-dark-900 border border-soc-dark-600 rounded px-3 py-2 text-white focus:border-opensoc-400 focus:outline-none"
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
              <div className="space-y-2">
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
            </div>

            <div className="bg-soc-dark-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Action
              </label>
              <button
                onClick={testVirusTotalAnalyzer}
                disabled={isTestingVirusTotal || !natStatus.isHealthy}
                className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingVirusTotal ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test VirusTotal
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
              placeholder={`Enter ${virusTotalTestType} to analyze (leave empty to use safe sample)`}
              className="w-full bg-soc-dark-900 border border-soc-dark-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-opensoc-400 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave empty to use safe sample data. Custom input will be analyzed by VirusTotal.
            </p>
          </div>
        </div>
      </div>

      {/* Available Tools */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg">
        <div className="p-6 border-b border-soc-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-opensoc-400" />
                Available NAT Workflows
              </h2>
              <div className="flex items-center space-x-3">
                <p className="text-slate-400 text-sm mt-1">
                  AI workflows and functions available via NAT HTTP API
                </p>
                {workflowsSource === 'nat' && (
                  <span className="inline-block px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 mt-1">
                    Live NAT Discovery
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={fetchNATWorkflows}
              disabled={isRefreshingTools}
              className="btn-secondary text-sm"
              title="Refresh workflows from NAT server"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingTools ? 'animate-spin' : ''}`} />
              {isRefreshingTools ? 'Discovering...' : 'Refresh Workflows'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {availableWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <Network className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No NAT workflows discovered</p>
              <p className="text-slate-500 text-sm">
                {natStatus.isHealthy ? 'Click "Refresh Workflows" to discover available workflows' : 'NAT server must be healthy to discover workflows'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-sm">
                  Showing {availableWorkflows.length} workflows 
                  {workflowsSource === 'nat' && <span className="text-green-400 ml-1">(discovered via NAT API)</span>}
                </p>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableWorkflows.map((workflow, index) => (
                <div
                  key={index}
                  className="bg-soc-dark-800/30 rounded-lg p-4 border border-soc-dark-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{workflow.name}</h4>
                      <p className="text-slate-400 text-sm mt-1">{workflow.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          workflow.type === 'function' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {workflow.type}
                        </span>
                        {(workflow as any).category && (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-opensoc-500/20 text-opensoc-400">
                            {(workflow as any).category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {workflow.status === 'available' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Workflow Testing Interface */}
                  <div className="pt-3 border-t border-soc-dark-600">
                    <button
                      onClick={() => {
                        if (workflow.name === 'code_execution') {
                          // Use calculation input for code execution
                          testNATWorkflow(workflow.name, calculationInput);
                        } else if (workflow.name === 'current_datetime') {
                          // Request current date and time
                          testNATWorkflow(workflow.name, 'What is the current date and time?');
                        } else if (workflow.name === 'virustotal_analyzer') {
                          // Use sample hash for VirusTotal
                          testNATWorkflow(workflow.name, 'Analyze this hash using VirusTotal: da39a3ee5e6b4b0d3255bfef95601890afd80709');
                        } else {
                          // Use generic test message for other workflows
                          testNATWorkflow(workflow.name, 'Test request from OpenSOC NAT client');
                        }
                      }}
                      disabled={testingTools.has(workflow.name) || !natStatus.isHealthy}
                      className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingTools.has(workflow.name) ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Testing {workflow.name}...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-2" />
                          Test Workflow via NAT
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
            <Info className="h-5 w-5 mr-2 text-opensoc-400" />
            Technical Details
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">NAT Server Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-white font-mono">http://localhost:8000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API Endpoint:</span>
                  <span className="text-white font-mono">/generate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocol:</span>
                  <span className="text-white">HTTP API (JSON)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Container:</span>
                  <span className="text-white">agentic-soc-nvidia-nat</span>
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
                  <span className="text-white">OpenSOC NAT Client</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Use Case:</span>
                  <span className="text-white">SOC Automation & AI Agents</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-soc-dark-800/30 rounded-lg">
            <h4 className="text-white font-medium mb-2">About NAT Integration</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              The NVIDIA NeMo Agent Toolkit HTTP API enables seamless communication between OpenSOC and AI workflows 
              running in the NAT framework. This allows for sophisticated automation workflows, 
              real-time threat analysis, and intelligent incident response powered by enterprise-grade 
              AI models while maintaining security and scalability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrchestrationNATPage;