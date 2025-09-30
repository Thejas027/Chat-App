import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import UserAvatar from './UserAvatar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useSocket } from '../../../context/SocketContext';

const ConversationsList = ({ conversations = [], selectedConversation, onSelectConversation, loading = false, currentUserId, onNewChat, typingMap = {} }) => {
  // Ensure conversations is always an array
  const conversationsArray = Array.isArray(conversations) ? conversations : [];
  const [query, setQuery] = useState('');
  const { userStatuses } = useSocket();
  
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

  const renderTicks = (conv) => {
    if (!conv.lastMessageIsOwn) return null;
    const s = conv.lastMessageStatus;
    if (!s) return null;
    return (
      <span className={`ml-1 text-[11px] ${s === 'read' ? 'text-blue-600' : 'text-gray-400'}`} title={s}>
        {s === 'sent' && '✓'}
        {s === 'delivered' && '✓✓'}
        {s === 'read' && '✓✓'}
      </span>
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversationsArray;
    return conversationsArray.filter((conversation) => {
      const other = getOtherParticipant(conversation, currentUserId);
      const name = (other.fullName || '').toLowerCase();
      const last = (conversation.lastMessage || '').toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversationsArray, currentUserId, query]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="p-4 border-b border-gray-200 sticky top-0 z-10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
            <p className="text-xs text-gray-500 sm:hidden">Tap a chat to open</p>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Start new chat"
            title="New chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {/* Search */}
        <div className="mt-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
  <div className="flex-1 min-h-0 overflow-y-auto">
      {(filtered || []).length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.004 9.004 0 01-8.716-6.747M3 12a9 9 0 1118 0z" />
            </svg>
          </div>
          <p className="text-sm">No conversations found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search or start a new chat</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation, currentUserId);
            
            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`relative p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                  selectedConversation?._id === conversation._id 
                    ? 'bg-blue-100 border-l-4 border-blue-600 pl-3' 
                    : conversation.unreadCount > 0 
                      ? 'bg-blue-50/50 border-l border-blue-300 hover:border-blue-400'
                      : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative transition-transform duration-200 hover:scale-105">
                    <UserAvatar
                      src={otherParticipant.avatar}
                      alt={otherParticipant.fullName}
                      size="medium"
                      status={typingMap[conversation._id] && typingMap[conversation._id].length > 0 
                        ? 'typing' 
                        : userStatuses[otherParticipant._id]?.isOnline || otherParticipant.isOnline 
                          ? 'online' 
                          : 'offline'
                      }
                      initials={otherParticipant.fullName?.split(' ').map(n => n[0]).join('') || '?'}
                      lastSeen={userStatuses[otherParticipant._id]?.lastSeen || otherParticipant.lastSeen}
                      className={conversation.unreadCount > 0 ? "avatar-highlight" : ""}
                      showStatusAnimation={conversation.unreadCount > 0 || (typingMap[conversation._id] && typingMap[conversation._id].length > 0)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm font-semibold truncate ${
                        conversation.unreadCount > 0 ? 'text-blue-800' : 'text-gray-900'
                      }`}>
                        {otherParticipant.fullName || 'Unknown User'}
                      </h3>
                      <div className="flex items-center gap-1">
                        {conversation.unreadCount > 0 && (
                          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold text-white bg-blue-600 rounded-full shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 tabular-nums">
                          {formatTimestamp(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1">
                      <p className={`text-sm truncate max-w-52 ${
                        conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {(typingMap[conversation._id] && typingMap[conversation._id].length > 0) ? (
                          <span className="inline-flex items-center text-blue-600">
                            <span className="mr-1.5 flex">
                              <span className="w-1 h-1 bg-blue-600 rounded-full animate-typing" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1 h-1 mx-0.5 bg-blue-600 rounded-full animate-typing" style={{ animationDelay: '300ms' }}></span>
                              <span className="w-1 h-1 bg-blue-600 rounded-full animate-typing" style={{ animationDelay: '600ms' }}></span>
                            </span>
                            typing...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            {conversation.lastMessageIsOwn && (
                              <span className="inline-flex mr-1 text-gray-500">
                                {conversation.lastMessageStatus === 'sent' && (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {conversation.lastMessageStatus === 'delivered' && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-3 h-3 mr-1" viewBox="0 0 16 16">
                                    <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992a.252.252 0 0 1 .02-.022zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486-.943 1.179z"/>
                                  </svg>
                                )}
                                {conversation.lastMessageStatus === 'read' && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-3 h-3 mr-1 text-blue-600" viewBox="0 0 16 16">
                                    <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992a.252.252 0 0 1 .02-.022zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486-.943 1.179z"/>
                                  </svg>
                                )}
                                You:
                              </span>
                            )}
                            {conversation.lastMessage || 'No messages yet'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedConversation?._id === conversation._id && (
                  <div className="absolute top-0 bottom-0 right-0 w-1 bg-blue-600"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

ConversationsList.propTypes = {
  conversations: PropTypes.array,
  selectedConversation: PropTypes.object,
  onSelectConversation: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNewChat: PropTypes.func,
  typingMap: PropTypes.object,
};

export default ConversationsList;
