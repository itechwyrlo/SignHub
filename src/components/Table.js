
import { ComponentBase } from "../core/ComponentBase.js";

/**
 * Enhanced Table Component
 * Responsive data table with selection model, mobile card view, actions, and modal integration
 * Supports partial updates via model binding and checkbox selection
 */
export class Table extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();
    
    this.state = {
      loading: false,
      error: null,
    };
    
    this.tableId = null;
    this.columns = [];
    this.data = []; // All data
    this.modalId = null;
    this.modal = null;
    
    // ✅ Selection Model
    this.selectionModel = null; // 'checkbox' or null
    this.selectedRows = new Set(); // Track selected row indices
    this.lastSelectedIndex = null;
    
    // ✅ Pagination
    this.pageSize = 10;
    this.currentPage = 1;
    this.pagedData = []; // Current page data
    this.totalItems = 0;
    
    // Action handlers - can be overridden by controller
    this.onViewHandler = null;
    this.onDeleteHandler = null;
    this.onSelectionChangeHandler = null;
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
    this.createModal();
    this.setupEvents();
    this.bindData([]);
    
    // Register partial update handlers
    this.registerUpdateHandler('items', this.handleItemsUpdate);
    this.registerUpdateHandler('loading', this.handleLoadingUpdate);
    this.registerUpdateHandler('error', this.handleErrorUpdate);
  }

  /**
   * Called when component is removed from DOM
   */
  onDestroy() {
    // Managed event listeners are auto-cleaned by ComponentBase
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize component properties
   */
  initializeComponent() {
    this.tableId = this.getAttribute('data-id') || this.generateId();
    this.modalId = `modal-${this.tableId}`;
    
    // ✅ Parse selection model
    this.selectionModel = this.getAttribute('data-selection-model') || null;
    
    // ✅ Parse page size
    const pageSizeAttr = this.getAttribute('data-page-size');
    if (pageSizeAttr) {
      this.pageSize = parseInt(pageSizeAttr) || 10;
    }
    
    // Parse columns from DOM
    this.parseColumnsFromDOM();
  }

  /**
   * Parse column configuration from DOM
   */
  parseColumnsFromDOM() {
    const columnElements = this.querySelectorAll('[data-column]');
    this.columns = Array.from(columnElements).map(col => ({
      key: col.getAttribute('data-key') || col.textContent.trim(),
      label: col.getAttribute('data-label') || col.textContent.trim(),
      actionComponent: col.getAttribute('data-action-component') || null
    }));
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `table-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // RENDERING & BUILDERS
  // ============================================
  
  /**
   * Main render method
   */
  render() {
    // Only create the table skeleton once
    if (!this.querySelector('.table-card')) {
      const tableHTML = `
        <div class="table-card">
          <table id="${this.tableId}" class="table table-hover mb-0">
            ${this.buildTableHeader()}
            <tbody></tbody>
          </table>
        </div>
      `;
      this.innerHTML = tableHTML;
  
      this.attachPagingToolbar();
    }
  }
  
  // render() {
  //   const tableHTML = `
  //     <div class="table-card">
  //       <table id="${this.tableId}" class="table table-hover mb-0">
  //         ${this.buildTableHeader()}
  //         ${this.buildTableBody()}
  //       </table>
  //     </div>
     
  //   `;
  
  //   this.innerHTML = tableHTML;
  //   this.attachPagingToolbar()
  // }
  

  /**
   * ✅ Build table header with optional checkbox column
   */
  buildTableHeader() {
    let headerCells = '';
    
    // Add checkbox column if selection model is checkbox
    if (this.selectionModel === 'checkbox') {
      headerCells += `
        <th style="width: 50px; text-align: center;">
          <input 
            type="checkbox" 
            id="select-all-${this.tableId}" 
            class="table-select-all"
          />
        </th>
      `;
    }
    
    // Add regular columns
    headerCells += this.columns
      .map(col => `<th>${col.label}</th>`)
      .join('');
    
    return `
      <thead>
        <tr>${headerCells}</tr>
      </thead>
    `;
  }

  /**
   * Build table body (initially empty)
   */
  buildTableBody() {
    return `<tbody></tbody>`;
  }

  /**
   * Build empty state row
   */
  buildEmptyRow() {
    const colSpan = this.selectionModel === 'checkbox' 
      ? this.columns.length + 1 
      : this.columns.length;
      
    return `
      <tr>
        <td colspan="${colSpan}" style="padding: 0;">
          <div class="table-empty">
            <i class="fa-solid fa-inbox"></i>
            <p>No data found.</p>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Build data rows
   */
  buildDataRows(dataArray) {
    return dataArray
      .map((row, index) => this.buildDataRow(row, index))
      .join('');
  }

  /**
   * ✅ Build single data row with optional checkbox
   */
  buildDataRow(rowData, rowIndex) {
    let cells = '';
    
    // Add checkbox cell if selection model is checkbox
    if (this.selectionModel === 'checkbox') {
      const isChecked = this.selectedRows.has(rowIndex);
      cells += `
        <td style="text-align: center;">
          <input 
            type="checkbox" 
            class="table-row-checkbox" 
            data-row-index="${rowIndex}"
            ${isChecked ? 'checked' : ''}
          />
        </td>
      `;
    }
    
    // Add regular cells
    cells += this.columns
      .map(col => this.buildCell(col, rowData, rowIndex))
      .join('');
    
    return `<tr>${cells}</tr>`;
  }

  /**
   * Build individual cell
   */
  buildCell(col, rowData, rowIndex) {
    // Handle action buttons
    if (col.actionComponent === 'buttons') {
      return this.buildActionCell(rowIndex);
    }
    
    const value = rowData[col.key];
    
    // Handle status column
    if (col.key.toLowerCase().includes('status')) {
      return this.buildStatusCell(value);
    }
    
    // Handle date columns
    if (col.key.toLowerCase().includes('date')) {
      return this.buildDateCell(value);
    }
    
    // Default cell
    return this.buildDefaultCell(value);
  }

  /**
   * Build action buttons cell
   */
  buildActionCell(rowIndex) {
    return `
      <td>
        <div class="table-action-buttons">
          <button class="table-action-btn btn-view" data-action="view" data-row-index="${rowIndex}">
            <i class="fa-solid fa-eye"></i> View
          </button>
          <button class="table-action-btn btn-delete" data-action="delete" data-row-index="${rowIndex}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `;
  }

  /**
   * Build status badge cell
   */
  buildStatusCell(value) {
    return `
      <td>
        <span class="status-badge ${this.getStatusClass(value)}">
          ${value || ''}
        </span>
      </td>
    `;
  }

  /**
   * Build date cell
   */
  buildDateCell(value) {
    return `<td>${this.formatDate(value)}</td>`;
  }

  /**
   * Build default text cell
   */
  buildDefaultCell(value) {
    const displayValue = value !== undefined && value !== null ? value : '';
    return `<td>${displayValue}</td>`;
  }

  /**
   * Create modal component
   */
  createModal() {
    const modalHTML = `<x-modal data-id="${this.modalId}"></x-modal>`;
    
    const tableCard = this.querySelector('.table-card');
    if (tableCard) {
      tableCard.insertAdjacentHTML('afterend', modalHTML);
    }

    this.modal = this.querySelector('x-modal');
  }

  // ============================================
  // MOBILE CARD BUILDERS
  // ============================================

  /**
   * Build mobile cards container
   */
  buildMobileCards(dataArray) {
    let mobileContainer = this.querySelector('.mobile-cards-container');
    if (mobileContainer) {
      mobileContainer.remove();
    }

    mobileContainer = document.createElement('div');
    mobileContainer.className = 'mobile-cards-container';

    if (dataArray.length === 0) {
      mobileContainer.innerHTML = this.buildMobileEmptyState();
    } else {
      mobileContainer.innerHTML = dataArray
        .map((row, index) => this.buildMobileCard(row, index))
        .join('');
    }

    const tableCard = this.querySelector('.table-card');
    if (tableCard) {
      tableCard.appendChild(mobileContainer);
    }
  }

  /**
   * Build mobile empty state
   */
  buildMobileEmptyState() {
    return `
      <div class="table-empty">
        <i class="fa-solid fa-inbox"></i>
        <p>No data found.</p>
      </div>
    `;
  }

  /**
   * ✅ Build single mobile card with optional checkbox
   */
  buildMobileCard(rowData, rowIndex) {
    const isChecked = this.selectedRows.has(rowIndex);
    
    return `
      <div class="mobile-card">
        ${this.selectionModel === 'checkbox' ? `
          <div class="mobile-card-checkbox">
            <input 
              type="checkbox" 
              class="table-row-checkbox" 
              data-row-index="${rowIndex}"
              ${isChecked ? 'checked' : ''}
            />
          </div>
        ` : ''}
        ${this.buildMobileCardHeader(rowData)}
        ${this.buildMobileCardBody(rowData)}
        ${this.buildMobileCardActions(rowIndex)}
      </div>
    `;
  }

  /**
   * Build mobile card header
   */
  buildMobileCardHeader(rowData) {
    const titleColumn = this.columns.find(col => !col.actionComponent);
    const titleValue = titleColumn ? rowData[titleColumn.key] : 'Item';
    
    const idColumn = this.columns.find(col => 
      col.key.toLowerCase().includes('id') && !col.actionComponent
    );
    const idValue = idColumn ? rowData[idColumn.key] : '';

    return `
      <div class="mobile-card-header">
        <div>
          <h3 class="mobile-card-title">${titleValue || 'Item'}</h3>
          ${idValue ? `<div class="mobile-card-id">#${idValue}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Build mobile card body
   */
  buildMobileCardBody(rowData) {
    const titleColumn = this.columns.find(col => !col.actionComponent);
    const bodyColumns = this.columns.filter(col => 
      !col.actionComponent && col !== titleColumn
    );

    const rows = bodyColumns
      .map(col => this.buildMobileCardRow(col, rowData))
      .filter(row => row !== '')
      .join('');

    return `
      <div class="mobile-card-body">
        ${rows}
      </div>
    `;
  }

  /**
   * Build mobile card row
   */
  buildMobileCardRow(col, rowData) {
    const value = rowData[col.key];
    
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (col.key.toLowerCase().includes('status')) {
      return `
        <div class="mobile-card-row">
          <span class="mobile-card-label">${col.label}</span>
          <span class="mobile-card-value">
            <span class="status-badge ${this.getStatusClass(value)}">${value}</span>
          </span>
        </div>
      `;
    }

    if (col.key.toLowerCase().includes('date')) {
      return `
        <div class="mobile-card-row">
          <span class="mobile-card-label">${col.label}</span>
          <span class="mobile-card-value">${this.formatDate(value)}</span>
        </div>
      `;
    }

    return `
      <div class="mobile-card-row">
        <span class="mobile-card-label">${col.label}</span>
        <span class="mobile-card-value">${value}</span>
      </div>
    `;
  }

  /**
   * Build mobile card actions
   */
  buildMobileCardActions(rowIndex) {
    return `
      <div class="mobile-card-actions">
        <button class="table-action-btn btn-view" data-action="view" data-row-index="${rowIndex}">
          <i class="fa-solid fa-eye"></i> View
        </button>
        <button class="table-action-btn btn-delete" data-action="delete" data-row-index="${rowIndex}">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    `;
  }

  /**
 * ✅ Build pagination toolbar
 */
  attachPagingToolbar() {
    let pagingEl = this.querySelector('x-paging');
  
    if (!pagingEl) {
      pagingEl = document.createElement('x-paging');
      // pagingEl.setAttribute('data-owner-id', this.tableId); // optional reference
      this.insertAdjacentElement('afterEnd',pagingEl);
    }
  
  
    // this.pagingToolbar = pagingEl; // store reference if needed
  }
  
  


  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   */
  setupEvents() {
    // Events will be attached after data is bound
  }

  /**
   * ✅ Attach action button and checkbox events
   */
  attachActionEvents() {
    // Action buttons
    this.querySelectorAll('button[data-action]').forEach(btn => {
      this.addManagedEventListener(btn, 'click', this.handleActionClick);
    });

    // ✅ Selection model checkboxes
    if (this.selectionModel === 'checkbox') {
      // Select all checkbox
      const selectAllCheckbox = this.querySelector('.table-select-all');
      if (selectAllCheckbox) {
        this.addManagedEventListener(selectAllCheckbox, 'change', this.handleSelectAll);
      }

      // Row checkboxes
      this.querySelectorAll('.table-row-checkbox').forEach(chk => {
        this.addManagedEventListener(chk, 'change', this.handleRowCheckboxChange);
      });
    }
  }

  /**
   * Handle action button clicks
   */
  handleActionClick = async (e) => {
    const action = e.currentTarget.getAttribute('data-action');
    const rowIndex = parseInt(e.currentTarget.getAttribute('data-row-index'));
    const rowData = this.data[rowIndex];

    if (action === 'view') {
      if (this.onViewHandler) {
        await this.onViewHandler(rowData, rowIndex);
      } else {
        this.openViewModal('Details', rowData);
      }
    } else if (action === 'delete') {
      if (this.onDeleteHandler) {
        await this.onDeleteHandler(rowData, rowIndex);
      } else {
        this.openDeleteModal(rowData, rowIndex);
      }
    }

    this.emit('table-action', { action, rowIndex, rowData });
  }

  /**
   * ✅ Handle select all checkbox
   */
  handleSelectAll = (e) => {
    const isChecked = e.currentTarget.checked;
    
    if (isChecked) {
      // Select all rows
      this.data.forEach((_, index) => {
        this.selectedRows.add(index);
      });
    } else {
      // Deselect all rows
      this.selectedRows.clear();
    }

    // Update all checkboxes
    this.querySelectorAll('.table-row-checkbox').forEach(chk => {
      chk.checked = isChecked;
    });

    this.lastSelectedIndex = null;
    
    // Emit selection change event
    this.emitSelectionChange();
  }

  /**
   * ✅ Handle individual row checkbox change
   */
  handleRowCheckboxChange = (e) => {
    const rowIndex = parseInt(e.currentTarget.getAttribute('data-row-index'));
    const isChecked = e.currentTarget.checked;

    if (isChecked) {
      this.selectedRows.add(rowIndex);
      this.lastSelectedIndex = rowIndex;
    } else {
      this.selectedRows.delete(rowIndex);
      if (this.lastSelectedIndex === rowIndex) {
        this.lastSelectedIndex = null;
      }
    }

    // Update select-all checkbox state
    this.updateSelectAllCheckbox();

    // Emit selection change event
    this.emitSelectionChange();
  }

  /**
   * ✅ Update select-all checkbox based on row selections
   */
  updateSelectAllCheckbox() {
    const selectAllCheckbox = this.querySelector('.table-select-all');
    if (!selectAllCheckbox) return;

    if (this.data.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (this.selectedRows.size === this.data.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else if (this.selectedRows.size > 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
  }

  /**
   * ✅ Emit selection change event
   */
  emitSelectionChange() {
    const selectedRecords = this.getSelection();
    
    this.emit('selection-change', {
      selectedRows: Array.from(this.selectedRows),
      selectedRecords: selectedRecords,
      count: this.selectedRows.size
    });

    // Call custom handler if provided
    if (this.onSelectionChangeHandler) {
      this.onSelectionChangeHandler(selectedRecords, Array.from(this.selectedRows));
    }
  }

  // ============================================
  // DATA BINDING
  // ============================================

  /**
   * Bind data to table and mobile cards
   */
  bindData(dataArray = []) {
    this.data = dataArray;
    this.totalItems = dataArray.length;
    
    // Calculate paged data
    this.updatePagedData();
    
   

    const tbody = this.querySelector('tbody');
    if (tbody) {
      if (this.pagedData.length === 0) {
        tbody.innerHTML = this.buildEmptyRow();
      } else {
        tbody.innerHTML = this.buildDataRows(this.pagedData);
        this.attachActionEvents();
      }
    }

    // Clear selections when data changes
    this.selectedRows.clear();
    this.lastSelectedIndex = null;


    // Update select-all checkbox
    if (this.selectionModel === 'checkbox') {
      this.updateSelectAllCheckbox();
    }

    // Update mobile cards
    this.buildMobileCards(this.pagedData);
    
    // Emit data-loaded event for paging component
    this.emit('data-loaded', {
      totalItems: this.totalItems,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    });
  }
  
  /**
   * ✅ Update paged data based on current page
   */
  updatePagedData() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedData = this.data.slice(startIndex, endIndex);
  }
  
  /**
   * ✅ Go to specific page
   */
  goToPage(page) {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (page < 1 || page > totalPages) {
      console.warn(`Invalid page: ${page}`);
      return false;
    }
    
    this.currentPage = page;
    this.updatePagedData();
    
    // Re-render table
    const tbody = this.querySelector('tbody');
    if (tbody) {
      if (this.pagedData.length === 0) {
        tbody.innerHTML = this.buildEmptyRow();
      } else {
        tbody.innerHTML = this.buildDataRows(this.pagedData);
        this.attachActionEvents();
      }
    }
    
    // Update mobile cards
    this.buildMobileCards(this.pagedData);
    
    // Emit page-changed event
    this.emit('page-changed', {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalPages: totalPages
    });
    
    return true;
  }
  
  /**
   * ✅ Set page size
   */
  setPageSize(pageSize) {
    this.pageSize = pageSize;
    this.currentPage = 1; // Reset to first page
    this.updatePagedData();
    
    // Re-render table
    this.bindData(this.data);
    
    return this;
  }
  
  /**
   * ✅ Get current page
   */
  getCurrentPage() {
    return this.currentPage;
  }
  
  /**
   * ✅ Get page size
   */
  getPageSize() {
    return this.pageSize;
  }
  
  /**
   * ✅ Get total pages
   */
  getTotalPages() {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  // ============================================
  // SELECTION MODEL API
  // ============================================

  /**
   * ✅ Get all selected records
   * @returns {Array} Array of selected row data
   */
  getSelection() {
    return Array.from(this.selectedRows)
      .map(index => this.data[index])
      .filter(row => row !== undefined);
  }

  /**
   * ✅ Get last selected record
   * @returns {Object|null} Last selected row data or null
   */
  getLastSelected() {
    if (this.lastSelectedIndex !== null && this.data[this.lastSelectedIndex]) {
      return this.data[this.lastSelectedIndex];
    }
    return null;
  }

  /**
   * ✅ Check if there are any selected records
   * @returns {boolean}
   */
  hasSelection() {
    return this.selectedRows.size > 0;
  }

  /**
   * ✅ Select specific row(s) programmatically
   * @param {number|Array<number>} indices - Row index or array of indices
   */
  select(indices) {
    const indexArray = Array.isArray(indices) ? indices : [indices];
    
    indexArray.forEach(index => {
      if (index >= 0 && index < this.data.length) {
        this.selectedRows.add(index);
        this.lastSelectedIndex = index;
      }
    });

    // Update UI
    this.updateCheckboxes();
    this.emitSelectionChange();
    
    return this;
  }

  /**
   * ✅ Deselect specific row(s) programmatically
   * @param {number|Array<number>} indices - Row index or array of indices
   */
  deselect(indices) {
    const indexArray = Array.isArray(indices) ? indices : [indices];
    
    indexArray.forEach(index => {
      this.selectedRows.delete(index);
      if (this.lastSelectedIndex === index) {
        this.lastSelectedIndex = null;
      }
    });

    // Update UI
    this.updateCheckboxes();
    this.emitSelectionChange();
    
    return this;
  }

  /**
   * ✅ Select all rows
   */
  selectAll() {
    this.data.forEach((_, index) => {
      this.selectedRows.add(index);
    });

    this.updateCheckboxes();
    this.emitSelectionChange();
    
    return this;
  }

  /**
   * ✅ Deselect all rows
   */
  deselectAll() {
    this.selectedRows.clear();
    this.lastSelectedIndex = null;

    this.updateCheckboxes();
    this.emitSelectionChange();
    
    return this;
  }

  /**
   * ✅ Update all checkbox states
   */
  updateCheckboxes() {
    this.querySelectorAll('.table-row-checkbox').forEach(chk => {
      const rowIndex = parseInt(chk.getAttribute('data-row-index'));
      chk.checked = this.selectedRows.has(rowIndex);
    });

    this.updateSelectAllCheckbox();
  }

  /**
   * ✅ Register selection change handler
   */
  onSelectionChange(handler) {
    if (typeof handler === 'function') {
      this.onSelectionChangeHandler = handler;
    } else {
      console.error('onSelectionChange requires a function');
    }
    return this;
  }

  // ============================================
  // MODEL UPDATE HANDLERS
  // ============================================

  /**
   * Handle items update from model
   */
  handleItemsUpdate = (items, state, previous) => {
    console.log('🔄 Partial update: items changed');
    this.bindData(items);
  }

  /**
   * Handle loading state update
   */
  handleLoadingUpdate = (isLoading, state, previous) => {
    console.log('🔄 Loading state:', isLoading);
    this.state.loading = isLoading;
  }

  /**
   * Handle error state update
   */
  handleErrorUpdate = (error, state, previous) => {
    console.log('🔄 Error state:', error);
    this.state.error = error;
  }

  // ============================================
  // MODAL HELPER METHODS
  // ============================================

  /**
   * Open view modal
   */
  openViewModal(title, data) {
    if (!this.modal) return this;
    this.modal.showView(title, data);
    return this;
  }

  /**
   * Open delete confirmation modal
   */
  openDeleteModal(rowData, rowIndex) {
    if (!this.modal) return this;

    const labelColumn = this.columns.find(col => 
      !col.actionComponent && 
      !col.key.toLowerCase().includes('id')
    );
    const itemLabel = labelColumn ? rowData[labelColumn.key] : 'Item';

    const idColumn = this.columns.find(col => 
      col.key.toLowerCase().includes('id') && 
      !col.actionComponent
    );
    const itemValue = idColumn ? rowData[idColumn.key] : '';

    this.modal.showConfirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this item?',
      itemLabel: itemLabel || 'Item',
      itemValue: itemValue || '',
      type: 'danger',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        this.removeRow(rowIndex);
        
        this.emit('delete-confirmed', {
          row: rowData,
          rowIndex
        });
      }
    });

    return this;
  }

  /**
   * Open loading modal
   */
  openLoadingModal(title = 'Loading', message = 'Please wait...') {
    if (!this.modal) return this;
    this.modal.showLoading(title, message);
    return this;
  }

  /**
   * Open custom modal
   */
  openModal(options = {}) {
    if (!this.modal) return this;
    this.modal.open(options);
    return this;
  }

  /**
   * Close modal
   */
  closeModal() {
    if (!this.modal) return this;
    this.modal.close();
    return this;
  }

  /**
   * Get modal instance
   */
  getModal() {
    return this;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowOnly - dateOnly;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Get CSS class for status badge
   */
  getStatusClass(status) {
    if (!status) return 'status-voided';
    
    const statusLower = String(status).toLowerCase();
    
    switch (statusLower) {
      case 'pending': return 'status-pending';
      case 'sent': return 'status-sent';
      case 'completed': return 'status-completed';
      case 'declined': return 'status-declined';
      case 'voided': return 'status-voided';
      default: return 'status-voided';
    }
  }

  /**
   * Emit custom event helper
   */
  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
    return this;
  }

  // ============================================
  // PUBLIC API - Action Handlers
  // ============================================

  /**
   * Register view action handler
   */
  onView(handler) {
    if (typeof handler === 'function') {
      this.onViewHandler = handler;
    } else {
      console.error('onView requires a function');
    }
    return this;
  }

  /**
   * Register delete action handler
   */
  onDelete(handler) {
    if (typeof handler === 'function') {
      this.onDeleteHandler = handler;
    } else {
      console.error('onDelete requires a function');
    }
    return this;
  }

  // ============================================
  // PUBLIC API - Data Manipulation
  // ============================================

  /**
   * Load data into table
   */
  loadData(dataArray) {
    this.bindData(dataArray);
    return this;
  }

  /**
   * Get all table data
   */
  getData() {
    return this.data;
  }

  /**
   * Get single row data
   */
  getRow(rowIndex) {
    return this.data[rowIndex];
  }

  /**
   * Update row data
   */
  updateRow(rowIndex, newData) {
    if (rowIndex >= 0 && rowIndex < this.data.length) {
      this.data[rowIndex] = { ...this.data[rowIndex], ...newData };
      this.refresh();
    }
    return this;
  }

  /**
   * Remove row from table
   */
  removeRow(rowIndex) {
    if (rowIndex >= 0 && rowIndex < this.data.length) {
      this.data.splice(rowIndex, 1);
      
      // Update selection indices
      const newSelectedRows = new Set();
      this.selectedRows.forEach(selectedIndex => {
        if (selectedIndex < rowIndex) {
          newSelectedRows.add(selectedIndex);
        } else if (selectedIndex > rowIndex) {
          newSelectedRows.add(selectedIndex - 1);
        }
      });
      this.selectedRows = newSelectedRows;
      
      this.refresh();
    }
    return this;
  }

  /**
   * Clear all data
   */
  clear() {
    this.bindData([]);
    return this;
  }

  /**
   * Refresh table with optional new data
   */
  refresh(dataArray = null) {
    if (dataArray) this.data = dataArray;
    this.bindData(this.data);
    return this;
  }
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define('x-table', Table);
