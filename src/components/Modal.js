import { ComponentBase } from "../core/ComponentBase.js";

/**
 * Modal Component
 * Reusable confirmation dialog for Grid and other components
 */
export class Modal extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();

    this.state = {
      visible: false,
      title: "",
      message: "",
      confirmText: "OK",
      confirmClass: "",
      onConfirm: null
    };
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  onInit() {
    this.render();
    this.setupEvents();
  }

  onDestroy() {
    // Managed listeners auto-cleaned
  }

  // ============================================
  // RENDERING
  // ============================================
  render() {
    this.innerHTML = `
      <div class="modal-overlay ${this.state.visible ? 'show' : ''}">
        <div class="modal-window">
          <div class="modal-header">
            <h2>${this.state.title}</h2>
          </div>
  
          <div class="modal-body">
            <p>${this.state.message}</p>
          </div>
  
          <div class="modal-footer">
            <button class="modal-btn-cancel">Cancel</button>
            <button class="modal-btn-confirm ${this.state.confirmClass}">
              ${this.state.confirmText}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  

  // ============================================
  // EVENTS
  // ============================================
  setupEvents() {
    this.addManagedEventListener(this, "click", (e) => {
      const overlay = this.querySelector(".modal-overlay");

      if (e.target.classList.contains("modal-btn-cancel")) {
        this.hide();
      }

      if (e.target.classList.contains("modal-btn-confirm")) {
        const fn = this.state.onConfirm;
        this.hide();
        if (typeof fn === "function") fn();
      }

      // Click outside window closes modal
      if (e.target === overlay) {
        this.hide();
      }
    });
  }

  // ============================================
  // PUBLIC API
  // ============================================

  showConfirm(config) {
    this.state.title = config.title ?? "Confirm";
    this.state.message = config.message ?? "Are you sure?";
    this.state.confirmText = config.confirmText ?? "OK";
    this.state.confirmClass = config.confirmClass ?? "";
    this.state.onConfirm = config.onConfirm ?? null;
    this.state.visible = true;

    this.render();
  }

  hide() {
    if (!this.state.visible) return;
    this.state.visible = false;
    this.render();
  }

  show() {
    if (this.state.visible) return;
    this.state.visible = true;
    this.render();
  }
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define("x-modal", Modal);
