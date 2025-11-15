// src/api.js
import config from './config.js';
import { AuthManager } from './core/AuthManager.js';
import { toast } from './utils/toast.js';

/**
 * Centralized API Client
 * Handles all HTTP requests to backend with proper error handling
 */
class ApiClient {
  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  /**
   * Build full URL from endpoint
   * @param {string} endpoint - API endpoint (e.g., '/api/document' or 'api/document')
   * @returns {string} Full URL
   */
  buildUrl(endpoint) {
    // If endpoint already contains full URL, use it as-is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Ensure baseUrl doesn't have trailing slash
    const cleanBaseUrl = this.baseUrl.endsWith('/') 
      ? this.baseUrl.slice(0, -1) 
      : this.baseUrl;
    
    // Combine base URL with endpoint
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Make API request with retry logic
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object|null} data - Request body data
   * @param {Object} options - Additional options (headers, timeout, etc.)
   * @returns {Promise} API response
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint);
    const token = AuthManager._get();
    
    const requestConfig = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options.fetchOptions
    };

    // Add body for non-GET/DELETE requests
    if (data && method !== 'GET' && method !== 'DELETE') {
      requestConfig.body = JSON.stringify(data);
    }

    // Add timeout support
    if (config.apiTimeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);
      requestConfig.signal = controller.signal;
      
      try {
        const response = await fetch(url, requestConfig);
        if(!response.ok){
          toast.error(`HTTP ${response.status}: ${response.statusText}`);
          loading.hide();
        }
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
    } else {
      const response = await fetch(url, requestConfig);
      return await this._handleResponse(response);
    }
  }

  /**
   * Handle API response
   * @private
   */
  async _handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      
      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid
        AuthManager._clear();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Session expired. Please login again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      }
      
      throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: true };
    }

    return await response.json();
  }

  /**
   * Upload file with FormData
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData object containing files and data
   * @param {Object} options - Additional options (headers, etc.)
   * @returns {Promise} API response
   */
  async upload(endpoint, formData, options = {}) {
    const url = this.buildUrl(endpoint);
    const token = AuthManager._get();
    
    const requestConfig = {
      method: 'POST',
      headers: {
        // Only add Authorization header - DO NOT set Content-Type
        // Browser will automatically set Content-Type with proper boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      body: formData,
      ...options.fetchOptions
    };

    // Add timeout support
    if (config.apiTimeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout * 2); // Longer timeout for uploads
      requestConfig.signal = controller.signal;
      
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);
        return await this._handleResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - file may be too large');
        }
        throw error;
      }
    } else {
      const response = await fetch(url, requestConfig);
      return await this._handleResponse(response);
    }
  }

  // ============================================
  // Convenience methods
  // ============================================

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;