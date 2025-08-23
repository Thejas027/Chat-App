import PropTypes from 'prop-types';
import { API_BASE_URL } from '../../../services/api';
import { messagesAPI } from '../../../services/api';
import { useEffect, useRef, useState, useCallback } from 'react';
import UserAvatar from './UserAvatar';
import { showChoiceToast, showInputToast } from '../../../utils/toastInteractive';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const EMOJI_SET = ['👍','❤️','😂','😮','😢'];

const MessageItem = ({ message, isOwn, showAvatar = true, currentUser, onReply, onEdit, onDelete, onJump }) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const linkify = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (!part) return null;
      const isUrl = /^(https?:\/\/|www\.)/i.test(part);
      if (!isUrl) return <span key={i}>{part}</span>;
      const href = part.startsWith('http') ? part : `http://${part}`;
      return <a key={i} href={href} target="_blank" rel="noreferrer" className="underline break-all">{part}</a>;
    });
  };

  const handleToggleReaction = async (emoji) => {
    try {
      const myId = currentUser?._id || currentUser?.id;
      const reacted = (message.reactions || []).some(r => (r.user?._id || r.user)?.toString() === (myId || '').toString());
      if (reacted && (message.reactions || []).some(r => r.emoji === emoji)) {
        await messagesAPI.removeReaction(message._id);
      } else {
        await messagesAPI.addReaction(message._id, emoji);
      }
    } catch (e) {
      // ignore toast; optimistic UI will update via socket event
    }
  };

  const [showPicker, setShowPicker] = useState(false);

  // Swipe-to-reply (mobile)
  let touchStartX = 0;
  let touchActive = false;
  const onTouchStart = (e) => {
    touchActive = true;
    touchStartX = e.touches?.[0]?.clientX || 0;
  };
  const onTouchMove = (e) => {
    if (!touchActive) return;
    const dx = (e.touches?.[0]?.clientX || 0) - touchStartX;
    if (dx > 60) {
      touchActive = false;
      onReply?.(message);
    }
  };
  const onTouchEnd = () => { touchActive = false; };

  return (
  <div className={`flex items-end mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {showAvatar && !isOwn && (
        <UserAvatar
          src={message.sender?.avatar}
          alt={message.sender?.fullName}
          size="small"
          initials={message.sender?.fullName?.charAt(0) || '?'}
        />
      )}
      
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-slate-100 text-slate-900 rounded-bl-sm border border-slate-200'
        }`}
      >
        {!isOwn && showAvatar && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.sender?.fullName || 'Unknown User'}
          </p>
        )}

        {message.replyTo && (
          <button
            type="button"
            onClick={() => onJump?.(message.replyTo?._id || message.replyTo?.id)}
            className={`mb-2 block text-left text-xs px-2 py-1 rounded ${isOwn ? 'bg-white/10' : 'bg-black/5'} hover:opacity-90`}
          >
            <div className="text-[10px] opacity-70">Replying to {message.replyTo?.sender?.fullName || 'message'}</div>
            {(message.replyTo?.content || message.replyTo?.attachment?.filename) ? (
              <div className="truncate max-w-[240px]">{message.replyTo?.content || message.replyTo?.attachment?.filename}</div>
            ) : null}
          </button>
        )}
        
  <p className="text-sm break-words whitespace-pre-wrap">{linkify(message.content)}{message.isEdited ? <span className="ml-1 text-[10px] opacity-70">(edited)</span> : null}</p>
        
        {(() => {
          const att = message.attachment || null;
          const rel = att && (att.url || att.path || att.fileUrl);
          const src = rel?.startsWith('http') ? rel : (rel ? `${API_BASE_URL}${rel}` : null);
          if (!src) return null; // Do not render attachment UI without a real file URL
          const isImage = (att.mimetype || att.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(src || '');
          return (
            <div className="mt-2">
              {isImage ? (
                <img src={src} alt={att.filename || 'image'} className="max-w-[240px] rounded-md border border-black/5" />
              ) : (
                <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-black/10">
                  <span className="opacity-80">📎</span>
                  <a href={src} target="_blank" rel="noreferrer" className="underline">
                    {att.filename || 'file'}
                  </a>
                  {att.size ? <span className="opacity-60">({Math.ceil(att.size/1024)} KB)</span> : null}
                </div>
              )}
            </div>
          );
        })()}

        {/* Reactions summary (only when there are reactions) */}
        {Array.isArray(message.reactions) && message.reactions.length > 0 && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {Object.entries((message.reactions || []).reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
              <button key={emoji} onClick={() => handleToggleReaction(emoji)} className={`text-xs px-1.5 py-0.5 rounded-full border ${isOwn ? 'border-white/30 text-white' : 'border-gray-300 text-gray-700'} hover:opacity-80`}>{emoji} {count}</button>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1 gap-4">
          <p className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
            {formatTimestamp(message.createdAt)}
          </p>
          
          {isOwn && (
            <div className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </div>
          )}
        </div>
        <div className="mt-1 -mb-1 flex gap-2 opacity-0 hover:opacity-100 transition-opacity relative">
          <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => onReply?.(message)}>Reply</button>
          <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setShowPicker((s) => !s)}>React</button>
          {isOwn && <button className="text-xs text-gray-500 hover:text-gray-700" onClick={async () => {
            const newText = await showInputToast('Edit message', { initialValue: message.content || '' });
            if (newText != null) onEdit?.(message, newText);
          }}>Edit</button>}
          <button className="text-xs text-red-500 hover:text-red-600" onClick={async () => {
            let scope = 'me';
            if (isOwn) {
              const choice = await showChoiceToast('Delete message for…', [
                { label: 'Me only', value: 'me' },
                { label: 'Everyone', value: 'everyone', className: 'bg-red-600 text-white hover:bg-red-700' },
              ]);
              scope = choice || 'me';
            }
            onDelete?.(message, scope);
          }}>Delete</button>
          <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => navigator.clipboard.writeText(message.content || '')}>Copy</button>

          {showPicker && (
            <div className="absolute -top-9 left-0 bg-white border rounded-lg shadow p-1 flex gap-1 z-10" onMouseLeave={() => setShowPicker(false)}>
              {EMOJI_SET.map(em => (
                <button key={em} className="px-1 text-lg hover:scale-110" onClick={() => { handleToggleReaction(em); setShowPicker(false); }}>{em}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessagesArea = ({ selectedConversation, messages = [], loading = false, currentUser, typingUsers = [], onReply, onEdit, onDelete, firstUnreadId, onLoadMore }) => {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const prevConvIdRef = useRef(null);
  const forceScrollRef = useRef(false);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track scroll to toggle scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(distanceFromBottom > 120);
      if (el.scrollTop < 60 && typeof onLoadMore === 'function') {
        onLoadMore();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Auto-scroll on new messages only if user is near bottom
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 200) {
      scrollToBottom('auto');
      setShowNewBadge(false);
    } else {
      setShowNewBadge(true);
    }
  }, [messages, scrollToBottom]);

  // Force scroll to bottom when switching/opening a conversation once messages load
  useEffect(() => {
    if (!selectedConversation) return;
    if (prevConvIdRef.current !== selectedConversation._id) {
      prevConvIdRef.current = selectedConversation._id;
      forceScrollRef.current = true;
    }
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (forceScrollRef.current && !loading) {
      scrollToBottom('auto');
      setShowNewBadge(false);
      forceScrollRef.current = false;
    }
  }, [loading, messages, scrollToBottom]);

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

  const sameSender = (a, b) => {
    if (!a || !b) return false;
    const aid = (typeof a.sender === 'string' ? a.sender : a.sender?._id) || '';
    const bid = (typeof b.sender === 'string' ? b.sender : b.sender?._id) || '';
    return aid.toString() === bid.toString();
  };

  const isSameDay = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const formatDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="messages-scroll-container flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,1) 24px, rgba(0,0,0,1) calc(100% - 24px), rgba(0,0,0,0.12))'
        }}
      >
        {/* top loader */}
        {loading && (
          <div className="flex items-center justify-center py-2 text-xs text-gray-500">Loading…</div>
        )}
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
            const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
            const senderId = (typeof message.sender === 'string' ? message.sender : message.sender?._id) || '';
            const isOwn = (senderId.toString() === currentUserId) || message.isOwn;
            const showAvatar = !prevMessage || !sameSender(prevMessage, message);
            const nextMessage = messages[index + 1];
            const firstOfDay = !prevMessage || !isSameDay(prevMessage?.createdAt, message.createdAt);
            const isFirstInGroup = !prevMessage || !sameSender(prevMessage, message) || !isSameDay(prevMessage?.createdAt, message.createdAt);
            const isLastInGroup = !nextMessage || !sameSender(nextMessage, message) || !isSameDay(nextMessage?.createdAt, message.createdAt);
            
            const isFirstUnread = firstUnreadId && (message._id === firstUnreadId || message.id === firstUnreadId);
            return (
              <div key={message._id || message.id || index} data-mid={message._id || message.id}>
                {isFirstUnread && (
                  <div className="my-2 flex items-center justify-center">
                    <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full border border-blue-200">Unread</span>
                  </div>
                )}
                {firstOfDay && (
                  <div className="my-4 flex items-center justify-center">
                    <span className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                      {formatDayLabel(message.createdAt)}
                    </span>
                  </div>
                )}
                <div className={isFirstInGroup ? 'mt-2' : 'mt-0.5'}>
                  <MessageItem
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    currentUser={currentUser}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onJump={(mid) => {
                      const el = scrollContainerRef.current?.querySelector(`[data-mid="${mid}"]`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 pb-2 -mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">
            <span className="relative flex h-2 w-8 items-center">
              <span className="mx-[2px] inline-block h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="mx-[2px] inline-block h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="mx-[2px] inline-block h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '240ms' }} />
            </span>
            {typingUsers.length === 1 ? `${typingUsers[0].userName || 'Someone'} is typing…` : 'Multiple people are typing…'}
          </div>
        </div>
      )}

      {/* Scroll to bottom button */}
      {(showScrollDown || showNewBadge) && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Scroll to latest message"
          title="Scroll to latest message"
        >
          {showNewBadge ? (
            <span className="text-xs px-2">New</span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    content: PropTypes.string,
    sender: PropTypes.shape({
      _id: PropTypes.string,
      fullName: PropTypes.string,
      avatar: PropTypes.string
    }),
    createdAt: PropTypes.string,
    isOwn: PropTypes.bool,
    status: PropTypes.string,
    attachment: PropTypes.shape({
      url: PropTypes.string,
      path: PropTypes.string,
      filename: PropTypes.string,
      size: PropTypes.number,
      mimetype: PropTypes.string,
      mimeType: PropTypes.string
    }),
    isEdited: PropTypes.bool
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool,
  currentUser: PropTypes.object,
  onReply: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

MessagesArea.propTypes = {
  selectedConversation: PropTypes.object,
  messages: PropTypes.array,
  loading: PropTypes.bool,
  currentUser: PropTypes.object,
  typingUsers: PropTypes.array,
  onReply: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onJump: PropTypes.func,
  firstUnreadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default MessagesArea;
