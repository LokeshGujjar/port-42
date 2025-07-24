// 🔧 Configuration Manager
// Centralized configuration for the entire backend

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/port42',
    name: process.env.DB_NAME || 'port42',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET
  },

  // Rate Limiting
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/port42.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: process.env.NODE_ENV === 'development'
  },

  // Security Configuration
  security: {
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',
    helmetOptions: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }
  }
};

// Validation
const validateConfig = () => {
  const required = [
    'auth.jwtSecret',
    'auth.sessionSecret'
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Warn about default values in production
  if (config.server.nodeEnv === 'production') {
    if (config.auth.jwtSecret.includes('change')) {
      console.warn('⚠️  WARNING: Using default JWT secret in production!');
    }
    if (config.auth.sessionSecret.includes('change')) {
      console.warn('⚠️  WARNING: Using default session secret in production!');
    }
  }
};

validateConfig();

module.exports = config;
