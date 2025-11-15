import { ComponentBase } from "../core/ComponentBase.js";

/**
 * Enhanced TabPanel Component
 * Multi-variant tab/step navigation component with lifecycle hooks
 * - Default variant: Free navigation between tabs
 * - Basic variant: Linear step progression with auto-detection and validation
 * 
 * Lifecycle Events:
 * - beforeActivate: Before switching tabs (cancelable)
 * - afterActivate: After tab switch completes
 * - beforeComplete: Before marking step complete (cancelable)
 * - afterComplete: After step marked complete
 * - success: All steps completed
 */
export class TabPanel extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();
    
    this.state = {
      currentStep: 0,
      variant: 'default',
      autoAdvance: true, // Auto-advance after step completion
    };
    
    this.tabs = [];
    this.tabPanels = [];
    this.stepValidators = new Map();
    this.completedSteps = new Set();
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  
  /**
   * Called when component is added to DOM
   */
  onInit() {
    this.initializeComponent();
    this.parseTabsFromDOM();
    this.render();
    this.setupEvents();
  }

  /**
   * Called when component is removed from DOM
   */
  onDestroy() {
    // Managed event listeners are auto-cleaned by ComponentBase
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize component properties
   */
  initializeComponent() {
    this.componentId = this.getAttribute('data-id') || this.generateId();
    this.state.variant = this.getAttribute('data-variant') || 'default';
    
    // Auto-advance can be disabled via attribute
    const autoAdvanceAttr = this.getAttribute('data-auto-advance');
    if (autoAdvanceAttr === 'false') {
      this.state.autoAdvance = false;
    }
  }

  /**
   * Parse tabs from DOM structure
   */
  parseTabsFromDOM() {
    const tabElements = this.querySelectorAll('[data-tab]');
    
    this.tabs = Array.from(tabElements).map((el, index) => ({
      id: el.getAttribute('data-tab') || `tab-${index}`,
      title: el.getAttribute('data-title') || `Step ${index + 1}`,
      icon: el.getAttribute('data-icon') || null,
      content: el.innerHTML,
      element: el,
      index: index
    }));

    this.tabPanels = this.tabs.map(tab => tab.content);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `tabpanel-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // RENDERING & BUILDERS
  // ============================================
  
  /**
   * Main render method
   */
  render() {
    if (this.state.variant === 'basic') {
      this.innerHTML = this.buildBasicVariant();
    } else {
      this.innerHTML = this.buildDefaultVariant();
    }

    this.activateTab(this.state.currentStep, true); // true = skip lifecycle on initial render
  }

  /**
   * Build default variant (free navigation)
   */
  buildDefaultVariant() {
    return `
      <div class="tabpanel-container tabpanel-default">
        ${this.buildTabButtons()}
        <div class="tabpanel-content">
          ${this.buildTabPanels()}
        </div>
      </div>
    `;
  }

  /**
   * Build basic variant (stepper)
   */
  buildBasicVariant() {
    return `
      <div class="tabpanel-container tabpanel-basic">
        ${this.buildProgressIndicator()}
        <div class="tabpanel-content">
          ${this.buildTabPanels()}
        </div>
      </div>
    `;
  }

  /**
   * Build tab buttons (default variant)
   */
  buildTabButtons() {
    return `
      <div class="tabpanel-tabs">
        ${this.tabs.map((tab, index) => `
          <button 
            class="tabpanel-tab ${index === this.state.currentStep ? 'active' : ''}"
            data-tab-index="${index}"
            type="button">
            ${tab.icon ? `<i class="${tab.icon}"></i>` : ''}
            ${tab.title}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Build progress indicator (basic variant)
   */
  buildProgressIndicator() {
    return `
      <div class="progress-indicator">
        ${this.tabs.map((tab, index) => `
          <div class="progress-step ${index === this.state.currentStep ? 'active' : ''} ${this.completedSteps.has(index) ? 'completed' : ''}" 
               data-step="${index}">
            <div class="progress-step-circle">
              ${this.completedSteps.has(index) 
                ? '<i class="fa-solid fa-check"></i>' 
                : `<span>${index + 1}</span>`
              }
            </div>
            <div class="progress-step-label">${tab.title}</div>
            ${index < this.tabs.length - 1 ? '<div class="progress-step-line"></div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Build tab panels (content)
   */
  buildTabPanels() {
    return this.tabs.map((tab, index) => `
      <div class="tabpanel-panel ${index === this.state.currentStep ? 'active' : ''}" 
           data-panel-index="${index}">
        ${tab.content}
      </div>
    `).join('');
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   */
  setupEvents() {
    if (this.state.variant === 'default') {
      this.setupDefaultVariantEvents();
    } else if (this.state.variant === 'basic') {
      this.setupBasicVariantEvents();
    }
  }

  /**
   * Setup events for default variant
   */
  setupDefaultVariantEvents() {
    this.querySelectorAll('.tabpanel-tab').forEach(tab => {
      this.addManagedEventListener(tab, 'click', this.handleTabClick);
    });
  }

  /**
   * Setup events for basic variant (with auto-detection)
   */
  setupBasicVariantEvents() {
    // ✅ AUTO-DETECTION: Listen for form submissions in current step
    this.addManagedEventListener(this, 'form-submit', this.handleFormSubmit);
  }

  /**
   * Handle tab button click
   */
  handleTabClick = (e) => {
    const index = parseInt(e.currentTarget.getAttribute('data-tab-index'));
    this.activateTab(index);
  }

  /**
   * ✅ AUTO-DETECTION: Handle form submission in step
   */
  handleFormSubmit = (e) => {
    const formId = e.detail.formId;
    const formData = e.detail.data;

    // Check if the form is in the current step
    const isInCurrentStep = this.isFormInCurrentStep(formId);

    if (isInCurrentStep) {
      console.log(`✅ Form ${formId} submitted in step ${this.state.currentStep}`);
      
      // Auto-complete current step
      this.autoCompleteStep(this.state.currentStep);
    }
  }

  /**
   * Check if form is in current step
   */
  isFormInCurrentStep(formId) {
    const currentPanel = this.querySelector(`[data-panel-index="${this.state.currentStep}"]`);
    const formInPanel = currentPanel?.querySelector(`x-form[data-id="${formId}"]`);
    return !!formInPanel;
  }

  // ============================================
  // AUTO-DETECTION SYSTEM
  // ============================================

  /**
   * ✅ Auto-complete step after successful form submission
   */
  autoCompleteStep(stepIndex) {
    // 1. Emit beforeComplete (can be blocked)
    const canComplete = this.emitLifecycle('beforeComplete', { 
      stepIndex,
      stepId: this.tabs[stepIndex].id,
      stepTitle: this.tabs[stepIndex].title
    });

    if (!canComplete) {
      console.warn(`⚠️ Step ${stepIndex} completion blocked by beforeComplete handler`);
      return false;
    }

    // 2. Validate step
    if (!this.validateStep(stepIndex)) {
      console.warn(`⚠️ Step ${stepIndex} validation failed`);
      return false;
    }

    // 3. Mark as complete
    this.completedSteps.add(stepIndex);
    this.updateProgressIndicator();

    console.log(`✅ Step ${stepIndex} completed`);

    // 4. Emit afterComplete
    this.emitLifecycle('afterComplete', { 
      stepIndex,
      stepId: this.tabs[stepIndex].id,
      stepTitle: this.tabs[stepIndex].title,
      totalSteps: this.tabs.length,
      completedSteps: this.completedSteps.size
    });

    // 5. Check if all steps completed
    if (this.completedSteps.size === this.tabs.length) {
      this.emitLifecycle('success', {
        allStepsCompleted: true,
        totalSteps: this.tabs.length
      });
    }

    // 6. Auto-advance to next step (if enabled)
    if (this.state.autoAdvance) {
      this.autoAdvanceToNext();
    }

    return true;
  }

  /**
   * ✅ Auto-advance to next step
   */
  autoAdvanceToNext() {
    if (this.state.currentStep < this.tabs.length - 1) {
      setTimeout(() => {
        this.activateTab(this.state.currentStep + 1);
      }, 100); // Small delay for smooth transition
    }
  }

  // ============================================
  // LIFECYCLE HOOK SYSTEM
  // ============================================

  /**
   * ✅ Emit lifecycle event with cancellation support
   * @returns {boolean} - false if event was prevented
   */
  emitLifecycle(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true  // ← Allows preventDefault()
    });

    this.dispatchEvent(event);

    // Return false if event was prevented
    return !event.defaultPrevented;
  }

  // ============================================
  // TAB/STEP MANAGEMENT
  // ============================================

  /**
   * ✅ Enhanced: Activate specific tab/step with lifecycle hooks
   */
  activateTab(index, skipLifecycle = false) {
    if (index < 0 || index >= this.tabs.length) return false;

    // For basic variant, check if previous steps are completed
    if (this.state.variant === 'basic' && index > 0) {
      for (let i = 0; i < index; i++) {
        if (!this.completedSteps.has(i)) {
          console.warn(`Cannot navigate to step ${index}. Previous step ${i} not completed.`);
          return false;
        }
      }
    }

    const previousStep = this.state.currentStep;

    // ✅ Emit beforeActivate (can be blocked)
    if (!skipLifecycle) {
      const canActivate = this.emitLifecycle('beforeActivate', {
        previousStep,
        nextStep: index,
        tabId: this.tabs[index].id,
        tabTitle: this.tabs[index].title
      });

      if (!canActivate) {
        console.warn(`⚠️ Tab activation to step ${index} blocked by beforeActivate handler`);
        return false;
      }
    }

    // Update state
    this.state.currentStep = index;

    // Update UI
    if (this.state.variant === 'default') {
      this.querySelectorAll('.tabpanel-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
      });
    } else if (this.state.variant === 'basic') {
      this.querySelectorAll('.progress-step').forEach((step, i) => {
        step.classList.toggle('active', i === index);
      });
    }

    // Update panels
    this.querySelectorAll('.tabpanel-panel').forEach((panel, i) => {
      panel.classList.toggle('active', i === index);
    });

    console.log(`✅ Activated tab ${index}`);

    // ✅ Emit afterActivate
    if (!skipLifecycle) {
      this.emitLifecycle('afterActivate', { 
        previousStep,
        currentStep: index,
        tabId: this.tabs[index].id,
        tabTitle: this.tabs[index].title
      });
    }

    return true;
  }

  /**
   * Validate step
   */
  validateStep(stepIndex) {
    const validator = this.stepValidators.get(stepIndex);
    
    if (validator && typeof validator === 'function') {
      return validator(stepIndex);
    }

    // Default validation: check form in panel
    const panel = this.querySelector(`[data-panel-index="${stepIndex}"]`);
    const form = panel?.querySelector('x-form');
    
    if (form && typeof form.validate === 'function') {
      return form.validate();
    }

    return true; // No form or validator = auto-pass
  }

  /**
   * Update progress indicator (basic variant)
   */
  updateProgressIndicator() {
    if (this.state.variant === 'basic') {
      this.querySelectorAll('.progress-step').forEach((step, index) => {
        const circle = step.querySelector('.progress-step-circle');
        
        if (this.completedSteps.has(index)) {
          step.classList.add('completed');
          circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else {
          step.classList.remove('completed');
          circle.innerHTML = `<span>${index + 1}</span>`;
        }

        step.classList.toggle('active', index === this.state.currentStep);
      });
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Move to next step/tab
   */
  nextStep() {
    if (this.state.currentStep < this.tabs.length - 1) {
      if (this.state.variant === 'basic') {
        // Auto-complete current step before advancing
        if (this.autoCompleteStep(this.state.currentStep)) {
          // autoCompleteStep handles advancement if autoAdvance=true
          if (!this.state.autoAdvance) {
            this.activateTab(this.state.currentStep + 1);
          }
          return true;
        }
        return false;
      } else {
        return this.activateTab(this.state.currentStep + 1);
      }
    }
    return false;
  }

  /**
   * Move to previous step/tab
   */
  prevStep() {
    if (this.state.currentStep > 0) {
      return this.activateTab(this.state.currentStep - 1);
    }
    return false;
  }

  /**
   * Go to specific step
   */
  goToStep(index) {
    return this.activateTab(index);
  }

  /**
   * Get current step index
   */
  getCurrentStep() {
    return this.state.currentStep;
  }

  /**
   * Get current tab info
   */
  getCurrentTab() {
    return this.tabs[this.state.currentStep];
  }

  /**
   * Register custom validator for a step
   */
  setStepValidator(stepIndex, validatorFn) {
    if (typeof validatorFn === 'function') {
      this.stepValidators.set(stepIndex, validatorFn);
    }
    return this;
  }

  /**
   * Mark step as completed (manual)
   */
  completeStep(stepIndex) {
    return this.autoCompleteStep(stepIndex);
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(stepIndex) {
    return this.completedSteps.has(stepIndex);
  }

  /**
   * Reset all steps
   */
  reset() {
    this.completedSteps.clear();
    this.state.currentStep = 0;
    this.activateTab(0, true); // Skip lifecycle on reset
    this.updateProgressIndicator();
    return this;
  }

  /**
   * Get all completed steps
   */
  getCompletedSteps() {
    return Array.from(this.completedSteps);
  }

  /**
   * Enable/disable auto-advance
   */
  setAutoAdvance(enabled) {
    this.state.autoAdvance = enabled;
    return this;
  }

  /**
   * Emit custom event helper (deprecated, use emitLifecycle)
   */
  emit(eventName, detail = {}) {
    return this.emitLifecycle(eventName, detail);
  }
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define('x-tabpanel', TabPanel);

// import { ComponentBase } from "../core/ComponentBase.js";

// /**
//  * TabPanel Component
//  * Multi-variant tab/step navigation component
//  * - Default variant: Free navigation between tabs
//  * - Basic variant: Linear step progression with validation
//  */
// export class TabPanel extends ComponentBase {
//   // ============================================
//   // CONSTRUCTOR
//   // ============================================
//   constructor() {
//     super();
    
//     this.state = {
//       currentStep: 0,
//       variant: 'default',
//     };
    
//     this.tabs = [];
//     this.tabPanels = [];
//     this.stepValidators = new Map();
//     this.completedSteps = new Set();
//   }

//   // ============================================
//   // LIFECYCLE METHODS
//   // ============================================
  
//   /**
//    * Called when component is added to DOM
//    */
//   onInit() {
//     this.initializeComponent();
//     this.parseTabsFromDOM();
//     this.render();
//     this.setupEvents();
//   }

//   /**
//    * Called when component is removed from DOM
//    */
//   onDestroy() {
//     // Managed event listeners are auto-cleaned by ComponentBase
//   }

//   // ============================================
//   // INITIALIZATION
//   // ============================================
  
//   /**
//    * Initialize component properties
//    */
//   initializeComponent() {
//     this.componentId = this.getAttribute('data-id') || this.generateId();
//     this.state.variant = this.getAttribute('data-variant') || 'default';
//   }

//   /**
//    * Parse tabs from DOM structure
//    */
//   parseTabsFromDOM() {
//     const tabElements = this.querySelectorAll('[data-tab]');
    
//     this.tabs = Array.from(tabElements).map((el, index) => ({
//       id: el.getAttribute('data-tab') || `tab-${index}`,
//       title: el.getAttribute('data-title') || `Step ${index + 1}`,
//       icon: el.getAttribute('data-icon') || null,
//       content: el.innerHTML,
//       element: el,
//       index: index
//     }));

//     this.tabPanels = this.tabs.map(tab => tab.content);
//   }

//   /**
//    * Generate unique ID
//    */
//   generateId() {
//     return `tabpanel-${Math.random().toString(36).substr(2, 9)}`;
//   }

//   // ============================================
//   // RENDERING & BUILDERS
//   // ============================================
  
//   /**
//    * Main render method
//    */
//   render() {
//     if (this.state.variant === 'basic') {
//       this.innerHTML = this.buildBasicVariant();
//     } else {
//       this.innerHTML = this.buildDefaultVariant();
//     }

//     this.activateTab(this.state.currentStep);
//   }

//   /**
//    * Build default variant (free navigation)
//    */
//   buildDefaultVariant() {
//     return `
//       <div class="tabpanel-container tabpanel-default">
//         ${this.buildTabButtons()}
//         <div class="tabpanel-content">
//           ${this.buildTabPanels()}
//         </div>
//       </div>
//     `;
//   }

//   /**
//    * Build basic variant (stepper)
//    */
//   buildBasicVariant() {
//     return `
//       <div class="tabpanel-container tabpanel-basic">
//         ${this.buildProgressIndicator()}
//         <div class="tabpanel-content">
//           ${this.buildTabPanels()}
//         </div>
//       </div>
//     `;
//   }

//   /**
//    * Build tab buttons (default variant)
//    */
//   buildTabButtons() {
//     return `
//       <div class="tabpanel-tabs">
//         ${this.tabs.map((tab, index) => `
//           <button 
//             class="tabpanel-tab ${index === this.state.currentStep ? 'active' : ''}"
//             data-tab-index="${index}"
//             type="button">
//             ${tab.icon ? `<i class="${tab.icon}"></i>` : ''}
//             ${tab.title}
//           </button>
//         `).join('')}
//       </div>
//     `;
//   }

//   /**
//    * Build progress indicator (basic variant)
//    */
//   buildProgressIndicator() {
//     return `
//       <div class="progress-indicator">
//         ${this.tabs.map((tab, index) => `
//           <div class="progress-step ${index === this.state.currentStep ? 'active' : ''} ${this.completedSteps.has(index) ? 'completed' : ''}" 
//                data-step="${index}">
//             <div class="progress-step-circle">
//               ${this.completedSteps.has(index) 
//                 ? '<i class="fa-solid fa-check"></i>' 
//                 : `<span>${index + 1}</span>`
//               }
//             </div>
//             <div class="progress-step-label">${tab.title}</div>
//             ${index < this.tabs.length - 1 ? '<div class="progress-step-line"></div>' : ''}
//           </div>
//         `).join('')}
//       </div>
//     `;
//   }

//   /**
//    * Build tab panels (content)
//    */
//   buildTabPanels() {
//     return this.tabs.map((tab, index) => `
//       <div class="tabpanel-panel ${index === this.state.currentStep ? 'active' : ''}" 
//            data-panel-index="${index}">
//         ${tab.content}
//       </div>
//     `).join('');
//   }

//   // ============================================
//   // EVENT HANDLING
//   // ============================================
  
//   /**
//    * Setup all event listeners
//    */
//   setupEvents() {
//     if (this.state.variant === 'default') {
//       this.setupDefaultVariantEvents();
//     } else if (this.state.variant === 'basic') {
//       this.setupBasicVariantEvents();
//     }
//   }

//   /**
//    * Setup events for default variant
//    */
//   setupDefaultVariantEvents() {
//     this.querySelectorAll('.tabpanel-tab').forEach(tab => {
//       this.addManagedEventListener(tab, 'click', this.handleTabClick);
//     });
//   }

//   /**
//    * Setup events for basic variant
//    */
//   setupBasicVariantEvents() {
//     // Listen for form submissions in current step
//     this.addManagedEventListener(this, 'form-submit', this.handleFormSubmit);
//   }

//   /**
//    * Handle tab button click
//    */
//   handleTabClick = (e) => {
//     const index = parseInt(e.currentTarget.getAttribute('data-tab-index'));
//     this.activateTab(index);
//   }

//   /**
//    * Handle form submission in step
//    */
//   handleFormSubmit = (e) => {
//     const formId = e.detail.formId;
//     const currentPanel = this.querySelector(`[data-panel-index="${this.state.currentStep}"]`);
//     const formInPanel = currentPanel?.querySelector(`x-form[data-id="${formId}"]`);

//     if (formInPanel) {
//       this.handleStepCompletion(this.state.currentStep);
//     }
//   }

//   // ============================================
//   // TAB/STEP MANAGEMENT
//   // ============================================

//   /**
//    * Activate specific tab/step
//    */
//   activateTab(index) {
//     if (index < 0 || index >= this.tabs.length) return;

//     // For basic variant, check if previous steps are completed
//     if (this.state.variant === 'basic' && index > 0) {
//       for (let i = 0; i < index; i++) {
//         if (!this.completedSteps.has(i)) {
//           console.warn(`Cannot navigate to step ${index}. Previous step ${i} not completed.`);
//           return;
//         }
//       }
//     }

//     const previousStep = this.state.currentStep;
//     this.state.currentStep = index;

//     // Update UI
//     if (this.state.variant === 'default') {
//       this.querySelectorAll('.tabpanel-tab').forEach((tab, i) => {
//         tab.classList.toggle('active', i === index);
//       });
//     } else if (this.state.variant === 'basic') {
//       this.querySelectorAll('.progress-step').forEach((step, i) => {
//         step.classList.toggle('active', i === index);
//       });
//     }

//     // Update panels
//     this.querySelectorAll('.tabpanel-panel').forEach((panel, i) => {
//       panel.classList.toggle('active', i === index);
//     });

//     // Dispatch event
//     this.emit('tab-activated', { 
//       previousStep,
//       currentStep: index,
//       tabId: this.tabs[index].id,
//       tabTitle: this.tabs[index].title
//     });
//   }

//   /**
//    * Handle step completion (basic variant)
//    */
//   handleStepCompletion(stepIndex) {
//     if (this.validateStep(stepIndex)) {
//       this.completedSteps.add(stepIndex);

//       this.emit('step-completed', { 
//         stepIndex, 
//         stepId: this.tabs[stepIndex].id,
//         totalSteps: this.tabs.length
//       });

//       // Note: Don't auto-advance, let controller decide
//     }
//   }

//   /**
//    * Validate step
//    */
//   validateStep(stepIndex) {
//     const validator = this.stepValidators.get(stepIndex);
    
//     if (validator && typeof validator === 'function') {
//       return validator(stepIndex);
//     }

//     // Default validation: check form in panel
//     const panel = this.querySelector(`[data-panel-index="${stepIndex}"]`);
//     const form = panel?.querySelector('x-form');
    
//     if (form) {
//       return form.validate();
//     }

//     return true;
//   }

//   /**
//    * Update progress indicator (basic variant)
//    */
//   updateProgressIndicator() {
//     if (this.state.variant === 'basic') {
//       this.querySelectorAll('.progress-step').forEach((step, index) => {
//         const circle = step.querySelector('.progress-step-circle');
        
//         if (this.completedSteps.has(index)) {
//           step.classList.add('completed');
//           circle.innerHTML = '<i class="fa-solid fa-check"></i>';
//         } else {
//           step.classList.remove('completed');
//           circle.innerHTML = `<span>${index + 1}</span>`;
//         }

//         step.classList.toggle('active', index === this.state.currentStep);
//       });
//     }
//   }

//   // ============================================
//   // PUBLIC API
//   // ============================================

//   /**
//    * Move to next step/tab
//    */
//   nextStep() {
//     if (this.state.currentStep < this.tabs.length - 1) {
//       if (this.state.variant === 'basic') {
//         if (this.validateStep(this.state.currentStep)) {
//           this.completedSteps.add(this.state.currentStep);
//           this.activateTab(this.state.currentStep + 1);
//           this.updateProgressIndicator();
//           return true;
//         }
//         return false;
//       } else {
//         this.activateTab(this.state.currentStep + 1);
//         return true;
//       }
//     }
//     return false;
//   }

//   /**
//    * Move to previous step/tab
//    */
//   prevStep() {
//     if (this.state.currentStep > 0) {
//       this.activateTab(this.state.currentStep - 1);
//       return true;
//     }
//     return false;
//   }

//   /**
//    * Go to specific step
//    */
//   goToStep(index) {
//     this.activateTab(index);
//     return this;
//   }

//   /**
//    * Get current step index
//    */
//   getCurrentStep() {
//     return this.state.currentStep;
//   }

//   /**
//    * Get current tab info
//    */
//   getCurrentTab() {
//     return this.tabs[this.state.currentStep];
//   }

//   /**
//    * Register custom validator for a step
//    */
//   setStepValidator(stepIndex, validatorFn) {
//     if (typeof validatorFn === 'function') {
//       this.stepValidators.set(stepIndex, validatorFn);
//     }
//     return this;
//   }

//   /**
//    * Mark step as completed
//    */
//   completeStep(stepIndex) {
//     this.completedSteps.add(stepIndex);
//     this.updateProgressIndicator();
//     return this;
//   }

//   /**
//    * Check if step is completed
//    */
//   isStepCompleted(stepIndex) {
//     return this.completedSteps.has(stepIndex);
//   }

//   /**
//    * Reset all steps
//    */
//   reset() {
//     this.completedSteps.clear();
//     this.state.currentStep = 0;
//     this.activateTab(0);
//     this.updateProgressIndicator();
//     return this;
//   }

//   /**
//    * Get all completed steps
//    */
//   getCompletedSteps() {
//     return Array.from(this.completedSteps);
//   }

//   /**
//    * Emit custom event helper
//    */
//   emit(eventName, detail = {}) {
//     this.dispatchEvent(new CustomEvent(eventName, {
//       detail,
//       bubbles: true,
//       composed: true
//     }));
//     return this;
//   }
// }

// // ============================================
// // REGISTER CUSTOM ELEMENT
// // ============================================
// customElements.define('x-tabpanel', TabPanel);