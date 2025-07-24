// 📱 Notification System
// Handles toast notifications with cyberpunk styling

import Component from './Component.js';
import config from '../config/index.js';

export class NotificationManager extends Component {
  constructor() {
    super(document.body);
    this.notifications = [];
    this.maxVisible = config.ui.notifications.maxVisible;
    this.defaultDuration = config.ui.notifications.duration;
  }

  get defaultOptions() {
    return {
      autoRender: false,
      bindEvents: false
    };
  }

  createElement() {
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('notification-container');
    }
  }

  // Show success notification
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  // Show error notification
  error(message, options = {}) {
    return this.show(message, 'error', { duration: 0, ...options });
  }

  // Show warning notification
  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  // Show info notification
  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  // Show custom notification
  show(message, type = 'info', options = {}) {
    const notification = {
      id: this.generateId(),
      message,
      type,
      timestamp: Date.now(),
      ...options
    };

    this.notifications.push(notification);
    this.render();

    // Auto remove after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || this.defaultDuration;
      setTimeout(() => {
        this.remove(notification.id);
      }, duration);
    }

    return notification.id;
  }

  // Remove notification by ID
  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.render();
  }

  // Clear all notifications
  clear() {
    this.notifications = [];
    this.render();
  }

  render() {
    if (!this.container) {
      this.createElement();
    }

    // Limit visible notifications
    const visibleNotifications = this.notifications.slice(-this.maxVisible);

    this.container.innerHTML = visibleNotifications.map(notification => 
      this.renderNotification(notification)
    ).join('');

    // Add event listeners for close buttons
    this.container.querySelectorAll('.notification-close').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.target.closest('.notification').dataset.id;
        this.remove(id);
      });
    });
  }

  renderNotification(notification) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    return `
      <div class="notification notification--${notification.type}" data-id="${notification.id}">
        <div class="notification__content">
          <div class="notification__icon">${icons[notification.type] || icons.info}</div>
          <div class="notification__message">${this.escapeHtml(notification.message)}</div>
          <button class="notification__close notification-close" aria-label="Close notification">
            <span>×</span>
          </button>
        </div>
        <div class="notification__progress"></div>
      </div>
    `;
  }

  generateId() {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
const notifications = new NotificationManager();

// Add CSS for notifications
const notificationStyles = `
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    pointer-events: none;
  }

  .notification {
    background: var(--bg-secondary);
    border: 1px solid var(--neon-green);
    border-radius: var(--border-radius);
    margin-bottom: 10px;
    min-width: 300px;
    max-width: 500px;
    pointer-events: auto;
    transform: translateX(100%);
    animation: slideIn 0.3s ease forwards;
    position: relative;
    overflow: hidden;
    box-shadow: var(--glow-sm);
  }

  .notification--success {
    border-color: var(--neon-green);
    box-shadow: 0 0 10px var(--neon-green);
  }

  .notification--error {
    border-color: var(--neon-red);
    box-shadow: 0 0 10px var(--neon-red);
  }

  .notification--warning {
    border-color: var(--neon-orange);
    box-shadow: 0 0 10px var(--neon-orange);
  }

  .notification--info {
    border-color: var(--neon-cyan);
    box-shadow: 0 0 10px var(--neon-cyan);
  }

  .notification__content {
    display: flex;
    align-items: center;
    padding: 15px;
    gap: 10px;
  }

  .notification__icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .notification__message {
    flex: 1;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.4;
  }

  .notification__close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .notification__close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }

  .notification__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: currentColor;
    animation: progress 5s linear forwards;
  }

  @keyframes slideIn {
    to {
      transform: translateX(0);
    }
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  /* Remove progress bar for error notifications */
  .notification--error .notification__progress {
    display: none;
  }
`;

// Inject styles
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = notificationStyles;
  document.head.appendChild(style);
}

export default notifications;
