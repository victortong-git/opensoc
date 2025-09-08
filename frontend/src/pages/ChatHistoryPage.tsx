import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Filter, 
  Archive, 
  Trash2, 
  Download,
  RefreshCw,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { RootState } from '../store';
import { 
  setChatHistory, 
  setLoadingHistory, 
  setError,
  removeFromChatHistory 
} from '../store/chatSlice';
import ChatService from '../services/chatService';
import ConversationList from '../components/chat/ConversationList';
import ConversationSearchBar from '../components/chat/ConversationSearchBar';
import ChatHistoryStats from '../components/chat/ChatHistoryStats';
import ChatHistoryModal from '../components/chat/ChatHistoryModal';

interface ChatHistoryPageProps {}

const ChatHistoryPage: React.FC<ChatHistoryPageProps> = () => {
  const dispatch = useDispatch();
  const { 
    chatHistory, 
    isLoadingHistory, 
    error 
  } = useSelector((state: RootState) => state.chat);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchived, setFilterArchived] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalConversations, setTotalConversations] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations on component mount and when filters change
  useEffect(() => {
    loadConversations();
  }, [currentPage, filterArchived, searchQuery]);

  const loadConversations = async (showLoader = true) => {
    if (showLoader) {
      dispatch(setLoadingHistory(true));
    }
    dispatch(setError(null));

    try {
      const response = await ChatService.getConversations({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        includeArchived: filterArchived,
        search: searchQuery || undefined
      });

      if (response.success && response.data) {
        dispatch(setChatHistory(response.data.conversations));
        setTotalConversations(response.data.pagination.total);
      } else {
        dispatch(setError(response.error || 'Failed to load chat history'));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      dispatch(setError('Failed to load chat history'));
    } finally {
      if (showLoader) {
        dispatch(setLoadingHistory(false));
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations(false);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (archived: boolean) => {
    setFilterArchived(archived);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleConversationDelete = async (conversationId: string, permanent = false) => {
    try {
      const response = await ChatService.deleteConversation(conversationId, permanent);
      if (response.success) {
        dispatch(removeFromChatHistory(conversationId));
        // Reload to get updated counts
        await loadConversations(false);
      } else {
        dispatch(setError(response.error || 'Failed to delete conversation'));
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      dispatch(setError('Failed to delete conversation'));
    }
  };

  const handleExportHistory = () => {
    try {
      const historyData = ChatService.exportChatHistory();
      const blob = new Blob([historyData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chat history:', error);
      dispatch(setError('Failed to export chat history'));
    }
  };

  const handleNewChat = () => {
    // This could open the chat panel or navigate to a chat interface
    window.location.href = '/dashboard'; // Or use navigate if using react-router
  };

  const totalPages = Math.ceil(totalConversations / pageSize);

  return (
    <div className="min-h-screen bg-soc-dark-950">
      {/* Header */}
      <div className="bg-soc-dark-900 border-b border-soc-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-opensoc-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Chat History</h1>
                <p className="text-slate-400">
                  Manage your AI SOC Consultant conversations
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Stats Toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showStats 
                    ? 'bg-opensoc-600 text-white' 
                    : 'bg-soc-dark-800 text-slate-300 hover:bg-soc-dark-700'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Stats
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-soc-dark-800 text-slate-300 rounded-lg hover:bg-soc-dark-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Export */}
              <button
                onClick={handleExportHistory}
                className="px-4 py-2 bg-soc-dark-800 text-slate-300 rounded-lg hover:bg-soc-dark-700 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Export
              </button>

              {/* New Chat */}
              <button
                onClick={handleNewChat}
                className="px-4 py-2 bg-opensoc-600 text-white rounded-lg hover:bg-opensoc-700 transition-colors"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                New Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Stats */}
          <div className="lg:col-span-1">
            {showStats && <ChatHistoryStats />}
            
            {/* Quick filters */}
            <div className="bg-soc-dark-900 rounded-lg border border-soc-dark-700 p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterArchived}
                    onChange={(e) => handleFilterChange(e.target.checked)}
                    className="rounded border-soc-dark-600 bg-soc-dark-700 text-opensoc-500 focus:ring-opensoc-500"
                  />
                  <Archive className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Include Archived</span>
                </label>
              </div>

              <div className="mt-6 pt-6 border-t border-soc-dark-700">
                <div className="text-sm text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Total:</span>
                    <span className="text-white font-medium">{totalConversations}</span>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-1">
                      <span>Page:</span>
                      <span className="text-white font-medium">
                        {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <ConversationSearchBar
                onSearch={handleSearch}
                placeholder="Search conversations by title or content..."
                initialValue={searchQuery}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoadingHistory ? (
              <div className="bg-soc-dark-900 rounded-lg border border-soc-dark-700 p-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-opensoc-500 mx-auto mb-4" />
                  <p className="text-slate-400">Loading chat history...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation List */}
                <ConversationList
                  conversations={chatHistory}
                  onConversationSelect={handleConversationSelect}
                  onConversationDelete={handleConversationDelete}
                  searchQuery={searchQuery}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-soc-dark-800 text-slate-300 rounded-lg hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <span className="text-slate-400 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-soc-dark-800 text-slate-300 rounded-lg hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Details Modal */}
      {selectedConversationId && (
        <ChatHistoryModal
          conversationId={selectedConversationId}
          onClose={() => setSelectedConversationId(null)}
        />
      )}
    </div>
  );
};

export default ChatHistoryPage;