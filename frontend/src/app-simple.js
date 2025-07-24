// 🌐 Port42 Simple App - Minimal Working Version
// This version avoids complex dependencies and module issues

console.log('🚀 Starting Port42 simple initialization...');

// Simple state management
window.Port42State = {
    user: null,
    currentPage: 'home',
    resources: [],
    communities: [],
    isAuthenticated: false
};

// Simple API client
window.Port42API = {
    baseURL: 'http://localhost:3001/api',
    
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}/${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },
    
    async getResources() {
        return this.request('resources');
    },
    
    async getCommunities() {
        return this.request('communities');
    }
};

// Simple app class
class Port42AppSimple {
    constructor() {
        console.log('🏗️ Port42AppSimple constructor called');
        this.currentPage = 'home';
        this.isInitialized = false;
        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('⚡ Initializing Port42...');
            
            // Test backend connection
            await this.testBackendConnection();
            
            // Setup basic functionality
            this.setupEventListeners();
            
            // Hide loading screen and show app
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showMainApp();
                this.loadInitialData();
            }, 1500);
            
            this.isInitialized = true;
            console.log('✅ Port42 initialization complete');
            
        } catch (error) {
            console.error('❌ Error initializing Port42:', error);
            this.showError(error.message);
        }
    }

    async testBackendConnection() {
        try {
            console.log('🔗 Testing backend connection...');
            const response = await fetch('http://localhost:3001');
            if (!response.ok) {
                throw new Error('Backend not responding');
            }
            console.log('✅ Backend connection successful');
        } catch (error) {
            console.warn('⚠️ Backend connection failed:', error);
            // Continue anyway for now
        }
    }

    hideLoadingScreen() {
        console.log('🎬 Hiding loading screen...');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                console.log('✅ Loading screen hidden');
            }, 300);
        }
    }

    showMainApp() {
        console.log('🎨 Showing main app...');
        
        // Show home page
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.remove('hidden');
            console.log('✅ Home page shown');
        }
        
        // Set up navigation
        this.setupNavigation();
        
        // Set up authentication buttons
        this.setupAuthButtons();
    }

    setupNavigation() {
        console.log('🧭 Setting up navigation...');
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
            });
        });
    }

    setupAuthButtons() {
        console.log('🔐 Setting up auth buttons...');
        
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                console.log('Login button clicked');
                this.showSimpleAuthModal('login');
            });
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                console.log('Register button clicked');
                this.showSimpleAuthModal('register');
            });
        }
    }

    showSimpleAuthModal(mode) {
        alert(`${mode} functionality will be implemented here. Backend is running on port 3001.`);
    }

    setupEventListeners() {
        console.log('👂 Setting up event listeners...');
        
        // Setup modal close functionality
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }
        
        const modalCloses = document.querySelectorAll('.modal-close');
        modalCloses.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });
    }

    showPage(pageId) {
        console.log(`📄 Showing page: ${pageId}`);
        
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.add('hidden'));
        
        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = pageId;
            
            // Update navigation
            this.updateNavigation(pageId);
        }
    }

    updateNavigation(activePageId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === activePageId) {
                link.classList.add('active');
            }
        });
    }

    hideModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial data...');
            
            // Try to load resources
            const resourcesData = await Port42API.getResources();
            console.log('Resources loaded:', resourcesData);
            
            // Update UI with loaded data
            this.updateResourcesDisplay(resourcesData);
            
        } catch (error) {
            console.warn('Failed to load initial data:', error);
            // Continue without data
        }
    }

    updateResourcesDisplay(data) {
        const resourcesContainer = document.getElementById('resources-container');
        if (resourcesContainer && data.resources) {
            if (data.resources.length === 0) {
                resourcesContainer.innerHTML = `
                    <div class="no-resources">
                        <h3>No resources found</h3>
                        <p>Be the first to submit a resource!</p>
                    </div>
                `;
            } else {
                // Display resources here
                console.log('Displaying resources:', data.resources);
            }
        }
    }

    showError(message) {
        console.error('🚨 Showing error:', message);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            const loadingStatus = loadingScreen.querySelector('.loading-status');
            if (loadingText) loadingText.textContent = 'ERROR INITIALIZING PORT42';
            if (loadingStatus) loadingStatus.textContent = `Error: ${message}`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, starting Port42...');
    try {
        window.port42App = new Port42AppSimple();
    } catch (error) {
        console.error('💥 Failed to start Port42:', error);
        
        // Show error in loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const loadingStatus = loadingScreen.querySelector('.loading-status');
            if (loadingStatus) {
                loadingStatus.textContent = `Startup Error: ${error.message}`;
                loadingStatus.style.color = '#ff0040';
            }
        }
    }
});

// Fallback initialization after 5 seconds if something goes wrong
setTimeout(() => {
    if (!window.port42App || !window.port42App.isInitialized) {
        console.warn('⚠️ Fallback initialization triggered');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.remove('hidden');
        }
    }
}, 5000);

console.log('✅ Port42 simple app script loaded');
