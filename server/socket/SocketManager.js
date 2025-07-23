const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST"]
      }
    });

    this.connectedUsers = new Map(); // Store user_id -> socket_id mapping
    this.userSockets = new Map(); // Store socket_id -> user_info mapping
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Authenticate socket connections
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.user.fullName} connected (${socket.id})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, {
        userId: socket.userId,
        user: socket.user
      });

      // Update user's online status
      this.updateUserOnlineStatus(socket.userId, true);

      // Setup event handlers
      this.handleJoinConversation(socket);
      this.handleLeaveConversation(socket);
      this.handleSendMessage(socket);
      this.handleTyping(socket);
      this.handleMarkAsRead(socket);
      this.handleDisconnection(socket);
    });
  }

  // Handle joining a conversation room
  handleJoinConversation(socket) {
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`👥 ${socket.user.fullName} joined conversation ${conversationId}`);
      
      // Notify others in the conversation
      socket.to(`conversation_${conversationId}`).emit('user_joined_conversation', {
        user: socket.user,
        conversationId
      });
    });
  }

  // Handle leaving a conversation room
  handleLeaveConversation(socket) {
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`👋 ${socket.user.fullName} left conversation ${conversationId}`);
      
      // Notify others in the conversation
      socket.to(`conversation_${conversationId}`).emit('user_left_conversation', {
        user: socket.user,
        conversationId
      });
    });
  }

  // Handle sending messages
  handleSendMessage(socket) {
    socket.on('send_message', async (data) => {
      const { conversationId, content, type = 'text' } = data;
      
      try {
        const { Message, Conversation } = require('../models');
        
        // Validate conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId)) {
          socket.emit('message_error', { error: 'Invalid conversation or unauthorized' });
          return;
        }

        // Create and save message to database
        const message = new Message({
          content,
          type,
          sender: socket.userId,
          conversation: conversationId,
          status: 'sent'
        });

        await message.save();
        
        // Populate sender info
        await message.populate('sender', 'fullName email avatar');

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: new Date()
        });

        const messageData = {
          _id: message._id,
          content: message.content,
          type: message.type,
          sender: message.sender,
          conversation: message.conversation,
          createdAt: message.createdAt,
          status: 'sent'
        };

        // Send to all users in the conversation
        this.io.to(`conversation_${conversationId}`).emit('new_message', messageData);
        
        console.log(`💬 Message sent in conversation ${conversationId} by ${socket.user.fullName}`);
        
        // Send confirmation to sender
        socket.emit('message_sent', { messageId: message._id, status: 'sent' });
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });
  }

  // Handle typing indicators
  handleTyping(socket) {
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        user: socket.user,
        conversationId
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        user: socket.user,
        conversationId
      });
    });
  }

  // Handle mark as read
  handleMarkAsRead(socket) {
    socket.on('mark_as_read', (data) => {
      const { conversationId, messageId } = data;
      
      // Notify sender that message was read
      socket.to(`conversation_${conversationId}`).emit('message_read', {
        messageId,
        readBy: socket.user,
        conversationId
      });
    });
  }

  // Handle disconnection
  handleDisconnection(socket) {
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.user.fullName} disconnected (${socket.id})`);
      
      // Remove user from connected users
      this.connectedUsers.delete(socket.userId);
      this.userSockets.delete(socket.id);
      
      // Update user's online status
      this.updateUserOnlineStatus(socket.userId, false);
    });
  }

  // Update user online status
  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: isOnline ? new Date() : new Date()
      });

      // Broadcast online status change
      this.io.emit('user_status_changed', {
        userId,
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }
}

module.exports = SocketManager;
