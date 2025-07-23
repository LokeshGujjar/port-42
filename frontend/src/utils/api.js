// 🌐 Port42 API Client
// Handles all communication with the backend API

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('port42_token');
    }

    // 🔧 Helper method to get headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    // 🔧 Helper method to handle responses
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    }

    // 🔧 Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('port42_token', token);
        } else {
            localStorage.removeItem('port42_token');
        }
    }

    // ========================================
    // AUTHENTICATION ENDPOINTS
    // ========================================

    async register(userData) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(userData)
        });

        const data = await this.handleResponse(response);
        
        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(credentials)
        });

        const data = await this.handleResponse(response);
        
        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async logout() {
        if (this.token) {
            try {
                await fetch(`${this.baseURL}/auth/logout`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
            } catch (error) {
                console.warn('Logout request failed:', error);
            }
        }

        this.setToken(null);
    }

    async getCurrentUser() {
        const response = await fetch(`${this.baseURL}/auth/me`, {
            headers: this.getHeaders()
        });

        return this.handleResponse(response);
    }

    async updateProfile(profileData) {
        const response = await fetch(`${this.baseURL}/auth/profile`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(profileData)
        });

        return this.handleResponse(response);
    }

    async checkUsername(username) {
        const response = await fetch(`${this.baseURL}/auth/check-username/${username}`, {
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
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

        const response = await fetch(`${this.baseURL}/resources?${searchParams}`, {
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
    }

    async getResource(id) {
        const response = await fetch(`${this.baseURL}/resources/${id}`, {
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
    }

    async submitResource(resourceData) {
        const response = await fetch(`${this.baseURL}/resources`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(resourceData)
        });

        return this.handleResponse(response);
    }

    async voteOnResource(resourceId, vote) {
        const response = await fetch(`${this.baseURL}/resources/${resourceId}/vote`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ vote })
        });

        return this.handleResponse(response);
    }

    async trackClick(resourceId) {
        const response = await fetch(`${this.baseURL}/resources/${resourceId}/click`, {
            method: 'POST',
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
    }

    async updateResource(resourceId, updateData) {
        const response = await fetch(`${this.baseURL}/resources/${resourceId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(updateData)
        });

        return this.handleResponse(response);
    }

    async deleteResource(resourceId) {
        const response = await fetch(`${this.baseURL}/resources/${resourceId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        return this.handleResponse(response);
    }

    async reportResource(resourceId, reportData) {
        const response = await fetch(`${this.baseURL}/resources/${resourceId}/report`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(reportData)
        });

        return this.handleResponse(response);
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

        const response = await fetch(`${this.baseURL}/communities?${searchParams}`, {
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
    }

    async getCommunity(slug) {
        const response = await fetch(`${this.baseURL}/communities/${slug}`, {
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
    }

    async createCommunity(communityData) {
        const response = await fetch(`${this.baseURL}/communities`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(communityData)
        });

        return this.handleResponse(response);
    }

    async toggleCommunityMembership(communityId) {
        const response = await fetch(`${this.baseURL}/communities/${communityId}/toggle-membership`, {
            method: 'POST',
            headers: this.getHeaders()
        });

        return this.handleResponse(response);
    }

    // ========================================
    // COMMENT ENDPOINTS
    // ========================================

    async getComments(resourceId, params = {}) {
        const searchParams = new URLSearchParams();
        searchParams.append('page', params.page || 1);
        searchParams.append('limit', params.limit || 50);
        searchParams.append('sort', params.sort || 'newest');

        const response = await fetch(`${this.baseURL}/comments/resource/${resourceId}?${searchParams}`, {
            headers: this.getHeaders(false)
        });

        return this.handleResponse(response);
    }

    async postComment(commentData) {
        const response = await fetch(`${this.baseURL}/comments`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(commentData)
        });

        return this.handleResponse(response);
    }

    async voteOnComment(commentId, vote) {
        const response = await fetch(`${this.baseURL}/comments/${commentId}/vote`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ vote })
        });

        return this.handleResponse(response);
    }

    async editComment(commentId, content) {
        const response = await fetch(`${this.baseURL}/comments/${commentId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ content })
        });

        return this.handleResponse(response);
    }

    async deleteComment(commentId) {
        const response = await fetch(`${this.baseURL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        return this.handleResponse(response);
    }
}

// Create global API instance
window.api = new ApiClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
