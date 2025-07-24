// 👥 Community Detail Component
// Shows community information, members, and resources

class Community {
  constructor() {
    this.community = null;
    this.communityResources = [];
    this.members = [];
    this.communityId = null;
    this.isLoading = false;
    this.isMember = false;
    
    this.init();
  }

  init() {
    console.log('👥 Community component initializing...');
    
    // Get community ID from URL params or route state
    this.communityId = this.getCommunityIdFromUrl();
    
    if (this.communityId) {
      this.loadCommunity();
    } else {
      this.showError('No community specified');
    }
  }

  getCommunityIdFromUrl() {
    // In a simple implementation, we might store this in app state
    if (window.currentCommunityId) {
      return window.currentCommunityId;
    }
    
    // Or check URL hash
    const hash = window.location.hash;
    const match = hash.match(/community\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async loadCommunity() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      console.log('📡 Loading community:', this.communityId);

      // Load community details
      let communityResponse;
      if (window.api) {
        communityResponse = await window.api.getCommunity(this.communityId);
      } else {
        const res = await fetch(`http://localhost:3001/api/communities/${this.communityId}`, {
          headers: localStorage.getItem('token') ? {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } : {}
        });
        communityResponse = await res.json();
      }

      if (communityResponse.success) {
        this.community = communityResponse.community;
        this.isMember = communityResponse.isMember || false;
        
        // Load community resources and members in parallel
        await Promise.all([
          this.loadCommunityResources(),
          this.loadMembers()
        ]);
        
        this.renderCommunity();
      } else {
        throw new Error(communityResponse.message || 'Community not found');
      }
    } catch (error) {
      console.error('Failed to load community:', error);
      this.showError('Failed to load community. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async loadCommunityResources() {
    try {
      let response;
      if (window.api) {
        response = await window.api.getResources({ community: this.communityId });
      } else {
        const res = await fetch(`http://localhost:3001/api/resources?community=${this.communityId}`);
        response = await res.json();
      }

      if (response.success) {
        this.communityResources = response.resources || [];
      }
    } catch (error) {
      console.error('Failed to load community resources:', error);
    }
  }

  async loadMembers() {
    try {
      let response;
      if (window.api) {
        response = await window.api.getCommunityMembers(this.communityId);
      } else {
        const res = await fetch(`http://localhost:3001/api/communities/${this.communityId}/members`);
        response = await res.json();
      }

      if (response.success) {
        this.members = response.members || [];
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }

  renderCommunity() {
    const container = document.getElementById('community-content');
    if (!container) return;

    const communityHTML = `
      <div class="community-detail-container">
        <!-- Community Header -->
        <div class="community-header">
          <button class="btn btn-secondary back-btn" onclick="history.back()">
            ← BACK
          </button>
          
          <div class="community-info">
            <div class="community-avatar">
              <span class="avatar-text">${this.community.name.charAt(0).toUpperCase()}</span>
            </div>
            
            <div class="community-details">
              <h1 class="community-name">${this.community.name}</h1>
              <p class="community-description">${this.community.description || 'No description available'}</p>
              
              <div class="community-stats">
                <span class="stat">👥 ${this.members.length} members</span>
                <span class="stat">📡 ${this.communityResources.length} resources</span>
                <span class="stat">📅 Created ${new Date(this.community.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="community-actions">
              ${localStorage.getItem('token') ? `
                <button class="btn ${this.isMember ? 'btn-danger' : 'btn-primary'}" 
                        onclick="window.Community.toggleMembership()">
                  ${this.isMember ? 'LEAVE COMMUNITY' : 'JOIN COMMUNITY'}
                </button>
              ` : `
                <button class="btn btn-primary" onclick="window.auth.showAuthModal('login')">
                  LOGIN TO JOIN
                </button>
              `}
              
              <button class="btn btn-secondary" onclick="window.Community.shareCommunity()">
                📤 SHARE
              </button>
            </div>
          </div>
        </div>

        <!-- Community Navigation -->
        <div class="community-tabs">
          <button class="tab-btn active" data-tab="resources">RESOURCES</button>
          <button class="tab-btn" data-tab="members">MEMBERS</button>
          <button class="tab-btn" data-tab="about">ABOUT</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Resources Tab -->
          <div id="resources-tab" class="tab-pane active">
            ${this.renderCommunityResources()}
          </div>

          <!-- Members Tab -->
          <div id="members-tab" class="tab-pane">
            ${this.renderMembers()}
          </div>

          <!-- About Tab -->
          <div id="about-tab" class="tab-pane">
            ${this.renderAbout()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = communityHTML;
    this.setupTabListeners();
  }

  renderCommunityResources() {
    if (this.communityResources.length === 0) {
      return `
        <div class="no-resources">
          <div class="no-resources-icon">📡</div>
          <h3>NO RESOURCES YET</h3>
          <p>This community doesn't have any resources yet.</p>
          ${this.isMember ? `
            <button class="btn btn-primary" onclick="window.app.navigateToPage('submit')">
              SHARE FIRST RESOURCE
            </button>
          ` : ''}
        </div>
      `;
    }

    const resourcesHTML = this.communityResources.map(resource => `
      <div class="resource-card" onclick="window.Resource.viewResource('${resource._id}')">
        <div class="resource-header">
          <h4 class="resource-title">${resource.title}</h4>
          <span class="resource-type ${resource.type}">${resource.type.toUpperCase()}</span>
        </div>
        
        <p class="resource-description">${resource.description || 'No description'}</p>
        
        <div class="resource-meta">
          <span class="resource-author">by ${resource.author?.username || 'Unknown'}</span>
          <span class="resource-votes">↑ ${resource.upvotes || 0} ↓ ${resource.downvotes || 0}</span>
          <span class="resource-comments">💬 ${resource.commentsCount || 0}</span>
          <span class="resource-date">${this.timeAgo(resource.createdAt)}</span>
        </div>
        
        ${resource.tags && resource.tags.length > 0 ? `
          <div class="resource-tags">
            ${resource.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="community-resources">
        <div class="resources-header">
          <h3>COMMUNITY RESOURCES</h3>
          ${this.isMember ? `
            <button class="btn btn-primary" onclick="window.app.navigateToPage('submit')">
              ADD RESOURCE
            </button>
          ` : ''}
        </div>
        
        <div class="resources-list">
          ${resourcesHTML}
        </div>
      </div>
    `;
  }

  renderMembers() {
    if (this.members.length === 0) {
      return `
        <div class="no-members">
          <div class="no-members-icon">👥</div>
          <h3>NO MEMBERS YET</h3>
          <p>Be the first to join this community!</p>
        </div>
      `;
    }

    const membersHTML = this.members.map(member => `
      <div class="member-card">
        <div class="member-avatar">
          <span class="avatar-text">${member.username.charAt(0).toUpperCase()}</span>
        </div>
        
        <div class="member-info">
          <h4 class="member-name">${member.username}</h4>
          <p class="member-role">${member.role || 'Member'}</p>
          <p class="member-joined">Joined ${new Date(member.joinedAt || member.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="member-stats">
          <span class="stat">📡 ${member.resourcesCount || 0}</span>
          <span class="stat">⭐ ${member.reputation || 0}</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="community-members">
        <h3>COMMUNITY MEMBERS (${this.members.length})</h3>
        <div class="members-list">
          ${membersHTML}
        </div>
      </div>
    `;
  }

  renderAbout() {
    return `
      <div class="community-about">
        <div class="about-section">
          <h3>ABOUT ${this.community.name.toUpperCase()}</h3>
          <p>${this.community.description || 'No description available.'}</p>
        </div>
        
        <div class="about-section">
          <h4>COMMUNITY RULES</h4>
          <ul class="rules-list">
            <li>Be respectful to all members</li>
            <li>Share relevant and quality resources</li>
            <li>No spam or self-promotion</li>
            <li>Follow the cyberpunk ethos</li>
            <li>Help others when possible</li>
          </ul>
        </div>
        
        <div class="about-section">
          <h4>COMMUNITY STATS</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">${this.members.length}</span>
              <span class="stat-label">Total Members</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.communityResources.length}</span>
              <span class="stat-label">Resources Shared</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.getTotalVotes()}</span>
              <span class="stat-label">Total Votes</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.getActiveMembers()}</span>
              <span class="stat-label">Active This Week</span>
            </div>
          </div>
        </div>
        
        <div class="about-section">
          <h4>MODERATORS</h4>
          <div class="moderators-list">
            ${this.renderModerators()}
          </div>
        </div>
      </div>
    `;
  }

  renderModerators() {
    const moderators = this.members.filter(member => member.role === 'moderator' || member.role === 'admin');
    
    if (moderators.length === 0) {
      return '<p>No moderators assigned yet.</p>';
    }
    
    return moderators.map(mod => `
      <div class="moderator-item">
        <span class="moderator-name">${mod.username}</span>
        <span class="moderator-role">${mod.role}</span>
      </div>
    `).join('');
  }

  setupTabListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Remove active class from all tabs
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
      });
    });
  }

  // Community action methods
  async toggleMembership() {
    if (!localStorage.getItem('token')) {
      if (window.auth) {
        window.auth.showAuthModal('login');
      }
      return;
    }

    const action = this.isMember ? 'leave' : 'join';
    
    try {
      let response;
      if (window.api) {
        response = this.isMember 
          ? await window.api.leaveCommunity(this.communityId)
          : await window.api.joinCommunity(this.communityId);
      } else {
        const res = await fetch(`http://localhost:3001/api/communities/${this.communityId}/${action}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        response = await res.json();
      }

      if (response.success) {
        this.isMember = !this.isMember;
        
        // Update member count
        if (this.isMember) {
          this.members.push({ username: 'You', joinedAt: new Date() });
        } else {
          // Remove current user from members list (simplified)
          this.members.pop();
        }
        
        // Re-render the community
        this.renderCommunity();
        
        const message = this.isMember ? 'Joined community!' : 'Left community!';
        if (window.notificationManager) {
          window.notificationManager.show(message, 'success');
        }
      } else {
        throw new Error(response.message || `Failed to ${action} community`);
      }
    } catch (error) {
      console.error(`Failed to ${action} community:`, error);
      if (window.notificationManager) {
        window.notificationManager.show(`Failed to ${action} community.`, 'error');
      }
    }
  }

  shareCommunity() {
    const communityUrl = `${window.location.origin}${window.location.pathname}#community/${this.communityId}`;
    
    if (navigator.share) {
      navigator.share({
        title: this.community.name,
        text: this.community.description,
        url: communityUrl
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(communityUrl).then(() => {
        if (window.notificationManager) {
          window.notificationManager.show('Community URL copied to clipboard!', 'success');
        }
      });
    }
  }

  // Utility methods
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

  getTotalVotes() {
    return this.communityResources.reduce((total, resource) => {
      return total + (resource.upvotes || 0) + (resource.downvotes || 0);
    }, 0);
  }

  getActiveMembers() {
    // Simplified - in real app would check actual activity
    return Math.floor(this.members.length * 0.3);
  }

  showLoading() {
    const container = document.getElementById('community-content');
    if (container) {
      container.innerHTML = `
        <div class="loading-community">
          <div class="loading-spinner">⟲</div>
          <p>CONNECTING TO COMMUNITY NODE...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('community-content');
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

  // Static method to view specific community (called from other components)
  static viewCommunity(communityId) {
    window.currentCommunityId = communityId;
    if (window.app) {
      window.app.navigateToPage('community');
    } else {
      // Fallback navigation
      window.location.hash = `#community/${communityId}`;
      window.Community = new Community();
    }
  }

  refresh() {
    this.loadCommunity();
  }
}

// Initialize Community component and make it globally available
window.Community = new Community();
