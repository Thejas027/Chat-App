import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from './components/UserAvatar';
import ConversationsList from './components/ConversationsList';
import MessagesArea from './components/MessagesArea';
import MessageInput from './components/MessageInput';
import { conversationsAPI } from '../../services/api';
import { toast } from '../../utils/toast';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await conversationsAPI.getConversations();
        setConversations(response.data || []);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message) => {
      // Update messages if this conversation is selected
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages(prev => [...prev, message]);
      }

      // Update conversations list
      setConversations(prev => prev.map(conv => {
        if (conv._id === message.conversation) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: conv._id === selectedConversation?._id ? 0 : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
    };

    const handleConversationUpdate = (updatedConversation) => {
      setConversations(prev => prev.map(conv => 
        conv._id === updatedConversation._id ? updatedConversation : conv
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, isConnected, selectedConversation]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessageLoading(true);
    
    try {
      const response = await conversationsAPI.getMessages(conversation._id);
      setMessages(response.data || []);
      
      // Mark conversation as read
      if (conversation.unreadCount > 0) {
        await conversationsAPI.markAsRead(conversation._id);
        setConversations(prev => prev.map(conv => 
          conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
        ));
      }
      
      // Join socket room for this conversation
      if (socket) {
        socket.emit('join_conversation', conversation._id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSendMessage = async (messageContent, attachments = []) => {
    if (!selectedConversation || !messageContent.trim()) return;

    try {
      const messageData = {
        content: messageContent,
        conversation: selectedConversation._id,
        attachments
      };

      // Optimistically add message to UI
      const tempMessage = {
        _id: Date.now(),
        content: messageContent,
        sender: user,
        createdAt: new Date().toISOString(),
        isOwn: true,
        status: 'sending'
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send via socket for real-time delivery
      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      }

      // Also send via API for persistence
      await conversationsAPI.sendMessage(messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove the temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== Date.now()));
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - User Profile & Conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* User Profile Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserAvatar
                src={user?.avatar}
                alt={user?.fullName}
                size="large"
                status="online"
                initials={user?.initials}
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {user?.fullName || 'Loading...'}
                </h2>
                <p className="text-sm text-green-600">Online</p>
              </div>
            </div>
            
            {/* Actions Menu */}
            <div className="flex items-center space-x-2">
              {/* Settings */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* Logout */}
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <ConversationsList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          loading={loading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && (
          /* Chat Header */
          <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserAvatar
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                  size="medium"
                  status={selectedConversation.isOnline ? 'online' : 'offline'}
                  initials={selectedConversation.name.split(' ').map(n => n[0]).join('')}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              
              {/* Chat Actions */}
              <div className="flex items-center space-x-2">
                {/* Voice Call */}
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                
                {/* Video Call */}
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                
                {/* More Options */}
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <MessagesArea 
          selectedConversation={selectedConversation}
          messages={messages}
          loading={messageLoading}
          currentUser={user}
        />

        {/* Message Input */}
        {selectedConversation && (
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={!selectedConversation || !isConnected}
          />
        )}
      </div>

      {/* Right Sidebar - Optional (for user details, shared media, etc.) */}
      <div className="w-80 bg-white border-l border-gray-200 hidden lg:block">
        <div className="p-4 h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm">Chat details and shared media will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
