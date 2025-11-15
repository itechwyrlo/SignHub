// src/config.js
/**
 * Application Configuration
 * Environment-specific settings for API endpoints and app behavior
 */

const config = {
    // API Base URL - changes based on environment
    // Priority: 1. Environment variable, 2. Window config, 3. Default
    apiBaseUrl: (() => {
      // Check for Vite environment variable (if using build tools)
      if (import.meta.env?.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
      }
      
      // Check for window config (set in index.html for development)
      if (window.APP_CONFIG?.apiBaseUrl) {
        return window.APP_CONFIG.apiBaseUrl;
      }
      
      // Production default - UPDATE THIS with your actual backend URL
      return 'https://your-api-domain.com';
    })(),
    
    // Environment detection
    environment: (() => {
      if (import.meta.env?.MODE) {
        return import.meta.env.MODE; // 'development' | 'production'
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
      }
      return 'production';
    })(),
    
    // Feature flags
    features: {
      enableDebug: (() => {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               import.meta.env?.MODE === 'development';
      })()
    },
    
    // API timeout (milliseconds)
    apiTimeout: 30000, // 30 seconds
    
    // Retry configuration
    retry: {
      maxAttempts: 3,
      delay: 1000 // 1 second
    }
  };
  
  // Log configuration in development
  if (config.features.enableDebug) {
    console.log('🔧 App Configuration:', {
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment
    });
  }
  
  export default config;