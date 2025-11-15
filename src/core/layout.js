import { Header } from "../components/Header.js";
import { Footer } from "../components/Footer.js";
import { Sidebar } from "../components/Sidebar.js";
import { componentManager } from "./ComponentManager.js";
import { Modal } from "../components/Modal.js";

export class Layout {
    static currentLayout = null;
    static layoutElements = {
        sidebar: null,
        header: null,
        footer: null
    };

    /**
     * Initialize skeletal layout structure (called once on app start)
     */
    static init() {
        return `
        <!-- Layout components will be dynamically inserted here -->
        <main class="main-container"></main>
        <x-modal></x-modal>
        `;
    }

    /**
     * Destroy all layout components
     */
    static destroyLayout() {
        console.log('🧹 Destroying layout components');
        
        const app = document.getElementById('app');
        if (!app) return;
        
        // Remove sidebar, header, footer (but keep main-container)
        const sidebar = app.querySelector('.dashboard-sidebar');
        const header = app.querySelector('.dashboard-header');
        const footer = app.querySelector('.dashboard-footer');
        
        if (sidebar) {
            sidebar.remove();
            this.layoutElements.sidebar = null;
        }
        if (header) {
            header.remove();
            this.layoutElements.header = null;
        }
        if (footer) {
            footer.remove();
            this.layoutElements.footer = null;
        }
        
        // Clear any singleton references if components cache themselves
        if (Sidebar._instance) {
            Sidebar._instance = null;
        }
        
        this.currentLayout = null;
    }

    /**
     * Create layout components based on route configuration
     * @param {Object} routeConfig - The matched route object from Router
     */
    /**
 * Create layout components based on route configuration
 * @param {Object} routeConfig - The matched route object from Router
 */
static async createLayout(routeConfig) {
    const isProtected = !!routeConfig?.protected;
    const app = document.getElementById('app');
    const mainContainer = app.querySelector('.main-container');
    
    if (!app || !mainContainer) {
        console.error('❌ App or main-container not found');
        return;
    }

    // ✅ SMART: Only recreate if layout type changed
    const layoutType = isProtected ? 'protected' : 'public';
    if (this.currentLayout === layoutType) {
        console.log(`✅ Layout already exists (${layoutType}), skipping recreation`);
        return; // Layout already exists, no need to recreate
    }

    console.log(`🏗️ Creating ${layoutType} layout`);

    // If switching from protected to public or vice versa, destroy old layout
    if (this.currentLayout && this.currentLayout !== layoutType) {
        this.destroyLayout();
    }

    if (isProtected) {
        // ✅ Remove public-page class, add protected-page class
        mainContainer.classList.remove('public-page');
        mainContainer.classList.add('protected-page');
        
        // ✅ Only create if they don't exist
        if (!this.layoutElements.sidebar) {
            try {
                const sidebar = document.createElement('x-sidebar');
                sidebar.className = 'dashboard-sidebar';
                sidebar.setAttribute('data-id', 'comp-sidebar');
                sidebar.setAttribute('id', 'dashboardSidebar');
                app.insertBefore(sidebar, mainContainer);
                
                await new Promise(resolve => setTimeout(resolve, 0));
                
                this.layoutElements.sidebar = sidebar;
                console.log('✅ Sidebar created and inserted');
            } catch (err) {
                console.error('❌ Error creating sidebar:', err);
            }
        }
        
        if (!this.layoutElements.header) {
            try {
                const header = document.createElement('x-header');
                header.className = 'dashboard-header';
                header.setAttribute('data-id', 'comp-header');
                app.insertBefore(header, mainContainer);
                
                await new Promise(resolve => setTimeout(resolve, 0));
                
                this.layoutElements.header = header;
                console.log('✅ Header created and inserted');
            } catch (err) {
                console.error('❌ Error creating header:', err);
            }
        }
        
        if (!this.layoutElements.footer) {
            try {
                const footer = document.createElement('x-footer');
                footer.className = 'dashboard-footer';
                footer.setAttribute('data-id', 'comp-footer');
                app.insertBefore(footer, mainContainer);
                
                await new Promise(resolve => setTimeout(resolve, 0));
                
                this.layoutElements.footer = footer;
                console.log('✅ Footer created and inserted');
            } catch (err) {
                console.error('❌ Error creating footer:', err);
            }
        }
        
        console.log('📝 Layout components ready');
        this.currentLayout = 'protected';
    } else {
        // ✅ Public pages (login, signup) - add class for centering
        mainContainer.classList.remove('protected-page');
        mainContainer.classList.add('public-page');
        this.currentLayout = 'public';
    }
}

    /**
     * Build or adjust layout visibility based on route configuration
     * This is now an alias for createLayout for backward compatibility
     * @param {Object} routeConfig - The matched route object from Router
     */
    static buildLayout(routeConfig) {
        this.createLayout(routeConfig);
    }

    /**
     * Reset layout (called on logout)
     * @param {Object} routeConfig - The matched route object from Router
     */
    static _reset(routeConfig) {
        this.destroyLayout();
        this.createLayout(routeConfig);
    }
}