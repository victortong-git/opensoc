import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Activity, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Award,
  Target,
  Brain,
  BarChart3,
  Shield,
  Zap,
  Lightbulb,
  Star,
  Calendar,
  Timer,
  User,
  Eye,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import aiAgentProfilesService, { AgentProfile, AgentActivity } from '../services/aiAgentProfilesService';

const AgentProfilePage: React.FC = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'analytics'>('overview');
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (agentName) {
      loadAgentData();
    }
  }, [agentName]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load agent profile and activities in parallel
      const [profileResponse, activitiesResponse, dashboardResponse] = await Promise.all([
        aiAgentProfilesService.getAgentProfile(agentName!),
        aiAgentProfilesService.getAgentActivityFeed(agentName!, { limit: 10, offset: 0 }),
        aiAgentProfilesService.getAgentDashboard(agentName!, 'week').catch(() => null)
      ]);

      setAgent(profileResponse.agent);
      setActivities(activitiesResponse.activities);
      setHasMoreActivities(activitiesResponse.pagination.hasMore);
      if (dashboardResponse) {
        setDashboard(dashboardResponse.dashboard);
      }
    } catch (err: any) {
      console.error('Failed to load agent data:', err);
      setError(err.message || 'Failed to load agent profile');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreActivities = async () => {
    if (!hasMoreActivities || !agentName) return;

    try {
      const response = await aiAgentProfilesService.getAgentActivityFeed(agentName, {
        limit: 10,
        offset: activityPage * 10
      });

      setActivities(prev => [...prev, ...response.activities]);
      setHasMoreActivities(response.pagination.hasMore);
      setActivityPage(prev => prev + 1);
    } catch (err) {
      console.error('Failed to load more activities:', err);
    }
  };

  const handleLike = async (activityId: number) => {
    // Optimistic UI update - immediately update the UI
    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) return;
    
    const isCurrentlyLiked = targetActivity.socialMetrics.likedByCurrentUser;
    const optimisticUpdate = {
      likes: isCurrentlyLiked 
        ? targetActivity.socialMetrics.likes - 1 
        : targetActivity.socialMetrics.likes + 1,
      likedByCurrentUser: !isCurrentlyLiked
    };

    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          socialMetrics: {
            ...activity.socialMetrics,
            ...optimisticUpdate
          }
        };
      }
      return activity;
    }));

    try {
      const response = await aiAgentProfilesService.toggleLike(activityId);
      
      // Update with actual server response
      setActivities(prev => prev.map(activity => {
        if (activity.id === activityId) {
          const newLikeCount = response.action === 'added' 
            ? targetActivity.socialMetrics.likes + 1 
            : targetActivity.socialMetrics.likes - 1;
          
          return {
            ...activity,
            socialMetrics: {
              ...activity.socialMetrics,
              likes: newLikeCount,
              likedByCurrentUser: response.action === 'added'
            }
          };
        }
        return activity;
      }));
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
      
      // Revert optimistic update on error
      setActivities(prev => prev.map(activity => {
        if (activity.id === activityId) {
          return {
            ...activity,
            socialMetrics: {
              ...activity.socialMetrics,
              likes: targetActivity.socialMetrics.likes,
              likedByCurrentUser: targetActivity.socialMetrics.likedByCurrentUser
            }
          };
        }
        return activity;
      }));
      
      // Show user-friendly error message
      alert(`Failed to ${isCurrentlyLiked ? 'remove' : 'add'} like. Please try again.`);
    }
  };

  const handleComment = async (activityId: number, commentText: string) => {
    try {
      const response = await aiAgentProfilesService.addComment(activityId, commentText);
      
      // Reload activities to show the new comment
      if (agentName) {
        const activitiesResponse = await aiAgentProfilesService.getAgentActivityFeed(agentName, { 
          limit: activities.length, 
          offset: 0 
        });
        setActivities(activitiesResponse.activities);
      }
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      // Show user-friendly error message
      alert(`Failed to add comment: ${err?.response?.data?.message || 'Please try again.'}`);
    }
  };

  const getCurrentStats = () => {
    if (!dashboard) return null;
    switch (selectedTimeframe) {
      case 'week': return dashboard.weekStats;
      case 'month': return dashboard.monthStats;
      case 'all': return dashboard.allTimeStats;
      default: return dashboard.weekStats;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'soc_analyst': return <Shield className="h-6 w-6 text-blue-400" />;
      case 'incident_response': return <Target className="h-6 w-6 text-red-400" />;
      case 'threat_intel': return <Brain className="h-6 w-6 text-purple-400" />;
      case 'report_generation': return <BarChart3 className="h-6 w-6 text-green-400" />;
      default: return <Bot className="h-6 w-6 text-gray-400" />;
    }
  };

  const safeFormatDistance = (dateValue: string): string => {
    try {
      if (!dateValue) return 'Unknown';
      const parsedDate = parseISO(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/ai-agents')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to AI Agents</span>
          </button>
        </div>
        <div className="card p-12 text-center">
          <Activity className="h-12 w-12 text-opensoc-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-white mb-2">Loading Agent Profile</h3>
          <p className="text-slate-400">Please wait while we fetch the agent data...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/ai-agents')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to AI Agents</span>
          </button>
        </div>
        <div className="card p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Agent Not Found</h3>
          <p className="text-slate-400 mb-4">{error || 'The requested agent profile could not be found.'}</p>
          <button 
            onClick={() => navigate('/ai-agents')}
            className="btn-primary"
          >
            Return to AI Agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/ai-agents')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to AI Agents</span>
          </button>
          <div className="text-slate-400">
            <span>AI Agents</span> <span className="mx-2">/</span> <span className="text-white">{agent.name}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>Share Profile</span>
          </button>
        </div>
      </div>

      {/* Agent Profile Header */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            {/* Agent Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-opensoc-500 to-opensoc-600 rounded-full flex items-center justify-center">
                {getAgentTypeIcon(agent.type)}
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {agent.status}
                </span>
              </div>
              
              <p className="text-slate-300 text-lg mb-4 leading-relaxed">{agent.bio}</p>
              
              {/* Specialties */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((specialty, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-opensoc-500/10 text-opensoc-300 border border-opensoc-500/20"
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-opensoc-400">{agent.socialMetrics.totalActivities}</div>
                  <div className="text-xs text-slate-400">Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{agent.socialMetrics.totalLikesReceived}</div>
                  <div className="text-xs text-slate-400">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{agent.socialMetrics.totalCommentsReceived}</div>
                  <div className="text-xs text-slate-400">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {agent.socialMetrics.successRatePercentage ? `${agent.socialMetrics.successRatePercentage}%` : '—'}
                  </div>
                  <div className="text-xs text-slate-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-soc-dark-800 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'activities', label: 'Activity Feed', icon: Activity },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="p-6 border-b border-soc-dark-700">
                <h3 className="text-lg font-medium text-white">Performance Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-soc-dark-800/50 p-4 rounded-lg text-center">
                    <Clock className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">
                      {agent.socialMetrics.avgExecutionTimeMs ? `${Math.round(agent.socialMetrics.avgExecutionTimeMs / 1000)}s` : '—'}
                    </div>
                    <div className="text-xs text-slate-400">Avg Response</div>
                  </div>
                  <div className="bg-soc-dark-800/50 p-4 rounded-lg text-center">
                    <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-green-400">
                      {agent.socialMetrics.successRatePercentage || 95}%
                    </div>
                    <div className="text-xs text-slate-400">Success Rate</div>
                  </div>
                  <div className="bg-soc-dark-800/50 p-4 rounded-lg text-center">
                    <Activity className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-blue-400">{agent.socialMetrics.totalActivities}</div>
                    <div className="text-xs text-slate-400">Total Tasks</div>
                  </div>
                  <div className="bg-soc-dark-800/50 p-4 rounded-lg text-center">
                    <Users className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-400">
                      {agent.socialMetrics.totalLikesReceived + agent.socialMetrics.totalCommentsReceived}
                    </div>
                    <div className="text-xs text-slate-400">Engagement</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities Preview */}
            <div className="card">
              <div className="p-6 border-b border-soc-dark-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Recent Activities</h3>
                  <button 
                    onClick={() => setActiveTab('activities')}
                    className="text-opensoc-400 hover:text-opensoc-300 text-sm"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {activities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-soc-dark-800/30 rounded-lg">
                      <div className="p-2 bg-opensoc-500/10 rounded-full">
                        {activity.success ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{activity.taskName}</h4>
                        <p className="text-slate-300 text-sm">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                          <span>{safeFormatDistance(activity.createdAt)}</span>
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{activity.socialMetrics.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{activity.socialMetrics.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="card">
              <div className="p-6 border-b border-soc-dark-700">
                <h3 className="text-lg font-medium text-white">Agent Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Type</div>
                  <div className="text-white capitalize">{agent.type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">First Activity</div>
                  <div className="text-white">
                    {agent.socialMetrics.firstActivityAt 
                      ? safeFormatDistance(agent.socialMetrics.firstActivityAt)
                      : 'No activities yet'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Last Activity</div>
                  <div className="text-white">
                    {agent.socialMetrics.lastInteractionAt 
                      ? safeFormatDistance(agent.socialMetrics.lastInteractionAt)
                      : 'No recent activity'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Created</div>
                  <div className="text-white">{safeFormatDistance(agent.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-soc-dark-700">
              <h3 className="text-lg font-medium text-white">Activity Feed</h3>
              <p className="text-slate-400 text-sm mt-1">
                Social media-style feed of {agent.name}'s activities with likes and comments
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {activities.map((activity) => (
                  <ActivityCard 
                    key={activity.id} 
                    activity={activity} 
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))}
                
                {hasMoreActivities && (
                  <div className="text-center pt-4">
                    <button 
                      onClick={loadMoreActivities}
                      className="btn-secondary"
                    >
                      Load More Activities
                    </button>
                  </div>
                )}
                
                {activities.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No Activities Yet</h3>
                    <p className="text-slate-500">This agent hasn't performed any logged activities.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-soc-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Performance Analytics</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Detailed performance metrics and trends for {agent.name}
                  </p>
                </div>
                {dashboard && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Time period:</span>
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value as 'week' | 'month' | 'all')}
                      className="bg-soc-dark-700 text-white border border-soc-dark-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-opensoc-500"
                    >
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {dashboard ? (
                <div className="space-y-6">
                  {(() => {
                    const currentStats = getCurrentStats();
                    if (!currentStats) return null;
                    
                    const timeframeLabel = selectedTimeframe === 'week' ? 'This week' : 
                                         selectedTimeframe === 'month' ? 'This month' : 'All time';
                    
                    return (
                      <>
                        {/* Key Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-soc-dark-800/30 rounded-lg p-4 border border-soc-dark-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-slate-400 text-sm">Total Activities</p>
                                <p className="text-2xl font-bold text-white">{currentStats.totalActivities}</p>
                              </div>
                              <div className="p-2 bg-blue-500/10 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-400" />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{timeframeLabel}</p>
                          </div>

                          <div className="bg-soc-dark-800/30 rounded-lg p-4 border border-soc-dark-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-slate-400 text-sm">Success Rate</p>
                                <p className="text-2xl font-bold text-green-400">{currentStats.successRate.toFixed(1)}%</p>
                              </div>
                              <div className="p-2 bg-green-500/10 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{timeframeLabel}</p>
                          </div>

                          <div className="bg-soc-dark-800/30 rounded-lg p-4 border border-soc-dark-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-slate-400 text-sm">Avg Response Time</p>
                                <p className="text-2xl font-bold text-purple-400">
                                  {currentStats.avgExecutionTimeMs 
                                    ? `${(currentStats.avgExecutionTimeMs / 1000).toFixed(1)}s`
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Clock className="h-6 w-6 text-purple-400" />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{timeframeLabel}</p>
                          </div>

                          <div className="bg-soc-dark-800/30 rounded-lg p-4 border border-soc-dark-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-slate-400 text-sm">Tokens Used</p>
                                <p className="text-2xl font-bold text-orange-400">
                                  {currentStats.totalTokensConsumed?.toLocaleString() || '0'}
                                </p>
                              </div>
                              <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Brain className="h-6 w-6 text-orange-400" />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{timeframeLabel}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {(() => {
                    const currentStats = getCurrentStats();
                    if (!currentStats) return null;
                    
                    return (
                      <>
                        {/* Task Breakdown */}
                        <div className="bg-soc-dark-800/30 rounded-lg p-6 border border-soc-dark-700">
                          <h4 className="text-lg font-medium text-white mb-4">Task Breakdown</h4>
                          <div className="space-y-3">
                            {currentStats.taskBreakdown.map((task, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-white">{task.taskName}</span>
                                    <span className="text-sm text-slate-400">{task.count} tasks ({task.successRate}% success)</span>
                                  </div>
                                  <div className="w-full bg-soc-dark-600 rounded-full h-2">
                                    <div 
                                      className="bg-opensoc-500 h-2 rounded-full" 
                                      style={{ width: `${currentStats.totalActivities > 0 ? (task.count / currentStats.totalActivities) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Daily Activity Chart - only show for week/month timeframes */}
                        {selectedTimeframe !== 'all' && currentStats.dailyActivities && (
                          <div className="bg-soc-dark-800/30 rounded-lg p-6 border border-soc-dark-700">
                            <h4 className="text-lg font-medium text-white mb-4">Daily Activity Trend</h4>
                            <div className="space-y-2">
                              {currentStats.dailyActivities.map((day, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <div className="flex items-center space-x-4">
                                    <span className="text-white">{day.activities} activities</span>
                                    <span className="text-green-400">{day.successful} successful</span>
                                    {day.avgTime && <span className="text-slate-400">{(day.avgTime / 1000).toFixed(1)}s avg</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Performance Comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-soc-dark-800/30 rounded-lg p-6 border border-soc-dark-700">
                      <h4 className="text-lg font-medium text-white mb-4">Week vs Month</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Activities</span>
                          <div className="text-right">
                            <span className="text-white">{dashboard.weekStats.totalActivities}</span>
                            <span className="text-slate-400"> / </span>
                            <span className="text-slate-300">{dashboard.monthStats.totalActivities}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Success Rate</span>
                          <div className="text-right">
                            <span className="text-green-400">{dashboard.weekStats.successRate.toFixed(1)}%</span>
                            <span className="text-slate-400"> / </span>
                            <span className="text-green-300">{dashboard.monthStats.successRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-soc-dark-800/30 rounded-lg p-6 border border-soc-dark-700">
                      <h4 className="text-lg font-medium text-white mb-4">All-Time Stats</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Activities</span>
                          <span className="text-white">{dashboard.allTimeStats.totalActivities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Overall Success Rate</span>
                          <span className="text-green-400">{dashboard.allTimeStats.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Tokens</span>
                          <span className="text-orange-400">{dashboard.allTimeStats.totalTokensConsumed?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">Analytics Loading</h3>
                  <p className="text-slate-500">Performance analytics are being generated...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Card Component (will be moved to separate file)
const ActivityCard: React.FC<{
  activity: AgentActivity;
  onLike: (activityId: number) => void;
  onComment: (activityId: number, text: string) => void;
}> = ({ activity, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await onComment(activity.id, commentText.trim());
      setCommentText('');
      setShowComments(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const safeFormatDistance = (dateValue: string): string => {
    try {
      if (!dateValue) return 'Unknown';
      const parsedDate = parseISO(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="bg-soc-dark-800/30 rounded-lg p-6 border border-soc-dark-700">
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
          {(activity.executionTimeMs || activity.totalTokens) && (
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
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
          )}
        </div>
      </div>

      {/* Social Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-soc-dark-600">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike(activity.id)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
              activity.socialMetrics.likedByCurrentUser
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'hover:bg-soc-dark-700 text-slate-400 hover:text-red-400'
            }`}
          >
            <Heart className={`h-4 w-4 ${activity.socialMetrics.likedByCurrentUser ? 'fill-current' : ''}`} />
            <span>{activity.socialMetrics.likes}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm hover:bg-soc-dark-700 text-slate-400 hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{activity.socialMetrics.comments}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-soc-dark-600">
          {/* Existing Comments */}
          <div className="space-y-3 mb-4">
            {activity.interactions.comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-opensoc-500/20 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-opensoc-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span className="text-xs text-slate-500">{safeFormatDistance(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{comment.commentText}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-opensoc-500/20 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-opensoc-400" />
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-soc-dark-700 border border-soc-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-opensoc-500 resize-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="btn-primary text-sm px-4 py-1 disabled:opacity-50"
                >
                  {isSubmittingComment ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProfilePage;