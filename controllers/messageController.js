const { Message, Conversation, User } = require('../models');
const { validationResult } = require('express-validator');

// Get all messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'fullName email avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 }) // Latest first
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ conversation: conversationId });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => error.msg)
      });
    }

    const { conversationId, content, type = 'text', replyTo } = req.body;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Create new message
    const message = new Message({
      content,
      type,
      sender: req.user._id,
      conversation: conversationId,
      replyTo: replyTo || null,
      status: 'sent'
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'fullName email avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update conversation's last message and timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    // Emit real-time event through Socket.IO
    if (global.socketManager) {
      global.socketManager.io.to(`conversation_${conversationId}`).emit('new_message', {
        _id: message._id,
        content: message.content,
        type: message.type,
        sender: message.sender,
        conversation: message.conversation,
        replyTo: message.replyTo,
        createdAt: message.createdAt,
        status: 'sent'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Update message status (delivered, read)
const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['delivered', 'read'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "delivered" or "read"'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this message'
      });
    }

    // Update message status
    if (status === 'read') {
      if (!message.readBy.includes(req.user._id)) {
        message.readBy.push(req.user._id);
      }
      message.readAt = new Date();
    }
    
    message.status = status;
    await message.save();

    // Emit real-time event
    if (global.socketManager) {
      global.socketManager.io.to(`conversation_${message.conversation}`).emit('message_status_updated', {
        messageId: message._id,
        status,
        updatedBy: req.user._id,
        readAt: message.readAt
      });
    }

    res.json({
      success: true,
      message: 'Message status updated successfully'
    });

  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor = 'me' } = req.body; // 'me' or 'everyone'

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or admin
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    if (deleteFor === 'everyone') {
      // Delete for everyone - mark as deleted
      message.isDeleted = true;
      message.content = 'This message was deleted';
      message.deletedAt = new Date();
      await message.save();

      // Emit real-time event
      if (global.socketManager) {
        global.socketManager.io.to(`conversation_${message.conversation}`).emit('message_deleted', {
          messageId: message._id,
          deletedBy: req.user._id,
          deleteFor: 'everyone'
        });
      }
    } else {
      // Delete for me only - add to deletedFor array
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// Search messages in a conversation
const searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to search this conversation'
      });
    }

    // Search messages
    const messages = await Message.find({
      conversation: conversationId,
      content: { $regex: query, $options: 'i' },
      isDeleted: false,
      deletedFor: { $ne: req.user._id }
    })
      .populate('sender', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalResults = await Message.countDocuments({
      conversation: conversationId,
      content: { $regex: query, $options: 'i' },
      isDeleted: false,
      deletedFor: { $ne: req.user._id }
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalResults / limit),
          totalResults,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  updateMessageStatus,
  deleteMessage,
  searchMessages
};
