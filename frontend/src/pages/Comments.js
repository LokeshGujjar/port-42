// 💬 Comments Component
// Standalone comments interface for embedded use

class Comments {
  constructor(resourceId) {
    this.resourceId = resourceId;
    this.comments = [];
    this.isLoading = false;
    this.newComment = '';
    this.replyingTo = null;
    
    if (resourceId) {
      this.init();
    }
  }

  init() {
    console.log('💬 Comments component initializing for resource:', this.resourceId);
    this.loadComments();
  }

  async loadComments() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      console.log('📡 Loading comments for resource:', this.resourceId);

      let response;
      if (window.api) {
        response = await window.api.getComments(this.resourceId);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${this.resourceId}/comments`);
        response = await res.json();
      }

      if (response.success) {
        this.comments = response.comments || [];
        this.renderComments();
      } else {
        throw new Error(response.message || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      this.showError('Failed to load comments. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  renderComments(containerId = 'comments-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('Comments container not found:', containerId);
      return;
    }

    const commentsHTML = `
      <div class="comments-section">
        <div class="comments-header">
          <h3>COMMENTS (${this.comments.length})</h3>
          <button class="btn btn-secondary" onclick="window.Comments.refresh()">
            🔄 REFRESH
          </button>
        </div>
        
        ${this.renderCommentForm()}
        
        <div class="comments-list">
          ${this.renderCommentsList()}
        </div>
      </div>
    `;

    container.innerHTML = commentsHTML;
    this.setupEventListeners();
  }

  renderCommentForm() {
    if (!localStorage.getItem('token')) {
      return `
        <div class="auth-required-comment">
          <p>Please <a href="#" onclick="window.auth.showAuthModal('login')">login</a> to comment.</p>
        </div>
      `;
    }

    return `
      <div class="comment-form">
        <div class="form-header">
          ${this.replyingTo ? `
            <span class="replying-to">
              Replying to ${this.replyingTo.author?.username}
              <button class="btn-cancel" onclick="window.Comments.cancelReply()">✕</button>
            </span>
          ` : ''}
        </div>
        
        <textarea 
          id="new-comment" 
          placeholder="${this.replyingTo ? 'Write your reply...' : 'Add your thoughts...'}"
          value="${this.newComment}"></textarea>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="window.Comments.submitComment()">
            ${this.replyingTo ? 'POST REPLY' : 'POST COMMENT'}
          </button>
          
          ${this.replyingTo ? `
            <button class="btn btn-secondary" onclick="window.Comments.cancelReply()">
              CANCEL
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderCommentsList() {
    if (this.comments.length === 0) {
      return `
        <div class="no-comments">
          <div class="no-comments-icon">💬</div>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
    }

    // Sort comments by date (newest first) and separate top-level from replies
    const topLevelComments = this.comments
      .filter(comment => !comment.parentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return topLevelComments.map(comment => this.renderComment(comment)).join('');
  }

  renderComment(comment, isReply = false) {
    const replies = this.comments
      .filter(c => c.parentId === comment._id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return `
      <div class="comment ${isReply ? 'comment-reply' : ''}" data-comment-id="${comment._id}">
        <div class="comment-content">
          <div class="comment-header">
            <div class="comment-author-info">
              <span class="comment-author">${comment.author?.username || 'Anonymous'}</span>
              <span class="comment-date" title="${new Date(comment.createdAt).toLocaleString()}">
                ${this.timeAgo(comment.createdAt)}
              </span>
            </div>
            
            ${comment.author?._id === this.getCurrentUserId() ? `
              <div class="comment-actions">
                <button class="btn-icon" onclick="window.Comments.editComment('${comment._id}')" title="Edit">
                  ✏️
                </button>
                <button class="btn-icon" onclick="window.Comments.deleteComment('${comment._id}')" title="Delete">
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>
          
          <div class="comment-text">
            <p>${this.formatCommentText(comment.content)}</p>
          </div>
          
          <div class="comment-footer">
            <div class="comment-votes">
              <button class="vote-btn upvote ${comment.userVote === 'up' ? 'voted' : ''}" 
                      onclick="window.Comments.voteComment('${comment._id}', 'up')">
                ↑ <span class="vote-count">${comment.upvotes || 0}</span>
              </button>
              <button class="vote-btn downvote ${comment.userVote === 'down' ? 'voted' : ''}" 
                      onclick="window.Comments.voteComment('${comment._id}', 'down')">
                ↓ <span class="vote-count">${comment.downvotes || 0}</span>
              </button>
            </div>
            
            ${!isReply && localStorage.getItem('token') ? `
              <button class="btn-text" onclick="window.Comments.replyToComment('${comment._id}')">
                Reply
              </button>
            ` : ''}
            
            <button class="btn-text" onclick="window.Comments.reportComment('${comment._id}')">
              Report
            </button>
          </div>
        </div>
        
        ${replies.length > 0 ? `
          <div class="comment-replies">
            ${replies.map(reply => this.renderComment(reply, true)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  formatCommentText(text) {
    // Basic text formatting - convert URLs to links, mentions, etc.
    return text
      .replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank" rel="noopener">$&</a>')
      .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
      .replace(/\n/g, '<br>');
  }

  setupEventListeners() {
    // Comment textarea listener
    const commentTextarea = document.getElementById('new-comment');
    if (commentTextarea) {
      commentTextarea.addEventListener('input', (e) => {
        this.newComment = e.target.value;
      });

      // Auto-resize textarea
      commentTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });

      // Handle Ctrl+Enter to submit
      commentTextarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          this.submitComment();
        }
      });
    }
  }

  // Comment submission methods
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
      const commentData = {
        content: commentText,
        parentId: this.replyingTo ? this.replyingTo._id : null
      };

      let response;
      if (window.api) {
        response = await window.api.createComment(this.resourceId, commentData.content, commentData.parentId);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${this.resourceId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(commentData)
        });
        response = await res.json();
      }

      if (response.success) {
        // Clear comment form
        document.getElementById('new-comment').value = '';
        this.newComment = '';
        this.replyingTo = null;
        
        // Reload comments
        await this.loadComments();
        
        if (window.notificationManager) {
          window.notificationManager.show(
            this.replyingTo ? 'Reply posted!' : 'Comment posted!', 
            'success'
          );
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

  // Voting methods
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
        
        // Update specific comment display
        this.updateCommentVotes(commentId, response);
      }
    } catch (error) {
      console.error('Failed to vote on comment:', error);
      if (window.notificationManager) {
        window.notificationManager.show('Failed to vote. Please try again.', 'error');
      }
    }
  }

  updateCommentVotes(commentId, voteData) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      const upvoteBtn = commentElement.querySelector('.upvote');
      const downvoteBtn = commentElement.querySelector('.downvote');
      
      if (upvoteBtn) {
        upvoteBtn.className = `vote-btn upvote ${voteData.userVote === 'up' ? 'voted' : ''}`;
        upvoteBtn.querySelector('.vote-count').textContent = voteData.upvotes || 0;
      }
      
      if (downvoteBtn) {
        downvoteBtn.className = `vote-btn downvote ${voteData.userVote === 'down' ? 'voted' : ''}`;
        downvoteBtn.querySelector('.vote-count').textContent = voteData.downvotes || 0;
      }
    }
  }

  // Reply methods
  replyToComment(commentId) {
    const comment = this.comments.find(c => c._id === commentId);
    if (comment) {
      this.replyingTo = comment;
      this.renderComments(); // Re-render to show reply form
      
      // Focus on textarea
      const textarea = document.getElementById('new-comment');
      if (textarea) {
        textarea.focus();
      }
    }
  }

  cancelReply() {
    this.replyingTo = null;
    this.newComment = '';
    this.renderComments(); // Re-render to hide reply form
  }

  // Comment management methods
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
        this.renderComments();
        
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

  editComment(commentId) {
    console.log('✏️ Edit comment not implemented yet:', commentId);
    if (window.notificationManager) {
      window.notificationManager.show('Comment editing coming soon!', 'info');
    }
  }

  reportComment(commentId) {
    if (confirm('Are you sure you want to report this comment?')) {
      console.log('⚠️ Report comment not implemented yet:', commentId);
      if (window.notificationManager) {
        window.notificationManager.show('Comment reporting coming soon!', 'info');
      }
    }
  }

  // Utility methods
  getCurrentUserId() {
    // This would normally come from auth state
    return localStorage.getItem('userId');
  }

  timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  showLoading() {
    const container = document.getElementById('comments-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-comments">
          <div class="loading-spinner">⟲</div>
          <p>LOADING COMMENTS...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('comments-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>ERROR</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="window.Comments.loadComments()">RETRY</button>
        </div>
      `;
    }
  }

  refresh() {
    this.loadComments();
  }

  // Static method to create comments component for a resource
  static create(resourceId, containerId = 'comments-container') {
    const commentsInstance = new Comments(resourceId);
    commentsInstance.renderComments(containerId);
    return commentsInstance;
  }
}

// Make Comments available globally
window.Comments = Comments;
