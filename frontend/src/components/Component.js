// 🧩 Base Component Class
// Foundation for all Port42 components with common functionality

export class Component {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.element = typeof selector === 'string' ? 
      document.querySelector(selector) : selector;
    this.options = { ...this.defaultOptions, ...options };
    this.state = { ...this.defaultState };
    this.events = new Map();
    this.children = new Map();
    
    if (!this.element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    this.init();
  }

  // Default options (override in subclasses)
  get defaultOptions() {
    return {
      autoRender: true,
      bindEvents: true
    };
  }

  // Default state (override in subclasses)
  get defaultState() {
    return {};
  }

  // Initialize component
  init() {
    this.createElement();
    if (this.options.autoRender) {
      this.render();
    }
    if (this.options.bindEvents) {
      this.bindEvents();
    }
  }

  // Create element structure (override in subclasses)
  createElement() {
    // Subclasses should implement this
  }

  // Render component (override in subclasses)
  render() {
    // Subclasses should implement this
  }

  // Bind event listeners (override in subclasses)
  bindEvents() {
    // Subclasses should implement this
  }

  // State management
  setState(newState, shouldRender = true) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    this.onStateChange(prevState, this.state);
    
    if (shouldRender) {
      this.render();
    }
  }

  getState() {
    return { ...this.state };
  }

  // Called when state changes (override in subclasses)
  onStateChange(prevState, newState) {
    // Subclasses can implement this
  }

  // Event handling
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }

  off(event, handler) {
    if (this.events.has(event)) {
      const handlers = this.events.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  // Child component management
  addChild(name, component) {
    this.children.set(name, component);
    return component;
  }

  getChild(name) {
    return this.children.get(name);
  }

  removeChild(name) {
    const child = this.children.get(name);
    if (child && child.destroy) {
      child.destroy();
    }
    this.children.delete(name);
  }

  // Utility methods
  find(selector) {
    return this.element.querySelector(selector);
  }

  findAll(selector) {
    return this.element.querySelectorAll(selector);
  }

  addClass(className) {
    this.element.classList.add(className);
    return this;
  }

  removeClass(className) {
    this.element.classList.remove(className);
    return this;
  }

  toggleClass(className, force) {
    this.element.classList.toggle(className, force);
    return this;
  }

  hasClass(className) {
    return this.element.classList.contains(className);
  }

  show() {
    this.removeClass('hidden');
    return this;
  }

  hide() {
    this.addClass('hidden');
    return this;
  }

  toggle(force) {
    this.toggleClass('hidden', force !== undefined ? !force : undefined);
    return this;
  }

  // Animation helpers
  fadeIn(duration = 300) {
    return new Promise(resolve => {
      this.element.style.opacity = '0';
      this.element.style.transition = `opacity ${duration}ms ease`;
      this.show();
      
      requestAnimationFrame(() => {
        this.element.style.opacity = '1';
        setTimeout(() => {
          this.element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  }

  fadeOut(duration = 300) {
    return new Promise(resolve => {
      this.element.style.opacity = '1';
      this.element.style.transition = `opacity ${duration}ms ease`;
      
      requestAnimationFrame(() => {
        this.element.style.opacity = '0';
        setTimeout(() => {
          this.hide();
          this.element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  }

  // Loading state
  setLoading(isLoading, message = 'Loading...') {
    this.setState({ 
      isLoading, 
      loadingMessage: message 
    });
  }

  // Error handling
  setError(error, showToUser = true) {
    const errorMessage = error.message || error;
    this.setState({ 
      hasError: true, 
      error: errorMessage 
    });
    
    if (showToUser) {
      this.showError(errorMessage);
    }
  }

  clearError() {
    this.setState({ 
      hasError: false, 
      error: null 
    });
  }

  showError(message) {
    // This should be implemented by subclasses or use a global notification system
    console.error('Component error:', message);
  }

  // Cleanup
  destroy() {
    // Remove all child components
    this.children.forEach((child, name) => {
      this.removeChild(name);
    });

    // Clear all events
    this.events.clear();

    // Remove element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  // Debug helpers
  debug() {
    console.group(`🧩 Component: ${this.constructor.name}`);
    console.log('Element:', this.element);
    console.log('State:', this.state);
    console.log('Options:', this.options);
    console.log('Children:', [...this.children.keys()]);
    console.log('Events:', [...this.events.keys()]);
    console.groupEnd();
  }
}

export default Component;
