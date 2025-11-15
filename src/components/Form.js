import { ComponentBase } from "../core/ComponentBase.js";
import { toast } from "../utils/toast.js";

/**
 * Dynamic Form Component
 * Build forms declaratively using data attributes
 * Supports validation, submit handlers, and various field types
 */
export class Form extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();
    
    this.state = {
      isValid: false,
    };
    
    this.formId = null;
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  
  /**
   * Called when component is added to DOM
   */
  onInit() {
    this.initializeComponent();
    this.buildFormFields();
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
    this.formId = this.getAttribute('data-id') || this.generateId();
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `form-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // FORM FIELD BUILDING
  // ============================================

  /**
   * Build all form fields from data attributes
   */
  buildFormFields() {
    const fieldElements = this.querySelectorAll('[data-field]');
    
    fieldElements.forEach(element => {
      const fieldType = element.getAttribute('data-field');
      const fieldHTML = this.buildField(element, fieldType);
      element.innerHTML = fieldHTML;
    });
  }

  /**
   * Build individual form field based on type
   */
  buildField(element, fieldType) {
    const config = this.parseFieldConfig(element);
    
    let fieldHTML = '';
    
    // Build label (skip for checkbox as it's handled separately)
    if (config.label && fieldType !== 'checkbox') {
      fieldHTML += this.buildLabel(config);
    }

    // Build input based on type
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
      case 'number':
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'color':
        fieldHTML += this.buildInput(config, fieldType);
        break;

      case 'textarea':
        fieldHTML += this.buildTextarea(config);
        break;

      case 'select':
        fieldHTML += this.buildSelect(config);
        break;

      case 'checkbox':
        fieldHTML = this.buildCheckbox(config);
        break;

      case 'radio':
        fieldHTML += this.buildRadio(config);
        break;

      case 'file':
        fieldHTML += this.buildFileInput(config);
        break;

      case 'range':
        fieldHTML += this.buildRange(config);
        break;

      case 'button':
      case 'submit':
      case 'reset':
        fieldHTML += this.buildButton(config, fieldType);
        break;

      default:
        fieldHTML += `<div class="unsupported-field">Unsupported field type: ${fieldType}</div>`;
    }

    return fieldHTML;
  }

  /**
   * Parse field configuration from element attributes
   */
  parseFieldConfig(element) {
    return {
      label: element.getAttribute('data-label') || '',
      name: element.getAttribute('data-name') || '',
      id: element.getAttribute('data-id') || element.getAttribute('data-name') || '',
      placeholder: element.getAttribute('data-placeholder') || '',
      value: element.getAttribute('data-value') || '',
      required: element.hasAttribute('data-required'),
      disabled: element.hasAttribute('data-disabled'),
      readonly: element.hasAttribute('data-readonly'),
      multiple: element.hasAttribute('data-multiple'),
      checked: element.hasAttribute('data-checked'),
      className: element.getAttribute('data-class') || '',
      options: element.getAttribute('data-options') || '',
      min: element.getAttribute('data-min') || '',
      max: element.getAttribute('data-max') || '',
      pattern: element.getAttribute('data-pattern') || '',
      rows: element.getAttribute('data-rows') || '4',
      accept: element.getAttribute('data-accept') || '',
      step: element.getAttribute('data-step') || '',
      text: element.getAttribute('data-text') || 'Submit',
    };
  }

  // ============================================
  // FIELD BUILDERS
  // ============================================

  /**
   * Build label element
   */
  buildLabel(config) {
    return `
      <label for="${config.id}" class="form-label">
        ${config.label}
        ${config.required ? ' <span style="color: red;">*</span>' : ''}
      </label>
    `;
  }

  /**
   * Build standard input field
   */
  buildInput(config, type) {
    return `
      <input 
        type="${type}" 
        id="${config.id}"
        name="${config.name}" 
        placeholder="${config.placeholder}"
        value="${config.value}"
        ${config.required ? 'required' : ''}
        ${config.disabled ? 'disabled' : ''}
        ${config.readonly ? 'readonly' : ''}
        ${config.min ? `min="${config.min}"` : ''}
        ${config.max ? `max="${config.max}"` : ''}
        ${config.pattern ? `pattern="${config.pattern}"` : ''}
        class="form-input ${config.className}"
      />
    `;
  }

  /**
   * Build textarea field
   */
  buildTextarea(config) {
    return `
      <textarea 
        id="${config.id}"
        name="${config.name}" 
        placeholder="${config.placeholder}"
        rows="${config.rows}"
        ${config.required ? 'required' : ''}
        ${config.disabled ? 'disabled' : ''}
        ${config.readonly ? 'readonly' : ''}
        class="form-textarea ${config.className}"
      >${config.value}</textarea>
    `;
  }

  /**
   * Build select dropdown
   */
  buildSelect(config) {
    const options = config.options.split(',').map(opt => {
      const [val, txt] = opt.trim().split('|');
      const optValue = txt ? val : val;
      const optText = txt || val;
      return `<option value="${optValue}" ${config.value === optValue ? 'selected' : ''}>${optText}</option>`;
    }).join('');

    return `
      <select 
        id="${config.id}"
        name="${config.name}"
        ${config.required ? 'required' : ''}
        ${config.disabled ? 'disabled' : ''}
        ${config.multiple ? 'multiple' : ''}
        class="form-select ${config.className}"
      >${options}</select>
    `;
  }

  /**
   * Build checkbox field
   */
  buildCheckbox(config) {
    return `
      <input 
        type="checkbox" 
        id="${config.id}"
        name="${config.name}"
        value="${config.value || 'on'}"
        ${config.checked ? 'checked' : ''}
        ${config.required ? 'required' : ''}
        ${config.disabled ? 'disabled' : ''}
        class="${config.className}"
      />
      ${config.label ? `<label class="form-check-label" for="${config.id}">${config.label}</label>` : ''}
    `;
  }

  /**
   * Build radio buttons group
   */
  buildRadio(config) {
    const radioOptions = config.options.split(',').map((opt, idx) => {
      const [val, txt] = opt.trim().split('|');
      const optValue = txt ? val : val;
      const optText = txt || val;
      const radioId = `${config.id}_${idx}`;
      
      return `
        <label class="radio-label">
          <input 
            type="radio" 
            id="${radioId}"
            name="${config.name}"
            value="${optValue}"
            ${config.value === optValue ? 'checked' : ''}
            ${config.required ? 'required' : ''}
            ${config.disabled ? 'disabled' : ''}
            class="form-radio"
          />
          ${optText}
        </label>
      `;
    }).join('');
    
    return `<div class="radio-group ${config.className}">${radioOptions}</div>`;
  }

  /**
   * Build file input
   */
  buildFileInput(config) {
    return `
      <input 
        type="file" 
        id="${config.id}"
        name="${config.name}"
        ${config.required ? 'required' : ''}
        ${config.disabled ? 'disabled' : ''}
        ${config.multiple ? 'multiple' : ''}
        accept="${config.accept}"
        class="form-file ${config.className}"
      />
    `;
  }

  /**
   * Build range slider
   */
  buildRange(config) {
    return `
      <input 
        type="range" 
        id="${config.id}"
        name="${config.name}"
        value="${config.value}"
        ${config.min ? `min="${config.min}"` : 'min="0"'}
        ${config.max ? `max="${config.max}"` : 'max="100"'}
        ${config.step ? `step="${config.step}"` : ''}
        ${config.disabled ? 'disabled' : ''}
        class="form-range ${config.className}"
      />
    `;
  }

  /**
   * Build button
   */
  buildButton(config, type) {
    return `
      <button 
        type="${type}" 
        id="${config.id}"
        name="${config.name}"
        ${config.disabled ? 'disabled' : ''}
        class="form-button ${config.className}"
      >${config.text}</button>
    `;
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   * Listens to DOM events (click, submit) and emits custom events
   */
  setupEvents() {
    // Listen to submit button clicks
    const submitButtons = this.querySelectorAll('button[type="submit"], input[type="submit"]');
    
    submitButtons.forEach(button => {
      this.addManagedEventListener(button, 'click', (e) => {
        e.preventDefault();
        this.processFormSubmission();
      });
    });

    // Listen to form submit event if wrapped in <form>
    const form = this.querySelector('form') || this.closest('form');
    if (form) {
      this.addManagedEventListener(form, 'submit', (e) => {
        e.preventDefault();
        this.processFormSubmission();
      });
    }
  }

  /**
   * Process form submission
   * Validates, collects data, and emits event for controller
   */
  processFormSubmission() {
    // Validate form
    const isValid = this.validate();
    
    if (!isValid) {
      toast.warning(`Form validation failed for: ${this.formId}`);
      return;
    }

    // Get form data
    const formData = this.getFormData();
    
    // Emit custom event (controller will handle this)
    this.emit('form-submit', {
      formId: this.formId,
      data: formData
    });
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate all required fields
   */
  validate() {
    const inputs = this.querySelectorAll('input[required], select[required], textarea[required]');
    
    let isValid = true;

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        isValid = false;
        input.classList.add('invalid');
        
        // Show validation message
        const message = input.validationMessage;
        toast.error(`Validation failed for ${input.name}: ${message}`);
      } else {
        input.classList.remove('invalid');
      }
    });

    this.state.isValid = isValid;
    
    return isValid;
  }

  // ============================================
  // DATA HANDLING
  // ============================================

  /**
   * Get form data as object
   */
  getFormData() {
    const formData = {};
    const inputs = this.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        formData[input.name] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[input.name] = input.value;
        }
      } else if (input.type === 'file') {
        formData[input.name] = input.files;
      } else {
        formData[input.name] = input.value;
      }
    });
    
    return formData;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Programmatically submit the form
   */
  submit() {
    this.processFormSubmission();
    return this;
  }

  /**
   * Reset the form
   */
  resetForm() {
    const inputs = this.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else {
        input.value = '';
      }
      input.classList.remove('invalid');
    });
    return this;
  }

  /**
   * Get form ID
   */
  getFormId() {
    return this.formId;
  }

  /**
   * Rebuild form (if content changes dynamically)
   */
  rebuild() {
    this.buildFormFields();
    this.setupEvents();
    return this;
  }

  /**
   * Emit custom event helper
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
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define('x-form', Form);