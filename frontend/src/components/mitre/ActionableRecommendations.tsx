import React, { useState } from 'react';
import { 
  Zap, 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  Eye,
  BookOpen,
  Copy,
  ExternalLink,
  ArrowRight,
  Filter,
  Layers,
  Activity
} from 'lucide-react';
import type { MitreTechnique } from '../../services/alertService';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
  category: 'immediate' | 'investigate' | 'detect' | 'prevent' | 'hunt';
  techniques: string[];
  actionType: 'manual' | 'automated' | 'query' | 'rule';
  queryContent?: string;
  ruleContent?: string;
  links?: string[];
}

interface ActionableRecommendationsProps {
  techniques: MitreTechnique[];
  alertContext: {
    severity: string;
    assetCriticality?: string;
    sourceSystem: string;
  };
  aiGuidance?: string[];
}

const ActionableRecommendations: React.FC<ActionableRecommendationsProps> = ({
  techniques,
  alertContext,
  aiGuidance = []
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set(['critical', 'high']));
  const [copiedContent, setCopiedContent] = useState<string>('');

  const copyToClipboard = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopiedContent(label);
    setTimeout(() => setCopiedContent(''), 2000);
  };

  // Generate actionable recommendations based on techniques
  const generateRecommendations = (): ActionItem[] => {
    const recommendations: ActionItem[] = [];

    // Immediate response actions
    recommendations.push({
      id: 'isolate-asset',
      title: 'Isolate Affected Asset',
      description: `Immediately isolate ${alertContext.sourceSystem || 'the affected system'} from the network to prevent lateral movement`,
      priority: alertContext.severity === 'critical' ? 'critical' : 'high',
      timeframe: 'Immediate (< 5 min)',
      category: 'immediate',
      techniques: techniques.slice(0, 3).map(t => t.id),
      actionType: 'manual'
    });

    recommendations.push({
      id: 'preserve-evidence',
      title: 'Preserve Forensic Evidence',
      description: 'Create memory dumps and disk images before any remediation actions',
      priority: 'high',
      timeframe: 'Immediate (< 10 min)',
      category: 'immediate',
      techniques: techniques.map(t => t.id),
      actionType: 'manual'
    });

    // Investigation actions
    techniques.forEach((technique, index) => {
      if (technique.tactics.includes('execution')) {
        recommendations.push({
          id: `investigate-execution-${technique.id}`,
          title: `Investigate ${technique.name} Execution`,
          description: `Analyze process execution patterns related to ${technique.name}`,
          priority: technique.confidence_score && technique.confidence_score > 0.7 ? 'high' : 'medium',
          timeframe: '15-30 minutes',
          category: 'investigate',
          techniques: [technique.id],
          actionType: 'query',
          queryContent: `SecurityEvent\n| where EventID == 4688\n| where ProcessName contains "${technique.name.split(' ')[0].toLowerCase()}"\n| project TimeGenerated, Computer, Account, ProcessName, CommandLine\n| order by TimeGenerated desc`
        });
      }

      if (technique.tactics.includes('persistence')) {
        recommendations.push({
          id: `detect-persistence-${technique.id}`,
          title: `Detect ${technique.name} Persistence`,
          description: `Set up monitoring for persistence mechanisms used in ${technique.name}`,
          priority: 'medium',
          timeframe: '1-2 hours',
          category: 'detect',
          techniques: [technique.id],
          actionType: 'rule',
          ruleContent: `title: ${technique.name} Detection Rule\ndetection:\n  selection:\n    EventID: [4656, 4663, 4658]\n    ObjectName|contains:\n      - 'registry'\n      - 'startup'\n  condition: selection`
        });
      }
    });

    // Threat hunting recommendations
    const huntingTechniques = techniques.filter(t => 
      t.tactics.includes('defense-evasion') || 
      t.tactics.includes('credential-access') ||
      t.tactics.includes('discovery')
    );

    if (huntingTechniques.length > 0) {
      recommendations.push({
        id: 'hunt-evasion-techniques',
        title: 'Hunt for Defense Evasion Techniques',
        description: 'Proactively search for signs of defense evasion across the environment',
        priority: 'medium',
        timeframe: '2-4 hours',
        category: 'hunt',
        techniques: huntingTechniques.map(t => t.id),
        actionType: 'query',
        queryContent: `// Multi-technique hunting query\nSecurityEvent\n| where EventID in (4688, 4656, 4663)\n| where ProcessName has_any ("powershell", "cmd", "wmic")\n| extend TechniqueIds = "${huntingTechniques.map(t => t.id).join(', ')}"\n| summarize count() by Computer, Account, ProcessName\n| where count_ > 5`
      });
    }

    // Prevention recommendations
    const preventionTechniques = techniques.filter(t => t.confidence_score && t.confidence_score > 0.6);
    if (preventionTechniques.length > 0) {
      recommendations.push({
        id: 'implement-detection-rules',
        title: 'Implement Detection Rules',
        description: `Deploy detection rules for ${preventionTechniques.length} high-confidence techniques`,
        priority: 'medium',
        timeframe: '4-8 hours',
        category: 'prevent',
        techniques: preventionTechniques.map(t => t.id),
        actionType: 'automated',
        links: ['https://github.com/SigmaHQ/sigma']
      });
    }

    // AI-generated recommendations
    if (Array.isArray(aiGuidance)) {
      aiGuidance.forEach((guidance, index) => {
        recommendations.push({
          id: `ai-guidance-${index}`,
          title: `AI Recommendation ${index + 1}`,
          description: guidance,
          priority: index < 2 ? 'high' : 'medium',
          timeframe: 'As appropriate',
          category: 'investigate',
          techniques: techniques.slice(0, 2).map(t => t.id),
          actionType: 'manual'
        });
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const categories = [
    { id: 'all', label: 'All Recommendations', icon: Layers, count: recommendations.length },
    { id: 'immediate', label: 'Immediate Actions', icon: AlertTriangle, count: recommendations.filter(r => r.category === 'immediate').length },
    { id: 'investigate', label: 'Investigation', icon: Search, count: recommendations.filter(r => r.category === 'investigate').length },
    { id: 'detect', label: 'Detection', icon: Eye, count: recommendations.filter(r => r.category === 'detect').length },
    { id: 'prevent', label: 'Prevention', icon: Shield, count: recommendations.filter(r => r.category === 'prevent').length },
    { id: 'hunt', label: 'Threat Hunting', icon: Target, count: recommendations.filter(r => r.category === 'hunt').length }
  ];

  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = activeCategory === 'all' || rec.category === activeCategory;
    const priorityMatch = selectedPriorities.has(rec.priority);
    return categoryMatch && priorityMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'manual': return <Activity className="h-4 w-4" />;
      case 'automated': return <Zap className="h-4 w-4" />;
      case 'query': return <Search className="h-4 w-4" />;
      case 'rule': return <Shield className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const togglePriority = (priority: string) => {
    const newPriorities = new Set(selectedPriorities);
    if (newPriorities.has(priority)) {
      newPriorities.delete(priority);
    } else {
      newPriorities.add(priority);
    }
    setSelectedPriorities(newPriorities);
  };

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-opensoc-400" />
            <h3 className="text-lg font-medium text-white">Actionable Recommendations</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{recommendations.length} recommendations generated</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-soc-dark-700">
        {/* Category Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    activeCategory === category.id
                      ? 'bg-opensoc-500/20 text-opensoc-300 border-opensoc-500/30'
                      : 'bg-soc-dark-900/50 text-slate-400 border-soc-dark-600 hover:text-white hover:border-soc-dark-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                  <span className="px-1.5 py-0.5 text-xs bg-slate-500/30 rounded">
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Filter by Priority:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['critical', 'high', 'medium', 'low'].map(priority => (
              <button
                key={priority}
                onClick={() => togglePriority(priority)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  selectedPriorities.has(priority)
                    ? getPriorityColor(priority)
                    : 'bg-soc-dark-900/50 text-slate-400 border-soc-dark-600 hover:text-white'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-4">
        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => (
            <div key={recommendation.id} className="border border-soc-dark-700 rounded-lg p-4 hover:bg-soc-dark-900/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-opensoc-500/20 rounded-lg">
                    {getActionTypeIcon(recommendation.actionType)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-white">{recommendation.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority}
                      </span>
                      <span className="px-2 py-1 text-xs bg-slate-500/20 text-slate-300 rounded">
                        {recommendation.timeframe}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-2">{recommendation.description}</p>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-400">
                        Techniques: {recommendation.techniques.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Query/Rule Content */}
              {(recommendation.queryContent || recommendation.ruleContent) && (
                <div className="mt-3 p-3 bg-black/30 rounded-lg border border-soc-dark-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">
                      {recommendation.queryContent ? 'Query' : 'Rule'} Content:
                    </span>
                    <button
                      onClick={() => copyToClipboard(
                        recommendation.queryContent || recommendation.ruleContent || '',
                        recommendation.id
                      )}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 overflow-x-auto">
                    {recommendation.queryContent || recommendation.ruleContent}
                  </pre>
                </div>
              )}

              {/* Links */}
              {recommendation.links && recommendation.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendation.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs text-opensoc-400 hover:text-opensoc-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Reference</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Action Type: {recommendation.actionType}</span>
                </div>
                
                <button className="flex items-center space-x-2 px-3 py-1.5 bg-opensoc-500/20 text-opensoc-300 hover:bg-opensoc-500/30 rounded text-xs transition-colors">
                  <span>Execute Action</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No recommendations match the current filters.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedPriorities(new Set(['critical', 'high', 'medium', 'low']));
              }}
              className="mt-2 text-sm text-opensoc-400 hover:text-opensoc-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionableRecommendations;