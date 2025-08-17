import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../components/ui';
import { showError } from '../../../utils/toast';
import { filesAPI, usersAPI } from '../../../services/api';

const MessageInput = ({ onSendMessage, disabled = false, onStartTyping, onStopTyping, replyTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const avatarInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && selectedFiles.length === 0) || disabled) {
      return;
    }

    try {
      setIsUploading(true);
      await onSendMessage(message.trim(), selectedFiles);
  setMessage('');
      setSelectedFiles([]);
  onStopTyping?.();
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChangeMessage = (e) => {
    setMessage(e.target.value);
    onStartTyping?.();
  };

  // Auto-grow textarea height up to a cap
  const textAreaRef = useRef(null);
  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 160; // px
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
  }, [message]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        showError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    e.target.value = ''; // Reset input
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleEmojiPick = (emoji) => {
    setMessage((m) => `${m}${emoji}`);
    setShowEmojis(false);
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await filesAPI.uploadFile(file, 'avatar'); // fallback route will ignore conversationId
      // Prefer dedicated avatar endpoint if available
    } catch {}
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {replyTo && (
        <div className="mb-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 flex items-start gap-2">
          <div className="w-1.5 rounded bg-blue-500 h-6 mt-1" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-600">Replying to {replyTo.sender?.fullName || 'message'}</div>
            {(replyTo.content || replyTo.attachment?.filename) ? (
              <div className="text-sm text-gray-800 truncate max-w-[420px]">{replyTo.content || replyTo.attachment?.filename}</div>
            ) : null}
          </div>
          <button onClick={onCancelReply} className="text-gray-500 hover:text-gray-700" aria-label="Cancel reply">×</button>
        </div>
      )}
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            file.type?.startsWith('image/') ? (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden shadow-sm">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-white shadow"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ) : (
              <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate max-w-32" title={file.name}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </div>
            )
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={disabled || selectedFiles.length >= 5}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file (max 5 files, 10MB each)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textAreaRef}
            value={message}
            onChange={handleChangeMessage}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || isUploading}
            rows={1}
            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all duration-200 placeholder-gray-500 disabled:opacity-50"
            style={{ 
              minHeight: '48px',
              maxHeight: '120px'
            }}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowEmojis((s) => !s)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
            title="Add emoji"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {showEmojis && (
            <div className="absolute bottom-14 right-0 bg-white border border-gray-200 rounded-xl p-2 shadow-lg grid grid-cols-8 gap-1 text-xl max-w-xs">
              {['😀','😁','😂','🤣','😊','😍','😎','🤩','😘','😉','😇','🥳','🤔','😴','😜','👍','🙏','👏','🔥','❤️'].map((e) => (
                <button key={e} type="button" onClick={() => handleEmojiPick(e)} className="hover:scale-110 transition-transform">
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={(!message.trim() && selectedFiles.length === 0) || disabled || isUploading}
          className="px-6 py-3 rounded-full"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </form>

  {/* Hidden Avatar Input (placeholder for profile UI trigger) */}
  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
    </div>
  );
};

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default MessageInput;
