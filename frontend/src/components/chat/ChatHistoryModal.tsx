import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageCircle, 
  Calendar, 
  User, 
  Bot, 
  Copy,
  Download,
  Play,
  Settings,
  Database,
  Loader,
  AlertTriangle
} from 'lucide-react';
import ChatService from '../../services/chatService';
import MessageContent from './MessageContent';
import { Message, Conversation } from '../../store/chatSlice';

interface ChatHistoryModalProps {
  conversationId: string;
  onClose: () => void;
}

interface ConversationDetails {
  conversation: Conversation & { messages?: Message[] };
  messages: Message[];
  sessionMemory?: {
    messageCount: number;
    lastActivity: string | null;
  };
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  conversationId,
  onClose
}) => {
  const [details, setDetails] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationDetails();
  }, [conversationId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages load
    if (details?.messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [details?.messages]);

  const loadConversationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ChatService.getConversation(conversationId);
      if (response.success && response.data) {
        setDetails({
          conversation: response.data.conversation,
          messages: response.data.conversation.messages || [],
          sessionMemory: response.data.sessionMemory
        });
      } else {
        setError(response.error || 'Failed to load conversation');
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error);
      setError('Failed to load conversation details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportConversation = () => {
    if (!details) return;

    const exportData = {
      conversation: {
        id: details.conversation.id,
        title: details.conversation.title,
        createdAt: details.conversation.createdAt,
        lastActivity: details.conversation.lastActivity,
        messageCount: details.conversation.messageCount,
        settings: details.conversation.settings
      },
      messages: details.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        ragEnabled: msg.ragEnabled,
        ragContext: msg.ragContext
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${details.conversation.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContinueChat = () => {
    // TODO: Implement continue chat functionality
    // This would typically navigate to the main chat interface with this conversation loaded
    console.log('Continue chat with conversation:', conversationId);
    onClose();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-10 h-10 bg-opensoc-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white truncate">
                {details?.conversation.title || 'Loading...'}
              </h2>
              {details && (
                <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatTimestamp(details.conversation.lastActivity)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{details.conversation.messageCount} messages</span>
                  </div>
                  {details.conversation.settings?.ragEnabled && (
                    <div className="flex items-center space-x-1">
                      <Database className="h-4 w-4 text-green-400" />
                      <span>RAG enabled</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg transition-colors"
              title="Conversation Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            <button
              onClick={handleExportConversation}
              disabled={!details}
              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg transition-colors disabled:opacity-50"
              title="Export Conversation"
            >
              <Download className="h-5 w-5" />
            </button>

            <button
              onClick={handleContinueChat}
              disabled={!details}
              className="px-4 py-2 bg-opensoc-600 text-white rounded-lg hover:bg-opensoc-700 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4 inline mr-2" />
              Continue
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && details && (
          <div className="p-4 border-b border-soc-dark-700 bg-soc-dark-800/50">
            <h3 className="text-sm font-medium text-white mb-3">Conversation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">RAG Enabled:</span>
                <span className="text-white ml-2">
                  {details.conversation.settings?.ragEnabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Data Sources:</span>
                <span className="text-white ml-2">
                  {details.conversation.settings?.dataSources?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Model:</span>
                <span className="text-white ml-2">
                  {details.conversation.settings?.model || 'default'}
                </span>
              </div>
            </div>
            
            {details.sessionMemory && (
              <div className="mt-4 pt-4 border-t border-soc-dark-700">
                <span className="text-slate-400 text-sm">Session Memory:</span>
                <span className="text-white ml-2 text-sm">
                  {details.sessionMemory.messageCount} active messages
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-opensoc-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading conversation...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadConversationDetails}
                  className="px-4 py-2 bg-opensoc-600 text-white rounded-lg hover:bg-opensoc-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6 max-w-4xl mx-auto">
                {details?.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* Message bubble */}
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-opensoc-600 text-white'
                            : 'bg-soc-dark-800 text-slate-200'
                        }`}
                      >
                        <MessageContent 
                          content={message.content}
                          role={message.role}
                          enableMarkdown={true}
                        />

                        {/* RAG Context */}
                        {message.ragContext && message.ragContext.resultsFound > 0 && (
                          <div className="mt-4 pt-4 border-t border-soc-dark-600">
                            <div className="text-xs text-slate-400 mb-2">
                              📚 Found {message.ragContext.resultsFound} relevant items:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {message.ragContext.sources.slice(0, 5).map((source, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-soc-dark-700 text-slate-300"
                                >
                                  {source.type} ({source.similarity.toFixed(2)})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message info */}
                      <div className={`flex items-center mt-2 space-x-2 text-xs text-slate-500 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span>{formatTimestamp(message.timestamp)}</span>
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="hover:text-slate-300 transition-colors"
                          title="Copy message"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryModal;