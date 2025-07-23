// 🌐 Port42 Main Application
// Handles page routing, initialization, and core functionality

class Port42App {
    constructor() {
        this.currentPage = 'home';
        this.isLoading = true;
        this.resources = [];
        this.communities = [];
        this.currentFilters = {};
        
        this.init();
    }

    // 🚀 Initialize the application
    async init() {
        console.log('🌐 Initializing Port42 Neural Network...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize matrix background
            this.initMatrixBackground();
            
            // Set up navigation
            this.setupNavigation();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Hide loading screen and show home page
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showPage('home');
            }, 2000);
            
            console.log('✅ Port42 initialization complete');
            
        } catch (error) {
            console.error('❌ Port42 initialization failed:', error);
            this.showError('Failed to initialize Port42. Please refresh the page.');
        }
    }

    // 📊 Load initial data
    async loadInitialData() {
        try {
            // Load communities for filters and forms
            const communitiesData = await api.getCommunities({ sort: 'popular' });
            this.communities = communitiesData.communities || [];
            
            // Populate community dropdowns
            this.populateCommunitySelects();
            
            console.log(`📊 Loaded ${this.communities.length} communities`);
            
        } catch (error) {
            console.warn('Failed to load initial data:', error);
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
                this.showPage(page);
            });
        });
    }

    // 📄 Show specific page
    showPage(pageName) {
        // Require auth for certain pages
        if (pageName === 'profile' && !auth.isAuthenticated) {
            auth.showAuthModal('login');
            return;
        }
        
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.add('hidden'));
        
        // Update nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = pageName;
            
            // Load page data
            this.loadPageData(pageName);
            
            // Update URL without reload
            window.history.pushState({ page: pageName }, '', `#${pageName}`);
        }
    }

    // 📊 Load data for specific page
    async loadPageData(pageName) {
        switch (pageName) {
            case 'home':
                if (window.Home) {
                    await window.Home.loadResources();
                }
                break;
            case 'communities':
                if (window.Communities) {
                    await window.Communities.loadCommunities();
                }
                break;
            case 'profile':
                if (window.Profile) {
                    await window.Profile.loadProfile();
                }
                break;
        }
    }

    // 🎛️ Set up global event listeners
    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'home';
            this.showPage(page);
        });
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && ['home', 'communities', 'submit', 'profile'].includes(hash)) {
                this.showPage(hash);
            }
        });
        
        // Initialize from URL hash
        const initialHash = window.location.hash.slice(1);
        if (initialHash && ['home', 'communities', 'submit', 'profile'].includes(initialHash)) {
            this.currentPage = initialHash;
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                auth.hideAuthModal();
                this.hideResourceModal();
            }
            
            // Ctrl/Cmd + / for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                searchInput?.focus();
            }
        });
        
        // Handle offline/online events
        window.addEventListener('offline', () => {
            auth.showNotification('Connection lost. Some features may not work.', 'error');
        });
        
        window.addEventListener('online', () => {
            auth.showNotification('Connection restored!', 'success');
        });
    }

    // 🏢 Populate community select dropdowns
    populateCommunitySelects() {
        const selects = document.querySelectorAll('#community-filter, #resource-community');
        
        selects.forEach(select => {
            // Clear existing options (except first)
            const firstOption = select.firstElementChild;
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }
            
            // Add community options
            this.communities.forEach(community => {
                const option = document.createElement('option');
                option.value = community._id;
                option.textContent = community.name.toUpperCase();
                select.appendChild(option);
            });
        });
    }

    // 🪟 Show resource detail modal
    showResourceModal(resourceId) {
        // Implementation will be in Resource component
        if (window.Resource) {
            window.Resource.showModal(resourceId);
        }
    }

    // 🚫 Hide resource modal
    hideResourceModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.add('hidden');
        
        // Leave socket room
        if (window.socketManager) {
            window.socketManager.leaveResourceRoom(window.socketManager.currentResourceId);
        }
    }

    // 🚨 Show error message
    showError(message) {
        auth.showNotification(message, 'error');
    }

    // ✅ Show success message
    showSuccess(message) {
        auth.showNotification(message, 'success');
    }

    // 🔍 Global search function
    async globalSearch(query) {
        if (!query.trim()) return;
        
        try {
            // Switch to home page and apply search
            this.showPage('home');
            
            // Update search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = query;
            }
            
            // Trigger search
            if (window.Home) {
                await window.Home.loadResources({ search: query });
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed. Please try again.');
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
    async refresh() {
        await this.loadPageData(this.currentPage);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Port42App();
});

// Make app globally available
window.Port42App = Port42App;
