// Export all models from a single file for easy importing
const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');

module.exports = {
  User,
  Conversation,
  Message
};
