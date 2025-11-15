import { AuthManager } from "../core/AuthManager.js";
import { ComponentBase } from "../core/ComponentBase.js";
import { loading } from "../utils/loadingOverlay.js";
import apiClient from '../api.js';

/**
 * ComboBox Component
 * Reusable dropdown/select component with local and remote data loading
 * 
 * Features:
 * - Local and remote data loading
 * - Value/Display field mapping
 * - State persistence across navigation
 * - Event handling (select, change, load)
 * - Integration with Grid component
 * 
 * Usage:
 * <x-combo 
 *   data-id="status-combo"
 *   data-value="in-progress"
 *   data-display-value="In Progress"
 *   data-source="/api/statuses"
 *   data-query-mode="remote"
 *   data-value-field="id"
 *   data-display-field="name"
 *   data-placeholder="Select status...">
 * </x-combo>
 */
export class ComboBox extends ComponentBase {
  constructor() {
    super();
    
    this.state = {
      loading: false,
      error: null,
      options: [],
      value: null,
      displayValue: null,
      isOpen: false
    };
    
    // Configuration
    this.comboId = null;
    this.dataSource = null;
    this.queryMode = 'local'; // 'local' or 'remote'
    this.valueField = 'value';
    this.displayField = 'label';
    this.placeholder = '-- Select --';
    this.disabled = false;
    this.required = false;
    
    // Data
    this.store = []; // All loaded options
    this.filteredOptions = []; // Filtered/searched options
    
    // Event handlers
    this.onSelectHandler = null;
    this.onChangeHandler = null;
    this.onLoadHandler = null;
    
    // Internal flags
    this._userInteracted = false;
    this._dropdownOpen = false;
    this._originalValue = null;
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  
  onInit() {
    this.parseAttributes();
    this.render();
    this.setupEvents();
    this.loadData();
    
    // Register update handlers
    this.registerUpdateHandler('value', this.handleValueUpdate);
    this.registerUpdateHandler('options', this.handleOptionsUpdate);
  }

  onDestroy() {
    this.store = [];
    this.filteredOptions = [];
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  parseAttributes() {
    this.comboId = this.getAttribute('data-id') || this.generateId();
    this.dataSource = this.getAttribute('data-source') || null;
    this.queryMode = this.getAttribute('data-query-mode') || 'local';
    this.valueField = this.getAttribute('data-value-field') || 'value';
    this.displayField = this.getAttribute('data-display-field') || 'label';
    this.placeholder = this.getAttribute('data-placeholder') || '-- Select --';
    this.disabled = this.getAttribute('data-disabled') === 'true';
    this.required = this.getAttribute('data-required') === 'true';
    
    // Initial value
    const initialValue = this.getAttribute('data-value');
    const displayValue = this.getAttribute('data-display-value');
    
    if (initialValue) {
      this.state.value = initialValue;
      this.state.displayValue = displayValue || initialValue;
      this._originalValue = initialValue;
    }
    
    // Parse inline options if provided
    const optionsAttr = this.getAttribute('data-options');
    if (optionsAttr) {
      try {
        this.store = JSON.parse(optionsAttr);
        this.state.options = this.store;
      } catch (e) {
        console.warn('Invalid data-options JSON:', e);
      }
    }
  }

  generateId() {
    return `combo-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // RENDERING
  // ============================================
  
  render() {
    const displayText = this.getDisplayText();
    const isLoading = this.state.loading;
    
    this.innerHTML = `
      <div class="combo-wrapper" data-combo-id="${this.comboId}">
        <button 
          type="button"
          class="combo-trigger ${this.disabled ? 'disabled' : ''}"
          ${this.disabled ? 'disabled' : ''}
          aria-haspopup="listbox"
          aria-expanded="${this.state.isOpen}">
          <span class="combo-value ${!displayText ? 'placeholder' : ''}">
            ${isLoading ? 'Loading...' : (displayText || this.placeholder)}
          </span>
          <span class="combo-icon">
            ${isLoading ? '<i class="fa-solid fa-spinner fa-spin"></i>' : '<i class="fa-solid fa-chevron-down"></i>'}
          </span>
        </button>
        
        <div class="combo-dropdown" style="display: none;">
          <div class="combo-search">
            <input 
              type="text" 
              class="combo-search-input" 
              placeholder="Search..."
              autocomplete="off">
          </div>
          
          <ul class="combo-options" role="listbox">
            ${this.renderOptions()}
          </ul>
          
          ${this.state.error ? `
            <div class="combo-error">
              <i class="fa-solid fa-exclamation-circle"></i>
              ${this.state.error}
            </div>
          ` : ''}
          
          ${this.state.options.length === 0 && !isLoading ? `
            <div class="combo-empty">
              <i class="fa-solid fa-inbox"></i>
              No options available
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderOptions() {
    const options = this.filteredOptions.length > 0 ? this.filteredOptions : this.state.options;
    
    if (options.length === 0) {
      return '';
    }
    
    return options.map(option => {
      const value = this.getOptionValue(option);
      const display = this.getOptionDisplay(option);
      const isSelected = value === this.state.value;
      
      return `
        <li 
          class="combo-option ${isSelected ? 'selected' : ''}"
          role="option"
          data-value="${this.escapeHtml(String(value))}"
          aria-selected="${isSelected}">
          ${this.escapeHtml(display)}
        </li>
      `;
    }).join('');
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  setupEvents() {
    const trigger = this.querySelector('.combo-trigger');
    const dropdown = this.querySelector('.combo-dropdown');
    const searchInput = this.querySelector('.combo-search-input');
    
    if (trigger) {
      this.addManagedEventListener(trigger, 'click', this.handleTriggerClick);
    }
    
    if (searchInput) {
      this.addManagedEventListener(searchInput, 'input', this.handleSearch);
      this.addManagedEventListener(searchInput, 'keydown', this.handleSearchKeydown);
    }
    
    if (dropdown) {
      this.addManagedEventListener(dropdown, 'click', this.handleDropdownClick);
    }
    
    // Close on outside click
    this.addManagedEventListener(document, 'click', this.handleOutsideClick);
    
    // Keyboard navigation
    this.addManagedEventListener(document, 'keydown', this.handleKeydown);
  }

  handleTriggerClick = (e) => {
    e.stopPropagation();
    
    if (this.disabled) return;
    
    this._dropdownOpen = !this._dropdownOpen;
    this.toggleDropdown();
  }

  handleDropdownClick = (e) => {
    const option = e.target.closest('.combo-option');
    if (!option) return;
    
    e.stopPropagation();
    
    const value = option.dataset.value;
    this.selectValue(value);
    this._userInteracted = true;
    this.closeDropdown();
  }

  handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
      this.filteredOptions = [];
    } else {
      this.filteredOptions = this.state.options.filter(option => {
        const display = this.getOptionDisplay(option).toLowerCase();
        return display.includes(searchTerm);
      });
    }
    
    this.updateDropdownOptions();
  }

  handleSearchKeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeDropdown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const firstOption = this.querySelector('.combo-option');
      if (firstOption) {
        const value = firstOption.dataset.value;
        this.selectValue(value);
        this._userInteracted = true;
        this.closeDropdown();
      }
    }
  }

  handleOutsideClick = (e) => {
    if (!this.contains(e.target) && this._dropdownOpen) {
      this.closeDropdown();
    }
  }

  handleKeydown = (e) => {
    if (!this._dropdownOpen) return;
    
    const options = Array.from(this.querySelectorAll('.combo-option'));
    const selectedOption = this.querySelector('.combo-option.selected');
    let currentIndex = selectedOption ? options.indexOf(selectedOption) : -1;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, options.length - 1);
        this.highlightOption(options[currentIndex]);
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        this.highlightOption(options[currentIndex]);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedOption) {
          const value = selectedOption.dataset.value;
          this.selectValue(value);
          this._userInteracted = true;
          this.closeDropdown();
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  // ============================================
  // DROPDOWN MANAGEMENT
  // ============================================
  
  toggleDropdown() {
    if (this._dropdownOpen) {
      this.openDropdown();
    } else {
      this.closeDropdown();
    }
  }

  openDropdown() {
    const dropdown = this.querySelector('.combo-dropdown');
    const trigger = this.querySelector('.combo-trigger');
    const searchInput = this.querySelector('.combo-search-input');

    if (this.queryMode === 'remote' && this.state.options.length === 0) {
      this.loadData(); // will not double-fetch thanks to _loading guard
  }
  
    
    if (dropdown) {
      dropdown.style.display = 'block';
      this.state.isOpen = true;
      this._dropdownOpen = true;
      
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
      }
      
      // Focus search input
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 50);
      }
      
      // Load remote data if needed
      if (this.queryMode === 'remote' && this.state.options.length === 0) {
        this.loadData();
      }
    }
  }

  closeDropdown() {
    const dropdown = this.querySelector('.combo-dropdown');
    const trigger = this.querySelector('.combo-trigger');
    const searchInput = this.querySelector('.combo-search-input');
    
    if (dropdown) {
      dropdown.style.display = 'none';
      this.state.isOpen = false;
      this._dropdownOpen = false;
      
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      }
      
      // Clear search
      if (searchInput) {
        searchInput.value = '';
        this.filteredOptions = [];
      }
    }
  }

  highlightOption(option) {
    if (!option) return;
    
    // Remove previous selection
    this.querySelectorAll('.combo-option').forEach(opt => {
      opt.classList.remove('selected');
      opt.setAttribute('aria-selected', 'false');
    });
    
    // Add new selection
    option.classList.add('selected');
    option.setAttribute('aria-selected', 'true');
    option.scrollIntoView({ block: 'nearest' });
  }

  updateDropdownOptions() {
    const optionsList = this.querySelector('.combo-options');
    const emptyDiv = this.querySelector('.combo-empty');

    const options = this.filteredOptions.length ? this.filteredOptions : this.state.options;

    if (optionsList) {
        optionsList.innerHTML = this.renderOptions();
    }

    // Handle empty message
    if (emptyDiv) {
        emptyDiv.style.display = options.length === 0 ? 'block' : 'none';
    }
}


  // ============================================
  // DATA LOADING
  // ============================================
  
  // ============================================
// DATA LOADING (refactored like ModelBase)
// ============================================
// Inside your ComboBox class
// ============================================
// DATA LOADING (refactored like ModelBase)
// ============================================
async loadData(params = {}, forceReload = false) {
  if (!this.dataSource) return;

  if (this._loading) return; // prevent double fetch
  if (!forceReload && this.state.options.length > 0) return; // already loaded

  // Build URL with query params
  let url = this.dataSource;
  const queryParams = new URLSearchParams({
      ...this.currentFilter,
      ...params
  });
  
  // Only append query string if there are params
  if (queryParams.toString()) {
    url = `${url}?${queryParams.toString()}`;
  }

  this._loading = true;
  this.state.loading = true;
  this.updateTrigger();
  loading.show();

  try {
      // ✅ Use apiClient instead of direct fetch
      // apiClient automatically handles:
      // - Base URL configuration
      // - Authentication token
      // - Error handling
      // - Response parsing
      const result = await apiClient.get(url);
      
      // Handle different response formats
      const options = result.data || result;

      this.store = options;
      this.state.options = options;
      this.updateDropdownOptions();

      if (this.onLoadHandler) this.onLoadHandler(this, options);

  } catch (err) {
      console.error('Failed to load ComboBox data', err);
      this.state.error = err.message || 'Failed to load data';
      this.render(); // re-render error
  } finally {
      this._loading = false;
      this.state.loading = false;
      loading.hide();
      this.updateTrigger();
  }
}




  // ============================================
  // VALUE MANAGEMENT
  // ============================================
  
  selectValue(value) {
    const oldValue = this.state.value;
    
    // Find the option to get display value
    const option = this.state.options.find(opt => 
      String(this.getOptionValue(opt)) === String(value)
    );
    
    const displayValue = option ? this.getOptionDisplay(option) : value;
    
    this.state.value = value;
    this.state.displayValue = displayValue;
    
    this.updateTrigger();
    
    // Fire events
    if (oldValue !== value) {
      this.emit('change', { 
        value, 
        displayValue,
        oldValue, 
        option 
      });
      
      if (this.onChangeHandler) {
        this.onChangeHandler(this, option);
      }
    }
    
    this.emit('select', { 
      value, 
      displayValue,
      option 
    });
    
    if (this.onSelectHandler) {
      this.onSelectHandler(this, option);
    }
  }

  setValue(value, displayValue = null) {
    this.state.value = value;
    
    if (displayValue) {
      this.state.displayValue = displayValue;
    } else {
      // Try to find display value from options
      const option = this.state.options.find(opt => 
        String(this.getOptionValue(opt)) === String(value)
      );
      this.state.displayValue = option ? this.getOptionDisplay(option) : value;
    }
    
    this._originalValue = value;
    this.updateTrigger();
    return this;
  }

  getValue() {
    return this.state.value;
  }

  getDisplayValue() {
    return this.state.displayValue || this.getValue();
  }

  hasChanged() {
    return this._userInteracted && this.state.value !== this._originalValue;
  }

  reset() {
    this.state.value = this._originalValue;
    this._userInteracted = false;
    this.updateTrigger();
  }

  // ============================================
  // HELPERS
  // ============================================
  
  getOptionValue(option) {
    if (typeof option === 'object') {
      return option[this.displayField];
    }
    return option;
  }

  getOptionDisplay(option) {
    if (typeof option === 'object') {
      return option[this.displayField];
    }
    return option;
  }

  getDisplayText() {
    if (this.state.displayValue) {
      return this.state.displayValue;
    }
    
    if (this.state.value) {
      // Try to find display from options
      const option = this.state.options.find(opt => 
        String(this.getOptionValue(opt)) === String(this.state.value)
      );
      return option ? this.getOptionDisplay(option) : this.state.value;
    }
    
    return '';
  }

  updateTrigger() {
    const trigger = this.querySelector('.combo-trigger');
    const valueSpan = this.querySelector('.combo-value');
    const iconSpan = this.querySelector('.combo-icon');
    
    if (valueSpan) {
      const displayText = this.getDisplayText();
      const isLoading = this.state.loading;
      
      valueSpan.textContent = isLoading ? 'Loading...' : (displayText || this.placeholder);
      
      if (!displayText) {
        valueSpan.classList.add('placeholder');
      } else {
        valueSpan.classList.remove('placeholder');
      }
    }
    
    if (iconSpan && this.state.loading) {
      iconSpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    } else if (iconSpan) {
      iconSpan.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
    return this;
  }

  // ============================================
  // UPDATE HANDLERS
  // ============================================
  
  handleValueUpdate = (value, state, previous) => {
    console.log('🔄 ComboBox: value changed', value);
    this.updateTrigger();
  }

  handleOptionsUpdate = (options, state, previous) => {
    console.log('🔄 ComboBox: options changed', options.length);
    this.updateDropdownOptions();
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  setOptions(options) {
    this.store = options;
    this.state.options = options;
    this.updateDropdownOptions();
    return this;
  }

  getOptions() {
    return this.state.options;
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    const trigger = this.querySelector('.combo-trigger');
    if (trigger) {
      trigger.disabled = disabled;
      if (disabled) {
        trigger.classList.add('disabled');
      } else {
        trigger.classList.remove('disabled');
      }
    }
    return this;
  }

  isDisabled() {
    return this.disabled;
  }

  onSelect(handler) {
    this.onSelectHandler = handler;
    return this;
  }

  onChange(handler) {
    this.onChangeHandler = handler;
    return this;
  }

  onLoad(handler) {
    this.onLoadHandler = handler;
    return this;
  }
}

// Register custom element
customElements.define('x-combo', ComboBox);