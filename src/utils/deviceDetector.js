// Device Detection Utility
// Phát hiện thiết bị và kích thước màn hình để extension có thể fake User-Agent

/**
 * Detect device type based on screen size and user agent
 */
export const detectDevice = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Detect mobile by screen size
  const isMobileSize = width <= 768;
  const isTabletSize = width > 768 && width <= 1024;
  const isDesktopSize = width > 1024;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  
  // Detect Android
  const isAndroid = /android/i.test(userAgent);
  
  // Detect mobile device by user agent
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Determine final device type
  let deviceType = 'desktop';
  let platform = 'unknown';
  
  if (isMobileSize || isMobileUA) {
    deviceType = 'mobile';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';
    else platform = 'mobile';
  } else if (isTabletSize) {
    deviceType = 'tablet';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';
    else platform = 'tablet';
  } else {
    deviceType = 'desktop';
    platform = 'desktop';
  }

  return {
    deviceType,    // 'mobile', 'tablet', 'desktop'
    platform,      // 'ios', 'android', 'desktop', 'tablet', 'mobile'
    width,
    height,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isIOS,
    isAndroid,
    userAgent: navigator.userAgent
  };
};

/**
 * Get recommended User-Agent for MoMo scraping
 * MoMo shows different content based on User-Agent
 */
export const getRecommendedUserAgent = (deviceInfo) => {
  // User-Agents that MoMo recognizes and shows mobile layout
  const USER_AGENTS = {
    // iOS User-Agents (latest versions)
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    
    // Android User-Agents (latest versions)
    android: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    
    // iPad (for tablet testing)
    ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    
    // Desktop (default)
    desktop: navigator.userAgent
  };

  // Recommend based on current device
  if (deviceInfo.isIOS) {
    return USER_AGENTS.ios;
  } else if (deviceInfo.isAndroid) {
    return USER_AGENTS.android;
  } else if (deviceInfo.isMobile) {
    // Default to Android for generic mobile
    return USER_AGENTS.android;
  } else if (deviceInfo.isTablet) {
    return USER_AGENTS.ipad;
  } else {
    // For desktop, recommend mobile UA to get mobile layout from MoMo
    return USER_AGENTS.android; // Use Android as default for best compatibility
  }
};

/**
 * Get viewport dimensions for mobile emulation
 */
export const getMobileViewport = (platform) => {
  const VIEWPORTS = {
    // iPhone 14 Pro
    ios: {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    },
    
    // Samsung Galaxy S23
    android: {
      width: 360,
      height: 800,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    },
    
    // iPad Pro
    tablet: {
      width: 1024,
      height: 1366,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    
    // Desktop (no emulation needed)
    desktop: null
  };

  return VIEWPORTS[platform] || VIEWPORTS.android;
};

/**
 * Create device info object to send to extension
 */
export const createDeviceInfoForExtension = () => {
  const deviceInfo = detectDevice();
  const recommendedUA = getRecommendedUserAgent(deviceInfo);
  const viewport = getMobileViewport(deviceInfo.platform);

  return {
    // Current device info
    current: deviceInfo,
    
    // Recommended settings for extension to use
    recommended: {
      userAgent: recommendedUA,
      viewport: viewport,
      platform: deviceInfo.isMobile ? deviceInfo.platform : 'android', // Force mobile for desktop users
      
      // Additional browser settings
      viewportMeta: {
        width: viewport ? viewport.width : deviceInfo.width,
        height: viewport ? viewport.height : deviceInfo.height,
        deviceScaleFactor: viewport ? viewport.deviceScaleFactor : window.devicePixelRatio,
        isMobile: true, // Always request mobile layout
        hasTouch: true,
        isLandscape: false
      }
    },
    
    // Timestamp
    timestamp: Date.now()
  };
};

/**
 * Listen for window resize and return updated device info
 */
export const onDeviceChange = (callback) => {
  const handleResize = () => {
    callback(createDeviceInfoForExtension());
  };

  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
};

export default {
  detectDevice,
  getRecommendedUserAgent,
  getMobileViewport,
  createDeviceInfoForExtension,
  onDeviceChange
};

