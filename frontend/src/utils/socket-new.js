// 🔌 Enhanced Socket Manager
// Real-time communication with retry logic and state management

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentRoom = null;
    
    // Event handlers
    this.handlers = new Map();
    
    // Initialize
    this.init();
  }

  init() {
    // Initialize socket connection when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initSocket());
    } else {
      this.initSocket();
    }
  }

  initSocket() {
    // Check if socket.io is available
    if (typeof io === 'undefined') {
      console.warn('Socket.io not loaded, real-time features disabled');
      return;
    }

    this.connect();
  }

  // Connect to socket server
  connect() {
    if (this.socket && this.socket.connected) {
      return;
    }

    try {
      this.socket = io('http://localhost:5000', {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      this.setupEventHandlers();
      
      console.log('🔌 Connecting to socket server...');
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
    }
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.currentRoom = null;
    this.reconnectAttempts = 0;
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('🔌 Connected to socket server');
      
      // Rejoin room if we were in one
      if (this.currentRoom) {
        this.joinRoom(this.currentRoom);
      }
      
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      console.log('🔌 Disconnected from socket server:', reason);
      
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
    });

    // Application-specific events
    this.setupAppEventHandlers();
  }

  // Setup application-specific event handlers
  setupAppEventHandlers() {
    if (!this.socket) return;

    // Comment events
    this.socket.on('comment_added', (data) => {
      this.emit('commentAdded', data);
      console.log('💬 New comment received:', data);
    });

    this.socket.on('votes_updated', (data) => {
      this.emit('votesUpdated', data);
      console.log('👍 Votes updated:', data);
    });

    this.socket.on('user_joined', (data) => {
      this.emit('userJoined', data);
      console.log('👤 User joined:', data.username);
    });

    this.socket.on('user_left', (data) => {
      this.emit('userLeft', data);
      console.log('👤 User left:', data.username);
    });
  }

  // Join a room (for resource-specific events)
  joinRoom(roomId) {
    if (!this.socket || !this.isConnected) {
      this.currentRoom = roomId;
      return;
    }

    this.socket.emit('join_resource', roomId);
    this.currentRoom = roomId;
    
    console.log(`🏠 Joined room: ${roomId}`);
  }

  // Leave current room
  leaveRoom() {
    if (!this.socket || !this.currentRoom) {
      return;
    }

    this.socket.emit('leave_resource', this.currentRoom);
    this.currentRoom = null;
    
    console.log('🚪 Left room');
  }

  // Send new comment
  sendComment(resourceId, comment) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to real-time services');
    }

    this.socket.emit('new_comment', {
      resourceId,
      comment
    });
  }

  // Send vote update
  sendVoteUpdate(resourceId, voteData) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('vote_update', {
      resourceId,
      ...voteData
    });
  }

  // Generic event emitter
  emit(event, data) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in socket event handler for '${event}':`, error);
        }
      });
    }
  }

  // Event listener management
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  off(event, handler) {
    if (this.handlers.has(event)) {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      currentRoom: this.currentRoom,
      socketId: this.socket?.id
    };
  }

  // Debug information
  debug() {
    console.group('🔌 Socket Manager Debug');
    console.log('Connected:', this.isConnected);
    console.log('Socket ID:', this.socket?.id);
    console.log('Current Room:', this.currentRoom);
    console.log('Reconnect Attempts:', this.reconnectAttempts);
    console.log('Event Handlers:', [...this.handlers.keys()]);
    console.groupEnd();
  }
}

// Create global instance
window.socketManager = new SocketManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketManager;
}
