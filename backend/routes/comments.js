// 💬 Comment Routes
// Handles real-time comments and chat threads

const express = require('express');
const Comment = require('../models/Comment');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 📋 Get comments for a resource
router.get('/resource/:resourceId', optionalAuth, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { sort = 'newest', page = 1, limit = 50 } = req.query;

    // Verify resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    // Build sort option
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
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get top-level comments (no parent)
    const comments = await Comment.find({
      resource: resourceId,
      parentComment: null,
      isDeleted: false
    })
      .populate('author', 'username displayName reputation level avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username displayName reputation level avatar'
        },
        match: { isDeleted: false },
        options: { sort: { createdAt: 1 } }
      })
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add user vote status if authenticated
    if (req.user) {
      const addUserVoteStatus = (commentList) => {
        commentList.forEach(comment => {
          const userVote = comment.voters.find(voter => 
            voter.user.toString() === req.user.userId
          );
          comment.userVote = userVote ? userVote.vote : null;
          
          if (comment.replies && comment.replies.length > 0) {
            addUserVoteStatus(comment.replies);
          }
        });
      };
      
      addUserVoteStatus(comments);
    }

    const total = await Comment.countDocuments({
      resource: resourceId,
      parentComment: null,
      isDeleted: false
    });

    res.json({
      comments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: comments.length,
        totalComments: total
      }
    });

  } catch (error) {
    console.error('Comment fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      message: error.message
    });
  }
});

// 📝 Create new comment
router.post('/', auth, async (req, res) => {
  try {
    const { content, resourceId, parentCommentId } = req.body;
    const userId = req.user.userId;

    if (!content || !resourceId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Content and resource ID are required'
      });
    }

    // Verify resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested resource does not exist'
      });
    }

    // If replying to a comment, verify parent exists
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          error: 'Parent comment not found',
          message: 'The comment you are replying to does not exist'
        });
      }
    }

    // Create comment
    const comment = new Comment({
      content,
      resource: resourceId,
      author: userId,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Update resource comment count
    await Resource.findByIdAndUpdate(resourceId, {
      $inc: { commentCount: 1 },
      lastInteraction: new Date()
    });

    // Update user comment count
    await User.findByIdAndUpdate(userId, {
      $inc: { commentsCount: 1 }
    });

    // Populate for response
    await comment.populate('author', 'username displayName reputation level avatar');

    // Emit real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.to(`resource_${resourceId}`).emit('comment_added', {
        comment,
        resourceId
      });
    }

    res.status(201).json({
      message: 'Comment posted successfully',
      comment
    });

  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({
      error: 'Failed to post comment',
      message: error.message
    });
  }
});

// 🗳️ Vote on comment
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const { vote } = req.body; // 'up', 'down', or 'remove'
    const userId = req.user.userId;

    if (!['up', 'down', 'remove'].includes(vote)) {
      return res.status(400).json({
        error: 'Invalid vote',
        message: 'Vote must be "up", "down", or "remove"'
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      });
    }

    // Check if user already voted
    const existingVoteIndex = comment.voters.findIndex(voter => 
      voter.user.toString() === userId
    );

    if (existingVoteIndex !== -1) {
      const previousVote = comment.voters[existingVoteIndex].vote;
      
      // Remove previous vote
      if (previousVote === 'up') {
        comment.upvotes = Math.max(0, comment.upvotes - 1);
      } else {
        comment.downvotes = Math.max(0, comment.downvotes - 1);
      }
      
      comment.voters.splice(existingVoteIndex, 1);
    }

    // Add new vote (if not removing)
    if (vote !== 'remove') {
      if (vote === 'up') {
        comment.upvotes += 1;
      } else {
        comment.downvotes += 1;
      }
      
      comment.voters.push({
        user: userId,
        vote: vote,
        votedAt: new Date()
      });
    }

    comment.lastActivity = new Date();
    await comment.save();

    res.json({
      message: 'Vote updated successfully',
      vote: vote === 'remove' ? null : vote,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      score: comment.upvotes - comment.downvotes
    });

  } catch (error) {
    console.error('Comment vote error:', error);
    res.status(500).json({
      error: 'Vote failed',
      message: error.message
    });
  }
});

// ✏️ Edit comment
router.put('/:id', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({
        error: 'Missing content',
        message: 'Comment content is required'
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      });
    }

    // Check permissions
    if (comment.author.toString() !== userId) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only edit your own comments'
      });
    }

    // Save to edit history
    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date()
    });

    comment.content = content;
    comment.isEdited = true;
    comment.lastActivity = new Date();

    await comment.save();

    res.json({
      message: 'Comment updated successfully',
      comment
    });

  } catch (error) {
    console.error('Comment edit error:', error);
    res.status(500).json({
      error: 'Edit failed',
      message: error.message
    });
  }
});

// 🗑️ Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    const canDelete = comment.author.toString() === userId || user.isModerator;

    if (!canDelete) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only delete your own comments'
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = '[deleted]';

    await comment.save();

    // Update resource comment count
    await Resource.findByIdAndUpdate(comment.resource, {
      $inc: { commentCount: -1 }
    });

    res.json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Comment deletion error:', error);
    res.status(500).json({
      error: 'Deletion failed',
      message: error.message
    });
  }
});

module.exports = router;
