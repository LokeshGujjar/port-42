// 👤 Profile Page Component
// Displays user profile, submissions, and statistics

class Profile {
  constructor() {
    this.user = null;
    this.userResources = [];
    this.userStats = {};
    this.isLoading = false;
    
    this.init();
  }

  init() {
    console.log('👤 Profile component initializing...');
    this.loadProfile();
  }

  async loadProfile() {
    if (this.isLoading) return;

    // Check if user is authenticated
    if (!localStorage.getItem('token')) {
      this.showAuthRequired();
      return;
    }

    this.isLoading = true;
    this.showLoading();

    try {
      console.log('📡 Loading user profile...');

      // Load user profile
      let userResponse;
      if (window.api) {
        userResponse = await window.api.getUserProfile();
      } else {
        const res = await fetch('http://localhost:3001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        userResponse = await res.json();
      }

      if (userResponse.success) {
        this.user = userResponse.user;
        this.userStats = userResponse.stats || {};
        
        // Load user's resources
        await this.loadUserResources();
        
        this.renderProfile();
      } else {
        throw new Error(userResponse.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.showError('Failed to load profile. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async loadUserResources() {
    try {
      let response;
      if (window.api) {
        response = await window.api.getResources({ author: this.user._id });
      } else {
        const res = await fetch(`http://localhost:3001/api/resources?author=${this.user._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        response = await res.json();
      }

      if (response.success) {
        this.userResources = response.resources || [];
      }
    } catch (error) {
      console.error('Failed to load user resources:', error);
    }
  }

  renderProfile() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    const profileHTML = `
      <div class="profile-container">
        <!-- User Info Section -->
        <div class="profile-header">
          <div class="profile-avatar">
            <span class="avatar-text">${this.user.username.charAt(0).toUpperCase()}</span>
          </div>
          
          <div class="profile-info">
            <h2 class="profile-username">${this.user.username}</h2>
            <p class="profile-email">${this.user.email}</p>
            <p class="profile-joined">Joined: ${new Date(this.user.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div class="profile-actions">
            <button class="btn btn-secondary" onclick="window.Profile.editProfile()">
              EDIT PROFILE
            </button>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="profile-stats">
          <div class="stat-card">
            <div class="stat-number">${this.userResources.length}</div>
            <div class="stat-label">RESOURCES SHARED</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">${this.userStats.totalVotes || 0}</div>
            <div class="stat-label">TOTAL VOTES</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">${this.userStats.reputation || 0}</div>
            <div class="stat-label">REPUTATION</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">${this.userStats.level || 'NEWBIE'}</div>
            <div class="stat-label">LEVEL</div>
          </div>
        </div>

        <!-- Tabs Section -->
        <div class="profile-tabs">
          <button class="tab-btn active" data-tab="resources">MY RESOURCES</button>
          <button class="tab-btn" data-tab="activity">ACTIVITY</button>
          <button class="tab-btn" data-tab="settings">SETTINGS</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Resources Tab -->
          <div id="resources-tab" class="tab-pane active">
            ${this.renderUserResources()}
          </div>

          <!-- Activity Tab -->
          <div id="activity-tab" class="tab-pane">
            ${this.renderUserActivity()}
          </div>

          <!-- Settings Tab -->
          <div id="settings-tab" class="tab-pane">
            ${this.renderSettings()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = profileHTML;
    this.setupTabListeners();
  }

  renderUserResources() {
    if (this.userResources.length === 0) {
      return `
        <div class="no-resources">
          <div class="no-resources-icon">📡</div>
          <h3>NO RESOURCES YET</h3>
          <p>You haven't shared any resources yet.</p>
          <button class="btn btn-primary" onclick="window.app.navigateToPage('submit')">
            SHARE FIRST RESOURCE
          </button>
        </div>
      `;
    }

    const resourcesHTML = this.userResources.map(resource => `
      <div class="user-resource-card">
        <div class="resource-header">
          <h4 class="resource-title">
            <a href="${resource.url}" target="_blank">${resource.title}</a>
          </h4>
          <span class="resource-type ${resource.type}">${resource.type.toUpperCase()}</span>
        </div>
        
        <p class="resource-description">${resource.description || 'No description'}</p>
        
        <div class="resource-meta">
          <span class="resource-community">${resource.community?.name || 'Unknown'}</span>
          <span class="resource-votes">↑ ${resource.upvotes || 0} ↓ ${resource.downvotes || 0}</span>
          <span class="resource-comments">💬 ${resource.commentsCount || 0}</span>
          <span class="resource-date">${new Date(resource.createdAt).toLocaleDateString()}</span>
        </div>
        
        <div class="resource-actions">
          <button class="btn btn-small btn-secondary" onclick="window.Profile.editResource('${resource._id}')">
            EDIT
          </button>
          <button class="btn btn-small btn-danger" onclick="window.Profile.deleteResource('${resource._id}')">
            DELETE
          </button>
        </div>
      </div>
    `).join('');

    return `<div class="user-resources-list">${resourcesHTML}</div>`;
  }

  renderUserActivity() {
    return `
      <div class="activity-section">
        <h3>RECENT ACTIVITY</h3>
        <div class="activity-list">
          <div class="activity-item">
            <span class="activity-icon">📡</span>
            <span class="activity-text">Shared a new resource</span>
            <span class="activity-time">2 hours ago</span>
          </div>
          
          <div class="activity-item">
            <span class="activity-icon">👍</span>
            <span class="activity-text">Upvoted "JavaScript Fundamentals"</span>
            <span class="activity-time">1 day ago</span>
          </div>
          
          <div class="activity-item">
            <span class="activity-icon">💬</span>
            <span class="activity-text">Commented on "React Best Practices"</span>
            <span class="activity-time">3 days ago</span>
          </div>
        </div>
      </div>
    `;
  }

  renderSettings() {
    return `
      <div class="settings-section">
        <h3>ACCOUNT SETTINGS</h3>
        
        <div class="setting-group">
          <label>EMAIL NOTIFICATIONS</label>
          <div class="setting-options">
            <label class="checkbox-label">
              <input type="checkbox" checked> New comments on my resources
            </label>
            <label class="checkbox-label">
              <input type="checkbox" checked> Weekly digest
            </label>
            <label class="checkbox-label">
              <input type="checkbox"> Community updates
            </label>
          </div>
        </div>
        
        <div class="setting-group">
          <label>PRIVACY</label>
          <div class="setting-options">
            <label class="checkbox-label">
              <input type="checkbox" checked> Show my profile publicly
            </label>
            <label class="checkbox-label">
              <input type="checkbox"> Show my activity
            </label>
          </div>
        </div>
        
        <div class="setting-actions">
          <button class="btn btn-primary">SAVE SETTINGS</button>
          <button class="btn btn-danger" onclick="window.Profile.deleteAccount()">
            DELETE ACCOUNT
          </button>
        </div>
      </div>
    `;
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

  showAuthRequired() {
    const container = document.getElementById('profile-content');
    if (container) {
      container.innerHTML = `
        <div class="auth-required">
          <div class="auth-icon">🔒</div>
          <h3>AUTHENTICATION REQUIRED</h3>
          <p>Please log in to view your profile.</p>
          <button class="btn btn-primary" onclick="window.auth.showAuthModal('login')">
            LOGIN
          </button>
        </div>
      `;
    }
  }

  showLoading() {
    const container = document.getElementById('profile-content');
    if (container) {
      container.innerHTML = `
        <div class="loading-profile">
          <div class="loading-spinner">⟲</div>
          <p>ACCESSING NEURAL INTERFACE...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('profile-content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>ERROR</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="window.Profile.loadProfile()">RETRY</button>
        </div>
      `;
    }
  }

  // Profile action methods
  editProfile() {
    console.log('🔧 Edit profile not implemented yet');
    if (window.notificationManager) {
      window.notificationManager.show('Profile editing coming soon!', 'info');
    }
  }

  editResource(resourceId) {
    console.log('🔧 Edit resource:', resourceId);
    if (window.notificationManager) {
      window.notificationManager.show('Resource editing coming soon!', 'info');
    }
  }

  async deleteResource(resourceId) {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      let response;
      if (window.api) {
        response = await window.api.deleteResource(resourceId);
      } else {
        const res = await fetch(`http://localhost:3001/api/resources/${resourceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        response = await res.json();
      }

      if (response.success) {
        // Remove from local state
        this.userResources = this.userResources.filter(r => r._id !== resourceId);
        this.renderProfile();
        
        if (window.notificationManager) {
          window.notificationManager.show('Resource deleted successfully!', 'success');
        }
      } else {
        throw new Error(response.message || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Failed to delete resource:', error);
      if (window.notificationManager) {
        window.notificationManager.show('Failed to delete resource.', 'error');
      }
    }
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('🗑️ Delete account not implemented yet');
      if (window.notificationManager) {
        window.notificationManager.show('Account deletion coming soon!', 'info');
      }
    }
  }

  refresh() {
    this.loadProfile();
  }
}

// Initialize Profile component and make it globally available
window.Profile = new Profile();
