// 💬 Comment Model
// Defines the comment/chat system for each resource

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Comment content
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  
  // What this comment is attached to
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  
  // Who wrote this comment
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Reply system (nested comments)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  
  // Comment depth (for UI nesting limits)
  depth: {
    type: Number,
    default: 0,
    min: 0,
    max: 5 // Limit nesting to 5 levels
  },
  
  // Voting on comments
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  downvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Track who voted on this comment
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['up', 'down']
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comment moderation
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  
  isReported: {
    type: Boolean,
    default: false
  },
  
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'off-topic', 'other'],
      required: true
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Pinned comments (by moderators)
  isPinned: {
    type: Boolean,
    default: false
  },
  
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  pinnedAt: Date,
  
  // Comment metadata
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  }],
  
  // For real-time features
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 📊 Virtual for comment score
commentSchema.virtual('score').get(function() {
  return this.upvotes - this.downvotes;
});

// 🕒 Virtual for time since posted (human readable)
commentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
});

// 📝 Method to vote on comment
commentSchema.methods.vote = function(userId, voteType) {
  // Remove existing vote from this user
  this.voters = this.voters.filter(voter => !voter.user.equals(userId));
  
  // Add new vote
  if (voteType === 'up') {
    this.upvotes += 1;
    this.voters.push({ user: userId, vote: 'up' });
  } else if (voteType === 'down') {
    this.downvotes += 1;
    this.voters.push({ user: userId, vote: 'down' });
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// 📝 Method to edit comment
commentSchema.methods.editContent = function(newContent, userId) {
  // Save edit history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
  this.lastActivity = new Date();
  
  return this.save();
};

// 📝 Method to soft delete comment
commentSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[deleted]';
  
  return this.save();
};

// 🔍 Pre-save middleware to calculate depth for nested comments
commentSchema.pre('save', async function(next) {
  if (this.isNew && this.parentComment) {
    try {
      const parent = await this.constructor.findById(this.parentComment);
      if (parent) {
        this.depth = Math.min(parent.depth + 1, 5); // Max depth of 5
        
        // Add this comment to parent's replies
        parent.replies.push(this._id);
        await parent.save();
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// 🔍 Indexes for better performance
commentSchema.index({ resource: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ upvotes: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ isDeleted: 1, isPinned: -1 });

module.exports = mongoose.model('Comment', commentSchema);
