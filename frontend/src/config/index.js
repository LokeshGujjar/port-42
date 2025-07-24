// 🔧 Frontend Configuration Manager
// Centralized configuration for the frontend application

class Config {
  constructor() {
    // Environment variables - using window.ENV if available, otherwise defaults
    const env = window.ENV || {};
    
    this.apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.socketUrl = env.VITE_SOCKET_URL || 'http://localhost:3001';
    this.appName = env.VITE_APP_NAME || 'Port42';
    this.appVersion = env.VITE_APP_VERSION || '1.0.0';
    this.nodeEnv = env.VITE_NODE_ENV || 'development';
    
    // Feature flags
    this.features = {
      matrixBackground: env.VITE_ENABLE_MATRIX_BG !== 'false',
      animations: env.VITE_ENABLE_ANIMATIONS !== 'false',
      socketIO: true,
      offlineMode: false
    };

    // API Configuration
    this.api = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    };

    // UI Configuration
    this.ui = {
      defaultTheme: 'cyberpunk',
      animationDuration: 300,
      debounceDelay: 300,
      pagination: {
        defaultLimit: 20,
        maxLimit: 100
      },
      notifications: {
        duration: 5000,
        maxVisible: 3
      }
    };

    // Socket.IO Configuration
    this.socket = {
      url: this.socketUrl,
      options: {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      }
    };

    // Local Storage Keys
    this.storage = {
      authToken: 'port42_token',
      user: 'port42_user',
      theme: 'port42_theme',
      preferences: 'port42_preferences',
      cache: 'port42_cache'
    };

    // Application Routes
    this.routes = {
      home: 'home',
      communities: 'communities',
      submit: 'submit',
      profile: 'profile',
      login: 'login',
      register: 'register'
    };

    // Debug mode
    this.debug = this.nodeEnv === 'development';
    
    // Initialize
    this.validate();
  }

  // Validate configuration
  validate() {
    const required = ['apiBaseUrl', 'socketUrl'];
    
    for (const key of required) {
      if (!this[key]) {
        throw new Error(`Missing required configuration: ${key}`);
      }
    }

    // Warn about development URLs in production
    if (this.nodeEnv === 'production') {
      if (this.apiBaseUrl.includes('localhost')) {
        console.warn('⚠️ Using localhost API URL in production');
      }
      if (this.socketUrl.includes('localhost')) {
        console.warn('⚠️ Using localhost Socket URL in production');
      }
    }
  }

  // Get full API URL
  getApiUrl(endpoint) {
    return `${this.apiBaseUrl}/${endpoint}`.replace(/\/+/g, '/').replace(':/', '://');
  }

  // Log configuration in debug mode
  logConfig() {
    if (this.debug) {
      console.group('🔧 Port42 Configuration');
      console.log('API Base URL:', this.apiBaseUrl);
      console.log('Socket URL:', this.socketUrl);
      console.log('Environment:', this.nodeEnv);
      console.log('Features:', this.features);
      console.groupEnd();
    }
  }

  // Update feature flag
  setFeature(name, enabled) {
    this.features[name] = enabled;
    return this;
  }

  // Get environment specific settings
  isDevelopment() {
    return this.nodeEnv === 'development';
  }

  isProduction() {
    return this.nodeEnv === 'production';
  }
}

// Create and export singleton instance  
window.config = new Config();
