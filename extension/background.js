// Background Service Worker
console.log('MoMo Payment Extractor: Background service worker loaded');

// Import configuration and device emulator
importScripts('config.js', 'deviceEmulator.js');

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
  
  if (request.type === 'OPEN_IN_MOBILE_MODE') {
    // Open current MoMo page in a new window with mobile dimensions
    openInMobileMode(request.url)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error opening in mobile mode:', error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }
  
  if (request.type === 'EMULATE_MOBILE') {
    // Tự động emulate mobile device bằng CDP
    autoEmulateMoMoPage(sender.tab.id, sender.tab.url)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error emulating mobile:', error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }
  
  if (request.type === 'STOP_EMULATION') {
    // Stop emulation
    stopEmulation(sender.tab.id)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error stopping emulation:', error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }

  return true;
});

// Function to open URL in a mobile-sized window
async function openInMobileMode(url) {
  try {
    console.log('Opening URL in mobile mode:', url);
    
    // Get device info from storage if available
    let deviceInfo;
    try {
      const result = await chrome.storage.local.get('momo_device_info');
      deviceInfo = result.momo_device_info;
    } catch (error) {
      console.warn('Could not load device info from storage');
    }
    
    // Default to iPhone 14 Pro dimensions
    const viewport = deviceInfo?.recommended?.viewport || {
      width: 393,
      height: 852
    };
    
    // Create a new window with mobile dimensions
    const newWindow = await chrome.windows.create({
      url: url,
      type: 'popup',
      width: viewport.width + 16, // Add padding for window chrome
      height: viewport.height + 120, // Add padding for address bar, etc.
      left: 100,
      top: 100
    });
    
    console.log('Mobile window created:', newWindow.id);
    
    // Show instruction notification
    setTimeout(() => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: '📱 Mobile Mode Window Opened',
        message: 'Press Ctrl+Shift+M (or Cmd+Shift+M) in the new window, select a mobile device, then reload.',
        priority: 2
      });
    }, 500);
    
    return { 
      success: true, 
      windowId: newWindow.id,
      message: 'Mobile window opened. Enable Device Mode (Ctrl+Shift+M) and reload.'
    };
    
  } catch (error) {
    console.error('Error creating mobile window:', error);
    return { success: false, error: error.message };
  }
}

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

// Auto-emulate mobile when opening MoMo payment pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only trigger when page starts loading
  if (changeInfo.status === 'loading' && tab.url && tab.url.includes('payment.momo.vn')) {
    console.log('📱 MoMo payment page detected, auto-emulating mobile...');
    
    // Wait a bit for page to start loading
    setTimeout(async () => {
      const result = await autoEmulateMoMoPage(tabId, tab.url);
      if (result.success) {
        console.log('✅ Auto-emulation successful');
      } else {
        console.warn('⚠️ Auto-emulation failed:', result.error || result.message);
      }
    }, 500);
  }
});

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
