import PropTypes from 'prop-types';
import UserAvatar from './UserAvatar';

const ConversationsList = ({ conversations = [], selectedConversation, onSelectConversation }) => {
  // Mock conversations for now
  const mockConversations = [
    {
      id: 1,
      name: 'John Smith',
      lastMessage: 'Hey! How are you doing today?',
      timestamp: '2m ago',
      unreadCount: 2,
      isOnline: true,
      avatar: null
    },
    {
      id: 2,
      name: 'Sarah Wilson',
      lastMessage: 'The meeting is scheduled for 3 PM',
      timestamp: '15m ago',
      unreadCount: 0,
      isOnline: true,
      avatar: null
    },
    {
      id: 3,
      name: 'Mike Johnson',
      lastMessage: 'Thanks for the help!',
      timestamp: '1h ago',
      unreadCount: 0,
      isOnline: false,
      avatar: null
    },
    {
      id: 4,
      name: 'Emma Davis',
      lastMessage: 'Can we reschedule our call?',
      timestamp: '2h ago',
      unreadCount: 1,
      isOnline: true,
      avatar: null
    },
    {
      id: 5,
      name: 'Alex Brown',
      lastMessage: 'Perfect! See you tomorrow.',
      timestamp: '1d ago',
      unreadCount: 0,
      isOnline: false,
      avatar: null
    }
  ];

  const displayConversations = conversations.length > 0 ? conversations : mockConversations;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {displayConversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-blue-50 ${
              selectedConversation?.id === conversation.id ? 'bg-blue-100' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <UserAvatar
                src={conversation.avatar}
                alt={conversation.name}
                size="medium"
                status={conversation.isOnline ? 'online' : 'offline'}
                initials={conversation.name.split(' ').map(n => n[0]).join('')}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {conversation.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {conversation.timestamp}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate max-w-40">
                    {conversation.lastMessage}
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
        ))}
      </div>
    </div>
  );
};

ConversationsList.propTypes = {
  conversations: PropTypes.array,
  selectedConversation: PropTypes.object,
  onSelectConversation: PropTypes.func.isRequired
};

export default ConversationsList;
