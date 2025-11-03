// Device Emulator for Extension
// Inject mobile User-Agent and viewport to trick MoMo into showing mobile layout

/**
 * Read device info from React app (stored in localStorage)
 */
function getDeviceInfoFromReactApp() {
  try {
    // Try to get from current page's localStorage (if extension popup opened from React app)
    const stored = localStorage.getItem('momo_device_info');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Could not read device info from localStorage:', error);
  }
  
  // Default to Android mobile if no info available
  return {
    recommended: {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      viewport: {
        width: 360,
        height: 800,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      },
      platform: 'android'
    }
  };
}

/**
 * Inject mobile viewport meta tag into MoMo page
 * This makes MoMo think it's on a mobile device
 */
function injectMobileViewport(deviceInfo) {
  const viewport = deviceInfo.recommended.viewport;
  
  // Remove existing viewport meta tag
  const existing = document.querySelector('meta[name="viewport"]');
  if (existing) {
    existing.remove();
  }
  
  // Create new mobile viewport meta tag
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = `width=${viewport.width}, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui, viewport-fit=cover`;
  document.head.appendChild(meta);
  
  console.log('📱 Injected mobile viewport:', meta.content);
}

/**
 * Override navigator.userAgent (doesn't work in content script)
 * But we can log it for debugging
 */
function logUserAgent() {
  console.log('🌐 Current User-Agent:', navigator.userAgent);
  console.log('📱 Platform:', navigator.platform);
  console.log('📏 Screen:', window.screen.width, 'x', window.screen.height);
  console.log('📐 Viewport:', window.innerWidth, 'x', window.innerHeight);
}

/**
 * Detect if page is showing mobile or desktop version
 */
function detectPageVersion() {
  // Check for mobile-specific elements
  const mobileButton = document.getElementById('openMoMoApp');
  const qrMobileUI = document.getElementById('qr-mobile-ui');
  const qrPCUI = document.getElementById('qr-pc-ui');
  
  const isMobileVersion = !!(mobileButton || (qrMobileUI && qrMobileUI.style.display !== 'none'));
  const isDesktopVersion = !!(qrPCUI && qrPCUI.style.display !== 'none');
  
  console.log('🔍 Page version detection:', {
    isMobileVersion,
    isDesktopVersion,
    hasMobileButton: !!mobileButton,
    hasQRMobileUI: !!qrMobileUI,
    hasQRPCUI: !!qrPCUI
  });
  
  return {
    isMobileVersion,
    isDesktopVersion,
    needsRefresh: !isMobileVersion && !mobileButton
  };
}

/**
 * Force reload page with mobile User-Agent
 * Note: This requires webRequest API permission which we may not have
 */
function requestMobileVersion() {
  const detection = detectPageVersion();
  
  if (detection.needsRefresh) {
    console.warn('⚠️ Desktop version detected. Manual reload with mobile User-Agent required.');
    console.info('💡 Solution: Use Chrome DevTools Device Mode or install User-Agent Switcher extension');
    
    // Show warning to user
    showWarningBanner();
    
    return false;
  }
  
  return true;
}

/**
 * Show warning banner if desktop version is detected
 */
function showWarningBanner() {
  // Check if banner already exists
  if (document.getElementById('momo-extension-warning')) {
    return;
  }
  
  const banner = document.createElement('div');
  banner.id = 'momo-extension-warning';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff6b6b;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  
  banner.innerHTML = `
    <strong>⚠️ MoMo Extension Warning</strong><br>
    Desktop version detected. Deep links only available on mobile version.<br>
    <small>Enable Chrome DevTools Device Mode (F12 → Toggle Device Toolbar) and reload page.</small>
  `;
  
  document.body.prepend(banner);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    banner.style.transition = 'opacity 0.5s';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 500);
  }, 10000);
}

/**
 * Initialize device emulation
 */
function initDeviceEmulation() {
  console.log('🎭 Initializing device emulation...');
  
  // Get device info from React app
  const deviceInfo = getDeviceInfoFromReactApp();
  console.log('📱 Device info from React app:', deviceInfo);
  
  // Inject mobile viewport
  injectMobileViewport(deviceInfo);
  
  // Log current User-Agent
  logUserAgent();
  
  // Wait for page to load, then detect version
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        requestMobileVersion();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      requestMobileVersion();
    }, 1000);
  }
  
  return deviceInfo;
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDeviceInfoFromReactApp,
    injectMobileViewport,
    detectPageVersion,
    requestMobileVersion,
    initDeviceEmulation
  };
}

