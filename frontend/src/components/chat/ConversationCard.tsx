import React, { useState } from 'react';
import { 
  MessageCircle, 
  Calendar, 
  Database,
  Archive,
  Trash2,
  Edit3,
  Eye,
  MoreHorizontal,
  Play,
  Bot,
  Zap
} from 'lucide-react';
import { Conversation } from '../../store/chatSlice';

interface ConversationCardProps {
  conversation: Conversation;
  onClick: () => void;
  onDelete: (permanent: boolean) => void;
  searchQuery?: string;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onClick,
  onDelete,
  searchQuery = ''
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-400/20 text-yellow-300 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getConversationPreview = () => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const preview = lastMessage.content.substring(0, 120);
      return preview.length < lastMessage.content.length ? preview + '...' : preview;
    }
    return 'No messages yet';
  };

  const handleDeleteClick = (e: React.MouseEvent, permanent: boolean) => {
    e.stopPropagation();
    onDelete(permanent);
    setShowDeleteConfirm(false);
    setShowActions(false);
  };

  return (
    <div 
      className="group bg-soc-dark-900 border border-soc-dark-700 rounded-lg hover:border-opensoc-600/50 hover:bg-soc-dark-800/50 transition-all duration-200 cursor-pointer relative"
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-lg font-medium text-white truncate group-hover:text-opensoc-100">
              {highlightText(conversation.title || 'Untitled Conversation', searchQuery)}
            </h3>
            <div className="flex items-center space-x-3 text-sm text-slate-400 mt-1">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(conversation.lastActivity)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3" />
                <span>{conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}</span>
              </div>
              {conversation.settings?.ragEnabled && (
                <div className="flex items-center space-x-1">
                  <Database className="h-3 w-3 text-green-400" />
                  <span>RAG</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-soc-dark-700 transition-all duration-200"
            >
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </button>

            {/* Actions Dropdown */}
            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-soc-dark-800 border border-soc-dark-600 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-soc-dark-700"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement continue conversation
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-soc-dark-700"
                  >
                    <Play className="h-4 w-4" />
                    <span>Continue Chat</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement rename
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-soc-dark-700"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Rename</span>
                  </button>

                  <hr className="my-1 border-soc-dark-600" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {highlightText(getConversationPreview(), searchQuery)}
        </p>

        {/* Settings Preview */}
        {conversation.settings && (
          <div className="mt-3 flex items-center space-x-4 text-xs">
            {conversation.settings.ragEnabled && (
              <div className="flex items-center space-x-1 text-green-400">
                <Zap className="h-3 w-3" />
                <span>{conversation.settings.dataSources?.length || 0} sources</span>
              </div>
            )}
            {conversation.settings.model && conversation.settings.model !== 'default' && (
              <div className="flex items-center space-x-1 text-blue-400">
                <Bot className="h-3 w-3" />
                <span>{conversation.settings.model}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-2">Delete Conversation</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete "{conversation.title}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm bg-soc-dark-700 text-slate-300 rounded-lg hover:bg-soc-dark-600"
              >
                Cancel
              </button>
              <button
                onClick={(e) => handleDeleteClick(e, false)}
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Archive
              </button>
              <button
                onClick={(e) => handleDeleteClick(e, true)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click overlay to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default ConversationCard;