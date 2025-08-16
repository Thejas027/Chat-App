import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import UserAvatar from './UserAvatar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const MessageItem = ({ message, isOwn, showAvatar = true, currentUser }) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-end mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {showAvatar && !isOwn && (
        <UserAvatar
          src={message.sender?.avatar}
          alt={message.sender?.fullName}
          size="small"
          initials={message.sender?.fullName?.charAt(0) || '?'}
        />
      )}
      
      <div className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
        isOwn
          ? 'bg-green-500 text-white rounded-br-sm'
          : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
      }`}>
        {!isOwn && showAvatar && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.sender?.fullName || 'Unknown User'}
          </p>
        )}
        
        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="text-xs opacity-75">
                📎 {attachment.filename}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1 gap-4">
          <p className={`text-[10px] ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
            {formatTimestamp(message.createdAt)}
          </p>
          
          {isOwn && (
            <div className={`text-[10px] ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessagesArea = ({ selectedConversation, messages = [], loading = false, currentUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to ChatApp</h3>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.004 9.004 0 01-8.716-6.747M3 12a9 9 0 1118 0z" />
                </svg>
              </div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isOwn = message.sender?._id === currentUser?._id || message.isOwn;
            const showAvatar = !prevMessage || prevMessage.sender?._id !== message.sender?._id;
            
            return (
              <MessageItem
                key={message._id || message.id || index}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                currentUser={currentUser}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    content: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      _id: PropTypes.string,
      fullName: PropTypes.string,
      avatar: PropTypes.string
    }),
    createdAt: PropTypes.string,
    isOwn: PropTypes.bool,
    status: PropTypes.string,
    attachments: PropTypes.array
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool,
  currentUser: PropTypes.object
};

MessagesArea.propTypes = {
  selectedConversation: PropTypes.object,
  messages: PropTypes.array,
  loading: PropTypes.bool,
  currentUser: PropTypes.object
};

export default MessagesArea;
