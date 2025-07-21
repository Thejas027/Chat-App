const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Participants in the conversation
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Type of conversation
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  
  // Group conversation details (only for group chats)
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Group description cannot exceed 200 characters']
  },
  
  avatar: {
    type: String,
    default: '' // Group avatar URL
  },
  
  // Admin for group chats
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Last message reference
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// MIDDLEWARE: Update lastActivity on save
conversationSchema.pre('save', function(next) {
  if (this.isModified('lastMessage')) {
    this.lastActivity = new Date();
  }
  next();
});

// VIRTUAL: Get conversation display name
conversationSchema.virtual('displayName').get(function() {
  if (this.type === 'group') {
    return this.name || 'Unnamed Group';
  }
  // For private chats, this would be set by the controller based on the other participant
  return 'Private Chat';
});

// STATIC METHOD: Find conversations for a user
conversationSchema.statics.findForUser = function(userId) {
  return this.find({
    participants: userId
  })
  .populate('participants', 'fullName email avatar isOnline lastSeen')
  .populate('lastMessage')
  .sort({ lastActivity: -1 });
};

// STATIC METHOD: Find private conversation between two users
conversationSchema.statics.findPrivateConversation = function(user1Id, user2Id) {
  return this.findOne({
    type: 'private',
    participants: { $all: [user1Id, user2Id], $size: 2 }
  })
  .populate('participants', 'fullName email avatar isOnline lastSeen')
  .populate('lastMessage');
};

// INDEX: For better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ type: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
