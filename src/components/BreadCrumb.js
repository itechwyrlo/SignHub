import { ComponentBase } from "../core/ComponentBase.js";
import { Router } from "../core/router.js";

/**
 * BreadCrumb Component
 * Displays navigation breadcrumb trail based on current URL path
 */
export class BreadCrumb extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();
    
    this.state = {
      hidden: false,
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
    // Managed event listeners are auto-cleaned by ComponentBase
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize component properties
   */
  initializeComponent() {
    this.componentId = this.getAttribute('data-id') || 'breadcrumb';
  }

  // ============================================
  // RENDERING & BUILDERS
  // ============================================
  
  /**
   * Main render method - builds breadcrumb from current URL
   */
  render() {
    this.innerHTML = "";

    const container = document.createElement("div");
    container.className = "header-breadcrumb";

    const pathSegments = window.location.pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean);

    // Remove first "dashboard" if present
    if (pathSegments[0]?.toLowerCase() === "dashboard") {
      pathSegments.shift();
    }

    // Always begin with "Dashboard"
    const homeItem = this.buildBreadcrumbItem("Dashboard", false);
    container.appendChild(homeItem);

    // Build rest of breadcrumb
    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      
      // Add separator
      const separator = this.buildSeparator();
      container.appendChild(separator);

      // Format label
      const label = this.formatSegmentLabel(segment);

      // Build item
      const item = this.buildBreadcrumbItem(label, isLast && pathSegments.length > 0);
      
      if (isLast && pathSegments.length > 0) {
        item.addEventListener("click", () => this.handleNavigate(window.location.pathname));
      }

      container.appendChild(item);
    });

    this.appendChild(container);
  }

  /**
   * Build individual breadcrumb item
   */
  buildBreadcrumbItem(label, isClickable = false) {
    const item = document.createElement("span");
    item.className = "breadcrumb-item";
    item.textContent = label;

    if (isClickable) {
      item.classList.add("breadcrumb-link");
    }

    return item;
  }

  /**
   * Build breadcrumb separator
   */
  buildSeparator() {
    const separator = document.createElement("span");
    separator.className = "breadcrumb-separator";
    separator.textContent = "/";
    return separator;
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners using managed listeners
   */
  setupEvents() {
    // Listen for browser back/forward navigation
    this.addManagedEventListener(window, "popstate", this.handlePopState);

    // Hook into Router for SPA navigation
    this.setupRouterIntegration();
  }

  /**
   * Handle browser popstate event
   */
  handlePopState = (e) => {
    this.render();
  }

  /**
   * Handle breadcrumb navigation click
   */
  handleNavigate(path) {
    const router = Router.instance;
    if (router) {
      router.navigateTo(path);
    } else {
      window.location.href = path;
    }
  }

  /**
   * Integrate with Router for SPA updates
   */
  setupRouterIntegration() {
    const router = Router.instance;
    if (router) {
      const originalNavigate = router.navigateTo.bind(router);
      router.navigateTo = (path) => {
        originalNavigate(path);
        this.render();
      };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  /**
   * Format path segment into readable label
   */
  formatSegmentLabel(segment) {
    return segment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Refresh breadcrumb
   */
  refresh() {
    this.render();
    return this;
  }

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
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define("x-bread-crumb", BreadCrumb);

// import { ComponentBase } from "../core/ComponentBase.js";
// import { Router } from "../core/router.js";

// export class BreadCrumb extends ComponentBase {
//   constructor() {
//     super();
//     this.onNavigate = this.render.bind(this);
//   }

//   onInit() {
//     this.render();
//     window.addEventListener("popstate", this.onNavigate);

//     // ✅ Also re-render on router navigation (SPA updates)
//     const router = Router.instance;
//     if (router) {
//       const originalNavigate = router.navigateTo.bind(router);
//       router.navigateTo = (path) => {
//         originalNavigate(path);
//         this.render();
//       };
//     }
//   }

//   disconnectedCallback() {
//     window.removeEventListener("popstate", this.onNavigate);
//   }

//   render() {
//     this.innerHTML = "";

//     const container = document.createElement("div");
//     container.className = "header-breadcrumb";

//     const pathSegments = window.location.pathname
//   .replace(/^\/+|\/+$/g, "")
//   .split("/")
//   .filter(Boolean);

// // Remove first "dashboard" if present
// if (pathSegments[0]?.toLowerCase() === "dashboard") pathSegments.shift();

// // Always begin with "Dashboard"
// const homeItem = document.createElement("span");
// homeItem.className = "breadcrumb-item";
// homeItem.textContent = "Dashboard";
// container.appendChild(homeItem);

// // Build rest of breadcrumb
// pathSegments.forEach((segment, index) => {
//   const isLast = index === pathSegments.length - 1;
//   const separator = document.createElement("span");
//   separator.className = "breadcrumb-separator";
//   separator.textContent = "/";
//   container.appendChild(separator);

//   const label = segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

//   const item = document.createElement("span");
//   item.className = "breadcrumb-item";
//   item.textContent = label;

//   if (isLast && pathSegments.length > 0) {
//     item.classList.add("breadcrumb-link");
//     item.addEventListener("click", () => this.navigateTo(window.location.pathname));
//   }

//   container.appendChild(item);
// });


//     this.appendChild(container);
//   }

//   navigateTo(path) {
//     const router = Router.instance;
//     if (router) router.navigateTo(path);
//     else window.location.href = path;
//   }
// }

// customElements.define("x-bread-crumb", BreadCrumb);
