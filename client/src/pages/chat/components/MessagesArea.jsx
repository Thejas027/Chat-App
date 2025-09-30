import PropTypes from 'prop-types';
import { API_BASE_URL } from '../../../services/api';
import { messagesAPI } from '../../../services/api';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import UserAvatar from './UserAvatar';
import { showChoiceToast, showInputToast } from '../../../utils/toastInteractive';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const EMOJI_SET = ['👍','❤️','😂','😮','😢'];

const MessageItem = ({ message, isOwn, showAvatar = true, currentUser, onReply, onEdit, onDelete, onJump, highlightTerm }) => {
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

  const renderWithHighlight = (nodes) => {
    // nodes can be string or array of React nodes from linkify
    const term = (highlightTerm || '').trim();
    if (!term) return nodes;
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'gi');
    const wrap = (str, keyBase) => {
      let lastIndex = 0;
      const out = [];
      str.replace(rx, (m, offset) => {
        if (offset > lastIndex) out.push(<span key={`${keyBase}-t-${offset}`}>{str.slice(lastIndex, offset)}</span>);
        out.push(<mark key={`${keyBase}-m-${offset}`} className={`${isOwn ? 'bg-yellow-300/60 text-current' : 'bg-yellow-200/80 text-current'} rounded px-0.5`}>{m}</mark>);
        lastIndex = offset + m.length;
        return m;
      });
      if (lastIndex < str.length) out.push(<span key={`${keyBase}-t-end`}>{str.slice(lastIndex)}</span>);
      return out;
    };
    if (typeof nodes === 'string') return wrap(nodes, 's');
    // If array of React nodes (some are strings, some are <a> links), only highlight inside string/text spans
    return nodes.map((n, idx) => {
      if (typeof n === 'string') return <span key={`rs-${idx}`}>{wrap(n, `rs-${idx}`)}</span>;
      if (n && n.type === 'span' && typeof n.props?.children === 'string') {
        return <span key={`sp-${idx}`}>{wrap(n.props.children, `sp-${idx}`)}</span>;
      }
      return n; // leave <a> links and others as-is
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
  <div className={`flex items-end mb-2 group ${isOwn ? 'justify-end' : 'justify-start'}`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {showAvatar && !isOwn && (
        <div className="mr-2 transform transition-transform duration-300 group-hover:scale-105">
          <UserAvatar
            src={message.sender?.avatar}
            alt={message.sender?.fullName}
            size="small"
            status={message.sender?.isOnline ? 'online' : message.sender?.status || 'offline'}
            initials={message.sender?.fullName?.charAt(0) || '?'}
            lastSeen={message.sender?.lastSeen}
            className="hover:ring-2 hover:ring-offset-1 hover:ring-blue-300"
          />
        </div>
      )}
      
      <div
  className={`max-w-[70%] px-4 py-2.5 break-words ${
          isOwn
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm shadow-md'
            : 'bg-white text-slate-800 rounded-t-2xl rounded-br-2xl rounded-bl-sm shadow-sm border border-slate-200'
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
        
  <p className="text-sm break-words whitespace-pre-wrap break-all">{renderWithHighlight(linkify(message.content))}{message.isEdited ? <span className="ml-1 text-[10px] opacity-70">(edited)</span> : null}</p>
        
        {(() => {
          const att = message.attachment || null;
          const rel = att && (att.url || att.path || att.fileUrl);
          const src = rel?.startsWith('http') ? rel : (rel ? `${API_BASE_URL}${rel}` : null);
          if (!src) return null; // Do not render attachment UI without a real file URL
          const isImage = (att.mimetype || att.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(src || '');
          return (
            <div className="mt-2">
              {isImage ? (
                <img src={src} alt={att.filename || 'image'} className="max-w-full sm:max-w-[240px] h-auto rounded-md border border-black/5" />
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
          <div className={`mt-2 -mx-1 flex items-center gap-1.5 flex-wrap ${isOwn ? '-mr-2' : '-ml-2'}`}>
            {Object.entries((message.reactions || []).reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
              <button 
                key={emoji} 
                onClick={() => handleToggleReaction(emoji)} 
                className={`text-sm px-2 py-0.5 rounded-full shadow-sm transition-transform hover:scale-110 active:scale-95
                  ${isOwn 
                    ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                {emoji} <span className="text-xs font-medium ml-0.5">{count}</span>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1 gap-4">
          <p className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
            {formatTimestamp(message.createdAt)}
          </p>
          
          {isOwn && (
            <div className={`flex items-center ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
              {message.status === 'sending' && (
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {message.status === 'sent' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
              {message.status === 'delivered' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-3 h-3" viewBox="0 0 16 16">
                  <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992a.252.252 0 0 1 .02-.022zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486-.943 1.179z"/>
                </svg>
              )}
              {message.status === 'read' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-3 h-3 text-blue-300" viewBox="0 0 16 16">
                  <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992a.252.252 0 0 1 .02-.022zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486-.943 1.179z"/>
                </svg>
              )}
            </div>
          )}
        </div>
        <div className="mt-1.5 -mb-1 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity relative">
          <button className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => onReply?.(message)}>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M7.28 7.72a.75.75 0 010 1.06l-2.47 2.47H14a.75.75 0 010 1.5H4.81l2.47 2.47a.75.75 0 11-1.06 1.06l-3.75-3.75a.75.75 0 010-1.06l3.75-3.75a.75.75 0 011.06 0z" clipRule="evenodd" />
              </svg>
              Reply
            </span>
          </button>
          <button className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => setShowPicker((s) => !s)}>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
              React
            </span>
          </button>
          {isOwn && <button className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={async () => {
            const newText = await showInputToast('Edit message', { initialValue: message.content || '' });
            if (newText != null) onEdit?.(message, newText);
          }}>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
              Edit
            </span>
          </button>}
          <button className="text-xs px-2 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600" onClick={async () => {
            let scope = 'me';
            if (isOwn) {
              const choice = await showChoiceToast('Delete message for…', [
                { label: 'Me only', value: 'me' },
                { label: 'Everyone', value: 'everyone', className: 'bg-red-600 text-white hover:bg-red-700' },
              ]);
              scope = choice || 'me';
            }
            onDelete?.(message, scope);
          }}>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
              Delete
            </span>
          </button>
          <button className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => navigator.clipboard.writeText(message.content || '')}>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm2 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0 3.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
              Copy
            </span>
          </button>

          {showPicker && (
            <div 
              className="absolute -top-12 left-0 bg-white border rounded-xl shadow-lg p-2 flex gap-1.5 z-10 animate-fade-in" 
              onMouseLeave={() => setShowPicker(false)}
            >
              {EMOJI_SET.map(em => (
                <button 
                  key={em} 
                  className="w-8 h-8 text-xl flex items-center justify-center rounded-full hover:bg-gray-100 transition-all hover:scale-110 active:scale-95" 
                  onClick={() => { 
                    handleToggleReaction(em); 
                    setShowPicker(false); 
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessagesArea = ({ selectedConversation, messages = [], loading = false, currentUser, typingUsers = [], onReply, onEdit, onDelete, firstUnreadId, onLoadMore, highlightTerm, jumpToMessageId }) => {
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const prevConvIdRef = useRef(null);
  const forceScrollRef = useRef(false);
  const virtuosoRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const idx = Math.max(0, (messages?.length || 1) - 1);
    if (virtuosoRef.current && typeof virtuosoRef.current.scrollToIndex === 'function') {
      try {
        virtuosoRef.current.scrollToIndex({ index: idx, align: 'end', behavior });
      } catch (_) { /* no-op */ }
    }
  }, [messages]);

  useEffect(() => {
    // Auto-scroll on new messages if user is at bottom; otherwise show New badge
    if (forceScrollRef.current) return; // handled by convo switch effect
    if (atBottom) {
      scrollToBottom('auto');
      setShowNewBadge(false);
    } else {
      setShowNewBadge(true);
    }
  }, [messages]);

  // Jump to a specific message id if requested
  useEffect(() => {
    if (!jumpToMessageId) return;
    const targetIndex = messages.findIndex((m) => (m._id || m.id) === jumpToMessageId);
    if (targetIndex >= 0 && virtuosoRef.current) {
      // Scroll to item index and center it
      try {
        virtuosoRef.current.scrollToIndex({ index: targetIndex, align: 'center', behavior: 'smooth' });
      } catch (_) {
        // ignore
      }
    }
  }, [jumpToMessageId, messages]);

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
      setAtBottom(true);
      forceScrollRef.current = false;
    }
  }, [loading, messages]);

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
    <div className="flex-1 min-h-0 min-w-0 flex flex-col relative">
      <Virtuoso
        ref={virtuosoRef}
        className="messages-scroll-container overflow-x-hidden"
        style={{ height: '100%' }}
        data={messages}
        totalCount={messages.length}
        startReached={() => { if (typeof onLoadMore === 'function') onLoadMore(); }}
        atBottomStateChange={(isBottom) => { setAtBottom(isBottom); setShowScrollDown(!isBottom); if (isBottom) setShowNewBadge(false); }}
        followOutput={atBottom ? 'smooth' : false}
        atBottomThreshold={200}
        itemContent={(index, message) => {
          const prevMessage = messages[index - 1];
          const nextMessage = messages[index + 1];
          const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
          const senderId = (typeof message.sender === 'string' ? message.sender : message.sender?._id) || '';
          const isOwn = (senderId.toString() === currentUserId) || message.isOwn;
          const showAvatar = !prevMessage || !sameSender(prevMessage, message);
          const firstOfDay = !prevMessage || !isSameDay(prevMessage?.createdAt, message.createdAt);
          const isFirstInGroup = !prevMessage || !sameSender(prevMessage, message) || !isSameDay(prevMessage?.createdAt, message.createdAt);
          const isFirstUnread = firstUnreadId && (message._id === firstUnreadId || message.id === firstUnreadId);
          return (
            <div key={message._id || message.id || index} data-mid={message._id || message.id} className="px-6 space-y-2">
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
                    const el = document.querySelector(`[data-mid="${mid}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  highlightTerm={highlightTerm}
                />
              </div>
            </div>
          );
        }}
      />

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
  onDelete: PropTypes.func,
  onJump: PropTypes.func,
  highlightTerm: PropTypes.string
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
  firstUnreadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  highlightTerm: PropTypes.string
};

export default MessagesArea;
