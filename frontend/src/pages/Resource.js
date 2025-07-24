// 📄 Resource Detail Component
// Shows detailed view of a resource with comments and interactions

class Resource {
  constructor() {
    this.resource = null;
    this.comments = [];
    this.resourceId = null;
    this.isLoading = false;
    this.newComment = '';
    
    this.init();
  }

  init() {
    console.log('📄 Resource component initializing...');
    
    // Get resource ID from URL params or route state
    this.resourceId = this.getResourceIdFromUrl();
    
    if (this.resourceId) {
      this.loadResource();
    } else {
      this.showError('No resource specified');
    }
  }

  getResourceIdFromUrl() {
    // In a simple implementation, we might store this in app state
    // For now, return a test ID or check for stored state
    if (window.currentResourceId) {
      return window.currentResourceId;
    }
    
    // Or check URL hash
    const hash = window.location.hash;
    const match = hash.match(/resource\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async loadResource() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      console.log('📡 Loading resource:', this.resourceId);

      // Load resource details
      let resourceResponse;
      if (window.api) {
        resourceResponse = await window.api.getResource(this.resourceId);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${this.resourceId}`, {
          headers: localStorage.getItem('token') ? {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } : {}
        });
        resourceResponse = await res.json();
      }

      if (resourceResponse.success) {
        this.resource = resourceResponse.resource;
        await this.loadComments();
        this.renderResource();
      } else {
        throw new Error(resourceResponse.message || 'Resource not found');
      }
    } catch (error) {
      console.error('Failed to load resource:', error);
      this.showError('Failed to load resource. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async loadComments() {
    try {
      let response;
      if (window.api) {
        response = await window.api.getComments(this.resourceId);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${this.resourceId}/comments`);
        response = await res.json();
      }

      if (response.success) {
        this.comments = response.comments || [];
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }

  renderResource() {
    const container = document.getElementById('resource-content');
    if (!container) return;

    const resourceHTML = `
      <div class="resource-detail-container">
        <!-- Resource Header -->
        <div class="resource-header">
          <button class="btn btn-secondary back-btn" onclick="history.back()">
            ← BACK
          </button>
          
          <div class="resource-meta">
            <span class="resource-type ${this.resource.type}">${this.resource.type.toUpperCase()}</span>
            <span class="resource-community">${this.resource.community?.name || 'Unknown'}</span>
            <span class="resource-date">${new Date(this.resource.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <!-- Resource Content -->
        <div class="resource-main">
          <div class="resource-voting">
            <button class="vote-btn upvote ${this.resource.userVote === 'up' ? 'voted' : ''}" 
                    onclick="window.Resource.vote('up')">
              ↑
            </button>
            <span class="vote-count">${(this.resource.upvotes || 0) - (this.resource.downvotes || 0)}</span>
            <button class="vote-btn downvote ${this.resource.userVote === 'down' ? 'voted' : ''}" 
                    onclick="window.Resource.vote('down')">
              ↓
            </button>
          </div>

          <div class="resource-content">
            <h1 class="resource-title">
              <a href="${this.resource.url}" target="_blank" rel="noopener noreferrer">
                ${this.resource.title}
              </a>
            </h1>
            
            <p class="resource-url">
              <a href="${this.resource.url}" target="_blank" rel="noopener noreferrer">
                ${this.resource.url}
              </a>
            </p>
            
            ${this.resource.description ? `
              <div class="resource-description">
                <p>${this.resource.description}</p>
              </div>
            ` : ''}
            
            <div class="resource-stats">
              <span class="stat">👁️ ${this.resource.views || 0} views</span>
              <span class="stat">💬 ${this.comments.length} comments</span>
              <span class="stat">👤 by ${this.resource.author?.username || 'Unknown'}</span>
            </div>
            
            ${this.resource.tags && this.resource.tags.length > 0 ? `
              <div class="resource-tags">
                ${this.resource.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="resource-actions">
          <button class="btn btn-secondary" onclick="window.Resource.shareResource()">
            📤 SHARE
          </button>
          <button class="btn btn-secondary" onclick="window.Resource.bookmarkResource()">
            🔖 BOOKMARK
          </button>
          <button class="btn btn-secondary" onclick="window.Resource.reportResource()">
            ⚠️ REPORT
          </button>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h3>COMMENTS (${this.comments.length})</h3>
          
          ${localStorage.getItem('token') ? `
            <div class="comment-form">
              <textarea 
                id="new-comment" 
                placeholder="Add your thoughts..."
                value="${this.newComment}"></textarea>
              <button class="btn btn-primary" onclick="window.Resource.submitComment()">
                POST COMMENT
              </button>
            </div>
          ` : `
            <div class="auth-required-comment">
              <p>Please <a href="#" onclick="window.auth.showAuthModal('login')">login</a> to comment.</p>
            </div>
          `}
          
          <div class="comments-list">
            ${this.renderComments()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = resourceHTML;
    this.setupEventListeners();
  }

  renderComments() {
    if (this.comments.length === 0) {
      return `
        <div class="no-comments">
          <div class="no-comments-icon">💬</div>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
    }

    return this.comments.map(comment => `
      <div class="comment" data-comment-id="${comment._id}">
        <div class="comment-header">
          <span class="comment-author">${comment.author?.username || 'Anonymous'}</span>
          <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
          
          ${comment.author?._id === this.getCurrentUserId() ? `
            <div class="comment-actions">
              <button class="btn-icon" onclick="window.Resource.editComment('${comment._id}')">✏️</button>
              <button class="btn-icon" onclick="window.Resource.deleteComment('${comment._id}')">🗑️</button>
            </div>
          ` : ''}
        </div>
        
        <div class="comment-content">
          <p>${comment.content}</p>
        </div>
        
        <div class="comment-footer">
          <button class="vote-btn upvote ${comment.userVote === 'up' ? 'voted' : ''}" 
                  onclick="window.Resource.voteComment('${comment._id}', 'up')">
            ↑ ${comment.upvotes || 0}
          </button>
          <button class="vote-btn downvote ${comment.userVote === 'down' ? 'voted' : ''}" 
                  onclick="window.Resource.voteComment('${comment._id}', 'down')">
            ↓ ${comment.downvotes || 0}
          </button>
          <button class="btn-text" onclick="window.Resource.replyToComment('${comment._id}')">
            Reply
          </button>
        </div>
        
        ${comment.replies && comment.replies.length > 0 ? `
          <div class="comment-replies">
            ${comment.replies.map(reply => this.renderReply(reply)).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  renderReply(reply) {
    return `
      <div class="comment-reply">
        <div class="comment-header">
          <span class="comment-author">${reply.author?.username || 'Anonymous'}</span>
          <span class="comment-date">${new Date(reply.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="comment-content">
          <p>${reply.content}</p>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Comment textarea listener
    const commentTextarea = document.getElementById('new-comment');
    if (commentTextarea) {
      commentTextarea.addEventListener('input', (e) => {
        this.newComment = e.target.value;
      });
    }
  }

  // Voting methods
  async vote(direction) {
    if (!localStorage.getItem('token')) {
      if (window.auth) {
        window.auth.showAuthModal('login');
      }
      return;
    }

    try {
      let response;
      if (window.api) {
        response = await window.api.voteResource(this.resourceId, direction);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${this.resourceId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ vote: direction })
        });
        response = await res.json();
      }

      if (response.success) {
        // Update resource vote counts
        this.resource.upvotes = response.upvotes;
        this.resource.downvotes = response.downvotes;
        this.resource.userVote = response.userVote;
        
        // Re-render voting section
        this.updateVotingDisplay();
        
        if (window.notificationManager) {
          window.notificationManager.show('Vote recorded!', 'success');
        }
      } else {
        throw new Error(response.message || 'Failed to vote');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      if (window.notificationManager) {
        window.notificationManager.show('Failed to vote. Please try again.', 'error');
      }
    }
  }

  async voteComment(commentId, direction) {
    if (!localStorage.getItem('token')) {
      if (window.auth) {
        window.auth.showAuthModal('login');
      }
      return;
    }

    try {
      let response;
      if (window.api) {
        response = await window.api.voteComment(commentId, direction);
      } else {
        const res = await fetch(`http://localhost:3001/api/comments/${commentId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ vote: direction })
        });
        response = await res.json();
      }

      if (response.success) {
        // Update comment in local state
        const comment = this.comments.find(c => c._id === commentId);
        if (comment) {
          comment.upvotes = response.upvotes;
          comment.downvotes = response.downvotes;
          comment.userVote = response.userVote;
        }
        
        // Re-render comments
        this.updateCommentsDisplay();
      }
    } catch (error) {
      console.error('Failed to vote on comment:', error);
    }
  }

  // Comment methods
  async submitComment() {
    const commentText = document.getElementById('new-comment')?.value.trim();
    
    if (!commentText) {
      if (window.notificationManager) {
        window.notificationManager.show('Please enter a comment.', 'warning');
      }
      return;
    }

    if (!localStorage.getItem('token')) {
      if (window.auth) {
        window.auth.showAuthModal('login');
      }
      return;
    }

    try {
      let response;
      if (window.api) {
        response = await window.api.createComment(this.resourceId, commentText);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${this.resourceId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content: commentText })
        });
        response = await res.json();
      }

      if (response.success) {
        // Clear comment form
        document.getElementById('new-comment').value = '';
        this.newComment = '';
        
        // Reload comments
        await this.loadComments();
        this.updateCommentsDisplay();
        
        if (window.notificationManager) {
          window.notificationManager.show('Comment posted!', 'success');
        }
      } else {
        throw new Error(response.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      if (window.notificationManager) {
        window.notificationManager.show('Failed to post comment. Please try again.', 'error');
      }
    }
  }

  async deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      let response;
      if (window.api) {
        response = await window.api.deleteComment(commentId);
      } else {
        const res = await fetch(`http://localhost:3001/api/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        response = await res.json();
      }

      if (response.success) {
        // Remove comment from local state
        this.comments = this.comments.filter(c => c._id !== commentId);
        this.updateCommentsDisplay();
        
        if (window.notificationManager) {
          window.notificationManager.show('Comment deleted!', 'success');
        }
      } else {
        throw new Error(response.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      if (window.notificationManager) {
        window.notificationManager.show('Failed to delete comment.', 'error');
      }
    }
  }

  // Action methods
  shareResource() {
    if (navigator.share) {
      navigator.share({
        title: this.resource.title,
        text: this.resource.description,
        url: this.resource.url
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(this.resource.url).then(() => {
        if (window.notificationManager) {
          window.notificationManager.show('URL copied to clipboard!', 'success');
        }
      });
    }
  }

  bookmarkResource() {
    console.log('🔖 Bookmark not implemented yet');
    if (window.notificationManager) {
      window.notificationManager.show('Bookmarking coming soon!', 'info');
    }
  }

  reportResource() {
    if (confirm('Are you sure you want to report this resource?')) {
      console.log('⚠️ Report not implemented yet');
      if (window.notificationManager) {
        window.notificationManager.show('Reporting functionality coming soon!', 'info');
      }
    }
  }

  // Utility methods
  getCurrentUserId() {
    // This would normally come from auth state
    return localStorage.getItem('userId');
  }

  updateVotingDisplay() {
    const container = document.querySelector('.resource-voting');
    if (container) {
      container.innerHTML = `
        <button class="vote-btn upvote ${this.resource.userVote === 'up' ? 'voted' : ''}" 
                onclick="window.Resource.vote('up')">
          ↑
        </button>
        <span class="vote-count">${(this.resource.upvotes || 0) - (this.resource.downvotes || 0)}</span>
        <button class="vote-btn downvote ${this.resource.userVote === 'down' ? 'voted' : ''}" 
                onclick="window.Resource.vote('down')">
          ↓
        </button>
      `;
    }
  }

  updateCommentsDisplay() {
    const container = document.querySelector('.comments-list');
    if (container) {
      container.innerHTML = this.renderComments();
    }
  }

  showLoading() {
    const container = document.getElementById('resource-content');
    if (container) {
      container.innerHTML = `
        <div class="loading-resource">
          <div class="loading-spinner">⟲</div>
          <p>ACCESSING DATA STREAM...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('resource-content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>ERROR</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="history.back()">GO BACK</button>
        </div>
      `;
    }
  }

  // Method to view specific resource (called from other components)
  static viewResource(resourceId) {
    window.currentResourceId = resourceId;
    if (window.app) {
      window.app.navigateToPage('resource');
    } else {
      // Fallback navigation
      window.location.hash = `#resource/${resourceId}`;
      window.Resource = new Resource();
    }
  }

  refresh() {
    this.loadResource();
  }
}

// Initialize Resource component and make it globally available
window.Resource = new Resource();
