// 🔐 Authentication Routes
// Handles user registration, login, and JWT token management

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 🎯 Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// 📝 Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: existingUser.email === email 
          ? 'Email is already registered' 
          : 'Username is already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName: displayName || username
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
});

// 🔑 Login user
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login can be email or username

    // Validate input
    if (!login || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Please provide email/username and password'
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login }
      ]
    }).select('+password'); // Include password for verification

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'User not found'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.correctPassword(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// 👤 Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('followedCommunities', 'name slug icon color')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'Internal server error'
    });
  }
});

// ✏️ Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, bio, preferences } = req.body;
    const userId = req.user.userId;

    // Find and update user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Update allowed fields
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (preferences !== undefined) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors
      });
    }

    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error'
    });
  }
});

// 🔄 Refresh token
router.post('/refresh', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify user still exists and is active
    const user = await User.findById(userId).select('isActive');

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'User account no longer active'
      });
    }

    // Generate new token
    const token = generateToken(userId);

    res.json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error'
    });
  }
});

// 🚪 Logout (optional - mainly for clearing client-side token)
router.post('/logout', auth, (req, res) => {
  res.json({
    message: 'Logged out successfully',
    instruction: 'Remove token from client storage'
  });
});

// 🔍 Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (username.length < 3) {
      return res.json({
        available: false,
        message: 'Username must be at least 3 characters'
      });
    }

    const existingUser = await User.findOne({ username });

    res.json({
      available: !existingUser,
      message: existingUser 
        ? 'Username is already taken' 
        : 'Username is available'
    });

  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({
      error: 'Check failed',
      message: 'Unable to check username availability'
    });
  }
});

// 🔍 Check email availability
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    res.json({
      available: !existingUser,
      message: existingUser 
        ? 'Email is already registered' 
        : 'Email is available'
    });

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      error: 'Check failed',
      message: 'Unable to check email availability'
    });
  }
});

module.exports = router;
