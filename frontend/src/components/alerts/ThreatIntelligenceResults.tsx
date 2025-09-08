import React from 'react';
import {
  Shield,
  AlertTriangle,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface ThreatIntelligenceResultsProps {
  virustotalAnalysis?: any;
  threatfoxAnalysis?: any;
  threatAssessment?: any;
  extractedIocs?: any[];
}

const ThreatIntelligenceResults: React.FC<ThreatIntelligenceResultsProps> = ({
  virustotalAnalysis,
  threatfoxAnalysis,
  threatAssessment,
  extractedIocs
}) => {
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'CLEAN': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'offline_mode': return <Info className="h-4 w-4 text-blue-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Threat Assessment Overview */}
      {threatAssessment && (
        <div className="bg-soc-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Threat Assessment Summary</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={`inline-flex px-4 py-2 rounded-lg border font-semibold ${getThreatLevelColor(threatAssessment.threat_level)}`}>
                {threatAssessment.threat_level}
              </div>
              <p className="text-sm text-gray-400 mt-1">Threat Level</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{threatAssessment.risk_score}%</div>
              <p className="text-sm text-gray-400">Risk Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{threatAssessment.detection_percentage}%</div>
              <p className="text-sm text-gray-400">Detection Rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-medium mb-2">IOC Analysis</h4>
              <div className="bg-soc-dark-900 p-3 rounded">
                <p className="text-gray-300">
                  <span className="text-red-400 font-semibold">{threatAssessment.malicious_iocs}</span> malicious out of{' '}
                  <span className="text-white font-semibold">{threatAssessment.total_iocs}</span> total IOCs
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Confidence: {threatAssessment.confidence} | Sources: {threatAssessment.intelligence_sources?.join(', ')}
                </p>
              </div>
            </div>
            
            {threatAssessment.threat_families && threatAssessment.threat_families.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">Threat Families</h4>
                <div className="bg-soc-dark-900 p-3 rounded">
                  <div className="flex flex-wrap gap-2">
                    {threatAssessment.threat_families.map((family: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30">
                        {family}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VirusTotal Analysis Results */}
      {virustotalAnalysis && (
        <div className="bg-soc-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>VirusTotal Analysis</span>
            </h4>
            <div className="flex items-center space-x-2">
              {getStatusIcon(virustotalAnalysis.status)}
              <span className="text-sm text-gray-400 capitalize">{virustotalAnalysis.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-soc-dark-900 p-3 rounded">
              <div className="text-lg font-bold text-white">{virustotalAnalysis.total_analyzed}</div>
              <p className="text-xs text-gray-400">IOCs Analyzed</p>
            </div>
            <div className="text-center bg-soc-dark-900 p-3 rounded">
              <div className="text-lg font-bold text-red-400">{virustotalAnalysis.malicious_count}</div>
              <p className="text-xs text-gray-400">Malicious Found</p>
            </div>
            <div className="text-center bg-soc-dark-900 p-3 rounded">
              <div className="text-lg font-bold text-gray-300">
                {virustotalAnalysis.total_analyzed > 0 
                  ? Math.round((virustotalAnalysis.malicious_count / virustotalAnalysis.total_analyzed) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-gray-400">Malicious Rate</p>
            </div>
          </div>

          {virustotalAnalysis.analysis_results && virustotalAnalysis.analysis_results.length > 0 && (
            <div>
              <h5 className="text-white font-medium mb-3">Analysis Results</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {virustotalAnalysis.analysis_results.map((result: any, index: number) => (
                  <div key={index} className="bg-soc-dark-900 p-3 rounded border-l-4 border-l-transparent hover:border-l-blue-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono text-sm">{result.ioc}</span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">{result.type}</span>
                        {result.malicious > 0 ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                            {result.malicious}/{result.total_engines} engines
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">Clean</span>
                        )}
                      </div>
                    </div>
                    {result.threat_labels && result.threat_labels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.threat_labels.map((label: string, labelIndex: number) => (
                          <span key={labelIndex} className="px-1 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ThreatFox Analysis Results */}
      {threatfoxAnalysis && (
        <div className="bg-soc-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>ThreatFox Analysis</span>
            </h4>
            <div className="flex items-center space-x-2">
              {getStatusIcon(threatfoxAnalysis.status)}
              <span className="text-sm text-gray-400 capitalize">{threatfoxAnalysis.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-soc-dark-900 p-3 rounded">
              <div className="text-lg font-bold text-white">{threatfoxAnalysis.total_queried}</div>
              <p className="text-xs text-gray-400">IOCs Queried</p>
            </div>
            <div className="text-center bg-soc-dark-900 p-3 rounded">
              <div className="text-lg font-bold text-red-400">{threatfoxAnalysis.campaign_matches}</div>
              <p className="text-xs text-gray-400">Campaign Matches</p>
            </div>
            <div className="text-center bg-soc-dark-900 p-3 rounded">
              <div className="text-lg font-bold text-gray-300">
                {threatfoxAnalysis.total_queried > 0 
                  ? Math.round((threatfoxAnalysis.campaign_matches / threatfoxAnalysis.total_queried) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-gray-400">Match Rate</p>
            </div>
          </div>

          {threatfoxAnalysis.hunting_results && threatfoxAnalysis.hunting_results.length > 0 && (
            <div>
              <h5 className="text-white font-medium mb-3">Hunting Results</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {threatfoxAnalysis.hunting_results.map((result: any, index: number) => (
                  <div key={index} className="bg-soc-dark-900 p-3 rounded border-l-4 border-l-transparent hover:border-l-orange-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono text-sm">{result.ioc}</span>
                      <div className="flex items-center space-x-2">
                        {result.matches > 0 ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                            {result.matches} matches
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">No matches</span>
                        )}
                      </div>
                    </div>
                    {result.threats && result.threats.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {result.threats.map((threat: any, threatIndex: number) => (
                          <div key={threatIndex} className="text-xs space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-orange-300 font-medium">{threat.malware_printable}</span>
                              <span className="px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded">{threat.threat_type}</span>
                              <span className="text-gray-400">Confidence: {threat.confidence_level}%</span>
                            </div>
                            {threat.tags && threat.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {threat.tags.map((tag: string, tagIndex: number) => (
                                  <span key={tagIndex} className="px-1 py-0.5 bg-gray-600/30 text-gray-300 text-xs rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* IOCs Summary */}
      {extractedIocs && extractedIocs.length > 0 && (
        <div className="bg-soc-dark-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Extracted IOCs ({extractedIocs.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {extractedIocs.map((ioc: any, index: number) => (
              <div key={index} className="bg-soc-dark-900 p-3 rounded border border-soc-dark-700 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">{ioc.type}</span>
                  <span className="text-xs text-gray-400">{ioc.source}</span>
                </div>
                <div className="font-mono text-sm text-white break-all">{ioc.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      <div className="bg-soc-dark-800 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">External Threat Intelligence</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="https://www.virustotal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-3 bg-soc-dark-900 rounded border border-soc-dark-600 hover:border-blue-500/30 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-blue-400" />
            <div>
              <div className="text-white font-medium">VirusTotal</div>
              <div className="text-xs text-gray-400">Multi-engine malware analysis</div>
            </div>
          </a>
          <a
            href="https://threatfox.abuse.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-3 bg-soc-dark-900 rounded border border-soc-dark-600 hover:border-orange-500/30 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-orange-400" />
            <div>
              <div className="text-white font-medium">ThreatFox</div>
              <div className="text-xs text-gray-400">Malware IOC database by abuse.ch</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ThreatIntelligenceResults;