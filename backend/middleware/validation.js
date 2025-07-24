// ✅ Input Validation Middleware
// Centralized validation for all API endpoints

const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      body: req.body
    });

    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      details: errorMessages
    });
  }
  
  next();
};

// Common validation rules
const validationRules = {
  // User validation
  userRegistration: [
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('displayName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Display name cannot exceed 50 characters')
      .trim()
  ],

  userLogin: [
    body('login')
      .notEmpty()
      .withMessage('Email or username is required')
      .trim(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Resource validation
  resourceSubmission: [
    body('title')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    
    body('url')
      .isURL({ protocols: ['http', 'https'] })
      .withMessage('Please provide a valid URL'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .trim(),
    
    body('community')
      .isMongoId()
      .withMessage('Please select a valid community'),
    
    body('type')
      .isIn(['article', 'video', 'course', 'tool', 'documentation', 'tutorial', 'book', 'podcast', 'other'])
      .withMessage('Please select a valid resource type'),
    
    body('difficulty')
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Please select a valid difficulty level'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each tag must be between 1 and 30 characters')
      .trim()
  ],

  // Comment validation
  commentSubmission: [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters')
      .trim(),
    
    body('parentComment')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent comment ID')
  ],

  // Community validation
  communityCreation: [
    body('name')
      .isLength({ min: 3, max: 50 })
      .withMessage('Community name must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9\s-_]+$/)
      .withMessage('Community name can only contain letters, numbers, spaces, hyphens, and underscores')
      .trim(),
    
    body('description')
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters')
      .trim(),
    
    body('slug')
      .isLength({ min: 3, max: 30 })
      .withMessage('Slug must be between 3 and 30 characters')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
      .trim()
  ],

  // Query parameter validation
  paginationQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['newest', 'oldest', 'popular', 'trending'])
      .withMessage('Invalid sort option')
  ],

  // ID parameter validation
  mongoIdParam: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ]
};

// Sanitization helpers
const sanitizeHTML = (str) => {
  return str
    .replace(/[<>\"']/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[char];
    });
};

const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeHTML(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  validationRules,
  handleValidationErrors,
  sanitizeInput
};
