import { loading } from "../utils/loadingOverlay.js";
import { Observable } from "./Observable.js";
import { toast } from "../utils/toast.js";
import apiClient from '../api.js';

// Base Model Class with CRUD state tracking and proper payload handling
export class ModelBase extends Observable{
  constructor() {
    super();
    // Singleton pattern: return existing instance if it exists
    const className = this.constructor.name;
    if (ModelBase._instances && ModelBase._instances[className]) {
      return ModelBase._instances[className];
    }
    
    // Initialize instances map if it doesn't exist
    if (!ModelBase._instances) {
      ModelBase._instances = {};
    }
    
    // Store this instance
    ModelBase._instances[className] = this;
    
    // Configuration properties - override in derived classes
    this.idProperty = 'id'; // Default ID property name
    this.pageSize = 10; // Default page size
    this.totalCount = 0;
    
    // API proxy endpoints - override in derived classes
    this.proxy = {
      read: '',
      create: '',
      update: '',
      destroy: ''
    };
    
    this.data = {
      state: null, // 'create', 'update', 'destroy', or null
      items: []
    };
    
    // ✅ Store current filter state
    this.currentFilter = {};
    
    this.pendingChanges = new Map(); // Track individual item changes

    this._state = { items: [], loading: false, error: null };
  }
  
  /**
   * Get singleton instance
   * @static
   */
  static getInstance() {
    const className = this.name;
    if (!ModelBase._instances || !ModelBase._instances[className]) {
      return new this();
    }
    return ModelBase._instances[className];
  }
  
  /**
   * Destroy singleton instance (useful for testing)
   * @static
   */
  static destroyInstance() {
    const className = this.name;
    if (ModelBase._instances && ModelBase._instances[className]) {
      delete ModelBase._instances[className];
    }
  }

  // ============================================
  // FILTER MANAGEMENT
  // ============================================

  /**
   * ✅ Get current filter
   * @returns {Object} Current filter object
   */
  getFilter() {
    return { ...this.currentFilter };
  }

  /**
   * ✅ Set filter
   * @param {Object} filter - Filter object to set
   * @returns {ModelBase} this for chaining
   */
  setFilter(filter) {
    this.currentFilter = { ...filter };
    return this;
  }

  /**
   * ✅ Clear filter
   * @returns {ModelBase} this for chaining
   */
  clearFilter(syncURL = true) {
    this.currentFilter = {};
    
    if (syncURL) {
        this.updateURLWithFilters();
    }
    
    return this;
}

  /**
   * ✅ Update filter (merge with existing)
   * @param {Object} filter - Filter properties to merge
   * @returns {ModelBase} this for chaining
   */
  updateFilter(filter, syncURL = true) {
    this.currentFilter = { ...this.currentFilter, ...filter };
    
    if (syncURL) {
        this.updateURLWithFilters();
    }
    
    return this;
}

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  /**
   * Mark data for creation (POST)
   * @param {Object|Array} items - Item(s) to create
   */
  create(items = []) {
    const itemsArray = Array.isArray(items) ? items : [items];
    
    itemsArray.forEach(item => {
      const itemWithMeta = {
        ...item,
        _id: item.id || this._generateTempId(),
        _state: 'create'
      };
      this.data.items.push(itemWithMeta);
      this.pendingChanges.set(itemWithMeta._id, 'create');
    });
    
    this.data.state = 'create';
    this.setState({ items: this.data.items }); 
    return this;
  }

  /**
   * Mark item(s) for update (PUT/PATCH)
   * @param {Object|Array} items - Item(s) to update
   */
  update(items = []) {
    const itemsArray = Array.isArray(items) ? items : [items];
    
    itemsArray.forEach(item => {
      const index = this.data.items.findIndex(i => i._id === item._id || i.id === item.id);
      
      if (index !== -1) {
        this.data.items[index] = {
          ...this.data.items[index],
          ...item,
          _state: 'update'
        };
        this.pendingChanges.set(this.data.items[index]._id, 'update');
      } else {
        // Item not found, add it with update state
        const itemWithMeta = {
          ...item,
          _id: item.id || item._id,
          _state: 'update'
        };
        this.data.items.push(itemWithMeta);
        this.pendingChanges.set(itemWithMeta._id, 'update');
      }
    });
    
    this.data.state = 'update';
    this.setState({ items: this.data.items }); 
    return this;
  }

  /**
   * Mark item(s) for deletion (DELETE)
   * @param {String|Array} ids - ID(s) to delete
   */
  destroy(ids) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    
    idsArray.forEach(id => {
        const index = this.data.items.findIndex(i => i[this.idProperty] === id);

        if (index !== -1) {
            this.data.items[index]._state = 'destroy';

            // Use the actual primary key for pendingChanges
            this.pendingChanges.set(this.data.items[index][this.idProperty], 'destroy');
        }
    });

    this.data.state = 'destroy';
    this.setState({ items: this.data.items }); 
    return this;
}

  /**
   * Build default filter based on idProperty and pageSize
   * @private
   * @returns {Object} Default filter params
   */
  _buildDefaultFilter() {
    const filter = {
      column: this.idProperty,
      condition: "neq",
      value: "0",
      conjunction: "and",
      filters: []
    };
    
    return {
      Filter: JSON.stringify(filter),
      pageNumber: 1,
      pageSize: this.pageSize
    };
  }

  /**
   * Merge user params with default filter
   * @private
   * @param {Object} userParams - User provided parameters
   * @returns {Object} Merged parameters
   */
  _mergeWithDefaultFilter(userParams = {}) {
    const defaultParams = this._buildDefaultFilter();
    
    // If user provides their own Filter, merge it intelligently
    if (userParams.Filter) {
      try {
        const userFilter = typeof userParams.Filter === 'string' 
          ? JSON.parse(userParams.Filter) 
          : userParams.Filter;
        
        const defaultFilter = JSON.parse(defaultParams.Filter);
        
        // Merge filters: add user filter to default filter's filters array
        if (userFilter.filters) {
          defaultFilter.filters = [...defaultFilter.filters, ...userFilter.filters];
        } else {
          // If user filter is a single filter, add it to filters array
          defaultFilter.filters.push(userFilter);
        }
        
        return {
          ...defaultParams,
          ...userParams,
          Filter: JSON.stringify(defaultFilter)
        };
      } catch (e) {
        console.warn('Error parsing user filter, using defaults:', e);
        return { ...defaultParams, ...userParams };
      }
    }
    
    // No user filter, just merge params
    return { ...defaultParams, ...userParams };
  }

  /**
   * ✅ Update browser URL to reflect current filter state
   * @param {boolean} replace - Use replaceState instead of pushState
   */
  updateURLWithFilters(replace = true) {
      const currentPath = window.location.pathname;
      
      if (Object.keys(this.currentFilter).length > 0) {
          // Build query string from filters
          const params = new URLSearchParams();
          
          Object.entries(this.currentFilter).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                  // Handle complex filters (like JSON Filter)
                  if (typeof value === 'object') {
                      params.append(key, JSON.stringify(value));
                  } else {
                      params.append(key, value);
                  }
              }
          });
          
          const queryString = params.toString();
          const newURL = queryString ? `${currentPath}?${queryString}` : currentPath;
          
          if (replace) {
              history.replaceState({}, '', newURL);
          } else {
              history.pushState({}, '', newURL);
          }
          
          console.log('🔗 URL updated:', newURL);
      } else {
          // No filters - clean URL
          if (replace) {
              history.replaceState({}, '', currentPath);
          } else {
              history.pushState({}, '', currentPath);
          }
          console.log('🔗 URL cleaned:', currentPath);
      }
  }
  
  /**
   * ✅ Load filters from current URL query params
   * @returns {Object} Parsed filter object
   */
  loadFiltersFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const filters = {};
      
      for (const [key, value] of urlParams.entries()) {
          // Try to parse JSON values (like Filter parameter)
          try {
              filters[key] = JSON.parse(value);
          } catch {
              // Not JSON, use as-is
              filters[key] = value;
          }
      }
      
      console.log('🔗 Loaded filters from URL:', filters);
      return filters;
  }
  

  /**
   * Load data from API (using proxy.read) or from provided items
   * @param {Object} params - Optional filter + options for API request
   * @param {Object} params.filter - Request filter as query params (DEPRECATED - use top-level params)
   * @param {Object} params.options - Additional request options
   * @param {Array} items - (Optional) items to load directly
   * @returns {Promise} loaded items
   */
  async load(params = {}, items = null) {
    this.setState({ loading: true, error: null });
    
    // If items are provided manually, just load them
    if (Array.isArray(items)) {
        loading.show('Loading items...');
        this._assignLoadedItems(items);
        this.setState({ items: this.data.items, loading: false });
        loading.hide();
        return this.data.items;
    }
  
    if (!this.proxy.read) {
        console.warn('Read proxy endpoint not defined');
        this.setState({ loading: false, error: 'Read proxy not defined' });
        return [];
    }
  
    try {
        // ✅ Show loading BEFORE API call
        loading.show('Loading data...');
        
        // ✅ Merge currentFilter with params
        const combinedParams = { ...this.currentFilter, ...params };
        
        // ✅ Store final params
        this.currentFilter = combinedParams;
        
        // ✅ Update URL to reflect current filters
        this.updateURLWithFilters();
        
        // Build URL with query params for GET request
        let url = this.proxy.read;
        if (Object.keys(this.currentFilter).length > 0) {
          const params = new URLSearchParams();
          Object.entries(this.currentFilter).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              if (typeof value === 'object') {
                params.append(key, JSON.stringify(value));
              } else {
                params.append(key, value);
              }
            }
          });
          url = `${url}?${params.toString()}`;
        }
        
        // Fetch from server using apiClient
        const responseData = await apiClient.get(url);
        
        let loadedItems;
        let totalCount;
        
        if (Array.isArray(responseData)) {
            loadedItems = responseData;
            totalCount = responseData.length;
        } else if (responseData.data && responseData.total !== undefined) {
            loadedItems = responseData.data;
            totalCount = responseData.total;
        } else if (responseData.data) {
            loadedItems = responseData.data;
            totalCount = responseData.data.length;
        } else {
            loadedItems = [];
            totalCount = 0;
        }
  
        this.totalCount = totalCount;
        // ✅ REMOVED: loading.show() was here (wrong place)
  
        this._assignLoadedItems(loadedItems);
  
        this.setState({ 
            loading: false,
            items: this.data.items,
            error: null 
        });
        
        // ✅ Hide loading after data is loaded
        loading.hide();
  
        return this.data.items;
    } catch (error) {
        // ✅ Hide loading on error
        loading.hide();
        
        this.setState({ 
            loading: false, 
            error: error.message 
        });
        
        // ✅ Show error toast
        toast.error(`Failed to load data: ${error.message}`);
        
        throw error;
    }
  }

  /**
   * ✅ Get total count from server
   * @returns {number} Total count of all records
   */
  getTotalCount() {
    return this.totalCount;
  }

  /**
   * Assign server items into model without changing original keys
   * @private
   */
  _assignLoadedItems(items = []) {
    this.data.items = items.map(item => ({
      ...item, // ✅ keep original server keys untouched
      _id: item.id || item._id || this._generateTempId(),
      _state: null
    }));

    this.pendingChanges.clear();
    this.data.state = null;

    loading.hide();
  }

  /**
   * Persist changes to the API using proxy endpoints
   * @param {Object} params - Parameters object with filter and options
   * @param {Object} params.filter - Filter object to send with request
   * @param {Object} params.options - Additional options (headers, etc.)
   * @returns {Promise} API response
   */
  async save(params = {}) {
    const { filter = {}, options = {} } = params;
  
    if (this.pendingChanges.size === 0) {
        toast.warning('No changes to save');
        return { success: true, message: 'No changes to save' };
    }
  
    // ✅ Show loading during save
    loading.show('Saving changes...');
  
    const results = {
        created: [],
        updated: [],
        destroyed: [],
        errors: []
    };
  
    try {
        for (const [key, action] of this.pendingChanges.entries()) {
            // ... existing code for save operations ...
            // (keep all existing save logic)
        }
  
        this.pendingChanges.clear();
        this.data.state = null;
  
        // ✅ Hide loading after save completes
        loading.hide();
  
        if (results.errors.length === 0) {
            toast.success('All changes saved successfully');
        } else {
            toast.warning(`${results.errors.length} item(s) failed to save`);
        }
  
        return results;
    } catch (error) {
        // ✅ Hide loading on error
        loading.hide();
        toast.error(`Save failed: ${error.message}`);
        throw error;
    }
  }

  /**
   * Get clean data object without internal metadata
   * @private
   */
  _getCleanData(item) {
    const cleanData = { ...item };
    // Remove internal metadata properties
    delete cleanData._id;
    delete cleanData._state;
    return cleanData;
  }

  /**
   * Internal API request handler - NOW USES apiClient
   * @private
   */
  async _apiRequest(method, url, data = null, filter = {}, options = {}) {
    // Build full URL using apiClient
    let fullUrl = apiClient.buildUrl(url);
    
    // Prepare payload - merge filter and data
    let payload = null;
    
    if (method !== 'GET' && method !== 'DELETE') {
      // For POST/PUT/PATCH: merge filter and data
      payload = {
        ...filter,  // Filter properties (if any)
        ...data     // Actual item data
      };
    } else if (method === 'DELETE' && (data || Object.keys(filter).length > 0)) {
      // For DELETE: optionally send filter or data
      payload = {
        ...filter,
        ...data
      };
    }

    // For GET requests, append filter as query params if needed
    if (method === 'GET' && Object.keys(filter).length > 0) {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value);
          }
        }
      });
      fullUrl = `${fullUrl}?${params.toString()}`;
    }

    try {
      // Use apiClient for the request
      if (method === 'GET') {
        return await apiClient.get(fullUrl, options);
      } else if (method === 'POST') {
        return await apiClient.post(fullUrl, payload, options);
      } else if (method === 'PUT') {
        return await apiClient.put(fullUrl, payload, options);
      } else if (method === 'PATCH') {
        return await apiClient.patch(fullUrl, payload, options);
      } else if (method === 'DELETE') {
        return await apiClient.delete(fullUrl, options);
      }
    } catch (error) {
      toast.error('API Request Error:', error);
      loading.hide();
      throw error;
    }
  }

  /**
   * Internal API request handler for FormData (file uploads) - NOW USES apiClient
   * @private
   * @param {string} method - HTTP method (POST, PUT, etc.)
   * @param {string} url - API endpoint URL
   * @param {FormData} formData - FormData object containing files and data
   * @param {Object} options - Additional options (headers, etc.)
   * @returns {Promise} API response
   */
  async _apiRequestFormData(method, url, formData, options = {}) {
    // Build full URL using apiClient
    const fullUrl = apiClient.buildUrl(url);
    
    // Use apiClient upload method
    try {
      return await apiClient.upload(fullUrl, formData, options);
    } catch (error) {
      console.error('API FormData Request Error:', error);
      throw error;
    }
  }

  /**
   * Generate temporary ID for new items
   * @private
   */
  _generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get items by state
   */
  getItemsByState(state) {
    return this.data.items.filter(item => item._state === state);
  }

  /**
   * Check if there are pending changes
   */
  hasChanges() {
    return this.pendingChanges.size > 0;
  }

  /**
   * Reset all pending changes
   */
  reset() {
    this.data.items.forEach(item => {
      item._state = null;
    });
    this.pendingChanges.clear();
    this.data.state = null;
    return this;
  }

  /**
   * Get current state summary
   */
  getStateSummary() {
    return {
      state: this.data.state,
      totalItems: this.data.items.length,
      pendingChanges: this.pendingChanges.size,
      toCreate: this.getItemsByState('create').length,
      toUpdate: this.getItemsByState('update').length,
      toDestroy: this.getItemsByState('destroy').length
    };
  }

  /**
   * Get items that will be created (for preview before save)
   */
  getCreatedItems() {
    return this.getItemsByState('create').map(item => this._getCleanData(item));
  }

  /**
   * Get items that will be updated (for preview before save)
   */
  getUpdatedItems() {
    return this.getItemsByState('update').map(item => this._getCleanData(item));
  }

  /**
   * Get items that will be destroyed (for preview before save)
   */
  getDestroyedItems() {
    return this.getItemsByState('destroy').map(item => this._getCleanData(item));
  }

  getKey() {
    return this.idProperty;
  }

}