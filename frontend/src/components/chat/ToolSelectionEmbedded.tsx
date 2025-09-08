import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
  Shield,
  Brain,
  Target,
  Search,
  BarChart3,
  Zap,
  Settings,
  FileText,
  Globe,
  Database,
  Eye,
  Wrench,
  Activity,
  TrendingUp,
  Users,
  Lock,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';

interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  tools: Tool[];
}

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  isDefault: boolean;
  requiresConfig?: boolean;
}

// API data structure from backend
interface APIToolCategory {
  category: string;
  tools: APITool[];
}

interface APITool {
  name: string;
  displayName: string;
  description: string;
  parameters?: any;
}

interface ToolSelectionEmbeddedProps {
  enabledTools: string[];
  onToolsChange: (tools: string[]) => void;
  availableTools?: APIToolCategory[];
}

// Icon mapping function for API categories
const getCategoryIcon = (categoryName: string): React.ComponentType<any> => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Security Alerts': AlertTriangle,
    'Security Analysis': Shield,
    'Asset Security': HardDrive,
    'Threat Hunting': Target,
    'Incident Management': Shield,
    'Incident Analysis': Activity,
    'Incident Response': Zap,
    'Threat Analysis': Brain,
    'Reporting': BarChart3,
    'Dashboard Reports': TrendingUp,
    'Threat Intelligence': Target,
    'Compliance': Lock,
    'Asset Management': Database,
    'Executive Reports': FileText,
    'Context Retrieval': Search,
    'Correlation Analysis': Network,
    'Playbook Retrieval': FileText,
    'Knowledge Synthesis': Brain,
    'Intelligence Search': Globe,
    'Threat Profiling': Users,
    'IOC Assessment': Eye,
    'Campaign Detection': Cpu,
    'Uncategorized': Wrench
  };
  
  return iconMap[categoryName] || Wrench; // Default fallback icon
};

// Safe icon renderer with fallback
const SafeIcon: React.FC<{ IconComponent: React.ComponentType<any> | undefined; className?: string }> = ({ 
  IconComponent, 
  className = "h-5 w-5" 
}) => {
  try {
    if (!IconComponent || typeof IconComponent !== 'function') {
      return <Wrench className={className} />;
    }
    return <IconComponent className={className} />;
  } catch (error) {
    console.warn('Icon rendering error:', error);
    return <Wrench className={className} />;
  }
};

// Transform API data to component structure
const transformAPIData = (apiData: APIToolCategory[]): ToolCategory[] => {
  try {
    return apiData.map(apiCategory => ({
      id: apiCategory.category.toLowerCase().replace(/\s+/g, '_'),
      name: apiCategory.category,
      description: `Tools for ${apiCategory.category.toLowerCase()}`,
      icon: getCategoryIcon(apiCategory.category),
      tools: apiCategory.tools.map(apiTool => ({
        id: apiTool.name,
        name: apiTool.displayName || apiTool.name,
        description: apiTool.description,
        category: apiCategory.category.toLowerCase().replace(/\s+/g, '_'),
        isDefault: true, // Default to enabled for API tools
        requiresConfig: !!apiTool.parameters
      }))
    }));
  } catch (error) {
    console.error('Error transforming API data:', error);
    return []; // Return empty array on error
  }
};

// Define all available tools organized by category
const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'security_alerts',
    name: 'Security Alerts',
    description: 'Analyze and manage security alerts',
    icon: AlertTriangle,
    tools: [
      {
        id: 'get_latest_critical_alerts',
        name: 'Latest Critical Alerts',
        description: 'Retrieve the most recent critical security alerts',
        category: 'security_alerts',
        isDefault: true
      },
      {
        id: 'analyze_alert_trends',
        name: 'Alert Trend Analysis',
        description: 'Analyze patterns and trends in security alerts',
        category: 'security_alerts',
        isDefault: true
      },
      {
        id: 'get_alerts_by_asset',
        name: 'Asset Alert Search',
        description: 'Find all alerts related to specific assets',
        category: 'security_alerts',
        isDefault: true
      },
      {
        id: 'search_alerts_by_indicators',
        name: 'Indicator-based Search',
        description: 'Search alerts using specific threat indicators',
        category: 'security_alerts',
        isDefault: true
      }
    ]
  },
  {
    id: 'incident_management',
    name: 'Incident Management',
    description: 'Manage and respond to security incidents',
    icon: Shield,
    tools: [
      {
        id: 'get_active_incidents',
        name: 'Active Incidents',
        description: 'Retrieve currently active security incidents',
        category: 'incident_management',
        isDefault: true
      },
      {
        id: 'get_incident_details',
        name: 'Incident Details',
        description: 'Get comprehensive details for specific incidents',
        category: 'incident_management',
        isDefault: true
      },
      {
        id: 'suggest_incident_response_steps',
        name: 'Response Suggestions',
        description: 'AI-powered incident response step recommendations',
        category: 'incident_management',
        isDefault: true
      },
      {
        id: 'analyze_incident_patterns',
        name: 'Pattern Analysis',
        description: 'Analyze patterns across multiple incidents',
        category: 'incident_management',
        isDefault: true
      },
      {
        id: 'generate_incident_summary_report',
        name: 'Summary Reports',
        description: 'Generate comprehensive incident summary reports',
        category: 'incident_management',
        isDefault: true
      }
    ]
  },
  {
    id: 'reporting',
    name: 'Security Reporting',
    description: 'Generate comprehensive security reports',
    icon: BarChart3,
    tools: [
      {
        id: 'generate_security_dashboard_summary',
        name: 'Dashboard Summary',
        description: 'Generate real-time security dashboard summaries',
        category: 'reporting',
        isDefault: true
      },
      {
        id: 'generate_threat_intelligence_report',
        name: 'Threat Intelligence Report',
        description: 'Comprehensive threat intelligence analysis reports',
        category: 'reporting',
        isDefault: true
      },
      {
        id: 'generate_compliance_report',
        name: 'Compliance Reports',
        description: 'Security compliance and audit reports',
        category: 'reporting',
        isDefault: true
      },
      {
        id: 'generate_asset_security_report',
        name: 'Asset Security Report',
        description: 'Security status reports for assets and infrastructure',
        category: 'reporting',
        isDefault: true
      },
      {
        id: 'generate_executive_summary',
        name: 'Executive Summary',
        description: 'High-level executive security summaries',
        category: 'reporting',
        isDefault: true
      }
    ]
  },
  {
    id: 'context_retrieval',
    name: 'Smart Context & RAG',
    description: 'Intelligent context retrieval and analysis',
    icon: Brain,
    tools: [
      {
        id: 'smart_context_search',
        name: 'Smart Context Search',
        description: 'AI-powered context search across all SOC data',
        category: 'context_retrieval',
        isDefault: true
      },
      {
        id: 'find_related_security_data',
        name: 'Related Data Finder',
        description: 'Find correlated security data and events',
        category: 'context_retrieval',
        isDefault: true
      },
      {
        id: 'semantic_playbook_search',
        name: 'Playbook Search',
        description: 'Find relevant playbooks for incident response',
        category: 'context_retrieval',
        isDefault: true
      },
      {
        id: 'contextual_threat_analysis',
        name: 'Threat Context Analysis',
        description: 'Comprehensive contextual threat analysis',
        category: 'context_retrieval',
        isDefault: true
      },
      {
        id: 'intelligent_knowledge_extraction',
        name: 'Knowledge Extraction',
        description: 'Extract and synthesize security knowledge',
        category: 'context_retrieval',
        isDefault: true
      }
    ]
  },
  {
    id: 'threat_intelligence',
    name: 'Threat Intelligence',
    description: 'Advanced threat intelligence analysis',
    icon: Target,
    tools: [
      {
        id: 'analyze_threat_indicators',
        name: 'Indicator Analysis',
        description: 'Analyze threat indicators for patterns and attribution',
        category: 'threat_intelligence',
        isDefault: true
      },
      {
        id: 'search_threat_intelligence',
        name: 'Threat Intel Search',
        description: 'Search and correlate threat intelligence data',
        category: 'threat_intelligence',
        isDefault: true
      },
      {
        id: 'generate_threat_profile',
        name: 'Threat Profiling',
        description: 'Generate comprehensive threat actor profiles',
        category: 'threat_intelligence',
        isDefault: true
      },
      {
        id: 'assess_ioc_quality',
        name: 'IOC Quality Assessment',
        description: 'Assess quality and reliability of IOCs',
        category: 'threat_intelligence',
        isDefault: true
      },
      {
        id: 'detect_threat_campaigns',
        name: 'Campaign Detection',
        description: 'Detect coordinated threat campaigns',
        category: 'threat_intelligence',
        isDefault: true
      }
    ]
  },
  {
    id: 'mitre_attack',
    name: 'MITRE ATT&CK',
    description: 'MITRE ATT&CK framework analysis',
    icon: Zap,
    tools: [
      {
        id: 'search_mitre_techniques',
        name: 'Technique Search',
        description: 'Search MITRE ATT&CK techniques and tactics',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'analyze_attack_patterns',
        name: 'Attack Pattern Analysis',
        description: 'Analyze attack patterns using MITRE framework',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'get_technique_details',
        name: 'Technique Details',
        description: 'Get detailed information about specific techniques',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'find_related_techniques',
        name: 'Related Techniques',
        description: 'Find related MITRE techniques and procedures',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'generate_threat_hunt_hypotheses',
        name: 'Hunt Hypotheses',
        description: 'Generate threat hunting hypotheses',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'create_detection_rules',
        name: 'Detection Rules',
        description: 'Create detection rules based on MITRE techniques',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'assess_coverage',
        name: 'Coverage Assessment',
        description: 'Assess security coverage against MITRE framework',
        category: 'mitre_attack',
        isDefault: true
      },
      {
        id: 'search_threat_groups',
        name: 'Threat Groups',
        description: 'Search and analyze threat groups and actors',
        category: 'mitre_attack',
        isDefault: true
      }
    ]
  }
];

const ToolSelectionEmbedded: React.FC<ToolSelectionEmbeddedProps> = ({
  enabledTools,
  onToolsChange,
  availableTools
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['security_alerts', 'incident_management']) // Default expanded categories
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByDefault, setFilterByDefault] = useState(false);

  // Transform API data to component structure, or use fallback
  const toolCategories = useMemo(() => {
    try {
      if (availableTools && availableTools.length > 0) {
        // Transform API data to component structure
        const transformed = transformAPIData(availableTools);
        // If transformation fails or returns empty, use fallback
        return transformed.length > 0 ? transformed : TOOL_CATEGORIES;
      }
      // Fallback to hardcoded categories
      return TOOL_CATEGORIES;
    } catch (error) {
      console.error('Error processing tool categories:', error);
      // Always fallback to hardcoded categories on error
      return TOOL_CATEGORIES;
    }
  }, [availableTools]);

  // Filter tools based on search and default filter
  const filteredCategories = useMemo(() => {
    return toolCategories.map(category => ({
      ...category,
      tools: category.tools.filter(tool => {
        const matchesSearch = searchQuery === '' || 
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = !filterByDefault || tool.isDefault;
        
        return matchesSearch && matchesFilter;
      })
    })).filter(category => category.tools.length > 0);
  }, [searchQuery, filterByDefault, toolCategories]);

  // Calculate statistics
  const totalTools = toolCategories.reduce((sum, cat) => sum + cat.tools.length, 0);
  const enabledCount = enabledTools.length;
  const defaultToolsCount = toolCategories.reduce(
    (sum, cat) => sum + cat.tools.filter(tool => tool.isDefault).length, 0
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTool = (toolId: string) => {
    const newEnabledTools = enabledTools.includes(toolId)
      ? enabledTools.filter(id => id !== toolId)
      : [...enabledTools, toolId];
    
    onToolsChange(newEnabledTools);
  };

  const toggleCategoryTools = (categoryId: string, enable: boolean) => {
    const category = toolCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    const categoryToolIds = category.tools.map(tool => tool.id);
    
    let newEnabledTools: string[];
    if (enable) {
      // Add all category tools that aren't already enabled
      newEnabledTools = [...new Set([...enabledTools, ...categoryToolIds])];
    } else {
      // Remove all category tools
      newEnabledTools = enabledTools.filter(toolId => !categoryToolIds.includes(toolId));
    }
    
    onToolsChange(newEnabledTools);
  };

  const selectAllTools = () => {
    const allToolIds = toolCategories.flatMap(cat => cat.tools.map(tool => tool.id));
    onToolsChange(allToolIds);
  };

  const selectDefaultTools = () => {
    const defaultToolIds = toolCategories.flatMap(cat => 
      cat.tools.filter(tool => tool.isDefault).map(tool => tool.id)
    );
    onToolsChange(defaultToolIds);
  };

  const clearAllTools = () => {
    onToolsChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="p-4 border border-soc-dark-700 rounded-lg bg-soc-dark-800/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-soc-dark-800 border border-soc-dark-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500"
              />
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filterByDefault}
                onChange={(e) => setFilterByDefault(e.target.checked)}
                className="rounded border-soc-dark-600 bg-soc-dark-700 text-opensoc-500 focus:ring-opensoc-500"
              />
              <span className="text-slate-300">Show only recommended tools</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllTools}
              className="px-3 py-1.5 text-xs bg-opensoc-600 hover:bg-opensoc-700 text-white rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={selectDefaultTools}
              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Select Recommended
            </button>
            <button
              onClick={clearAllTools}
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-soc-dark-800 rounded-lg p-3">
            <div className="text-lg font-semibold text-white">{enabledCount}</div>
            <div className="text-xs text-slate-400">Enabled Tools</div>
          </div>
          <div className="bg-soc-dark-800 rounded-lg p-3">
            <div className="text-lg font-semibold text-green-400">{defaultToolsCount}</div>
            <div className="text-xs text-slate-400">Recommended</div>
          </div>
          <div className="bg-soc-dark-800 rounded-lg p-3">
            <div className="text-lg font-semibold text-slate-300">{totalTools}</div>
            <div className="text-xs text-slate-400">Total Available</div>
          </div>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const categoryToolIds = category.tools.map(tool => tool.id);
          const enabledInCategory = categoryToolIds.filter(id => enabledTools.includes(id)).length;
          const allCategoryEnabled = enabledInCategory === category.tools.length;
          const someCategoryEnabled = enabledInCategory > 0 && enabledInCategory < category.tools.length;

          return (
            <div key={category.id} className="border border-soc-dark-700 rounded-lg overflow-hidden">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-4 bg-soc-dark-800 cursor-pointer hover:bg-soc-dark-700 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <SafeIcon IconComponent={category.icon} className="h-5 w-5 text-opensoc-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{category.name}</h3>
                    <p className="text-sm text-slate-400">{category.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-slate-400">
                    {enabledInCategory}/{category.tools.length} enabled
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryTools(category.id, !allCategoryEnabled);
                      }}
                      className="p-1 hover:bg-soc-dark-600 rounded transition-colors"
                    >
                      {allCategoryEnabled ? (
                        <CheckSquare className="h-4 w-4 text-opensoc-500" />
                      ) : someCategoryEnabled ? (
                        <Square className="h-4 w-4 text-opensoc-400 fill-current opacity-50" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Tools */}
              {isExpanded && (
                <div className="border-t border-soc-dark-700">
                  {category.tools.map((tool) => {
                    const isEnabled = enabledTools.includes(tool.id);
                    
                    return (
                      <div 
                        key={tool.id}
                        className="flex items-center justify-between p-4 hover:bg-soc-dark-800/50 transition-colors border-b border-soc-dark-700 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <button
                            onClick={() => toggleTool(tool.id)}
                            className="flex-shrink-0"
                          >
                            {isEnabled ? (
                              <CheckSquare className="h-5 w-5 text-opensoc-500" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-500 hover:text-slate-400" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-white">{tool.name}</h4>
                              {tool.isDefault && (
                                <span className="px-2 py-0.5 text-xs bg-green-600/20 text-green-400 rounded-full">
                                  Recommended
                                </span>
                              )}
                              {tool.requiresConfig && (
                                <span className="px-2 py-0.5 text-xs bg-yellow-600/20 text-yellow-400 rounded-full">
                                  Config Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{tool.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="text-sm text-slate-400 p-3 bg-soc-dark-800/30 rounded-lg border border-soc-dark-700">
        Tools will be available for AI chat interactions immediately after selection. Changes are saved automatically.
      </div>
    </div>
  );
};

export default ToolSelectionEmbedded;