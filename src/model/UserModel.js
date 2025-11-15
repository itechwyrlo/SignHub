import { ModelBase } from "../core/ModelBase.js";
import { AuthManager } from "../core/AuthManager.js";
// OPTION 4: Extended Proxy with Custom Actions
export class UserModel extends ModelBase {
  constructor() {
    super();
    
    // Define proxy endpoints - including custom actions
    this.proxy = {
      read: '/api/user/read',
      create: '/api/user/',
      update: '/api/user/update/:id',
      destroy: '/api/user/destroy/:id',
      
      // Custom action endpoints
      login: '/api/user/login',
      logout: '/api/user/logout',
      resetPassword: '/api/auth/reset-password',
      verifyEmail: '/api/auth/verify-email'
    };
  }

  // OPTION 2: Custom Instance Methods
  // These methods bypass CRUD state tracking and directly call APIs
  
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @param {Object} filter - Optional filter parameters
   * @returns {Promise} Login response with token
   */
  async login(credentials, filter = {}) {
    if (!this.proxy.login) {
      throw new Error('Login proxy endpoint not defined');
    }

    try {
      const response = await this._apiRequest('POST', this.proxy.login, credentials, filter, {});
      
      // Optionally store user data after successful login
      if (response.success) {
        // this.load([response]);
        AuthManager._set(response.token);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Logout user
   * @param {Object} filter - Optional filter parameters
   * @returns {Promise} Logout response
   */
  async logout(filter = {}) {
    if (!this.proxy.logout) {
      throw new Error('Logout proxy endpoint not defined');
    }

    try {
      const response = await this._apiRequest('POST', this.proxy.logout, null, filter, {});
      
      // Clear user data after logout
      this.data.items = [];
      this.reset();
      
      return response;
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Reset password
   * @param {Object} data - { email } or { token, newPassword }
   * @param {Object} filter - Optional filter parameters
   * @returns {Promise} Reset password response
   */
  async resetPassword(data, filter = {}) {
    if (!this.proxy.resetPassword) {
      throw new Error('Reset password proxy endpoint not defined');
    }

    try {
      const response = await this._apiRequest('POST', this.proxy.resetPassword, data, filter, {});
      return response;
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Verify email
   * @param {Object} data - { token } or { email, code }
   * @param {Object} filter - Optional filter parameters
   * @returns {Promise} Verification response
   */
  async verifyEmail(data, filter = {}) {
    if (!this.proxy.verifyEmail) {
      throw new Error('Verify email proxy endpoint not defined');
    }

    try {
      const response = await this._apiRequest('POST', this.proxy.verifyEmail, data, filter, {});
      return response;
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  // Standard model methods
  findByEmail(email) {
    return this.data.items.find(user => user.email === email);
  }
}