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

module.exports = router;
