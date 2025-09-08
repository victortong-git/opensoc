import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Shield, 
  Target, 
  Eye, 
  AlertTriangle,
  Search,
  Copy,
  Download,
  BookOpen,
  Activity,
  Users,
  Monitor,
  Database,
  Zap
} from 'lucide-react';
import type { MitreTechnique } from '../../services/alertService';

interface TechniqueDetailModalProps {
  technique: MitreTechnique;
  alertContext?: {
    alertId: string;
    correlationReason: string;
    confidenceScore: number;
    matchedIndicators: string[];
  };
  isOpen: boolean;
  onClose: () => void;
}

const TechniqueDetailModal: React.FC<TechniqueDetailModalProps> = ({
  technique,
  alertContext,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detection' | 'mitigation' | 'hunting'>('overview');
  const [copiedContent, setCopiedContent] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopiedContent(label);
    setTimeout(() => setCopiedContent(''), 2000);
  };

  const getTechniqueConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400 bg-green-500/20';
    if (score >= 0.6) return 'text-yellow-400 bg-yellow-500/20';
    if (score >= 0.4) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'enterprise': return 'bg-blue-500/20 text-blue-300';
      case 'mobile': return 'bg-green-500/20 text-green-300';
      case 'ics': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Generate hunting queries based on technique
  const generateHuntingQueries = () => {
    const queries = [];
    
    // Generic process monitoring query
    if (technique.tactics.includes('execution')) {
      queries.push({
        type: 'KQL',
        name: 'Process Execution Detection',
        query: `SecurityEvent\n| where EventID == 4688\n| where ProcessName contains "${technique.name.split(' ')[0].toLowerCase()}"\n| project TimeGenerated, Computer, Account, ProcessName, CommandLine`
      });
    }

    // File system monitoring
    if (technique.tactics.includes('persistence') || technique.tactics.includes('defense-evasion')) {
      queries.push({
        type: 'Sigma',
        name: 'File System Activity',
        query: `title: ${technique.name} Detection\ndetection:\n  selection:\n    EventID: 11\n    TargetFilename|contains:\n      - 'suspicious'\n  condition: selection`
      });
    }

    // Network monitoring
    if (technique.tactics.includes('command-and-control') || technique.tactics.includes('exfiltration')) {
      queries.push({
        type: 'Splunk',
        name: 'Network Connection Analysis',
        query: `index=network sourcetype=firewall\n| search dest_port!=80 AND dest_port!=443\n| stats count by src_ip, dest_ip, dest_port\n| where count > 10`
      });
    }

    return queries;
  };

  const huntingQueries = generateHuntingQueries();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-soc-dark-800 shadow-xl rounded-lg border border-soc-dark-700">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="h-6 w-6 text-opensoc-400" />
                <h3 className="text-xl font-semibold text-white">
                  {technique.id}: {technique.name}
                </h3>
                <span className={`px-2 py-1 text-xs rounded border ${getDomainColor(technique.source_domain)}`}>
                  {technique.source_domain}
                </span>
                {technique.confidence_score && (
                  <span className={`px-2 py-1 text-xs rounded border ${getTechniqueConfidenceColor(technique.confidence_score)}`}>
                    {Math.round(technique.confidence_score * 100)}% confidence
                  </span>
                )}
              </div>
              
              {alertContext && (
                <div className="bg-opensoc-500/10 border border-opensoc-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 text-opensoc-400" />
                    <span className="text-sm font-medium text-opensoc-300">Alert Correlation</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{alertContext.correlationReason}</p>
                  <div className="flex flex-wrap gap-2">
                    {alertContext.matchedIndicators.map((indicator, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-slate-500/20 text-slate-300 rounded">
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-slate-300 mb-4">{technique.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {technique.tactics.map(tactic => (
                  <span key={tactic} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    {tactic.replace('-', ' ')}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {technique.platforms.map(platform => (
                  <span key={platform} className="px-2 py-1 text-xs bg-slate-500/20 text-slate-300 rounded">
                    <Monitor className="h-3 w-3 inline mr-1" />
                    {platform}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => window.open(technique.url, '_blank')}
              className="flex items-center space-x-2 px-3 py-2 bg-opensoc-500/20 text-opensoc-300 hover:bg-opensoc-500/30 rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on MITRE</span>
            </button>
            
            <button
              onClick={() => copyToClipboard(technique.id, 'Technique ID')}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 rounded-lg text-sm transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>{copiedContent === 'Technique ID' ? 'Copied!' : 'Copy ID'}</span>
            </button>
            
            <button
              onClick={() => copyToClipboard(JSON.stringify(technique, null, 2), 'JSON')}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 rounded-lg text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>{copiedContent === 'JSON' ? 'Copied!' : 'Export JSON'}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-soc-dark-700 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'detection', label: 'Detection', icon: Eye },
                { id: 'mitigation', label: 'Mitigation', icon: Shield },
                { id: 'hunting', label: 'Threat Hunting', icon: Search }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-opensoc-500 text-opensoc-300'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Data Sources</span>
                  </h4>
                  <div className="space-y-2">
                    {technique.data_sources?.length > 0 ? (
                      technique.data_sources.map((source, index) => (
                        <div key={index} className="p-3 bg-soc-dark-900/50 rounded-lg border border-soc-dark-700">
                          <span className="text-sm text-slate-300">{source}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No specific data sources identified</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Associated Threat Groups</span>
                  </h4>
                  <div className="p-3 bg-soc-dark-900/50 rounded-lg border border-soc-dark-700">
                    <p className="text-sm text-slate-400">
                      Threat group associations will be displayed here when available from MITRE data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'detection' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Detection Guidance</span>
                  </h4>
                  <div className="p-4 bg-soc-dark-900/50 rounded-lg border border-soc-dark-700">
                    <p className="text-sm text-slate-300 whitespace-pre-line">
                      {technique.detection || 'No specific detection guidance available for this technique.'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Recommended Monitoring</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <h5 className="text-sm font-medium text-blue-300 mb-2">Process Monitoring</h5>
                      <p className="text-xs text-slate-300">Monitor process creation and execution patterns</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <h5 className="text-sm font-medium text-green-300 mb-2">Network Monitoring</h5>
                      <p className="text-xs text-slate-300">Track network connections and data flows</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <h5 className="text-sm font-medium text-yellow-300 mb-2">File System Monitoring</h5>
                      <p className="text-xs text-slate-300">Monitor file creation, modification, and deletion</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <h5 className="text-sm font-medium text-purple-300 mb-2">Registry Monitoring</h5>
                      <p className="text-xs text-slate-300">Track registry key changes and modifications</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mitigation' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Mitigation Strategies</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <h5 className="text-sm font-medium text-green-300 mb-2 flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Preventive Controls</span>
                      </h5>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li>• Implement application whitelisting</li>
                        <li>• Deploy endpoint detection and response (EDR)</li>
                        <li>• Enable system-level logging</li>
                        <li>• Implement network segmentation</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Detective Controls</span>
                      </h5>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li>• Monitor process execution</li>
                        <li>• Analyze network traffic patterns</li>
                        <li>• Review system and security logs</li>
                        <li>• Implement behavioral analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Immediate Response Actions</h4>
                  <div className="space-y-3">
                    {[
                      { priority: 'High', action: 'Isolate affected systems from network', time: 'Immediate' },
                      { priority: 'High', action: 'Preserve forensic evidence', time: '< 5 minutes' },
                      { priority: 'Medium', action: 'Analyze process execution logs', time: '< 15 minutes' },
                      { priority: 'Medium', action: 'Review network connections', time: '< 30 minutes' },
                      { priority: 'Low', action: 'Update detection rules', time: '< 1 hour' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-soc-dark-900/50 rounded-lg border border-soc-dark-700">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.priority === 'High' ? 'bg-red-500/20 text-red-300' :
                            item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-sm text-slate-300">{item.action}</span>
                        </div>
                        <span className="text-xs text-slate-400">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hunting' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Threat Hunting Queries</span>
                  </h4>
                  <div className="space-y-4">
                    {huntingQueries.map((query, index) => (
                      <div key={index} className="p-4 bg-soc-dark-900/50 rounded-lg border border-soc-dark-700">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-white">{query.name}</h5>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs bg-opensoc-500/20 text-opensoc-300 rounded">
                              {query.type}
                            </span>
                            <button
                              onClick={() => copyToClipboard(query.query, `Query ${index}`)}
                              className="text-slate-400 hover:text-white transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <pre className="text-xs text-slate-300 bg-black/30 rounded p-3 overflow-x-auto">
                          {query.query}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Hunting Hypotheses</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <h5 className="text-sm font-medium text-yellow-300 mb-1">Behavioral Analysis</h5>
                      <p className="text-xs text-slate-300">
                        Look for unusual process execution patterns that match this technique's characteristics.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <h5 className="text-sm font-medium text-blue-300 mb-1">Timeline Correlation</h5>
                      <p className="text-xs text-slate-300">
                        Correlate this technique with other suspicious activities in the same timeframe.
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <h5 className="text-sm font-medium text-green-300 mb-1">Asset Investigation</h5>
                      <p className="text-xs text-slate-300">
                        Investigate other assets that may have been affected by similar attack patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechniqueDetailModal;