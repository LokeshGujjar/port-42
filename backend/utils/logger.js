// 📝 Logging Utility
// Centralized logging with different levels and file output

const winston = require('winston');
const config = require('../config');

// Custom format for logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  defaultMeta: { service: 'port42-backend' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxsize,
      maxFiles: config.logging.maxFiles
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: config.logging.maxsize,
      maxFiles: config.logging.maxFiles
    })
  ]
});

// Add console transport for development
if (config.server.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Helper methods for common log patterns
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
};

logger.logAuth = (action, userId, success, details = {}) => {
  logger.info('Auth Action', {
    action,
    userId,
    success,
    ...details
  });
};

logger.logDatabase = (operation, collection, duration, error = null) => {
  if (error) {
    logger.error('Database Error', {
      operation,
      collection,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    });
  } else {
    logger.debug('Database Operation', {
      operation,
      collection,
      duration: `${duration}ms`
    });
  }
};

module.exports = logger;
