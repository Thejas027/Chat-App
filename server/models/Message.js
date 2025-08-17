const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message content
  content: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    validate: {
      validator: function (v) {
        const hasText = (v || '').trim().length > 0;
        const hasAttachment = !!(this.attachment && (this.attachment.url || this.attachment.path));
        return hasText || hasAttachment;
      },
      message: 'Either content or attachment is required'
    }
  },
  
  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  
  // File attachment (for non-text messages)
  attachment: {
    url: String,
    filename: String,
    size: Number,
    mimetype: String
  },
  
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Conversation reference
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Read receipts (who has read this message)
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply reference (if this is a reply to another message)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Per-user delete visibility
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Edits
  isEdited: {
    type: Boolean,
    default: false
  },

  editedAt: {
    type: Date
  },
  
  deletedAt: {
    type: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// MIDDLEWARE: Update conversation's lastMessage when a new message is created
messageSchema.post('save', async function() {
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(this.conversation, {
      lastMessage: this._id,
      lastActivity: this.createdAt
    });
  } catch (error) {
    console.error('Error updating conversation lastMessage:', error);
  }
});

// VIRTUAL: Check if message is from today
messageSchema.virtual('isToday').get(function() {
  const today = new Date();
  const messageDate = this.createdAt;
  return today.toDateString() === messageDate.toDateString();
});

// VIRTUAL: Get formatted time
messageSchema.virtual('timeFormatted').get(function() {
  return this.createdAt.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

// METHOD: Mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
  // Check if user already read this message
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.status = 'read';
  }
  
  return this.save();
};

// METHOD: Add reaction to message
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji
  });
  
  return this.save();
};

// METHOD: Remove reaction from message
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// STATIC METHOD: Get messages for a conversation with pagination
messageSchema.statics.getConversationMessages = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    conversation: conversationId,
    isDeleted: false
  })
  .populate('sender', 'fullName avatar')
  .populate('replyTo', 'content sender')
  .populate('reactions.user', 'fullName')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// INDEX: For better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
