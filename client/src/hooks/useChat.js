import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import apiService from '../services/api';
import { showError } from '../utils/toast';

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages for conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await apiService.getMessages(conversationId);
        if (response.success) {
          setMessages(response.data.messages || []);
        } else {
          showError('Failed to load messages');
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation room
    socket.emit('joinConversation', conversationId);

    // Listen for new messages
    const handleNewMessage = (messageData) => {
      if (messageData.conversationId === conversationId) {
        setMessages(prev => [...prev, messageData]);
        setTimeout(scrollToBottom, 100);
      }
    };

    // Listen for typing events
    const handleUserTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const filtered = prev.filter(user => user.userId !== data.userId);
          return [...filtered, data];
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    };

    socket.on('message', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.emit('leaveConversation', conversationId);
    };
  }, [socket, conversationId]);

  // Send message function
  const sendMessage = useCallback(async (content, messageType = 'text', replyTo = null) => {
    if (!content.trim() || !conversationId || !isConnected) return false;

    try {
      setSendingMessage(true);
      
      const messageData = {
        conversationId,
        content: content.trim(),
        type: messageType,
        replyTo
      };

      const response = await apiService.sendMessage(messageData);
      
      if (response.success) {
        // Emit to socket for real-time delivery
        if (socket) {
          socket.emit('sendMessage', {
            ...messageData,
            _id: response.data._id,
            createdAt: response.data.createdAt
          });
        }
        return true;
      } else {
        showError('Failed to send message');
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [conversationId, isConnected, socket]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!socket || !conversationId) return;
    
    socket.emit('typing', { conversationId });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, conversationId]);

  const stopTyping = useCallback(() => {
    if (!socket || !conversationId) return;
    
    socket.emit('stopTyping', { conversationId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, conversationId]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Auto scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return {
    messages,
    loading,
    sendingMessage,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    messagesEndRef,
    scrollToBottom
  };
};

export default useChat;
