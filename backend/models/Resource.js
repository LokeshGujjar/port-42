// 🔗 Resource Model
// Defines learning resources (links, tools, tutorials) shared by users

const mongoose = require('mongoose');
const validator = require('validator');

const resourceSchema = new mongoose.Schema({
  // Basic resource information
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  url: {
    type: String,
    required: [true, 'Resource URL is required'],
    validate: [validator.isURL, 'Please provide a valid URL'],
    trim: true
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  
  // Resource categorization
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Resource must belong to a community']
  },
  
  type: {
    type: String,
    enum: ['article', 'video', 'course', 'tool', 'documentation', 'tutorial', 'book', 'podcast', 'other'],
    default: 'article'
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  
  // Tags for better discoverability
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Metadata extracted from URL
  metadata: {
    title: String, // Title from webpage
    description: String, // Meta description
    image: String, // Featured image URL
    siteName: String, // Website name
    author: String, // Content author
    publishDate: Date // Publication date
  },
  
  // User who submitted this resource
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Voting system
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
  
  // Track who voted to prevent duplicate votes
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
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  clicks: {
    type: Number,
    default: 0,
    min: 0
  },
  
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Quality indicators
  isVerified: {
    type: Boolean,
    default: false // Verified by moderators
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Content flags
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
      enum: ['spam', 'inappropriate', 'broken-link', 'duplicate', 'other'],
      required: true
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps for activity
  lastInteraction: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 📊 Virtual for net score (upvotes - downvotes)
resourceSchema.virtual('score').get(function() {
  return this.upvotes - this.downvotes;
});

// 🎯 Virtual for upvote ratio
resourceSchema.virtual('upvoteRatio').get(function() {
  const total = this.upvotes + this.downvotes;
  if (total === 0) return 50; // Neutral if no votes
  return Math.round((this.upvotes / total) * 100);
});

// 🔥 Virtual for popularity score (combines multiple factors)
resourceSchema.virtual('popularityScore').get(function() {
  const ageInHours = Math.max(1, (Date.now() - this.createdAt) / (1000 * 60 * 60));
  const engagementScore = this.upvotes + (this.views * 0.1) + (this.clicks * 0.5);
  return Math.round(engagementScore / Math.pow(ageInHours, 0.8));
});

// 📝 Method to add a vote
resourceSchema.methods.vote = function(userId, voteType) {
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
  
  this.lastInteraction = new Date();
  return this.save();
};

// 📝 Method to remove a vote
resourceSchema.methods.removeVote = function(userId) {
  const existingVote = this.voters.find(voter => voter.user.equals(userId));
  
  if (existingVote) {
    if (existingVote.vote === 'up') {
      this.upvotes = Math.max(0, this.upvotes - 1);
    } else {
      this.downvotes = Math.max(0, this.downvotes - 1);
    }
    
    this.voters = this.voters.filter(voter => !voter.user.equals(userId));
    this.lastInteraction = new Date();
  }
  
  return this.save();
};

// 🔍 Indexes for better query performance
resourceSchema.index({ community: 1, createdAt: -1 }); // Community timeline
resourceSchema.index({ submittedBy: 1, createdAt: -1 }); // User resources
resourceSchema.index({ url: 1 }, { unique: true }); // Prevent duplicates
resourceSchema.index({ upvotes: -1, createdAt: -1 }); // Popular sorting
resourceSchema.index({ createdAt: -1 }); // Recent sorting
resourceSchema.index({ tags: 1 }); // Tag filtering
resourceSchema.index({ type: 1, difficulty: 1 }); // Category filtering
resourceSchema.index({ isActive: 1, isFeatured: -1 }); // Active/featured
resourceSchema.index({ 'voters.user': 1 }); // Vote lookups
resourceSchema.index({ lastInteraction: -1 }); // Trending calculation

// 📝 Text search index
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 3
  },
  name: 'resource_text_index'
});

module.exports = mongoose.model('Resource', resourceSchema);
