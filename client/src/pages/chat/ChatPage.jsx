import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from './components/UserAvatar';
import ProfileModal from './components/ProfileModal';
import ConversationsList from './components/ConversationsList';
import MessagesArea from './components/MessagesArea';
import MessageInput from './components/MessageInput';
import NewChatModal from './components/NewChatModal';
import { conversationsAPI, filesAPI, API_BASE_URL } from '../../services/api';
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
  const [isNewChatOpen, setNewChatOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [typingByConversation, setTypingByConversation] = useState({}); // { [conversationId]: [{userId, userName, at}] }
  const [replyTo, setReplyTo] = useState(null);
  const [firstUnreadId, setFirstUnreadId] = useState(null);

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

    const handleUserTyping = (data) => {
      // Update selected conversation typing indicator
      if (selectedConversation && data.conversationId === selectedConversation._id && data.userId !== (user?._id || user?.id)) {
        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.userId !== data.userId);
          return [...filtered, { ...data, at: Date.now() }];
        });
      }
      // Update list typing map for any conversation
      if (data.userId !== (user?._id || user?.id)) {
        setTypingByConversation((prev) => {
          const list = [...(prev[data.conversationId] || [])].filter((u) => u.userId !== data.userId);
          const next = { ...prev, [data.conversationId]: [...list, { userId: data.userId, userName: data.userName, at: Date.now() }] };
          return next;
        });
        // Auto-expire after 6s in case stop event is missed
        setTimeout(() => {
          setTypingByConversation((prev) => {
            const arr = prev[data.conversationId] || [];
            const filtered = arr.filter((u) => u.userId !== data.userId);
            if (filtered.length === arr.length) return prev;
            return { ...prev, [data.conversationId]: filtered };
          });
        }, 6000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
      setTypingByConversation((prev) => {
        const arr = prev[data.conversationId] || [];
        const filtered = arr.filter((u) => u.userId !== data.userId);
        if (filtered.length === arr.length) return prev;
        return { ...prev, [data.conversationId]: filtered };
      });
    };

    const handleMessageDelivered = (data) => {
      if (!selectedConversation) return;
      if (data.conversationId !== selectedConversation._id) return;
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, status: 'delivered' } : m)));
    };

    const handleMessageRead = (data) => {
      if (!selectedConversation) return;
      if (data.conversationId !== selectedConversation._id) return;
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, status: 'read' } : m)));
    };

    const handleMessageEdited = (data) => {
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, content: data.content, isEdited: data.isEdited, editedAt: data.editedAt } : m)));
    };

    const handleMessageReactionUpdated = (data) => {
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, reactions: data.reactions } : m)));
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m)));
    };

    const handleMessageDeletedForMe = (data) => {
      setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
  socket.on('message_edited', handleMessageEdited);
  socket.on('message_deleted', handleMessageDeleted);
  socket.on('message_deleted_for_me', handleMessageDeletedForMe);
  socket.on('message_reaction_updated', handleMessageReactionUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
  socket.off('message_edited', handleMessageEdited);
  socket.off('message_deleted', handleMessageDeleted);
  socket.off('message_deleted_for_me', handleMessageDeletedForMe);
  socket.off('message_reaction_updated', handleMessageReactionUpdated);
    };
  }, [socket, isConnected, selectedConversation, user]);

  const handleSelectConversation = async (conversation) => {
    if (selectedConversation?._id === conversation._id) return;

    setSelectedConversation(conversation);
    setMessageLoading(true);
    try {
      const response = await conversationsAPI.getMessages(conversation._id);
      // response.data.data.messages is the array
      const arr = (response.data && response.data.data && response.data.data.messages) ? response.data.data.messages : [];
      setMessages(arr);
      // assume unread cutoff is conversation.lastReadAt per user (not available here), fallback: if unreadCount>0, mark first of last N
      if (conversation.unreadCount > 0 && arr.length > 0) {
        const idx = Math.max(arr.length - conversation.unreadCount, 0);
        const id = arr[idx]?._id || arr[idx]?.id || null;
        setFirstUnreadId(id);
      } else {
        setFirstUnreadId(null);
      }
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
  setTypingUsers([]);
    }
  };

  // Users list removed from UI; starting new chats can be reintroduced via a modal later

  const handleSendMessage = async (content, attachments = []) => {
    if (!selectedConversation) return;
    // Upload attachments first (if any)
  let uploaded = [];
    if (attachments && attachments.length > 0) {
      try {
        const results = await Promise.all(
          attachments.map(async (file) => {
            const res = await filesAPI.uploadFile(file, selectedConversation._id);
            if (res?.success) {
              const f = res.data?.file || res.data?.data || res.data || {};
              const relative = f.url || f.path;
              const url = relative?.startsWith('http') ? relative : `${API_BASE_URL}${relative || ''}`;
              return {
                url,
                filename: f.filename || f.originalName || file.name,
                mimeType: f.mimetype || file.type,
                size: f.size || file.size,
              };
            }
            return null;
          })
        );
        uploaded = results.filter(Boolean);
      } catch (e) {
        console.error('Attachment upload failed', e);
      }
    }

    const first = uploaded[0];
    const messageData = {
      conversationId: selectedConversation._id,
      content,
      attachment: first || null,
      replyTo: replyTo?._id || replyTo?.id || null,
      type: first ? ((first.mimeType || '').startsWith('image/') ? 'image' : ((first.mimeType || '').startsWith('video/') ? 'video' : 'file')) : 'text',
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
  setReplyTo(null);
  };

  // Typing emitters passed to MessageInput
  const handleTypingStart = () => {
    if (!socket || !selectedConversation) return;
    socket.emit('typing_start', {
      conversationId: selectedConversation._id,
      userId: user?._id || user?.id,
      userName: user?.fullName,
    });
  };

  const handleTypingStop = () => {
    if (!socket || !selectedConversation) return;
    socket.emit('typing_stop', {
      conversationId: selectedConversation._id,
      userId: user?._id || user?.id,
    });
  };

  const handleLogout = () => {
    logout();
  };

  const currentUserId = user?._id || user?.id;
  const selectedUser = selectedConversation?.participants.find(p => (p._id || p)?.toString() !== (currentUserId || '').toString());

  // Basic keyboard shortcut for search (placeholder): Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // TODO: open search UI modal
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar (Conversations) - full screen on mobile, fixed width on desktop */}
      <div className={`${selectedConversation ? 'hidden' : 'flex'} sm:flex w-full sm:w-96 h-full bg-white border-r border-gray-200 flex-col`}>
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
            onNewChat={() => setNewChatOpen(true)}
            typingMap={typingByConversation}
          />
        </div>
      </div>

      {/* Chat Pane - hidden on mobile until a conversation is selected */}
      <div className={`${selectedConversation ? 'flex' : 'hidden'} sm:flex flex-1 min-h-0 flex-col w-full`}>
        {selectedConversation ? (
          <>
            <div className="p-5 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden mr-1 p-2 -ml-2 rounded-full hover:bg-gray-100"
                  aria-label="Back to conversations"
                  title="Back"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {selectedUser && (
                  <UserAvatar
                    src={selectedUser.avatar}
                    alt={selectedUser.fullName}
                    status={selectedUser.isOnline ? 'online' : 'offline'}
                  />
                )}
                <div>
                  <h3 className="font-semibold">{selectedUser?.fullName}</h3>
                  <p className="text-sm text-gray-500">
                    {typingUsers.length > 0 ? (
                      <span className="inline-flex items-center gap-1">typing
                        <span className="relative flex h-2 w-6 items-center">
                          <span className="mx-[1px] inline-block h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="mx-[1px] inline-block h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '120ms' }} />
                          <span className="mx-[1px] inline-block h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '240ms' }} />
                        </span>
                      </span>
                    ) : (selectedUser?.isOnline ? 'Online' : 'Offline')}
                  </p>
                </div>
              </div>
              <div />
            </div>
            <MessagesArea
              selectedConversation={selectedConversation}
              messages={messages}
              loading={messageLoading}
              currentUser={user}
              typingUsers={typingUsers}
              onReply={(msg) => setReplyTo(msg)}
              onDelete={(msg, scope) => conversationsAPI.deleteMessage(msg._id, scope)}
              onEdit={(msg, newText) => socket?.emit('edit_message', { messageId: msg._id, content: newText })}
              firstUnreadId={firstUnreadId}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              onStartTyping={handleTypingStart}
              onStopTyping={handleTypingStop}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
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
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setNewChatOpen(false)}
        onCreated={(conv) => {
          // Prepend if not present and open it
          setConversations((prev) => {
            const exists = (prev || []).some((c) => c._id === conv._id);
            const normalized = {
              ...conv,
              lastMessage: conv.lastMessage?.content || conv.lastMessage || '',
              lastMessageTime: conv.lastMessage?.createdAt || conv.updatedAt,
            };
            return exists ? prev.map((c) => (c._id === conv._id ? { ...c, ...normalized } : c)) : [normalized, ...(prev || [])];
          });
          setSelectedConversation(conv);
        }}
      />
    </div>
  );
};

export default ChatPage;
