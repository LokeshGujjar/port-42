// 🏛️ Community Routes
// Handles community management and discovery

const express = require('express');
const Community = require('../models/Community');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { auth, optionalAuth, requireModerator } = require('../middleware/auth');

const router = express.Router();

// 📋 Get all communities
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort = 'popular', search, featured } = req.query;

    const filter = { isActive: true };

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { memberCount: -1 };
        break;
      case 'active':
        sortOption = { lastActivity: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'alphabetical':
        sortOption = { name: 1 };
        break;
      default:
        sortOption = { memberCount: -1 };
    }

    const communities = await Community.find(filter)
      .populate('creator', 'username displayName')
      .sort(sortOption)
      .lean();

    res.json({ communities });

  } catch (error) {
    console.error('Community fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch communities',
      message: error.message
    });
  }
});

// 📝 Create new community
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      color,
      tags,
      isPrivate,
      rules
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name and description are required'
      });
    }

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCommunity) {
      return res.status(400).json({
        error: 'Community exists',
        message: 'A community with this name already exists'
      });
    }

    const community = new Community({
      name,
      description,
      icon: icon || '🌐',
      color: color || '#00ff41',
      tags: tags || [],
      isPrivate: isPrivate || false,
      rules: rules || [],
      creator: req.user.userId,
      moderators: [req.user.userId]
    });

    await community.save();

    // Add creator as first member
    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { followedCommunities: community._id }
    });

    await community.populate('creator', 'username displayName');

    res.status(201).json({
      message: 'Community created successfully',
      community
    });

  } catch (error) {
    console.error('Community creation error:', error);
    res.status(500).json({
      error: 'Community creation failed',
      message: error.message
    });
  }
});

// 👁️ Get single community
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    const community = await Community.findOne({ slug, isActive: true })
      .populate('creator', 'username displayName reputation')
      .populate('moderators', 'username displayName')
      .lean();

    if (!community) {
      return res.status(404).json({
        error: 'Community not found',
        message: 'The requested community does not exist'
      });
    }

    // Get recent resources
    const recentResources = await Resource.find({ 
      community: community._id, 
      isActive: true 
    })
      .populate('submittedBy', 'username displayName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      community,
      recentResources
    });

  } catch (error) {
    console.error('Community fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch community',
      message: error.message
    });
  }
});

// 🔔 Join/Leave community
router.post('/:id/toggle-membership', auth, async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.userId;

    const community = await Community.findById(communityId);
    const user = await User.findById(userId);

    if (!community || !user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Community or user not found'
      });
    }

    const isMember = user.followedCommunities.includes(communityId);

    if (isMember) {
      // Leave community
      await User.findByIdAndUpdate(userId, {
        $pull: { followedCommunities: communityId }
      });
      
      await Community.findByIdAndUpdate(communityId, {
        $inc: { memberCount: -1 }
      });

      res.json({
        message: 'Left community successfully',
        isMember: false
      });
    } else {
      // Join community
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followedCommunities: communityId }
      });
      
      await Community.findByIdAndUpdate(communityId, {
        $inc: { memberCount: 1 },
        lastActivity: new Date()
      });

      res.json({
        message: 'Joined community successfully',
        isMember: true
      });
    }

  } catch (error) {
    console.error('Membership toggle error:', error);
    res.status(500).json({
      error: 'Membership action failed',
      message: error.message
    });
  }
});

module.exports = router;
