// 🚀 Port42 Backend Server
// Main server file that ties everything together

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 🛡️ Security Middleware
app.use(helmet());

// Rate limiting - prevents spam and attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// 🌐 CORS - allows frontend to communicate with backend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 📝 Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🗄️ Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/port42', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('🔗 Connected to MongoDB');
  console.log('🌐 Database: Port42');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
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
  console.log('👤 User connected:', socket.id);

  // Join a resource's comment room
  socket.on('join_resource', (resourceId) => {
    socket.join(`resource_${resourceId}`);
    console.log(`👤 User ${socket.id} joined resource ${resourceId}`);
  });

  // Handle new comments
  socket.on('new_comment', (data) => {
    // Broadcast to all users viewing this resource
    socket.to(`resource_${data.resourceId}`).emit('comment_added', data);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
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

// 🚀 Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('🚀 Port42 Server Started!');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`💬 Socket.io: Enabled for real-time features`);
  console.log('⚡ Ready to hack the matrix!');
});

// Export for testing purposes
module.exports = { app, io };
