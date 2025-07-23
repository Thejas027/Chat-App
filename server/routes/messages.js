const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  updateMessageStatus,
  deleteMessage,
  searchMessages
} = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { validateSendMessage, checkValidation } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/messages/:conversationId - Get messages for a conversation
router.get('/:conversationId', getMessages);

// POST /api/messages - Send a new message
router.post('/', validateSendMessage, checkValidation, sendMessage);

// PUT /api/messages/:messageId/status - Update message status (delivered/read)
router.put('/:messageId/status', updateMessageStatus);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', deleteMessage);

// GET /api/messages/:conversationId/search - Search messages in conversation
router.get('/:conversationId/search', searchMessages);

module.exports = router;
