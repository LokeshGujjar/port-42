// 🏛️ Community Component for Port42
// Handles community display and interactions

class Community {
  constructor() {
    this.communities = [];
  }

  // Render community card
  renderCard(community) {
    const memberCount = community.memberCount || 0;
    const resourceCount = community.resourceCount || 0;
    
    return `
      <div class="community-card" data-id="${community._id}">
        <div class="community-header">
          <div class="community-icon">${community.icon || '🌐'}</div>
          <div class="community-info">
            <h3 class="community-name">${community.name}</h3>
            <p class="community-description">${community.description || 'No description available'}</p>
          </div>
        </div>
        
        <div class="community-stats">
          <div class="stat">
            <span class="stat-number">${resourceCount}</span>
            <span class="stat-label">RESOURCES</span>
          </div>
          <div class="stat">
            <span class="stat-number">${memberCount}</span>
            <span class="stat-label">MEMBERS</span>
          </div>
        </div>
        
        <div class="community-tags">
          ${community.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || ''}
        </div>
        
        <div class="community-actions">
          <button class="btn btn-primary" onclick="window.Community.viewCommunity('${community._id}')">
            ENTER NETWORK
          </button>
          <button class="btn btn-secondary ${community.isMember ? 'active' : ''}" 
                  onclick="window.Community.toggleMembership('${community._id}')">
            ${community.isMember ? 'LEAVE' : 'JOIN'}
          </button>
        </div>
      </div>
    `;
  }

  // Render community list for filters
  renderOption(community) {
    return `<option value="${community._id}">${community.name.toUpperCase()}</option>`;
  }

  // View community details
  async viewCommunity(communityId) {
    try {
      // Navigate to home page with community filter
      if (window.app) {
        window.app.state.set('filters.community', communityId);
        window.app.state.set('app.currentPage', 'home');
      }
      
      // Apply filter and load resources
      const communityFilter = document.getElementById('community-filter');
      if (communityFilter) {
        communityFilter.value = communityId;
      }
      
      // Trigger resource reload
      if (window.Home) {
        await window.Home.loadResources({ community: communityId });
      }
      
    } catch (error) {
      console.error('Failed to view community:', error);
      window.notificationManager?.show('Failed to load community', 'error');
    }
  }

  // Toggle community membership
  async toggleMembership(communityId) {
    if (!window.auth.isAuthenticated) {
      window.auth.showAuthModal('login');
      return;
    }
    
    try {
      const response = await window.api.toggleCommunityMembership(communityId);
      
      if (response.success) {
        // Update UI
        const card = document.querySelector(`[data-id="${communityId}"]`);
        const button = card?.querySelector('.btn-secondary');
        
        if (button) {
          if (response.isMember) {
            button.textContent = 'LEAVE';
            button.classList.add('active');
            window.notificationManager?.show('Joined community', 'success');
          } else {
            button.textContent = 'JOIN';
            button.classList.remove('active');
            window.notificationManager?.show('Left community', 'info');
          }
        }
        
        // Update member count
        const memberStat = card?.querySelector('.stat:last-child .stat-number');
        if (memberStat) {
          const currentCount = parseInt(memberStat.textContent);
          memberStat.textContent = response.isMember ? currentCount + 1 : currentCount - 1;
        }
        
      }
    } catch (error) {
      console.error('Failed to toggle membership:', error);
      window.notificationManager?.show('Failed to update membership', 'error');
    }
  }

  // Load and render communities grid
  async renderGrid(container) {
    try {
      container.innerHTML = '<div class="loading">Loading communities...</div>';
      
      const response = await window.api.getCommunities();
      this.communities = response.communities || [];
      
      if (this.communities.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🏛️</div>
            <h3>No Communities Found</h3>
            <p>Be the first to create a community!</p>
          </div>
        `;
        return;
      }
      
      const grid = this.communities.map(community => this.renderCard(community)).join('');
      container.innerHTML = grid;
      
    } catch (error) {
      console.error('Failed to load communities:', error);
      container.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Failed to Load Communities</h3>
          <p>Please try again later.</p>
          <button class="btn btn-primary" onclick="location.reload()">RETRY</button>
        </div>
      `;
    }
  }

  // Populate select dropdown
  populateSelect(selectElement) {
    if (!selectElement) return;
    
    // Clear existing options except first
    const firstOption = selectElement.firstElementChild;
    selectElement.innerHTML = '';
    if (firstOption) {
      selectElement.appendChild(firstOption);
    }
    
    // Add community options
    this.communities.forEach(community => {
      const option = document.createElement('option');
      option.value = community._id;
      option.textContent = community.name.toUpperCase();
      selectElement.appendChild(option);
    });
  }

  // Search communities
  searchCommunities(query) {
    if (!query.trim()) return this.communities;
    
    const searchTerm = query.toLowerCase();
    return this.communities.filter(community => 
      community.name.toLowerCase().includes(searchTerm) ||
      community.description?.toLowerCase().includes(searchTerm) ||
      community.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Get community by ID
  getCommunityById(id) {
    return this.communities.find(community => community._id === id);
  }

  // Get popular communities
  getPopularCommunities(limit = 5) {
    return this.communities
      .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      .slice(0, limit);
  }

  // Get recent communities
  getRecentCommunities(limit = 5) {
    return this.communities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }
}

// Create global instance
window.Community = new Community();
