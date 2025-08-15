const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversation,
  createPrivateConversation,
  createGroupConversation,
  updateGroupConversation,
  addParticipant,
  removeParticipant,
  leaveConversation
} = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');
const {
  validateCreatePrivateConversation,
  validateCreateGroupConversation,
  validateUpdateGroupConversation,
  checkValidation
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/conversations - Get all conversations for user
router.get('/', getConversations);

// GET /api/conversations/:conversationId - Get specific conversation
router.get('/:conversationId', getConversation);

// POST /api/conversations/private - Create private conversation
router.post('/private', validateCreatePrivateConversation, checkValidation, createPrivateConversation);

// POST /api/conversations/group - Create group conversation
router.post('/group', validateCreateGroupConversation, checkValidation, createGroupConversation);

// PUT /api/conversations/:conversationId - Update group conversation
router.put('/:conversationId', validateUpdateGroupConversation, checkValidation, updateGroupConversation);

// POST /api/conversations/:conversationId/participants - Add participant to group
router.post('/:conversationId/participants', addParticipant);

// DELETE /api/conversations/:conversationId/participants/:participantId - Remove participant
router.delete('/:conversationId/participants/:participantId', removeParticipant);

// DELETE /api/conversations/:conversationId/leave - Leave conversation
router.delete('/:conversationId/leave', leaveConversation);

// PUT /api/conversations/:conversationId/read - Mark conversation as read
router.put('/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Find the conversation and verify user is a participant
    const conversation = await require('../models/Conversation').findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark all messages in this conversation as read for the current user
    await require('../models/Message').updateMany(
      { 
        conversation: conversationId, 
        sender: { $ne: userId },
        readBy: { $not: { $elemMatch: { user: userId } } }
      },
      { 
        $push: { 
          readBy: { 
            user: userId, 
            readAt: new Date() 
          } 
        } 
      }
    );

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
