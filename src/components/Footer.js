import { ComponentBase } from "../core/ComponentBase.js";

/**
 * Footer Component
 * Displays footer with copyright and company information
 */
export class Footer extends ComponentBase {
  // ============================================
  // STATIC PROPERTIES
  // ============================================
  static instance = null;

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();

    // Singleton pattern
    if (Footer.instance) {
      return Footer.instance;
    }
    Footer.instance = this;

    this.state = {
      hidden: false,
      disabled: false,
    };
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  
  /**
   * Called when component is added to DOM
   */
  onInit() {
    this.initializeComponent();
    this.render();
    this.setupEvents();
  }

  /**
   * Called when component is removed from DOM
   */
  onDestroy() {
    // Clear singleton reference
    if (Footer.instance === this) {
      Footer.instance = null;
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize component properties
   */
  initializeComponent() {
    this.componentId = this.getAttribute('data-id') || 'footer';
  }

  // ============================================
  // RENDERING & BUILDERS
  // ============================================
  
  /**
   * Main render method
   */
  render() {
    this.innerHTML = this.buildStructure();
  }

  /**
   * Build footer structure
   */
  buildStructure() {
    return `
      ${this.buildLeftSection()}
      ${this.buildRightSection()}
    `;
  }

  /**
   * Build left section with copyright
   */
  buildLeftSection() {
    return `
      <div class="footer-left">
        <span class="footer-text">Dashboard © 2024 crafted by Development Team</span>
      </div>
    `;
  }

  /**
   * Build right section with distribution info
   */
  buildRightSection() {
    return `
      <div class="footer-right">
        <span class="footer-text">Distributed by Company Name</span>
      </div>
    `;
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   */
  setupEvents() {
    // Footer has no interactive events by default
    // Override this method if needed
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Show component
   */
  show() {
    if (!this.state.hidden) return this;
    this.classList.remove('hidden');
    this.state.hidden = false;
    return this;
  }

  /**
   * Hide component
   */
  hide() {
    if (this.state.hidden) return this;
    this.classList.add('hidden');
    this.state.hidden = true;
    return this;
  }

  /**
   * Enable component
   */
  enable() {
    if (!this.state.disabled) return this;
    this.classList.remove("disabled");
    this.querySelectorAll("button, a, input").forEach((el) => {
      el.disabled = false;
    });
    this.state.disabled = false;
    return this;
  }

  /**
   * Disable component
   */
  disable() {
    if (this.state.disabled) return this;
    this.classList.add("disabled");
    this.querySelectorAll("button, a, input").forEach((el) => {
      el.disabled = true;
    });
    this.state.disabled = true;
    return this;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    return Footer.instance;
  }
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define("x-footer", Footer);
// import { ComponentBase } from "../core/ComponentBase.js";

// export class Footer extends ComponentBase {
//   static instance = null;

//   constructor() {
//     super();

//     if (!Footer.instance)
//     Footer.instance = this;

//     this.state = {
//       hidden: false,
//       disabled: false,
//     };
//   }

//   onInit() {
//     this.render();
//   }

//   render() {
//     this.innerHTML = `
//       <div class="footer-left">
//         <span class="footer-text">Dashboard © 2024 crafted by Development Team</span>
//       </div>
//       <div class="footer-right">
//         <span class="footer-text">Distributed by Company Name</span>
//       </div>
//     `;
//   }

//   // ===========================================================
//   // ⚙️ PUBLIC API (consistent with Header & Sidebar)
//   // ===========================================================

//   hide() {
//     if (this.state.hidden) return;
//     this.classList.add('hidden'); // Use class instead of inline style
//     this.state.hidden = true;
//   }

//   show() {
//       if (!this.state.hidden) return;
//       this.classList.remove('hidden'); // Remove class
//       this.state.hidden = false;
//   }

//   disable() {
//     if (this.state.disabled) return;
//     this.classList.add("disabled");
//     this.querySelectorAll("button, a, input").forEach((el) => (el.disabled = true));
//     this.state.disabled = true;
//   }

//   enable() {
//     if (!this.state.disabled) return;
//     this.classList.remove("disabled");
//     this.querySelectorAll("button, a, input").forEach((el) => (el.disabled = false));
//     this.state.disabled = false;
//   }

//   static getInstance() {
//     return Footer.instance;
//   }
// }

// customElements.define("x-footer", Footer);
