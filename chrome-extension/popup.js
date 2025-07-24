// 🚀 Port42 Chrome Extension - Popup Script
// Handles popup UI interactions and communication with background

class Port42Popup {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.communities = [];
    this.currentPageData = {};
    this.selectedDifficulty = 'intermediate';
    
    this.init();
  }

  async init() {
    console.log('🚀 Port42 Popup initializing...');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check authentication status
    await this.checkAuth();
    
    // Load communities
    await this.loadCommunities();
    
    // Get current page data
    await this.getCurrentPageData();
    
    // Initialize UI
    this.initializeUI();
  }

  // Set up all event listeners
  setupEventListeners() {
    // Auth form
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => this.handleLogout());
    
    // Submit form
    const submitForm = document.getElementById('submit-form');
    submitForm.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Detect button
    const detectBtn = document.getElementById('detect-btn');
    detectBtn.addEventListener('click', () => this.autoDetectContent());
    
    // Difficulty buttons
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.selectDifficulty(e));
    });
    
    // Quick action buttons
    const openPort42Btn = document.getElementById('open-port42');
    openPort42Btn.addEventListener('click', () => this.openPort42());
    
    const viewSubmissionsBtn = document.getElementById('view-submissions');
    viewSubmissionsBtn.addEventListener('click', () => this.viewSubmissions());
    
    // Register link
    const registerLink = document.getElementById('register-link');
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.openRegister();
    });
  }

  // Check authentication status
  async checkAuth() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAuth' });
      
      this.isAuthenticated = response.isAuthenticated;
      this.user = response.user;
      
      console.log('Auth status:', this.isAuthenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  // Load communities list
  async loadCommunities() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCommunities' });
      
      if (response.success) {
        this.communities = response.communities;
        this.populateCommunitySelect();
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  }

  // Get current page data
  async getCurrentPageData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getPageData' });
      this.currentPageData = response;
      
      console.log('Page data:', this.currentPageData);
    } catch (error) {
      console.error('Failed to get page data:', error);
    }
  }

  // Initialize UI based on auth status
  initializeUI() {
    const loadingSection = document.getElementById('loading-section');
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const submitSection = document.getElementById('submit-section');
    const quickActions = document.getElementById('quick-actions');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Hide loading
    loadingSection.classList.add('hidden');
    
    if (this.isAuthenticated) {
      // Show authenticated UI
      authSection.classList.add('hidden');
      userSection.classList.remove('hidden');
      submitSection.classList.remove('hidden');
      quickActions.classList.remove('hidden');
      
      // Update user info
      this.updateUserInfo();
      
      // Update status indicator
      statusIndicator.querySelector('.status-dot').classList.add('connected');
      
      // Fill page data
      this.fillPageData();
      
    } else {
      // Show auth UI
      authSection.classList.remove('hidden');
      userSection.classList.add('hidden');
      submitSection.classList.add('hidden');
      quickActions.classList.add('hidden');
    }
  }

  // Update user info display
  updateUserInfo() {
    if (!this.user) return;
    
    const userInitial = document.getElementById('user-initial');
    const usernameDisplay = document.getElementById('username-display');
    const userLevel = document.getElementById('user-level');
    
    userInitial.textContent = this.user.username.charAt(0).toUpperCase();
    usernameDisplay.textContent = this.user.username.toUpperCase();
    userLevel.textContent = this.user.level || 1;
  }

  // Fill current page data
  fillPageData() {
    const pageTitle = document.getElementById('page-title');
    const pageUrl = document.getElementById('page-url');
    const resourceTitle = document.getElementById('resource-title');
    
    if (this.currentPageData.title) {
      pageTitle.textContent = this.currentPageData.title;
      resourceTitle.value = this.currentPageData.title;
    }
    
    if (this.currentPageData.url) {
      pageUrl.textContent = this.currentPageData.url;
    }
    
    // Auto-fill description if available
    const resourceDescription = document.getElementById('resource-description');
    if (this.currentPageData.description || this.currentPageData.ogDescription) {
      resourceDescription.value = this.currentPageData.description || this.currentPageData.ogDescription;
    }
  }

  // Populate community select
  populateCommunitySelect() {
    const select = document.getElementById('resource-community');
    
    // Clear existing options except first
    const firstOption = select.firstElementChild;
    select.innerHTML = '';
    select.appendChild(firstOption);
    
    // Add community options
    this.communities.forEach(community => {
      const option = document.createElement('option');
      option.value = community._id;
      option.textContent = community.name.toUpperCase();
      select.appendChild(option);
    });
  }

  // Handle login form submission
  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('auth-error');
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-loading').classList.remove('hidden');
    errorDiv.classList.add('hidden');
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'login',
        credentials: { username, password }
      });
      
      if (response.success) {
        this.isAuthenticated = true;
        this.user = response.user;
        this.initializeUI();
      } else {
        errorDiv.textContent = response.error.toUpperCase();
        errorDiv.classList.remove('hidden');
      }
    } catch (error) {
      errorDiv.textContent = 'CONNECTION FAILED';
      errorDiv.classList.remove('hidden');
    }
    
    // Hide loading state
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('.btn-loading').classList.add('hidden');
  }

  // Handle logout
  async handleLogout() {
    try {
      await chrome.runtime.sendMessage({ action: 'logout' });
      
      this.isAuthenticated = false;
      this.user = null;
      this.initializeUI();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Handle resource submission
  async handleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('resource-title').value;
    const description = document.getElementById('resource-description').value;
    const community = document.getElementById('resource-community').value;
    const type = document.getElementById('resource-type').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('submit-status');
    
    if (!community) {
      this.showStatus('Please select a community', 'error');
      return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-loading').classList.remove('hidden');
    statusDiv.classList.add('hidden');
    
    try {
      const resourceData = {
        title,
        description: description || undefined,
        url: this.currentPageData.url,
        community,
        type,
        difficulty: this.selectedDifficulty,
        tags: this.extractTags(),
        metadata: {
          source: 'chrome-extension',
          ogTitle: this.currentPageData.ogTitle,
          ogDescription: this.currentPageData.ogDescription,
          ogImage: this.currentPageData.ogImage
        }
      };
      
      const response = await chrome.runtime.sendMessage({
        action: 'submitResource',
        resourceData
      });
      
      if (response.success) {
        this.showStatus('Resource submitted successfully!', 'success');
        
        // Reset form
        e.target.reset();
        this.fillPageData();
        
        // Close popup after delay
        setTimeout(() => window.close(), 2000);
      } else {
        this.showStatus(response.error, 'error');
      }
    } catch (error) {
      this.showStatus('Submission failed', 'error');
    }
    
    // Hide loading state
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('.btn-loading').classList.add('hidden');
  }

  // Auto-detect content and fill form
  autoDetectContent() {
    const url = this.currentPageData.url?.toLowerCase() || '';
    const title = this.currentPageData.title?.toLowerCase() || '';
    
    // Auto-detect type
    const typeSelect = document.getElementById('resource-type');
    if (url.includes('youtube.com') || url.includes('vimeo.com')) {
      typeSelect.value = 'video';
    } else if (url.includes('github.com')) {
      typeSelect.value = 'tool';
    } else if (title.includes('tutorial') || url.includes('tutorial')) {
      typeSelect.value = 'tutorial';
    } else if (title.includes('course') || url.includes('course')) {
      typeSelect.value = 'course';
    } else if (title.includes('docs') || url.includes('docs') || title.includes('documentation')) {
      typeSelect.value = 'documentation';
    }
    
    // Auto-detect difficulty
    if (title.includes('beginner') || title.includes('intro') || title.includes('basic')) {
      this.selectDifficultyByLevel('beginner');
    } else if (title.includes('advanced') || title.includes('expert') || title.includes('pro')) {
      this.selectDifficultyByLevel('advanced');
    }
    
    // Visual feedback
    const detectBtn = document.getElementById('detect-btn');
    detectBtn.textContent = '✅';
    setTimeout(() => {
      detectBtn.textContent = '🔍';
    }, 1000);
  }

  // Select difficulty level
  selectDifficulty(e) {
    const button = e.target;
    const level = button.dataset.level;
    
    // Update active state
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
    
    this.selectedDifficulty = level;
  }

  // Select difficulty by level string
  selectDifficultyByLevel(level) {
    const button = document.querySelector(`[data-level="${level}"]`);
    if (button) {
      button.click();
    }
  }

  // Extract tags from page content
  extractTags() {
    const url = this.currentPageData.url?.toLowerCase() || '';
    const title = this.currentPageData.title?.toLowerCase() || '';
    const tags = [];
    
    // Common tag mappings
    const tagMap = {
      'javascript': ['javascript', 'js'],
      'python': ['python', 'py'],
      'react': ['react', 'reactjs'],
      'vue': ['vue', 'vuejs'],
      'angular': ['angular'],
      'node': ['node', 'nodejs'],
      'docker': ['docker', 'container'],
      'kubernetes': ['kubernetes', 'k8s'],
      'aws': ['aws', 'amazon'],
      'git': ['git', 'github'],
      'css': ['css', 'styling'],
      'html': ['html', 'markup'],
      'api': ['api', 'rest'],
      'database': ['database', 'db', 'sql'],
      'machine-learning': ['ml', 'ai', 'machine learning'],
      'security': ['security', 'cybersecurity']
    };
    
    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => url.includes(keyword) || title.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  // Show status message
  showStatus(message, type) {
    const statusDiv = document.getElementById('submit-status');
    statusDiv.textContent = message.toUpperCase();
    statusDiv.className = `submit-status ${type}`;
    statusDiv.classList.remove('hidden');
  }

  // Open Port42 main app
  openPort42() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }

  // View user submissions
  viewSubmissions() {
    chrome.tabs.create({ url: 'http://localhost:3000#profile' });
  }

  // Open registration page
  openRegister() {
    chrome.tabs.create({ url: 'http://localhost:3000#register' });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Port42Popup();
});
