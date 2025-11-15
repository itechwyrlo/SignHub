import { componentManager } from "./ComponentManager.js";

export class ControllerBase {
  constructor() {
    this.bindings = [];
    this.configs = [];
    this.eventListeners = new Map();
    this.initialized = false;
  }

  init(view) {
    this.setupControls();
    const main = document.querySelector("main");
    
    main.innerHTML = view.render();
    if (typeof this.setupConfigs === "function") 
      this.setupConfigs();

    this.setupBindComponentToModel();
  }

  setupBindComponentToModel() {
    this.configs.forEach(binding => this.bind(binding));
    this.initialized = true;
  }

  bind(config) {
    const { componentId, model, handlers = {} } = config;
    
    const component = componentManager.getComponent(componentId);
    
    if (!component || !model) {
      console.error("Both component and model required");
      return this;
    }
  
    this.bindings.push({ component, model, handlers });
    component.bindModel(model);
  
    Object.entries(handlers).forEach(([field, handlerName]) => {
      const handler =
        typeof handlerName === "string" ? this[handlerName] : handlerName;
  
      if (typeof handler === "function") {
        component.registerUpdateHandler(field, handler.bind(this));
      }
    });
  
    return this;
  }

  control(controls = {}) {
    Object.entries(controls).forEach(([selector, events]) => {
      this._attachControlEvents(selector, events);
    });
    return this;
  }

  _attachControlEvents(selector, events) {
    const mainContainer = document.querySelector(".main-container") || document.body;
    const [componentId, internalSelector] = this._parseSelector(selector);
  
    Object.entries(events).forEach(([eventName, handler]) => {
      // === Handle lifecycle events first ===
      if (eventName === "beforerender" || eventName === "afterrender") {
        const lifecycleHandler = (e) => {
          if (e.detail?.componentId === componentId) {
            const component = e.detail.instance;
            const data = e.detail.data || null;
            handler.call(this, component, data, e);
          }
        };
        
        mainContainer.addEventListener(eventName, lifecycleHandler);
        
        const listenerKey = `lifecycle::${componentId}::${eventName}`;
        this.eventListeners.set(listenerKey, {
          element: mainContainer,
          eventName: eventName,
          handler: lifecycleHandler,
        });
        return;
      }
  
      // === For custom events (like 'form-submit') ===
      const customEventHandler = (e) => {
        const component = e.target;
        const data = e.detail?.data || null;
        handler.call(this, component, data, e);
      };
  
      // Try to attach immediately if component exists
      const existingComponent = document.querySelector(`[data-id="${componentId}"]`) || 
                                document.getElementById(componentId) || 
                                document.querySelector(componentId);
      
      if (existingComponent) {
        this._attachEventToComponent(
          existingComponent, 
          internalSelector, 
          eventName, 
          customEventHandler,
          selector
        );
      }
  
      // Also listen for afterrender events
      const afterRenderListener = (e) => {
        if (e.detail?.componentId !== componentId) return;
        const component = e.detail.instance;
        if (!component) return;
        
        console.log(`🔄 Afterrender fired for: ${componentId}`);
        
        this._attachEventToComponent(
          component, 
          internalSelector, 
          eventName, 
          customEventHandler,
          selector
        );
      };
  
      mainContainer.addEventListener("afterrender", afterRenderListener);
      
      const listenerKey = `afterrender::${componentId}::${internalSelector || "root"}::${eventName}`;
      this.eventListeners.set(listenerKey, {
        element: mainContainer,
        eventName: "afterrender",
        handler: afterRenderListener,
      });
    });
  }

  _attachEventToComponent(component, internalSelector, eventName, boundHandler, fullSelector) {
    let targetElement = component;
    
    if (internalSelector) {
      targetElement = component.querySelector(internalSelector);
      if (!targetElement) {
        console.warn(`⚠️ Element not found: ${internalSelector} in component`);
        return;
      }
    }

    // ✅ FIX: Use data-id attribute first, then fallback to id or tagName
    const componentIdentifier = component.getAttribute('data-id') || 
                               component.id || 
                               component.tagName;
    
    const key = `${componentIdentifier}::${internalSelector || "root"}::${eventName}`;
    
    // Check if already attached to avoid duplicates
    if (this.eventListeners.has(key)) {
      console.warn(`⚠️ Event already attached (skipping): ${key}`);
      return;
    }

    targetElement.addEventListener(eventName, boundHandler);

    this.eventListeners.set(key, {
      element: targetElement,
      eventName,
      handler: boundHandler,
    });

    console.log(`✅ Attached ${eventName} to ${fullSelector} (key: ${key})`);
  }

  _parseSelector(selector) {
    const parts = selector.trim().split(/\s+/);
    const componentId = parts[0];
    const internalSelector = parts.slice(1).join(" ") || null;
    return [componentId, internalSelector];
  }

  removeControl(selector, eventName = null) {
    const [componentId, internalSelector] = this._parseSelector(selector);
    const keyPrefix = `${componentId}::${internalSelector || "root"}`;

    this.eventListeners.forEach((listener, key) => {
      if (key.startsWith(keyPrefix)) {
        if (!eventName || key.endsWith(`::${eventName}`)) {
          listener.element.removeEventListener(listener.eventName, listener.handler);
          this.eventListeners.delete(key);
        }
      }
    });

    return this;
  }

  unbind(component) {
    const index = this.bindings.findIndex((b) => b.component === component);
    if (index !== -1) {
      component.unsubscribeAll();
      this.bindings.splice(index, 1);
    }
    return this;
  }

  destroy() {
    this.eventListeners.forEach((listener) => {
      listener.element.removeEventListener(listener.eventName, listener.handler);
    });
    this.eventListeners.clear();

    this.bindings.forEach(({ component }) => {
      component.unsubscribeAll();
    });
    this.bindings = [];
    this.initialized = false;
  }
}