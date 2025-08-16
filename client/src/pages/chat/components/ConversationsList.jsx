import PropTypes from 'prop-types';
import UserAvatar from './UserAvatar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const ConversationsList = ({ conversations = [], selectedConversation, onSelectConversation, loading = false, currentUserId }) => {
  // Ensure conversations is always an array
  const conversationsArray = Array.isArray(conversations) ? conversations : [];
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation, currentUserId) => {
    return conversation.participants?.find(p => (p._id || p)?.toString() !== (currentUserId || '').toString()) || {
      fullName: 'Unknown User',
      avatar: null
    };
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
      </div>
      
      {conversationsArray.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.004 9.004 0 01-8.716-6.747M3 12a9 9 0 1118 0z" />
            </svg>
          </div>
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs text-gray-400 mt-1">Start a new conversation to get chatting!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversationsArray.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation, currentUserId);
            
            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-blue-50 ${
                  selectedConversation?._id === conversation._id ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={otherParticipant.avatar}
                    alt={otherParticipant.fullName}
                    size="medium"
                    status={otherParticipant.isOnline ? 'online' : 'offline'}
                    initials={otherParticipant.fullName?.split(' ').map(n => n[0]).join('') || '?'}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {otherParticipant.fullName || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate max-w-40">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                      
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

ConversationsList.propTypes = {
  conversations: PropTypes.array,
  selectedConversation: PropTypes.object,
  onSelectConversation: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ConversationsList;
