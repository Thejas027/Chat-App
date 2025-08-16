import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { conversationsAPI } from '../services/api';
import { showError } from '../utils/toast';

export const useChat = (conversationId, currentUser) => {
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
        const response = await conversationsAPI.getMessages(conversationId);
        if (response.success) {
          setMessages(response.data || []);
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
    socket.emit('join_conversation', conversationId);

    // Listen for new messages
    const handleNewMessage = (messageData) => {
      if (messageData.conversation === conversationId) {
        // Add message and mark as own if from current user
        const messageWithOwnership = {
          ...messageData,
          isOwn: messageData.sender._id === currentUser?._id
        };
        setMessages(prev => [...prev, messageWithOwnership]);
        setTimeout(scrollToBottom, 100);
      }
    };

    // Listen for typing events
    const handleUserTyping = (data) => {
      if (data.conversationId === conversationId && data.userId !== currentUser?._id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(user => user.userId !== data.userId);
          return [...filtered, { ...data, timestamp: Date.now() }];
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    };

    // Listen for message status updates
    const handleMessageDelivered = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, status: 'delivered' } : msg
        ));
      }
    };

    const handleMessageRead = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, status: 'read' } : msg
        ));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.emit('leave_conversation', conversationId);
    };
  }, [socket, conversationId, currentUser]);

  // Send message function
  const sendMessage = useCallback(async (content, attachments = []) => {
    if ((!content.trim() && attachments.length === 0) || !conversationId || !isConnected) {
      return false;
    }

    try {
      setSendingMessage(true);
      
      const messageData = {
        content: content.trim(),
        conversation: conversationId,
        attachments
      };

      // Optimistically add message to UI
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: content.trim(),
        sender: currentUser,
        conversation: conversationId,
        createdAt: new Date().toISOString(),
        isOwn: true,
        status: 'sending',
        attachments
      };
      setMessages(prev => [...prev, tempMessage]);

      const response = await conversationsAPI.sendMessage(messageData);
      
      if (response.success) {
        // Remove temp message and update with real message
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessage._id 
            ? { ...response.data, isOwn: true, status: 'sent' }
            : msg
        ));

        // Emit to socket for real-time delivery
        if (socket) {
          socket.emit('send_message', {
            ...messageData,
            _id: response.data._id,
            createdAt: response.data.createdAt
          });
        }
        return true;
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
        showError('Failed to send message');
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg._id.toString().startsWith('temp-')));
      showError('Failed to send message');
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [conversationId, isConnected, socket, currentUser]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!socket || !conversationId) return;
    
    socket.emit('typing_start', { 
      conversationId,
      userId: currentUser?._id,
      userName: currentUser?.fullName
    });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, conversationId, currentUser]);

  const stopTyping = useCallback(() => {
    if (!socket || !conversationId) return;
    
    socket.emit('typing_stop', { 
      conversationId,
      userId: currentUser?._id
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, conversationId, currentUser]);

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

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    sendingMessage,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    messagesEndRef,
    scrollToBottom,
    setMessages
  };
};

export default useChat;
