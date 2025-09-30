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
        <div className="mb-3 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 shadow-sm animate-fade-in">
          <div className="w-1 rounded-full bg-blue-400 h-full self-stretch" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-blue-700 flex items-center gap-1.5 mb-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524.576.096 1.064.587 1.107 1.168.12 1.608.12 3.008 0 4.616-.043.58-.53 1.072-1.107 1.168a41.16 41.16 0 01-3.57.414c-.28 1.175-.866 2.248-1.667 3.11A41.51 41.51 0 0110 14c-1.032 0-2.055-.07-3.07-.208-.933-.206-1.696-.98-1.878-1.919a41 41 0 01-.732-5.203.977.977 0 01.075-.76c.195-.362.545-.59.935-.59h.613a4.58 4.58 0 01-.7-.684c-.484-.648-.734-1.341-.884-1.72a.75.75 0 01.317-.906A41.36 41.36 0 0110 2.071c1.443 0 2.873.106 4.287.318a.75.75 0 01.317.906c-.15.379-.4 1.072-.884 1.72a4.583 4.583 0 01-.631.592h.613c.39 0 .74.229.935.591a.977.977 0 01.075.76 41 41 0 01-.173 1.77c-.134.77.378 1.5 1.104 1.863a.75.75 0 01-.154 1.36 41.65 41.65 0 01-7.94.317.75.75 0 01-.022-1.499 24.534 24.534 0 003.355-.317.177.177 0 00.035-.01 2.08 2.08 0 01-.035-.01c-.855-.182-1.57-.969-1.58-1.837a41.74 41.74 0 01.146-3.001c.011-.143.008-.291.008-.442 0-.148.003-.298-.01-.442-.323.026-.65.046-.977.063a5.555 5.555 0 01-.398-.591 2.01 2.01 0 00-.91.099 41.426 41.426 0 01-.474 2.774.75.75 0 01-.595.58c-1.574.311-2.455.478-3.288.478-.833 0-1.714-.167-3.288-.478a.75.75 0 01-.595-.58 41.429 41.429 0 01-.474-2.774A2.01 2.01 0 01.328 6.06a5.555 5.555 0 01-.398.591 38.562 38.562 0 01-.977-.062c-.013.144-.01.294-.01.442 0 .15-.003.3.008.442a41.74 41.74 0 01.146 3.001c-.01.868-.725 1.655-1.58 1.837-.012.002-.023.006-.035.01.012.004.023.008.035.01a24.534 24.534 0 003.355.317.75.75 0 01-.022 1.499 41.65 41.65 0 01-7.94-.317.75.75 0 01-.154-1.36c.726-.362 1.24-1.092 1.104-1.862a41 41 0 01-.173-1.771.977.977 0 01.075-.76c.195-.362.545-.59.935-.59h.613a4.58 4.58 0 01-.631-.592c-.484-.648-.734-1.341-.884-1.72a.75.75 0 01.317-.906A41.36 41.36 0 015.712 2.07c.298.008.717.022 1.293.022a.75.75 0 110 1.5c-.682 0-1.18-.018-1.59-.028zm6.437 3.568a10.54 10.54 0 01-.665.429 3.25 3.25 0 001.898 1.898.75.75 0 01.437.695.75.75 0 01-.429.665 10.55 10.55 0 00-2.566 2.567.75.75 0 01-.665.429.75.75 0 01-.695-.437 3.25 3.25 0 00-1.898-1.898.75.75 0 01-.437-.695.75.75 0 01.429-.665 10.55 10.55 0 002.566-2.567.75.75 0 01.665-.429.75.75 0 01.695.437zM15.75 9a.75.75 0 01.695.437 3.25 3.25 0 001.898 1.898.75.75 0 01.437.695.75.75 0 01-.429.665 10.55 10.55 0 00-2.566 2.567.75.75 0 01-.665.429.75.75 0 01-.695-.437 3.25 3.25 0 00-1.898-1.898.75.75 0 01-.437-.695.75.75 0 01.429-.665 10.55 10.55 0 002.566-2.567.75.75 0 01.665-.429z" clipRule="evenodd" />
              </svg>
              Replying to {replyTo.sender?.fullName || 'message'}
            </div>
            {(replyTo.content || replyTo.attachment?.filename) ? (
              <div className="text-sm text-gray-600 truncate max-w-[420px]">{replyTo.content || replyTo.attachment?.filename}</div>
            ) : null}
          </div>
          <button 
            onClick={onCancelReply} 
            className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-full transition-colors" 
            aria-label="Cancel reply"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            file.type?.startsWith('image/') ? (
              <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-fade-in group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                  <span className="text-white text-xs truncate max-w-full px-1">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div key={index} className="flex items-center bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm shadow-sm animate-fade-in hover:bg-blue-100 transition-colors">
                <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
                  {file.type?.includes('pdf') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
                      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                  ) : file.type?.includes('doc') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
                      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                  )}
                </div>
                <span className="truncate max-w-48" title={file.name}>{file.name}</span>
                <span className="ml-1.5 text-xs text-blue-600/80">({Math.round(file.size / 1024)} KB)</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 pl-3">
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
          className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file (max 5 files, 10MB each)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none transition-all duration-200 placeholder-gray-500 disabled:opacity-50"
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-amber-500 rounded-full hover:bg-amber-50 transition-colors duration-200 disabled:opacity-50"
            title="Add emoji"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" clipRule="evenodd" />
            </svg>
          </button>

          {showEmojis && (
            <div className="absolute bottom-14 right-0 bg-white border border-gray-200 rounded-xl p-3 shadow-lg grid grid-cols-8 gap-1.5 text-xl max-w-xs animate-fade-in z-10">
              {['😀','😁','😂','🤣','😊','😍','😎','🤩','😘','😉','😇','🥳','🤔','😴','😜','👍','🙏','👏','🔥','❤️','✨','🎉','👌','😢','😭','😅','🙌','💯'].map((e) => (
                <button 
                  key={e} 
                  type="button" 
                  onClick={() => handleEmojiPick(e)} 
                  className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!message.trim() && selectedFiles.length === 0) || disabled || isUploading}
          className={`p-3 rounded-full ${
            (!message.trim() && selectedFiles.length === 0) || disabled || isUploading 
              ? 'bg-gray-100 text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          } transition-colors flex-shrink-0 shadow-sm`}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
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
