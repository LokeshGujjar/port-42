// 💬 Port42 Socket.io Client
// Handles real-time communication for comments and updates

class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.currentResourceId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.initialize();
    }

    // 🚀 Initialize socket connection
    initialize() {
        try {
            this.socket = io('http://localhost:5000', {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                forceNew: false
            });

            this.setupEventListeners();
        } catch (error) {
            console.warn('Socket.io not available:', error);
        }
    }

    // 🔧 Set up socket event listeners
    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('🔗 Connected to Port42 neural network');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);

            // Rejoin resource room if viewing one
            if (this.currentResourceId) {
                this.joinResourceRoom(this.currentResourceId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('📡 Disconnected from neural network');
            this.connected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            console.warn('🚫 Connection error:', error);
            this.handleReconnect();
        });

        // Real-time comment events
        this.socket.on('comment_added', (data) => {
            this.handleNewComment(data);
        });

        this.socket.on('comment_updated', (data) => {
            this.handleCommentUpdate(data);
        });

        this.socket.on('comment_deleted', (data) => {
            this.handleCommentDelete(data);
        });

        // Resource update events
        this.socket.on('resource_updated', (data) => {
            this.handleResourceUpdate(data);
        });

        this.socket.on('vote_updated', (data) => {
            this.handleVoteUpdate(data);
        });
    }

    // 🔄 Handle reconnection attempts
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.socket.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('🚫 Max reconnection attempts reached');
            this.updateConnectionStatus(false, 'Connection lost. Please refresh to reconnect.');
        }
    }

    // 🏠 Join a resource's comment room
    joinResourceRoom(resourceId) {
        if (!this.socket || !resourceId) return;

        // Leave current room if any
        if (this.currentResourceId) {
            this.leaveResourceRoom(this.currentResourceId);
        }

        this.currentResourceId = resourceId;
        this.socket.emit('join_resource', resourceId);
        console.log(`🏠 Joined resource room: ${resourceId}`);
    }

    // 🚪 Leave current resource room
    leaveResourceRoom(resourceId) {
        if (!this.socket || !resourceId) return;

        this.socket.emit('leave_resource', resourceId);
        
        if (this.currentResourceId === resourceId) {
            this.currentResourceId = null;
        }
        
        console.log(`🚪 Left resource room: ${resourceId}`);
    }

    // 📝 Send new comment to server
    sendComment(commentData) {
        if (!this.socket || !this.connected) {
            console.warn('Socket not connected, comment will not be real-time');
            return;
        }

        this.socket.emit('new_comment', commentData);
    }

    // 🗳️ Send vote update to server
    sendVote(voteData) {
        if (!this.socket || !this.connected) return;

        this.socket.emit('vote_update', voteData);
    }

    // 💬 Handle new comment received
    handleNewComment(data) {
        console.log('📨 New comment received:', data);

        // Update comment section if visible
        if (window.comments && this.currentResourceId === data.resourceId) {
            window.comments.addCommentToUI(data.comment);
        }

        // Update resource comment count
        this.updateResourceCommentCount(data.resourceId, 1);

        // Show notification if not from current user
        if (auth.currentUser && data.comment.author._id !== auth.currentUser._id) {
            this.showRealtimeNotification(
                `New comment by ${data.comment.author.username}`,
                'comment'
            );
        }
    }

    // ✏️ Handle comment update
    handleCommentUpdate(data) {
        console.log('✏️ Comment updated:', data);

        if (window.comments && this.currentResourceId === data.resourceId) {
            window.comments.updateCommentInUI(data.comment);
        }
    }

    // 🗑️ Handle comment deletion
    handleCommentDelete(data) {
        console.log('🗑️ Comment deleted:', data);

        if (window.comments && this.currentResourceId === data.resourceId) {
            window.comments.removeCommentFromUI(data.commentId);
        }

        // Update resource comment count
        this.updateResourceCommentCount(data.resourceId, -1);
    }

    // 🔄 Handle resource updates
    handleResourceUpdate(data) {
        console.log('🔄 Resource updated:', data);

        // Update resource in UI if currently viewing
        const resourceCard = document.querySelector(`[data-resource-id="${data.resource._id}"]`);
        if (resourceCard && window.Resource) {
            window.Resource.updateResourceCard(resourceCard, data.resource);
        }
    }

    // 🗳️ Handle vote updates
    handleVoteUpdate(data) {
        console.log('🗳️ Vote updated:', data);

        // Update vote counts in UI
        const resourceCard = document.querySelector(`[data-resource-id="${data.resourceId}"]`);
        if (resourceCard) {
            this.updateVoteDisplay(resourceCard, data);
        }

        // Update modal if open
        const modal = document.getElementById('resource-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const modalVoteDisplay = modal.querySelector('.vote-controls');
            if (modalVoteDisplay) {
                this.updateVoteDisplay(modalVoteDisplay.closest('[data-resource-id]'), data);
            }
        }
    }

    // 🔢 Update resource comment count
    updateResourceCommentCount(resourceId, increment) {
        const resourceCard = document.querySelector(`[data-resource-id="${resourceId}"]`);
        if (resourceCard) {
            const commentStat = resourceCard.querySelector('.comment-count');
            if (commentStat) {
                const current = parseInt(commentStat.textContent) || 0;
                commentStat.textContent = Math.max(0, current + increment);
            }
        }
    }

    // 🗳️ Update vote display in UI
    updateVoteDisplay(element, voteData) {
        if (!element) return;

        const scoreEl = element.querySelector('.vote-score');
        const upBtn = element.querySelector('.vote-btn.up');
        const downBtn = element.querySelector('.vote-btn.down');

        if (scoreEl) {
            scoreEl.textContent = voteData.score || (voteData.upvotes - voteData.downvotes);
        }

        // Update vote button states if this is the current user's vote
        if (auth.currentUser && voteData.userId === auth.currentUser._id) {
            if (upBtn && downBtn) {
                upBtn.classList.toggle('voted-up', voteData.vote === 'up');
                downBtn.classList.toggle('voted-down', voteData.vote === 'down');
            }
        }
    }

    // 🔔 Show real-time notification
    showRealtimeNotification(message, type) {
        // Don't show if page is not visible
        if (document.hidden) return;

        const notification = document.createElement('div');
        notification.className = `realtime-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${type === 'comment' ? '💬' : '🔔'}</div>
            <div class="notification-text">${message}</div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Click to dismiss
        notification.onclick = () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        };
    }

    // 📡 Update connection status display
    updateConnectionStatus(connected, message = null) {
        const statusIndicator = document.querySelector('.connection-status');
        
        if (!statusIndicator) {
            // Create status indicator
            const indicator = document.createElement('div');
            indicator.className = 'connection-status';
            document.body.appendChild(indicator);
        }

        const indicator = document.querySelector('.connection-status');
        indicator.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        indicator.textContent = message || (connected ? 'NEURAL LINK ACTIVE' : 'NEURAL LINK OFFLINE');

        // Auto-hide after 3 seconds if connected
        if (connected) {
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 3000);
        } else {
            indicator.classList.remove('hidden');
        }
    }

    // 🧹 Cleanup when leaving page
    cleanup() {
        if (this.currentResourceId) {
            this.leaveResourceRoom(this.currentResourceId);
        }
    }

    // 🔌 Manual disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    // 🔗 Manual reconnect
    reconnect() {
        if (this.socket) {
            this.reconnectAttempts = 0;
            this.socket.connect();
        }
    }
}

// Create global socket manager
window.socketManager = new SocketManager();

// Add real-time notification styles
const realtimeStyles = `
    .realtime-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--bg-secondary);
        border: 1px solid var(--neon-cyan);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        z-index: 1002;
        transform: translateX(100%);
        opacity: 0;
        transition: all var(--transition-normal);
        cursor: pointer;
        box-shadow: var(--glow-sm);
        min-width: 250px;
    }

    .realtime-notification.show {
        transform: translateX(0);
        opacity: 1;
    }

    .realtime-notification:hover {
        border-color: var(--neon-green);
    }

    .notification-icon {
        font-size: 1.25rem;
        filter: drop-shadow(var(--glow-sm));
    }

    .notification-text {
        font-family: var(--font-mono);
        font-size: 0.875rem;
        color: var(--text-primary);
    }

    .connection-status {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: var(--bg-secondary);
        border: 1px solid;
        border-radius: var(--border-radius);
        padding: var(--spacing-sm) var(--spacing-md);
        font-family: var(--font-mono);
        font-size: 0.75rem;
        font-weight: 500;
        z-index: 1000;
        transition: all var(--transition-normal);
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .connection-status.connected {
        border-color: var(--neon-green);
        color: var(--neon-green);
    }

    .connection-status.disconnected {
        border-color: var(--neon-red);
        color: var(--neon-red);
        animation: pulse 1s ease-in-out infinite;
    }

    .connection-status.hidden {
        opacity: 0;
        transform: translateY(100%);
    }
`;

// Inject real-time styles
const realtimeStyleSheet = document.createElement('style');
realtimeStyleSheet.textContent = realtimeStyles;
document.head.appendChild(realtimeStyleSheet);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.socketManager) {
        window.socketManager.cleanup();
    }
});
