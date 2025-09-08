import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  BarChart3,
  AlertTriangle,
  Cpu,
  FileText,
  Zap,
  Eye
} from 'lucide-react';
import { apiRequest } from '../services/api';
import AiAnalysisResults from '../components/mitre/AiAnalysisResults';

interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  tactics: string[];
  data_sources: string[];
  detection: string;
  is_sub_technique: boolean;
  url?: string;
  version?: string;
}

interface MitreTactic {
  id: string;
  name: string;
  description: string;
  short_name: string;
  url?: string;
  order: number;
  technique_count?: number;
}

interface SearchParams {
  query: string;
  domain: 'enterprise' | 'mobile' | 'ics';
  platform?: string;
  tactic?: string;
  include_sub_techniques: boolean;
  max_results: number;
}

interface QuickStartScenario {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: string;
  searchParams: SearchParams;
}

const MitreAttackPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'tactics' | 'analysis' | 'ai'>('search');
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    domain: 'enterprise',
    platform: '',
    tactic: '',
    include_sub_techniques: true,
    max_results: 20
  });
  const [searchResults, setSearchResults] = useState<MitreTechnique[]>([]);
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [tacticsDomain, setTacticsDomain] = useState<'enterprise' | 'mobile' | 'ics'>('enterprise');
  const [tacticsLoading, setTacticsLoading] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);

  // Quick Start scenarios for testing - using actual MITRE technique names
  const quickStartScenarios = [
    // Enterprise scenarios
    {
      id: 'powershell',
      title: 'PowerShell Execution',
      icon: '💻',
      description: 'Explore PowerShell command and script execution techniques',
      category: 'Enterprise',
      searchParams: {
        query: 'PowerShell',
        domain: 'enterprise' as const,
        platform: 'Windows',
        tactic: 'execution',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    {
      id: 'spearphishing',
      title: 'Spearphishing Attack',
      icon: '🎣',
      description: 'Analyze spearphishing attachment and link techniques',
      category: 'Enterprise',
      searchParams: {
        query: 'Spearphishing',
        domain: 'enterprise' as const,
        platform: '',
        tactic: 'initial-access',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    {
      id: 'lsass',
      title: 'LSASS Memory Access',
      icon: '🔓',
      description: 'Research LSASS memory dumping and credential access',
      category: 'Enterprise',
      searchParams: {
        query: 'LSASS Memory',
        domain: 'enterprise' as const,
        platform: 'Windows',
        tactic: 'credential-access',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    // Mobile scenarios
    {
      id: 'mobile_app_discovery',
      title: 'Mobile App Discovery',
      icon: '📱',
      description: 'Explore application discovery techniques on mobile devices',
      category: 'Mobile',
      searchParams: {
        query: 'Application Discovery',
        domain: 'mobile' as const,
        platform: 'Android',
        tactic: 'discovery',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    {
      id: 'mobile_credential_access',
      title: 'Mobile Credential Access',
      icon: '🔑',
      description: 'Investigate credential dumping and access on mobile platforms',
      category: 'Mobile',
      searchParams: {
        query: 'Credentials',
        domain: 'mobile' as const,
        platform: 'iOS',
        tactic: 'credential-access',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    // ICS scenarios
    {
      id: 'ics_network_discovery',
      title: 'ICS Network Discovery',
      icon: '🏭',
      description: 'Analyze network service discovery in industrial control systems',
      category: 'ICS',
      searchParams: {
        query: 'Network Service Discovery',
        domain: 'ics' as const,
        platform: '',
        tactic: 'discovery',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    {
      id: 'ics_process_manipulation',
      title: 'ICS Process Manipulation',
      icon: '⚙️',
      description: 'Research process manipulation techniques in industrial environments',
      category: 'ICS',
      searchParams: {
        query: 'Process',
        domain: 'ics' as const,
        platform: '',
        tactic: 'impair-process-control',
        include_sub_techniques: true,
        max_results: 20
      }
    },
    {
      id: 'browse_all',
      title: 'Browse All Techniques',
      icon: '📋',
      description: 'Show sample techniques for exploring the MITRE framework',
      category: 'General',
      searchParams: {
        query: '',
        domain: 'enterprise' as const,
        platform: '',
        tactic: '',
        include_sub_techniques: true,
        max_results: 10
      }
    }
  ];

  // AI Analysis scenarios for testing
  const aiAnalysisScenarios = [
    {
      id: 'powershell_suspicious',
      title: 'Analyze Suspicious PowerShell Activity',
      icon: '💻',
      description: 'Investigate encoded PowerShell execution and potential memory injection',
      prompt: `I've detected suspicious PowerShell activity in our environment. Can you help me analyze this using the MITRE ATT&CK framework?

**Observed Activity:**
- PowerShell executed with encoded commands (-EncodedCommand parameter)
- Process spawned from unusual parent (excel.exe)
- Network connections to suspicious external IPs
- Possible memory injection techniques observed
- Base64 encoded payloads detected

**Environment Details:**
- Windows 10 endpoints
- PowerShell version 5.1
- Microsoft Defender enabled
- Process monitoring via Sysmon

Please map this to MITRE ATT&CK techniques and suggest detection/mitigation strategies.`
    },
    {
      id: 'lateral_movement',
      title: 'Investigate Lateral Movement Indicators',
      icon: '🔄',
      description: 'Analyze potential lateral movement via SMB and credential dumping',
      prompt: `We've identified potential lateral movement in our network. Please analyze using MITRE ATT&CK:

**Indicators Observed:**
- Multiple failed authentication attempts across different systems
- SMB traffic between workstations (unusual pattern)
- LSASS process access from non-system processes
- New local admin accounts created on multiple machines
- PsExec-like service installations detected

**Network Environment:**
- Windows domain environment
- 500+ endpoints
- Centralized logging via Splunk
- Network segmentation partially implemented

Map these indicators to MITRE techniques and provide a threat hunting strategy.`
    },
    {
      id: 'data_exfiltration',
      title: 'Assess Data Exfiltration Patterns',
      icon: '📤',
      description: 'Evaluate potential data theft and exfiltration techniques',
      prompt: `Investigating potential data exfiltration incident. Please analyze using MITRE ATT&CK framework:

**Suspicious Activities:**
- Large file transfers to external cloud storage (Google Drive, Dropbox)
- Database queries returning unusually large result sets
- Files being staged in temporary directories
- Encrypted archives created during off-hours
- DNS tunneling traffic patterns detected

**Data Sources:**
- SQL Server audit logs
- Network traffic analysis (Zeek)
- File system monitoring
- DNS logs and DPI inspection
- User behavior analytics

Provide MITRE mapping and recommend detection rules for preventing future incidents.`
    }
  ];

  // Load service status and tactics on mount
  useEffect(() => {
    loadServiceStatus();
    loadTactics();
  }, []);

  // Reload tactics when tacticsDomain changes
  useEffect(() => {
    if (activeTab === 'tactics') {
      loadTactics(tacticsDomain);
    }
  }, [tacticsDomain]);

  const loadServiceStatus = async () => {
    try {
      const response = await apiRequest.get('/mitre/service/status');
      setServiceStatus(response.data);
    } catch (error) {
      console.error('Failed to load service status:', error);
    }
  };

  const loadTactics = async (domain: string = tacticsDomain) => {
    setTacticsLoading(true);
    try {
      const response = await apiRequest.get(`/mitre/tactics/${domain}`, {
        params: { include_technique_counts: true }
      });
      const tactics = response.data?.data?.tactics || response.data?.tactics || [];
      console.log(`📊 Loaded tactics for ${domain}:`, tactics.length);
      setTactics(tactics);
    } catch (error) {
      console.error('Failed to load tactics:', error);
      setError(`Failed to load ${domain} tactics`);
    } finally {
      setTacticsLoading(false);
    }
  };

  const handleDomainChange = async (domain: 'enterprise' | 'mobile' | 'ics') => {
    setTacticsDomain(domain);
    await loadTactics(domain);
  };

  const handleSearch = async () => {
    if (!searchParams.query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest.post('/mitre/search/techniques', searchParams);
      const results = response.data?.data?.results || response.data?.results || [];
      console.log('🔍 Manual search results loaded:', results.length);
      setSearchResults(results);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Search failed');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTechniqueSelect = async (technique: MitreTechnique) => {
    setIsLoading(true);
    setError(null);

    // Define fallback domains priority: current domain first, then enterprise, then others
    const currentDomain = searchParams.domain;
    const allDomains = ['enterprise-attack', 'mobile-attack', 'ics-attack'];
    const fallbackDomains = [
      currentDomain,
      ...allDomains.filter(domain => domain !== currentDomain)
    ];

    let techniqueData = null;
    let successfulDomain = null;

    // Try each domain until we find the technique
    for (const domain of fallbackDomains) {
      try {
        console.log(`🔍 Trying to fetch technique ${technique.id} from domain: ${domain}`);
        
        const response = await apiRequest.get(`/mitre/technique/${technique.id}`, {
          params: { 
            domain: domain, 
            include_relationships: true 
          }
        });

        console.log(`🔍 Technique details response for ${domain}:`, response.data);

        // Handle different response structures
        if (response.data?.data?.technique) {
          // Structure: { data: { technique: {...} } }
          techniqueData = response.data.data.technique;
        } else if (response.data?.technique) {
          // Structure: { technique: {...} }
          techniqueData = response.data.technique;
        } else if (response.data?.data && typeof response.data.data === 'object' && response.data.data.id) {
          // Structure: { data: { id, name, description, ... } } - technique data directly in data
          techniqueData = response.data.data;
        } else {
          // Fallback: check if response.data has technique-like properties
          if (response.data?.id && response.data?.name) {
            techniqueData = response.data;
          }
        }

        if (techniqueData) {
          successfulDomain = domain;
          console.log(`✅ Found technique ${technique.id} in domain: ${domain}`);
          break;
        }
        
      } catch (error: any) {
        console.log(`❌ Technique ${technique.id} not found in domain ${domain}:`, error.response?.status);
        // Continue to next domain if 404, but break on other errors
        if (error.response?.status !== 404) {
          console.error('❌ Non-404 error, stopping fallback attempts:', error);
          setError(error.response?.data?.error || error.message || 'Failed to load technique details');
          setIsLoading(false);
          return;
        }
      }
    }

    if (!techniqueData) {
      console.error('❌ Technique not found in any domain');
      setError(`Technique ${technique.id} not found in any available domain (${allDomains.join(', ')})`);
    } else {
      console.log('✅ Extracted technique data:', techniqueData);
      if (successfulDomain !== currentDomain) {
        console.log(`ℹ️ Note: Technique found in ${successfulDomain} domain, not current ${currentDomain} domain`);
      }
      setSelectedTechnique(techniqueData);
    }
    
    setIsLoading(false);
  };

  const handleAiAnalysis = async () => {
    if (!aiPrompt.trim()) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing with AI... This may take up to 5 minutes for complex analysis.');
    setError(null);

    try {
      const response = await apiRequest.post('/mitre/ai/analyze', {
        prompt: aiPrompt,
        include_tools: true,
        reasoning_effort: 'high'
      });
      setAiResponse(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'AI analysis failed');
      console.error('AI analysis error:', error);
    } finally {
      setIsLoading(false);
      setLoadingMessage('Processing...');
    }
  };

  const handleQuickStart = async (scenario: typeof quickStartScenarios[0]) => {
    console.log(`🚀 Quick Start: ${scenario.title}`);
    
    // Update search parameters with scenario data
    setSearchParams(scenario.searchParams);
    setError(null);
    setSearchResults([]);
    
    // Auto-trigger search
    setIsLoading(true);
    
    try {
      const response = await apiRequest.post('/mitre/search/techniques', scenario.searchParams);
      const results = response.data?.data?.results || response.data?.results || [];
      console.log('🚀 Quick start results loaded:', results.length);
      setSearchResults(results);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Search failed');
      console.error('Quick start search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiQuickStart = async (scenario: typeof aiAnalysisScenarios[0]) => {
    console.log(`🤖 AI Quick Start: ${scenario.title}`);
    
    // Update AI prompt with scenario data
    setAiPrompt(scenario.prompt);
    setError(null);
    setAiResponse(null);
    
    // Auto-trigger AI analysis
    setIsLoading(true);
    setLoadingMessage(`Running AI analysis for "${scenario.title}"... This may take up to 5 minutes.`);
    
    try {
      const response = await apiRequest.post('/mitre/ai/analyze', {
        prompt: scenario.prompt,
        include_tools: true,
        reasoning_effort: 'high'
      });
      setAiResponse(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'AI analysis failed');
      console.error('AI quick start error:', error);
    } finally {
      setIsLoading(false);
      setLoadingMessage('Processing...');
    }
  };

  const renderServiceStatus = () => (
    <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        Service Status
      </h3>
      
      {serviceStatus ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-900/20 rounded-lg">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${serviceStatus.stix_data.baseDirectory ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-slate-300">STIX Data</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise: {serviceStatus.stix_data.enterprise ? '✓' : '✗'} | 
              Mobile: {serviceStatus.stix_data.mobile ? '✓' : '✗'} | 
              ICS: {serviceStatus.stix_data.ics ? '✓' : '✗'}
            </p>
          </div>
          
          <div className="p-4 bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${serviceStatus.ai_provider?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-slate-300">AI Provider Service</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Model: {serviceStatus.service_config?.model} | 
              Provider: {serviceStatus.ai_provider?.provider_type}
            </p>
          </div>
          
          <div className="p-4 bg-purple-900/20 rounded-lg">
            <div className="flex items-center">
              <Cpu className="h-4 w-4 mr-2 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Tools Available</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {serviceStatus.tools_available} AI tools ready
            </p>
          </div>
        </div>
      ) : (
        <div className="text-slate-400">Loading service status...</div>
      )}
    </div>
  );

  const renderQuickStartSection = () => (
    <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Zap className="h-5 w-5 mr-2 text-opensoc-400" />
        Quick Start Examples
      </h3>
      <p className="text-slate-400 text-sm mb-6">
        Test the MITRE ATT&CK integration with these common attack scenarios. Click any button to pre-fill the search form and run the query.
      </p>
      
      {/* Group scenarios by category */}
      {['Enterprise', 'Mobile', 'ICS', 'General'].map(category => {
        const categoryScenarios = quickStartScenarios.filter(s => s.category === category);
        if (categoryScenarios.length === 0) return null;
        
        return (
          <div key={category} className="mb-6">
            <h4 className="text-opensoc-400 font-medium mb-3 flex items-center">
              <span className="mr-2">
                {category === 'Enterprise' && '🏢'}
                {category === 'Mobile' && '📱'}
                {category === 'ICS' && '🏭'}
                {category === 'General' && '🔍'}
              </span>
              {category} Domain
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoryScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleQuickStart(scenario)}
                  disabled={isLoading}
                  className="p-4 bg-soc-dark-700 hover:bg-soc-dark-600 border border-soc-dark-600 hover:border-opensoc-500 rounded-lg transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{scenario.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white group-hover:text-opensoc-300 transition-colors">
                        {scenario.title}
                      </h4>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {scenario.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                          {scenario.searchParams.domain}
                        </span>
                        {scenario.searchParams.tactic && (
                          <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                            {scenario.searchParams.tactic}
                          </span>
                        )}
                        {scenario.searchParams.platform && (
                          <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded">
                            {scenario.searchParams.platform}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Quick Start Examples */}
      {renderQuickStartSection()}
      
      {/* Search Form */}
      <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Domain</label>
            <select
              value={searchParams.domain}
              onChange={(e) => setSearchParams({...searchParams, domain: e.target.value as any})}
              className="w-full px-3 py-2 bg-soc-dark-700 border border-soc-dark-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
            >
              <option value="enterprise">Enterprise</option>
              <option value="mobile">Mobile</option>
              <option value="ics">ICS</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
            <input
              type="text"
              value={searchParams.platform}
              onChange={(e) => setSearchParams({...searchParams, platform: e.target.value})}
              placeholder="e.g., Windows, Linux"
              className="w-full px-3 py-2 bg-soc-dark-700 border border-soc-dark-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tactic</label>
            <input
              type="text"
              value={searchParams.tactic}
              onChange={(e) => setSearchParams({...searchParams, tactic: e.target.value})}
              placeholder="e.g., initial-access"
              className="w-full px-3 py-2 bg-soc-dark-700 border border-soc-dark-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Max Results</label>
            <select
              value={searchParams.max_results}
              onChange={(e) => setSearchParams({...searchParams, max_results: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-soc-dark-700 border border-soc-dark-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center text-slate-300">
            <input
              type="checkbox"
              checked={searchParams.include_sub_techniques}
              onChange={(e) => setSearchParams({...searchParams, include_sub_techniques: e.target.checked})}
              className="mr-2 text-opensoc-600 bg-soc-dark-700 border-soc-dark-600 rounded focus:ring-opensoc-500 focus:ring-2"
            />
            Include Sub-techniques
          </label>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchParams.query}
            onChange={(e) => setSearchParams({...searchParams, query: e.target.value})}
            placeholder="Search for MITRE ATT&CK techniques..."
            className="flex-1 px-3 py-2 bg-soc-dark-700 border border-soc-dark-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchParams.query.trim()}
            className="px-4 py-2 bg-opensoc-600 text-white rounded-md hover:bg-opensoc-700 disabled:bg-slate-600 flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700">
          <div className="p-6 border-b border-soc-dark-700">
            <h3 className="text-lg font-semibold text-white">
              Search Results ({searchResults.length})
            </h3>
          </div>
          <div className="divide-y divide-soc-dark-700">
            {searchResults.map((technique) => (
              <div
                key={technique.id}
                className="p-6 hover:bg-soc-dark-700 cursor-pointer transition-colors"
                onClick={() => handleTechniqueSelect(technique)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-mono text-sm bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                        {technique.id}
                      </span>
                      {technique.is_sub_technique && (
                        <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded">
                          Sub-technique
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-white mb-2">{technique.name}</h4>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{technique.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {technique.tactics.map((tactic) => (
                        <span key={tactic} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                          {tactic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Eye className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTacticsTab = () => (
    <div className="space-y-6">
      {/* Tactics Overview Header */}
      <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-opensoc-400" />
          MITRE ATT&CK Tactics Overview
        </h3>
        
        {/* Domain Selector */}
        <div className="mb-6">
          <h4 className="text-opensoc-400 font-medium mb-3">Select Domain:</h4>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'enterprise', name: 'Enterprise', icon: '🏢', description: 'Traditional IT infrastructure and endpoints' },
              { key: 'mobile', name: 'Mobile', icon: '📱', description: 'Mobile devices (iOS, Android)' },
              { key: 'ics', name: 'ICS', icon: '🏭', description: 'Industrial Control Systems' }
            ].map((domain) => (
              <button
                key={domain.key}
                onClick={() => handleDomainChange(domain.key as any)}
                disabled={tacticsLoading}
                className={`p-4 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  tacticsDomain === domain.key
                    ? 'bg-opensoc-600 border-opensoc-500 text-white'
                    : 'bg-soc-dark-700 border-soc-dark-600 text-slate-300 hover:bg-soc-dark-600 hover:border-opensoc-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{domain.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{domain.name}</div>
                    <div className="text-xs opacity-75">{domain.description}</div>
                    <div className="text-xs mt-1">
                      {tacticsDomain === domain.key ? `${tactics.length} tactics` : 'Click to load'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-slate-400 text-sm mb-4">
            MITRE ATT&CK tactics represent the <strong>tactical goals</strong> that adversaries try to achieve during their operations. 
            Each tactic contains multiple techniques that describe <strong>how</strong> adversaries achieve these goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-opensoc-400 font-medium mb-2">How to Use:</h4>
              <ul className="text-slate-400 space-y-1">
                <li>• Click on any tactic card to explore its techniques</li>
                <li>• Use tactic names in search filters</li>
                <li>• Order shows typical attack progression</li>
                <li>• Switch between Enterprise, Mobile, and ICS domains</li>
              </ul>
            </div>
            <div>
              <h4 className="text-opensoc-400 font-medium mb-2">Domain Differences:</h4>
              <p className="text-slate-400">
                <span className="text-blue-300">Enterprise</span> focuses on traditional IT, 
                <span className="text-green-300"> Mobile</span> covers iOS/Android threats, and 
                <span className="text-orange-300">ICS</span> addresses industrial control systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tactics Grid */}
      {tacticsLoading ? (
        <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-opensoc-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading {tacticsDomain} tactics...</p>
        </div>
      ) : tactics.length > 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-white font-medium flex items-center">
              <span className="mr-2">
                {tacticsDomain === 'enterprise' && '🏢'}
                {tacticsDomain === 'mobile' && '📱'}
                {tacticsDomain === 'ics' && '🏭'}
              </span>
              {tacticsDomain.charAt(0).toUpperCase() + tacticsDomain.slice(1)} Domain Tactics ({tactics.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tactics.map((tactic) => (
            <div 
              key={tactic.id} 
              className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6 hover:bg-soc-dark-700 cursor-pointer transition-all duration-200 group"
              onClick={() => {
                // Switch to search tab and search for this tactic
                setActiveTab('search');
                setSearchParams({
                  ...searchParams,
                  domain: tacticsDomain,
                  query: tactic.name.toLowerCase(),
                  tactic: tactic.short_name || tactic.name.toLowerCase().replace(/\s+/g, '-')
                });
                // Auto-trigger search
                setTimeout(() => {
                  handleSearch();
                }, 100);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm bg-purple-900/30 text-purple-300 px-2 py-1 rounded group-hover:bg-purple-800/40">
                  {tactic.id}
                </span>
                <span className="text-sm text-slate-500">
                  Order: {tactic.order}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-opensoc-300">{tactic.name}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-3">{tactic.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {tactic.technique_count || 0} techniques
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-opensoc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to explore techniques
                  </span>
                  {tactic.url && (
                    <a
                      href={tactic.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-opensoc-400 hover:text-opensoc-300 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details →
                    </a>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">No Tactics Found</h4>
          <p className="text-slate-400">Unable to load tactics for the {tacticsDomain} domain. Please check the service status.</p>
        </div>
      )}
    </div>
  );

  const renderAiQuickStartSection = () => (
    <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Cpu className="h-5 w-5 mr-2 text-opensoc-400" />
        AI Analysis Quick Start Scenarios
      </h3>
      <p className="text-slate-400 text-sm mb-6">
        Test the AI-powered MITRE analysis with realistic cybersecurity scenarios. Click any scenario to auto-populate the analysis prompt and trigger AI evaluation.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiAnalysisScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleAiQuickStart(scenario)}
            disabled={isLoading}
            className="p-4 bg-soc-dark-700 hover:bg-soc-dark-600 border border-soc-dark-600 hover:border-opensoc-500 rounded-lg transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{scenario.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white group-hover:text-opensoc-300 transition-colors">
                  {scenario.title}
                </h4>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                  {scenario.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                    MITRE Analysis
                  </span>
                  <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                    AI Powered
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAiTab = () => (
    <div className="space-y-6">
      {/* AI Quick Start Scenarios */}
      {renderAiQuickStartSection()}
      
      {/* AI Analysis Form */}
      <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Cpu className="h-5 w-5 mr-2" />
          AI-Powered MITRE Analysis
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Analysis Prompt
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the attack pattern, indicators, or security event you want to analyze using MITRE ATT&CK framework..."
              className="w-full px-3 py-2 bg-soc-dark-700 border border-soc-dark-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
              rows={4}
            />
          </div>
          
          <button
            onClick={handleAiAnalysis}
            disabled={isLoading || !aiPrompt.trim()}
            className="px-4 py-2 bg-opensoc-600 text-white rounded-md hover:bg-opensoc-700 disabled:bg-slate-600 flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Analyze with AI
          </button>
        </div>
      </div>

      {aiResponse && (
        <AiAnalysisResults
          aiResponse={aiResponse}
          rawContent={aiResponse.data?.analysis || aiResponse.data?.content || ''}
          onTechniqueClick={async (techniqueId: string) => {
            // Directly load technique details with fallback across domains
            const dummyTechnique: MitreTechnique = {
              id: techniqueId,
              name: techniqueId, // Placeholder - will be replaced with actual data
              description: '', // Placeholder
              tactics: [],
              platforms: [],
              domain: searchParams.domain
            };
            
            // Switch to search tab to show the technique details
            setActiveTab('search');
            
            // Call handleTechniqueSelect which now has domain fallback logic
            await handleTechniqueSelect(dummyTechnique);
          }}
        />
      )}
    </div>
  );

  const renderTechniqueDetails = () => {
    if (!selectedTechnique) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-soc-dark-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-soc-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-mono text-sm bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                    {selectedTechnique.id}
                  </span>
                  {selectedTechnique.is_sub_technique && (
                    <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded">
                      Sub-technique
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedTechnique.name}</h2>
              </div>
              <button
                onClick={() => setSelectedTechnique(null)}
                className="text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Description</h3>
              <p className="text-slate-400">{selectedTechnique.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Tactics</h3>
                <div className="space-y-1">
                  {selectedTechnique.tactics.map((tactic) => (
                    <span key={tactic} className="inline-block bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm mr-2">
                      {tactic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Platforms</h3>
                <div className="space-y-1">
                  {selectedTechnique.platforms.map((platform) => (
                    <span key={platform} className="inline-block bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm mr-2">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-2">Data Sources</h3>
              <div className="space-y-1">
                {selectedTechnique.data_sources.map((source) => (
                  <span key={source} className="inline-block bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm mr-2">
                    {source}
                  </span>
                ))}
              </div>
            </div>
            
            {selectedTechnique.detection && (
              <div>
                <h3 className="font-semibold text-white mb-2">Detection</h3>
                <div className="bg-yellow-900/20 p-4 rounded-md">
                  <p className="text-slate-400 text-sm">{selectedTechnique.detection}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-soc-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Shield className="h-8 w-8 mr-3 text-opensoc-400" />
            MITRE ATT&CK Framework
          </h1>
          <p className="text-slate-400 mt-2">
            Comprehensive MITRE ATT&CK analysis with AI-powered threat hunting capabilities
          </p>
        </div>

        {/* Service Status */}
        {renderServiceStatus()}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'search', name: 'Technique Search', icon: Search },
              { id: 'tactics', name: 'Tactics Overview', icon: BarChart3 },
              { id: 'ai', name: 'AI Analysis', icon: Cpu }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-opensoc-500 text-opensoc-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-200">
          {activeTab === 'search' && renderSearchTab()}
          {activeTab === 'tactics' && renderTacticsTab()}
          {activeTab === 'ai' && renderAiTab()}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-soc-dark-800 rounded-lg p-6 max-w-md">
              <div className="flex items-center mb-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-opensoc-600 mr-3"></div>
                <span className="text-white font-medium">AI Analysis in Progress</span>
              </div>
              <p className="text-slate-300 text-sm">{loadingMessage}</p>
              <div className="mt-4 bg-soc-dark-700 rounded-full h-2">
                <div className="bg-opensoc-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Technique Details Modal */}
        {renderTechniqueDetails()}
      </div>
    </div>
  );
};

export default MitreAttackPage;