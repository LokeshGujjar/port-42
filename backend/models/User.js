// 👤 User Model
// Defines the structure for user accounts in our cyberpunk platform

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Profile information
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  avatar: {
    type: String,
    default: null // URL to avatar image
  },
  
  // User stats and activity
  reputation: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalUpvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalDownvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  resourcesSubmitted: {
    type: Number,
    default: 0,
    min: 0
  },
  
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Communities the user follows
  followedCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  
  // User preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['dark', 'matrix', 'cyberpunk'],
      default: 'cyberpunk'
    },
    showEmail: {
      type: Boolean,
      default: false
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isModerator: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔒 Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔍 Method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 📊 Virtual for calculating user level based on reputation
userSchema.virtual('level').get(function() {
  if (this.reputation < 100) return 'Newbie';
  if (this.reputation < 500) return 'Apprentice';
  if (this.reputation < 1000) return 'Hacker';
  if (this.reputation < 5000) return 'Elite';
  return 'Legend';
});

// 🎯 Virtual for upvote ratio
userSchema.virtual('upvoteRatio').get(function() {
  const total = this.totalUpvotes + this.totalDownvotes;
  if (total === 0) return 0;
  return Math.round((this.totalUpvotes / total) * 100);
});

// 📝 Indexes for faster queries
userSchema.index({ username: 1 }, { unique: true }); // Username lookup
userSchema.index({ email: 1 }, { unique: true }); // Email lookup
userSchema.index({ reputation: -1 }); // Leaderboard
userSchema.index({ createdAt: -1 }); // Recent users
userSchema.index({ isActive: 1, reputation: -1 }); // Active users by reputation
userSchema.index({ followedCommunities: 1 }); // Community membership
userSchema.index({ 'preferences.theme': 1 }); // Theme statistics

// Export the model
module.exports = mongoose.model('User', userSchema);
