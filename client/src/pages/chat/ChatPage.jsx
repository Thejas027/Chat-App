import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from './components/UserAvatar';
import ProfileModal from './components/ProfileModal';
import ConversationsList from './components/ConversationsList';
import MessagesArea from './components/MessagesArea';
import MessageInput from './components/MessageInput';
import { conversationsAPI } from '../../services/api';
import { showError } from '../../utils/toast';

const ChatPage = () => {
  const { user, logout, checkAuthStatus } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  // Tabs removed; keep UI simple
  const [isProfileOpen, setProfileOpen] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const convResponse = await conversationsAPI.getConversations();
        const conversationsData = (convResponse && convResponse.data && convResponse.data.data && convResponse.data.data.conversations) ? convResponse.data.data.conversations : [];
        const normalized = (Array.isArray(conversationsData) ? conversationsData : []).map(c => ({
          ...c,
          lastMessage: c.lastMessage && typeof c.lastMessage === 'object' ? (c.lastMessage.content || '') : (c.lastMessage || ''),
          lastMessageTime: c.lastMessage && typeof c.lastMessage === 'object' ? (c.lastMessage.createdAt || c.updatedAt) : (c.lastMessageTime || c.updatedAt)
        }));
        const deduped = Array.from(new Map(normalized.map(c => [c._id, c])).values())
          .sort((a, b) => new Date(b.lastMessageTime || b.updatedAt) - new Date(a.lastMessageTime || a.updatedAt));
        setConversations(deduped);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        showError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = async (message) => {
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
      }

      setConversations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const existing = list.find((c) => c._id === message.conversation);
        if (existing) {
          return list.map((conv) =>
            conv._id === message.conversation
              ? {
                ...conv,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                unreadCount:
                  conv._id === selectedConversation?._id
                    ? 0
                    : (conv.unreadCount || 0) + 1,
              }
              : conv
          );
        }
        // If conversation not found, add a placeholder; we'll try to fetch it
        return [
          {
            _id: message.conversation,
            participants: [],
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: 1,
          },
          ...list,
        ];
      });

      // Try to fetch full conversation if it's not already loaded
      try {
        const res = await conversationsAPI.getConversation(message.conversation);
        const conv = res && res.data && res.data.data ? res.data.data : null;
        if (conv && conv._id) {
          setConversations((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some((c) => c._id === conv._id);
            const normalized = {
              ...conv,
              lastMessage:
                conv.lastMessage && typeof conv.lastMessage === 'object'
                  ? conv.lastMessage.content || ''
                  : conv.lastMessage || '',
              lastMessageTime:
                conv.lastMessage && typeof conv.lastMessage === 'object'
                  ? conv.lastMessage.createdAt || conv.updatedAt
                  : conv.lastMessageTime || conv.updatedAt,
            };
            return exists
              ? list.map((c) => (c._id === conv._id ? { ...c, ...normalized } : c))
              : [normalized, ...list];
          });
        }
      } catch (e) {
        // ignore fetch error
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, isConnected, selectedConversation]);

  const handleSelectConversation = async (conversation) => {
    if (selectedConversation?._id === conversation._id) return;

    setSelectedConversation(conversation);
    setMessageLoading(true);
    try {
      const response = await conversationsAPI.getMessages(conversation._id);
      // response.data.data.messages is the array
      setMessages((response.data && response.data.data && response.data.data.messages) ? response.data.data.messages : []);
      if (conversation.unreadCount > 0) {
        await conversationsAPI.markAsRead(conversation._id);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
      if (socket) {
        socket.emit('join_conversation', conversation._id);
      }
    } catch (error) {
      showError('Failed to load messages');
    } finally {
      setMessageLoading(false);
    }
  };

  // Users list removed from UI; starting new chats can be reintroduced via a modal later

  const handleSendMessage = async (content, attachments = []) => {
    if (!selectedConversation) return;
    const messageData = {
      conversationId: selectedConversation._id,
      content,
      attachments,
    };
    try {
      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      } else {
        // Fallback to API if socket is not connected
        const response = await conversationsAPI.sendMessage(messageData);
        if (response && response.data && response.data.data) {
          setMessages(prev => [...prev, response.data.data]);
        }
      }
    } catch (error) {
      showError('Failed to send message');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const selectedUser = selectedConversation?.participants.find(p => p._id !== user.id);

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="w-96 h-full bg-white border-r border-gray-200 flex flex-col">
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <UserAvatar src={user?.avatar} alt={user?.fullName} size="large" status="online" />
                <button
                  onClick={() => setProfileOpen(true)}
                  className="absolute hover:cursor-pointer -bottom-1 -right-1 p-1 rounded-full bg-white text-gray-700 shadow border hover:bg-gray-50"
                  title="Edit profile"
                  aria-label="Edit profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div>
                <h2 className="font-semibold text-lg">{user?.fullName}</h2>
                <p className="text-sm text-green-500">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-200" title="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ConversationsList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            loading={loading}
            currentUserId={user?._id || user?.id}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-5 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                {selectedUser && (
                  <UserAvatar
                    src={selectedUser.avatar}
                    alt={selectedUser.fullName}
                    status={selectedUser.isOnline ? 'online' : 'offline'}
                  />
                )}
                <div>
                  <h3 className="font-semibold">{selectedUser?.fullName}</h3>
                  <p className="text-sm text-gray-500">{selectedUser?.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div />
            </div>
            <MessagesArea
              selectedConversation={selectedConversation}
              messages={messages}
              loading={messageLoading}
              currentUser={user}
            />
            <MessageInput onSendMessage={handleSendMessage} disabled={!isConnected} />
          </>
        ) : (
          <>
            <div className="p-4 bg-white border-b font-semibold text-gray-700">Chat</div>
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation or user to start chatting
            </div>
          </>
        )}
      </div>
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onUpdated={async () => {
          // Refresh auth context so header avatar/name update
          await checkAuthStatus();
        }}
      />
    </div>
  );
};

export default ChatPage;
