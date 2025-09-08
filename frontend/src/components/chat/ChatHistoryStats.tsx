import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  BarChart3,
  Clock,
  Database,
  Zap,
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import ChatService from '../../services/chatService';

interface ChatStatsData {
  conversations: {
    total: number;
    active: number;
    archived: number;
    averageMessages: number;
  };
  messages: {
    total: number;
  };
  sessions: {
    active: number;
    memoryLimit: number;
    maxAge: string;
  };
  rag: {
    totalRecords: number;
    embeddedRecords: number;
    overallCoverage: number;
    modelInfo: {
      name: string;
      dimensions: number;
      initialized: boolean;
    };
  };
  timestamp: string;
}

const ChatHistoryStats: React.FC = () => {
  const [stats, setStats] = useState<ChatStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await ChatService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Failed to load chat stats:', error);
      setError('Failed to load chat statistics');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats(false);
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-soc-dark-900 rounded-lg border border-soc-dark-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-soc-dark-700 rounded w-24 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-3 bg-soc-dark-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-soc-dark-900 rounded-lg border border-soc-dark-700 p-6">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error || 'Failed to load stats'}</p>
          <button
            onClick={() => loadStats()}
            className="mt-2 text-xs text-opensoc-500 hover:text-opensoc-400"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-soc-dark-900 rounded-lg border border-soc-dark-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-opensoc-500" />
          <h3 className="text-lg font-semibold text-white">Chat Statistics</h3>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh stats"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Conversations */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Conversations
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-soc-dark-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-opensoc-400">
                {stats.conversations.total}
              </div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div className="bg-soc-dark-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">
                {stats.conversations.active}
              </div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
          </div>
          
          {stats.conversations.archived > 0 && (
            <div className="mt-2 bg-soc-dark-800 rounded-lg p-3">
              <div className="text-lg font-semibold text-yellow-400">
                {stats.conversations.archived}
              </div>
              <div className="text-xs text-slate-400">Archived</div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Activity
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Messages</span>
              <span className="text-sm font-medium text-white">
                {stats.messages.total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Avg per Chat</span>
              <span className="text-sm font-medium text-white">
                {stats.conversations.averageMessages}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Sessions
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Active</span>
              <span className="text-sm font-medium text-white">
                {stats.sessions.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Memory Limit</span>
              <span className="text-sm font-medium text-white">
                {stats.sessions.memoryLimit} messages
              </span>
            </div>
          </div>
        </div>

        {/* RAG System */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
            <Database className="h-4 w-4 mr-2" />
            RAG System
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Records</span>
              <span className="text-sm font-medium text-white">
                {stats.rag.totalRecords.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Embedded</span>
              <span className="text-sm font-medium text-white">
                {stats.rag.embeddedRecords.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Coverage</span>
              <span className="text-sm font-medium text-opensoc-400">
                {stats.rag.overallCoverage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Model Info */}
          {stats.rag.modelInfo.initialized && (
            <div className="mt-3 pt-3 border-t border-soc-dark-700">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Zap className="h-3 w-3 text-green-400" />
                <span>
                  {stats.rag.modelInfo.name} ({stats.rag.modelInfo.dimensions}d)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="pt-4 border-t border-soc-dark-700">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Updated</span>
            </div>
            <span>{formatDate(stats.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryStats;