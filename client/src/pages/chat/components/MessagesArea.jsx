import PropTypes from 'prop-types';
import { API_BASE_URL } from '../../../services/api';
import { useEffect, useRef, useState, useCallback } from 'react';
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
        
        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
        
        {message.attachment && (
          <div className="mt-2">
            {(() => {
              const att = message.attachment;
              const rel = att.url || att.path || att.fileUrl;
              const src = rel?.startsWith('http') ? rel : (rel ? `${API_BASE_URL}${rel}` : rel);
              const isImage = (att.mimetype || att.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(src || '');
              if (isImage && src) {
                return <img src={src} alt={att.filename || 'image'} className="max-w-[240px] rounded-md border border-black/5" />;
              }
              return (
                <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-black/10">
                  <span className="opacity-80">📎</span>
                  <a href={src} target="_blank" rel="noreferrer" className="underline">
                    {att.filename || 'attachment'}
                  </a>
                  {att.size ? <span className="opacity-60">({Math.ceil(att.size/1024)} KB)</span> : null}
                </div>
              );
            })()}
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
      </div>
    </div>
  );
};

const MessagesArea = ({ selectedConversation, messages = [], loading = false, currentUser, typingUsers = [] }) => {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

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
    }
  }, [messages, scrollToBottom]);

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
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,1) 24px, rgba(0,0,0,1) calc(100% - 24px), rgba(0,0,0,0.12))'
        }}
      >
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
            
            return (
              <div key={message._id || message.id || index}>
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
      {showScrollDown && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Scroll to latest message"
          title="Scroll to latest message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
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
