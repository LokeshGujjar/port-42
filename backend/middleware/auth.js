// 🔒 Authentication Middleware
// Verifies JWT tokens and protects routes

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🛡️ Main authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('isActive');

    if (!user) {
      return res.status(401).json({
        error: 'Token invalid',
        message: 'User no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'User account has been deactivated'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      isActive: user.isActive
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalid',
        message: 'Invalid token format'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }

    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
};

// 🔧 Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('isActive');

    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        isActive: user.isActive
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // If optional auth fails, just continue without user
    req.user = null;
    next();
  }
};

// 🛡️ Admin/Moderator check
const requireModerator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first'
      });
    }

    const user = await User.findById(req.user.userId).select('isModerator');

    if (!user || !user.isModerator) {
      return res.status(403).json({
        error: 'Insufficient privileges',
        message: 'Moderator access required'
      });
    }

    next();

  } catch (error) {
    console.error('Moderator check error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      message: 'Internal server error'
    });
  }
};

// 🔍 Rate limiting for specific users
const rateLimitAuth = (maxRequests = 60, windowMs = 60000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs/1000} seconds`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    validRequests.push(now);
    userRequests.set(userId, validRequests);
    
    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  requireModerator,
  rateLimitAuth
};
