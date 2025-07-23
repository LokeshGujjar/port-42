// 🔗 Resource Routes
// Handles CRUD operations for learning resources

const express = require('express');
const Resource = require('../models/Resource');
const Community = require('../models/Community');
const User = require('../models/User');
const { auth, optionalAuth, requireModerator, rateLimitAuth } = require('../middleware/auth');

const router = express.Router();

// 📋 Get all resources with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      community,
      type,
      difficulty,
      sort = 'newest',
      search,
      tags
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (community) {
      filter.community = community;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { upvotes: -1 };
        break;
      case 'controversial':
        sortOption = { downvotes: -1 };
        break;
      case 'discussed':
        sortOption = { commentCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const resources = await Resource.find(filter)
      .populate('submittedBy', 'username displayName reputation level')
      .populate('community', 'name slug icon color')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Resource.countDocuments(filter);

    // Add user vote status if authenticated
    if (req.user) {
      resources.forEach(resource => {
        const userVote = resource.voters.find(voter => 
          voter.user.toString() === req.user.userId
        );
        resource.userVote = userVote ? userVote.vote : null;
      });
    }

    res.json({
      resources,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: resources.length,
        totalResources: total
      },
      filters: {
        community,
        type,
        difficulty,
        sort,
        search,
        tags
      }
    });

  } catch (error) {
    console.error('Resource fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch resources',
      message: error.message
    });
  }
});

// 📝 Submit new resource
router.post('/', auth, rateLimitAuth(10, 300000), async (req, res) => {
  try {
    const {
      title,
      url,
      description,
      community,
      type,
      difficulty,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !url || !community) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, URL, and community are required'
      });
    }

    // Check if URL already exists
    const existingResource = await Resource.findOne({ url });
    if (existingResource) {
      return res.status(400).json({
        error: 'Resource already exists',
        message: 'This URL has already been submitted',
        existingResource: {
          id: existingResource._id,
          title: existingResource.title,
          community: existingResource.community
        }
      });
    }

    // Verify community exists
    const communityDoc = await Community.findById(community);
    if (!communityDoc) {
      return res.status(400).json({
        error: 'Invalid community',
        message: 'Selected community does not exist'
      });
    }

    // Create new resource
    const resource = new Resource({
      title,
      url,
      description,
      community,
      type: type || 'article',
      difficulty: difficulty || 'beginner',
      tags: tags || [],
      submittedBy: req.user.userId
    });

    await resource.save();

    // Update community stats
    await Community.findByIdAndUpdate(community, {
      $inc: { resourceCount: 1 },
      lastActivity: new Date()
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { resourcesSubmitted: 1 }
    });

    // Populate for response
    await resource.populate([
      { path: 'submittedBy', select: 'username displayName reputation level' },
      { path: 'community', select: 'name slug icon color' }
    ]);

    res.status(201).json({
      message: 'Resource submitted successfully',
      resource
    });

  } catch (error) {
    console.error('Resource submission error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors
      });
    }

    res.status(500).json({
      error: 'Resource submission failed',
      message: 'Internal server error'
    });
  }
});

// 👁️ Get single resource by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const resourceId = req.params.id;

    const resource = await Resource.findById(resourceId)
      .populate('submittedBy', 'username displayName reputation level avatar')
      .populate('community', 'name slug icon color description')
      .lean();

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    if (!resource.isActive) {
      return res.status(410).json({
        error: 'Resource unavailable',
        message: 'This resource has been removed'
      });
    }

    // Increment view count
    await Resource.findByIdAndUpdate(resourceId, {
      $inc: { views: 1 },
      lastInteraction: new Date()
    });

    // Add user vote status if authenticated
    if (req.user) {
      const userVote = resource.voters.find(voter => 
        voter.user.toString() === req.user.userId
      );
      resource.userVote = userVote ? userVote.vote : null;
    }

    res.json({ resource });

  } catch (error) {
    console.error('Resource fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch resource',
      message: error.message
    });
  }
});

// 🗳️ Vote on resource
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { vote } = req.body; // 'up', 'down', or 'remove'
    const userId = req.user.userId;

    if (!['up', 'down', 'remove'].includes(vote)) {
      return res.status(400).json({
        error: 'Invalid vote',
        message: 'Vote must be "up", "down", or "remove"'
      });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    // Check if user already voted
    const existingVoteIndex = resource.voters.findIndex(voter => 
      voter.user.toString() === userId
    );

    let previousVote = null;
    if (existingVoteIndex !== -1) {
      previousVote = resource.voters[existingVoteIndex].vote;
      
      // Remove previous vote
      if (previousVote === 'up') {
        resource.upvotes = Math.max(0, resource.upvotes - 1);
      } else {
        resource.downvotes = Math.max(0, resource.downvotes - 1);
      }
      
      resource.voters.splice(existingVoteIndex, 1);
    }

    // Add new vote (if not removing)
    if (vote !== 'remove') {
      if (vote === 'up') {
        resource.upvotes += 1;
      } else {
        resource.downvotes += 1;
      }
      
      resource.voters.push({
        user: userId,
        vote: vote,
        votedAt: new Date()
      });
    }

    resource.lastInteraction = new Date();
    await resource.save();

    // Update user reputation if vote changed
    const submitterId = resource.submittedBy;
    if (submitterId.toString() !== userId) {
      let reputationChange = 0;
      
      if (previousVote === 'up' && vote !== 'up') reputationChange -= 5;
      if (previousVote === 'down' && vote !== 'down') reputationChange += 2;
      if (vote === 'up' && previousVote !== 'up') reputationChange += 5;
      if (vote === 'down' && previousVote !== 'down') reputationChange -= 2;

      if (reputationChange !== 0) {
        await User.findByIdAndUpdate(submitterId, {
          $inc: { 
            reputation: reputationChange,
            totalUpvotes: vote === 'up' ? 1 : (previousVote === 'up' ? -1 : 0),
            totalDownvotes: vote === 'down' ? 1 : (previousVote === 'down' ? -1 : 0)
          }
        });
      }
    }

    res.json({
      message: 'Vote updated successfully',
      vote: vote === 'remove' ? null : vote,
      upvotes: resource.upvotes,
      downvotes: resource.downvotes,
      score: resource.upvotes - resource.downvotes
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      error: 'Vote failed',
      message: 'Internal server error'
    });
  }
});

// 🔗 Track click (when user clicks external link)
router.post('/:id/click', optionalAuth, async (req, res) => {
  try {
    const resourceId = req.params.id;

    await Resource.findByIdAndUpdate(resourceId, {
      $inc: { clicks: 1 },
      lastInteraction: new Date()
    });

    res.json({ message: 'Click tracked' });

  } catch (error) {
    console.error('Click tracking error:', error);
    res.status(500).json({
      error: 'Failed to track click',
      message: error.message
    });
  }
});

// ✏️ Update resource (only by submitter or moderator)
router.put('/:id', auth, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.userId;
    const { title, description, type, difficulty, tags } = req.body;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    const canEdit = resource.submittedBy.toString() === userId || user.isModerator;

    if (!canEdit) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only edit resources you submitted'
      });
    }

    // Update allowed fields
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (difficulty) resource.difficulty = difficulty;
    if (tags) resource.tags = tags;

    await resource.save();

    // Populate for response
    await resource.populate([
      { path: 'submittedBy', select: 'username displayName reputation level' },
      { path: 'community', select: 'name slug icon color' }
    ]);

    res.json({
      message: 'Resource updated successfully',
      resource
    });

  } catch (error) {
    console.error('Resource update error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'Internal server error'
    });
  }
});

// 🗑️ Delete resource (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.userId;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    const canDelete = resource.submittedBy.toString() === userId || user.isModerator;

    if (!canDelete) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only delete resources you submitted'
      });
    }

    // Soft delete
    resource.isActive = false;
    await resource.save();

    // Update community stats
    await Community.findByIdAndUpdate(resource.community, {
      $inc: { resourceCount: -1 }
    });

    res.json({
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Resource deletion error:', error);
    res.status(500).json({
      error: 'Deletion failed',
      message: 'Internal server error'
    });
  }
});

// 🚨 Report resource
router.post('/:id/report', auth, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.userId;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Missing reason',
        message: 'Report reason is required'
      });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    // Check if user already reported this resource
    const existingReport = resource.reports.find(report => 
      report.user.toString() === userId
    );

    if (existingReport) {
      return res.status(400).json({
        error: 'Already reported',
        message: 'You have already reported this resource'
      });
    }

    // Add report
    resource.reports.push({
      user: userId,
      reason,
      description,
      reportedAt: new Date()
    });

    resource.isReported = true;
    await resource.save();

    res.json({
      message: 'Resource reported successfully'
    });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({
      error: 'Report failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
