import { ComponentBase } from "../core/ComponentBase.js";

export class Dropdown extends ComponentBase {
    // ============================================
    // 1️⃣ STATIC PROPERTIES
    // ============================================
    // Note: Dropdowns are NOT singletons - multiple can exist
    
    // ============================================
    // 2️⃣ CONSTRUCTOR
    // ============================================
    constructor() {
      super();
      
      // State initialization
      this.state = {
        isOpen: false,
        disabled: false
      };
      
      // Configuration
      this.config = null;
      this.originalContent = null;
    }
  
    // ============================================
    // 3️⃣ LIFECYCLE METHODS
    // ============================================
    
    onInit() {
      this.initializeComponent();
      this.render();
      this.setupEvents();
    }
  
    onDestroy() {
      // Event listeners automatically cleaned up by ComponentBase
      // Close dropdown if open
      if (this.state.isOpen) {
        this.closeDropdown();
      }
    }
  
    // ============================================
    // 4️⃣ INITIALIZATION
    // ============================================
    
    initializeComponent() {
      // Set component attributes
      this.setAttribute('role', 'menu');
      this.classList.add('x-dropdown');
      
      // Generate or get ID
      this.componentId = this.getAttribute('data-id') || this.generateId();
      
      // Store original content before rendering
      this.originalContent = this.innerHTML;
      
      // Parse configuration from DOM
      this.parseConfiguration();
    }
    
    parseConfiguration() {
      // Check if using data attribute structure
      const triggerElement = this.querySelector('[data-section="trigger"]');
      const headerElement = this.querySelector('[data-section="header"]');
      const mainElement = this.querySelector('[data-section="main"]');
      const footerElement = this.querySelector('[data-section="footer"]');
  
      if (triggerElement || headerElement || mainElement || footerElement) {
        this.config = {
          trigger: triggerElement?.innerHTML || '',
          header: headerElement?.innerHTML || '',
          main: mainElement?.innerHTML || '',
          footer: footerElement?.innerHTML || ''
        };
      }
    }
    
    generateId() {
      return `dropdown-${Math.random().toString(36).substr(2, 9)}`;
    }
  
    // ============================================
    // 5️⃣ RENDERING & BUILDERS
    // ============================================
    
    render() {
      this.innerHTML = this.buildStructure();
      this.cacheElements();
    }
    
    buildStructure() {
      return `
        <div class="x-dropdown-trigger">
          ${this.buildTrigger()}
        </div>
        <div class="x-dropdown-menu">
          ${this.buildHeader()}
          ${this.buildMain()}
          ${this.buildFooter()}
        </div>
      `;
    }
    
    buildTrigger() {
      if (this.config?.trigger) {
        return this.config.trigger;
      }
      
      // Fallback to original content if no trigger specified
      return this.originalContent || 'Toggle Dropdown';
    }
    
    buildHeader() {
      if (!this.config?.header) return '';
  
      if (typeof this.config.header === 'string') {
        return `<div class="x-dropdown-header">${this.config.header}</div>`;
      }
  
      if (typeof this.config.header === 'function') {
        return `<div class="x-dropdown-header">${this.config.header()}</div>`;
      }
  
      return '';
    }
    
    buildMain() {
      if (!this.config?.main) return '';
  
      if (typeof this.config.main === 'string') {
        return `<div class="x-dropdown-main">${this.config.main}</div>`;
      }
  
      if (typeof this.config.main === 'function') {
        return `<div class="x-dropdown-main">${this.config.main()}</div>`;
      }
  
      if (Array.isArray(this.config.main)) {
        return `
          <div class="x-dropdown-main">
            ${this.config.main.map(item => this.buildMenuItem(item)).join('')}
          </div>
        `;
      }
  
      return '';
    }
    
    buildFooter() {
      if (!this.config?.footer) return '';
  
      if (typeof this.config.footer === 'string') {
        return `<div class="x-dropdown-footer">${this.config.footer}</div>`;
      }
  
      if (typeof this.config.footer === 'function') {
        return `<div class="x-dropdown-footer">${this.config.footer()}</div>`;
      }
  
      if (Array.isArray(this.config.footer)) {
        return `
          <div class="x-dropdown-footer">
            ${this.config.footer.map(item => this.buildMenuItem(item)).join('')}
          </div>
        `;
      }
  
      return '';
    }
    
    buildMenuItem(item) {
      const tag = item.path ? 'a' : 'button';
      const attrs = item.path ? `href="${item.path}"` : '';
      
      return `
        <${tag} 
          class="x-dropdown-item" 
          data-item-id="${item.id}"
          ${attrs}
          ${item.action ? `data-action="${item.action}"` : ''}
        >
          ${item.icon ? `<span class="x-dropdown-item-icon">${item.icon}</span>` : ''}
          <span class="x-dropdown-item-label">${item.label}</span>
        </${tag}>
      `;
    }
    
    cacheElements() {
      this.triggerElement = this.querySelector('.x-dropdown-trigger');
      this.menuElement = this.querySelector('.x-dropdown-menu');
    }
  
    // ============================================
    // 6️⃣ EVENT HANDLING
    // ============================================
    
    setupEvents() {
      if (this.triggerElement) {
        this.addManagedEventListener(this.triggerElement, 'click', this.handleTriggerClick);
      }
  
      // Handle menu item clicks with actions
      this.querySelectorAll('[data-action]').forEach(item => {
        this.addManagedEventListener(item, 'click', this.handleActionClick);
      });
    }
    
    handleTriggerClick = (e) => {
      e.stopPropagation();
      this.toggle();
    }
    
    handleOutsideClick = (e) => {
      // Only close if dropdown is open AND click is outside
      if (this.state.isOpen && !this.contains(e.target)) {
        this.closeDropdown();
      }
    }
    
    handleActionClick = (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      const itemId = e.currentTarget.getAttribute('data-item-id');
      
      this.emit('dropdown-action', { 
        action,
        itemId,
        dropdownId: this.componentId
      });
    }
  
    // ============================================
    // 7️⃣ DATA BINDING (Optional)
    // ============================================
    
    // Not needed for Dropdown
  
    // ============================================
    // 8️⃣ PUBLIC API
    // ============================================
    
    /**
     * Set dropdown configuration programmatically
     */
    setConfig(config) {
      this.config = config;
      this.render();
      this.setupEvents();
      return this;
    }
    
    /**
     * Toggle dropdown visibility
     */
    async toggle() {
      const willOpen = !this.state.isOpen;
      
      // Call beforeToggle hook if provided
      if (this.config?.beforeToggle) {
        const shouldContinue = await this.config.beforeToggle({
          isOpen: this.state.isOpen,
          willOpen,
          dropdownId: this.componentId
        });
        
        if (shouldContinue === false) {
          return this;
        }
      }
  
      if (willOpen) {
        this.openDropdown();
      } else {
        this.closeDropdown();
      }
      
      return this;
    }
    
    /**
     * Open dropdown
     */
    async openDropdown() {
      // Call onBeforeOpen hook if provided
      if (this.config?.onBeforeOpen) {
        const shouldContinue = await this.config.onBeforeOpen({
          dropdownId: this.componentId
        });
        
        if (shouldContinue === false) {
          return this;
        }
      }
  
      this.state.isOpen = true;
      this.menuElement?.classList.add('open');
      
      // Add outside click listener only when dropdown opens
      this.addManagedEventListener(document, 'click', this.handleOutsideClick);
      
      // Emit event
      this.emit('dropdown-toggle', { 
        isOpen: true,
        dropdownId: this.componentId
      });
  
      // Call lifecycle hooks
      if (this.config?.onToggle) {
        this.config.onToggle({
          isOpen: true,
          dropdownId: this.componentId
        });
      }
  
      if (this.config?.onOpen) {
        this.config.onOpen({
          dropdownId: this.componentId
        });
      }
      
      return this;
    }
    
    /**
     * Close dropdown
     */
    async closeDropdown() {
      // Call onBeforeClose hook if provided
      if (this.config?.onBeforeClose) {
        const shouldContinue = await this.config.onBeforeClose({
          dropdownId: this.componentId
        });
        
        if (shouldContinue === false) {
          return this;
        }
      }
  
      this.state.isOpen = false;
      this.menuElement?.classList.remove('open');
      
      // Remove outside click listener when dropdown closes
      // (automatically handled by ComponentBase if using addManagedEventListener)
      
      // Emit event
      this.emit('dropdown-toggle', { 
        isOpen: false,
        dropdownId: this.componentId
      });
  
      // Call lifecycle hooks
      if (this.config?.onToggle) {
        this.config.onToggle({
          isOpen: false,
          dropdownId: this.componentId
        });
      }
  
      if (this.config?.onClose) {
        this.config.onClose({
          dropdownId: this.componentId
        });
      }
      
      return this;
    }
    
    /**
     * Check if dropdown is open
     */
    isDropdownOpen() {
      return this.state.isOpen;
    }
    
    /**
     * Show dropdown component
     */
    show() {
      this.classList.remove('hidden');
      return this;
    }
    
    /**
     * Hide dropdown component
     */
    hide() {
      if (this.state.isOpen) {
        this.closeDropdown();
      }
      this.classList.add('hidden');
      return this;
    }
    
    /**
     * Enable dropdown
     */
    enable() {
      this.state.disabled = false;
      this.classList.remove('disabled');
      if (this.triggerElement) {
        this.triggerElement.style.pointerEvents = 'auto';
        this.triggerElement.style.opacity = '1';
      }
      return this;
    }
    
    /**
     * Disable dropdown
     */
    disable() {
      if (this.state.isOpen) {
        this.closeDropdown();
      }
      this.state.disabled = true;
      this.classList.add('disabled');
      if (this.triggerElement) {
        this.triggerElement.style.pointerEvents = 'none';
        this.triggerElement.style.opacity = '0.5';
      }
      return this;
    }
    
    /**
     * Refresh dropdown
     */
    refresh() {
      this.render();
      this.setupEvents();
      return this;
    }
  
    // ============================================
    // 9️⃣ UTILITY METHODS
    // ============================================
    
    /**
     * Emit custom event
     */
    emit(eventName, detail = {}) {
      this.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true
      }));
      return this;
    }
  }
  
  // ============================================
  // 🔟 REGISTER CUSTOM ELEMENT
  // ============================================
  customElements.define('x-dropdown', Dropdown);


// import { ComponentBase } from "../core/ComponentBase.js";

// export class Dropdown extends ComponentBase {
//     constructor() {
//       super();
//       this.isOpen = false;
//       this.config = null;
//       this.dropdownId = this.getAttribute('data-id') || '';
//       this.originalContent = null;
      
//       // Bind methods once in constructor
//       this.handleTriggerClick = this.handleTriggerClick.bind(this);
//       this.handleOutsideClick = this.handleOutsideClick.bind(this);
//       this.handleActionClick = this.handleActionClick.bind(this);
//     }
  
//     onInit() {
//       this.setAttribute('role', 'menu');
//       this.classList.add('x-dropdown');
      
//       // Store original content before rendering
//       this.originalContent = this.innerHTML;
      
//       this.initFromDOM();
//       this.render();
//       this.attachEventListeners();
//     }
  
//     disconnectedCallback() {
//       this.removeEventListeners();
//     }
  
//     /**
//      * Initialize dropdown from DOM structure
//      */
//     initFromDOM() {
//       // Check if using data attribute structure
//       const triggerElement = this.querySelector('[data-section="trigger"]');
//       const headerElement = this.querySelector('[data-section="header"]');
//       const mainElement = this.querySelector('[data-section="main"]');
//       const footerElement = this.querySelector('[data-section="footer"]');
  
//       if (triggerElement || headerElement || mainElement || footerElement) {
//         this.config = {
//           trigger: triggerElement?.innerHTML || '',
//           header: headerElement?.innerHTML || '',
//           main: mainElement?.innerHTML || '',
//           footer: footerElement?.innerHTML || ''
//         };
//       }
//     }
  
//     /**
//      * Set dropdown configuration programmatically
//      * @param {Object} config - Configuration object with header, main, footer, and lifecycle hooks
//      */
//     setConfig(config) {
//       this.config = config;
//       this.render();
//     }
  
//     /**
//      * Build trigger section
//      * @returns {string} HTML string for trigger
//      */
//     buildTrigger() {
//       if (this.config?.trigger) {
//         return this.config.trigger;
//       }
      
//       // Fallback to original content if no trigger specified
//       return this.originalContent || 'Toggle Dropdown';
//     }
  
//     /**
//      * Build header section
//      * @returns {string} HTML string for header
//      */
//     buildHeader() {
//       if (!this.config?.header) return '';
  
//       if (typeof this.config.header === 'string') {
//         return `<div class="x-dropdown-header">${this.config.header}</div>`;
//       }
  
//       if (typeof this.config.header === 'function') {
//         return `<div class="x-dropdown-header">${this.config.header()}</div>`;
//       }
  
//       return '';
//     }
  
//     /**
//      * Build main section
//      * @returns {string} HTML string for main items
//      */
//     buildMain() {
//       if (!this.config?.main) return '';
  
//       if (typeof this.config.main === 'string') {
//         return `<div class="x-dropdown-main">${this.config.main}</div>`;
//       }
  
//       if (typeof this.config.main === 'function') {
//         return `<div class="x-dropdown-main">${this.config.main()}</div>`;
//       }
  
//       if (Array.isArray(this.config.main)) {
//         return `
//           <div class="x-dropdown-main">
//             ${this.config.main.map(item => this.buildMenuItem(item)).join('')}
//           </div>
//         `;
//       }
  
//       return '';
//     }
  
//     /**
//      * Build footer section
//      * @returns {string} HTML string for footer
//      */
//     buildFooter() {
//       if (!this.config?.footer) return '';
  
//       if (typeof this.config.footer === 'string') {
//         return `<div class="x-dropdown-footer">${this.config.footer}</div>`;
//       }
  
//       if (typeof this.config.footer === 'function') {
//         return `<div class="x-dropdown-footer">${this.config.footer()}</div>`;
//       }
  
//       if (Array.isArray(this.config.footer)) {
//         return `
//           <div class="x-dropdown-footer">
//             ${this.config.footer.map(item => this.buildMenuItem(item)).join('')}
//           </div>
//         `;
//       }
  
//       return '';
//     }
  
//     /**
//      * Build individual menu item
//      * @param {Object} item - Menu item configuration
//      * @returns {string} HTML string for menu item
//      */
//     buildMenuItem(item) {
//       const tag = item.path ? 'a' : 'button';
//       const attrs = item.path ? `href="${item.path}"` : '';
      
//       return `
//         <${tag} 
//           class="x-dropdown-item" 
//           data-item-id="${item.id}"
//           ${attrs}
//           ${item.action ? `data-action="${item.action}"` : ''}
//         >
//           ${item.icon ? `<span class="x-dropdown-item-icon">${item.icon}</span>` : ''}
//           <span class="x-dropdown-item-label">${item.label}</span>
//         </${tag}>
//       `;
//     }
  
//     /**
//      * Render the complete dropdown
//      */
//     render() {
//       this.innerHTML = `
//         <div class="x-dropdown-trigger">
//           ${this.buildTrigger()}
//         </div>
//         <div class="x-dropdown-menu">
//           ${this.buildHeader()}
//           ${this.buildMain()}
//           ${this.buildFooter()}
//         </div>
//       `;
  
//       // Re-initialize nested custom elements after render
//       this.initNestedComponents();
//     }
  
//     /**
//      * Initialize nested custom elements (like x-tabpanel)
//      */
//     initNestedComponents() {
//       // Find all custom elements and ensure they're initialized
//       const customElements = this.querySelectorAll('[data-id]');
//       customElements.forEach(element => {
//         if (element.connectedCallback && typeof element.connectedCallback === 'function') {
//           // Component already initialized
//         }
//       });
//     }
  
//     /**
//      * Attach event listeners
//      */
//     attachEventListeners() {
//       this.triggerElement = this.querySelector('.x-dropdown-trigger');
//       this.menuElement = this.querySelector('.x-dropdown-menu');
  
//       if (this.triggerElement) {
//         this.triggerElement.addEventListener('click', this.handleTriggerClick);
//       }
  
//       // Handle menu item clicks with actions
//       this.querySelectorAll('[data-action]').forEach(item => {
//         item.addEventListener('click', this.handleActionClick);
//       });
//     }
  
//     /**
//      * Remove event listeners
//      */
//     removeEventListeners() {
//       if (this.triggerElement) {
//         this.triggerElement.removeEventListener('click', this.handleTriggerClick);
//       }
      
//       document.removeEventListener('click', this.handleOutsideClick);
      
//       this.querySelectorAll('[data-action]').forEach(item => {
//         item.removeEventListener('click', this.handleActionClick);
//       });
//     }
  
//     /**
//      * Handle trigger click
//      */
//     handleTriggerClick(e) {
//       e.stopPropagation();
//       this.toggle();
//     }
  
//     /**
//      * Handle outside click - only when dropdown is open
//      */
//     handleOutsideClick(e) {
//       // Only close if dropdown is open AND click is outside
//       if (this.isOpen && !this.contains(e.target)) {
//         this.close();
//       }
//     }
  
//     /**
//      * Handle action clicks
//      */
//     handleActionClick(e) {
//       const action = e.currentTarget.getAttribute('data-action');
//       const itemId = e.currentTarget.getAttribute('data-item-id');
      
//       this.dispatchEvent(new CustomEvent('dropdown-action', {
//         detail: { 
//           action,
//           itemId,
//           dropdownId: this.dropdownId
//         },
//         bubbles: true,
//         composed: true
//       }));
//     }
  
//     /**
//      * Toggle dropdown visibility with lifecycle hooks
//      */
//     async toggle() {
//       const willOpen = !this.isOpen;
      
//       // Call beforeToggle hook if provided
//       if (this.config?.beforeToggle) {
//         const shouldContinue = await this.config.beforeToggle({
//           isOpen: this.isOpen,
//           willOpen,
//           dropdownId: this.dropdownId
//         });
        
//         // If beforeToggle returns false, cancel the toggle
//         if (shouldContinue === false) {
//           return;
//         }
//       }
  
//       if (willOpen) {
//         this.open();
//       } else {
//         this.close();
//       }
//     }
  
//     /**
//      * Open dropdown with lifecycle hooks
//      */
//     async open() {
//       // Call onBeforeOpen hook if provided
//       if (this.config?.onBeforeOpen) {
//         const shouldContinue = await this.config.onBeforeOpen({
//           dropdownId: this.dropdownId
//         });
        
//         if (shouldContinue === false) {
//           return;
//         }
//       }
  
//       this.isOpen = true;
//       this.menuElement?.classList.add('open');
      
//       // Add outside click listener only when dropdown opens
//       document.addEventListener('click', this.handleOutsideClick);
      
//       // Dispatch toggle event
//       this.dispatchEvent(new CustomEvent('dropdown-toggle', {
//         detail: { 
//           isOpen: true,
//           dropdownId: this.dropdownId
//         },
//         bubbles: true,
//         composed: true
//       }));
  
//       // Call onToggle hook if provided
//       if (this.config?.onToggle) {
//         this.config.onToggle({
//           isOpen: true,
//           dropdownId: this.dropdownId
//         });
//       }
  
//       // Call onOpen hook if provided
//       if (this.config?.onOpen) {
//         this.config.onOpen({
//           dropdownId: this.dropdownId
//         });
//       }
//     }
  
//     /**
//      * Close dropdown with lifecycle hooks
//      */
//     async close() {
//       // Call onBeforeClose hook if provided
//       if (this.config?.onBeforeClose) {
//         const shouldContinue = await this.config.onBeforeClose({
//           dropdownId: this.dropdownId
//         });
        
//         if (shouldContinue === false) {
//           return;
//         }
//       }
  
//       this.isOpen = false;
//       this.menuElement?.classList.remove('open');
      
//       // Remove outside click listener when dropdown closes
//       document.removeEventListener('click', this.handleOutsideClick);
      
//       // Dispatch toggle event
//       this.dispatchEvent(new CustomEvent('dropdown-toggle', {
//         detail: { 
//           isOpen: false,
//           dropdownId: this.dropdownId
//         },
//         bubbles: true,
//         composed: true
//       }));
  
//       // Call onToggle hook if provided
//       if (this.config?.onToggle) {
//         this.config.onToggle({
//           isOpen: false,
//           dropdownId: this.dropdownId
//         });
//       }
  
//       // Call onClose hook if provided
//       if (this.config?.onClose) {
//         this.config.onClose({
//           dropdownId: this.dropdownId
//         });
//       }
//     }
  
//     // PUBLIC API
  
//     /**
//      * Programmatically open dropdown
//      */
//     openDropdown() {
//       this.open();
//     }
  
//     /**
//      * Programmatically close dropdown
//      */
//     closeDropdown() {
//       this.close();
//     }
  
//     /**
//      * Check if dropdown is open
//      */
//     isDropdownOpen() {
//       return this.isOpen;
//     }
//   }
  
//   // Register the custom element
//   customElements.define('x-dropdown', Dropdown);