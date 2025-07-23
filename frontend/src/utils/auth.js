// 🔐 Port42 Authentication Manager
// Handles user authentication state and UI updates

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authCallbacks = [];
        
        // Check if user is already logged in
        this.initializeAuth();
    }

    // 🚀 Initialize authentication state
    async initializeAuth() {
        const token = localStorage.getItem('port42_token');
        
        if (token) {
            try {
                const response = await api.getCurrentUser();
                this.setUser(response.user);
                this.updateAuthUI();
            } catch (error) {
                console.warn('Invalid token, removing:', error);
                this.logout();
            }
        }
    }

    // 👤 Set current user and update state
    setUser(user) {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        this.notifyAuthCallbacks();
    }

    // 🚪 Logout user
    async logout() {
        await api.logout();
        this.setUser(null);
        this.updateAuthUI();
        
        // Redirect to home if on protected page
        if (window.app && window.app.currentPage === 'profile') {
            window.app.showPage('home');
        }
    }

    // 📝 Register new user
    async register(userData) {
        try {
            const response = await api.register(userData);
            this.setUser(response.user);
            this.updateAuthUI();
            this.hideAuthModal();
            
            this.showNotification('Welcome to Port42! Your neural interface is now active.', 'success');
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    // 🔑 Login user
    async login(credentials) {
        try {
            const response = await api.login(credentials);
            this.setUser(response.user);
            this.updateAuthUI();
            this.hideAuthModal();
            
            this.showNotification(`Welcome back, ${response.user.username}!`, 'success');
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    // 🔄 Update profile
    async updateProfile(profileData) {
        try {
            const response = await api.updateProfile(profileData);
            this.setUser(response.user);
            this.updateAuthUI();
            
            this.showNotification('Profile updated successfully!', 'success');
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    // 🔔 Add authentication state callback
    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    // 📢 Notify all auth callbacks
    notifyAuthCallbacks() {
        this.authCallbacks.forEach(callback => {
            try {
                callback(this.isAuthenticated, this.currentUser);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }

    // 🎨 Update authentication UI
    updateAuthUI() {
        const userMenu = document.getElementById('user-menu');
        const authButtons = document.getElementById('auth-buttons');
        const usernameEl = userMenu?.querySelector('.username');
        const userRepEl = document.getElementById('user-rep');
        const userLevelEl = document.getElementById('user-level');

        if (this.isAuthenticated && this.currentUser) {
            // Show user menu, hide auth buttons
            userMenu?.classList.remove('hidden');
            authButtons?.classList.add('hidden');

            // Update user info
            if (usernameEl) usernameEl.textContent = this.currentUser.username.toUpperCase();
            if (userRepEl) userRepEl.textContent = this.currentUser.reputation || 0;
            if (userLevelEl) userLevelEl.textContent = this.currentUser.level || 'NEWBIE';

        } else {
            // Hide user menu, show auth buttons
            userMenu?.classList.add('hidden');
            authButtons?.classList.remove('hidden');
        }
    }

    // 🪟 Show authentication modal
    showAuthModal(mode = 'login') {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('auth-modal');
        const title = document.getElementById('auth-modal-title');
        const form = document.getElementById('auth-form');
        const fields = document.getElementById('auth-fields');
        const submit = document.getElementById('auth-submit');
        const switchText = document.getElementById('auth-switch-text');
        const switchBtn = document.getElementById('auth-switch-btn');

        // Clear previous content
        fields.innerHTML = '';
        form.reset();

        if (mode === 'login') {
            title.textContent = 'NEURAL INTERFACE LOGIN';
            submit.textContent = 'JACK IN';
            switchText.textContent = 'Need access?';
            switchBtn.textContent = 'Register';

            fields.innerHTML = `
                <div class="form-group">
                    <label for="login-field">USERNAME OR EMAIL:</label>
                    <input type="text" id="login-field" name="login" class="cyber-input" required>
                </div>
                <div class="form-group">
                    <label for="password-field">PASSWORD:</label>
                    <input type="password" id="password-field" name="password" class="cyber-input" required>
                </div>
            `;

        } else {
            title.textContent = 'CREATE NEURAL PROFILE';
            submit.textContent = 'INITIALIZE';
            switchText.textContent = 'Already have access?';
            switchBtn.textContent = 'Login';

            fields.innerHTML = `
                <div class="form-group">
                    <label for="username-field">USERNAME:</label>
                    <input type="text" id="username-field" name="username" class="cyber-input" required 
                           pattern="[a-zA-Z0-9_-]+" title="Only letters, numbers, underscores, and hyphens allowed">
                    <div class="field-feedback" id="username-feedback"></div>
                </div>
                <div class="form-group">
                    <label for="email-field">EMAIL:</label>
                    <input type="email" id="email-field" name="email" class="cyber-input" required>
                </div>
                <div class="form-group">
                    <label for="display-name-field">DISPLAY NAME (optional):</label>
                    <input type="text" id="display-name-field" name="displayName" class="cyber-input">
                </div>
                <div class="form-group">
                    <label for="reg-password-field">PASSWORD:</label>
                    <input type="password" id="reg-password-field" name="password" class="cyber-input" 
                           required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirm-password-field">CONFIRM PASSWORD:</label>
                    <input type="password" id="confirm-password-field" name="confirmPassword" class="cyber-input" required>
                </div>
            `;

            // Add username validation
            const usernameField = document.getElementById('username-field');
            const feedback = document.getElementById('username-feedback');
            let usernameTimeout;

            usernameField.addEventListener('input', () => {
                clearTimeout(usernameTimeout);
                usernameTimeout = setTimeout(async () => {
                    const username = usernameField.value.trim();
                    if (username.length >= 3) {
                        try {
                            const result = await api.checkUsername(username);
                            feedback.textContent = result.message;
                            feedback.className = `field-feedback ${result.available ? 'success' : 'error'}`;
                        } catch (error) {
                            feedback.textContent = 'Unable to check username';
                            feedback.className = 'field-feedback error';
                        }
                    } else {
                        feedback.textContent = '';
                    }
                }, 500);
            });
        }

        // Set up form submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            submit.disabled = true;
            submit.textContent = 'PROCESSING...';

            try {
                if (mode === 'login') {
                    await this.login(data);
                } else {
                    // Validate password confirmation
                    if (data.password !== data.confirmPassword) {
                        throw new Error('Passwords do not match');
                    }
                    
                    // Remove confirmPassword from data
                    delete data.confirmPassword;
                    
                    await this.register(data);
                }
            } catch (error) {
                console.error('Auth error:', error);
            } finally {
                submit.disabled = false;
                submit.textContent = mode === 'login' ? 'JACK IN' : 'INITIALIZE';
            }
        };

        // Set up mode switching
        switchBtn.onclick = () => {
            this.showAuthModal(mode === 'login' ? 'register' : 'login');
        };

        overlay.classList.remove('hidden');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = fields.querySelector('input');
            firstInput?.focus();
        }, 100);
    }

    // 🚫 Hide authentication modal
    hideAuthModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('hidden');
    }

    // 📢 Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => notification.remove();

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }

    // 🛡️ Require authentication for action
    requireAuth(action) {
        if (this.isAuthenticated) {
            return action();
        } else {
            this.showAuthModal('login');
            return Promise.reject(new Error('Authentication required'));
        }
    }

    // 🔍 Check if user can perform action
    canPerformAction(action, resource = null) {
        if (!this.isAuthenticated) return false;

        switch (action) {
            case 'vote':
            case 'comment':
            case 'submit':
                return true;
            case 'edit':
            case 'delete':
                return resource && (
                    resource.submittedBy === this.currentUser._id ||
                    resource.author === this.currentUser._id ||
                    this.currentUser.isModerator
                );
            case 'moderate':
                return this.currentUser.isModerator;
            default:
                return false;
        }
    }
}

// Create global auth manager
window.auth = new AuthManager();

// Set up event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    loginBtn?.addEventListener('click', () => {
        auth.showAuthModal('login');
    });

    // Register button
    const registerBtn = document.getElementById('register-btn');
    registerBtn?.addEventListener('click', () => {
        auth.showAuthModal('register');
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
        auth.logout();
    });

    // Modal close buttons
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(btn => {
        btn.addEventListener('click', () => {
            auth.hideAuthModal();
        });
    });

    // Click outside modal to close
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            auth.hideAuthModal();
        }
    });
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        z-index: 1001;
        transform: translateX(100%);
        opacity: 0;
        transition: all var(--transition-normal);
        min-width: 300px;
        max-width: 500px;
        box-shadow: var(--glow-sm);
    }

    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }

    .notification-success {
        border-color: var(--neon-green);
        color: var(--neon-green);
    }

    .notification-error {
        border-color: var(--neon-red);
        color: var(--neon-red);
    }

    .notification-info {
        border-color: var(--neon-cyan);
        color: var(--neon-cyan);
    }

    .notification-message {
        flex: 1;
        font-family: var(--font-mono);
        font-size: 0.875rem;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity var(--transition-fast);
    }

    .notification-close:hover {
        opacity: 0.7;
    }

    .field-feedback {
        font-size: 0.75rem;
        margin-top: var(--spacing-xs);
        font-weight: 500;
    }

    .field-feedback.success {
        color: var(--neon-green);
    }

    .field-feedback.error {
        color: var(--neon-red);
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
