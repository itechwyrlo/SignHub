import { Layout } from "./layout.js";
import { AuthManager } from "./AuthManager.js";
import { loading } from "../utils/loadingOverlay.js";
import { toast } from "../utils/toast.js";

export class Router {
    static instance = null;
  
    constructor(options = {}) {
      if (Router.instance) {
        return Router.instance;
      }
  
      this.routes = [];
      this.rootElement = options.rootElement || document.getElementById("app");
      
      // Track current route state for cleanup
      this.currentController = null;
      this.currentRoute = null;
  
      this.navigateTo = this.navigateTo.bind(this);
      this.loadRoute = this.loadRoute.bind(this);
      this.init = this.init.bind(this);
  
      Router.instance = this;
    }
  
    /**
     * Initialize the router after app layout is built
     */
    init() {
     const currentPath = window.location.pathname; 

     const matchedRoute = this.matchRoute(currentPath);
      // Handle browser back/forward navigation
      window.addEventListener("popstate", this.loadRoute);
      
      // Handle session expiration globally
      window.addEventListener("auth:expired", () => {
        this.cleanupCurrentRoute();
        Layout.destroyLayout();
        this.navigateTo("/login");
        // ✅ Don't hide immediately - let loadRoute handle it
    });

      // Handle auth changes (login/logout)
      window.addEventListener("auth:changed", (e) => {
        if (!e.detail.authenticated) {
            loading.show('Logging out...');
            this.cleanupCurrentRoute();
            Layout.destroyLayout();
            this.navigateTo("/login");
            // ✅ Don't hide immediately - let loadRoute handle it
        }
    });
     
      this.loadRoute(currentPath);
    }
  
    /**
     * Register a route configuration
     */
    register(config) {
      if (!config.path || !config.view) {
        console.warn("Route must include at least a 'path' and a 'view'.");
        return;
      }
  
      const exists = this.routes.some(r => r.path === config.path);
      if (exists) {
        console.warn(`Route already registered for: ${config.path}`);
        return;
      }
  
      this.routes.push(config);
    }
  
    /**
     * Navigate programmatically to a new route
     */
    navigateTo(path) {
      history.pushState({}, "", path);
      this.loadRoute(path);
    }
  
    /**
     * Clean up current route before loading new one
     */
    cleanupCurrentRoute() {
      // 1. Destroy current controller (removes event listeners and bindings)
      if (this.currentController && typeof this.currentController.destroy === 'function') {
        console.log('🧹 Destroying current controller');
        this.currentController.destroy();
        this.currentController = null;
      }
      
      // 2. Clear main container (this will trigger disconnectedCallback on all components inside)
      const mainContainer = document.querySelector("main.main-container");
      if (mainContainer) {
        console.log('🧹 Clearing main container');
        mainContainer.innerHTML = '';
      }
      
      // Note: disconnectedCallback will automatically:
      // - Call component's onDestroy()
      // - Unsubscribe from models
      // - Unregister from ComponentManager
    }
  
    /**
     * Load and render a route view
     */
    /**
 * Load and render a route view
 */
loadRoute(path) {
  // Show loading at the start
  loading.show('Loading page...');
  
  let currentPath;

  if (typeof path === "string") {
      // path is explicitly provided as a string
      currentPath = path;
  } else {
      // fallback: use window.location.pathname
      currentPath = path.target.location.pathname;
  }

  // Normalize trailing slash
  if (currentPath.length > 1 && currentPath.endsWith('/')) {
    currentPath = currentPath.replace(/\/+$/, '');
  }

  if (currentPath === '/SignHub') {
    const isAuthenticated = AuthManager.isAuth();
    const redirectPath = isAuthenticated ? '/dashboard' : '/login';
    history.replaceState({}, "", redirectPath);
    this.loadRoute(redirectPath);
    return;
  }

  try {
      const matchedRoute = this.matchRoute(currentPath);
      
      // Handle 404 - route not found
      if (!matchedRoute) {
        loading.hide();
        this.rootElement.innerHTML = `
        <div class="error-page">
          <div class="error-container">
            <div class="error-text">
              <p class="error-code">ERROR 404</p>
              <h1>Page Not Found!</h1>
              <p>The page you're trying to access doesn't exist or has been removed.</p>
              <a href="/dashboard" class="btn-home">Go Back Home</a>
            </div>
            <div class="error-illustration">
            <img src="/src/assets/img/404.png" alt="404 Error Illustration">
            </div>
          </div>
        </div>
        `;
        toast.warning('Page not found');
        return;
      }

      const isAuthenticated = AuthManager.isAuth();
      const isPublic = matchedRoute.public;
      const requiresAuth = matchedRoute.protected;

      // --- Redirect authenticated users away from login/signup ---
      if (isPublic && isAuthenticated) {
          const protectedRoute = this.routes.find((r) => r.protected);
          const redirectPath = protectedRoute ? protectedRoute.path : "/dashboard";
          history.replaceState({}, "", redirectPath);
          // Recursive call - loading will be handled in the recursive call
          this.loadRoute(redirectPath);
          loading.hide();
          return;
      }

      // --- Redirect unauthenticated users trying to access protected routes ---
      if (requiresAuth && !isAuthenticated) {
          history.replaceState({}, "", "/login");
          window.dispatchEvent(new CustomEvent("auth:required", { detail: { attempted: path } }));

          const loginRoute = this.routes.find((r) => r.path === "/login");
          if (loginRoute) {
           
              // Recursive call - loading will be handled in the recursive call
              this.navigateTo(loginRoute.path);
               loading.hide();
          } else {
              loading.hide();
              toast.error('Login required to access this page');
          }
          return;
      }

      // 🔥 CLEANUP BEFORE RENDERING NEW ROUTE
     // 🔥 CLEANUP BEFORE RENDERING NEW ROUTE
console.log('🔄 Route change detected, cleaning up...');
this.cleanupCurrentRoute();

// ✅ SMART: Only recreate layout if switching between protected/public routes
// Layout.createLayout() will check if recreation is needed
Layout.createLayout(matchedRoute);

// Create new view and controller instances
const params = this.extractParams(matchedRoute.path, currentPath);
const viewInstance = new matchedRoute.view();
let controllerInstance = null;

if (matchedRoute.controller) {
  controllerInstance = new matchedRoute.controller();
  this.currentController = controllerInstance;
  this.currentRoute = matchedRoute;
}

// Initialize controller (renders view and sets up bindings)
if (controllerInstance?.init) {
    try {
        controllerInstance.init(viewInstance);
    } catch (initError) {
        console.error('Error initializing controller:', initError);
        loading.hide();
        toast.error(`Failed to initialize page: ${initError.message}`);
        return;
    }
}
      // ✅ Hide loading after successful route load
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
          loading.forceHide();
      }, 100);
      
  } catch (error) {
      // ✅ Hide loading on error
      loading.hide();
      
      // ✅ Show error toast
      console.error('Route loading error:', error);
      toast.error(`Failed to load page: ${error.message || 'Unknown error'}`);
      
      // Show error page as fallback
      this.rootElement.innerHTML = `
      <div class="error-page">
        <div class="error-container">
          <div class="error-text">
            <p class="error-code">ERROR</p>
            <h1>Something went wrong!</h1>
            <p>${error.message || 'An unexpected error occurred while loading the page.'}</p>
            <a href="/dashboard" class="btn-home">Go Back Home</a>
          </div>
        </div>
      </div>
      `;
  }
}
  
    /**
     * Match the current URL to a registered route
     */
    matchRoute(currentPath) {
      for (const route of this.routes) {
        const regex = this.pathToRegex(route.path);
        if (regex.test(currentPath)) {
          return route;
        }
      }
      return null;
    }
  
    /**
     * Convert path pattern to RegExp
     */
    pathToRegex(path) {
        const pattern = path.replace(/:\w+/g, "([^/]+)");
        return new RegExp(`^${pattern}$`, "i");
    }
  
    /**
     * Extract params from dynamic routes
     * Example:
     * route: /dashboard/documents/:id
     * url:   /dashboard/documents/5
     * result: { id: "5" }
     */
    extractParams(routePath, currentPath) {
      const paramNames = [...routePath.matchAll(/:(\w+)/g)].map(m => m[1]);
      const matches = currentPath.match(this.pathToRegex(routePath));
      if (!matches) return {};
      const values = matches.slice(1);
      return Object.fromEntries(paramNames.map((n, i) => [n, values[i]]));
    }
}

  