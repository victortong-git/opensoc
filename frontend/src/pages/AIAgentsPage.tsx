import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Activity, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Zap,
  Brain,
  Target,
  Shield,
  BarChart3,
  Lightbulb,
  Settings,
  RefreshCw,
  User,
  ChevronRight,
  Star,
  Award,
  Cpu,
  Clock,
  Eye,
  ExternalLink,
  Heart,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import { AIAgent } from '../services/aiAgentsService';
import aiAgentsService from '../services/aiAgentsService';
import aiAgentProfilesService from '../services/aiAgentProfilesService';
import { 
  fetchAIAgents,
  fetchAIAgentStats,
  fetchAgentActivities,
  fetchSOCTeams
} from '../store/aiAgentsAsync';
import AgentActivityTimeline from '../components/ai/AgentActivityTimeline';
import AgentProductivityCharts from '../components/ai/AgentProductivityCharts';

const AIAgentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { 
    agents,
    activities,
    teams,
    agentStats,
    error
  } = useSelector((state: RootState) => state.aiAgents);

  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'teams' | 'activities' | 'timeline' | 'productivity'>('overview');
  const [realActivities, setRealActivities] = useState<any[]>([]);
  const [enhancedAgents, setEnhancedAgents] = useState<any[]>([]);
  const [profileAgents, setProfileAgents] = useState<any[]>([]);
  const [socialFeed, setSocialFeed] = useState<any[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);
  
  // Load real activities and enhanced agents
  const loadRealData = async () => {
    setLoadingRealData(true);
    try {
      const [realActivitiesResponse, enhancedAgentsResponse, profileAgentsResponse, socialFeedResponse] = await Promise.all([
        aiAgentsService.getRealActivities({ limit: 20 }),
        aiAgentsService.getEnhancedAgentProfiles(),
        aiAgentProfilesService.getAgentProfiles({ limit: 50 }),
        aiAgentsService.getAgentSocialFeed(10)
      ]);

      setRealActivities(realActivitiesResponse.activities || []);
      setEnhancedAgents(enhancedAgentsResponse.agents || []);
      setProfileAgents(profileAgentsResponse.agents || []);
      setSocialFeed(socialFeedResponse.feed || []);
    } catch (err) {
      console.error('Failed to load real activities:', err);
    } finally {
      setLoadingRealData(false);
    }
  };

  // Refresh all AI agent data
  const handleRefresh = () => {
    dispatch(fetchAIAgents());
    dispatch(fetchAIAgentStats());
    dispatch(fetchAgentActivities({ limit: 10 })); // Show recent 10 activities
    dispatch(fetchSOCTeams());
    loadRealData(); // Load real social media activities
  };
  
  // Load data on component mount
  useEffect(() => {
    dispatch(fetchAIAgents());
    dispatch(fetchAIAgentStats());
    dispatch(fetchAgentActivities({ limit: 10 })); // Show recent 10 activities
    dispatch(fetchSOCTeams());
    loadRealData(); // Load real social media activities
  }, [dispatch]);

  // Safe date parsing helper
  const safeParseDate = (dateValue: string | Date): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      try {
        return parseISO(dateValue);
      } catch {
        return new Date(dateValue);
      }
    }
    return new Date();
  };

  // Safe date formatting helper
  const safeFormatDistance = (dateValue: string | Date): string => {
    try {
      const parsedDate = safeParseDate(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Helper function to get completed AI tasks count from profile data
  const getCompletedAITasksCount = (agentName: string): number => {
    if (!agentName || !profileAgents || !Array.isArray(profileAgents)) return 0;
    
    const profileAgent = profileAgents.find(agent => 
      agent?.name?.toLowerCase() === agentName.toLowerCase()
    );
    
    return profileAgent?.socialMetrics?.totalActivities || 0;
  };

  // Calculate overview metrics from API data with comprehensive null checks
  const safeAgents = Array.isArray(agents) ? agents : [];
  const metrics = {
    totalAgents: agentStats?.total || safeAgents.length,
    activeAgents: agentStats?.active || safeAgents.filter(a => a?.status === 'online').length,
    totalTasks: agentStats?.totalTasks || safeAgents.reduce((sum, agent) => {
      const tasksInProgress = agent?.metrics?.tasksInProgress || agent?.currentTasks?.length || 0;
      return sum + tasksInProgress;
    }, 0),
    avgSuccessRate: agentStats?.avgSuccessRate || Math.round(safeAgents.reduce((sum, agent) => {
      return sum + (agent?.metrics?.successRate || 85);
    }, 0) / (safeAgents.length || 1)),
    totalTasksCompleted: safeAgents.reduce((sum, agent) => {
      return sum + getCompletedAITasksCount(agent?.name || '');
    }, 0),
    avgCollaborationScore: Math.round(safeAgents.reduce((sum, agent) => {
      return sum + (agent?.metrics?.collaborationScore || 80);
    }, 0) / (safeAgents.length || 1)),
    falsePositiveReduction: safeAgents.find(a => a?.type === 'soc_analyst')?.metrics?.falsePositiveReduction || 0
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing': return <Activity className="h-4 w-4 text-yellow-400 animate-pulse" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-orange-400" />;
      case 'offline': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'soc_analyst': return <Shield className="h-5 w-5 text-blue-400" />;
      case 'incident_response': return <Target className="h-5 w-5 text-red-400" />;
      case 'threat_intel': return <Brain className="h-5 w-5 text-purple-400" />;
      case 'report_generation': return <BarChart3 className="h-5 w-5 text-green-400" />;
      default: return <Bot className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCapabilityTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Brain className="h-4 w-4 text-blue-400" />;
      case 'automation': return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'prediction': return <TrendingUp className="h-4 w-4 text-purple-400" />;
      case 'learning': return <Lightbulb className="h-4 w-4 text-orange-400" />;
      default: return <Cpu className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  // Navigate to agent profile
  const handleViewAgentProfile = (agentName: string) => {
    navigate(`/ai-agents/${encodeURIComponent(agentName)}`);
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Agents</h1>
            <p className="text-slate-400 mt-2">Error loading AI agents data</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load AI Agents</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              dispatch(fetchAIAgents());
              dispatch(fetchAIAgentStats());
              dispatch(fetchAgentActivities({ limit: 10 }));
              dispatch(fetchSOCTeams());
            }}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const AgentDetailsModal: React.FC<{ agent: AIAgent; onClose: () => void }> = ({ agent, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-4">
            {getAgentTypeIcon(agent.type)}
            <div>
              <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                {getAgentStatusIcon(agent.status)}
                <span className="text-sm text-slate-400">v{agent.version}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Agent Overview</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{agent.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">Primary Functions</h3>
                <div className="space-y-2">
                  {(agent?.primaryFunctions || []).map((func, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{func}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">Collaboration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Assigned Humans:</span>
                    <span className="text-white text-sm">{agent?.assignedHumans?.length || 0}</span>
                  </div>
                  <div className="space-y-1">
                    {(agent?.assignedHumans || []).map((human, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <User className="h-3 w-3 text-opensoc-400" />
                        <span className="text-opensoc-400">{human}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance & Capabilities */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-soc-dark-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Success Rate</div>
                    <div className="text-lg font-bold text-green-400">{agent?.metrics?.successRate || 85}%</div>
                  </div>
                  <div className="bg-soc-dark-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">AI Tasks Completed</div>
                    <div className="text-lg font-bold text-white">{getCompletedAITasksCount(agent?.name || '').toLocaleString()}</div>
                  </div>
                  <div className="bg-soc-dark-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Uptime</div>
                    <div className="text-lg font-bold text-blue-400">{agent?.metrics?.uptime || 98}%</div>
                  </div>
                  <div className="bg-soc-dark-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Collaboration Score</div>
                    <div className="text-lg font-bold text-yellow-400">{agent?.metrics?.collaborationScore || 85}/100</div>
                  </div>
                  {agent?.metrics?.falsePositiveReduction && (
                    <div className="bg-soc-dark-800/50 p-3 rounded-lg col-span-2">
                      <div className="text-xs text-slate-400">False Positive Reduction</div>
                      <div className="text-lg font-bold text-green-400">{agent.metrics.falsePositiveReduction}%</div>
                      <div className="text-xs text-slate-500 mt-1">Target: 60% (✓ Achieved)</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">AI Capabilities</h3>
                <div className="space-y-3">
                  {(agent?.capabilities || []).map((capability) => (
                    <div key={capability?.id || 'unknown'} className="bg-soc-dark-800/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getCapabilityTypeIcon(capability?.type || 'analysis')}
                          <span className="text-white font-medium text-sm">{capability?.name || 'Unknown Capability'}</span>
                        </div>
                        <span className="text-xs text-slate-400">{capability?.accuracy || 90}%</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{capability?.description || 'No description available'}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">Learning Progress:</span>
                        <div className="flex-1 bg-soc-dark-700 rounded-full h-1">
                          <div 
                            className="bg-opensoc-500 h-1 rounded-full" 
                            style={{ width: `${capability?.learningProgress || 80}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{capability?.learningProgress || 80}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Current Tasks */}
          {(agent?.currentTasks || []).length > 0 && (
            <div className="mt-6 pt-6 border-t border-soc-dark-700">
              <h3 className="text-lg font-medium text-white mb-3">Current Tasks</h3>
              <div className="space-y-3">
                {(agent?.currentTasks || []).map((task) => (
                  <div key={task?.id || 'unknown-task'} className="bg-soc-dark-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{task?.title || 'Unknown Task'}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Confidence: {task?.confidence || 90}%</span>
                        {task?.collaboratingHuman && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-opensoc-400" />
                            <span className="text-xs text-opensoc-400">{task.collaboratingHuman}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">{task?.description || 'No description available'}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Started: {safeFormatDistance(task?.startTime)}</span>
                      <span className="text-slate-400">Priority: {task?.priority || 3}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button className="btn-primary">Configure Agent</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Agents</h1>
          <p className="text-slate-400 mt-1">
            SOC team collaboration for intelligent security operations
          </p>
          <p className="text-opensoc-400 mt-2 text-sm">
            💡 Click on any agent card to view detailed information, performance metrics, and current tasks
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Agent Settings</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-soc-dark-800 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'agents', label: 'AI Agents', icon: Bot },
          { id: 'teams', label: 'SOC Teams', icon: Users },
          { id: 'activities', label: 'Recent Activities', icon: Activity },
          { id: 'timeline', label: 'Activity Timeline', icon: Clock },
          { id: 'productivity', label: 'Productivity Charts', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id 
                ? 'bg-opensoc-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Total Agents</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.totalAgents}</div>
            </div>
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-slate-400">Active</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{metrics.activeAgents}</div>
            </div>
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-slate-400">Current Tasks</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{metrics.totalTasks}</div>
            </div>
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-400">Success Rate</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{metrics.avgSuccessRate}%</div>
            </div>
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-opensoc-400" />
                <span className="text-sm text-slate-400">Tasks Done</span>
              </div>
              <div className="text-xl font-bold text-white">{metrics.totalTasksCompleted.toLocaleString()}</div>
            </div>
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-slate-400">Collaboration</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">{metrics.avgCollaborationScore}/100</div>
            </div>
            <div className="card !p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-sm text-slate-400">FP Reduction</span>
              </div>
              <div className="text-2xl font-bold text-red-400">{metrics.falsePositiveReduction}%</div>
            </div>
          </div>

          {/* Agent Status Overview */}
          <div className="card">
            <div className="p-6 border-b border-soc-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">AI Agent Status Overview</h3>
                <div className="text-sm text-opensoc-400 flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>Click any agent for details</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {safeAgents.map(agent => (
                  <div key={agent.id} className="bg-soc-dark-800/30 p-4 rounded-lg border border-transparent transition-all duration-200 group relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getAgentTypeIcon(agent.type)}
                        <span className="font-medium text-white text-sm">{agent.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getAgentStatusIcon(agent.status)}
                        <button
                          onClick={() => handleViewAgentProfile(agent.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-opensoc-400 hover:text-opensoc-300"
                          title="View Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">AI Tasks Completed:</span>
                        <span className="text-green-400">{getCompletedAITasksCount(agent?.name || '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Success Rate:</span>
                        <span className="text-green-400">{agent?.metrics?.successRate || 85}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Collaboration:</span>
                        <span className="text-purple-400">{agent?.metrics?.collaborationScore || 80}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SOC Team Collaboration Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.isArray(teams) && teams.map(team => (
              <div key={team.id} className="card">
                <div className="p-4 border-b border-soc-dark-700">
                  <h4 className="font-medium text-white">{team.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Users className="h-3 w-3 text-opensoc-400" />
                    <span className="text-xs text-opensoc-400">{team?.humanAnalysts?.length || 0} humans</span>
                    <Bot className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{team?.aiAgents?.length || 0} agents</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Efficiency:</span>
                      <span className="text-green-400">{team?.performance?.collaborationEfficiency || 85}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completion Rate:</span>
                      <span className="text-blue-400">{team?.performance?.taskCompletionRate || 90}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Response Time:</span>
                      <span className="text-yellow-400">{team?.performance?.averageResponseTime || 5}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Satisfaction:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-yellow-400">{team?.performance?.humanSatisfactionScore || 4.2}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Workload</span>
                      <span>{team?.currentWorkload || 45}/{team?.maxWorkload || 100}</span>
                    </div>
                    <div className="w-full bg-soc-dark-700 rounded-full h-1">
                      <div 
                        className="bg-opensoc-500 h-1 rounded-full" 
                        style={{ width: `${((team?.currentWorkload || 45) / (team?.maxWorkload || 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Interactive hint */}
          <div className="bg-opensoc-600/10 border border-opensoc-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-opensoc-400" />
              <span className="text-opensoc-300 font-medium">Interactive AI Agent Cards</span>
            </div>
            <p className="text-opensoc-400/80 text-sm mt-1">
              Click on any agent card below to view detailed information, performance metrics, capabilities, and current tasks
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {safeAgents.map(agent => (
              <div key={agent.id} className="card hover:bg-soc-dark-800/30 hover:border-opensoc-500/30 border border-soc-dark-700 transition-all duration-200 group relative overflow-hidden">
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-opensoc-500/0 via-opensoc-500/5 to-opensoc-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-opensoc-500/10 rounded-lg group-hover:bg-opensoc-500/20 transition-colors">
                        {getAgentTypeIcon(agent.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white group-hover:text-opensoc-300 transition-colors">{agent.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {getAgentStatusIcon(agent?.status || 'offline')}
                          <span className="text-xs text-slate-400">v{agent?.version || '1.0.0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedAgent(agent)}
                        className="text-xs text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all font-medium px-2 py-1 rounded bg-soc-dark-700 hover:bg-soc-dark-600"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleViewAgentProfile(agent.name)}
                        className="text-xs text-opensoc-400 hover:text-opensoc-300 opacity-0 group-hover:opacity-100 transition-all font-medium px-2 py-1 rounded bg-opensoc-500/10 hover:bg-opensoc-500/20 flex items-center space-x-1"
                      >
                        <span>Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{agent?.description || 'No description available'}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{agent?.metrics?.successRate || 85}%</div>
                      <div className="text-xs text-slate-400">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{getCompletedAITasksCount(agent?.name || '')}</div>
                      <div className="text-xs text-slate-400">Completed AI Tasks</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-opensoc-400" />
                      <span className="text-opensoc-400">{agent?.assignedHumans?.length || 0} collaborators</span>
                    </div>
                    <span className="text-slate-500">Updated {safeFormatDistance(agent?.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOC Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {(teams || []).map(team => (
            <div key={team?.id || 'unknown-team'} className="card">
              <div className="p-6 border-b border-soc-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">{team?.name || 'Unknown Team'}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-opensoc-400" />
                        <span className="text-sm text-opensoc-400">{team?.humanAnalysts?.length || 0} Human Analysts</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bot className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-400">{team?.aiAgents?.length || 0} AI Agents</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400 capitalize">{team?.specialization || 'general'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Workload</div>
                    <div className="text-lg font-bold text-white">{team?.currentWorkload || 45}%</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-white mb-3">Team Members</h4>
                    <div className="space-y-2">
                      {(team?.humanAnalysts || []).map((analyst, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-opensoc-400" />
                          <span className="text-opensoc-400 text-sm">{analyst}</span>
                          <span className="text-xs text-slate-500">Human Analyst</span>
                        </div>
                      ))}
                      {(team?.aiAgents || []).map((agentId, index) => {
                        const agent = (agents || []).find(a => a?.id === agentId);
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <Bot className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">{agent?.name || agentId}</span>
                            <span className="text-xs text-slate-500">AI Agent</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-3">Team Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Collaboration Efficiency:</span>
                        <span className="text-green-400 font-medium">{team?.performance?.collaborationEfficiency || 85}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Task Completion Rate:</span>
                        <span className="text-blue-400 font-medium">{team?.performance?.taskCompletionRate || 90}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Average Response Time:</span>
                        <span className="text-yellow-400 font-medium">{team?.performance?.averageResponseTime || 5} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Human Satisfaction:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">{team?.performance?.humanSatisfactionScore || 4.2}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">AI Accuracy Improvement:</span>
                        <span className="text-purple-400 font-medium">+{team?.performance?.aiAccuracyImprovement || 15}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          {/* Real Activities Section */}
          <div className="card">
            <div className="p-6 border-b border-soc-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Real AI Activities</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Social media-style feed of actual AI agent activities with likes and comments
                  </p>
                </div>
                {loadingRealData && (
                  <div className="flex items-center space-x-2 text-opensoc-400">
                    <Activity className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {realActivities.length > 0 ? (
                <div className="space-y-6">
                  {realActivities.map((activity, index) => (
                    <div key={activity.id || index} className="bg-soc-dark-800/30 rounded-lg p-6 border border-soc-dark-700">
                      {/* Activity Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="p-2 bg-opensoc-500/10 rounded-full">
                          {activity.success ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{activity.taskName}</h4>
                            <span className="text-xs text-slate-400">{safeFormatDistance(activity.createdAt)}</span>
                          </div>
                          <p className="text-slate-300 text-sm mt-1">{activity.description}</p>
                          
                          {/* Activity Metrics */}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Bot className="h-3 w-3" />
                              <button
                                onClick={() => handleViewAgentProfile(activity.agentName)}
                                className="text-opensoc-400 hover:text-opensoc-300 underline"
                              >
                                {activity.agentName}
                              </button>
                            </div>
                            {activity.executionTimeMs && (
                              <span>⏱️ {Math.round(activity.executionTimeMs / 1000)}s</span>
                            )}
                            {activity.totalTokens && (
                              <span>🧠 {activity.totalTokens} tokens</span>
                            )}
                            <span className={activity.success ? 'text-green-400' : 'text-red-400'}>
                              {activity.success ? '✅ Success' : '❌ Failed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Social Metrics */}
                      <div className="flex items-center justify-between pt-4 border-t border-soc-dark-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <Heart className={`h-4 w-4 ${activity.socialMetrics?.likedByCurrentUser ? 'text-red-400 fill-current' : ''}`} />
                            <span>{activity.socialMetrics?.likes || 0}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <MessageCircle className="h-4 w-4" />
                            <span>{activity.socialMetrics?.comments || 0}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewAgentProfile(activity.agentName)}
                          className="text-xs text-opensoc-400 hover:text-opensoc-300 flex items-center space-x-1"
                        >
                          <span>View Agent Profile</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">No Real Activities Yet</h3>
                  <p className="text-slate-500">AI agents haven't performed any logged activities yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Legacy Activities Section */}
          {activities && activities.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-soc-dark-700">
                <h3 className="text-lg font-medium text-white">Legacy Activities</h3>
                <p className="text-slate-400 text-sm mt-1">System-generated activity simulation</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity?.id || 'unknown-activity'} className="flex items-start space-x-4 p-4 bg-soc-dark-800/30 rounded-lg">
                      <div className={`p-2 rounded-full ${getActivityImpactColor(activity?.impact || 'medium')} border`}>
                        {activity?.activityType === 'task_completed' && <CheckCircle className="h-4 w-4" />}
                        {activity?.activityType === 'learning_update' && <Lightbulb className="h-4 w-4" />}
                        {activity?.activityType === 'collaboration' && <Users className="h-4 w-4" />}
                        {activity?.activityType === 'error' && <AlertCircle className="h-4 w-4" />}
                        {activity?.activityType === 'maintenance' && <Settings className="h-4 w-4" />}
                        {!activity?.activityType && <Activity className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white">{activity?.title || 'Unknown Activity'}</h4>
                          <span className="text-xs text-slate-400">{safeFormatDistance(activity.timestamp)}</span>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{activity.description}</p>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <Bot className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-400">{activity.agentName}</span>
                          </div>
                          {activity.humanInvolved && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-opensoc-400" />
                              <span className="text-opensoc-400">{activity.humanInvolved}</span>
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded-full border text-xs ${getActivityImpactColor(activity.impact)}`}>
                            {activity.impact} impact
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-soc-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">AI Agent Activity Timeline</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Chronological view of all AI agent activities and human collaborations
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  {activities.length} total activities
                </div>
              </div>
            </div>
            <div className="p-6">
              <AgentActivityTimeline 
                activities={activities} 
                showAllActivities={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Productivity Charts Tab */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-soc-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">AI Agent Productivity Analytics</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Daily activity trends, hourly patterns, and performance metrics
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-400">Active Period</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-slate-400">Peak Hours</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AgentProductivityCharts activities={activities} />
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Modal */}
      {selectedAgent && (
        <AgentDetailsModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
};

export default AIAgentsPage;