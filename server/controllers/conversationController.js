const { Conversation, Message, User } = require('../models');
const { validationResult } = require('express-validator');

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'fullName email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'fullName'
        }
      })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Add unread message count and conversation info
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          readBy: { $not: { $elemMatch: { user: req.user._id } } }
        });

        // Get conversation name and avatar
        let conversationName = '';
        let conversationAvatar = '';
        
        if (conversation.type === 'private') {
          // For private chats, use the other participant's info
          const otherParticipant = conversation.participants.find(
            p => p._id.toString() !== req.user._id.toString()
          );
          conversationName = otherParticipant?.fullName || 'Unknown User';
          conversationAvatar = otherParticipant?.avatar || '';
        } else {
          // For group chats, use group name
          conversationName = conversation.name || 'Group Chat';
          conversationAvatar = conversation.avatar || '';
        }

        return {
          ...conversation,
          unreadCount,
          displayName: conversationName,
          displayAvatar: conversationAvatar
        };
      })
    );

    const totalConversations = await Conversation.countDocuments({
      participants: req.user._id
    });

    res.json({
      success: true,
      data: {
        conversations: conversationsWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalConversations / limit),
          totalConversations,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

// Get a specific conversation
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'fullName email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'fullName'
        }
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

  // Add display info
    let displayName = '';
    let displayAvatar = '';
    
    if (conversation.type === 'private') {
      const otherParticipant = conversation.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );
      displayName = otherParticipant?.fullName || 'Unknown User';
      displayAvatar = otherParticipant?.avatar || '';
    } else {
      displayName = conversation.name || 'Group Chat';
      displayAvatar = conversation.avatar || '';
    }

    // Compute unread count for this conversation
    const unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: req.user._id },
      readBy: { $not: { $elemMatch: { user: req.user._id } } }
    });

    res.json({
      success: true,
      data: {
        ...conversation.toObject(),
        displayName,
        displayAvatar,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
};

// Create a new conversation (private chat)
const createPrivateConversation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => error.msg)
      });
    }

    const { participantId } = req.body;

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists between these users
    const existingConversation = await Conversation.findOne({
      type: 'private',
      participants: {
        $all: [req.user._id, participantId],
        $size: 2
      }
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: existingConversation
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.user._id, participantId],
      type: 'private'
    });

    await conversation.save();

    // Populate participants for response
    await conversation.populate('participants', 'fullName email avatar isOnline lastSeen');

    res.status(201).json({
      success: true,
      message: 'Private conversation created successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Create private conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

// Create a group conversation
const createGroupConversation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => error.msg)
      });
    }

    const { name, description, participantIds } = req.body;

    // Validate participants
    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 participants are required for a group'
      });
    }

    // Check if all participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    // Add creator to participants if not already included
    const allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];

    // Create group conversation
    const conversation = new Conversation({
      name,
      description,
      participants: allParticipants,
      type: 'group',
      admin: req.user._id,
      createdBy: req.user._id
    });

    await conversation.save();

    // Populate participants for response
    await conversation.populate('participants', 'fullName email avatar isOnline lastSeen');
    await conversation.populate('admin', 'fullName email');
    await conversation.populate('createdBy', 'fullName email');

    // Notify all participants via socket
    if (global.socketManager) {
      allParticipants.forEach(participantId => {
        if (participantId !== req.user._id.toString()) {
          global.socketManager.sendToUser(participantId, 'new_group_created', {
            conversation,
            createdBy: req.user
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Group conversation created successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Create group conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group conversation'
    });
  }
};

// Update group conversation
const updateGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name, description } = req.body;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if it's a group and user is admin
    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Only group conversations can be updated'
      });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update conversation details'
      });
    }

    // Update conversation
    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    conversation.updatedAt = new Date();

    await conversation.save();

    // Notify all participants
    if (global.socketManager) {
      global.socketManager.io.to(`conversation_${conversationId}`).emit('group_updated', {
        conversationId,
        updates: { name, description },
        updatedBy: req.user
      });
    }

    res.json({
      success: true,
      message: 'Group conversation updated successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Update group conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group conversation'
    });
  }
};

// Add participant to group
const addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { participantId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if it's a group and user is admin
    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Can only add participants to group conversations'
      });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can add participants'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a participant
    if (conversation.participants.includes(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant'
      });
    }

    // Add participant
    conversation.participants.push(participantId);
    await conversation.save();

    // Notify all participants
    if (global.socketManager) {
      global.socketManager.io.to(`conversation_${conversationId}`).emit('participant_added', {
        conversationId,
        newParticipant: participant,
        addedBy: req.user
      });

      // Notify the new participant
      global.socketManager.sendToUser(participantId, 'added_to_group', {
        conversation,
        addedBy: req.user
      });
    }

    res.json({
      success: true,
      message: 'Participant added successfully'
    });

  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant'
    });
  }
};

// Remove participant from group
const removeParticipant = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if it's a group and user is admin
    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Can only remove participants from group conversations'
      });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can remove participants'
      });
    }

    // Can't remove admin
    if (participantId === conversation.admin.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group admin'
      });
    }

    // Remove participant
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== participantId
    );
    await conversation.save();

    // Notify all participants
    if (global.socketManager) {
      global.socketManager.io.to(`conversation_${conversationId}`).emit('participant_removed', {
        conversationId,
        removedParticipantId: participantId,
        removedBy: req.user
      });

      // Notify the removed participant
      global.socketManager.sendToUser(participantId, 'removed_from_group', {
        conversation,
        removedBy: req.user
      });
    }

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant'
    });
  }
};

// Leave conversation
const leaveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    if (conversation.type === 'private') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave private conversations'
      });
    }

    // If user is admin, need to transfer admin or delete group
    if (conversation.admin.toString() === req.user._id.toString()) {
      if (conversation.participants.length > 1) {
        // Transfer admin to next participant
        const newAdmin = conversation.participants.find(
          p => p.toString() !== req.user._id.toString()
        );
        conversation.admin = newAdmin;
      } else {
        // Delete conversation if only admin left
        await Conversation.findByIdAndDelete(conversationId);
        await Message.deleteMany({ conversation: conversationId });
        
        return res.json({
          success: true,
          message: 'Conversation deleted as you were the last member'
        });
      }
    }

    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );
    await conversation.save();

    // Notify other participants
    if (global.socketManager) {
      global.socketManager.io.to(`conversation_${conversationId}`).emit('participant_left', {
        conversationId,
        leftParticipant: req.user,
        newAdmin: conversation.admin !== req.user._id ? conversation.admin : null
      });
    }

    res.json({
      success: true,
      message: 'Left conversation successfully'
    });

  } catch (error) {
    console.error('Leave conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave conversation'
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
const getMessagesForConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'fullName email avatar')
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if the user is a participant of the conversation
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get messages for the conversation
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'fullName avatar')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Mark messages as read by the user (only those not yet marked)
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readBy: { $not: { $elemMatch: { user: req.user._id } } }
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
        $set: { status: 'read' }
      }
    );

    res.json({
      success: true,
      data: {
        messages,
        conversation,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(await Message.countDocuments({ conversation: conversationId }) / limit),
          totalMessages: await Message.countDocuments({ conversation: conversationId }),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Find or create a conversation with another user
// @route   POST /api/conversations/findOrCreate
// @access  Private
const findOrCreateConversation = async (req, res) => {
  const { recipientId } = req.body;
  const userId = req.user.id;

  if (!recipientId) {
    return res.status(400).json({ message: 'Recipient ID is required' });
  }

  try {
    // Find an existing private conversation between the two users
    const ids = [userId.toString(), recipientId.toString()].sort();
    const participantsKey = ids.join(':');

    let conversation = await Conversation.findOne({
      type: 'private',
      participantsKey,
    })
      .populate('participants', '-password')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'fullName avatar' },
      });

    // If no conversation exists, create a new one
    if (!conversation) {
      // Upsert pattern to avoid race duplicates
      await Conversation.updateOne(
        { type: 'private', participantsKey },
        { 
          $setOnInsert: {
            participants: [userId, recipientId],
            type: 'private',
            participantsKey
          }
        },
        { upsert: true }
      );
      conversation = await Conversation.findOne({ type: 'private', participantsKey })
        .populate('participants', '-password')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'fullName avatar' }
        });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error finding or creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getConversations,
  getConversation,
  createPrivateConversation,
  createGroupConversation,
  updateGroupConversation,
  addParticipant,
  removeParticipant,
  leaveConversation,
  getMessagesForConversation,
  findOrCreateConversation
};
