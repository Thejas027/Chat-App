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

  if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Get messages with pagination
  const messages = await Message.find({ conversation: conversationId, deletedFor: { $ne: req.user._id } })
      .populate('sender', 'fullName email avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 }) // Latest first
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    // Compute firstUnreadId for this page (oldest unread message sent by others)
    const me = req.user._id.toString();
    let firstUnreadId = null;
    let lastReadAt = null;
    for (const m of messages) {
      // Track latest readAt we can see on this page for current user
      const myRead = (m.readBy || []).find(r => (r.user?.toString ? r.user.toString() : r.user) === me);
      if (myRead && myRead.readAt) {
        const d = new Date(myRead.readAt);
        if (!lastReadAt || d > lastReadAt) lastReadAt = d;
      }
      // Find first unread from others
      const senderId = (typeof m.sender === 'object' ? m.sender?._id : m.sender) || '';
      const isFromMe = senderId && senderId.toString() === me;
      const hasRead = Array.isArray(m.readBy) && m.readBy.some(r => (r.user?.toString ? r.user.toString() : r.user) === me);
      if (!firstUnreadId && !isFromMe && !hasRead) {
        firstUnreadId = m._id;
      }
    }

    // Get total count for pagination
  const totalMessages = await Message.countDocuments({ conversation: conversationId });

    res.json({
      success: true,
      data: {
        messages,
        firstUnreadId: firstUnreadId || null,
        lastReadAt: lastReadAt || null,
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

  const { conversationId, content, type = 'text', replyTo, attachment } = req.body;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

  if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
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

    // If an attachment is included, attach it and infer type if needed
    if (attachment && (attachment.url || attachment.path)) {
      message.attachment = {
        url: attachment.url || attachment.path,
        filename: attachment.filename || attachment.originalName,
        size: attachment.size,
        mimetype: attachment.mimetype || attachment.mimeType,
      };
      if (!content || content.trim() === '') {
        // Derive type from mimetype
        const mt = message.attachment.mimetype || '';
        if (mt.startsWith('image/')) message.type = 'image';
        else if (mt.startsWith('video/')) message.type = 'video';
        else if (mt.startsWith('audio/')) message.type = 'audio';
        else message.type = 'file';
      }
    }

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
        attachment: message.attachment,
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
      if (!message.readBy.some(r => r.user.toString() === req.user._id.toString())) {
        message.readBy.push({ user: req.user._id, readAt: new Date() });
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
      if (global.socketManager) {
        global.socketManager.io.to(`conversation_${message.conversation}`).to(req.user._id.toString()).emit('message_deleted_for_me', {
          messageId: message._id,
          deletedBy: req.user._id,
          deleteFor: 'me'
        });
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
    const { query: queryParam, q, page = 1, limit = 20 } = req.query;
    const query = (typeof queryParam === 'string' && queryParam) || (typeof q === 'string' && q) || '';

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
  searchMessages,
  addReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      if (!emoji || typeof emoji !== 'string') {
        return res.status(400).json({ success: false, message: 'emoji is required' });
      }

      const message = await Message.findById(messageId).populate('sender', 'fullName avatar');
      if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

      // Ensure requester is participant in the conversation
      const conversation = await Conversation.findById(message.conversation);
      if (!conversation || !conversation.participants.some(p => p.toString() === req.user._id.toString())) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Single reaction per user: replace existing
      message.reactions = (message.reactions || []).filter(r => r.user.toString() !== req.user._id.toString());
      message.reactions.push({ user: req.user._id, emoji, createdAt: new Date() });
      await message.save();

      // Broadcast update
      if (global.socketManager) {
        global.socketManager.io
          .to(`conversation_${message.conversation}`)
          .emit('message_reaction_updated', { messageId: message._id, reactions: message.reactions });
      }

      res.json({ success: true, message: 'Reaction added', data: { messageId: message._id, reactions: message.reactions } });
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to add reaction' });
    }
  },
  removeReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const message = await Message.findById(messageId);
      if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

      const conversation = await Conversation.findById(message.conversation);
      if (!conversation || !conversation.participants.some(p => p.toString() === req.user._id.toString())) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const before = (message.reactions || []).length;
      message.reactions = (message.reactions || []).filter(r => r.user.toString() !== req.user._id.toString());
      if (message.reactions.length !== before) {
        await message.save();
        if (global.socketManager) {
          global.socketManager.io
            .to(`conversation_${message.conversation}`)
            .emit('message_reaction_updated', { messageId: message._id, reactions: message.reactions });
        }
      }

      res.json({ success: true, message: 'Reaction removed', data: { messageId: message._id, reactions: message.reactions } });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove reaction' });
    }
  }
};
