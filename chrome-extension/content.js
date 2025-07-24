// 🌐 Port42 Chrome Extension - Content Script
// Detects learning resources and provides quick actions

class Port42ContentScript {
  constructor() {
    this.isLearningResource = false;
    this.resourceData = {};
    this.floatingButton = null;
    this.isInjected = false;
    
    this.init();
  }

  init() {
    // Don't inject on Port42 domain
    if (window.location.hostname.includes('localhost') && 
        (window.location.port === '3000' || window.location.port === '5000')) {
      return;
    }
    
    console.log('🌐 Port42 Content Script initializing...');
    
    // Detect if this is a learning resource
    this.detectLearningResource();
    
    // If it's a learning resource, show floating button
    if (this.isLearningResource) {
      this.injectFloatingButton();
    }
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  // Detect if current page is a learning resource
  detectLearningResource() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const metaDescription = document.querySelector('meta[name="description"]')?.content?.toLowerCase() || '';
    
    // Learning resource indicators
    const indicators = [
      // Video platforms
      { keywords: ['youtube.com/watch', 'vimeo.com'], type: 'video' },
      
      // Code repositories
      { keywords: ['github.com', 'gitlab.com', 'bitbucket.org'], type: 'tool' },
      
      // Documentation sites
      { keywords: ['docs.', '/docs/', 'documentation'], type: 'documentation' },
      
      // Tutorial sites
      { keywords: ['tutorial', 'how-to', 'guide'], type: 'tutorial' },
      
      // Course platforms
      { keywords: ['udemy.com', 'coursera.org', 'edx.org', 'khanacademy.org', 'pluralsight.com'], type: 'course' },
      
      // Developer resources
      { keywords: ['stackoverflow.com', 'dev.to', 'medium.com/@', 'freecodecamp.org'], type: 'article' },
      
      // Technical blogs
      { keywords: ['blog', 'tutorial', 'learn', 'programming', 'coding'], type: 'article' },
      
      // Learning keywords in title/description
      { keywords: ['learn', 'tutorial', 'course', 'guide', 'how to', 'introduction to'], type: 'article' }
    ];
    
    // Check each indicator
    for (const indicator of indicators) {
      if (indicator.keywords.some(keyword => 
          url.includes(keyword) || 
          title.includes(keyword) || 
          metaDescription.includes(keyword))) {
        
        this.isLearningResource = true;
        this.resourceData = {
          type: indicator.type,
          title: document.title,
          url: window.location.href,
          description: metaDescription,
          detectedAt: Date.now()
        };
        
        console.log('🎯 Learning resource detected:', this.resourceData);
        return;
      }
    }
  }

  // Inject floating button for quick submission
  injectFloatingButton() {
    if (this.isInjected) return;
    
    // Create floating button
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'port42-floating-btn';
    this.floatingButton.innerHTML = `
      <div class="port42-btn-content">
        <div class="port42-icon">⚡</div>
        <div class="port42-text">ADD TO PORT42</div>
      </div>
      <div class="port42-tooltip">Submit this resource to Port42</div>
    `;
    
    // Add styles
    this.injectStyles();
    
    // Add click handler
    this.floatingButton.addEventListener('click', () => {
      this.quickSubmit();
    });
    
    // Inject into page
    document.body.appendChild(this.floatingButton);
    this.isInjected = true;
    
    // Show with animation after short delay
    setTimeout(() => {
      this.floatingButton.classList.add('port42-visible');
    }, 1000);
    
    console.log('🚀 Floating button injected');
  }

  // Inject CSS styles for floating button
  injectStyles() {
    if (document.getElementById('port42-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'port42-styles';
    styles.textContent = `
      #port42-floating-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #003300 0%, #006600 100%);
        border: 2px solid #00ff41;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        transform: translateY(100px);
        opacity: 0;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        box-shadow: 0 4px 20px rgba(0, 255, 65, 0.3);
      }
      
      #port42-floating-btn.port42-visible {
        transform: translateY(0);
        opacity: 1;
      }
      
      #port42-floating-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(0, 255, 65, 0.5);
        background: linear-gradient(135deg, #006600 0%, #00aa00 100%);
      }
      
      .port42-btn-content {
        text-align: center;
        color: #00ff41;
      }
      
      .port42-icon {
        font-size: 20px;
        margin-bottom: 2px;
        animation: port42-pulse 2s infinite;
      }
      
      .port42-text {
        font-size: 8px;
        font-weight: bold;
        letter-spacing: 0.5px;
        line-height: 1;
      }
      
      .port42-tooltip {
        position: absolute;
        bottom: 70px;
        right: 0;
        background: #1a1a1a;
        color: #00ff41;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        pointer-events: none;
        border: 1px solid #00ff41;
      }
      
      #port42-floating-btn:hover .port42-tooltip {
        opacity: 1;
        transform: translateY(0);
      }
      
      .port42-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        right: 20px;
        border: 5px solid transparent;
        border-top-color: #00ff41;
      }
      
      @keyframes port42-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      
      /* Hide on small screens */
      @media (max-width: 768px) {
        #port42-floating-btn {
          bottom: 80px;
          right: 15px;
          width: 50px;
          height: 50px;
        }
        
        .port42-icon {
          font-size: 16px;
        }
        
        .port42-text {
          font-size: 7px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  // Quick submit functionality
  async quickSubmit() {
    try {
      // Check if user is authenticated
      const authResponse = await chrome.runtime.sendMessage({ action: 'getAuth' });
      
      if (!authResponse.isAuthenticated) {
        // Show login prompt
        this.showNotification('Please login to Port42 extension first', 'warning');
        
        // Open extension popup
        chrome.runtime.sendMessage({ action: 'openPopup' });
        return;
      }
      
      // Get enhanced page data
      const pageData = this.getEnhancedPageData();
      
      // Show submission form
      this.showQuickSubmissionModal(pageData);
      
    } catch (error) {
      console.error('Quick submit failed:', error);
      this.showNotification('Quick submit failed. Please try again.', 'error');
    }
  }

  // Get enhanced page data
  getEnhancedPageData() {
    const data = {
      title: document.title,
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      type: this.resourceData.type || 'article',
      favicon: this.getFavicon()
    };
    
    // Auto-detect difficulty
    const content = document.title.toLowerCase() + ' ' + data.description.toLowerCase();
    if (content.includes('beginner') || content.includes('intro') || content.includes('basic')) {
      data.suggestedDifficulty = 'beginner';
    } else if (content.includes('advanced') || content.includes('expert') || content.includes('pro')) {
      data.suggestedDifficulty = 'advanced';
    } else {
      data.suggestedDifficulty = 'intermediate';
    }
    
    // Extract tags
    data.suggestedTags = this.extractTags(content);
    
    return data;
  }

  // Get favicon URL
  getFavicon() {
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
      return favicon.href;
    }
    
    return `${window.location.protocol}//${window.location.hostname}/favicon.ico`;
  }

  // Extract relevant tags
  extractTags(content) {
    const tags = [];
    const tagMap = {
      'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
      'python': ['python', 'django', 'flask', 'pandas'],
      'web-development': ['html', 'css', 'frontend', 'backend', 'fullstack'],
      'data-science': ['data science', 'machine learning', 'ai', 'analytics'],
      'devops': ['docker', 'kubernetes', 'aws', 'cloud', 'deployment'],
      'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
      'security': ['security', 'cybersecurity', 'penetration', 'hacking'],
      'design': ['ui', 'ux', 'design', 'figma', 'sketch']
    };
    
    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  // Show quick submission modal
  showQuickSubmissionModal(pageData) {
    // Implementation would create an overlay modal
    // For now, just show a notification and open extension
    this.showNotification('Opening Port42 extension...', 'info');
    
    // Open extension popup (requires permission)
    setTimeout(() => {
      chrome.runtime.sendMessage({ 
        action: 'openPopup',
        pageData 
      });
    }, 500);
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `port42-notification port42-notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles if not present
    if (!document.getElementById('port42-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'port42-notification-styles';
      styles.textContent = `
        .port42-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: #1a1a1a;
          border: 1px solid #00ff41;
          color: #00ff41;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 12px;
          border-radius: 4px;
          z-index: 10001;
          max-width: 300px;
          transform: translateX(400px);
          transition: transform 0.3s ease;
        }
        
        .port42-notification-warning {
          border-color: #ffaa00;
          color: #ffaa00;
        }
        
        .port42-notification-error {
          border-color: #ff0066;
          color: #ff0066;
        }
        
        .port42-notification.show {
          transform: translateX(0);
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Show notification
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Handle messages from background/popup
  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'getPageData':
        sendResponse(this.getEnhancedPageData());
        break;
        
      case 'showNotification':
        this.showNotification(message.text, message.type);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  // Cleanup when page unloads
  cleanup() {
    if (this.floatingButton) {
      this.floatingButton.remove();
    }
    
    const styles = document.getElementById('port42-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// Initialize content script
const port42Content = new Port42ContentScript();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  port42Content.cleanup();
});
