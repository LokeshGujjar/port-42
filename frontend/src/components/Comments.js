// 💬 Comments Component for Port42
// Handles comment display and real-time interactions

class Comments {
  constructor() {
    this.comments = [];
    this.currentResourceId = null;
    this.socket = window.socketManager;
    
    // Set up socket listeners
    this.setupSocketListeners();
  }

  // Setup real-time socket listeners
  setupSocketListeners() {
    if (this.socket) {
      this.socket.on('commentAdded', (data) => {
        this.handleNewComment(data);
      });
    }
  }

  // Render comments section
  render(container, comments, resourceId) {
    this.comments = comments || [];
    this.currentResourceId = resourceId;
    
    container.innerHTML = `
      <div class="comments-section">
        <div class="comments-header">
          <h4>NEURAL FEEDBACK (${this.comments.length})</h4>
        </div>
        
        ${window.auth.isAuthenticated ? this.renderCommentForm() : this.renderLoginPrompt()}
        
        <div class="comments-list">
          ${this.comments.length > 0 ? this.renderCommentsList() : this.renderEmptyState()}
        </div>
      </div>
    `;
    
    this.setupEventListeners(container);
  }

  // Render comment form
  renderCommentForm() {
    return `
      <div class="comment-form">
        <div class="comment-input-group">
          <textarea id="comment-input" class="cyber-textarea" 
                    placeholder="Share your neural patterns..." 
                    rows="3"></textarea>
          <button id="submit-comment" class="btn btn-primary">TRANSMIT</button>
        </div>
      </div>
    `;
  }

  // Render login prompt
  renderLoginPrompt() {
    return `
      <div class="comment-login-prompt">
        <p>ACCESS REQUIRED TO SHARE NEURAL FEEDBACK</p>
        <button class="btn btn-primary" onclick="window.auth.showAuthModal('login')">
          AUTHENTICATE
        </button>
      </div>
    `;
  }

  // Render comments list
  renderCommentsList() {
    return this.comments.map(comment => this.renderComment(comment)).join('');
  }

  // Render single comment
  renderComment(comment) {
    const timeAgo = this.getTimeAgo(comment.createdAt);
    const isAuthor = window.auth.user && window.auth.user._id === comment.author._id;
    
    return `
      <div class="comment" data-id="${comment._id}">
        <div class="comment-header">
          <div class="comment-author">
            <span class="author-avatar">${comment.author.username.charAt(0).toUpperCase()}</span>
            <span class="author-name">${comment.author.username}</span>
            <span class="author-level">LVL ${comment.author.level || 1}</span>
          </div>
          <div class="comment-time">${timeAgo}</div>
        </div>
        
        <div class="comment-content">
          ${this.formatCommentText(comment.content)}
        </div>
        
        <div class="comment-actions">
          <div class="comment-votes">
            <button class="vote-btn upvote ${comment.userVote === 'up' ? 'active' : ''}" 
                    data-id="${comment._id}" data-type="up">
              ▲ ${comment.upvotes || 0}
            </button>
            <button class="vote-btn downvote ${comment.userVote === 'down' ? 'active' : ''}" 
                    data-id="${comment._id}" data-type="down">
              ▼ ${comment.downvotes || 0}
            </button>
          </div>
          
          <button class="reply-btn" onclick="window.Comments.showReplyForm('${comment._id}')">
            REPLY
          </button>
          
          ${isAuthor ? `
            <button class="delete-btn" onclick="window.Comments.deleteComment('${comment._id}')">
              DELETE
            </button>
          ` : ''}
        </div>
        
        <div id="reply-form-${comment._id}" class="reply-form hidden">
          <!-- Reply form will be inserted here -->
        </div>
        
        <div class="comment-replies">
          ${comment.replies?.map(reply => this.renderReply(reply)).join('') || ''}
        </div>
      </div>
    `;
  }

  // Render reply
  renderReply(reply) {
    const timeAgo = this.getTimeAgo(reply.createdAt);
    const isAuthor = window.auth.user && window.auth.user._id === reply.author._id;
    
    return `
      <div class="comment-reply" data-id="${reply._id}">
        <div class="comment-header">
          <div class="comment-author">
            <span class="author-avatar">${reply.author.username.charAt(0).toUpperCase()}</span>
            <span class="author-name">${reply.author.username}</span>
          </div>
          <div class="comment-time">${timeAgo}</div>
        </div>
        
        <div class="comment-content">
          ${this.formatCommentText(reply.content)}
        </div>
        
        <div class="comment-actions">
          <div class="comment-votes">
            <button class="vote-btn upvote ${reply.userVote === 'up' ? 'active' : ''}" 
                    data-id="${reply._id}" data-type="up">
              ▲ ${reply.upvotes || 0}
            </button>
          </div>
          
          ${isAuthor ? `
            <button class="delete-btn" onclick="window.Comments.deleteComment('${reply._id}')">
              DELETE
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Render empty state
  renderEmptyState() {
    return `
      <div class="comments-empty">
        <div class="empty-icon">💭</div>
        <p>NO NEURAL FEEDBACK YET</p>
        <p>Be the first to share your thoughts!</p>
      </div>
    `;
  }

  // Setup event listeners
  setupEventListeners(container) {
    // Submit comment
    const submitBtn = container.querySelector('#submit-comment');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitComment());
    }
    
    // Enter key in textarea
    const textarea = container.querySelector('#comment-input');
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.submitComment();
        }
      });
    }
    
    // Vote buttons
    const voteButtons = container.querySelectorAll('.vote-btn');
    voteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleVote(e));
    });
  }

  // Submit new comment
  async submitComment() {
    if (!window.auth.isAuthenticated) {
      window.auth.showAuthModal('login');
      return;
    }
    
    const textarea = document.getElementById('comment-input');
    const content = textarea.value.trim();
    
    if (!content) {
      window.notificationManager?.show('Comment cannot be empty', 'warning');
      return;
    }
    
    try {
      const response = await window.api.addComment(this.currentResourceId, { content });
      
      if (response.success) {
        // Clear input
        textarea.value = '';
        
        // Add comment to list
        this.addComment(response.comment);
        
        // Send real-time update
        if (this.socket) {
          this.socket.sendComment(this.currentResourceId, response.comment);
        }
        
        window.notificationManager?.show('Comment transmitted', 'success');
      }
      
    } catch (error) {
      console.error('Failed to submit comment:', error);
      window.notificationManager?.show('Failed to transmit comment', 'error');
    }
  }

  // Handle voting on comments
  async handleVote(e) {
    e.preventDefault();
    
    if (!window.auth.isAuthenticated) {
      window.auth.showAuthModal('login');
      return;
    }
    
    const button = e.target;
    const commentId = button.dataset.id;
    const voteType = button.dataset.type;
    
    try {
      const response = await window.api.voteComment(commentId, voteType);
      
      if (response.success) {
        this.updateCommentVotes(button, response.votes);
      }
      
    } catch (error) {
      console.error('Vote failed:', error);
      window.notificationManager?.show('Vote failed', 'error');
    }
  }

  // Update comment vote display
  updateCommentVotes(clickedButton, votes) {
    const container = clickedButton.closest('.comment-votes');
    const upBtn = container.querySelector('.upvote');
    const downBtn = container.querySelector('.downvote');
    
    // Reset active states
    upBtn?.classList.remove('active');
    downBtn?.classList.remove('active');
    
    // Update counts
    if (upBtn) upBtn.innerHTML = `▲ ${votes.upvotes}`;
    if (downBtn) downBtn.innerHTML = `▼ ${votes.downvotes}`;
    
    // Set active state
    if (votes.userVote === 'up') {
      upBtn?.classList.add('active');
    } else if (votes.userVote === 'down') {
      downBtn?.classList.add('active');
    }
  }

  // Show reply form
  showReplyForm(commentId) {
    if (!window.auth.isAuthenticated) {
      window.auth.showAuthModal('login');
      return;
    }
    
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
      replyForm.innerHTML = `
        <div class="reply-input-group">
          <textarea id="reply-input-${commentId}" class="cyber-textarea" 
                    placeholder="Neural response..." rows="2"></textarea>
          <div class="reply-actions">
            <button class="btn btn-primary btn-small" 
                    onclick="window.Comments.submitReply('${commentId}')">
              REPLY
            </button>
            <button class="btn btn-secondary btn-small" 
                    onclick="window.Comments.hideReplyForm('${commentId}')">
              CANCEL
            </button>
          </div>
        </div>
      `;
      replyForm.classList.remove('hidden');
    }
  }

  // Hide reply form
  hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
      replyForm.classList.add('hidden');
      replyForm.innerHTML = '';
    }
  }

  // Submit reply
  async submitReply(commentId) {
    const textarea = document.getElementById(`reply-input-${commentId}`);
    const content = textarea.value.trim();
    
    if (!content) {
      window.notificationManager?.show('Reply cannot be empty', 'warning');
      return;
    }
    
    try {
      const response = await window.api.replyToComment(commentId, { content });
      
      if (response.success) {
        // Hide reply form
        this.hideReplyForm(commentId);
        
        // Add reply to comment
        this.addReply(commentId, response.reply);
        
        window.notificationManager?.show('Reply transmitted', 'success');
      }
      
    } catch (error) {
      console.error('Failed to submit reply:', error);
      window.notificationManager?.show('Failed to transmit reply', 'error');
    }
  }

  // Delete comment
  async deleteComment(commentId) {
    if (!confirm('Delete this neural feedback?')) return;
    
    try {
      const response = await window.api.deleteComment(commentId);
      
      if (response.success) {
        // Remove comment from DOM
        const commentEl = document.querySelector(`[data-id="${commentId}"]`);
        if (commentEl) {
          commentEl.remove();
        }
        
        // Update count
        this.comments = this.comments.filter(c => c._id !== commentId);
        const header = document.querySelector('.comments-header h4');
        if (header) {
          header.textContent = `NEURAL FEEDBACK (${this.comments.length})`;
        }
        
        window.notificationManager?.show('Comment deleted', 'info');
      }
      
    } catch (error) {
      console.error('Failed to delete comment:', error);
      window.notificationManager?.show('Failed to delete comment', 'error');
    }
  }

  // Add new comment to list
  addComment(comment) {
    this.comments.unshift(comment);
    
    const commentsList = document.querySelector('.comments-list');
    if (commentsList) {
      // If empty state, replace it
      if (commentsList.querySelector('.comments-empty')) {
        commentsList.innerHTML = '';
      }
      
      // Add new comment at top
      commentsList.insertAdjacentHTML('afterbegin', this.renderComment(comment));
      
      // Update count
      const header = document.querySelector('.comments-header h4');
      if (header) {
        header.textContent = `NEURAL FEEDBACK (${this.comments.length})`;
      }
    }
  }

  // Add reply to comment
  addReply(commentId, reply) {
    const comment = this.comments.find(c => c._id === commentId);
    if (comment) {
      if (!comment.replies) comment.replies = [];
      comment.replies.push(reply);
      
      // Update DOM
      const repliesContainer = document.querySelector(`[data-id="${commentId}"] .comment-replies`);
      if (repliesContainer) {
        repliesContainer.insertAdjacentHTML('beforeend', this.renderReply(reply));
      }
    }
  }

  // Handle new comment from socket
  handleNewComment(data) {
    if (data.resourceId === this.currentResourceId) {
      this.addComment(data.comment);
    }
  }

  // Format comment text
  formatCommentText(text) {
    // Simple formatting: preserve line breaks and basic HTML escaping
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
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
window.Comments = new Comments();
