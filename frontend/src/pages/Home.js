// 🏠 Home Page Component
// Handles resource display, filtering, and searching

class Home {
  constructor() {
    this.resources = [];
    this.currentFilters = {
      community: '',
      type: '',
      search: '',
      sort: 'newest'
    };
    this.currentPage = 1;
    this.totalPages = 1;
    this.isLoading = false;
    
    this.init();
  }

  init() {
    console.log('🏠 Home component initializing...');
    this.setupEventListeners();
    this.loadResources();
  }

  setupEventListeners() {
    // Filter event listeners
    const communityFilter = document.getElementById('community-filter');
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (communityFilter) {
      communityFilter.addEventListener('change', (e) => {
        this.currentFilters.community = e.target.value;
        this.loadResources();
      });
    }

    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.currentFilters.type = e.target.value;
        this.loadResources();
      });
    }

    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.currentFilters.sort = e.target.value;
        this.loadResources();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.handleSearch();
      });
    }
  }

  handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      this.currentFilters.search = searchInput.value.trim();
      this.currentPage = 1;
      this.loadResources();
    }
  }

  async loadResources(options = {}) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const params = {
        page: options.page || this.currentPage,
        limit: 20,
        ...this.currentFilters,
        ...options
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      console.log('📡 Loading resources with params:', params);

      // Use global API if available, otherwise make direct fetch
      let response;
      if (window.api) {
        response = await window.api.getResources(params);
      } else {
        const queryString = new URLSearchParams(params).toString();
        const res = await fetch(`http://localhost:3001/api/resources?${queryString}`);
        response = await res.json();
      }

      if (response.success) {
        this.resources = response.resources || [];
        this.totalPages = response.totalPages || 1;
        this.currentPage = response.currentPage || 1;
        
        this.renderResources();
        this.renderPagination();
      } else {
        throw new Error(response.message || 'Failed to load resources');
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
      this.showError('Failed to load resources. Please try again.');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderResources() {
    const container = document.getElementById('resources-container');
    if (!container) return;

    if (this.resources.length === 0) {
      container.innerHTML = `
        <div class="no-resources">
          <div class="no-resources-icon">🔍</div>
          <h3>NO RESOURCES FOUND</h3>
          <p>No resources match your current filters.</p>
          <button class="btn btn-primary" onclick="window.Home.clearFilters()">CLEAR FILTERS</button>
        </div>
      `;
      return;
    }

    const resourcesHTML = this.resources.map(resource => this.renderResourceCard(resource)).join('');
    container.innerHTML = `<div class="resources-grid">${resourcesHTML}</div>`;
  }

  renderResourceCard(resource) {
    const timeAgo = this.getTimeAgo(resource.createdAt);
    const difficulty = resource.difficulty || 'intermediate';
    const type = resource.type || 'article';
    
    return `
      <div class="resource-card" data-id="${resource._id}">
        <div class="resource-header">
          <div class="resource-type ${type}">${type.toUpperCase()}</div>
          <div class="resource-difficulty ${difficulty}">${difficulty.toUpperCase()}</div>
        </div>
        
        <div class="resource-content">
          <h3 class="resource-title">
            <a href="${resource.url}" target="_blank" rel="noopener">${resource.title}</a>
          </h3>
          
          <p class="resource-description">${resource.description || 'No description available.'}</p>
          
          <div class="resource-meta">
            <span class="resource-community">${resource.community?.name || 'Unknown'}</span>
            <span class="resource-author">by ${resource.author?.username || 'Anonymous'}</span>
            <span class="resource-time">${timeAgo}</span>
          </div>
          
          <div class="resource-tags">
            ${(resource.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        
        <div class="resource-actions">
          <button class="vote-btn upvote ${resource.userVote === 'up' ? 'active' : ''}" 
                  data-id="${resource._id}" data-vote="up">
            ▲ ${resource.upvotes || 0}
          </button>
          
          <button class="vote-btn downvote ${resource.userVote === 'down' ? 'active' : ''}" 
                  data-id="${resource._id}" data-vote="down">
            ▼ ${resource.downvotes || 0}
          </button>
          
          <button class="comment-btn" data-id="${resource._id}">
            💬 ${resource.commentsCount || 0}
          </button>
          
          <button class="share-btn" data-id="${resource._id}" data-url="${resource.url}">
            📤 SHARE
          </button>
        </div>
      </div>
    `;
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `<button class="btn btn-secondary" onclick="window.Home.goToPage(${this.currentPage - 1})">◀ PREV</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, this.currentPage + 2); i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      paginationHTML += `<button class="btn btn-secondary ${activeClass}" onclick="window.Home.goToPage(${i})">${i}</button>`;
    }
    
    // Next button
    if (this.currentPage < this.totalPages) {
      paginationHTML += `<button class="btn btn-secondary" onclick="window.Home.goToPage(${this.currentPage + 1})">NEXT ▶</button>`;
    }
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadResources({ page });
  }

  clearFilters() {
    this.currentFilters = {
      community: '',
      type: '',
      search: '',
      sort: 'newest'
    };
    
    // Reset form elements
    const communityFilter = document.getElementById('community-filter');
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');
    
    if (communityFilter) communityFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (sortFilter) sortFilter.value = 'newest';
    if (searchInput) searchInput.value = '';
    
    this.loadResources();
  }

  showLoading() {
    const container = document.getElementById('resources-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-resources">
          <div class="loading-spinner">⟲</div>
          <p>SCANNING THE MATRIX...</p>
        </div>
      `;
    }
  }

  hideLoading() {
    // Loading is hidden when resources are rendered
  }

  showError(message) {
    const container = document.getElementById('resources-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>ERROR</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="window.Home.loadResources()">RETRY</button>
        </div>
      `;
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const createdAt = new Date(date);
    const diffMs = now - createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return createdAt.toLocaleDateString();
  }
}

// Initialize Home component and make it globally available
window.Home = new Home();
