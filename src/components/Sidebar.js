import { menuConfig } from "../configs/master-menu.js";
import { AuthManager } from "../core/AuthManager.js";
import { ComponentBase } from "../core/ComponentBase.js";
import { Router } from "../core/router.js";
import { loading } from "../utils/loadingOverlay.js";
import { screenTracker } from "../utils/windowTracker.js";
import { windowResizeTracker } from "../utils/windowTracker.js";

/**
 * Sidebar Component
 * Navigation sidebar with responsive behavior and route-aware active states
 */
export class Sidebar extends ComponentBase {
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
    if (Sidebar.instance) {
      return Sidebar.instance;
    }
    Sidebar.instance = this;

    const mobileScreenSize = 768;

    this.overlay = null;
    this.state = {
      collapsed: false,
      hidden: false,
      disabled: false,
      isMobile: window.innerWidth <= mobileScreenSize,
    };

    // Setup responsive behavior
    this.setupResponsiveBehavior();
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
    this.createOverlay();
    this.setupEvents();
    this.setActiveByPath(window.location.pathname);
  }

  /**
   * Called when component is removed from DOM
   */
  onDestroy() {
    // Clean up overlay
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    // Clear singleton reference
    if (Sidebar.instance === this) {
      Sidebar.instance = null;
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize component properties
   */
  initializeComponent() {
    this.componentId = this.getAttribute('data-id') || 'sidebar';
  }

  /**
   * Setup responsive window tracking
   */
  setupResponsiveBehavior() {
    windowResizeTracker((screenSize) => {
      this.state.isMobile = screenSize.isMobile;

      if (screenSize.isMobile) {
        this.classList.remove('collapsed');
        if (this.state.collapsed) {  
          this.state.collapsed = false;
        }
        
        if (this.overlay?.classList.contains('active')) {
          this.overlay.classList.remove('active');
        }
      } else if (screenSize.isDesktop) {
        this.overlay?.classList.remove('active');
        this.classList.remove('mobile-open');
      }
    });
  }

  // ============================================
  // RENDERING & BUILDERS
  // ============================================
  
  /**
   * Main render method
   */
  render() {
    this.innerHTML = "";
    
    const header = this.buildHeader(menuConfig.header);
    this.appendChild(header);

    const main = this.buildMain(menuConfig.main);
    this.appendChild(main);

    if (menuConfig.footer && menuConfig.footer.items?.length) {
      const footer = this.buildFooter(menuConfig.footer);
      this.appendChild(footer);
    }
  }

  /**
   * Build sidebar header
   */
  buildHeader(config) {
    const header = document.createElement("div");
    header.className = "sidebar-header";
    header.innerHTML = `
      <div class="sidebar-brand">
        <span class="brand-icon">
          <img src="${config.logo}" alt="logo" class="brand-logo"/>
        </span>
        <span class="brand-text">
          <div class="brand-title">${config.title}</div>
          <div class="brand-subtitle">${config.subtitle}</div>
        </span>
      </div>
    `;
    return header;
  }

  /**
   * Build sidebar main section with navigation
   */
  buildMain(config) {
    const mainContainer = document.createElement("div");
    mainContainer.className = "sidebar-main";
  
    const sidebar = document.createElement("nav");
    sidebar.className = "sidebar-nav";
  
    config.sections.forEach((section) => {
      const sectionEl = this.buildSection(section);
      sidebar.appendChild(sectionEl);
    });
  
    mainContainer.appendChild(sidebar);
    return mainContainer;
  }

  /**
   * Build individual sidebar section
   */
  buildSection(section) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "sidebar-section";

    if (section.showLabel && section.label) {
      const title = document.createElement("span");
      title.className = "sidebar-section-title";
      title.textContent = section.label;
      sectionEl.appendChild(title);
    }

    section.items.forEach((item) => {
      const hasChildren = item.items && item.items.length;

      if (hasChildren) {
        const dropdown = this.buildDropdownItem(item);
        sectionEl.appendChild(dropdown);
      } else {
        const menuItem = this.buildMenuItem(item);
        sectionEl.appendChild(menuItem);
      }
    });

    return sectionEl;
  }

  /**
   * Build dropdown menu item with children
   */
  buildDropdownItem(item) {
    const dropdown = document.createElement("div");
    dropdown.className = "sidebar-dropdown";
    dropdown.setAttribute("data-id", item.id || "");

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "sidebar-item sidebar-dropdown-toggle";
    toggleBtn.type = "button";
    toggleBtn.setAttribute("data-tooltip", item.label);
    toggleBtn.setAttribute("data-id", item.id || "");
    toggleBtn.innerHTML = `
      <span class="sidebar-icon">${item.icon || ""}</span>
      <span class="sidebar-label">${item.label}</span>
      <span class="sidebar-chevron">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 5L10 8L6 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </span>
    `;

    const submenu = document.createElement("div");
    submenu.className = "sidebar-dropdown-menu";

    item.items.forEach((sub) => {
      const subButton = this.buildSubMenuItem(sub);
      submenu.appendChild(subButton);
    });

    dropdown.appendChild(toggleBtn);
    dropdown.appendChild(submenu);
    return dropdown;
  }

  /**
   * Build regular menu item
   */
  buildMenuItem(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sidebar-item${item.active ? " active" : ""}`;
    button.setAttribute("data-tooltip", item.label);
    button.setAttribute("data-id", item.id || "");
    
    if (item.path) {
      button.setAttribute("data-path", item.path);
    }
    
    if (item.externalHandler) {
      button.setAttribute("data-external-handler", "true");
    }
    
    button.innerHTML = `
      <span class="sidebar-icon">${item.icon || ""}</span>
      <span class="sidebar-label">${item.label}</span>
    `;
    
    return button;
  }

  /**
   * Build submenu item
   */
  buildSubMenuItem(sub) {
    const subButton = document.createElement("button");
    subButton.type = "button";
    subButton.className = "sidebar-subitem";
    subButton.setAttribute("data-id", sub.id || "");
    subButton.setAttribute("data-tooltip", sub.label);
    
    if (sub.path) {
      subButton.setAttribute("data-path", sub.path);
    }
    
    if (sub.externalHandler) {
      subButton.setAttribute("data-external-handler", "true");
    }
    
    subButton.innerHTML = `
      <span class="sidebar-label">${sub.label}</span>
    `;
    
    return subButton;
  }

  /**
   * Build sidebar footer
   */
  buildFooter(config) {
    const footer = document.createElement("div");
    footer.className = "sidebar-section sidebar-footer";
  
    config.items.forEach((item) => {
      const button = this.buildMenuItem(item);
      footer.appendChild(button);
    });
  
    return footer;
  }

  /**
   * Create overlay element for mobile
   */
  createOverlay() {
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.className = "sidebar-overlay";
      document.body.appendChild(this.overlay);
    }
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   */
  setupEvents() {
    this.setupNavigationEvents();
    this.setupDropdownEvents();
  }

  /**
   * Setup navigation click events
   */
  setupNavigationEvents() {
    // Handle clicks on sidebar items
    this.addManagedEventListener(this, 'click', this.handleSidebarClick);
  
    // Handle overlay clicks (mobile)
    if (this.overlay) {
      this.addManagedEventListener(this.overlay, 'click', this.handleOverlayClick);
    }
  }

  /**
   * Setup dropdown toggle events
   */
  setupDropdownEvents() {
    this.querySelectorAll(".sidebar-dropdown-toggle").forEach((toggle) => {
      this.addManagedEventListener(toggle, 'click', this.handleDropdownToggle);
    });
  }

  /**
   * Handle sidebar item clicks
   */
  handleSidebarClick = (e) => {
    const item = e.target.closest("button.sidebar-item, button.sidebar-subitem, button.sidebar-dropdown-toggle");
    if (!item) return;

    // If it's a dropdown toggle, let dropdown handler deal with it
    if (item.classList.contains("sidebar-dropdown-toggle")) {
      return;
    }

    if(item.getAttribute('data-id') === 'logout'){
      AuthManager._clear();
      loading.hide();
    }

    // // Check if this item has an external handler
    // if (item.hasAttribute('data-external-handler')) {
    //   return;
    // }

    // Get navigation path
    const path = item.getAttribute("data-path");
    if (!path) return;

    // Navigate using router
    const router = Router.instance;
    if (router) {
      router.navigateTo(path);
    } else {
      history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    // Update active state
    this.setActiveByPath(path);

    // Close mobile menu if open
    if (this.state.isMobile && window.innerWidth < 768) {
      this.closeMobile();
    }
  }

  /**
   * Handle overlay click (mobile)
   */
  handleOverlayClick = (e) => {
    this.state.isMobile = screenTracker();
    if (this.state.isMobile) {
      this.closeMobile();
    }
  }

  /**
   * Handle dropdown toggle
   */
  handleDropdownToggle = (e) => {
    e.preventDefault();
    const parent = e.currentTarget.closest(".sidebar-dropdown");
    if (parent) {
      parent.classList.toggle("open");
    }
  }

  // ============================================
  // ACTIVE STATE MANAGEMENT
  // ============================================

  /**
   * Set active menu item based on current path
   */
  setActiveByPath(currentPath) {
    if (!currentPath || currentPath === "") currentPath = "/";
    if (currentPath.length > 1) currentPath = currentPath.replace(/\/+$/, "");
  
    // Clear all active classes
    this.querySelectorAll(".sidebar-item.active, .sidebar-subitem.active").forEach((el) => {
      el.classList.remove("active");
    });
  
    // Close all dropdowns (optional)
    this.querySelectorAll(".sidebar-dropdown").forEach((dd) => dd.classList.remove("open"));
  
    // Find all items with data-path in the sidebar
    const candidates = Array.from(this.querySelectorAll("button.sidebar-item, button.sidebar-subitem"))
      .map(btn => ({ el: btn, path: btn.getAttribute("data-path") || "" }))
      .filter(x => x.path);
  
    if (candidates.length === 0) return;
  
    // Find exact match first
    let best = candidates.find(c => this.normalizePath(c.path) === currentPath);
  
    // If no exact match, find longest prefix match
    if (!best) {
      const prefixMatches = candidates.filter(c => {
        const p = this.normalizePath(c.path);
        if (p === "/") return currentPath === "/";
        return currentPath.startsWith(p);
      });
  
      if (prefixMatches.length) {
        prefixMatches.sort((a, b) => this.normalizePath(b.path).length - this.normalizePath(a.path).length);
        best = prefixMatches[0];
      }
    }
  
    if (best) {
      best.el.classList.add("active");
  
      // If it's a subitem inside a dropdown, open the parent dropdown
      const parentDropdown = best.el.closest(".sidebar-dropdown");
      if (parentDropdown) parentDropdown.classList.add("open");
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Normalize path for comparison
   */
  normalizePath(href) {
    if (!href || href === "") return "/";
    try {
      const url = new URL(href, window.location.origin);
      let p = url.pathname;
      if (p.length > 1) p = p.replace(/\/+$/, "");
      return p;
    } catch (err) {
      let p = href;
      if (!p.startsWith("/")) p = "/" + p;
      if (p.length > 1) p = p.replace(/\/+$/, "");
      return p;
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Toggle sidebar (responsive)
   */
  toggle() {
    const screenSize = screenTracker();
    this.state.isMobile = screenSize.isMobile;
    
    if (this.state.isMobile) {
      this.overlay.classList.toggle('active');
      this.classList.toggle('mobile-open');  
      if (this.classList.contains('collapsed')) {
        this.classList.remove('collapsed');
      }
    } else {
      this.state.collapsed = !this.state.collapsed;
      this.classList.toggle("collapsed", this.state.collapsed);
    }
    
    return this;
  }

  /**
   * Close mobile menu
   */
  closeMobile() {
    this.overlay.classList.remove('active');
    this.classList.remove('mobile-open');
    return this;
  }

  /**
   * Collapse sidebar
   */
  collapse() {
    this.state.collapsed = true;
    this.classList.add("collapsed");
    return this;
  }

  /**
   * Expand sidebar
   */
  expand() {
    this.state.collapsed = false;
    this.classList.remove("collapsed");
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

  /**
   * Enable component
   */
  enable() {
    if (!this.state.disabled) return this;
    this.classList.remove("disabled");
    this.querySelectorAll("a, button").forEach((el) => {
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
    this.querySelectorAll("a, button").forEach((el) => {
      el.disabled = true;
    });
    this.state.disabled = true;
    return this;
  }

  /**
   * Clear all active states
   */
  clearActiveStates() {
    this.querySelectorAll(".sidebar-item.active, .sidebar-subitem.active")
      .forEach((el) => el.classList.remove("active"));
    this.querySelectorAll(".sidebar-dropdown")
      .forEach((dd) => dd.classList.remove("open"));
    return this;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    return Sidebar.instance;
  }
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define("x-sidebar", Sidebar);

// import { menuConfig } from "../configs/master-menu.js";
// import { ComponentBase } from "../core/ComponentBase.js";
// import { Router } from "../core/router.js";
// import { screenTracker } from "../utils/windowTracker.js";
// import { windowResizeTracker } from "../utils/windowTracker.js";
// export class Sidebar extends ComponentBase {
//   static instance = null;

//   constructor() {
//     super();
//     if (!Sidebar.instance)
//     Sidebar.instance = this;

//     const mobileScreenSize = 768;

//     this.overlay = null;
//     this.state = {
//       collapsed: false,
//       hidden: false,
//       disabled: false,
//       isMobile: window.innerWidth <= mobileScreenSize,
//     };

//     windowResizeTracker((screenSize) => {
//       this.state.isMobile = screenSize.isMobile;

//       if (screenSize.isMobile) {
//         this.classList.remove('collapsed');
//         if(this.state.collapsed){  
//           this.state.collapsed = false;
//         }
        
//         if (this.overlay?.classList.contains('active')) {
//           this.overlay.classList.remove('active');
//         }
//       } else if (screenSize.isDesktop) {
//         this.overlay?.classList.remove('active');
//         this.classList.remove('mobile-open');
//       }
//     });

//     // window.addEventListener('resize', () => {
//     //   const width = window.innerWidth;
//     //     if(width > 768){
//     //         this.isMobile = false;
//     //         this.overlay.classList.remove('active');
//     //         if(this.classList.contains('mobile-open')){
//     //           this.classList.remove('mobile-open')
//     //         }
            
//     //     }
//     //     else if(width < 768){
//     //       this.isMobile = true;
//     //       if(this.classList.contains('collapsed')){
//     //           this.classList.remove('collapsed');
//     //       }
//     //         if(!this.classList.contains('mobile-open') && this.overlay.classList.contains('active')){
//     //             this.overlay.classList.remove('active');
//     //         }
//     //     }
//     // })
//   }

//   onInit() {
//     this.render();
//     this.createOverlay();
//     this.initDropdownEvents();
//     this.initNavEvents();         // <- new: handle clicks & SPA navigation
//     this.setActiveByPath(window.location.pathname); // <- set initial active

//     // window.addEventListener("pushState", () => {
//     //   this.setActiveByPath(window.location.pathname);
//     // });
//   }
//   // Intercept clicks on sidebar links (delegation)
//   // -------------------------
//   initNavEvents() {
//     // 🔥 Use managed event listener on sidebar itself (not document!)
//     this.addManagedEventListener(this, 'click', (e) => {
//       const item = e.target.closest("button.sidebar-item, button.sidebar-subitem, button.sidebar-dropdown-toggle");
//       if (!item) return;
  
//       if (item.classList.contains("sidebar-dropdown-toggle")) {
//         return;
//       }
  
//       if (item.hasAttribute('data-external-handler')) {
//         return;
//       }
  
//       const path = item.getAttribute("data-path");
//       if (!path) return;
  
//       const router = Router.instance;
//       if (router) {
//         router.navigateTo(path);
//       } else {
//         history.pushState({}, "", path);
//         window.dispatchEvent(new PopStateEvent("popstate"));
//       }
  
//       this.setActiveByPath(path);
  
//       if (this.state.isMobile && window.innerWidth < 768) {
//         this.closeMobile();
//       }
//     });
  
//     // 🔥 Use managed event listener for overlay
//     if (this.overlay) {
//       this.addManagedEventListener(this.overlay, 'click', (e) => {
//         this.state.isMobile = screenTracker();
//         if (this.state.isMobile) {
//           this.closeMobile();
//         }
//       });
//     }
//   }

//   // -------------------------
//   // Active state: find the best match for the current path
//   // -------------------------
//   setActiveByPath(currentPath) {
//     if (!currentPath || currentPath === "") currentPath = "/";
//     if (currentPath.length > 1) currentPath = currentPath.replace(/\/+$/, "");
  
//     // Clear all active classes
//     this.querySelectorAll(".sidebar-item.active, .sidebar-subitem.active").forEach((el) => {
//       el.classList.remove("active");
//     });
  
//     // Close all dropdowns (optional)
//     this.querySelectorAll(".sidebar-dropdown").forEach((dd) => dd.classList.remove("open"));
  
//     // Find all items with data-path in the sidebar
//     const candidates = Array.from(this.querySelectorAll("button.sidebar-item, button.sidebar-subitem"))
//       .map(btn => ({ el: btn, path: btn.getAttribute("data-path") || "" }))
//       .filter(x => x.path);
  
//     if (candidates.length === 0) return;
  
//     // Find exact match first
//     let best = candidates.find(c => this._normalizePath(c.path) === currentPath);
  
//     // If no exact match, find longest prefix match
//     if (!best) {
//       const prefixMatches = candidates.filter(c => {
//         const p = this._normalizePath(c.path);
//         if (p === "/") return currentPath === "/";
//         return currentPath.startsWith(p);
//       });
  
//       if (prefixMatches.length) {
//         prefixMatches.sort((a, b) => this._normalizePath(b.path).length - this._normalizePath(a.path).length);
//         best = prefixMatches[0];
//       }
//     }
  
//     if (best) {
//       best.el.classList.add("active");
  
//       // If it's a subitem inside a dropdown, open the parent dropdown
//       const parentDropdown = best.el.closest(".sidebar-dropdown");
//       if (parentDropdown) parentDropdown.classList.add("open");
//     }
//   }
  
//   _normalizePath(path) {
//     if (!path || path === "") return "/";
//     let p = path.startsWith("/") ? path : "/" + path;
//     if (p.length > 1) p = p.replace(/\/+$/, "");
//     return p;
//   }

//   // small helper to normalize href strings
//   _normalizePath(href) {
//     if (!href || href === "") return "/";
//     try {
//       // if absolute URL provided, extract pathname
//       const url = new URL(href, window.location.origin);
//       let p = url.pathname;
//       if (p.length > 1) p = p.replace(/\/+$/, "");
//       return p;
//     } catch (err) {
//       // fallback: ensure starts with '/'
//       let p = href;
//       if (!p.startsWith("/")) p = "/" + p;
//       if (p.length > 1) p = p.replace(/\/+$/, "");
//       return p;
//     }
//   }

//   // ===========================================================
//   // 🧱 BUILDER FUNCTIONS
//   // ===========================================================

//   headerBuilder(config) {
//     const header = document.createElement("div");
//     header.className = "sidebar-header";
//     header.innerHTML = `
//       <div class="sidebar-brand">
//         <span class="brand-icon">
//           <img src="${config.logo}" alt="logo" class="brand-logo"/>
//         </span>
//         <span class="brand-text">
//           <div class="brand-title">${config.title}</div>
//           <div class="brand-subtitle">${config.subtitle}</div>
//         </span>
//       </div>
//     `;
//     return header;
//   }

//   mainBuilder(config) {
//     const mainContainer = document.createElement("div");
//     mainContainer.className = "sidebar-main";
  
//     const sidebar = document.createElement("nav");
//     sidebar.className = "sidebar-nav";
  
//     config.sections.forEach((section) => {
//       const sectionEl = document.createElement("div");
//       sectionEl.className = "sidebar-section";
//       // sectionEl.setAttribute("data-id", section.id || "");
  
//       if (section.showLabel && section.label) {
//         const title = document.createElement("span");
//         title.className = "sidebar-section-title";
//         title.textContent = section.label;
//         sectionEl.appendChild(title);
//       }
  
//       section.items.forEach((item) => {
//         const hasChildren = item.items && item.items.length;
  
//         if (hasChildren) {
//           // Dropdown section
//           const dropdown = document.createElement("div");
//           dropdown.className = "sidebar-dropdown";
//           dropdown.setAttribute("data-id", item.id || "");
  
//           const toggleBtn = document.createElement("button");
//           toggleBtn.className = "sidebar-item sidebar-dropdown-toggle";
//           toggleBtn.type = "button";
//           toggleBtn.setAttribute("data-tooltip", item.label);
//           toggleBtn.setAttribute("data-id", item.id || "");
//           toggleBtn.innerHTML = `
//             <span class="sidebar-icon">${item.icon || ""}</span>
//             <span class="sidebar-label">${item.label}</span>
//             <span class="sidebar-chevron">
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                 <path d="M6 5L10 8L6 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//               </svg>
//             </span>
//           `;
  
//           const submenu = document.createElement("div");
//           submenu.className = "sidebar-dropdown-menu";
  
//           item.items.forEach((sub) => {
//             const subButton = document.createElement("button");  // Changed from <a>
//             subButton.type = "button";
//             subButton.className = "sidebar-subitem";
//             subButton.setAttribute("data-id", sub.id || "");
//             subButton.setAttribute("data-tooltip", sub.label);
            
//             if (sub.path) {
//               subButton.setAttribute("data-path", sub.path);
//             }
            
//             if (sub.externalHandler) {
//               subButton.setAttribute("data-external-handler", "true");
//             }
            
//             subButton.innerHTML = `
//               <span class="sidebar-label">${sub.label}</span>
//             `;
//             submenu.appendChild(subButton);
//           });
  
//           dropdown.appendChild(toggleBtn);
//           dropdown.appendChild(submenu);
//           sectionEl.appendChild(dropdown);
//         } else {
//           // Regular item - use button
//           const button = document.createElement("button");  // Changed from <a>
//           button.type = "button";
//           button.className = `sidebar-item${item.active ? " active" : ""}`;
//           button.setAttribute("data-tooltip", item.label);
//           button.setAttribute("data-id", item.id || "");
          
//           if (item.path) {
//             button.setAttribute("data-path", item.path);
//           }
          
//           if (item.externalHandler) {
//             button.setAttribute("data-external-handler", "true");
//           }
          
//           button.innerHTML = `
//             <span class="sidebar-icon">${item.icon || ""}</span>
//             <span class="sidebar-label">${item.label}</span>
//           `;
//           sectionEl.appendChild(button);
//         }
//       });
  
//       sidebar.appendChild(sectionEl);
//     });
  
//     mainContainer.appendChild(sidebar);
//     return mainContainer;
//   }

//   footerBuilder(config) {
//     const footer = document.createElement("div");
//     footer.className = "sidebar-section sidebar-footer";
  
//     config.items.forEach((item) => {
//       const button = document.createElement("button");  // Changed from <a> to <button>
//       button.className = "sidebar-item";
//       button.type = "button";
//       button.setAttribute("data-tooltip", item.label);
//       button.setAttribute("data-id", item.id || "");
      
//       // Use data-path for navigation
//       if (item.path) {
//         button.setAttribute("data-path", item.path);
//       }
      
//       // Mark items that need external handling
//       if (item.externalHandler) {
//         button.setAttribute("data-external-handler", "true");
//       }
      
//       button.innerHTML = `
//         <span class="sidebar-icon">${item.icon || ""}</span>
//         <span class="sidebar-label">${item.label}</span>
//       `;
//       footer.appendChild(button);
//     });
  
//     return footer;
//   }
//   // ===========================================================
//   // 🧩 STRUCTURE & LOGIC
//   // ===========================================================

//   createOverlay() {
//     if (!this.overlay) {
//       this.overlay = document.createElement("div");
//       this.overlay.className = "sidebar-overlay";
//       document.body.appendChild(this.overlay);
//     }
//   }

//   render() {
//     this.innerHTML = "";
  

//     const header = this.headerBuilder(menuConfig.header);
//     this.appendChild(header);

//     const main = this.mainBuilder(menuConfig.main);
//     this.appendChild(main);

//     if (menuConfig.footer && menuConfig.footer.items?.length) {
//       const footer = this.footerBuilder(menuConfig.footer);
//       this.appendChild(footer);
//     }
//   }

//   initDropdownEvents() {
//     this.querySelectorAll(".sidebar-dropdown-toggle").forEach((toggle) => {
//       toggle.addEventListener("click", (e) => {
//         e.preventDefault();
//         const parent = toggle.closest(".sidebar-dropdown");
//         parent.classList.toggle("open");
//       });
//     });
//   }

//   // ===========================================================
//   // ⚙️ PUBLIC API
//   // ===========================================================

//   toggle() {
//      const screenSize = screenTracker();
//      this.state.isMobile = screenSize.isMobile;
//     if(this.state.isMobile){
//        this.overlay.classList.toggle('active');
//        this.classList.toggle('mobile-open');  
//        if(this.classList.contains('collapsed')){
//           this.classList.remove('collapsed')
//        }

//     }else{
//         this.state.collapsed = !this.state.collapsed;
//     this.classList.toggle("collapsed", this.state.collapsed);
//     }
    
//   }

//   closeMobile() {
//     this.overlay.classList.remove('active');
//     this.classList.remove('mobile-open');
// }

//   collapse() {
//     this.state.collapsed = true;
//     this.classList.add("collapsed");
//   }

//   expand() {
//     this.state.collapsed = false;
//     this.classList.remove("collapsed");
//   }

//   hide() {
//     if (this.state.hidden) return;
//     this.classList.add('hidden'); // Use class instead of inline style
//     this.state.hidden = true;
// }

// show() {
//     if (!this.state.hidden) return;
//     this.classList.remove('hidden'); // Remove class
//     this.state.hidden = false;
// }

//   disable() {
//     if (this.state.disabled) return;
//     this.classList.add("disabled");
//     this.querySelectorAll("a, button").forEach((el) => (el.disabled = true));
//     this.state.disabled = true;
//   }

//   enable() {
//     if (!this.state.disabled) return;
//     this.classList.remove("disabled");
//     this.querySelectorAll("a, button").forEach((el) => (el.disabled = false));
//     this.state.disabled = false;
//   }

  

//   clearActiveStates() {
//     this.querySelectorAll(".sidebar-item.active, .sidebar-subitem.active")
//       .forEach((el) => el.classList.remove("active"));
//     this.querySelectorAll(".sidebar-dropdown")
//       .forEach((dd) => dd.classList.remove("open"));
//   }

//   static getInstance() {
//     return Sidebar.instance;
//   }

  
// }

// customElements.define("x-sidebar", Sidebar);
