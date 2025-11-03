// Background Service Worker
console.log('MoMo Payment Extractor: Background service worker loaded');

// Import configuration
importScripts('config.js');

// Load config on startup
let SERVER_URL = CONFIG.SERVER_URL;
let REACT_APP_URL = CONFIG.REACT_APP_URL;

// Initialize config from storage
loadConfig().then((config) => {
  SERVER_URL = config.SERVER_URL;
  REACT_APP_URL = config.REACT_APP_URL;
  console.log('Background: Config loaded', config);
});

// Lắng nghe messages từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);

  if (request.type === 'GENERATE_TOKEN') {
    // Generate token từ server
    generateToken()
      .then(result => {
        if (result) {
          sendResponse(result);
        } else {
          sendResponse({ error: 'Failed to generate token' });
        }
      })
      .catch(error => {
        console.error('Error generating token:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // Giữ message channel mở
  }

  return true;
});

// Hàm generate token từ server
async function generateToken() {
  try {
    // Get latest config
    const config = await loadConfig();
    const serverUrl = config.SERVER_URL;
    const reactAppUrl = config.REACT_APP_URL;
    
    const response = await fetch(`${serverUrl}/api/token/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Token generated:', result.token);
    
    // Update URL to use hash routing with configured React app URL
    result.url = `${reactAppUrl}/#/qr/${result.token}`;
    
    return result;
  } catch (error) {
    console.error('Error generating token:', error);
    return null;
  }
}

// Lắng nghe khi extension icon được click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked');
  
  // Nếu đang ở trang MoMo, extract và gửi dữ liệu
  if (tab.url && tab.url.includes('payment.momo.vn')) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' });
      
      if (response && response.success && response.url) {
        // Mở React App với URL có token
        chrome.tabs.create({ 
          url: response.url, 
          active: false // Không auto-focus
        });
        
        console.log('React app opened at:', response.url);
      }
    } catch (error) {
      console.error('Error extracting data:', error);
    }
  }
});
