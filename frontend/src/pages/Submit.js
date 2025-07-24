// 📡 Submit Page Component
// Handles new resource submission

class Submit {
  constructor() {
    this.communities = [];
    this.isSubmitting = false;
    
    this.init();
  }

  init() {
    console.log('📡 Submit component initializing...');
    this.setupEventListeners();
    this.loadCommunities();
  }

  setupEventListeners() {
    const form = document.getElementById('submit-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Auto-fill URL metadata when URL is entered
    const urlInput = document.getElementById('resource-url');
    if (urlInput) {
      urlInput.addEventListener('blur', () => this.autoFillMetadata());
    }
  }

  async loadCommunities() {
    try {
      console.log('📡 Loading communities for submit form...');

      let response;
      if (window.api) {
        response = await window.api.getCommunities();
      } else {
        const res = await fetch('http://localhost:3001/api/communities');
        response = await res.json();
      }

      if (response.success) {
        this.communities = response.communities || [];
        this.populateCommunitySelect();
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  }

  populateCommunitySelect() {
    const select = document.getElementById('resource-community');
    if (!select) return;

    // Clear existing options except the first one
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
  }

  async autoFillMetadata() {
    const urlInput = document.getElementById('resource-url');
    const titleInput = document.getElementById('resource-title');
    const descriptionInput = document.getElementById('resource-description');
    
    if (!urlInput?.value || titleInput?.value) return;

    try {
      // Try to extract basic info from URL
      const url = urlInput.value;
      const domain = new URL(url).hostname;
      
      // Auto-detect resource type based on URL
      const typeSelect = document.getElementById('resource-type');
      if (typeSelect) {
        if (url.includes('youtube.com') || url.includes('vimeo.com')) {
          typeSelect.value = 'video';
        } else if (url.includes('github.com')) {
          typeSelect.value = 'tool';
        } else if (domain.includes('docs.') || url.includes('/docs/')) {
          typeSelect.value = 'tutorial';
        }
      }

      // Set placeholder title based on domain
      if (titleInput && !titleInput.value) {
        titleInput.placeholder = `Resource from ${domain}`;
      }

    } catch (error) {
      console.log('Could not auto-fill metadata:', error);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;

    // Check if user is authenticated
    if (!localStorage.getItem('token')) {
      if (window.auth) {
        window.auth.showAuthModal('login');
      }
      return;
    }

    this.isSubmitting = true;
    this.showSubmitting();

    try {
      const formData = this.getFormData();
      
      // Validate required fields
      if (!formData.title || !formData.url || !formData.community) {
        throw new Error('Please fill in all required fields');
      }

      console.log('📡 Submitting resource:', formData);

      let response;
      if (window.api) {
        response = await window.api.createResource(formData);
      } else {
        const res = await fetch('http://localhost:3001/api/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });
        response = await res.json();
      }

      if (response.success) {
        this.showSuccess('Resource submitted successfully!');
        this.resetForm();
        
        // Redirect to home page after a delay
        setTimeout(() => {
          if (window.app) {
            window.app.navigateToPage('home');
          }
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to submit resource');
      }
    } catch (error) {
      console.error('Failed to submit resource:', error);
      this.showError(error.message);
    } finally {
      this.isSubmitting = false;
      this.hideSubmitting();
    }
  }

  getFormData() {
    const title = document.getElementById('resource-title')?.value?.trim();
    const url = document.getElementById('resource-url')?.value?.trim();
    const description = document.getElementById('resource-description')?.value?.trim();
    const community = document.getElementById('resource-community')?.value;
    const type = document.getElementById('resource-type')?.value;
    const difficulty = document.getElementById('resource-difficulty')?.value;
    const tagsInput = document.getElementById('resource-tags')?.value?.trim();
    
    // Parse tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    return {
      title,
      url,
      description: description || undefined,
      community,
      type,
      difficulty,
      tags: tags.length > 0 ? tags : undefined
    };
  }

  resetForm() {
    const form = document.getElementById('submit-form');
    if (form) {
      form.reset();
    }
  }

  showSubmitting() {
    const submitBtn = document.querySelector('#submit-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'TRANSMITTING...';
      submitBtn.disabled = true;
    }
  }

  hideSubmitting() {
    const submitBtn = document.querySelector('#submit-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'TRANSMIT TO NETWORK';
      submitBtn.disabled = false;
    }
  }

  showSuccess(message) {
    if (window.notificationManager) {
      window.notificationManager.show(message, 'success');
    } else {
      alert(message);
    }
  }

  showError(message) {
    if (window.notificationManager) {
      window.notificationManager.show(message, 'error');
    } else {
      alert('Error: ' + message);
    }
  }

  // Public method to pre-fill form (useful for Chrome extension)
  preFillForm(data) {
    if (data.title) {
      const titleInput = document.getElementById('resource-title');
      if (titleInput) titleInput.value = data.title;
    }

    if (data.url) {
      const urlInput = document.getElementById('resource-url');
      if (urlInput) {
        urlInput.value = data.url;
        this.autoFillMetadata();
      }
    }

    if (data.description) {
      const descriptionInput = document.getElementById('resource-description');
      if (descriptionInput) descriptionInput.value = data.description;
    }

    if (data.type) {
      const typeSelect = document.getElementById('resource-type');
      if (typeSelect) typeSelect.value = data.type;
    }

    if (data.difficulty) {
      const difficultySelect = document.getElementById('resource-difficulty');
      if (difficultySelect) difficultySelect.value = data.difficulty;
    }

    if (data.tags && Array.isArray(data.tags)) {
      const tagsInput = document.getElementById('resource-tags');
      if (tagsInput) tagsInput.value = data.tags.join(', ');
    }
  }
}

// Initialize Submit component and make it globally available
window.Submit = new Submit();
