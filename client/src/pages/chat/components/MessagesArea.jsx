import PropTypes from 'prop-types';
import UserAvatar from './UserAvatar';

const MessageItem = ({ message, isOwn, showAvatar = true }) => {
  return (
    <div className={`flex items-end space-x-2 mb-4 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {showAvatar && !isOwn && (
        <UserAvatar
          src={message.sender?.avatar}
          alt={message.sender?.name}
          size="small"
          initials={message.sender?.name?.charAt(0)}
        />
      )}
      
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-900 rounded-bl-none'
      }`}>
        {!isOwn && showAvatar && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.sender?.name}
          </p>
        )}
        
        <p className="text-sm break-words">{message.content}</p>
        
        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};

const MessagesArea = ({ selectedConversation, messages = [] }) => {
  // Mock messages for demonstration
  const mockMessages = selectedConversation ? [
    {
      id: 1,
      content: "Hey! How are you doing today?",
      sender: { name: selectedConversation.name, avatar: null },
      timestamp: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      content: "I'm doing great! Just finished working on a new project. How about you?",
      sender: { name: "You" },
      timestamp: "10:32 AM",
      isOwn: true
    },
    {
      id: 3,
      content: "That sounds exciting! What kind of project are you working on?",
      sender: { name: selectedConversation.name, avatar: null },
      timestamp: "10:33 AM",
      isOwn: false
    },
    {
      id: 4,
      content: "It's a chat application with React and Node.js. Really enjoying the process of building it!",
      sender: { name: "You" },
      timestamp: "10:35 AM",
      isOwn: true
    },
    {
      id: 5,
      content: "Wow, that's awesome! I'd love to see it when you're done.",
      sender: { name: selectedConversation.name, avatar: null },
      timestamp: "10:36 AM",
      isOwn: false
    }
  ] : [];

  const displayMessages = messages.length > 0 ? messages : mockMessages;

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

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayMessages.map((message, index) => {
          const prevMessage = displayMessages[index - 1];
          const showAvatar = !prevMessage || prevMessage.sender?.name !== message.sender?.name;
          
          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.isOwn}
              showAvatar={showAvatar}
            />
          );
        })}
      </div>
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    content: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      name: PropTypes.string,
      avatar: PropTypes.string
    }),
    timestamp: PropTypes.string.isRequired,
    isOwn: PropTypes.bool.isRequired
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool
};

MessagesArea.propTypes = {
  selectedConversation: PropTypes.object,
  messages: PropTypes.array
};

export default MessagesArea;
