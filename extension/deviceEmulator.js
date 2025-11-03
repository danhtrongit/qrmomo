/**
 * Chrome DevTools Protocol (CDP) Device Emulator
 * Tự động emulate mobile device 100% không cần thủ công
 */

// Mobile device presets
const DEVICE_PRESETS = {
  'iPhone 14 Pro': {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      mobile: true,
      hasTouch: true
    },
    platform: 'iOS'
  },
  'iPhone 15 Pro Max': {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: {
      width: 430,
      height: 932,
      deviceScaleFactor: 3,
      mobile: true,
      hasTouch: true
    },
    platform: 'iOS'
  },
  'Samsung Galaxy S23': {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: {
      width: 360,
      height: 780,
      deviceScaleFactor: 3,
      mobile: true,
      hasTouch: true
    },
    platform: 'Android'
  },
  'Samsung Galaxy S23 Ultra': {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: {
      width: 412,
      height: 915,
      deviceScaleFactor: 3.5,
      mobile: true,
      hasTouch: true
    },
    platform: 'Android'
  },
  'Pixel 7 Pro': {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: {
      width: 412,
      height: 892,
      deviceScaleFactor: 3.5,
      mobile: true,
      hasTouch: true
    },
    platform: 'Android'
  }
};

/**
 * Emulate mobile device using Chrome DevTools Protocol
 * @param {number} tabId - Chrome tab ID
 * @param {string} deviceName - Device preset name (default: 'Samsung Galaxy S23')
 * @returns {Promise<Object>} Result with success status
 */
async function emulateMobileDevice(tabId, deviceName = 'Samsung Galaxy S23') {
  try {
    // Get device preset
    const device = DEVICE_PRESETS[deviceName];
    if (!device) {
      throw new Error(`Unknown device preset: ${deviceName}`);
    }
    
    // Step 1: Attach debugger to tab
    await chrome.debugger.attach({ tabId }, '1.3');
    
    // Step 2: Enable necessary domains
    await chrome.debugger.sendCommand({ tabId }, 'Emulation.enable');
    await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
    
    // Step 3: Set device metrics (viewport, scale, mobile)
    await chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
      width: device.viewport.width,
      height: device.viewport.height,
      deviceScaleFactor: device.viewport.deviceScaleFactor,
      mobile: device.viewport.mobile,
      screenOrientation: {
        type: 'portraitPrimary',
        angle: 0
      }
    });
    
    // Step 4: Enable touch emulation
    await chrome.debugger.sendCommand({ tabId }, 'Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });
    
    // Step 5: Override User-Agent
    await chrome.debugger.sendCommand({ tabId }, 'Network.setUserAgentOverride', {
      userAgent: device.userAgent,
      platform: device.platform
    });
    
    // Step 6: Set viewport meta tag via script injection
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (width) => {
        const existing = document.querySelector('meta[name="viewport"]');
        if (existing) existing.remove();
        
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = `width=${width}, initial-scale=1, maximum-scale=1, user-scalable=no`;
        document.head.appendChild(meta);
      },
      args: [device.viewport.width]
    });
    
    // Step 7: Reload page to apply all changes
    await chrome.debugger.sendCommand({ tabId }, 'Page.reload', {
      ignoreCache: true
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      device: deviceName,
      viewport: device.viewport,
      message: `Successfully emulated ${deviceName}`
    };
    
  } catch (error) {
    // Try to detach debugger if attached
    try {
      await chrome.debugger.detach({ tabId });
    } catch (detachError) {
      // Silent error handling
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detach debugger from tab
 * @param {number} tabId - Chrome tab ID
 */
async function stopEmulation(tabId) {
  try {
    await chrome.debugger.detach({ tabId });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if debugger is attached to tab
 * @param {number} tabId - Chrome tab ID
 */
async function isEmulationActive(tabId) {
  try {
    const targets = await chrome.debugger.getTargets();
    return targets.some(target => target.tabId === tabId && target.attached);
  } catch (error) {
    return false;
  }
}

/**
 * Get list of available device presets
 */
function getDevicePresets() {
  return Object.keys(DEVICE_PRESETS).map(name => ({
    name,
    ...DEVICE_PRESETS[name]
  }));
}

/**
 * Auto-detect and emulate for MoMo payment pages
 * @param {number} tabId - Chrome tab ID
 * @param {string} url - Tab URL
 */
async function autoEmulateMoMoPage(tabId, url) {
  // Only emulate for MoMo payment pages
  if (!url || !url.includes('payment.momo.vn')) {
    return { success: false, message: 'Not a MoMo payment page' };
  }
  
  // Check if already emulating
  const isActive = await isEmulationActive(tabId);
  if (isActive) {
    return { success: true, message: 'Already emulating' };
  }
  
  // Start emulation with default device (Samsung Galaxy S23)
  const result = await emulateMobileDevice(tabId, 'Samsung Galaxy S23');
  
  if (result.success) {
    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: '✅ Mobile Emulation Active',
      message: `Đang giả lập ${result.device}. Trang sẽ tự động reload.`,
      priority: 2
    });
  }
  
  return result;
}

// Listen for debugger detach (when user closes DevTools or tab)
chrome.debugger.onDetach.addListener((source, reason) => {
  // Silent event handling
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    emulateMobileDevice,
    stopEmulation,
    isEmulationActive,
    getDevicePresets,
    autoEmulateMoMoPage,
    DEVICE_PRESETS
  };
}
