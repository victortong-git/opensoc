import React from 'react';
import { Shield, Code, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface OrchestrationResult {
  orchestrationStatus: string;
  protocol?: 'NAT_API' | 'MCP';
  threatAssessment?: {
    threat_level: string;
    risk_score: number;
    malicious_iocs: number;
    total_iocs: number;
    threat_families: string[];
    confidence_level: number;
  };
  extractedIocs?: Array<{
    type: string;
    value: string;
    source: string;
  }>;
  generatedScripts?: Record<string, any>;
  virustotalAnalysis?: {
    ioc_analyzed: string;
    threat_detected: boolean;
    confidence_score: number;
    analysis_result: string;
  };
  executionTimeline?: Array<{
    step: string;
    status: string;
    timestamp: string;
    message: string;
    duration_ms?: number;
  }>;
  scriptLanguage?: string;
  processingTimeMs?: number;
}

interface OrchestrationResultsProps {
  alertId: string;
  refreshTrigger?: number;
  onOpenModal?: () => void;
}

const OrchestrationResults: React.FC<OrchestrationResultsProps> = ({ alertId, refreshTrigger, onOpenModal }) => {
  const [result, setResult] = React.useState<OrchestrationResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // console.log('🔍 OrchestrationResults component rendered for alertId:', alertId, 'refreshTrigger:', refreshTrigger);

  React.useEffect(() => {
    // console.log('🔄 OrchestrationResults useEffect triggered - alertId:', alertId, 'refreshTrigger:', refreshTrigger);
    if (alertId) {
      loadResults();
    }
  }, [alertId, refreshTrigger]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // console.log('🔍 OrchestrationResults: Loading NAT results for alert:', alertId, 'triggered by refreshTrigger:', refreshTrigger);
      
      // Use unified NAT results endpoint with fetch-based optional method (no console 404 errors)
      const data = await apiRequest.getOptional(`/alerts/${alertId}/nat-results`);
      
      if (data && data.success && data.orchestrationResult) {
        setResult(data.orchestrationResult);
      } else {
        // No results found or endpoint returned 404 - this is normal
        setResult(null);
      }
    } catch (err: any) {
      console.error('❌ OrchestrationResults: Error loading results:', err);
      setError(err.message || 'Failed to load results');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-600 text-white border-red-500';
      case 'HIGH': return 'bg-red-500 text-white border-red-400';
      case 'MEDIUM': return 'bg-yellow-500 text-black border-yellow-400';
      case 'LOW': return 'bg-green-500 text-white border-green-400';
      default: return 'bg-gray-500 text-white border-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-soc-dark-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          <span className="text-gray-400">Loading orchestration results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <h4 className="text-red-300 font-medium">Failed to Load Results</h4>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced check - show results if any meaningful data exists
  const hasResults = result && (
    result.orchestrationStatus === 'completed' || 
    result.orchestration_status === 'completed' ||  // Handle snake_case from backend
    result.threatAssessment || 
    result.threat_assessment ||  // Handle snake_case from backend
    (result.extractedIocs && result.extractedIocs.length > 0) ||
    (result.extracted_iocs && result.extracted_iocs.length > 0) ||  // Handle snake_case
    result.generatedScripts ||
    result.generated_scripts  // Handle snake_case
  );
  
  /* console.log('🔍 OrchestrationResults render check:', {
    hasResult: !!result,
    status_camel: result?.orchestrationStatus,
    status_snake: result?.orchestration_status,
    hasThreatAssessment_camel: !!result?.threatAssessment,
    hasThreatAssessment_snake: !!result?.threat_assessment,
    hasIOCs_camel: result?.extractedIocs?.length || 0,
    hasIOCs_snake: result?.extracted_iocs?.length || 0,
    hasScripts_camel: !!result?.generatedScripts,
    hasScripts_snake: !!result?.generated_scripts,
    willShowResults: hasResults
  }); */

  if (!hasResults) {
    return (
      <div className="bg-soc-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-gray-400" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">Orchestration & Automation</h3>
                <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                  API/MCP
                </span>
              </div>
              <p className="text-gray-400 text-sm">AI-powered threat analysis via API or MCP protocol</p>
            </div>
          </div>
          <button
            onClick={onOpenModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Start Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soc-dark-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-400" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-medium">Orchestration & Automation Results</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                result.protocol === 'MCP' 
                  ? 'bg-purple-600 text-purple-100' 
                  : 'bg-blue-600 text-blue-100'
              }`}>
                {result.protocol === 'MCP' ? 'MCP' : 'API'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Completed via {result.protocol === 'MCP' ? 'MCP Protocol' : 'NAT HTTP API'} in {result.processingTimeMs ? Math.round(result.processingTimeMs / 1000) : 'N/A'}s
            </p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
        >
          View Details
        </button>
      </div>

      {/* Threat Assessment Summary */}
      {result.threatAssessment && (
        <div className="bg-soc-dark-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Threat Assessment</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`px-3 py-2 rounded-lg border font-semibold text-sm ${getThreatLevelColor(result.threatAssessment.threat_level)}`}>
                {result.threatAssessment.threat_level}
              </div>
              <p className="text-xs text-gray-400 mt-1">Threat Level</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{result.threatAssessment.risk_score}%</div>
              <p className="text-xs text-gray-400">Risk Score</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {result.threatAssessment.malicious_iocs}/{result.threatAssessment.total_iocs}
              </div>
              <p className="text-xs text-gray-400">Malicious IOCs</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{result.threatAssessment.threat_families?.length || 0}</div>
              <p className="text-xs text-gray-400">Threat Families</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick IOCs Overview */}
      {result.extractedIocs && result.extractedIocs.length > 0 && (
        <div className="bg-soc-dark-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Extracted IOCs ({result.extractedIocs.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.extractedIocs.slice(0, 4).map((ioc, index) => (
              <div key={index} className="flex items-center justify-between bg-soc-dark-800 p-2 rounded text-sm">
                <span className="text-white font-mono">{ioc.value}</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">{ioc.type}</span>
              </div>
            ))}
            {result.extractedIocs.length > 4 && (
              <div className="col-span-full text-center text-gray-400 text-sm">
                +{result.extractedIocs.length - 4} more IOCs...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Scripts Summary */}
      {result.generatedScripts && Object.keys(result.generatedScripts).length > 0 && (
        <div className="bg-soc-dark-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Generated Scripts</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(result.generatedScripts).map(([scriptName, scriptData]: [string, any]) => (
              <div key={scriptName} className="bg-soc-dark-800 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{scriptName.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-xs text-gray-400">{result.scriptLanguage}</span>
                </div>
                <p className="text-gray-400 text-xs">
                  {typeof scriptData === 'string' ? 
                    `${scriptData.length} characters` : 
                    `${Object.keys(scriptData).length} components`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Timeline Summary */}
      {result.executionTimeline && result.executionTimeline.length > 0 && (
        <div className="bg-soc-dark-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Execution Timeline</span>
          </h4>
          <div className="space-y-2">
            {result.executionTimeline.map((step, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white">
                    {step.step === 'virustotal_analysis' ? 'VirusTotal Analysis' : 
                     step.step === 'script_generation' ? 'Script Generation' : step.step}
                  </span>
                </div>
                <div className="text-gray-400">
                  {step.duration_ms ? `${Math.round(step.duration_ms / 1000)}s` : 'Completed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrchestrationResults;