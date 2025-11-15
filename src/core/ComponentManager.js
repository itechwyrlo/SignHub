export class ComponentManager {
    constructor() {
        this.map = new Map();
    }

    register(id, component) {
        if (id && component) {
            console.log(`📝 Registering component: ${id}`);
            this.map.set(id, component);
        }
    }

    unregister(id) {
        if (this.map.has(id)) {
            console.log(`🗑️ Unregistering component: ${id}`);
            this.map.delete(id);
        }
    }

    getComponent(id) {
        if (id === undefined) {
            console.warn(`⚠️ Cannot find component with undefined id`);
            return undefined;
        }
        
        const comp = this.map.get(id);
        
        if (!comp) {
            console.warn(`⚠️ Component not found: ${id}`);
            return undefined;
        }
        
        // Only set isMobile if component has state property
        if (comp.state && typeof comp.state === 'object') {
            comp.state.isMobile = window.innerWidth < 768;
        }
        
        return comp;
    }

    has(id) {
        return this.map.has(id);
    }

    cleanup() {
        console.log(`🧹 Cleaning up ${this.map.size} components`);
        this.map.forEach((component, id) => {
            if (typeof component.onDestroy === 'function') {
                component.onDestroy();
            }
        });
        this.map.clear();
    }

    getAll() {
        return Array.from(this.map.entries());
    }

    size() {
        return this.map.size;
    }
}

export const componentManager = new ComponentManager();