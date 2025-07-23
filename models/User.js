const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Profile information
  avatar: {
    type: String,
    default: '' // URL to user's profile picture
  },
  
  // Online status
  isOnline: {
    type: Boolean,
    default: false
  },
  
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  // Socket ID for real-time communication
  socketId: {
    type: String,
    default: ''
  }
  
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// MIDDLEWARE: Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run if password is modified (not on other updates)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// METHOD: Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// METHOD: Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// VIRTUAL: Get user's initials for avatar fallback
userSchema.virtual('initials').get(function() {
  return this.fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
});

// INDEX: For better query performance
// Email index is already created by unique: true
userSchema.index({ isOnline: 1 });

module.exports = mongoose.model('User', userSchema);
