import { componentManager } from "./ComponentManager.js";

export class ComponentBase extends HTMLElement {
    constructor() {
        super();
        this._modelSubscriptions = new Map();
        this._updateHandlers = new Map();
        this._boundModel = null;
        
        // 🆕 Track event listeners for cleanup
        this._eventListeners = [];

        const beforerender = new CustomEvent('beforerender', {
            detail: {
                componentId: this.getAttribute("data-id"),
                instance: this,
                eventName: 'beforerender'
            },
            bubbles: true,
            composed: true
        });

        this.dispatchEvent(beforerender);
    }

    connectedCallback() {
        const componentId = this.getAttribute("data-id");
        console.log(`✅ Component connected: ${componentId || 'unknown'}`);

        if (componentId) {
            componentManager.register(componentId, this);
            console.log(`📝 Registered in ComponentManager: ${componentId}`);
        } else {
            console.warn(`⚠️ Component connected without data-id attribute`, this);
        }

        setTimeout(() => {
            const afterrender = new CustomEvent('afterrender', {
                detail: {
                    componentId: this.getAttribute("data-id"),
                    instance: this,
                    eventName: 'afterrender'
                },
                bubbles: true,
                composed: true
            });

            this.dispatchEvent(afterrender);
        });
        
        if (typeof this.onInit === "function") {
            console.log(`🔧 Calling onInit for: ${componentId || 'unknown'}`);
            this.onInit();
        }
    }

    disconnectedCallback() {
        const componentId = this.getAttribute("data-id");
        console.log(`🧹 Component disconnected: ${componentId}`);
        
        // 🆕 Remove all tracked event listeners
        this.removeAllEventListeners();
        
        // Call custom cleanup if exists
        if (typeof this.onDestroy === "function") {
            this.onDestroy();
        }

        // Unregister from ComponentManager
        const id = this.getAttribute("data-id");
        if (id) {
            componentManager.unregister(id);
        }

        // Unsubscribe from all models
        this.unsubscribeAll();
    }

    destroy() {
        this.remove();
    }

    // ============================================
    // 🆕 EVENT LISTENER MANAGEMENT
    // ============================================
    
    /**
     * Add event listener with automatic cleanup tracking
     * @param {EventTarget} target - Element or window/document
     * @param {string} eventName - Event name (click, resize, etc)
     * @param {Function} handler - Event handler function
     * @param {Object} options - addEventListener options
     */
    addManagedEventListener(target, eventName, handler, options = false) {
        // Bind handler to this component if not already bound
        const boundHandler = handler.bind(this);
        
        // Add the event listener
        target.addEventListener(eventName, boundHandler, options);
        
        // Track for cleanup
        this._eventListeners.push({
            target,
            eventName,
            handler: boundHandler,
            options
        });
        
        console.log(`✓ Added managed listener: ${eventName} on`, target);
        
        return boundHandler; // Return in case needed for manual removal
    }
    
    /**
     * Remove a specific managed event listener
     */
    removeManagedEventListener(target, eventName, handler) {
        const index = this._eventListeners.findIndex(
            listener => listener.target === target && 
                       listener.eventName === eventName && 
                       listener.handler === handler
        );
        
        if (index !== -1) {
            const listener = this._eventListeners[index];
            listener.target.removeEventListener(
                listener.eventName, 
                listener.handler, 
                listener.options
            );
            this._eventListeners.splice(index, 1);
            console.log(`✓ Removed managed listener: ${eventName}`);
        }
    }
    
    /**
     * Remove all tracked event listeners
     */
    removeAllEventListeners() {
        if (this._eventListeners.length > 0) {
            console.log(`🧹 Removing ${this._eventListeners.length} event listener(s)`);
            
            this._eventListeners.forEach(({ target, eventName, handler, options }) => {
                target.removeEventListener(eventName, handler, options);
            });
            
            this._eventListeners = [];
        }
    }

    // ============================================
    // MODEL BINDING METHODS
    // ============================================
    bindModel(model) {
      if (!model || typeof model.subscribe !== 'function') {
          console.error('Model must have subscribe method (Observable)');
          return this;
      }
      
      this._boundModel = model;
      
      const unsubscribe = model.subscribe((data) => {
          this.handleModelUpdate(data);
      });
      
      this._modelSubscriptions.set(model, unsubscribe);
      
      this.handleModelUpdate({
          state: model.getState(),
          initial: true
      });
      
      // ✅ Emit model-bound event
      this.dispatchEvent(new CustomEvent('model-bound', {
          detail: { 
              model: this._boundModel,
              componentId: this.getAttribute('data-id')
          },
          bubbles: true,
          composed: true
      }));
      
      console.log(`✅ Model bound to component: ${this.getAttribute('data-id')}`);
      
      return this;
  }
    // bindModel(model) {
    //     if (!model || typeof model.subscribe !== 'function') {
    //         console.error('Model must have subscribe method (Observable)');
    //         return this;
    //     }
        
    //     this._boundModel = model;
        
    //     const unsubscribe = model.subscribe((data) => {
    //         this.handleModelUpdate(data);
    //     });
        
    //     this._modelSubscriptions.set(model, unsubscribe);
        
    //     this.handleModelUpdate({
    //         state: model.getState(),
    //         initial: true
    //     });
        
    //     return this;
    // }
    
    handleModelUpdate({ state, changed, previous, initial }) {
        if (changed) {
            Object.keys(changed).forEach(field => {
                const handler = this._updateHandlers.get(field);
                if (handler) {
                    handler.call(this, changed[field], state, previous);
                }
            });
        }
        
        if (typeof this.onModelChange === 'function') {
            this.onModelChange({ state, changed, previous, initial });
        }
    }
    
    registerUpdateHandler(field, handler) {
        if (typeof handler === 'string') {
            handler = this[handler];
        }
        
        if (typeof handler !== 'function') {
            console.error(`Handler for field '${field}' must be a function`);
            return this;
        }
        
        this._updateHandlers.set(field, handler);
        return this;
    }
    
    unsubscribeAll() {
        if (this._modelSubscriptions.size > 0) {
            console.log(`🧹 Unsubscribing from ${this._modelSubscriptions.size} model(s)`);
            this._modelSubscriptions.forEach((unsubscribe) => unsubscribe());
            this._modelSubscriptions.clear();
        }
        this._updateHandlers.clear();
    }
    
    getBoundModel() {
        return this._boundModel;
    }
}