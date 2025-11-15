import { ComponentBase } from "../core/ComponentBase.js";
import { componentManager } from "../core/ComponentManager.js";
import { loading } from "../utils/loadingOverlay.js";
import { toast } from "../utils/toast.js";
/**
 * Enhanced Paging Component with Model Integration
 * Automatically accesses bound model from parent table
 * Calls model.load() on every page navigation
 * Supports dynamic pageSize from model or defaults to 10
 */
export class Paging extends ComponentBase {
  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    super();
    
    this.state = {
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 1,
      loading: false
    };
    
    this.pagingId = null;
    this.targetTableId = null;
    this.targetTable = null;
    this.boundModel = null; // ✅ Store reference to bound model
    this.lastItems = null;
    
    // Page size options
    this.pageSizeOptions = [5, 10, 20, 50, 100];
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
    this.connectToTable();
    
    this.setupEvents();
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
    this.pagingId = this.getAttribute('data-id') || this.generateId();
    
    const table = this.previousElementSibling;
    // Parse target table ID (optional - auto-detect if not provided)
    this.targetTableId = table.getAttribute('data-id') || null;
    this.targetTable = table;
  }

  /**
   * Connect to target table and access bound model
   */

  connectToTable() {
    // If target table ID is provided, use it
    if (this.targetTableId) {
      this.targetTable = componentManager.getComponent(this.targetTableId)
      // this.targetTable = document.querySelector(`x-table[data-id="${this.targetTableId}"]`);
    } else {
      // Auto-detect: find nearest x-table sibling or parent's x-table
      this.targetTable = this.previousElementSibling?.tagName === 'X-TABLE' 
        ? this.previousElementSibling 
        : this.closest('div')?.querySelector('x-table');
    }
  
    if (this.targetTable) {
      console.log(`✅ Paging connected to table: ${this.targetTable.getAttribute('data-id')}`);
      
      // ✅ Try to get model immediately (in case it's already bound)
      this.boundModel = this.targetTable.getBoundModel?.();
      
      if (this.boundModel) {
        console.log('✅ Model already bound, initializing...');
        this.initializeWithModel();
      } else {
        console.log('⏳ Waiting for model to be bound...');
        // ✅ Listen for model-bound event
        this.addManagedEventListener(this.targetTable, 'model-bound', (e) => {
          console.log('✅ Model-bound event received!');
          this.boundModel = e.detail.model;
          this.initializeWithModel();
        });
      }
      
      // Listen to table events
      this.listenToTableEvents();
    } else {
      console.warn('⚠️ Paging component could not find target table');
    }
  }
  
  /**
   * ✅ Initialize with bound model
   */
  initializeWithModel() {
    console.log('✅ Paging accessed bound model:', this.boundModel.constructor.name);
    
    // Get pageSize from model or use default
    const modelPageSize = this.boundModel.pageSize || 10;
    this.state.pageSize = modelPageSize;
    
    console.log(`📊 Setting pageSize from model: ${this.state.pageSize}`);
    
    // Update UI with correct pageSize
    this.updatePageSizeSelector();
    
    // Set table's page size
    this.targetTable.setPageSize(this.state.pageSize);
    
    // Listen to model state changes
    this.listenToModelChanges();
  }
  
  /**
   * ✅ Update page size selector in UI
   */
  updatePageSizeSelector() {
    const pageSizeSelect = this.querySelector('.paging-page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.value = this.state.pageSize;
      console.log(`✅ Updated page size selector to: ${this.state.pageSize}`);
    }
  }
//   connectToTable() {
//     // If target table ID is provided, use it
//     if (this.targetTableId) {
//       this.targetTable = document.querySelector(`x-table[data-id="${this.targetTableId}"]`);
//     } else {
//       // Auto-detect: find nearest x-table sibling or parent's x-table
//       this.targetTable = this.previousElementSibling?.tagName === 'X-TABLE' 
//         ? this.previousElementSibling 
//         : this.closest('div')?.querySelector('x-table');
//     }

//     if (this.targetTable) {
//       console.log(`✅ Paging connected to table: ${this.targetTable.getAttribute('data-id')}`);
      
//       // ✅ Access bound model from table
//       this.boundModel = this.targetTable.getBoundModel?.();
      
//       if (this.boundModel) {
//         console.log('✅ Paging accessed bound model:', this.boundModel.constructor.name);
        
//         // Get pageSize from model or use default
//         const modelPageSize = this.boundModel.pageSize || 10;
//         this.state.pageSize = modelPageSize;
        
//         // Set table's page size
//         this.targetTable.setPageSize(this.state.pageSize);
        
//         // Listen to model state changes
//         this.listenToModelChanges();
//       } else {
//         console.warn('⚠️ Could not access bound model from table');
//       }
      
//       // Listen to table events
//       this.listenToTableEvents();
//     } else {
//       console.warn('⚠️ Paging component could not find target table');
//     }
//   }

  /**
   * ✅ Listen to model state changes
   */
  /**
 * ✅ Listen to model state changes
 */
  /**
   * ✅ Listen to model state changes
   */
  listenToModelChanges() {
    if (!this.boundModel) return;
  
    // ✅ Initialize tracking
    this.lastItems = null;
  
    // Subscribe to model's state changes
    this.boundModel.subscribe((update) => {
      console.log('📊 Model update received:', update);
      
      // Handle loading state
      if (update.state?.loading !== undefined) {
        if (update.state.loading !== this.state.loading) {
          this.state.loading = update.state.loading;
          this.updateLoadingState();
        }
      }
      
      // Handle items update
      if (update.state?.items) {
        const items = update.state.items;
        
        if (items !== this.lastItems) {
          this.lastItems = items;
          
          // ✅ Get total from model
          const totalCount = this.boundModel.getTotalCount?.() || 
                            this.boundModel.totalCount || 
                            items.length;
          
          console.log('📊 Paging received data update:', {
            itemsLoaded: items.length,
            totalCount: totalCount
          });
          
          this.updatePagingInfo(totalCount);
        }
      }
    });
  }

  /**
   * Listen to table events
   */
  listenToTableEvents() {
    if (!this.targetTable) return;

    // Listen for data changes from table
    this.addManagedEventListener(this.targetTable, 'data-loaded', (e) => {
      this.updatePagingInfo(e.detail.totalItems);
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `paging-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // RENDERING
  // ============================================
  
  /**
   * Main render method
   */
  render() {
    this.innerHTML = `
      <div class="paging-toolbar">
        ${this.buildPageInfo()}
        ${this.buildPageSizeSelector()}
        ${this.buildPageNavigation()}
      </div>
    `;
  }

  /**
   * Build page info display
   */
  buildPageInfo() {
    const start = (this.state.currentPage - 1) * this.state.pageSize + 1;
    const end = Math.min(this.state.currentPage * this.state.pageSize, this.state.totalItems);
    
    return `
      <div class="paging-info">
        <span>
          ${this.state.loading ? '<i class="fa-solid fa-spinner fa-spin"></i>' : ''}
          Showing 
          <strong>${this.state.totalItems > 0 ? start : 0}</strong> 
          to 
          <strong>${end}</strong> 
          of 
          <strong>${this.state.totalItems}</strong> 
          entries
        </span>
      </div>
    `;
  }

  /**
   * Build page size selector
   */
  buildPageSizeSelector() {
    return `
      <div class="paging-size-selector">
        <label>Show</label>
        <select class="paging-page-size-select" ${this.state.loading ? 'disabled' : ''}>
          ${this.pageSizeOptions.map(size => `
            <option value="${size}" ${size === this.state.pageSize ? 'selected' : ''}>
              ${size}
            </option>
          `).join('')}
        </select>
        <label>entries</label>
      </div>
    `;
  }

  /**
   * Build page navigation buttons
   */
  buildPageNavigation() {
    const isFirstPage = this.state.currentPage === 1;
    const isLastPage = this.state.currentPage >= this.state.totalPages;
    const isDisabled = this.state.loading;
    
    return `
      <div class="paging-navigation">
        <button 
          class="paging-btn paging-first" 
          ${isFirstPage || isDisabled ? 'disabled' : ''}
          title="First Page">
          <i class='bxr bx-first'></i> 
        </button>
        
        <button 
          class="paging-btn paging-prev" 
          ${isFirstPage || isDisabled ? 'disabled' : ''}
          title="Previous Page">
          <i class='bxr bx-chevron-left'></i> 
        </button>
        
        ${this.buildPageNumbers()}
        
        <button 
          class="paging-btn paging-next" 
          ${isLastPage || isDisabled ? 'disabled' : ''}
          title="Next Page">
          <i class='bxr bx-chevron-right'></i> 
        </button>
        
        <button 
          class="paging-btn paging-last" 
          ${isLastPage || isDisabled ? 'disabled' : ''}
          title="Last Page">
          <i class='bxr bx-last'></i> 
        </button>
      </div>
    `;
  }

  /**
   * Build page number buttons
   */
  buildPageNumbers() {
    const pages = this.calculateVisiblePages();
    const isDisabled = this.state.loading;
    
    return pages.map(page => {
      if (page === '...') {
        return `<span class="paging-ellipsis">...</span>`;
      }
      
      return `
        <button 
          class="paging-btn paging-page-num ${page === this.state.currentPage ? 'active' : ''}" 
          data-page="${page}"
          ${isDisabled ? 'disabled' : ''}>
          ${page}
        </button>
      `;
    }).join('');
  }

  /**
   * Calculate visible page numbers with ellipsis
   */
  calculateVisiblePages() {
    const { currentPage, totalPages } = this.state;
    const pages = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  }

  // ============================================
  // EVENT HANDLING
  // ============================================
  
  /**
   * Setup all event listeners
   */
  setupEvents() {
    // Page size selector
    const pageSizeSelect = this.querySelector('.paging-page-size-select');
    if (pageSizeSelect) {
      this.addManagedEventListener(pageSizeSelect, 'change', this.handlePageSizeChange);
    }

    // Navigation buttons
    this.setupNavigationEvents();
  }

  /**
   * Setup navigation events
   */
  setupNavigationEvents() {
    const firstBtn = this.querySelector('.paging-first');
    const prevBtn = this.querySelector('.paging-prev');
    const nextBtn = this.querySelector('.paging-next');
    const lastBtn = this.querySelector('.paging-last');

    if (firstBtn) this.addManagedEventListener(firstBtn, 'click', () => this.goToPage(1));
    if (prevBtn) this.addManagedEventListener(prevBtn, 'click', () => this.goToPage(this.state.currentPage - 1));
    if (nextBtn) this.addManagedEventListener(nextBtn, 'click', () => this.goToPage(this.state.currentPage + 1));
    if (lastBtn) this.addManagedEventListener(lastBtn, 'click', () => this.goToPage(this.state.totalPages));

    // Page number buttons
    this.querySelectorAll('.paging-page-num').forEach(btn => {
      this.addManagedEventListener(btn, 'click', (e) => {
        const page = parseInt(e.currentTarget.getAttribute('data-page'));
        this.goToPage(page);
      });
    });
  }

  /**
   * Handle page size change
   */
  handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.currentTarget.value);
    this.setPageSize(newPageSize);
  }

  // ============================================
  // PAGING LOGIC WITH MODEL INTEGRATION
  // ============================================

  /**
   * ✅ Go to specific page and load data from model
   */
  async goToPage(page) {
    if (page < 1 || page > this.state.totalPages || page === this.state.currentPage) {
      return;
    }

    if (this.state.loading) {
      console.warn('⚠️ Already loading, please wait...');
      return;
    }

    this.state.currentPage = page;
    
    // ✅ Load data from model with pagination params
    await this.loadDataFromModel();

    // Update UI
    this.updateUI();

    // Emit event
    this.emit('page-changed', {
      currentPage: this.state.currentPage,
      pageSize: this.state.pageSize,
      totalPages: this.state.totalPages
    });
  }

  /**
   * ✅ Set page size and reload data
   */
  async setPageSize(pageSize) {
    if (this.state.loading) {
      console.warn('⚠️ Already loading, please wait...');
      return;
    }

    this.state.pageSize = pageSize;
    this.state.currentPage = 1; // Reset to first page

    // Update model's pageSize if possible
    if (this.boundModel) {
      this.boundModel.pageSize = pageSize;
    }

    // Update table's page size
    if (this.targetTable && typeof this.targetTable.setPageSize === 'function') {
      this.targetTable.setPageSize(pageSize);
    }

    // ✅ Load data from model with new page size
    await this.loadDataFromModel();

    // Update UI
    this.updateUI();

    // Emit event
    this.emit('page-size-changed', {
      pageSize: this.state.pageSize,
      currentPage: this.state.currentPage,
      totalPages: this.state.totalPages
    });
  }

  /**
   * ✅ Load data from bound model
   */

  async loadDataFromModel() {
    if (!this.boundModel) {
      console.warn('⚠️ No bound model available');
      return;
    }
  
    try {
    
      
      // ✅ Get current filter from model
      const currentFilter = this.boundModel.getFilter() || {};
      
      const params = {
        ...currentFilter,
        pageNumber: this.state.currentPage,
        pageSize: this.state.pageSize
      };
      
      // ✅ Get URL from model's proxy.read
      const url = this.boundModel.proxy?.read || '';
  
      // ✅ Emit beforeload event
      const beforeLoadEvent = new CustomEvent('beforeload', {
        detail: { 
          params,
          url: url,
          model: this.boundModel,
          _handler: null
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
  
      this.targetTable.dispatchEvent(beforeLoadEvent);
      
      if (beforeLoadEvent.defaultPrevented) {
        loading.hide();
        console.log('⏭️ Load cancelled by beforeload handler');
        return;
      }
  
      console.log('📊 Loading page with params:', params);
  
      this.isLoadingData = true;
      
      // ✅ Pass modified params to model.load()
      const items = await this.boundModel.load(params);
  
      console.log('✅ Loaded items:', items.length);
  
      this.isLoadingData = false;
      
 
      
    } catch (error) {
      this.isLoadingData = false;
      console.error('❌ Error loading data from model:', error);
      
      // ✅ Show error toast
      toast.error(`Failed to load page: ${error.message}`);
      
      this.emit('load-error', { error: error.message });
    }
  }

  /**
   * Update paging info (called when table emits data-loaded)
   */
  updatePagingInfo(totalItems) {
    // ✅ Skip update if we're the ones loading the data
    if (this.isLoadingData) {
      console.log('⏭️ Skipping paging update - currently loading data');
      return;
    }
  
    console.log('📊 Paging Info Update:', {
      totalItems,
      pageSize: this.state.pageSize,
      calculatedPages: Math.ceil(totalItems / this.state.pageSize)
    });
    
    this.state.totalItems = totalItems;
    this.state.totalPages = Math.ceil(totalItems / this.state.pageSize);
    
    if (this.state.currentPage > this.state.totalPages && this.state.totalPages > 0) {
      this.state.currentPage = this.state.totalPages;
    }
  
    this.updateUI();
  }

  /**
   * Update loading state in UI
   */
  updateLoadingState() {
    // Update page info to show/hide spinner
    const pageInfo = this.querySelector('.paging-info');
    if (pageInfo) {
      const newInfo = document.createElement('div');
      newInfo.innerHTML = this.buildPageInfo();
      pageInfo.innerHTML = newInfo.firstElementChild.innerHTML;
    }

    // Update page size selector
    const pageSizeSelect = this.querySelector('.paging-page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.disabled = this.state.loading;
    }

    // Update navigation buttons
    const navigation = this.querySelector('.paging-navigation');
    if (navigation) {
      const newNav = document.createElement('div');
      newNav.innerHTML = this.buildPageNavigation();
      navigation.innerHTML = newNav.firstElementChild.innerHTML;
      this.setupNavigationEvents();
    }
  }

  /**
   * Update UI without full re-render
   */
  updateUI() {
    // Update page info
    const pageInfo = this.querySelector('.paging-info');
    if (pageInfo) {
      const newInfo = document.createElement('div');
      newInfo.innerHTML = this.buildPageInfo();
      pageInfo.innerHTML = newInfo.firstElementChild.innerHTML;
    }

    // Update navigation
    const navigation = this.querySelector('.paging-navigation');
    if (navigation) {
      const newNav = document.createElement('div');
      newNav.innerHTML = this.buildPageNavigation();
      navigation.innerHTML = newNav.firstElementChild.innerHTML;
      this.setupNavigationEvents();
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get current page
   */
  getCurrentPage() {
    return this.state.currentPage;
  }

  /**
   * Get page size
   */
  getPageSize() {
    return this.state.pageSize;
  }

  /**
   * Get total pages
   */
  getTotalPages() {
    return this.state.totalPages;
  }

  /**
   * Get total items
   */
  getTotalItems() {
    return this.state.totalItems;
  }

  /**
   * Get bound model
   */
  getBoundModel() {
    return this.boundModel;
  }

  /**
   * Reset to first page
   */
  async reset() {
    await this.goToPage(1);
    return this;
  }

  /**
   * ✅ Manual refresh - reload current page
   */
  async refresh() {
    await this.loadDataFromModel();
    return this;
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
}

// ============================================
// REGISTER CUSTOM ELEMENT
// ============================================
customElements.define('x-paging', Paging);