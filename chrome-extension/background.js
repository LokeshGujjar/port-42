// 🤖 Port42 Chrome Extension - Background Service Worker
// Manages extension lifecycle and API communication

class Port42Background {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.isAuthenticated = false;
    this.user = null;
    
    this.init();
  }

  init() {
    console.log('🤖 Port42 Background Service Worker initializing...');
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
    
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });
    
    // Handle tab updates for content detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
    
    // Check authentication status on startup
    this.checkAuth();
  }

  // Handle messages from popup and content scripts
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'getAuth':
          sendResponse({ 
            isAuthenticated: this.isAuthenticated, 
            user: this.user 
          });
          break;
          
        case 'login':
          const loginResult = await this.login(message.credentials);
          sendResponse(loginResult);
          break;
          
        case 'logout':
          await this.logout();
          sendResponse({ success: true });
          break;
          
        case 'submitResource':
          const submitResult = await this.submitResource(message.resourceData);
          sendResponse(submitResult);
          break;
          
        case 'getPageData':
          const pageData = await this.getPageData(sender.tab);
          sendResponse(pageData);
          break;
          
        case 'getCommunities':
          const communities = await this.getCommunities();
          sendResponse(communities);
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({ error: error.message });
    }
  }

  // Handle extension installation
  handleInstall(details) {
    if (details.reason === 'install') {
      console.log('🎉 Port42 Extension installed');
      
      // Open welcome page
      chrome.tabs.create({
        url: 'http://localhost:3000/#welcome'
      });
    }
  }

  // Handle tab updates
  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Check if page is a learning resource
      this.checkIfLearningResource(tab);
    }
  }

  // Check if current page is a learning resource
  async checkIfLearningResource(tab) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.detectLearningContent
      });
      
      if (result[0]?.result?.isLearningResource) {
        // Show page action badge
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: '!'
        });
        
        chrome.action.setBadgeBackgroundColor({
          tabId: tab.id,
          color: '#00ff41'
        });
      }
    } catch (error) {
      // Ignore errors for pages where we can't inject scripts
    }
  }

  // Function to detect learning content (injected into page)
  detectLearningContent() {
    const indicators = [
      // YouTube
      'youtube.com/watch',
      // GitHub
      'github.com',
      // Documentation sites
      'docs.',
      'documentation',
      // Tutorial sites
      'tutorial',
      'course',
      'learn',
      // Common learning domains
      'udemy.com',
      'coursera.org',
      'edx.org',
      'khanacademy.org',
      'freecodecamp.org',
      'stackoverflow.com',
      'medium.com',
      'dev.to'
    ];
    
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    
    const isLearningResource = indicators.some(indicator => 
      url.includes(indicator) || title.includes(indicator)
    );
    
    return {
      isLearningResource,
      title: document.title,
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content || ''
    };
  }

  // Check authentication status
  async checkAuth() {
    try {
      const stored = await chrome.storage.local.get(['token', 'user']);
      
      if (stored.token) {
        // Verify token with server
        const response = await fetch(`${this.baseURL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${stored.token}`
          }
        });
        
        if (response.ok) {
          this.isAuthenticated = true;
          this.user = stored.user;
          console.log('✅ Authentication verified');
        } else {
          // Clear invalid token
          await chrome.storage.local.remove(['token', 'user']);
        }
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store auth data
        await chrome.storage.local.set({
          token: data.token,
          user: data.user
        });
        
        this.isAuthenticated = true;
        this.user = data.user;
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Logout user
  async logout() {
    await chrome.storage.local.remove(['token', 'user']);
    this.isAuthenticated = false;
    this.user = null;
  }

  // Submit resource to Port42
  async submitResource(resourceData) {
    try {
      const stored = await chrome.storage.local.get(['token']);
      
      if (!stored.token) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const response = await fetch(`${this.baseURL}/api/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.token}`
        },
        body: JSON.stringify(resourceData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, resource: data.resource };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get page data
  async getPageData(tab) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => ({
          title: document.title,
          url: window.location.href,
          description: document.querySelector('meta[name="description"]')?.content || '',
          ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
          ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
          ogImage: document.querySelector('meta[property="og:image"]')?.content || ''
        })
      });
      
      return result[0]?.result || {};
    } catch (error) {
      return { title: tab.title, url: tab.url };
    }
  }

  // Get communities list
  async getCommunities() {
    try {
      const response = await fetch(`${this.baseURL}/api/communities`);
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, communities: data.communities };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

// Initialize background service
new Port42Background();
