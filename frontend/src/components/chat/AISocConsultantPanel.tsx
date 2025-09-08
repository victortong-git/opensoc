import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MessageCircle, 
  MessageSquare,
  X, 
  Send, 
  Settings, 
  Trash2,
  Bot,
  User,
  Loader,
  AlertTriangle,
  Copy,
  Database,
  FileText,
  Clock,
  History,
  Plus,
  ExternalLink,
  Maximize,
  Minimize,
  Zap
} from 'lucide-react';
import MessageContent from './MessageContent';
import RAGSearchProgress from './RAGSearchProgress';
import ToolSelectionEmbedded from './ToolSelectionEmbedded';
import ToolExecutionIndicator from './ToolExecutionIndicator';
import ProcessSteps from './ProcessSteps';
import ChatService from '../../services/chatService';
import { RootState } from '../../store';
import { 
  loadConversation, 
  setChatHistory,
  setRagEnabled,
  setSimilarityThreshold,
  toggleDataSource,
  Message as StoreMessage,
  Conversation as StoreConversation
} from '../../store/chatSlice';
import { io, Socket } from 'socket.io-client';


interface LocalConversation {
  id: string;
  title?: string;
  messageCount: number;
  settings: {
    ragEnabled: boolean;
    dataSources: string[];
    model: string;
  };
  lastActivity: Date;
}

interface AISocConsultantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

const AISocConsultantPanel: React.FC<AISocConsultantPanelProps> = ({
  isOpen,
  onClose,
  width,
  onWidthChange
}) => {
  const dispatch = useDispatch();
  const { 
    messages, 
    currentConversation,
    ragEnabled,
    selectedDataSources,
    similarityThreshold,
    markdownEnabled 
  } = useSelector((state: RootState) => state.chat);

  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'compact' | 'full'>('compact');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [recentConversations, setRecentConversations] = useState<LocalConversation[]>([]);
  const [windowState, setWindowState] = useState<'normal' | 'maximized'>('normal');
  const [showToolSelection, setShowToolSelection] = useState(false);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  
  // Tool Execution State
  const [toolExecutions, setToolExecutions] = useState<any[]>([]);
  const [showToolExecution, setShowToolExecution] = useState(false);
  const [toolExecutionDetails, setToolExecutionDetails] = useState({
    showParameters: false,
    showResults: true
  });
  
  // Process Steps State
  const [processSteps, setProcessSteps] = useState<Array<{
    step: string;
    status: 'starting' | 'complete' | 'error';
    message: string;
    details?: any;
    duration?: number;
    timestamp: string;
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // RAG Search Progress State
  const [ragProgress, setRagProgress] = useState<{
    isVisible: boolean;
    isExpanded: boolean;
    stage: 'embedding' | 'searching' | 'completed' | 'error';
    message: string;
    progress: number;
    totalSources: number;
    searchBreakdown: Array<{
      dataSource: string;
      resultsFound: number;
      searchTime: number;
      topSimilarity?: number;
    }>;
    totalResults: number;
    totalSearchTime: number;
    currentDataSource?: string;
    error?: string;
  }>({
    isVisible: false,
    isExpanded: true,
    stage: 'embedding',
    message: '',
    progress: 0,
    totalSources: 0,
    searchBreakdown: [],
    totalResults: 0,
    totalSearchTime: 0
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);


  // WebSocket connection for real-time RAG progress
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const backendUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
        const socketUrl = backendUrl.replace(/\/api$/, '').replace(/\/$/, '');
        
        socketRef.current = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        // Listen for RAG search progress events
        socketRef.current.on('rag_search_progress', (data) => {
          console.log('🔍 RAG Search Progress:', data);
          const { progress } = data;
          
          setRagProgress(prev => {
            // Use the latest searchBreakdown from the progress event
            const updatedSearchBreakdown = progress.searchBreakdown || prev.searchBreakdown;
            
            return {
              ...prev,
              isVisible: true,
              stage: progress.stage,
              message: progress.message,
              progress: progress.progress || prev.progress,
              totalSources: progress.totalSources || prev.totalSources,
              searchBreakdown: updatedSearchBreakdown,
              totalResults: progress.totalResults || prev.totalResults,
              totalSearchTime: progress.totalSearchTime || prev.totalSearchTime,
              currentDataSource: progress.dataSource,
              error: progress.error,
              // Auto-collapse when search completes successfully
              isExpanded: progress.stage === 'completed' ? false : prev.isExpanded
            };
          });
        });

        // Listen for RAG search errors
        socketRef.current.on('rag_search_error', (data) => {
          console.error('❌ RAG Search Error:', data);
          setRagProgress(prev => ({
            ...prev,
            isVisible: true,
            stage: 'error',
            message: `Search failed: ${data.error}`,
            error: data.error
          }));

          // Hide error after delay
          setTimeout(() => {
            setRagProgress(prev => ({
              ...prev,
              isVisible: false,
              isExpanded: true
            }));
          }, 5000);
        });

        // Listen for detailed RAG search breakdown
        socketRef.current.on('rag_search_detailed', (data) => {
          console.log('🔍 RAG Search Detailed:', data);
          setRagProgress(prev => ({
            ...prev,
            searchBreakdown: data.searchBreakdown || [],
            totalResults: data.resultsFound || prev.totalResults,
            totalSearchTime: data.totalTime || prev.totalSearchTime
          }));
        });

        // Listen for tool selection events
        socketRef.current.on('tool_selection_active', (data) => {
          console.log('🛠️ Tool Selection Active:', data);
          setShowToolExecution(true);
        });

        // Listen for tool execution start events
        socketRef.current.on('tool_execution_start', (data) => {
          console.log('🔧 Tool Execution Start:', data);
          setToolExecutions(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(t => t.toolName === data.toolName && t.toolIndex === data.toolIndex);
            
            if (existingIndex !== -1) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                status: 'running',
                startTime: new Date().toISOString(),
                parameters: data.parameters
              };
            } else {
              updated.push({
                toolName: data.toolName,
                displayName: data.toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: 'security',
                status: 'running',
                startTime: new Date().toISOString(),
                parameters: data.parameters,
                toolIndex: data.toolIndex,
                totalTools: data.totalTools
              });
            }
            return updated;
          });
          setShowToolExecution(true);
        });

        // Listen for tool execution complete events
        socketRef.current.on('tool_execution_complete', (data) => {
          console.log('✅ Tool Execution Complete:', data);
          setToolExecutions(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(t => t.toolName === data.toolName && t.toolIndex === data.toolIndex);
            
            if (existingIndex !== -1) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                status: 'completed',
                endTime: new Date().toISOString(),
                result: data.result,
                duration: Date.now() - new Date(updated[existingIndex].startTime).getTime()
              };
            }
            return updated;
          });
        });

        // Listen for tool execution error events
        socketRef.current.on('tool_execution_error', (data) => {
          console.error('❌ Tool Execution Error:', data);
          setToolExecutions(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(t => t.toolName === data.toolName && t.toolIndex === data.toolIndex);
            
            if (existingIndex !== -1) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                status: 'error',
                endTime: new Date().toISOString(),
                error: data.error,
                duration: Date.now() - new Date(updated[existingIndex].startTime).getTime()
              };
            }
            return updated;
          });
        });

        // Listen for process step events (detailed transparency)
        socketRef.current.on('process_step', (data) => {
          console.log('🔄 Process Step:', data);
          setProcessSteps(prev => {
            const existingIndex = prev.findIndex(s => s.step === data.step);
            const newStep = {
              step: data.step,
              status: data.status,
              message: data.message,
              details: data.details,
              duration: data.duration,
              timestamp: data.timestamp
            };
            
            if (existingIndex !== -1) {
              // Update existing step
              const updated = [...prev];
              updated[existingIndex] = newStep;
              return updated;
            } else {
              // Add new step
              return [...prev, newStep];
            }
          });
          
          // Update processing status
          setIsProcessing(data.status === 'starting');
        });

        console.log('✅ WebSocket connected for RAG progress, tool execution, and process steps');
      }

      loadRecentConversations();
    }

    // Cleanup WebSocket connection
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log('🔌 WebSocket disconnected');
      }
    };
  }, [isOpen]);

  // Load enabled tools when conversation changes
  useEffect(() => {
    if (currentConversation?.settings?.enabledTools) {
      setEnabledTools(currentConversation.settings.enabledTools);
    } else if (currentConversation === null) {
      // For new conversations, load default tools
      const loadDefaultTools = async () => {
        try {
          const response = await ChatService.getAvailableTools();
          if (response.success && response.data) {
            setAvailableTools(response.data);
            const allTools = response.data.flatMap((category: any) => 
              category.tools.map((tool: any) => tool.name)
            );
            setEnabledTools(allTools);
          }
        } catch (error) {
          console.error('Failed to load default tools:', error);
        }
      };
      loadDefaultTools();
    }
  }, [currentConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ESC key handler for maximized mode
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && windowState === 'maximized') {
        setWindowState('normal');
      }
    };

    // Only add listener when maximized and panel is open
    if (isOpen && windowState === 'maximized') {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, windowState]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, 52), 128)}px`;
    }
  }, [currentMessage]);

  // Handle resize
  useEffect(() => {
    if (!resizeRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      
      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth - (e.clientX - startX);
        const clampedWidth = Math.min(Math.max(newWidth, 420), 800);
        onWidthChange(clampedWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizeElement = resizeRef.current;
    resizeElement.addEventListener('mousedown', handleMouseDown);

    return () => {
      resizeElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, [width, onWidthChange]);

  // Handle click outside history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };

    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryDropdown]);

  const loadRecentConversations = async () => {
    try {
      const response = await ChatService.getConversations({ limit: 10 });
      if (response.success && response.data) {
        const conversations = response.data.conversations.map((conv: StoreConversation) => ({
          ...conv,
          lastActivity: new Date(conv.lastActivity)
        }));
        setRecentConversations(conversations);
        dispatch(setChatHistory(response.data.conversations));
      } else {
        // Handle API error response
        console.error('Failed to load conversations:', response.error);
        setError(`Unable to load conversation history: ${response.error}`);
        setRecentConversations([]);
      }
    } catch (error) {
      console.error('Failed to load recent conversations:', error);
      setError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setRecentConversations([]);
    }
  };

  const loadConversationHistory = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await ChatService.getConversation(conversationId);
      if (response.success && response.data) {
        const conversation = response.data.conversation;
        const messages = response.data.conversation.messages || [];
        
        dispatch(loadConversation({
          conversation: conversation || null,
          messages: messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp
          }))
        }));
        
        // Load enabled tools from conversation settings
        if (conversation?.settings?.enabledTools) {
          setEnabledTools(conversation.settings.enabledTools);
        }
        
        setShowHistoryDropdown(false);
      } else {
        setError(response.error || 'Failed to load conversation');
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    dispatch(loadConversation({
      conversation: null,
      messages: []
    }));
    // Reset to default enabled tools for new conversation
    setEnabledTools([]);
    setShowHistoryDropdown(false);
  };

  const saveToolPreferences = async (tools: string[]) => {
    try {
      if (currentConversation?.id) {
        const response = await ChatService.updateConversationSettings(currentConversation.id, {
          enabledTools: tools
        });
        if (response.success) {
          setEnabledTools(tools);
        }
      } else {
        // For new conversations, just update local state
        setEnabledTools(tools);
      }
    } catch (error) {
      console.error('Failed to save tool preferences:', error);
      setError('Failed to save tool preferences');
    }
  };

  // Get tool category breakdown
  const getToolCategoryStats = () => {
    if (!availableTools.length) return '';
    
    const categoryStats = availableTools.map(category => {
      const enabledCount = category.tools.filter((tool: any) => 
        enabledTools.includes(tool.name)
      ).length;
      const totalCount = category.tools.length;
      return `${category.category} (${enabledCount}/${totalCount})`;
    });
    
    return categoryStats.join(', ');
  };

  const handleQuickStartPrompt = async (promptText: string) => {
    if (isLoading) return;
    
    setCurrentMessage(promptText);
    
    // Use setTimeout to ensure the state is updated before sending
    setTimeout(async () => {
      await sendMessageWithText(promptText);
    }, 0);
  };

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Clear previous tool executions and process steps when starting new message
    setToolExecutions([]);
    setShowToolExecution(false);
    setProcessSteps([]);
    setIsProcessing(true);

    const userMessage: StoreMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to Redux store
    dispatch(loadConversation({
      conversation: currentConversation || null,
      messages: [...messages, userMessage]
    }));
    
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    // Initialize RAG progress if RAG is enabled
    if (ragEnabled && selectedDataSources.length > 0) {
      setRagProgress(prev => ({
        ...prev,
        isVisible: true,
        isExpanded: true, // Start expanded for new search
        stage: 'embedding',
        message: 'Initializing search...',
        progress: 0,
        totalSources: selectedDataSources.length,
        searchBreakdown: [],
        totalResults: 0,
        totalSearchTime: 0,
        currentDataSource: undefined,
        error: undefined
      }));
    }

    try {
      const response = await ChatService.sendMessage({
        message: messageText.trim(),
        conversationId: currentConversation?.id,
        ragEnabled,
        dataSources: selectedDataSources,
        similarityThreshold,
        maxResults: 3,
        enabledTools
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send message');
      }

      if (response.data) {
        console.log('✅ Chat response received:', response.data);
        
        // Validate response data structure
        if (!response.data.message) {
          console.error('❌ Missing message in response data:', response.data);
          throw new Error('Invalid response: missing message data');
        }
        
        if (!response.data.message.content) {
          console.error('❌ Missing content in message:', response.data.message);
          throw new Error('Invalid response: missing message content');
        }
        
        const assistantMessage: StoreMessage = {
          ...response.data.message,
          timestamp: response.data.message.timestamp
        };
        
        console.log('📝 Creating assistant message:', assistantMessage);
        console.log('📝 Current messages before update:', messages.length);

        // Update Redux store with assistant message
        dispatch(loadConversation({
          conversation: response.data.conversation || null,
          messages: [...messages, userMessage, assistantMessage]
        }));
        
        console.log('✅ Messages updated in Redux store');

        // Reload recent conversations to update the history
        await loadRecentConversations();
        
        // Hide RAG progress box after successful response completion
        setRagProgress(prev => ({
          ...prev,
          isVisible: false
        }));
        
        console.log('✅ Chat message processing completed successfully');
      } else {
        console.error('❌ No data in response:', response);
        throw new Error('Invalid response: no data received');
      }
    } catch (err) {
      console.error('❌ Chat message failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('❌ Error message:', errorMessage);
      
      setError(errorMessage);
      // Hide RAG progress on error
      setRagProgress(prev => ({
        ...prev,
        isVisible: false,
        isExpanded: true
      }));
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      console.log('🏁 Chat message processing finished, loading:', false, 'processing:', false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    dispatch(loadConversation({
      conversation: null,
      messages: []
    }));
    setError(null);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const openChatHistory = () => {
    window.open('/chat-history', '_blank');
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  // Dynamic styling based on window state
  const containerClasses = windowState === 'maximized'
    ? "fixed inset-0 w-full h-full bg-soc-dark-900 flex flex-col shadow-xl z-50 transition-all duration-300"
    : "fixed right-0 top-0 h-full bg-soc-dark-900 border-l border-soc-dark-700 flex flex-col shadow-xl z-50 transition-all duration-300";

  const containerStyle = windowState === 'maximized' 
    ? {} 
    : { width: `${width}px` };

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
    >
      {/* Resize handle - only show in normal mode */}
      {windowState === 'normal' && (
        <div
          ref={resizeRef}
          className="absolute left-0 top-0 w-1 h-full bg-soc-dark-600 hover:bg-opensoc-500 cursor-col-resize transition-colors"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-soc-dark-700 min-h-16">
        <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
          <div className="w-8 h-8 bg-opensoc-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white truncate">AI SOC Consultant</h3>
              {currentConversation && (
                <span className="text-xs bg-opensoc-600/20 text-opensoc-300 px-2 py-1 rounded">
                  {currentConversation.messageCount} msgs
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2 truncate">
              <span className="truncate">{ragEnabled ? 'RAG Enabled' : 'Basic Chat'} • {selectedDataSources.length} sources</span>
              {markdownEnabled && (
                <span className="flex items-center space-x-1">
                  • <FileText className="h-3 w-3" /> <span>MD</span>
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0 relative min-w-36 bg-soc-dark-800/70 rounded px-2 py-1">
          {/* History Dropdown */}
          <div className="relative" ref={historyDropdownRef}>
            <button
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className="p-2 rounded-lg hover:bg-soc-dark-800 transition-colors text-slate-400 hover:text-white border border-transparent hover:border-soc-dark-600"
              title="Chat History"
            >
              <History className="h-4 w-4" />
            </button>

            {showHistoryDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-soc-dark-800 border border-soc-dark-600 rounded-lg shadow-lg z-20">
                <div className="py-2">
                  <div className="px-3 py-2 border-b border-soc-dark-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Recent Conversations</span>
                      <button
                        onClick={openChatHistory}
                        className="text-xs text-opensoc-500 hover:text-opensoc-400 flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View All
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={startNewConversation}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white hover:bg-soc-dark-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-green-400" />
                    <span>New Conversation</span>
                  </button>

                  <div className="border-t border-soc-dark-600 mt-2 pt-2">
                    {false ? (
                      <div className="px-3 py-2 text-center">
                        <Loader className="h-4 w-4 animate-spin text-opensoc-500 mx-auto" />
                        <p className="text-xs text-slate-400 mt-1">Loading...</p>
                      </div>
                    ) : recentConversations.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        {recentConversations.slice(0, 8).map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => loadConversationHistory(conv.id)}
                            className="w-full text-left px-3 py-2 hover:bg-soc-dark-700 transition-colors group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate group-hover:text-opensoc-100">
                                  {conv.title || 'Untitled Conversation'}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {conv.lastActivity.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span>{conv.messageCount} msgs</span>
                                </div>
                              </div>
                              {conv.id === currentConversation?.id && (
                                <div className="w-2 h-2 bg-opensoc-500 rounded-full ml-2 mt-1"></div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-center text-xs text-slate-400">
                        No conversations yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg hover:bg-soc-dark-800 transition-colors border border-transparent hover:border-soc-dark-600 ${
                showSettings ? 'text-opensoc-400 bg-opensoc-600/20 border-opensoc-600' : 'text-slate-400 hover:text-white'
              }`}
              title="Chat Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            {showSettings && (
              <button
                onClick={() => setSettingsMode(settingsMode === 'compact' ? 'full' : 'compact')}
                className="p-2 rounded-lg hover:bg-soc-dark-800 transition-colors text-slate-400 hover:text-white border border-transparent hover:border-soc-dark-600"
                title={settingsMode === 'compact' ? 'Full Panel' : 'Compact View'}
              >
                {settingsMode === 'compact' ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
              </button>
            )}
          </div>
          
          <button
            onClick={clearConversation}
            className="p-2 rounded-lg hover:bg-soc-dark-800 transition-colors text-slate-400 hover:text-red-400 border border-transparent hover:border-soc-dark-600"
            title="Clear Conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Window Controls Separator */}
          <div className="w-px h-6 bg-soc-dark-600" />
          
          {/* Maximize/Restore Button */}
          <button
            onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}
            className="p-2 rounded-lg hover:bg-soc-dark-800 transition-colors text-slate-400 hover:text-white border border-transparent hover:border-soc-dark-600"
            title={windowState === 'maximized' ? 'Restore to Sidebar' : 'Maximize Chat'}
          >
            {windowState === 'maximized' ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-soc-dark-800 transition-colors text-slate-400 hover:text-white border border-transparent hover:border-soc-dark-600"
            title="Close Chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && settingsMode === 'compact' && (
        <div className="flex-shrink-0 p-4 border-b border-soc-dark-700 bg-soc-dark-800 max-h-96 overflow-y-auto border-l-4 border-l-opensoc-500">
          <div className="space-y-4">
            {/* Settings Header */}
            <div className="flex items-center justify-between pb-2 border-b border-soc-dark-600">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-opensoc-500" />
                <h4 className="text-sm font-medium text-white">Chat Settings</h4>
              </div>
              <button
                onClick={() => setSettingsMode('full')}
                className="p-1 rounded hover:bg-soc-dark-700 text-slate-400 hover:text-white transition-colors"
                title="Expand to Full Panel"
              >
                <Maximize className="h-3 w-3" />
              </button>
            </div>
            {/* Current Conversation Info */}
            {currentConversation && (
              <div className="mb-4 p-3 bg-soc-dark-700 rounded-lg">
                <div className="text-sm font-medium text-white mb-1">Current Conversation</div>
                <div className="text-xs text-slate-400">
                  {currentConversation.title || 'Untitled'} • {currentConversation.messageCount} messages
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Last activity: {currentConversation.lastActivity 
                    ? (typeof currentConversation.lastActivity === 'string' 
                        ? new Date(currentConversation.lastActivity).toLocaleDateString()
                        : new Date(currentConversation.lastActivity).toLocaleDateString())
                    : 'Unknown'}
                </div>
              </div>
            )}

            {/* RAG Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">RAG System</label>
                  <p className="text-xs text-slate-400">
                    {ragEnabled ? `Using ${selectedDataSources.length} data sources` : 'RAG disabled'}
                  </p>
                </div>
                <button
                  onClick={() => dispatch(setRagEnabled(!ragEnabled))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ragEnabled ? 'bg-opensoc-600' : 'bg-soc-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ragEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {ragEnabled && (
                <>
                  {/* Data Source Selection */}
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Data Sources</label>
                    <div className="space-y-2">
                      {[
                        { key: 'alerts', label: 'Security Alerts', icon: AlertTriangle },
                        { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
                        { key: 'assets', label: 'Assets', icon: Database },
                        { key: 'iocs', label: 'Threat Intel (IOCs)', icon: Database },
                        { key: 'playbooks', label: 'Playbooks', icon: FileText }
                      ].map(({ key, label, icon: Icon }) => (
                        <label key={key} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDataSources.includes(key)}
                            onChange={() => dispatch(toggleDataSource(key))}
                            className="rounded border-soc-dark-600 bg-soc-dark-700 text-opensoc-500 focus:ring-opensoc-500"
                          />
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Similarity Threshold */}
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Similarity Threshold: {similarityThreshold.toFixed(2)}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={similarityThreshold}
                        onChange={(e) => dispatch(setSimilarityThreshold(parseFloat(e.target.value)))}
                        className="w-full h-2 bg-soc-dark-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>0.00 (Broad)</span>
                        <span>0.55 (Default)</span>
                        <span>1.00 (Exact)</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Lower values return more results but may be less relevant. Higher values return fewer, more precise matches.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tool Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <label className="text-sm font-medium text-white">AI Tools</label>
                  <p className="text-xs text-slate-400 truncate">
                    {enabledTools.length} of {availableTools.reduce((sum, cat) => sum + cat.tools?.length || 0, 0)} enabled
                  </p>
                  {availableTools.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1 truncate" title={getToolCategoryStats()}>
                      {getToolCategoryStats().length > 40 
                        ? getToolCategoryStats().substring(0, 40) + '...'
                        : getToolCategoryStats()
                      }
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSettingsMode('full')}
                    className="px-2 py-1 text-xs bg-opensoc-600 text-white rounded hover:bg-opensoc-700 transition-colors"
                    title="Open Full Tool Panel"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Markdown Toggle Info */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">Markdown Rendering</label>
                <p className="text-xs text-slate-400">
                  {markdownEnabled ? 'Enhanced formatting enabled' : 'Plain text responses'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${markdownEnabled ? 'bg-green-400' : 'bg-slate-500'}`}></div>
            </div>

            {/* Link to full Chat History */}
            <div className="pt-3 border-t border-soc-dark-600">
              <button
                onClick={openChatHistory}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-opensoc-600/20 hover:bg-opensoc-600/30 text-opensoc-300 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">Manage Chat History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-300 mb-2">AI SOC Consultant</h4>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              Ask me anything about your security alerts, incidents, assets, threat intelligence, or playbooks. 
              I can help analyze threats, suggest responses, and provide insights from your SOC data.
            </p>
            
            {/* Quick Start Prompts */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="text-xs font-medium text-slate-400 mb-3">Quick Start:</div>
              <button
                onClick={() => handleQuickStartPrompt("Show me the latest critical security alerts")}
                className="w-full text-left p-3 rounded-lg bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors text-slate-300 text-sm border border-soc-dark-600 hover:border-opensoc-600"
              >
                🚨 Show me the latest critical security alerts
              </button>
              <button
                onClick={() => handleQuickStartPrompt("Analyze recent malware incidents and suggest response steps")}
                className="w-full text-left p-3 rounded-lg bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors text-slate-300 text-sm border border-soc-dark-600 hover:border-opensoc-600"
              >
                🦠 Analyze recent malware incidents and suggest response steps
              </button>
              <button
                onClick={() => handleQuickStartPrompt("What are the top threat indicators I should monitor today?")}
                className="w-full text-left p-3 rounded-lg bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors text-slate-300 text-sm border border-soc-dark-600 hover:border-opensoc-600"
              >
                🎯 What are the top threat indicators I should monitor today?
              </button>
              <button
                onClick={() => handleQuickStartPrompt("Generate a security incident summary report")}
                className="w-full text-left p-3 rounded-lg bg-soc-dark-800 hover:bg-soc-dark-700 transition-colors text-slate-300 text-sm border border-soc-dark-600 hover:border-opensoc-600"
              >
                📊 Generate a security incident summary report
              </button>
            </div>
          </div>
        )}

        {/* Tool Execution Indicator */}
        {showToolExecution && toolExecutions.length > 0 && (
          <div className="mb-4">
            <ToolExecutionIndicator
              executions={toolExecutions}
              isVisible={showToolExecution}
              onToggleVisibility={() => setShowToolExecution(!showToolExecution)}
              showParameters={toolExecutionDetails.showParameters}
              showResults={toolExecutionDetails.showResults}
              onParametersToggle={() => setToolExecutionDetails(prev => ({
                ...prev,
                showParameters: !prev.showParameters
              }))}
              onResultsToggle={() => setToolExecutionDetails(prev => ({
                ...prev,
                showResults: !prev.showResults
              }))}
            />
          </div>
        )}

        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isAssistantMessage = message.role === 'assistant';
          const shouldShowProcessSteps = isAssistantMessage && isLastMessage && processSteps.length > 0;
          
          return (
            <div key={message.id}>
              {/* Show ProcessSteps before the last AI message */}
              {shouldShowProcessSteps && (
                <div className="mb-4">
                  <ProcessSteps 
                    steps={processSteps}
                    isProcessing={isProcessing}
                    defaultCollapsed={true}
                  />
                </div>
              )}
              
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Message bubble */}
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-opensoc-600 text-white'
                        : 'bg-soc-dark-800 text-slate-200'
                    }`}
                  >
                    <MessageContent 
                      content={message.content}
                      role={message.role}
                      enableMarkdown={markdownEnabled}
                      ragContext={message.ragContext}
                      toolExecutions={message.metadata?.toolExecutions}
                      enabledTools={message.metadata?.enabledTools}
                    />
                  </div>

                  {/* Message info */}
                  <div className={`flex items-center mt-1 space-x-2 text-xs text-slate-500 ${
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
            </div>
          );
        })}

        {/* Show ProcessSteps if processing but no assistant messages yet */}
        {processSteps.length > 0 && messages.filter(m => m.role === 'assistant').length === 0 && (
          <div className="mb-4">
            <ProcessSteps 
              steps={processSteps}
              isProcessing={isProcessing}
              defaultCollapsed={true}
            />
          </div>
        )}

        {/* RAG Search Progress */}
        <RAGSearchProgress
          isVisible={ragProgress.isVisible}
          isExpanded={ragProgress.isExpanded}
          stage={ragProgress.stage}
          message={ragProgress.message}
          progress={ragProgress.progress}
          totalSources={ragProgress.totalSources}
          searchBreakdown={ragProgress.searchBreakdown}
          totalResults={ragProgress.totalResults}
          totalSearchTime={ragProgress.totalSearchTime}
          currentDataSource={ragProgress.currentDataSource}
          error={ragProgress.error}
          onToggleExpanded={() => setRagProgress(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
        />

        {/* Process Steps moved inside message loop - will be rendered before relevant messages */}

        {/* AI Thinking indicator - only show after search completion */}
        {isLoading && (!ragProgress.isVisible || ragProgress.stage === 'completed') && (
          <div className="flex justify-start">
            <div className="bg-soc-dark-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Loader className="h-4 w-4 animate-spin text-opensoc-500" />
                <span className="text-sm text-slate-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-400 font-medium">Error</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Full Settings Overlay */}
      {showSettings && settingsMode === 'full' && (
        <div className="absolute inset-0 bg-soc-dark-900 z-10 flex flex-col">
          {/* Full Settings Header */}
          <div className="flex items-center justify-between p-4 border-b border-soc-dark-700 bg-soc-dark-800">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-opensoc-500" />
              <h3 className="text-lg font-medium text-white">Chat Settings & AI Tools</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSettingsMode('compact')}
                className="px-3 py-1 text-sm rounded bg-soc-dark-600 text-slate-400 hover:text-white hover:bg-soc-dark-500 transition-colors"
              >
                Minimize
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-soc-dark-700 text-slate-400 hover:text-white transition-colors"
                title="Close Settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Full Settings Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Current Conversation Section */}
              {currentConversation && (
                <div className="bg-soc-dark-800 p-4 rounded-lg border border-soc-dark-600">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-opensoc-500" />
                    Current Conversation
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Title:</span>
                      <span className="text-white ml-2">{currentConversation.title || 'Untitled'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Messages:</span>
                      <span className="text-white ml-2">{currentConversation.messageCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Last Activity:</span>
                      <span className="text-white ml-2">
                        {currentConversation.lastActivity 
                          ? new Date(currentConversation.lastActivity).toLocaleString()
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Tools Section */}
              <div className="bg-soc-dark-800 p-4 rounded-lg border border-soc-dark-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-white flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-opensoc-500" />
                    AI Tools Configuration
                  </h4>
                  <div className="text-sm text-slate-400">
                    {enabledTools.length} of {availableTools.reduce((sum, cat) => sum + cat.tools?.length || 0, 0)} tools enabled
                  </div>
                </div>
                
                <div className="border border-soc-dark-600 rounded-lg">
                  <ToolSelectionEmbedded
                    enabledTools={enabledTools}
                    onToolsChange={saveToolPreferences}
                    availableTools={availableTools}
                  />
                </div>
              </div>

              {/* RAG System Section */}
              <div className="bg-soc-dark-800 p-4 rounded-lg border border-soc-dark-600">
                <h4 className="text-sm font-medium text-white mb-4 flex items-center">
                  <Database className="h-4 w-4 mr-2 text-opensoc-500" />
                  RAG System Configuration
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-white">Enable RAG System</label>
                      <p className="text-xs text-slate-400 mt-1">
                        {ragEnabled ? `Active with ${selectedDataSources.length} data sources` : 'RAG system disabled'}
                      </p>
                    </div>
                    <button
                      onClick={() => dispatch(setRagEnabled(!ragEnabled))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        ragEnabled ? 'bg-opensoc-600' : 'bg-soc-dark-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ragEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {ragEnabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-white mb-3 block">Data Sources</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'alerts', label: 'Security Alerts', icon: AlertTriangle },
                            { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
                            { key: 'assets', label: 'Assets', icon: Database },
                            { key: 'iocs', label: 'Threat Intel (IOCs)', icon: Database },
                            { key: 'playbooks', label: 'Playbooks', icon: FileText }
                          ].map(({ key, label, icon: Icon }) => (
                            <label key={key} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-soc-dark-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedDataSources.includes(key)}
                                onChange={() => dispatch(toggleDataSource(key))}
                                className="rounded border-soc-dark-600 bg-soc-dark-700 text-opensoc-500 focus:ring-opensoc-500"
                              />
                              <Icon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-300">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-3 block">
                          Similarity Threshold: {similarityThreshold.toFixed(2)}
                        </label>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={similarityThreshold}
                            onChange={(e) => dispatch(setSimilarityThreshold(parseFloat(e.target.value)))}
                            className="w-full h-2 bg-soc-dark-600 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>0.00 (Broad)</span>
                            <span>0.55 (Default)</span>
                            <span>1.00 (Exact)</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Lower values return more results but may be less relevant. Higher values return fewer, more precise matches.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Other Settings Section */}
              <div className="bg-soc-dark-800 p-4 rounded-lg border border-soc-dark-600">
                <h4 className="text-sm font-medium text-white mb-4 flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-opensoc-500" />
                  Other Settings
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-white">Markdown Rendering</label>
                      <p className="text-xs text-slate-400 mt-1">
                        {markdownEnabled ? 'Enhanced formatting enabled' : 'Plain text responses'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${markdownEnabled ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-soc-dark-700 bg-soc-dark-900/50">
        <div className="relative">
          {/* Main input container */}
          <div className={`relative bg-soc-dark-800 border rounded-xl transition-all duration-200 hover:shadow-md ${
            isLoading 
              ? 'border-opensoc-500/50 ring-2 ring-opensoc-500/20' 
              : 'border-soc-dark-600 focus-within:ring-2 focus-within:ring-opensoc-500/30 focus-within:border-opensoc-500 hover:border-soc-dark-500'
          }`}>
            <textarea
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about security alerts, incidents, threats..."
              className="w-full bg-transparent px-4 py-3 pr-14 text-white placeholder-slate-400 resize-none focus:outline-none transition-all duration-200"
              rows={1}
              disabled={isLoading}
              style={{
                minHeight: '52px',
                maxHeight: '128px',
                overflowY: 'auto'
              }}
            />
            
            {/* Send button positioned inside input */}
            <div className="absolute right-2 bottom-2 flex items-end">
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className={`w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  currentMessage.trim() && !isLoading
                    ? 'bg-gradient-to-r from-opensoc-600 to-opensoc-700 hover:from-opensoc-700 hover:to-opensoc-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                    : 'bg-soc-dark-700 text-slate-500 cursor-not-allowed'
                }`}
                title={isLoading ? 'Sending...' : 'Send message'}
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className={`h-4 w-4 transition-transform ${currentMessage.trim() ? 'scale-100' : 'scale-90'}`} />
                )}
              </button>
            </div>
          </div>
          
          {/* Enhanced status bar */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              {/* RAG Status */}
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${ragEnabled ? 'bg-green-400' : 'bg-slate-500'}`} />
                <span className="text-slate-400">
                  RAG {ragEnabled ? 'enabled' : 'disabled'}
                </span>
              </div>
              
              {/* Data Sources Count */}
              <div className="flex items-center space-x-1">
                <Database className="h-3 w-3 text-slate-500" />
                <span className="text-slate-400">
                  {selectedDataSources.length} source{selectedDataSources.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Message Count */}
              {currentConversation && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-400">
                    {messages.length} message{messages.length !== 1 ? 's' : ''} in session
                  </span>
                </div>
              )}
            </div>
            
            {/* Character count for longer messages */}
            {currentMessage.length > 100 && (
              <div className={`text-xs ${currentMessage.length > 1800 ? 'text-yellow-400' : 'text-slate-500'}`}>
                {currentMessage.length}/2000
              </div>
            )}
          </div>
          
          {/* Typing indicator */}
          {currentMessage.length > 0 && !isLoading && (
            <div className="mt-2 text-xs text-slate-500 flex items-center space-x-1">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISocConsultantPanel;