export class Observable {
    constructor() {
      this._observers = new Set();
      this._state = {};
    }
  
    subscribe(observer) {
      if (typeof observer !== 'function') {
        console.error('Observer must be a function');
        return () => {};
      }
      this._observers.add(observer);
      return () => this.unsubscribe(observer);
    }
  
    unsubscribe(observer) {
      this._observers.delete(observer);
    }
  
    notify(data) {
      this._observers.forEach(observer => {
        try {
          observer(data);
        } catch (error) {
          console.error('Error in observer:', error);
        }
      });
    }
  
    getState() {
      return { ...this._state };
    }
  
    setState(newState) {
      const oldState = { ...this._state };
      this._state = { ...this._state, ...newState };
      
      this.notify({
        state: this.getState(),
        changed: newState,
        previous: oldState
      });
    }
  
    clearObservers() {
      this._observers.clear();
    }
  }