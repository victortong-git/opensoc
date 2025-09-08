import React, { useState } from 'react';
import {
  Code,
  Copy,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  Play,
  Eye,
  Terminal
} from 'lucide-react';

interface ScriptData {
  content: string;
  language: string;
  type: string;
  description: string;
  execution_priority: number;
}

interface GeneratedScriptsViewerProps {
  generatedScripts?: Record<string, ScriptData>;
  scriptLanguage?: string;
  automationRecommendations?: any;
  validationResults?: any;
}

const GeneratedScriptsViewer: React.FC<GeneratedScriptsViewerProps> = ({
  generatedScripts,
  scriptLanguage,
  automationRecommendations,
  validationResults
}) => {
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const copyScriptToClipboard = async (scriptName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedScript(scriptName);
      setTimeout(() => setCopiedScript(null), 2000);
    } catch (error) {
      console.error('Failed to copy script:', error);
    }
  };

  const downloadScript = (scriptName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = scriptName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'bash': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'python': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'powershell': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-400 bg-red-500/10';
      case 2: return 'text-orange-400 bg-orange-500/10';
      case 3: return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getScriptTypeIcon = (type: string) => {
    switch (type) {
      case 'primary_automation': return <Play className="h-4 w-4" />;
      case 'monitoring': return <Eye className="h-4 w-4" />;
      case 'utility': return <Terminal className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  if (!generatedScripts || Object.keys(generatedScripts).length === 0) {
    return (
      <div className="text-center py-8">
        <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Scripts Generated</h3>
        <p className="text-gray-400">
          Scripts will be generated based on threat level and IOC analysis results
        </p>
      </div>
    );
  }

  const scriptEntries = Object.entries(generatedScripts).sort(([,a], [,b]) => a.execution_priority - b.execution_priority);

  return (
    <div className="space-y-6">
      {/* Script Summary */}
      <div className="bg-soc-dark-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Code className="h-5 w-5" />
          <span>Generated Automation Scripts</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center bg-soc-dark-900 p-3 rounded">
            <div className="text-lg font-bold text-white">{Object.keys(generatedScripts).length}</div>
            <p className="text-xs text-gray-400">Total Scripts</p>
          </div>
          <div className="text-center bg-soc-dark-900 p-3 rounded">
            <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getLanguageColor(scriptLanguage || 'unknown')}`}>
              {scriptLanguage || 'Mixed'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Primary Language</p>
          </div>
          <div className="text-center bg-soc-dark-900 p-3 rounded">
            <div className="text-lg font-bold text-green-400">Ready</div>
            <p className="text-xs text-gray-400">Status</p>
          </div>
        </div>

        {automationRecommendations && (
          <div className="bg-soc-dark-900 p-3 rounded">
            <h4 className="text-white font-medium mb-2">Automation Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Priority:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  automationRecommendations.automation_priority === 'high' ? 'text-red-400 bg-red-500/20' :
                  automationRecommendations.automation_priority === 'medium' ? 'text-orange-400 bg-orange-500/20' :
                  'text-blue-400 bg-blue-500/20'
                }`}>
                  {automationRecommendations.automation_priority}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Manual Verification:</span>
                <span className="ml-2 text-white">
                  {automationRecommendations.manual_verification_required ? 'Required' : 'Optional'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Script List */}
      <div className="space-y-4">
        {scriptEntries.map(([scriptName, scriptData]) => (
          <div key={scriptName} className="bg-soc-dark-800 rounded-lg overflow-hidden border border-soc-dark-700">
            {/* Script Header */}
            <div className="flex items-center justify-between p-4 border-b border-soc-dark-700">
              <div className="flex items-center space-x-3">
                {getScriptTypeIcon(scriptData.type)}
                <div>
                  <h4 className="text-white font-medium">{scriptName}</h4>
                  <p className="text-sm text-gray-400">{scriptData.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(scriptData.execution_priority)}`}>
                  Priority {scriptData.execution_priority}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getLanguageColor(scriptData.language)}`}>
                  {scriptData.language}
                </span>
              </div>
            </div>

            {/* Script Actions */}
            <div className="flex items-center justify-between p-4 bg-soc-dark-900/50">
              <div className="flex items-center space-x-2">
                {validationResults?.[scriptName] && (
                  <div className="flex items-center space-x-1">
                    {validationResults[scriptName].is_safe ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      Safety: {validationResults[scriptName].risk_level}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedScript(selectedScript === scriptName ? null : scriptName)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>{selectedScript === scriptName ? 'Hide' : 'View'}</span>
                </button>
                <button
                  onClick={() => copyScriptToClipboard(scriptName, scriptData.content)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center space-x-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedScript === scriptName ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => downloadScript(scriptName, scriptData.content)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Script Content */}
            {selectedScript === scriptName && (
              <div className="border-t border-soc-dark-700">
                <div className="p-4 bg-black/30">
                  <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    <code>{scriptData.content}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Safety Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-medium">Security Notice</h4>
            <div className="text-yellow-400 text-sm mt-2 space-y-1">
              <p>• Review all scripts carefully before execution in production environments</p>
              <p>• Test scripts in isolated environments first</p>
              <p>• Ensure proper backup and rollback procedures are in place</p>
              <p>• Manual approval is required for critical system operations</p>
              <p>• Monitor script execution and verify expected outcomes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedScriptsViewer;