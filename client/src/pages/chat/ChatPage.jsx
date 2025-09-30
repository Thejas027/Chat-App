import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from './components/UserAvatar';
import ProfileModal from './components/ProfileModal';
import ConversationsList from './components/ConversationsList';
import MessagesArea from './components/MessagesArea';
import MessageInput from './components/MessageInput';
import NewChatModal from './components/NewChatModal';
import SearchModal from './components/SearchModal';
import { conversationsAPI, filesAPI, API_BASE_URL, messagesAPI } from '../../services/api';
import { showError } from '../../utils/toast';

const ChatPage = () => {
  const { user, logout, checkAuthStatus } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Tabs removed; keep UI simple
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNewChatOpen, setNewChatOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [typingByConversation, setTypingByConversation] = useState({}); // { [conversationId]: [{userId, userName, at}] }
  const [replyTo, setReplyTo] = useState(null);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState('');
  const [jumpToMessageId, setJumpToMessageId] = useState('');

  // Fetch conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const convResponse = await conversationsAPI.getConversations();
        const conversationsData = (convResponse && convResponse.data && convResponse.data.data && convResponse.data.data.conversations) ? convResponse.data.data.conversations : [];
        const me = (user?._id || user?.id || '').toString();
        const normalized = (Array.isArray(conversationsData) ? conversationsData : []).map(c => {
          const lm = (c.lastMessage && typeof c.lastMessage === 'object') ? c.lastMessage : null;
          const lastMessagePreview = lm ? (lm.content || '') : (c.lastMessage || '');
          const lastMessageTime = lm ? (lm.createdAt || c.updatedAt) : (c.lastMessageTime || c.updatedAt);
          const lastMessageId = lm ? (lm._id || lm.id) : undefined;
          const lastMessageStatus = lm ? lm.status : undefined;
          const lastMessageIsOwn = lm ? (((typeof lm.sender === 'string' ? lm.sender : lm.sender?._id) || '').toString() === me) : false;
          return {
            ...c,
            lastMessage: lastMessagePreview,
            lastMessageTime,
            lastMessageId,
            lastMessageStatus,
            lastMessageIsOwn,
          };
        });
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
  }, [user]);

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
    const me = (user?._id || user?.id || '').toString();
    const isSelf = ((typeof message.sender === 'string' ? message.sender : message.sender?._id) || '').toString() === me;
    if (existing) {
          return list.map((conv) =>
            conv._id === message.conversation
              ? {
                ...conv,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
        lastMessageId: message._id,
        lastMessageIsOwn: isSelf,
        lastMessageStatus: isSelf ? (message.status || 'sent') : conv.lastMessageStatus,
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
      lastMessageId: message._id,
      lastMessageIsOwn: isSelf,
      lastMessageStatus: isSelf ? (message.status || 'sent') : undefined,
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
      setConversations((prev) => (prev || []).map((c) => (c._id === data.conversationId && c.lastMessageId === data.messageId ? { ...c, lastMessageStatus: 'delivered' } : c)));
    };

    const handleMessageRead = (data) => {
      if (!selectedConversation) return;
      if (data.conversationId !== selectedConversation._id) return;
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, status: 'read' } : m)));
      setConversations((prev) => (prev || []).map((c) => (c._id === data.conversationId && c.lastMessageId === data.messageId ? { ...c, lastMessageStatus: 'read' } : c)));
    };

    const handleUserStatusChanged = (data) => {
      setConversations((prev) =>
        (prev || []).map((conv) => ({
          ...conv,
          participants: (conv.participants || []).map((p) => {
            const pid = (p?._id ?? p)?.toString?.() || String(p);
            if (pid === data.userId) {
              return typeof p === 'object'
                ? { ...p, isOnline: data.isOnline, lastSeen: data.lastSeen }
                : { _id: pid, isOnline: data.isOnline, lastSeen: data.lastSeen };
            }
            return p;
          }),
        }))
      );
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
  socket.on('user_status_changed', handleUserStatusChanged);

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
  socket.off('user_status_changed', handleUserStatusChanged);
    };
  }, [socket, isConnected, selectedConversation, user]);

  const handleSelectConversation = async (conversation) => {
    if (selectedConversation?._id === conversation._id) return;

    setSelectedConversation(conversation);
  setHighlightTerm('');
  setJumpToMessageId('');
    setMessageLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const response = await conversationsAPI.getMessages(conversation._id, 1);
      const dataBlock = response?.data?.data || {};
      const arr = Array.isArray(dataBlock.messages) ? dataBlock.messages : [];
      setMessages(arr);
      // Prefer server-provided firstUnreadId for accuracy, fallback to heuristic if absent
      const serverMarker = dataBlock.firstUnreadIdGlobal || dataBlock.firstUnreadId;
      if (serverMarker) {
        setFirstUnreadId(serverMarker);
      } else if (conversation.unreadCount > 0 && arr.length > 0) {
        const idx = Math.max(arr.length - conversation.unreadCount, 0);
        const id = arr[idx]?._id || arr[idx]?.id || null;
        setFirstUnreadId(id);
      } else {
        setFirstUnreadId(null);
      }
      const total = dataBlock?.pagination?.totalPages || 1;
      setHasMore((total > 1));
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

  const formatLastSeen = (iso) => {
    if (!iso) return 'Offline';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'last seen just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `last seen ${min} min${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `last seen ${hr} hour${hr === 1 ? '' : 's'} ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return `last seen yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `last seen ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Basic keyboard shortcut for search modal: Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-screen flex bg-gray-50 overflow-x-hidden">
      {/* Sidebar (Conversations) - full screen on mobile, fixed width on desktop */}
      <div className={`${selectedConversation ? 'hidden' : 'flex'} sm:flex w-full sm:w-96 h-full bg-white shadow-lg sm:shadow-md flex-col min-w-0 overflow-x-hidden relative z-10`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="transform transition-transform hover:scale-105 duration-300">
                  <UserAvatar 
                    src={user?.avatar} 
                    alt={user?.fullName} 
                    size="large" 
                    status="online"
                    showStatusAnimation={true}
                    className="ring-2 ring-offset-2 ring-blue-100"
                  />
                </div>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="absolute hover:cursor-pointer -bottom-1 -right-1 p-1.5 rounded-full bg-white text-blue-600 shadow-md border border-blue-100 hover:bg-blue-50 transition-colors hover:scale-110 active:scale-95"
                  title="Edit profile"
                  aria-label="Edit profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div>
                <h2 className="font-semibold text-lg text-gray-800">{user?.fullName}</h2>
                <p className="text-sm flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-green-600 font-medium">Online</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title="Search messages (Ctrl+K)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                onClick={handleLogout} 
                className="p-2.5 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" 
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className={`${selectedConversation ? 'flex' : 'hidden'} sm:flex flex-1 min-h-0 min-w-0 flex-col w-full overflow-x-hidden bg-white sm:bg-gray-50`}>
        {selectedConversation ? (
          <>
            <div className="px-5 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Back to conversations"
                  title="Back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {selectedUser && (
                  <div className="relative">
                    <UserAvatar
                      src={selectedUser.avatar}
                      alt={selectedUser.fullName}
                      status={selectedUser.isOnline ? 'online' : 'offline'}
                    />
                    
                    {typingUsers.length > 0 && (
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedUser?.fullName}</h3>
                  <p className="text-sm text-gray-500">
                    {typingUsers.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                        <span className="mr-1 flex">
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-typing" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 mx-0.5 bg-blue-600 rounded-full animate-typing" style={{ animationDelay: '300ms' }}></span>
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-typing" style={{ animationDelay: '600ms' }}></span>
                        </span>
                        typing...
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 ${selectedUser?.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedUser?.isOnline && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                        {selectedUser?.isOnline ? 'Online' : formatLastSeen(selectedUser?.lastSeen)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Search messages (Ctrl+K)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
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
              highlightTerm={highlightTerm}
              jumpToMessageId={jumpToMessageId}
              onLoadMore={async () => {
                if (!hasMore || !selectedConversation) return;
                const nextPage = page + 1;
                try {
                  const container = document.querySelector('.messages-scroll-container');
                  const prevHeight = container ? container.scrollHeight : 0;
                  const resp = await conversationsAPI.getMessages(selectedConversation._id, nextPage);
                  const data = resp?.data?.data || {};
                  const older = Array.isArray(data.messages) ? data.messages : [];
                  if (older.length === 0) { setHasMore(false); return; }
                  setMessages((prev) => [...older, ...prev]);
                  setPage(nextPage);
                  // Restore scroll position so content doesn't jump
                  setTimeout(() => {
                    if (container) {
                      const newHeight = container.scrollHeight;
                      container.scrollTop = newHeight - prevHeight;
                    }
                  }, 0);
                } catch (e) {
                  // no-op
                }
              }}
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
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        conversationId={selectedConversation?._id}
        onJump={async (mid, term) => {
          // If the message is already rendered, just scroll and highlight
          const existing = messages.some((m) => (m._id || m.id) === mid);
          if (!existing) {
            // Load a small context window around the target message
            try {
              const res = await messagesAPI.getContext(mid, 30, 30);
              const ctx = res?.data?.data || res?.data || {};
              const ctxMessages = Array.isArray(ctx.messages) ? ctx.messages : Array.isArray(ctx) ? ctx : [];
              if (ctxMessages.length > 0) {
                // Merge uniquely by id and sort by createdAt
                setMessages((prev) => {
                  const map = new Map();
                  const push = (arr) => (arr || []).forEach((mm) => { const id = mm._id || mm.id; if (!id) return; map.set(id, mm); });
                  push(prev);
                  push(ctxMessages);
                  const merged = Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                  return merged;
                });
              }
            } catch (e) {
              // ignore fetch error
            }
          }
          // Delegate actual scrolling to MessagesArea (Virtuoso ref)
          setJumpToMessageId(mid);
          // Clear after a moment to allow future jumps
          setTimeout(() => setJumpToMessageId(''), 800);
          setHighlightTerm(term || '');
        }}
      />
    </div>
  );
};

export default ChatPage;
