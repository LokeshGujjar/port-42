// 🏛️ Community Model
// Defines topic-based communities (Python, AI, Web Dev, etc.)

const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  // Basic community information
  name: {
    type: String,
    required: [true, 'Community name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Community name must be at least 2 characters'],
    maxlength: [50, 'Community name cannot exceed 50 characters']
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  
  description: {
    type: String,
    required: [true, 'Community description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Visual elements
  icon: {
    type: String, // URL or emoji
    default: '🌐'
  },
  
  color: {
    type: String, // Hex color for the community theme
    default: '#00ff41', // Matrix green as default
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  
  banner: {
    type: String, // URL to banner image
    default: null
  },
  
  // Community stats
  memberCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  resourceCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalUpvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Community settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  requireApproval: {
    type: Boolean,
    default: false
  },
  
  allowLinks: {
    type: Boolean,
    default: true
  },
  
  allowDiscussion: {
    type: Boolean,
    default: true
  },
  
  // Community rules
  rules: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Rule title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Rule description cannot exceed 500 characters']
    }
  }],
  
  // Tags for categorization
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Moderation
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔧 Pre-save middleware to generate slug
communitySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }
  next();
});

// 📊 Virtual for activity score
communitySchema.virtual('activityScore').get(function() {
  const daysSinceCreated = Math.max(1, Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)));
  return Math.round((this.resourceCount + this.totalUpvotes) / daysSinceCreated);
});

// 🎯 Virtual for engagement rate
communitySchema.virtual('engagementRate').get(function() {
  if (this.memberCount === 0) return 0;
  return Math.round((this.resourceCount / this.memberCount) * 100);
});

// 📝 Indexes for better performance
communitySchema.index({ slug: 1 });
communitySchema.index({ name: 1 });
communitySchema.index({ tags: 1 });
communitySchema.index({ isActive: 1, isFeatured: -1 });
communitySchema.index({ memberCount: -1 });
communitySchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Community', communitySchema);
