// 🌐 Port42 Main Application
// Handles page routing, initialization, and core functionality
// Enhanced with component architecture and state management

class Port42App {
    constructor() {
        console.log('🏗️ Creating Port42App instance...');
        
        // Check dependencies
        if (!window.state) {
            console.error('❌ State manager not found!');
            throw new Error('State manager is required');
        }
        
        if (!window.api) {
            console.error('❌ API client not found!');
            throw new Error('API client is required');
        }
        
        console.log('✅ Dependencies verified');
        
        this.currentPage = 'home';
        this.isLoading = true;
        this.state = window.state;
        this.api = window.api;
        this.components = new Map();
        this.routes = new Map();
        
        // Initialize state
        this.initializeState();
        
        // Start initialization
        this.init();
    }

    // 🏗️ Initialize application state
    initializeState() {
        this.state.set('app.currentPage', 'home');
        this.state.set('app.isLoading', true);
        this.state.set('app.initialized', false);
        this.state.set('resources', []);
        this.state.set('communities', []);
        this.state.set('filters', {});
        
        // Subscribe to state changes
        this.state.subscribe('app.currentPage', (newPage) => {
            this.handlePageChange(newPage);
        });
    }

    // 🚀 Initialize the application
    async init() {
        console.log('🌐 Initializing Port42 Neural Network...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize services
            await this.initializeServices();
            
            // Initialize matrix background
            this.initMatrixBackground();
            
            // Initialize components
            this.initializeComponents();
            
            // Set up navigation and routing
            this.setupNavigation();
            this.setupRouting();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.state.set('app.initialized', true);
            this.state.set('app.isLoading', false);
            
            // Hide loading screen and show initial page
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showInitialPage();
            }, 2000);
            
            console.log('✅ Port42 initialization complete');
            
        } catch (error) {
            console.error('❌ Port42 initialization failed:', error);
            this.state.set('app.isLoading', false);
            window.notificationManager.show('Failed to initialize Port42. Please refresh the page.', 'error');
        }
    }

    // 🔧 Initialize core services
    async initializeServices() {
        try {
            // Initialize Socket Manager
            if (window.socketManager) {
                window.socketManager.on('connected', () => {
                    window.notificationManager.show('Real-time features connected', 'success');
                });
                
                window.socketManager.on('disconnected', () => {
                    window.notificationManager.show('Real-time features disconnected', 'warning');
                });
            }
            
            console.log('✅ Services initialized');
        } catch (error) {
            console.warn('⚠️ Some services failed to initialize:', error);
        }
    }

    // 🧩 Initialize components
    initializeComponents() {
        // Register route handlers
        this.routes.set('home', () => this.loadHomeComponent());
        this.routes.set('communities', () => this.loadCommunitiesComponent());
        this.routes.set('submit', () => this.loadSubmitComponent());
        this.routes.set('profile', () => this.loadProfileComponent());
        
        console.log('✅ Components registered');
    }

    // 📊 Load initial data
    async loadInitialData() {
        try {
            this.state.set('app.loadingData', true);
            
            // Load communities for filters and forms
            const communitiesData = await this.api.getCommunities({ sort: 'popular' });
            const communities = communitiesData.communities || [];
            
            this.state.set('communities', communities);
            
            // Populate community dropdowns
            this.populateCommunitySelects(communities);
            
            console.log(`📊 Loaded ${communities.length} communities`);
            
        } catch (error) {
            console.warn('Failed to load initial data:', error);
            window.notificationManager.show('Failed to load some data. Some features may not work properly.', 'warning');
        } finally {
            this.state.set('app.loadingData', false);
        }
    }

    // 🏠 Load home component
    async loadHomeComponent() {
        if (!this.components.has('home')) {
            // Initialize home component logic here
            console.log('🏠 Loading home component');
        }
    }

    // 🏘️ Load communities component
    async loadCommunitiesComponent() {
        if (!this.components.has('communities')) {
            console.log('🏘️ Loading communities component');
        }
    }

    // 📝 Load submit component
    async loadSubmitComponent() {
        if (!this.components.has('submit')) {
            console.log('📝 Loading submit component');
        }
    }

    // 👤 Load profile component
    async loadProfileComponent() {
        if (!this.components.has('profile')) {
            console.log('👤 Loading profile component');
        }
    }

    // 🎬 Show loading screen with animated progress
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = loadingScreen.querySelector('.loading-progress');
        const statusText = loadingScreen.querySelector('.loading-status');
        
        loadingScreen.classList.remove('hidden');
        
        const statuses = [
            'CONNECTING TO THE MATRIX',
            'INITIALIZING NEURAL PATHWAYS',
            'LOADING COMMUNITY DATA',
            'SYNCING KNOWLEDGE BASE',
            'ESTABLISHING QUANTUM LINK',
            'NEURAL INTERFACE READY'
        ];
        
        let statusIndex = 0;
        let progress = 0;
        
        const updateProgress = () => {
            progress += Math.random() * 20;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            
            if (statusIndex < statuses.length - 1 && progress > (statusIndex + 1) * 16) {
                statusIndex++;
                statusText.textContent = statuses[statusIndex];
            }
            
            if (progress < 100) {
                setTimeout(updateProgress, 200 + Math.random() * 300);
            }
        };
        
        updateProgress();
    }

    // 🎬 Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            loadingScreen.style.opacity = '1';
        }, 500);
    }

    // 🎨 Initialize Matrix background effect
    initMatrixBackground() {
        const canvas = document.getElementById('matrix-bg');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Matrix characters
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charArray = chars.split('');
        
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        // Animation function
        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px JetBrains Mono, monospace`;
            
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
        };
        
        // Start animation
        setInterval(drawMatrix, 35);
    }

    // 🧭 Set up navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    // �️ Set up routing system
    setupRouting() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'home';
            this.state.set('app.currentPage', page);
        });
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && this.routes.has(hash)) {
                this.state.set('app.currentPage', hash);
            }
        });
        
        // Initialize from URL hash
        const initialHash = window.location.hash.slice(1);
        if (initialHash && this.routes.has(initialHash)) {
            this.state.set('app.currentPage', initialHash);
        }
    }

    // 🧭 Navigate to page
    navigateToPage(pageName) {
        // Require auth for certain pages
        if (pageName === 'profile' && !window.auth?.isAuthenticated) {
            window.auth?.showAuthModal('login');
            return;
        }
        
        this.state.set('app.currentPage', pageName);
    }

    // 🎛️ Handle page changes from state
    handlePageChange(newPage) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.add('hidden'));
        
        // Update nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.page === newPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Show target page
        const targetPage = document.getElementById(`${newPage}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = newPage;
            
            // Load page component
            this.loadPageComponent(newPage);
            
            // Update URL without reload
            window.history.pushState({ page: newPage }, '', `#${newPage}`);
        }
    }

    // � Show initial page
    showInitialPage() {
        const currentPage = this.state.get('app.currentPage');
        this.handlePageChange(currentPage);
    }

    // 📊 Load page component
    async loadPageComponent(pageName) {
        if (this.routes.has(pageName)) {
            try {
                await this.routes.get(pageName)();
            } catch (error) {
                console.error(`Failed to load ${pageName} component:`, error);
                window.notificationManager.show(`Failed to load ${pageName} page`, 'error');
            }
        }
    }

    // 🎛️ Set up global event listeners
    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                window.auth?.hideAuthModal();
                this.hideResourceModal();
            }
            
            // Ctrl/Cmd + / for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Ctrl/Cmd + K for command palette (future feature)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                // Future: Open command palette
            }
        });
        
        // Handle offline/online events
        window.addEventListener('offline', () => {
            window.notificationManager.show('Connection lost. Some features may not work.', 'error');
            this.state.set('app.isOnline', false);
        });
        
        window.addEventListener('online', () => {
            window.notificationManager.show('Connection restored!', 'success');
            this.state.set('app.isOnline', true);
        });
        
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.state.set('app.isVisible', false);
            } else {
                this.state.set('app.isVisible', true);
                // Refresh data when returning to tab
                this.refreshCurrentPage();
            }
        });
    }

    // 🏢 Populate community select dropdowns
    populateCommunitySelects(communities) {
        const selects = document.querySelectorAll('#community-filter, #resource-community');
        
        selects.forEach(select => {
            // Clear existing options (except first)
            const firstOption = select.firstElementChild;
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }
            
            // Add community options
            communities.forEach(community => {
                const option = document.createElement('option');
                option.value = community._id;
                option.textContent = community.name.toUpperCase();
                select.appendChild(option);
            });
        });
    }

    // 🪟 Show resource detail modal
    showResourceModal(resourceId) {
        // Join socket room for real-time updates
        if (window.socketManager) {
            window.socketManager.joinRoom(resourceId);
        }
        
        // Implementation will be in Resource component
        if (window.Resource) {
            window.Resource.showModal(resourceId);
        }
    }

    // 🚫 Hide resource modal
    hideResourceModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Leave socket room
        if (window.socketManager) {
            window.socketManager.leaveRoom();
        }
    }

    // 🔍 Global search function
    async globalSearch(query) {
        if (!query.trim()) return;
        
        try {
            // Switch to home page and apply search
            this.state.set('app.currentPage', 'home');
            
            // Update search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = query;
            }
            
            // Store search query in state
            this.state.set('search.query', query);
            
            // Trigger search
            if (window.Home) {
                await window.Home.loadResources({ search: query });
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            window.notificationManager.show('Search failed. Please try again.', 'error');
        }
    }

    // 🎯 Focus search
    focusSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    // 🔄 Refresh current page data
    async refreshCurrentPage() {
        const currentPage = this.state.get('app.currentPage');
        await this.loadPageComponent(currentPage);
    }

    // 📈 Get application metrics
    getMetrics() {
        return {
            initialized: this.state.get('app.initialized'),
            currentPage: this.state.get('app.currentPage'),
            isOnline: this.state.get('app.isOnline'),
            isVisible: this.state.get('app.isVisible'),
            componentsLoaded: this.components.size,
            routesRegistered: this.routes.size,
            socketStatus: window.socketManager?.getStatus(),
            stateSize: this.state.getSize()
        };
    }

    // 🐛 Debug application state
    debug() {
        console.group('🌐 Port42 Debug Information');
        console.log('App Metrics:', this.getMetrics());
        console.log('State:', this.state.getAll());
        console.log('Components:', [...this.components.keys()]);
        console.log('Routes:', [...this.routes.keys()]);
        
        if (window.socketManager) {
            window.socketManager.debug();
        }
        
        console.groupEnd();
    }

    // 🧹 Cleanup when app is destroyed
    destroy() {
        // Disconnect socket
        if (window.socketManager) {
            window.socketManager.disconnect();
        }
        
        // Clear components
        this.components.clear();
        this.routes.clear();
        
        // Clear state subscriptions
        this.state.clearSubscriptions();
        
        console.log('🧹 Port42 app cleaned up');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 DOM loaded, initializing Port42...');
        window.app = new Port42App();
    } catch (error) {
        console.error('🚨 Failed to initialize Port42:', error);
        // Force hide loading screen and show error
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        document.body.innerHTML += '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: red; color: white; padding: 20px; z-index: 9999;">Error loading Port42. Check console for details.</div>';
    }
});

// Fallback initialization after 3 seconds if nothing happens
setTimeout(() => {
    if (!window.app) {
        console.warn('⚠️ Fallback initialization triggered');
        try {
            window.app = new Port42App();
        } catch (error) {
            console.error('🚨 Fallback initialization failed:', error);
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }
    }
}, 3000);

// Make app globally available
window.Port42App = Port42App;
