import { ComponentBase } from "../core/ComponentBase.js";
import { GridEditorManager } from "./manager/GridEditorManager.js";
import { GridSelectionManager } from "./manager/GridSelectionManager.js";
import { GridStoreManager } from "./manager/GridStoreManager.js";
import { GridBodyManager } from "./manager/GridBodyManager.js";
import { GridUndoRedoManager } from "./manager/GridUndoRedoManager.js";
import { toast } from "../utils/toast.js";
/**
 * Grid Component
 * Fully inline editable data grid with persistent state, undo/redo, and responsive design
 * 
 * Features:
 * - Inline editing with multiple editor types (text, number, combo, date, checkbox)
 * - Change tracking and persistence across pagination
 * - Undo/Redo support (Ctrl+Z, Ctrl+Y)
 * - Add/Delete row operations
 * - Selection model with checkboxes
 * - Responsive mobile/desktop layout
 * - Event lifecycle (beforeedit, afteredit, beforecommit, aftercommit)
 */
export class Grid extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();
    
    this.state = {
      loading: false,
      error: null,
      hasChanges: false
    };
    
    this.gridId = null;
    this.columns = [];
    this.data = []; // All data
    this.modalId = null;
    this.modal = null;
    
    // Selection Model
    this.selectionModel = null; // 'checkbox' or null
    this.selectedRows = new Set();
    this.lastSelectedIndex = null;
    
    // Pagination
    this.pageSize = 10;
    this.currentPage = 1;
    this.pagedData = [];
    this.totalItems = 0;
    
    // Managers
    this.editorManager = null;
    this.storeManager = null;
    this.selectionManager = null;
    this.undoRedoManager = null;
    this.bodyManager = null;
    
    // Action handlers
    this.onViewHandler = null;
    this.onDeleteHandler = null;
    this.onSelectionChangeHandler = null;
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  
  onInit() {
    this.initializeComponent();
    this.initializeManagers();
    this.render();
    this.createModal();
    this.setupEvents();
    this.bindData([]);
    
    // Register partial update handlers
    this.registerUpdateHandler('items', this.handleItemsUpdate);
    this.registerUpdateHandler('loading', this.handleLoadingUpdate);
    this.registerUpdateHandler('error', this.handleErrorUpdate);
  }

  onDestroy() {
    // Cleanup managers
    if (this.editorManager) this.editorManager.destroy();
    if (this.storeManager) this.storeManager.destroy();
    if (this.selectionManager) this.selectionManager.destroy();
    if (this.undoRedoManager) this.undoRedoManager.destroy();
    if (this.bodyManager) this.bodyManager.destroy();
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  initializeComponent() {
    this.gridId = this.getAttribute('data-id') || this.generateId();
    this.modalId = `modal-${this.gridId}`;
    
    this.selectionModel = this.getAttribute('data-selection-model') || null;
    
    const pageSizeAttr = this.getAttribute('data-page-size');
    if (pageSizeAttr) this.pageSize = parseInt(pageSizeAttr) || 10;

    // ✅ NEW: Delete mode (soft | hard)
    const deleteMode = this.getAttribute('data-delete')?.toLowerCase();
    this.deleteMode = (deleteMode === 'soft') ? 'soft' : 'hard'; // default to hard if not specified

    this.parseColumnsFromDOM();
}

//   initializeComponent() {
//     this.gridId = this.getAttribute('data-id') || this.generateId();
//     this.modalId = `modal-${this.gridId}`;
    
//     this.selectionModel = this.getAttribute('data-selection-model') || null;
    
//     const pageSizeAttr = this.getAttribute('data-page-size');
//     if (pageSizeAttr) {
//       this.pageSize = parseInt(pageSizeAttr) || 10;
//     }
    
//     this.parseColumnsFromDOM();
//   }

  initializeManagers() {
    // Store Manager - handles data persistence and change tracking
    this.storeManager = new GridStoreManager(this);
    
    // Editor Manager - handles inline editing
    this.editorManager = new GridEditorManager(this, this.storeManager);
    
    // Selection Manager - handles row selection
    this.selectionManager = new GridSelectionManager(this);
    
    // Undo/Redo Manager - handles action history
    this.undoRedoManager = new GridUndoRedoManager(this, this.storeManager);
    
    // Body Manager - handles DOM rendering
    this.bodyManager = new GridBodyManager(this);
  }

  parseColumnsFromDOM() {
    const columnElements = this.querySelectorAll('[data-column]');
    this.columns = Array.from(columnElements).map(col => {
      const column = {
        key: col.getAttribute('data-key') || col.textContent.trim(),
        label: col.getAttribute('data-label') || col.textContent.trim(),
        actionComponent: col.getAttribute('data-action-component') || null,
        editor: col.getAttribute('data-editor') || null,
        readOnly: col.getAttribute('data-read-only') === 'true',
        comboOptions: this.parseComboOptions(col.getAttribute('data-combo-options')),
        
        // Validation attributes
        required: col.getAttribute('data-required') === 'true',
        minLength: parseInt(col.getAttribute('data-min-length')) || null,
        maxLength: parseInt(col.getAttribute('data-max-length')) || null,
        min: parseFloat(col.getAttribute('data-min')) || null,
        max: parseFloat(col.getAttribute('data-max')) || null,
        pattern: col.getAttribute('data-pattern') || null,
        customValidator: col.getAttribute('data-validator') || null
      };
      
      // ✅ Parse new combo-configs format
      const comboConfigsAttr = col.getAttribute('data-combo-configs');
      if (comboConfigsAttr) {
        try {
          column.comboConfigs = JSON.parse(comboConfigsAttr);
        } catch (e) {
          console.warn('Invalid combo-configs JSON:', comboConfigsAttr);
          column.comboConfigs = {};
        }
      }
      
      return column;
    });
  }

//   parseColumnsFromDOM() {
//     const columnElements = this.querySelectorAll('[data-column]');
//     this.columns = Array.from(columnElements).map(col => ({
//       key: col.getAttribute('data-key') || col.textContent.trim(),
//       label: col.getAttribute('data-label') || col.textContent.trim(),
//       actionComponent: col.getAttribute('data-action-component') || null,
//       editor: col.getAttribute('data-editor') || null, // text, number, combo, date, checkbox
//       readOnly: col.getAttribute('data-read-only') === 'true',
//       comboOptions: this.parseComboOptions(col.getAttribute('data-combo-options'))
//     }));
//   }

  parseComboOptions(optionsStr) {
    if (!optionsStr) return null;
    try {
      return JSON.parse(optionsStr);
    } catch (e) {
      console.warn('Invalid combo options JSON:', optionsStr);
      return null;
    }
  }

  generateId() {
    return `editable-grid-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // RENDERING
  // ============================================
  
  render() {
    if (!this.querySelector('.grid-card')) {
      const gridHTML = `
        <div class="grid-card">
          ${this.buildToolbar()}
          <div class="grid-container">
            <table id="${this.gridId}" class="data-grid">
              ${this.buildTableHeader()}
              <tbody class="grid-body"></tbody>
            </table>
            <!-- Mobile view container -->
            <div class="grid-body-mobile"></div>
          </div>
        </div>
      `;
      this.innerHTML = gridHTML;
      this.attachPagingToolbar();
    }
  }

  buildToolbar() {
    return `
      <div class="grid-toolbar">
        <div class="grid-toolbar-left">
          <button class="grid-btn grid-btn-add" title="Add Row">
            <i class="fa-solid fa-plus"></i> Add Row
          </button>
          <button class="grid-btn grid-btn-delete" title="Delete Selected" disabled>
            <i class="fa-solid fa-trash"></i> Delete
          </button>
          <button class="grid-btn grid-btn-save" title="Save Changes" disabled>
            <i class="fa-solid fa-save"></i> Save
          </button>
        </div>
        <div class="grid-toolbar-right">
          <button class="grid-btn grid-btn-undo" title="Undo (Ctrl+Z)" disabled>
          <i class='bx bx-undo-alt'></i> 
          </button>
          <button class="grid-btn grid-btn-redo" title="Redo (Ctrl+Y)" disabled>
          <i class='bx bx-redo-alt'></i> 
          </button>
          <span class="grid-changes-indicator" style="display: none;">
            <i class="fa-solid fa-circle"></i> Unsaved changes
          </span>
        </div>
      </div>
    `;
  }

  buildTableHeader() {
    let headerCells = '';
    
    if (this.selectionModel === 'checkbox') {
      headerCells += `
        <th class="grid-header-cell grid-header-checkbox">
          <input 
            type="checkbox" 
            id="select-all-${this.gridId}" 
            class="grid-select-all"
          />
        </th>
      `;
    }
    
    headerCells += this.columns
      .map(col => `
        <th class="grid-header-cell" data-key="${col.key}">
          ${col.label}
        </th>
      `)
      .join('');
    
    return `
      <thead class="grid-header">
        <tr class="grid-header-row">${headerCells}</tr>
      </thead>
    `;
  }

  attachPagingToolbar() {
    let pagingEl = this.querySelector('x-paging');
    
    if (!pagingEl) {
      pagingEl = document.createElement('x-paging');
      this.insertAdjacentElement('afterend', pagingEl);
    }
  }

  createModal() {
    const modalHTML = `<x-modal data-id="${this.modalId}"></x-modal>`;
    const gridCard = this.querySelector('.grid-card');
    if (gridCard) {
      gridCard.insertAdjacentHTML('afterend', modalHTML);
    }
    this.modal = this.querySelector('x-modal');
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  setupEvents() {
    this.setupToolbarEvents();
    this.setupKeyboardEvents();
  }

  setupToolbarEvents() {
    const addBtn = this.querySelector('.grid-btn-add');
    const deleteBtn = this.querySelector('.grid-btn-delete');
    const saveBtn = this.querySelector('.grid-btn-save');
    const undoBtn = this.querySelector('.grid-btn-undo');
    const redoBtn = this.querySelector('.grid-btn-redo');

    if (addBtn) this.addManagedEventListener(addBtn, 'click', this.handleAddRow);
    if (deleteBtn) this.addManagedEventListener(deleteBtn, 'click', this.handleDeleteRows);
    if (saveBtn) this.addManagedEventListener(saveBtn, 'click', this.handleSave);
    if (undoBtn) this.addManagedEventListener(undoBtn, 'click', () => this.undo());
    if (redoBtn) this.addManagedEventListener(redoBtn, 'click', () => this.redo());
  }

  setupKeyboardEvents() {
    this.addManagedEventListener(document, 'keydown', this.handleKeydown);
  }

  handleKeydown = (e) => {
    // Ctrl+Z - Undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }
    
    // Ctrl+Y or Ctrl+Shift+Z - Redo
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      this.redo();
    }

    // Enter - Start edit on focused cell
    if (e.key === 'Enter' && !this.editorManager.isEditing) {
      const focusedCell = document.activeElement.closest('.grid-cell');
      if (focusedCell) {
        e.preventDefault();
        const rowIndex = parseInt(focusedCell.closest('.grid-row').dataset.rowIndex);
        const colKey = focusedCell.dataset.key;
        this.editorManager.startEdit(rowIndex, colKey);
      }
    }
  }

  handleAddRow = () => {
    const newRow = this.storeManager.addNewRow();
    const model = this.getBoundModel();
    model.create(newRow);
    this.undoRedoManager.recordAction('add', { rowIndex: this.data.length - 1, row: newRow });
    this.refresh();
    this.updateToolbarState();
    
    // Automatically enter edit mode for first editable cell
    setTimeout(() => {
      const firstEditableCol = this.columns.find(col => col.editor && !col.readOnly);
      if (firstEditableCol) {
        this.editorManager.startEdit(this.data.length - 1, firstEditableCol.key);
      }
    }, 100);
  }

  handleDeleteRows = () => {
    const selectedIndices = Array.from(this.selectedRows);
    if (selectedIndices.length === 0) return;

    this.openDeleteModal(selectedIndices);
  }

  handleSave = async () => {
    const beforeCommitEvent = this.fireEvent('beforecommit', {
      changes: this.storeManager.getChanges()
    });

    if (beforeCommitEvent.defaultPrevented) return;

    try {
      this.updateLoadingState(true);
      
      // Get bound model and call save
      const model = this.getBoundModel();
      if (model && typeof model.save === 'function') {
        await model.save();
        
        // Clear changes after successful save
        this.storeManager.clearChanges();
        this.undoRedoManager.clear();
        this.updateToolbarState();
        
        this.fireEvent('aftercommit', { success: true });
        
        this.showSuccessMessage('Changes saved successfully');
      } else {
        throw new Error('No bound model with save method');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.fireEvent('aftercommit', { success: false, error: error.message });
      this.showErrorMessage('Failed to save changes: ' + error.message);
    } finally {
      this.updateLoadingState(false);
    }
  }

  // ============================================
  // DATA BINDING
  // ============================================

  bindData(dataArray = []) {
    this.data = dataArray;
    
    const model = this.getBoundModel();
    if (model && typeof model.getTotalCount === 'function') {
      this.totalItems = model.getTotalCount();
    } else {
      this.totalItems = dataArray.length;
    }
    
    // ✅ ADD THIS LINE - Reapply pending changes after data reload
    this.reapplyPendingChanges();
    
    this.updatePagedData();
    this.bodyManager.render(this.pagedData);
    
    this.selectedRows.clear();
    this.lastSelectedIndex = null;
    
    if (this.selectionManager) {
      this.selectionManager.updateSelectAllCheckbox();
    }
    
    this.emit('data-loaded', {
      totalItems: this.totalItems,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    });
  }

  /**
   * Reapply pending changes after data reload
   * This preserves edits when navigating away and back
   */
  reapplyPendingChanges() {
    if (!this.storeManager) return;
    
    // Reapply modified cells
    const modifiedCells = this.storeManager._modifiedCells;
    if (modifiedCells && modifiedCells.size > 0) {
      console.log('🔄 Reapplying', modifiedCells.size, 'modified cells');
      
      modifiedCells.forEach((change, key) => {
        const { rowIndex, colKey, newValue } = change;
        
        if (this.data[rowIndex]) {
          this.data[rowIndex][colKey] = newValue;
          this.data[rowIndex]._modified = true;
        }
      });
    }
    
    // Mark deleted rows
    const deletedRows = this.storeManager._deletedRows;
    if (deletedRows && deletedRows.size > 0) {
      console.log('🔄 Reapplying', deletedRows.size, 'deleted rows');
      
      deletedRows.forEach((rowData, rowIndex) => {
        if (this.data[rowIndex]) {
          this.data[rowIndex]._deleted = true;
        }
      });
    }
    
    // Mark new rows
    const addedRows = this.storeManager._addedRows;
    if (addedRows && addedRows.size > 0) {
      console.log('🔄 Preserving', addedRows.size, 'added rows');
      
      addedRows.forEach(rowIndex => {
        if (this.data[rowIndex]) {
          this.data[rowIndex]._isNew = true;
        }
      });
    }
  }

  updatePagedData() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedData = this.data.slice(startIndex, endIndex);
  }

  refresh(dataArray = null) {
    if (dataArray) this.data = dataArray;
  
    this.bindData(this.data);
  
    // 🔥 THIS IS THE MISSING STEP
    this.bodyManager.render(this.data);
  
    return this;
  }
  

//   refresh(dataArray = null) {
//     if (dataArray) this.data = dataArray;
//     this.bindData(this.data);
//     return this;
//   }

  // ============================================
  // PAGINATION
  // ============================================

  goToPage(page) {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (page < 1 || page > totalPages) {
      console.warn(`Invalid page: ${page}`);
      return false;
    }
    
    this.currentPage = page;
    this.updatePagedData();
    this.bodyManager.render(this.pagedData);
    
    this.emit('page-changed', {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalPages: totalPages
    });
    
    return true;
  }

  setPageSize(pageSize) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.updatePagedData();
    this.bindData(this.data);
    return this;
  }

  // ============================================
  // UNDO/REDO
  // ============================================

  undo() {
    if (this.undoRedoManager.canUndo()) {
      this.undoRedoManager.undo();
      this.refresh();
      this.updateToolbarState();
    }
  }

  redo() {
    if (this.undoRedoManager.canRedo()) {
      this.undoRedoManager.redo();
      this.refresh();
      this.updateToolbarState();
    }
  }

  // ============================================
  // UI UPDATES
  // ============================================

  updateToolbarState() {
    const hasChanges = this.storeManager.hasChanges();
    const hasSelection = this.selectedRows.size > 0;
    const canUndo = this.undoRedoManager.canUndo();
    const canRedo = this.undoRedoManager.canRedo();

    const saveBtn = this.querySelector('.grid-btn-save');
    const deleteBtn = this.querySelector('.grid-btn-delete');
    const undoBtn = this.querySelector('.grid-btn-undo');
    const redoBtn = this.querySelector('.grid-btn-redo');
    const changesIndicator = this.querySelector('.grid-changes-indicator');

    if (saveBtn) saveBtn.disabled = !hasChanges;
    if (deleteBtn) deleteBtn.disabled = !hasSelection;
    if (undoBtn) undoBtn.disabled = !canUndo;
    if (redoBtn) redoBtn.disabled = !canRedo;
    if (changesIndicator) {
      changesIndicator.style.display = hasChanges ? 'flex' : 'none';
    }

    this.state.hasChanges = hasChanges;
  }

  updateLoadingState(isLoading) {
    this.state.loading = isLoading;
    
    const toolbar = this.querySelector('.grid-toolbar');
    if (toolbar) {
      if (isLoading) {
        toolbar.classList.add('loading');
      } else {
        toolbar.classList.remove('loading');
      }
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  openDeleteModal(rowIndices) {
    if (!this.modal) return;

    const count = rowIndices.length;
    const itemLabel = count === 1 ? 'row' : 'rows';

    this.modal.showConfirm({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete ${count} ${itemLabel}?`,
        type: 'danger',
        confirmText: 'Delete',
        confirmClass: 'btn-danger',
        onConfirm: () => {
            const model = this.getBoundModel();
            const deletedKeys = [];

            // Delete from end to start to avoid index shifting
            rowIndices.sort((a, b) => b - a);

            rowIndices.forEach(index => {
                const row = this.data[index];
                if (!row) return;
            
                const key = row[model.idProperty];
                deletedKeys.push(key);
            
                // Soft delete: mark for deletion
                if (this.deleteMode === 'soft') {
                    row._state = 'destroy';
                    model.pendingChanges.set(key, 'destroy');
                    this.storeManager.deleteRow(index);
                } else {
                    // Hard delete: visually remove from grid only
                    const tr = this.querySelector(`.grid-row[data-row-index="${index}"]`);
                    if (tr) tr.remove();
                    model.pendingChanges.set(key, 'destroy');
                    this.storeManager.deleteRow(index);
                }
            
                // Record undo/redo
                this.undoRedoManager.recordAction('delete', { rowIndex: index, row });
            });
            

            this.selectedRows.clear();
            this.refresh();
            this.updateToolbarState();

            // Emit events
            this.emit('delete-confirmed', { deletedIndices: rowIndices, deletedKeys });
            this.dispatchEvent(new CustomEvent('delete-rows', {
                detail: { deletedKeys },
                bubbles: true,
                composed: true
            }));

            toast.info(`${count} ${itemLabel} ${this.deleteMode === 'soft' ? 'marked for deletion' : 'deleted'}`);
        }
    });
}

//   openDeleteModal(rowIndices) {
//     if (!this.modal) return;

//     const count = rowIndices.length;
//     const itemLabel = count === 1 ? 'row' : 'rows';

//     this.modal.showConfirm({
//         title: 'Confirm Delete',
//         message: `Are you sure you want to delete ${count} ${itemLabel}?`,
//         type: 'danger',
//         confirmText: 'Delete',
//         confirmClass: 'btn-danger',
//         onConfirm: () => {
//             const model = this.getBoundModel();
//             const deletedKeys = [];

//             // Delete from end to start to avoid index shifting
//             rowIndices.sort((a, b) => b - a);

//             rowIndices.forEach(index => {
//                 const row = this.data[index];
//                 if (!row) return;

//                 // 1️⃣ Get the actual primary key
//                 const key = row[model.idProperty];
//                 deletedKeys.push(key);

//                 // 2️⃣ Mark as destroyed for persistence
//                 row._state = 'destroy';
//                 model.pendingChanges.set(key, 'destroy');

//                 // 3️⃣ Remove row from store/DOM immediately
//                 this.storeManager.deleteRow(index);

//                 // 4️⃣ Record undo/redo
//                 this.undoRedoManager.recordAction('delete', { rowIndex: index, row });
//             });

//             // 5️⃣ Clear selection and refresh UI
//             this.selectedRows.clear();
//             this.refresh();
//             this.updateToolbarState();

//             // 6️⃣ Emit events for external listeners
//             this.emit('delete-confirmed', { deletedIndices: rowIndices, deletedKeys });
//             const deleteEvent = new CustomEvent('delete-rows', {
//                 detail: { deletedKeys },
//                 bubbles: true,
//                 composed: true
//             });
//             this.dispatchEvent(deleteEvent);

//             // 7️⃣ Optional: show toast
//             toast.info(`${count} ${itemLabel} marked for deletion`);
//         }
//     });
// }




  showSuccessMessage(message) {
    // Implement success notification
    console.log('✅', message);
  }

  showErrorMessage(message) {
    // Implement error notification
    console.error('❌', message);
  }

  fireEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    });
    this.dispatchEvent(event);
    return event;
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
    return this;
  }

  // ============================================
  // MODEL UPDATE HANDLERS
  // ============================================

  handleItemsUpdate = (items, state, previous) => {
    console.log('🔄 Grid: items changed');
    
    // ✅ Preserve total count from model before binding
    const model = this.getBoundModel();
    if (model && typeof model.getTotalCount === 'function') {
      const totalFromModel = model.getTotalCount();
      console.log('📊 Total count from model:', totalFromModel);
    }
    
    this.bindData(items);
  }

  handleLoadingUpdate = (isLoading, state, previous) => {
    console.log('🔄 Grid: loading state:', isLoading);
    this.state.loading = isLoading;
  }

  handleErrorUpdate = (error, state, previous) => {
    console.log('🔄 Grid: error state:', error);
    this.state.error = error;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getModifiedRecords() {
    return this.storeManager.getModifiedRecords();
  }

  getAddedRecords() {
    return this.storeManager.getAddedRecords();
  }

  getDeletedRecords() {
    return this.storeManager.getDeletedRecords();
  }

  hasChanges() {
    return this.storeManager.hasChanges();
  }

  getSelection() {
    return this.selectionManager.getSelection();
  }

  getData() {
    return this.data;
  }

  loadData(dataArray) {
    this.bindData(dataArray);
    return this;
  }
}

// Register custom element
customElements.define('x-grid', Grid);