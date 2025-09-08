import React from 'react';
import { Conversation } from '../../store/chatSlice';
import ConversationCard from './ConversationCard';
import { MessageCircle, Clock } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect: (conversationId: string) => void;
  onConversationDelete: (conversationId: string, permanent?: boolean) => void;
  searchQuery?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationSelect,
  onConversationDelete,
  searchQuery = ''
}) => {
  // Group conversations by date
  const groupConversationsByDate = (conversations: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    conversations.forEach(conversation => {
      const conversationDate = new Date(conversation.lastActivity);
      let groupKey: string;

      if (conversationDate >= today) {
        groupKey = 'Today';
      } else if (conversationDate >= yesterday) {
        groupKey = 'Yesterday';
      } else if (conversationDate >= thisWeek) {
        groupKey = 'This Week';
      } else if (conversationDate >= thisMonth) {
        groupKey = 'This Month';
      } else {
        // Format as month/year for older conversations
        groupKey = conversationDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conversation);
    });

    // Sort conversations within each group by lastActivity (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });

    return groups;
  };

  const conversationGroups = groupConversationsByDate(conversations);
  const groupKeys = Object.keys(conversationGroups);

  // Sort group keys to show more recent groups first
  const sortedGroupKeys = groupKeys.sort((a, b) => {
    const order = ['Today', 'Yesterday', 'This Week', 'This Month'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      // For month/year groups, sort by date
      return new Date(b).getTime() - new Date(a).getTime();
    }
  });

  if (conversations.length === 0) {
    return (
      <div className="bg-soc-dark-900 rounded-lg border border-soc-dark-700 p-12">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            {searchQuery ? 'No conversations found' : 'No chat history yet'}
          </h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? `No conversations match "${searchQuery}". Try a different search term.`
              : 'Start a conversation with the AI SOC Consultant to see your chat history here.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedGroupKeys.map(groupKey => (
        <div key={groupKey} className="space-y-3">
          {/* Group Header */}
          <div className="flex items-center space-x-2 px-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              {groupKey}
            </h3>
            <div className="flex-1 h-px bg-soc-dark-700"></div>
            <span className="text-xs text-slate-500">
              {conversationGroups[groupKey].length} conversation{conversationGroups[groupKey].length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Conversations in this group */}
          <div className="space-y-2">
            {conversationGroups[groupKey].map(conversation => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onClick={() => onConversationSelect(conversation.id)}
                onDelete={(permanent) => onConversationDelete(conversation.id, permanent)}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;