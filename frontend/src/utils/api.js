// 🌐 Port42 API Client
// Enhanced API client with retry logic, error handling, and caching

import config from '../config/index.js';

class ApiClient {
  constructor() {
    this.baseURL = config.apiBaseUrl;
    this.timeout = config.api.timeout;
    this.retryAttempts = config.api.retryAttempts;
    this.retryDelay = config.api.retryDelay;
    this.token = localStorage.getItem(config.storage.authToken);
    
    // Simple cache for GET requests
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // 🔧 Helper method to get headers
  getHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {};
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    if (includeAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // 🔧 Enhanced response handler with better error information
  async handleResponse(response) {
    let data;
    
    try {
      data = await response.json();
    } catch (error) {
      throw new Error(`Invalid response format: ${response.statusText}`);
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.code = data.code;
      error.details = data.details;
      throw error;
    }

    return data;
  }

  // 🔄 Retry logic for failed requests
  async retryRequest(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        console.warn(`Request failed, retrying (${attempt}/${this.retryAttempts})...`);
        await this.delay(this.retryDelay * attempt);
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  // 🔧 Check if error is retryable
  isRetryableError(error) {
    const retryableStatuses = [500, 502, 503, 504, 408, 429];
    return retryableStatuses.includes(error.status) || 
           error.name === 'TypeError' || // Network errors
           error.message.includes('fetch');
  }

  // ⏱️ Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🗄️ Cache helpers
  getCacheKey(url, options) {
    return `${url}_${JSON.stringify(options || {})}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // 🌐 Generic request method with timeout and retry
  async request(endpoint, options = {}) {
    const url = config.getApiUrl(endpoint);
    const cacheKey = this.getCacheKey(url, options);
    
    // Check cache for GET requests
    if (options.method === 'GET' || !options.method) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestFn = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(options.includeAuth !== false),
            ...options.headers
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return await this.handleResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    };

    const data = await this.retryRequest(requestFn);
    
    // Cache successful GET requests
    if (!options.method || options.method === 'GET') {
      this.setCache(cacheKey, data);
    }

    return data;
  }

  // 🔧 Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(config.storage.authToken, token);
    } else {
      localStorage.removeItem(config.storage.authToken);
      this.clearCache(); // Clear cache on logout
    }
  }

  // ========================================
  // AUTHENTICATION ENDPOINTS
  // ========================================

  async register(userData) {
    const data = await this.request('auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async login(credentials) {
    const data = await this.request('auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      includeAuth: false
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async logout() {
    try {
      await this.request('auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.request('auth/me');
  }

  async updateProfile(profileData) {
    return this.request('auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async checkUsername(username) {
    return this.request(`auth/check-username/${username}`, {
      includeAuth: false
    });
  }

  // ========================================
  // RESOURCE ENDPOINTS
  // ========================================

  async getResources(params = {}) {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    return this.request(`resources?${searchParams}`, {
      includeAuth: false
    });
  }

  async getResource(id) {
    return this.request(`resources/${id}`, {
      includeAuth: false
    });
  }

  async submitResource(resourceData) {
    return this.request('resources', {
      method: 'POST',
      body: JSON.stringify(resourceData)
    });
  }

  async voteOnResource(resourceId, vote) {
    return this.request(`resources/${resourceId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote })
    });
  }

  async trackClick(resourceId) {
    return this.request(`resources/${resourceId}/click`, {
      method: 'POST',
      includeAuth: false
    });
  }

  async updateResource(resourceId, updateData) {
    return this.request(`resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteResource(resourceId) {
    return this.request(`resources/${resourceId}`, {
      method: 'DELETE'
    });
  }

  async reportResource(resourceId, reportData) {
    return this.request(`resources/${resourceId}/report`, {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  // ========================================
  // COMMUNITY ENDPOINTS
  // ========================================

  async getCommunities(params = {}) {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    return this.request(`communities?${searchParams}`, {
      includeAuth: false
    });
  }

  async getCommunity(slug) {
    return this.request(`communities/${slug}`, {
      includeAuth: false
    });
  }

  async createCommunity(communityData) {
    return this.request('communities', {
      method: 'POST',
      body: JSON.stringify(communityData)
    });
  }

  async toggleCommunityMembership(communityId) {
    return this.request(`communities/${communityId}/toggle-membership`, {
      method: 'POST'
    });
  }

  // ========================================
  // COMMENT ENDPOINTS
  // ========================================

  async getComments(resourceId, params = {}) {
    const searchParams = new URLSearchParams();
    searchParams.append('page', params.page || 1);
    searchParams.append('limit', params.limit || 50);
    searchParams.append('sort', params.sort || 'newest');

    return this.request(`comments/resource/${resourceId}?${searchParams}`, {
      includeAuth: false
    });
  }

  async postComment(commentData) {
    return this.request('comments', {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }

  async voteOnComment(commentId, vote) {
    return this.request(`comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote })
    });
  }

  async editComment(commentId, content) {
    return this.request(`comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async deleteComment(commentId) {
    return this.request(`comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async healthCheck() {
    return this.request('../health', { 
      includeAuth: false 
    });
  }

  // ========================================
  // ERROR HANDLING UTILITIES
  // ========================================

  isNetworkError(error) {
    return error.name === 'TypeError' || error.message.includes('fetch');
  }

  isAuthError(error) {
    return error.status === 401 || error.status === 403;
  }

  isValidationError(error) {
    return error.status === 400;
  }

  isServerError(error) {
    return error.status >= 500;
  }

  // Handle common errors
  handleError(error) {
    if (this.isAuthError(error)) {
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new Error('Authentication required. Please log in again.');
    }

    if (this.isNetworkError(error)) {
      throw new Error('Network error. Please check your connection.');
    }

    if (this.isServerError(error)) {
      throw new Error('Server error. Please try again later.');
    }

    throw error;
  }
}

// Create and export singleton instance
export default new ApiClient();
