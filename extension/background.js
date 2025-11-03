// Background Service Worker
// Import configuration
importScripts('config.js');

// Load config on startup
let SERVER_URL = CONFIG.SERVER_URL;
let REACT_APP_URL = CONFIG.REACT_APP_URL;

// Initialize config from storage
loadConfig().then((config) => {
  SERVER_URL = config.SERVER_URL;
  REACT_APP_URL = config.REACT_APP_URL;
});

// Dynamic rules management
let mobileRulesEnabled = false;

// Enable mobile UA rules dynamically
async function enableMobileRules() {
  try {
    // Remove all existing dynamic rules first
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: [
        {
          "id": 1,
          "priority": 1,
          "action": {
            "type": "modifyHeaders",
            "requestHeaders": [
              {
                "header": "User-Agent",
                "operation": "set",
                "value": "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              },
              {
                "header": "Sec-CH-UA-Mobile",
                "operation": "set",
                "value": "?1"
              },
              {
                "header": "Sec-CH-UA-Platform",
                "operation": "set",
                "value": "\"Android\""
              }
            ]
          },
          "condition": {
            "urlFilter": "*://payment.momo.vn/*",
            "resourceTypes": ["main_frame", "sub_frame", "xmlhttprequest"]
          }
        }
      ]
    });
    
    mobileRulesEnabled = true;
    return { success: true, message: 'Mobile UA rules enabled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Disable mobile UA rules
async function disableMobileRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds
    });
    
    mobileRulesEnabled = false;
    return { success: true, message: 'Mobile UA rules disabled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check if mobile rules are enabled
async function checkMobileRules() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  mobileRulesEnabled = rules.length > 0;
  return { enabled: mobileRulesEnabled, rulesCount: rules.length };
}

// Initialize on startup - default: NO mobile rules
chrome.runtime.onInstalled.addListener(async () => {
  await disableMobileRules();
});

// Lắng nghe messages từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
        sendResponse({ error: error.message });
      });
    
    return true;
  }
  
  if (request.type === 'ENABLE_MOBILE_UA') {
    // Enable mobile UA rules dynamically
    enableMobileRules()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (request.type === 'DISABLE_MOBILE_UA') {
    // Disable mobile UA rules
    disableMobileRules()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (request.type === 'CHECK_MOBILE_UA') {
    // Check if mobile UA rules are enabled
    checkMobileRules()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (request.type === 'DEVICE_INFO_UPDATE') {
    // Receive device info from React app
    const { deviceType, isMobile } = request.data;
    
    if (isMobile) {
      // User is on mobile → enable mobile UA rules
      enableMobileRules().then(() => {
        sendResponse({ success: true, message: 'Mobile UA enabled for mobile device' });
      });
    } else {
      // User is on desktop → disable mobile UA rules
      disableMobileRules().then(() => {
        sendResponse({ success: true, message: 'Mobile UA disabled for desktop device' });
      });
    }
    
    return true;
  }

  return true;
});

// Function to open URL in a mobile-sized window
async function openInMobileMode(url) {
  try {
    // Get device info from storage if available
    let deviceInfo;
    try {
      const result = await chrome.storage.local.get('momo_device_info');
      deviceInfo = result.momo_device_info;
    } catch (error) {
      // Ignore
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
    
    // Update URL to use hash routing with configured React app URL
    result.url = `${reactAppUrl}/#/qr/${result.token}`;
    
    return result;
  } catch (error) {
    return null;
  }
}

// Show notification when MoMo page loads
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only main frame
  if (details.frameId !== 0) return;
  
  // Only MoMo payment pages
  if (!details.url || !details.url.includes('payment.momo.vn')) return;
  
  // Check if mobile rules are enabled
  const status = await checkMobileRules();
  
  if (status.enabled) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: '✅ Mobile UA Active',
      message: 'Đang sử dụng Mobile User-Agent',
      priority: 1
    });
  }
}, {
  url: [{ hostContains: 'payment.momo.vn' }]
});

// Lắng nghe khi extension icon được click
chrome.action.onClicked.addListener(async (tab) => {
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
      }
    } catch (error) {
      // Ignore
    }
  }
});
