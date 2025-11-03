// Extension Configuration with Storage Support
const DEFAULT_CONFIG = {
  // Server Configuration (Backend)
  SERVER_URL: 'http://localhost:4105',
  WS_URL: 'ws://localhost:4105',
  
  // React App Configuration (Frontend)
  REACT_APP_URL: 'http://localhost:4104',
};

// Global CONFIG object
let CONFIG = { ...DEFAULT_CONFIG };

// Function to load config from chrome.storage
async function loadConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(['userConfig']);
      if (result.userConfig) {
        // Merge user config with default config
        CONFIG = {
          ...DEFAULT_CONFIG,
          ...result.userConfig
        };
        
        // Update WS_URL to match SERVER_URL protocol
        if (CONFIG.SERVER_URL) {
          CONFIG.WS_URL = CONFIG.SERVER_URL.replace('http://', 'ws://').replace('https://', 'wss://');
        }
        
        console.log('Config loaded from storage:', CONFIG);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }
  return CONFIG;
}

// Function to save config to chrome.storage
async function saveConfig(newConfig) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const userConfig = {
        SERVER_URL: newConfig.SERVER_URL || DEFAULT_CONFIG.SERVER_URL,
        REACT_APP_URL: newConfig.REACT_APP_URL || DEFAULT_CONFIG.REACT_APP_URL,
      };
      
      // Auto-generate WS_URL
      userConfig.WS_URL = userConfig.SERVER_URL.replace('http://', 'ws://').replace('https://', 'wss://');
      
      await chrome.storage.local.set({ userConfig });
      
      // Update global CONFIG
      CONFIG = { ...DEFAULT_CONFIG, ...userConfig };
      
      console.log('Config saved:', CONFIG);
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
  return false;
}

// Function to reset config to default
async function resetConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      await chrome.storage.local.remove(['userConfig']);
      CONFIG = { ...DEFAULT_CONFIG };
      console.log('Config reset to default:', CONFIG);
      return true;
    } catch (error) {
      console.error('Error resetting config:', error);
      return false;
    }
  }
  return false;
}

// Function to get current config
function getConfig() {
  return CONFIG;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, loadConfig, saveConfig, resetConfig, getConfig, DEFAULT_CONFIG };
}

