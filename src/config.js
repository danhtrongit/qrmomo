// React App Configuration
const CONFIG = {
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:4105',
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:4105',
};

// Auto-detect protocol based on current page protocol
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  // If React app is served over HTTPS, use WSS
  if (CONFIG.WS_URL.startsWith('ws://')) {
    CONFIG.WS_URL = CONFIG.WS_URL.replace('ws://', 'wss://');
    console.log('Auto-switched to WSS:', CONFIG.WS_URL);
  }
  if (CONFIG.API_URL.startsWith('http://')) {
    CONFIG.API_URL = CONFIG.API_URL.replace('http://', 'https://');
    console.log('Auto-switched to HTTPS:', CONFIG.API_URL);
  }
}

export default CONFIG;

