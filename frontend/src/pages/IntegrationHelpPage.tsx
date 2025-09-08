import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code, 
  Copy, 
  ExternalLink, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Terminal,
  BookOpen,
  Zap,
  Shield,
  Activity,
  ArrowRight,
  Download,
  Settings
} from 'lucide-react';
import apiKeysService from '../services/apiKeysService';

const IntegrationHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [apiHelp, setApiHelp] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  useEffect(() => {
    // Fetch API documentation
    apiKeysService.getExternalApiHelp()
      .then(setApiHelp)
      .catch(console.error);
      
    // Fetch available API keys for all users
    const fetchApiKeys = async () => {
      setApiKeysLoading(true);
      try {
        const response = await apiKeysService.getApiKeys();
        setApiKeys(response.apiKeys || []);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
        setApiKeys([]); // Set empty array on error
      } finally {
        setApiKeysLoading(false);
      }
    };
    
    fetchApiKeys();
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Helper function to get the first active API key
  const getActiveApiKey = () => {
    const activeKey = apiKeys.find(key => key.isActive);
    return activeKey;
  };

  // Helper function to replace API key placeholders with real keys
  const replaceApiKeyPlaceholders = (code: string): string => {
    const activeKey = getActiveApiKey();
    if (!activeKey) return code;
    
    // Since we only have keyPrefix (not full key) for security reasons,
    // we show the prefix with explanation that user needs to regenerate to get full key
    const placeholderText = `${activeKey.keyPrefix}••••••••••••••••••••••••••••••••••  # Replace with your full API key`;
    
    return code
      .replace(/YOUR_API_KEY_HERE/g, placeholderText)
      .replace(/your_api_key_here/g, `"${placeholderText}"`)
      .replace(/your-api-key/g, placeholderText);
  };

  // Helper function to generate downloadable script content
  const generateDownloadableScript = (type: 'bash' | 'python' | 'javascript'): string => {
    const activeKey = getActiveApiKey();
    const apiKeyValue = activeKey ? `${activeKey.keyPrefix}••••••••••••••••••••••••••••••••••` : 'YOUR_API_KEY_HERE';
    const baseUrl = window.location.origin + '/api';
    
    switch (type) {
      case 'bash':
        return [
          '#!/bin/bash',
          '',
          '# OpenSOC API Integration Test Script',
          `# Generated: ${new Date().toLocaleDateString()}`,
          ...(activeKey ? [
            `# API Key: ${activeKey.name}`,
            '# IMPORTANT: Replace the masked API key below with your full key',
            '# Go to Settings → API Keys and regenerate your key to see the full value'
          ] : ['# Replace YOUR_API_KEY_HERE with your actual API key']),
          '',
          `API_BASE_URL="${baseUrl}"`,
          `API_KEY="${apiKeyValue}"`,
          '',
          'echo "🚀 Testing OpenSOC API Integration..."',
          '',
          '# Health Check',
          'echo "1. Health Check..."',
          'curl -s "$API_BASE_URL/external/health" \\',
          '  -H "Authorization: Bearer $API_KEY" | jq \'.\'',
          '',
          '# Create Test Alert',
          'echo "2. Creating test alert..."',
          'curl -s -X POST "$API_BASE_URL/external/alerts" \\',
          '  -H "Content-Type: application/json" \\',
          '  -H "Authorization: Bearer $API_KEY" \\',
          '  -d \'{"title": "Integration Test Alert", "description": "Test from integration script", "severity": 1, "sourceSystem": "Integration Test"}\'',
          '',
          'echo "✅ Integration test complete!"'
        ].join('\n');
        
      case 'python':
        return [
          '#!/usr/bin/env python3',
          '"""',
          'OpenSOC API Integration Script',
          `Generated: ${new Date().toLocaleDateString()}`,
          ...(activeKey ? [
            `API Key: ${activeKey.name}`,
            'IMPORTANT: Replace the masked API key below with your full key',
            'Go to Settings → API Keys and regenerate your key to see the full value'
          ] : ['Replace YOUR_API_KEY_HERE with your actual API key']),
          '"""',
          '',
          'import requests',
          'import json',
          'from datetime import datetime',
          '',
          '# Configuration',
          `API_KEY = "${apiKeyValue}"  # Replace with your full API key`,
          `BASE_URL = "${baseUrl}"`,
          '',
          'def test_opensoc_integration():',
          '    """Test OpenSOC API integration"""',
          '    headers = {',
          '        "Authorization": f"Bearer {API_KEY}",',
          '        "Content-Type": "application/json"',
          '    }',
          '    ',
          '    # Health Check',
          '    print("🚀 Testing OpenSOC API Integration...")',
          '    health_response = requests.get(f"{BASE_URL}/external/health", headers=headers)',
          '    print(f"Health Check: {health_response.status_code}")',
          '    ',
          '    # Create Test Alert',
          '    alert_data = {',
          '        "title": "Integration Test Alert",',
          '        "description": "Test from Python integration script",',
          '        "severity": 1,',
          '        "sourceSystem": "Python Integration Test"',
          '    }',
          '    ',
          '    alert_response = requests.post(f"{BASE_URL}/external/alerts", headers=headers, json=alert_data)',
          '    print(f"Create Alert: {alert_response.status_code}")',
          '    print("✅ Integration test complete!")',
          '',
          'if __name__ == "__main__":',
          '    test_opensoc_integration()'
        ].join('\n');
        
      case 'javascript':
        return [
          '#!/usr/bin/env node',
          '/**',
          ' * OpenSOC API Integration Script',
          ` * Generated: ${new Date().toLocaleDateString()}`,
          ...(activeKey ? [
            ` * API Key: ${activeKey.name}`,
            ' * IMPORTANT: Replace the masked API key below with your full key',
            ' * Go to Settings → API Keys and regenerate your key to see the full value'
          ] : [' * Replace YOUR_API_KEY_HERE with your actual API key']),
          ' */',
          '',
          'const axios = require(\'axios\');',
          '',
          '// Configuration',
          `const API_KEY = "${apiKeyValue}";  // Replace with your full API key`,
          `const BASE_URL = "${baseUrl}";`,
          '',
          'const headers = {',
          '    "Authorization": `Bearer ${API_KEY}`,',
          '    "Content-Type": "application/json"',
          '};',
          '',
          'async function testOpenSOCIntegration() {',
          '    console.log("🚀 Testing OpenSOC API Integration...");',
          '    ',
          '    try {',
          '        // Health Check',
          '        const healthResponse = await axios.get(`${BASE_URL}/external/health`, { headers });',
          '        console.log(`Health Check: ${healthResponse.status}`);',
          '        ',
          '        // Create Test Alert',
          '        const alertData = {',
          '            title: "Integration Test Alert",',
          '            description: "Test from JavaScript integration script",',
          '            severity: 1,',
          '            sourceSystem: "JavaScript Integration Test"',
          '        };',
          '        ',
          '        const alertResponse = await axios.post(`${BASE_URL}/external/alerts`, alertData, { headers });',
          '        console.log(`Create Alert: ${alertResponse.status}`);',
          '        console.log("✅ Integration test complete!");',
          '    } catch (error) {',
          '        console.error("❌ Integration test failed:", error.response?.data || error.message);',
          '    }',
          '}',
          '',
          'testOpenSOCIntegration();'
        ].join('\n');
        
      default:
        return '';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'endpoints', label: 'API Endpoints', icon: Globe },
    { id: 'examples', label: 'Code Examples', icon: Code },
    { id: 'testing', label: 'Testing', icon: Activity },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertTriangle }
  ];

  const TabButton: React.FC<{ tab: typeof tabs[0]; isActive: boolean }> = ({ tab, isActive }) => (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-opensoc-600 text-white'
          : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
      }`}
    >
      <tab.icon className="h-4 w-4" />
      <span>{tab.label}</span>
    </button>
  );

  const CodeBlock: React.FC<{ code: string; language: string; title?: string }> = ({ code, language, title }) => (
    <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2 bg-soc-dark-800 border-b border-soc-dark-700 flex items-center justify-between">
          <span className="text-slate-300 text-sm font-medium">{title}</span>
          <button
            onClick={() => copyToClipboard(code, title)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {copied === title ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${language} text-slate-300`}>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Integration Guide</h1>
          <p className="text-slate-400 mt-2">
            Learn how to integrate external systems with OpenSOC using our REST API
          </p>
          {!apiKeysLoading && (
            <div className="mt-3">
              {getActiveApiKey() ? (
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-200 text-sm">
                    Personalized examples with your "{getActiveApiKey()?.name}" API key prefix
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-yellow-200 text-sm">
                    Template examples - create an API key for personalized scripts
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/settings', { state: { activeTab: 'apikeys' } })}
            className="btn-secondary"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage API Keys
          </button>
          <button
            onClick={() => {
              const activeKey = getActiveApiKey();
              if (activeKey) {
                // Generate and download ready-to-use integration scripts
                const bashScript = generateDownloadableScript('bash');
                const pythonScript = generateDownloadableScript('python');
                const jsScript = generateDownloadableScript('javascript');
                
                // Create a zip file with all scripts
                const zip = [
                  '# OpenSOC Integration Scripts Package',
                  `# Generated: ${new Date().toLocaleString()}`,
                  `# API Key: ${activeKey.name}`,
                  '',
                  '1. integration_test.sh - Bash script for quick testing',
                  '2. opensoc_client.py - Python integration module',
                  '3. opensoc_client.js - JavaScript/Node.js client',
                  '',
                  '=== integration_test.sh ===',
                  bashScript,
                  '',
                  '=== opensoc_client.py ===',
                  pythonScript,
                  '',
                  '=== opensoc_client.js ===',
                  jsScript
                ].join('\n');
                
                // Download as text file
                const blob = new Blob([zip], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'opensoc-integration-scripts.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else {
                // No API key available, redirect to settings
                navigate('/settings', { state: { activeTab: 'apikeys' } });
              }
            }}
            className="btn-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            {getActiveApiKey() ? 'Download Template Scripts' : 'Create API Key to Download'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-6">
        <div className="w-64 space-y-2">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Welcome to OpenSOC Integration</h3>
                <p className="text-slate-300 mb-4">
                  The OpenSOC External API allows you to integrate your security tools, SIEM systems, 
                  and custom applications with our security operations platform. Create alerts, 
                  monitor their status, and automate your security workflows.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-opensoc-600/10 border border-opensoc-600/20 rounded-lg p-4">
                    <Zap className="h-8 w-8 text-opensoc-400 mb-3" />
                    <h4 className="text-white font-medium mb-2">Fast Integration</h4>
                    <p className="text-slate-400 text-sm">
                      RESTful API with simple authentication. Get started in minutes.
                    </p>
                  </div>
                  
                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                    <Shield className="h-8 w-8 text-blue-400 mb-3" />
                    <h4 className="text-white font-medium mb-2">Secure</h4>
                    <p className="text-slate-400 text-sm">
                      API key authentication with rate limiting and audit logging.
                    </p>
                  </div>
                  
                  <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
                    <Activity className="h-8 w-8 text-green-400 mb-3" />
                    <h4 className="text-white font-medium mb-2">Real-time</h4>
                    <p className="text-slate-400 text-sm">
                      Instant alert creation and status updates for rapid response.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Start</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium">Generate an API Key</p>
                      <p className="text-slate-400 text-sm">Go to Settings → API Keys and create your first API key (Admin access required)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium">Test the Connection</p>
                      <p className="text-slate-400 text-sm">Use the health check endpoint to verify your API key works</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium">Create Your First Alert</p>
                      <p className="text-slate-400 text-sm">Send a POST request to create security alerts programmatically</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-opensoc-600/10 border border-opensoc-600/20 rounded-lg">
                  <p className="text-opensoc-200 font-medium">Ready to start?</p>
                  <p className="text-opensoc-300 text-sm mt-1">
                    {getActiveApiKey() ? (
                      <>
                        Your examples show your API key prefix. To get the full API key for testing, go to Settings → API Keys and regenerate your key. 
                        The full key is only shown once for security reasons.
                      </>
                    ) : (
                      <>
                        Use the "Manage API Keys" button above to create your API key, then "Download Examples" to get integration scripts. 
                        Check the Authentication tab to learn about API key setup, then explore the API Endpoints for detailed usage.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'authentication' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">API Key Authentication</h3>
                <p className="text-slate-300 mb-4">
                  OpenSOC uses API key authentication for external integrations. Each API key is tied to an organization
                  and includes specific permissions for security operations.
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Creating an API Key</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Navigate to Settings → API Keys and generate a new key. Each organization can have one active API key. 
                      <strong className="text-yellow-400"> Administrator access is required</strong> to manage API keys.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-200 text-sm font-medium">Important</p>
                          <p className="text-yellow-300 text-xs mt-1">
                            API keys are only shown once during creation. Store them securely - they cannot be retrieved later.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Authentication Methods</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Include your API key in requests using any of these header formats:
                    </p>
                    <div className="space-y-2">
                      <CodeBlock 
                        code={replaceApiKeyPlaceholders("Authorization: Bearer YOUR_API_KEY")}
                        language="http" 
                        title="Bearer Token (Recommended)"
                      />
                      <CodeBlock 
                        code={replaceApiKeyPlaceholders("Authorization: YOUR_API_KEY")}
                        language="http" 
                        title="Direct Authorization"
                      />
                      <CodeBlock 
                        code={replaceApiKeyPlaceholders("X-API-Key: YOUR_API_KEY")}
                        language="http" 
                        title="Custom Header"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Rate Limiting</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      API requests are rate limited to prevent abuse:
                    </p>
                    <ul className="text-slate-400 text-sm space-y-1 ml-4">
                      <li>• <strong className="text-white">30 requests per minute</strong> per API key</li>
                      <li>• Rate limits reset every 60 seconds</li>
                      <li>• Exceeded limits return HTTP 429 (Too Many Requests)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Testing Authentication</h3>
                <p className="text-slate-300 mb-4">
                  Use the health check endpoint to verify your API key is working correctly:
                </p>
                
                <CodeBlock
                  code={replaceApiKeyPlaceholders(`curl -X GET "${apiHelp?.endpoints?.healthCheck?.url || 'https://your-opensoc-instance.com/api/external/health'}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`)}
                  language="bash"
                  title="Test API Key"
                />

                <div className="mt-4">
                  <p className="text-slate-400 text-sm mb-2">Expected response:</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "message": "External API is operational",
  "timestamp": "2024-01-15T10:30:00Z",
  "apiKey": {
    "id": "api-key-id",
    "name": "Your API Key Name",
    "permissions": ["create_alerts"]
  },
  "organization": {
    "id": "org-id",
    "name": "Your Organization"
  }
}`}
                    language="json"
                    title="Successful Response"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Available Endpoints</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-mono rounded">POST</span>
                      <code className="text-slate-300">/api/external/alerts</code>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      Create a new security alert in the system.
                    </p>
                    <div className="bg-soc-dark-900 border border-soc-dark-700 rounded p-3">
                      <p className="text-slate-300 text-sm mb-2"><strong>Required Fields:</strong></p>
                      <ul className="text-slate-400 text-sm space-y-1">
                        <li>• <code className="text-opensoc-300">title</code> - Alert title (string)</li>
                        <li>• <code className="text-opensoc-300">description</code> - Detailed description (string)</li>
                        <li>• <code className="text-opensoc-300">severity</code> - Severity level 1-5 (integer)</li>
                        <li>• <code className="text-opensoc-300">sourceSystem</code> - Source system name (string)</li>
                      </ul>
                      <p className="text-slate-300 text-sm mt-3 mb-2"><strong>Optional Fields:</strong></p>
                      <ul className="text-slate-400 text-sm space-y-1">
                        <li>• <code className="text-blue-300">eventTime</code> - Event timestamp (ISO 8601)</li>
                        <li>• <code className="text-blue-300">assetName</code> - Affected asset name</li>
                        <li>• <code className="text-blue-300">category</code> - Alert category</li>
                        <li>• <code className="text-blue-300">rawData</code> - Additional data (object)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-mono rounded">GET</span>
                      <code className="text-slate-300">/api/external/alerts/:id/status</code>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Get the current status of a specific alert.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-opensoc-600 text-white text-xs font-mono rounded">GET</span>
                      <code className="text-slate-300">/api/external/health</code>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Health check endpoint to verify API connectivity and authentication.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-gray-600 text-white text-xs font-mono rounded">GET</span>
                      <code className="text-slate-300">/api/external/help</code>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Get API documentation and examples (no authentication required).
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Response Format</h3>
                <p className="text-slate-300 mb-4">
                  All API endpoints return JSON responses with a consistent structure:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-green-400 font-medium mb-2">Success Response (2xx)</p>
                    <CodeBlock
                      code={`{
  "success": true,
  "message": "Alert created successfully",
  "alert": {
    "id": "alert-uuid",
    "title": "Alert Title",
    "status": "new",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`}
                      language="json"
                      title="Success Response"
                    />
                  </div>
                  
                  <div>
                    <p className="text-red-400 font-medium mb-2">Error Response (4xx/5xx)</p>
                    <CodeBlock
                      code={`{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid alert data provided",
  "details": ["title is required", "severity must be 1-5"]
}`}
                      language="json"
                      title="Error Response"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Code Examples</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center">
                      <Terminal className="h-5 w-5 mr-2" />
                      cURL Examples
                    </h4>
                    
                    <div className="space-y-4">
                      <CodeBlock
                        code={replaceApiKeyPlaceholders(`# Create a security alert
curl -X POST "${apiHelp?.endpoints?.createAlert?.url || 'https://your-opensoc.com/api/external/alerts'}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Suspicious Login Detected",
    "description": "Multiple failed login attempts from IP 192.168.1.100",
    "severity": 3,
    "sourceSystem": "Authentication System",
    "eventTime": "2024-01-15T10:30:00Z",
    "assetName": "Login Server",
    "category": "authentication",
    "rawData": {
      "ip": "192.168.1.100",
      "failedAttempts": 5,
      "username": "admin"
    }
  }'`)}
                        language="bash"
                        title="Create Alert"
                      />
                      
                      <CodeBlock
                        code={replaceApiKeyPlaceholders(`# Check alert status
curl -X GET "${apiHelp?.endpoints?.getAlertStatus?.url?.replace('{id}', 'ALERT_ID') || 'https://your-opensoc.com/api/external/alerts/ALERT_ID/status'}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                        language="bash"
                        title="Get Alert Status"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">Python Example</h4>
                    <CodeBlock
                      code={replaceApiKeyPlaceholders(`import requests
import json
from datetime import datetime

# Configuration
API_KEY = "your_api_key_here"
BASE_URL = "${apiHelp?.endpoints?.createAlert?.url?.replace('/alerts', '') || 'https://your-opensoc.com/api/external'}"

# Headers
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create an alert
def create_alert(title, description, severity, source_system, **kwargs):
    alert_data = {
        "title": title,
        "description": description,
        "severity": severity,
        "sourceSystem": source_system,
        "eventTime": datetime.utcnow().isoformat() + "Z",
        **kwargs
    }
    
    response = requests.post(
        f"{BASE_URL}/alerts",
        headers=headers,
        json=alert_data
    )
    
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Example usage
alert = create_alert(
    title="Malware Detection",
    description="Suspicious file detected on endpoint",
    severity=4,
    source_system="Endpoint Security",
    assetName="DESKTOP-001",
    category="malware",
    rawData={
        "filename": "suspicious.exe",
        "hash": "abc123...",
        "detection_time": "2024-01-15T10:30:00Z"
    }
)

if alert:
    print(f"Alert created: {alert['alert']['id']}")
    print(f"View at: {alert['integration']['alertUrl']}")`)}
                      language="python"
                      title="Python Integration"
                    />
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">JavaScript/Node.js Example</h4>
                    <CodeBlock
                      code={replaceApiKeyPlaceholders(`const axios = require('axios');

class OpenSOCClient {
    constructor(apiKey, baseUrl = '${apiHelp?.endpoints?.createAlert?.url?.replace('/alerts', '') || 'https://your-opensoc.com/api/external'}') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.headers = {
            'Authorization': \`Bearer \${apiKey}\`,
            'Content-Type': 'application/json'
        };
    }

    async createAlert(alertData) {
        try {
            const response = await axios.post(
                \`\${this.baseUrl}/alerts\`,
                {
                    eventTime: new Date().toISOString(),
                    ...alertData
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating alert:', error.response?.data || error.message);
            throw error;
        }
    }

    async getAlertStatus(alertId) {
        try {
            const response = await axios.get(
                \`\${this.baseUrl}/alerts/\${alertId}/status\`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting alert status:', error.response?.data || error.message);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(
                \`\${this.baseUrl}/health\`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Example usage
const client = new OpenSOCClient('your_api_key_here');

// Create alert
client.createAlert({
    title: 'Network Intrusion Detected',
    description: 'Unauthorized access attempt from external IP',
    severity: 5,
    sourceSystem: 'Network Monitor',
    assetName: 'Firewall-01',
    category: 'intrusion',
    rawData: {
        sourceIp: '203.0.113.1',
        targetPort: 22,
        attempts: 10
    }
}).then(result => {
    console.log('Alert created:', result.alert.id);
}).catch(console.error);`)}
                      language="javascript"
                      title="JavaScript/Node.js Client"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Testing Your Integration</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">1. Health Check Test</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Start by testing your API key with the health check endpoint:
                    </p>
                    <CodeBlock
                      code={replaceApiKeyPlaceholders(`curl -X GET "${apiHelp?.endpoints?.healthCheck?.url || 'https://your-opensoc.com/api/external/health'}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                      language="bash"
                      title="Health Check Test"
                    />
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">2. Simple Alert Creation</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Create a test alert to verify the integration:
                    </p>
                    <CodeBlock
                      code={replaceApiKeyPlaceholders(`curl -X POST "${apiHelp?.endpoints?.createAlert?.url || 'https://your-opensoc.com/api/external/alerts'}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Test Alert - API Integration",
    "description": "This is a test alert to verify API integration is working correctly.",
    "severity": 1,
    "sourceSystem": "Integration Test",
    "category": "test"
  }'`)}
                      language="bash"
                      title="Test Alert Creation"
                    />
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">3. Alert Status Check</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Use the alert ID from the creation response to check status:
                    </p>
                    <CodeBlock
                      code={replaceApiKeyPlaceholders(`curl -X GET "${apiHelp?.endpoints?.getAlertStatus?.url?.replace('{id}', 'ALERT_ID_FROM_STEP_2') || 'https://your-opensoc.com/api/external/alerts/ALERT_ID/status'}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                      language="bash"
                      title="Check Alert Status"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Testing Checklist</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-slate-300">API key authentication works (health check returns 200)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-slate-300">Can create alerts with required fields</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-slate-300">Alert appears in OpenSOC dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-slate-300">Can retrieve alert status</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-slate-300">Error handling works correctly</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-slate-300">Rate limiting is respected</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Guidelines</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">Rate Limits</h4>
                    <ul className="text-slate-400 text-sm space-y-1">
                      <li>• Max 30 requests per minute</li>
                      <li>• Implement exponential backoff</li>
                      <li>• Monitor HTTP 429 responses</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">Best Practices</h4>
                    <ul className="text-slate-400 text-sm space-y-1">
                      <li>• Batch alerts when possible</li>
                      <li>• Include meaningful descriptions</li>
                      <li>• Use appropriate severity levels</li>
                      <li>• Add context in rawData field</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Common Issues</h3>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="text-red-400 font-medium mb-2">401 Unauthorized</h4>
                    <p className="text-slate-400 text-sm mb-2">
                      Your API key is invalid, expired, or missing.
                    </p>
                    <ul className="text-slate-400 text-sm space-y-1 ml-4">
                      <li>• Check API key format (should start with 'opensoc_')</li>
                      <li>• Verify the key is active in Settings → API Keys</li>
                      <li>• Ensure correct Authorization header format</li>
                      <li>• Generate a new key if the current one is compromised</li>
                      <li>• Confirm you have administrator access to manage API keys</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="text-yellow-400 font-medium mb-2">429 Too Many Requests</h4>
                    <p className="text-slate-400 text-sm mb-2">
                      You've exceeded the rate limit (30 requests per minute).
                    </p>
                    <ul className="text-slate-400 text-sm space-y-1 ml-4">
                      <li>• Wait 60 seconds before retrying</li>
                      <li>• Implement exponential backoff in your client</li>
                      <li>• Reduce request frequency</li>
                      <li>• Contact support if you need higher limits</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="text-orange-400 font-medium mb-2">400 Validation Failed</h4>
                    <p className="text-slate-400 text-sm mb-2">
                      Required fields are missing or invalid.
                    </p>
                    <ul className="text-slate-400 text-sm space-y-1 ml-4">
                      <li>• Check all required fields: title, description, severity, sourceSystem</li>
                      <li>• Ensure severity is an integer between 1-5</li>
                      <li>• Verify JSON formatting is correct</li>
                      <li>• Check field data types match requirements</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-blue-400 font-medium mb-2">404 Not Found</h4>
                    <p className="text-slate-400 text-sm mb-2">
                      The endpoint URL is incorrect or the resource doesn't exist.
                    </p>
                    <ul className="text-slate-400 text-sm space-y-1 ml-4">
                      <li>• Verify the base URL is correct</li>
                      <li>• Check endpoint paths match documentation</li>
                      <li>• Ensure alert IDs are valid UUIDs</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Debugging Steps</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Enable Verbose Logging</h4>
                      <p className="text-slate-400 text-sm">
                        Log all HTTP requests and responses in your integration code to see exactly what's being sent.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Test with cURL First</h4>
                      <p className="text-slate-400 text-sm">
                        Before debugging your application code, verify the API works with simple cURL commands.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Check API Key Permissions</h4>
                      <p className="text-slate-400 text-sm">
                        Verify your API key has the necessary permissions (create_alerts, read_alerts) by checking Settings → API Keys in the dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Monitor in Dashboard</h4>
                      <p className="text-slate-400 text-sm">
                        Check if alerts are appearing in the OpenSOC dashboard even if the API response seems incorrect.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Getting Help</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-opensoc-400" />
                    <div>
                      <p className="text-white font-medium">Documentation</p>
                      <p className="text-slate-400 text-sm">
                        Review this integration guide and API endpoint documentation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Terminal className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">API Help Endpoint</p>
                      <p className="text-slate-400 text-sm">
                        GET /api/external/help for machine-readable API documentation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Ready-to-Use Scripts</p>
                      <p className="text-slate-400 text-sm">
                        Go to Settings → API Keys to download integration test scripts with your actual API key embedded
                      </p>
                    </div>
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

export default IntegrationHelpPage;