// 🚀 Port42 Backend Server
// Main server file that ties everything together

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const http = require('http');
const socketIo = require('socket.io');

// Import configuration and utilities
const config = require('./config');
const logger = require('./utils/logger');
const { sanitizeInput } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const communityRoutes = require('./routes/communities');
const commentRoutes = require('./routes/comments');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io for real-time features
const io = socketIo(server, {
  cors: {
    origin: config.server.frontendUrl,
    methods: ["GET", "POST"]
  }
});

// Create logs directory
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// 🛡️ Security Middleware
app.use(helmet(config.security.helmetOptions));

// Compression middleware
app.use(compression());

// Sanitize NoSQL injection
app.use(mongoSanitize());

// Rate limiting - prevents spam and attacks
const limiter = rateLimit({
  ...config.rateLimit,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: `${config.rateLimit.windowMs / 60000} minutes`
  }
});
app.use(limiter);

// 🌐 CORS - allows frontend to communicate with backend
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true
}));

// 📝 Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  
  next();
});

// 🗄️ Database Connection
mongoose.connect(config.database.uri, config.database.options)
.then(() => {
  logger.info('Database connected', {
    uri: config.database.uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
    database: config.database.name
  });
})
.catch((err) => {
  logger.error('MongoDB connection error', { 
    error: err.message,
    stack: err.stack 
  });
  process.exit(1);
});

// 🛣️ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/comments', commentRoutes);

// 🏠 Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: '🌐 Welcome to Port42 API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// 💬 Socket.io for real-time comments
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id, ip: socket.handshake.address });

  // Join a resource's comment room
  socket.on('join_resource', (resourceId) => {
    socket.join(`resource_${resourceId}`);
    logger.debug('User joined resource', { 
      socketId: socket.id, 
      resourceId 
    });
  });

  // Handle new comments
  socket.on('new_comment', (data) => {
    logger.debug('New comment received', { 
      socketId: socket.id, 
      resourceId: data.resourceId 
    });
    // Broadcast to all users viewing this resource
    socket.to(`resource_${data.resourceId}`).emit('comment_added', data);
  });

  // Handle voting updates
  socket.on('vote_update', (data) => {
    socket.to(`resource_${data.resourceId}`).emit('votes_updated', data);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id });
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error('Socket error', { 
      socketId: socket.id, 
      error: error.message 
    });
  });
});

// 🏥 Health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    environment: config.server.nodeEnv
  });
});

// 🚫 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
    availableRoutes: ['/api/auth', '/api/resources', '/api/communities', '/api/comments']
  });
});

// 🚨 Global Error Handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

//  Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 🚀 Start the server
const PORT = config.server.port;

server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: config.server.nodeEnv,
    frontend: config.server.frontendUrl
  });
  console.log('🌐 Port42 Neural Network Online');
  console.log(`⚡ Server running on port ${PORT}`);
  console.log('⚡ Ready to hack the matrix!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
});

// Export for testing purposes
module.exports = { app, io };
