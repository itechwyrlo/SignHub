import { ComponentBase } from "../core/ComponentBase.js";
import { componentManager } from "../core/ComponentManager.js";
import { Sidebar } from "./Sidebar.js";
import { Dropdown } from "./Dropdown.js";

/**
 * Header Component
 * Main navigation header with sidebar toggle, search, and dropdowns
 */
export class Header extends ComponentBase {
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
    if (Header.instance) {
      return Header.instance;
    }
    Header.instance = this;

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
    if (Header.instance === this) {
      Header.instance = null;
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize component properties
   */
  initializeComponent() {
    this.componentId = this.getAttribute('data-id') || 'header';
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
   * Build header structure
   */
  buildStructure() {
    return `
      ${this.buildLeftSection()}
      ${this.buildCenterSection()}
      ${this.buildRightSection()}
    `;
  }

  /**
   * Build left section with sidebar toggle
   */
  buildLeftSection() {
    return `
      <div class="header-left">
        <button class="header-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Build center section with search bar
   */
  buildCenterSection() {
    return `
      <div class="header-center">
        <div class="header-search">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/>
            <path d="M13 13L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input type="search" placeholder="Search here..." class="search-input" />
        </div>
      </div>
    `;
  }

  /**
   * Build right section with dropdowns
   */
  buildRightSection() {
    return `  <div class="header-right">
    ${this.buildNotificationsDropdown()}
      ${this.buildMessagesDropdown()}
      ${this.buildUserProfileDropdown()}
      </div>
      
    `;
  }

  /**
   * Build notifications dropdown
   */
  buildNotificationsDropdown() {
    return `
      <x-dropdown data-id="notifications-dropdown">
        <div data-section="trigger">
          <button class="header-action" aria-label="Notifications" style="position: relative; background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background-color 0.2s;">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C7.79086 2 6 3.79086 6 6V9L4 11V13H16V11L14 9V6C14 3.79086 12.2091 2 10 2Z" fill="currentColor"/>
              <path d="M8 16C8 17.1046 8.89543 18 10 18C11.1046 18 12 17.1046 12 16H8Z" fill="currentColor"/>
            </svg>
            <span class="badge" style="position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center;">3</span>
          </button>
        </div>
        
        <div data-section="header">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">Notifications</h3>
            <button style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
              <i class="bx bx-x" style="font-size: 20px;"></i>
            </button>
          </div>
        </div>
        
        <div data-section="main">
          <div style="max-height: 400px; overflow-y: auto;">
            <a href="/notifications/1" class="notification-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s; background-color: #f0f9ff;">
              <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
              <div style="flex: 1; min-width: 0;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937;">
                  <strong style="font-weight: 600;">Cristina Danny</strong> invited you to join <strong>Meeting</strong>.
                </p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Daily scrum meeting time</p>
              </div>
              <span style="font-size: 12px; color: #6b7280; white-space: nowrap;">9:10 PM</span>
            </a>
          </div>
        </div>
        
        <div data-section="footer">
          <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="/notifications" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">View all</a>
          </div>
        </div>
      </x-dropdown>
    `;
  }

  /**
   * Build messages dropdown
   */
  buildMessagesDropdown() {
    return `
      <x-dropdown data-id="messages-dropdown">
        <div data-section="trigger">
          <button class="header-action" aria-label="Messages" style="position: relative; background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background-color 0.2s;">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 4H18V14H6L2 18V4Z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        
        <div data-section="header">
          <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">Messages</h3>
            <button style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
              <i class="bx bx-x" style="font-size: 20px;"></i>
            </button>
          </div>
        </div>
        
        <div data-section="main">
          <div style="max-height: 400px; overflow-y: auto;">
            <a href="/messages/1" class="message-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s; background-color: #f0f9ff;">
              <div style="position: relative;">
                <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%;"></span>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Cristina Danny</p>
                  <span style="font-size: 12px; color: #6b7280;">2 min ago</span>
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">It's Cristina danny's birthday today.</p>
              </div>
            </a>
          </div>
        </div>
        
        <div data-section="footer">
          <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="/messages" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">View all</a>
          </div>
        </div>
      </x-dropdown>
    `;
  }

  /**
   * Build user profile dropdown
   */
  buildUserProfileDropdown() {
    return `
      <x-dropdown data-id="user-profile-dropdown">
        <div data-section="trigger">
          <img src="data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='16' fill='%234F46E5'/%3E%3Ctext x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='Arial'%3EU%3C/text%3E%3C/svg%3E" alt="User" class="user-avatar" />
          <span class="user-name">User Name</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        
        <div data-section="header">
          <div style="display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <img src="/api/placeholder/48/48" alt="Stebin Ben" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 600; font-size: 14px; color: #1f2937;">Stebin Ben</p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">UI/UX Designer</p>
            </div>
            <button style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 8px;">
              <i class="bx bx-power-off" style="font-size: 20px;"></i>
            </button>
          </div>
        </div>
        
        <div data-section="main">
          <x-tabpanel data-id="user-profile-tabpanel" data-variant="default">
            <div data-tab="profile" data-title="Profile" data-icon="bx bx-user">
              <div style="padding: 12px 0;">
                <a href="/profile/edit" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
                  <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                    <i class="bx bx-edit" style="font-size: 18px;"></i>
                  </span>
                  <span style="flex: 1; font-weight: 500; font-size: 14px;">Edit Profile</span>
                </a>
              </div>
            </div>
            
            <div data-tab="settings" data-title="Setting" data-icon="bx bx-cog">
              <div style="padding: 12px 0;">
                <a href="/support" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
                  <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                    <i class="bx bx-help-circle" style="font-size: 18px;"></i>
                  </span>
                  <span style="flex: 1; font-weight: 500; font-size: 14px;">Support</span>
                </a>
              </div>
            </div>
          </x-tabpanel>
        </div>
        
        <div data-section="footer">
          <div style="border-top: 1px solid #e5e7eb; padding: 8px 0;">
            <button class="x-dropdown-item" data-action="logout" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: none; border: none; width: 100%; text-align: left; cursor: pointer; color: #374151; transition: background-color 0.2s;">
              <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                <i class="bx bx-log-out" style="font-size: 18px;"></i>
              </span>
              <span style="flex: 1; font-weight: 500; font-size: 14px;">Logout</span>
            </button>
          </div>
        </div>
      </x-dropdown>
    `;
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   */
  setupEvents() {
    console.log('✓ Setting up Header events');
    
    // Use managed event listener for sidebar toggle
    this.addManagedEventListener(document, 'click', this.handleDocumentClick);
  }

  /**
   * Handle document clicks (event delegation)
   */
  handleDocumentClick = (e) => {
    const toggleButton = e.target.closest("#sidebarToggle");
    if (toggleButton) {
      this.handleToggleSidebar(e);
    }
  }

  /**
   * Handle sidebar toggle
   */
  handleToggleSidebar(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const sidebar = componentManager.getComponent("comp-sidebar");
    if (sidebar) {
      sidebar.toggle();
    }
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
    this.querySelectorAll("button, input").forEach((el) => {
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
    this.querySelectorAll("button, input").forEach((el) => {
      el.disabled = true;
    });
    this.state.disabled = true;
    return this;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    return Header.instance;
  }
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define("x-header", Header);

// import { ComponentBase } from "../core/ComponentBase.js";
// import { componentManager } from "../core/ComponentManager.js";
// import { Sidebar } from "./Sidebar.js";
// import { Dropdown } from "./Dropdown.js";

// export class Header extends ComponentBase {
//   static instance = null;

//   constructor() {
//     super();

//     if (!Header.instance)
//     Header.instance = this;

//     this.state = {
//       hidden: false,
//       disabled: false,
//     };
//   }

//   onInit() {
//     this.render();
//     this.setupEvents();
//   }

//   render() {
//     this.innerHTML = `
//       <div class="header-left">
//         <button class="header-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
//           <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//             <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//             <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//             <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//           </svg>
//         </button>
//       </div>

//       <div class="header-center">
//         <div class="header-search">
//           <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
//             <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/>
//             <path d="M13 13L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//           </svg>
//           <input type="search" placeholder="Search here..." class="search-input" />
//         </div>
//       </div>

//       <x-dropdown data-id="notifications-dropdown">
//     <div data-section="trigger">
//         <button class="header-action" aria-label="Notifications" style="position: relative; background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background-color 0.2s;">
//             <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//                 <path d="M10 2C7.79086 2 6 3.79086 6 6V9L4 11V13H16V11L14 9V6C14 3.79086 12.2091 2 10 2Z" fill="currentColor"/>
//                 <path d="M8 16C8 17.1046 8.89543 18 10 18C11.1046 18 12 17.1046 12 16H8Z" fill="currentColor"/>
//             </svg>
//             <span class="badge" style="position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center;">3</span>
//         </button>
//     </div>
    
//     <div data-section="header">
//         <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
//             <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">Notifications</h3>
//             <button style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
//                 <i class="bx bx-x" style="font-size: 20px;"></i>
//             </button>
//         </div>
//     </div>
    
//     <div data-section="main">
//         <div style="max-height: 400px; overflow-y: auto;">
//             <!-- Notification Item 1 -->
//             <a href="/notifications/1" class="notification-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s; background-color: #f0f9ff;">
//                 <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
//                 <div style="flex: 1; min-width: 0;">
//                     <p style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937;">
//                         <strong style="font-weight: 600;">Cristina Danny</strong> invited you to join <strong>Meeting</strong>.
//                     </p>
//                     <p style="margin: 0; font-size: 12px; color: #6b7280;">Daily scrum meeting time</p>
//                 </div>
//                 <span style="font-size: 12px; color: #6b7280; white-space: nowrap;">9:10 PM</span>
//             </a>
            
//             <!-- Notification Item 2 -->
//             <a href="/notifications/2" class="notification-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s;">
//                 <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
//                 <div style="flex: 1; min-width: 0;">
//                     <p style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937;">
//                         <strong style="font-weight: 600;">System Alert</strong> - There was a failure to your setup.
//                     </p>
//                     <p style="margin: 0; font-size: 12px; color: #6b7280;">7 hours ago</p>
//                 </div>
//                 <span style="font-size: 12px; color: #6b7280; white-space: nowrap;">2:45 PM</span>
//             </a>
            
//             <!-- Notification Item 3 -->
//             <a href="/notifications/3" class="notification-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s;">
//                 <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
//                 <div style="flex: 1; min-width: 0;">
//                     <p style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937;">
//                         <strong style="font-weight: 600;">Aida Burg</strong> commented your post.
//                     </p>
//                     <p style="margin: 0; font-size: 12px; color: #6b7280;">5 August</p>
//                 </div>
//                 <span style="font-size: 12px; color: #6b7280; white-space: nowrap;">6:00 PM</span>
//             </a>
            
//             <!-- Notification Item 4 -->
//             <a href="/notifications/4" class="notification-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; transition: background-color 0.2s;">
//                 <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
//                 <div style="flex: 1; min-width: 0;">
//                     <p style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937;">
//                         It's <strong style="font-weight: 600;">Cristina Danny's</strong> birthday today.
//                     </p>
//                     <p style="margin: 0; font-size: 12px; color: #6b7280;">2 min ago</p>
//                 </div>
//                 <span style="font-size: 12px; color: #6b7280; white-space: nowrap;">3:00 AM</span>
//             </a>
//         </div>
//     </div>
    
//     <div data-section="footer">
//         <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; text-align: center;">
//             <a href="/notifications" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">View all</a>
//         </div>
//     </div>
// </x-dropdown>

// <!-- Messages Dropdown -->
// <x-dropdown data-id="messages-dropdown">
//     <div data-section="trigger">
//         <button class="header-action" aria-label="Messages" style="position: relative; background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background-color 0.2s;">
//             <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//                 <path d="M2 4H18V14H6L2 18V4Z" stroke="currentColor" stroke-width="2"/>
//             </svg>
//         </button>
//     </div>
    
//     <div data-section="header">
//         <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
//             <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">Messages</h3>
//             <button style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
//                 <i class="bx bx-x" style="font-size: 20px;"></i>
//             </button>
//         </div>
//     </div>
    
//     <div data-section="main">
//         <div style="max-height: 400px; overflow-y: auto;">
//             <!-- Message Item 1 -->
//             <a href="/messages/1" class="message-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s; background-color: #f0f9ff;">
//                 <div style="position: relative;">
//                     <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
//                     <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%;"></span>
//                 </div>
//                 <div style="flex: 1; min-width: 0;">
//                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
//                         <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Cristina Danny</p>
//                         <span style="font-size: 12px; color: #6b7280;">2 min ago</span>
//                     </div>
//                     <p style="margin: 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">It's Cristina danny's birthday today.</p>
//                 </div>
//             </a>
            
//             <!-- Message Item 2 -->
//             <a href="/messages/2" class="message-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s;">
//                 <div style="position: relative;">
//                     <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
//                     <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border: 2px solid white; border-radius: 50%;"></span>
//                 </div>
//                 <div style="flex: 1; min-width: 0;">
//                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
//                         <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Aida Burg</p>
//                         <span style="font-size: 12px; color: #6b7280;">5 August</span>
//                     </div>
//                     <p style="margin: 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Aida Burg commented your post.</p>
//                 </div>
//             </a>
            
//             <!-- Message Item 3 -->
//             <a href="/messages/3" class="message-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s;">
//                 <div style="position: relative;">
//                     <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
//                     <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #6b7280; border: 2px solid white; border-radius: 50%;"></span>
//                 </div>
//                 <div style="flex: 1; min-width: 0;">
//                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
//                         <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">System</p>
//                         <span style="font-size: 12px; color: #6b7280;">7 hours ago</span>
//                     </div>
//                     <p style="margin: 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">There was a failure to your setup.</p>
//                 </div>
//             </a>
            
//             <!-- Message Item 4 -->
//             <a href="/messages/4" class="message-item" style="display: flex; gap: 12px; padding: 16px 20px; text-decoration: none; color: inherit; transition: background-color 0.2s;">
//                 <div style="position: relative;">
//                     <img src="/api/placeholder/40/40" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
//                     <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%;"></span>
//                 </div>
//                 <div style="flex: 1; min-width: 0;">
//                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
//                         <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Meeting Reminder</p>
//                         <span style="font-size: 12px; color: #6b7280;">9:10 PM</span>
//                     </div>
//                     <p style="margin: 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Daily scrum meeting time</p>
//                 </div>
//             </a>
//         </div>
//     </div>
    
//     <div data-section="footer">
//         <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; text-align: center;">
//             <a href="/messages" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">View all</a>
//         </div>
//     </div>
// </x-dropdown>

    

//         <x-dropdown data-id="user-profile-dropdown">
//             <div data-section="trigger">
//                 <img src="data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='16' fill='%234F46E5'/%3E%3Ctext x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='Arial'%3EU%3C/text%3E%3C/svg%3E" alt="User" class="user-avatar" />
//                 <span class="user-name">User Name</span>
//                 <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                     <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//                 </svg>
//         </div>
        
//         <div data-section="header">
//             <div style="display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #e5e7eb;">
//                 <img src="/api/placeholder/48/48" alt="Stebin Ben" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
//                 <div style="flex: 1;">
//                     <p style="margin: 0; font-weight: 600; font-size: 14px; color: #1f2937;">Stebin Ben</p>
//                     <p style="margin: 0; color: #6b7280; font-size: 12px;">UI/UX Designer</p>
//                 </div>
//                 <button style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 8px;">
//                     <i class="bx bx-power-off" style="font-size: 20px;"></i>
//                 </button>
//             </div>
//         </div>
        
//         <div data-section="main">
//             <x-tabpanel data-id="user-profile-tabpanel" data-variant="default">
//                 <!-- Profile Tab -->
//                 <div data-tab="profile" data-title="Profile" data-icon="bx bx-user">
//                     <div style="padding: 12px 0;">
//                         <a href="/profile/edit" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-edit" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Edit Profile</span>
//                         </a>
                        
//                         <a href="/profile/view" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-user" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">View Profile</span>
//                         </a>
                        
//                         <a href="/profile/social" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-id-card" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Social Profile</span>
//                         </a>
                        
//                         <a href="/billing" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-wallet" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Billing</span>
//                         </a>
//                     </div>
//                 </div>
                
//                 <!-- Settings Tab -->
//                 <div data-tab="settings" data-title="Setting" data-icon="bx bx-cog">
//                     <div style="padding: 12px 0;">
//                         <a href="/support" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-help-circle" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Support</span>
//                         </a>
                        
//                         <a href="/settings/account" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-user-circle" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Account Settings</span>
//                         </a>
                        
//                         <a href="/settings/privacy" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content; center; color: #6b7280;">
//                                 <i class="bx bx-lock-alt" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Privacy Center</span>
//                         </a>
                        
//                         <a href="/feedback" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-message-square-dots" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">Feedback</span>
//                         </a>
                        
//                         <a href="/history" class="x-dropdown-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; text-decoration: none; color: #374151; transition: background-color 0.2s;">
//                             <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
//                                 <i class="bx bx-time" style="font-size: 18px;"></i>
//                             </span>
//                             <span style="flex: 1; font-weight: 500; font-size: 14px;">History</span>
//                         </a>
//                     </div>
//                 </div>
//             </x-tabpanel>
//         </div>
        
//         <div data-section="footer">
//             <div style="border-top: 1px solid #e5e7eb; padding: 8px 0;">
//                 <button class="x-dropdown-item" data-action="logout" style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: none; border: none; width: 100%; text-align: left; cursor: pointer; color: #374151; transition: background-color 0.2s;">
//                     <span style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
//                         <i class="bx bx-log-out" style="font-size: 18px;"></i>
//                     </span>
//                     <span style="flex: 1; font-weight: 500; font-size: 14px;">Logout</span>
//                 </button>
//             </div>
//         </div>
//     </x-dropdown>
//     `;
//   }

//   setupEvents() {
//     console.log('✓ Setting up Header events');
    
//     // 🔥 USE MANAGED EVENT LISTENER - automatically cleaned up
//     this.addManagedEventListener(document, 'click', this.handleEvents);
//   }

//   handleEvents(e) {
//     const toggleButton = e.target.closest("#sidebarToggle");
//     if (toggleButton) {
//       this.handleToggleSidebar(e);
//     }
//   }

//   handleToggleSidebar(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     let sidebar = componentManager.getComponent("comp-sidebar");
//     sidebar.toggle();
      
//   }

//   // ===========================================================
//   // ⚙️ PUBLIC API (consistent with Sidebar)
//   // ===========================================================

//   hide() {
//     if (this.state.hidden) return;
//     this.classList.add('hidden');
//     this.state.hidden = true;
//   }

//   show() {
//     if (!this.state.hidden) return;
//     this.classList.remove('hidden');
//     this.state.hidden = false;
//   }

//   disable() {
//     if (this.state.disabled) return;
//     this.classList.add("disabled");
//     this.querySelectorAll("button, input").forEach((el) => (el.disabled = true));
//     this.state.disabled = true;
//   }

//   enable() {
//     if (!this.state.disabled) return;
//     this.classList.remove("disabled");
//     this.querySelectorAll("button, input").forEach((el) => (el.disabled = false));
//     this.state.disabled = false;
//   }

//   static getInstance() {
//     return Header.instance;
//   }
  
//   onDestroy() {
//     // Clean up event listeners
//     document.removeEventListener("click", this.handleEvents);
//     Header.instance = null;
//   }
// }

// customElements.define("x-header", Header);