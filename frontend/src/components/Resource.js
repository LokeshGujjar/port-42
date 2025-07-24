// 📄 Resource Component for Port42
// Handles individual resource display and interactions

class Resource {
  constructor() {
    this.currentResource = null;
    this.socket = window.socketManager;
  }

  // Render resource card
  renderCard(resource) {
    const timeAgo = this.getTimeAgo(resource.createdAt);
    const difficultyClass = `difficulty-${resource.difficulty}`;
    
    return `
      <div class="resource-card" data-id="${resource._id}">
        <div class="resource-header">
          <h3 class="resource-title">${resource.title}</h3>
          <span class="resource-type">${resource.type.toUpperCase()}</span>
        </div>
        
        <div class="resource-meta">
          <span class="resource-community">${resource.community?.name || 'UNKNOWN'}</span>
          <span class="resource-difficulty ${difficultyClass}">${resource.difficulty?.toUpperCase()}</span>
          <span class="resource-time">${timeAgo}</span>
        </div>
        
        <div class="resource-description">
          ${resource.description || 'No description available'}
        </div>
        
        <div class="resource-tags">
          ${resource.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || ''}
        </div>
        
        <div class="resource-actions">
          <div class="resource-votes">
            <button class="vote-btn upvote ${resource.userVote === 'up' ? 'active' : ''}" data-id="${resource._id}" data-type="up">
              ▲ ${resource.upvotes || 0}
            </button>
            <button class="vote-btn downvote ${resource.userVote === 'down' ? 'active' : ''}" data-id="${resource._id}" data-type="down">
              ▼ ${resource.downvotes || 0}
            </button>
          </div>
          
          <div class="resource-stats">
            <span class="comments-count">${resource.commentsCount || 0} COMMENTS</span>
          </div>
          
          <div class="resource-links">
            <a href="${resource.url}" target="_blank" class="btn btn-primary btn-small">VISIT</a>
            <button class="btn btn-secondary btn-small" onclick="window.Resource.showModal('${resource._id}')">DETAILS</button>
          </div>
        </div>
      </div>
    `;
  }

  // Show resource modal
  async showModal(resourceId) {
    try {
      const modal = document.getElementById('modal-overlay');
      const resourceModal = document.getElementById('resource-modal');
      const titleEl = document.getElementById('resource-modal-title');
      const contentEl = document.getElementById('resource-modal-content');
      
      // Show loading
      contentEl.innerHTML = '<div class="loading">Loading resource...</div>';
      modal.classList.remove('hidden');
      
      // Fetch resource details
      const response = await window.api.getResource(resourceId);
      const resource = response.resource;
      
      this.currentResource = resource;
      titleEl.textContent = resource.title;
      
      // Join socket room for real-time updates
      if (this.socket) {
        this.socket.joinRoom(resourceId);
      }
      
      // Render resource details
      contentEl.innerHTML = this.renderModalContent(resource);
      
      // Set up event listeners
      this.setupModalEventListeners();
      
    } catch (error) {
      console.error('Failed to load resource:', error);
      contentEl.innerHTML = '<div class="error">Failed to load resource</div>';
    }
  }

  // Render modal content
  renderModalContent(resource) {
    return `
      <div class="resource-details">
        <div class="resource-main">
          <div class="resource-info">
            <div class="resource-meta-detailed">
              <span class="community">${resource.community?.name}</span>
              <span class="type">${resource.type.toUpperCase()}</span>
              <span class="difficulty difficulty-${resource.difficulty}">${resource.difficulty.toUpperCase()}</span>
              <span class="author">by ${resource.author?.username}</span>
              <span class="date">${this.getTimeAgo(resource.createdAt)}</span>
            </div>
            
            <div class="resource-description-full">
              ${resource.description || 'No description available'}
            </div>
            
            <div class="resource-tags-full">
              ${resource.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || ''}
            </div>
            
            <div class="resource-actions-modal">
              <a href="${resource.url}" target="_blank" class="btn btn-primary">VISIT RESOURCE</a>
              <div class="vote-controls">
                <button class="vote-btn upvote ${resource.userVote === 'up' ? 'active' : ''}" data-id="${resource._id}" data-type="up">
                  ▲ ${resource.upvotes || 0}
                </button>
                <button class="vote-btn downvote ${resource.userVote === 'down' ? 'active' : ''}" data-id="${resource._id}" data-type="down">
                  ▼ ${resource.downvotes || 0}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="resource-comments">
          <div id="comments-container">
            <!-- Comments will be loaded here -->
          </div>
        </div>
      </div>
    `;
  }

  // Setup modal event listeners
  setupModalEventListeners() {
    // Vote buttons
    const voteButtons = document.querySelectorAll('.vote-btn');
    voteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleVote(e));
    });
    
    // Close modal
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
    
    // Load comments
    this.loadComments();
  }

  // Handle voting
  async handleVote(e) {
    e.preventDefault();
    
    if (!window.auth.isAuthenticated) {
      window.auth.showAuthModal('login');
      return;
    }
    
    const button = e.target;
    const resourceId = button.dataset.id;
    const voteType = button.dataset.type;
    
    try {
      const response = await window.api.voteResource(resourceId, voteType);
      
      if (response.success) {
        // Update UI
        this.updateVoteDisplay(button, response.votes);
        
        // Send real-time update
        if (this.socket) {
          this.socket.sendVoteUpdate(resourceId, response.votes);
        }
      }
    } catch (error) {
      console.error('Vote failed:', error);
      window.notificationManager?.show('Vote failed', 'error');
    }
  }

  // Update vote display
  updateVoteDisplay(clickedButton, votes) {
    const container = clickedButton.closest('.vote-controls') || clickedButton.closest('.resource-votes');
    const upBtn = container.querySelector('.upvote');
    const downBtn = container.querySelector('.downvote');
    
    // Reset active states
    upBtn.classList.remove('active');
    downBtn.classList.remove('active');
    
    // Update counts
    upBtn.innerHTML = `▲ ${votes.upvotes}`;
    downBtn.innerHTML = `▼ ${votes.downvotes}`;
    
    // Set active state
    if (votes.userVote === 'up') {
      upBtn.classList.add('active');
    } else if (votes.userVote === 'down') {
      downBtn.classList.add('active');
    }
  }

  // Load comments
  async loadComments() {
    if (!this.currentResource) return;
    
    try {
      const response = await window.api.getComments(this.currentResource._id);
      const commentsContainer = document.getElementById('comments-container');
      
      if (window.Comments) {
        window.Comments.render(commentsContainer, response.comments, this.currentResource._id);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.add('hidden');
    
    // Leave socket room
    if (this.socket && this.currentResource) {
      this.socket.leaveRoom();
    }
    
    this.currentResource = null;
  }

  // Get time ago string
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;
    return `${diffDays}D AGO`;
  }
}

// Create global instance
window.Resource = new Resource();
