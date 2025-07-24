// 🏛️ Communities Page Component
// Displays and manages community networks

class Communities {
  constructor() {
    this.communities = [];
    this.isLoading = false;
    
    this.init();
  }

  init() {
    console.log('🏛️ Communities component initializing...');
    this.loadCommunities();
  }

  async loadCommunities() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      console.log('📡 Loading communities...');

      // Use global API if available, otherwise make direct fetch
      let response;
      if (window.api) {
        response = await window.api.getCommunities();
      } else {
        const res = await fetch('http://localhost:3001/api/communities');
        response = await res.json();
      }

      if (response.success) {
        this.communities = response.communities || [];
        this.renderCommunities();
      } else {
        throw new Error(response.message || 'Failed to load communities');
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
      this.showError('Failed to load communities. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  renderCommunities() {
    const container = document.getElementById('communities-grid');
    if (!container) return;

    if (this.communities.length === 0) {
      container.innerHTML = `
        <div class="no-communities">
          <div class="no-communities-icon">🏛️</div>
          <h3>NO COMMUNITIES FOUND</h3>
          <p>No communities are available at the moment.</p>
        </div>
      `;
      return;
    }

    const communitiesHTML = this.communities.map(community => this.renderCommunityCard(community)).join('');
    container.innerHTML = communitiesHTML;
  }

  renderCommunityCard(community) {
    const memberCount = community.memberCount || 0;
    const resourceCount = community.resourceCount || 0;
    const description = community.description || 'No description available.';
    
    return `
      <div class="community-card" data-id="${community._id}">
        <div class="community-header">
          <div class="community-icon">${community.icon || '🌐'}</div>
          <div class="community-info">
            <h3 class="community-name">${community.name}</h3>
            <p class="community-description">${description}</p>
          </div>
        </div>
        
        <div class="community-stats">
          <div class="stat">
            <span class="stat-number">${memberCount}</span>
            <span class="stat-label">MEMBERS</span>
          </div>
          <div class="stat">
            <span class="stat-number">${resourceCount}</span>
            <span class="stat-label">RESOURCES</span>
          </div>
          <div class="stat">
            <span class="stat-number">${community.level || 1}</span>
            <span class="stat-label">LEVEL</span>
          </div>
        </div>
        
        <div class="community-tags">
          ${(community.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        
        <div class="community-actions">
          <button class="btn btn-primary" onclick="window.Communities.joinCommunity('${community._id}')">
            ${community.isMember ? 'LEAVE' : 'JOIN'}
          </button>
          <button class="btn btn-secondary" onclick="window.Communities.viewCommunity('${community._id}')">
            VIEW
          </button>
        </div>
      </div>
    `;
  }

  async joinCommunity(communityId) {
    try {
      console.log('🤝 Joining community:', communityId);

      let response;
      if (window.api) {
        response = await window.api.joinCommunity(communityId);
      } else {
        const res = await fetch(`http://localhost:3001/api/communities/${communityId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        response = await res.json();
      }

      if (response.success) {
        // Update community in local state
        const community = this.communities.find(c => c._id === communityId);
        if (community) {
          community.isMember = !community.isMember;
          community.memberCount += community.isMember ? 1 : -1;
        }
        
        this.renderCommunities();
        
        if (window.notificationManager) {
          window.notificationManager.show(
            community.isMember ? 'Joined community successfully!' : 'Left community successfully!',
            'success'
          );
        }
      } else {
        throw new Error(response.message || 'Failed to join community');
      }
    } catch (error) {
      console.error('Failed to join community:', error);
      
      if (window.notificationManager) {
        window.notificationManager.show('Failed to join community. Please try again.', 'error');
      }
    }
  }

  viewCommunity(communityId) {
    // Filter home page by this community
    if (window.app) {
      window.app.navigateToPage('home');
      
      // Set community filter after a short delay to ensure page is loaded
      setTimeout(() => {
        const communityFilter = document.getElementById('community-filter');
        if (communityFilter) {
          communityFilter.value = communityId;
          communityFilter.dispatchEvent(new Event('change'));
        }
      }, 100);
    }
  }

  showLoading() {
    const container = document.getElementById('communities-grid');
    if (container) {
      container.innerHTML = `
        <div class="loading-communities">
          <div class="loading-spinner">⟲</div>
          <p>ACCESSING NEURAL NETWORKS...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('communities-grid');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>ERROR</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="window.Communities.loadCommunities()">RETRY</button>
        </div>
      `;
    }
  }

  refresh() {
    this.loadCommunities();
  }
}

// Initialize Communities component and make it globally available
window.Communities = new Communities();
