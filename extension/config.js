// Configuration file for MoMo Payment Extractor Extension

// Default configuration
const DEFAULT_CONFIG = {
  SERVER_URL: 'http://localhost:4105',  // Backend WebSocket server
  REACT_APP_URL: 'http://localhost:4104'  // Frontend React app
};

// Current configuration (loaded from storage or defaults)
let CONFIG = { ...DEFAULT_CONFIG };

/**
 * Load configuration from Chrome storage
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get('config');
      if (result.config) {
        Object.assign(CONFIG, result.config);
      }
    } catch (error) {
      // Silent error handling
    }
  }
  return CONFIG;
}

/**
 * Get current configuration
 * @returns {Object} Current configuration
 */
function getConfig() {
  return { ...CONFIG };
}

/**
 * Save configuration to Chrome storage
 * @param {Object} newConfig - New configuration object
 * @returns {Promise<boolean>} Success status
 */
async function saveConfig(newConfig) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      await chrome.storage.local.set({ config: newConfig });
      Object.assign(CONFIG, newConfig);
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

/**
 * Reset configuration to defaults
 * @returns {Promise<boolean>} Success status
 */
async function resetConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      await chrome.storage.local.remove('config');
      Object.assign(CONFIG, DEFAULT_CONFIG);
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.loadConfig = loadConfig;
  window.getConfig = getConfig;
  window.saveConfig = saveConfig;
  window.resetConfig = resetConfig;
  window.CONFIG = CONFIG;
}
