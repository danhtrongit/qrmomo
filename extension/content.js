// Content Script - Chạy trên trang MoMo Payment
console.log('MoMo Payment Extractor: Content script loaded');

// Config is already loaded via manifest.json
let SERVER_URL = CONFIG.SERVER_URL;

// Load config from storage
loadConfig().then((config) => {
  SERVER_URL = config.SERVER_URL;
  console.log('Content: Config loaded', config);
});

// Initialize device emulation ASAP
// This must run before page renders to get mobile version
(function initDeviceEmulation() {
  console.log('🎭 Device Emulation: Initializing...');
  
  // Try to get device info from React app
  function getDeviceInfo() {
    try {
      // Check if we're on React app page (has the device info)
      const stored = localStorage.getItem('momo_device_info');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Could not read device info:', error);
    }
    
    // Default to Android mobile
    return {
      recommended: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        viewport: { width: 360, height: 800, isMobile: true },
        platform: 'android'
      }
    };
  }
  
  const deviceInfo = getDeviceInfo();
  console.log('📱 Device info:', deviceInfo);
  
  // Inject mobile viewport meta tag
  const injectViewport = () => {
    const viewport = deviceInfo.recommended.viewport;
    const existing = document.querySelector('meta[name="viewport"]');
    if (existing) existing.remove();
    
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = `width=${viewport.width}, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui`;
    document.head.appendChild(meta);
    console.log('✅ Mobile viewport injected');
  };
  
  // Inject as early as possible
  if (document.head) {
    injectViewport();
  } else {
    const observer = new MutationObserver(() => {
      if (document.head) {
        injectViewport();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  
  // Detect page version after load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const mobileButton = document.getElementById('openMoMoApp');
      const qrMobileUI = document.getElementById('qr-mobile-ui');
      const isMobileVersion = !!(mobileButton || (qrMobileUI && qrMobileUI.style.display !== 'none'));
      
      console.log('🔍 Page version:', isMobileVersion ? 'Mobile ✅' : 'Desktop ❌');
      
      if (!isMobileVersion) {
        console.warn('⚠️ Desktop version detected!');
        
        // Check if user already tried once (prevent infinite loop)
        const reloadAttempted = sessionStorage.getItem('momo_reload_attempted');
        
        if (!reloadAttempted) {
          console.info('🔄 Attempting auto-reload to request mobile version...');
          console.info('💡 Please enable Chrome DevTools Device Mode (Ctrl+Shift+M) before this page loads');
          
          // Mark that we tried to reload
          sessionStorage.setItem('momo_reload_attempted', 'true');
          
          // Show notification banner
          showReloadNotification();
        } else {
          console.warn('⚠️ Auto-reload already attempted but still got desktop version');
          console.info('💡 IMPORTANT: You MUST enable Chrome DevTools Device Mode (F12 → Ctrl+Shift+M)');
          console.info('💡 Steps:');
          console.info('   1. Press Ctrl+Shift+M (Cmd+Shift+M on Mac)');
          console.info('   2. Select: iPhone 14 Pro or Galaxy S23');
          console.info('   3. Reload this page (Ctrl+R)');
          
          // Show instruction banner
          showInstructionBanner();
        }
      } else {
        // Clear reload attempt flag on success
        sessionStorage.removeItem('momo_reload_attempted');
        console.log('✅ Mobile version loaded successfully!');
      }
    }, 1000);
  });
  
  // Show notification banner asking user to enable device mode
  function showReloadNotification() {
    const banner = document.createElement('div');
    banner.id = 'momo-reload-notification';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: slideDown 0.5s ease-out;
    `;
    
    banner.innerHTML = `
      <style>
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        #momo-reload-notification button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin: 10px 5px 0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        #momo-reload-notification button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        #momo-reload-notification .close-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 8px 20px;
          font-size: 14px;
        }
      </style>
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="margin: 0 0 10px 0; font-size: 24px;">📱 Cần Device Mode để lấy Deep Links</h2>
        <p style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.95;">
          MoMo chỉ hiển thị nút "Thanh toán bằng Ví MoMo" và deep links khi truy cập từ mobile device.
        </p>
        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0; font-weight: 600;">Hướng dẫn nhanh:</p>
          <ol style="text-align: left; display: inline-block; margin: 0; padding-left: 20px;">
            <li>Nhấn <kbd style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+Shift+M</kbd> (hoặc <kbd style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Cmd+Shift+M</kbd> trên Mac)</li>
            <li>Chọn thiết bị: <strong>iPhone 14 Pro</strong> hoặc <strong>Galaxy S23</strong></li>
            <li>Click nút bên dưới để reload page</li>
          </ol>
        </div>
        <button onclick="window.location.reload()">
          🔄 Reload Page với Device Mode
        </button>
        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
          Đóng
        </button>
      </div>
    `;
    
    document.body.prepend(banner);
  }
  
  // Show instruction banner if reload didn't help
  function showInstructionBanner() {
    if (document.getElementById('momo-instruction-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'momo-instruction-banner';
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
      <strong>⚠️ Vẫn ở Desktop Version!</strong><br>
      Bạn PHẢI enable Chrome DevTools Device Mode <strong>TRƯỚC KHI</strong> page load.<br>
      <small>Nhấn <kbd style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">Ctrl+Shift+M</kbd> → Chọn mobile device → Reload page</small>
      <button onclick="this.parentElement.remove()" style="margin-left: 15px; background: rgba(255,255,255,0.3); border: none; color: white; padding: 5px 15px; border-radius: 4px; cursor: pointer;">Đóng</button>
    `;
    
    document.body.prepend(banner);
    
    // Auto-hide after 15 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.style.transition = 'opacity 0.5s';
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 500);
      }
    }, 15000);
  }
})();

// Hàm trích xuất thông tin từ trang MoMo
function extractPaymentData() {
  try {
    console.log('Starting data extraction...');
    console.log('Current URL:', window.location.href);
    const data = {};

    // Trích xuất QR Code
    const qrCodeImg = document.querySelector('.image-qr-code, img[alt="paymentcode"]');
    console.log('QR Code element found:', !!qrCodeImg);
    if (qrCodeImg) {
      data.qrCode = qrCodeImg.src;
      console.log('QR Code extracted:', data.qrCode.substring(0, 50) + '...');
    }

    // Trích xuất Payment URL (từ current URL hoặc data attribute)
    data.paymentUrl = window.location.href;
    
    // Trích xuất MoMo App Links từ script trong page
    try {
      const pageContent = document.documentElement.innerHTML;
      console.log('Searching for MoMo links in HTML...');
      
      // Tìm URL applinks.momo.vn với nhiều pattern khác nhau
      let appLinksMatch = 
        // Pattern 1: Escaped slashes trong JavaScript string
        pageContent.match(/https:\\\/\\\/applinks\.momo\.vn\\\/payment\\\/v2\?[^"\\]+/) ||
        // Pattern 2: Normal URL trong HTML
        pageContent.match(/https:\/\/applinks\.momo\.vn\/payment\/v2\?[^"\s<>]+/) ||
        // Pattern 3: URL-encoded
        pageContent.match(/https%3A%2F%2Fapplinks\.momo\.vn%2Fpayment%2Fv2\?[^"\s<>&]+/);
      
      if (appLinksMatch) {
        // Decode escaped characters và URL encoding
        let link = appLinksMatch[0]
          .replace(/\\\//g, '/')  // Unescape slashes
          .replace(/\\u0026/g, '&')  // Decode unicode ampersand
          .replace(/%3A/g, ':')  // Decode URL encoding
          .replace(/%2F/g, '/')
          .replace(/%3F/g, '?')
          .replace(/%3D/g, '=')
          .replace(/%26/g, '&');
        data.momoAppLink = link;
        console.log('✅ MoMo App Link found:', data.momoAppLink);
      } else {
        console.log('❌ MoMo App Link NOT found');
      }
      
      // Tìm deep link scheme momo:// với nhiều pattern
      let deepLinkMatch = 
        // Pattern 1: Escaped trong JavaScript
        pageContent.match(/momo:\\\/\\\/app\?[^"\\]+/) ||
        // Pattern 2: Normal trong HTML
        pageContent.match(/momo:\/\/app\?[^"\s<>]+/);
      
      if (deepLinkMatch) {
        let link = deepLinkMatch[0]
          .replace(/\\\//g, '/')
          .replace(/\\u0026/g, '&');
        data.momoDeepLink = link;
        console.log('✅ MoMo Deep Link found:', data.momoDeepLink);
      } else {
        console.log('❌ MoMo Deep Link NOT found');
      }
      
      // Debug: Log một đoạn HTML chứa "applinks" nếu tìm thấy
      if (pageContent.includes('applinks.momo.vn')) {
        const sampleIndex = pageContent.indexOf('applinks.momo.vn');
        const sample = pageContent.substring(Math.max(0, sampleIndex - 50), sampleIndex + 200);
        console.log('📄 Sample HTML containing applinks:', sample);
      }
      
    } catch (error) {
      console.error('Error extracting MoMo links:', error);
    }

    // Trích xuất thông tin nhà cung cấp
    const merchantName = document.querySelector('.merchant-name');
    console.log('Merchant element found:', !!merchantName);
    if (merchantName) {
      data.merchant = merchantName.textContent.trim();
      console.log('Merchant:', data.merchant);
    }

    // Trích xuất logo nhà cung cấp
    const merchantLogo = document.querySelector('.merchant-logo');
    if (merchantLogo) {
      data.merchantLogo = merchantLogo.src;
    }

    // Trích xuất mã đơn hàng
    const orderIdElements = document.querySelectorAll('.box-detail');
    console.log('Box detail elements found:', orderIdElements.length);
    orderIdElements.forEach(box => {
      const label = box.querySelector('h4');
      if (label && label.textContent.includes('Mã đơn hàng')) {
        const value = box.querySelector('p');
        if (value) {
          data.orderId = value.textContent.trim();
        }
      }
    });

    // Trích xuất mô tả
    orderIdElements.forEach(box => {
      const label = box.querySelector('h4');
      if (label && label.textContent.includes('Mô tả')) {
        const value = box.querySelector('p');
        if (value) {
          data.description = value.textContent.trim();
        }
      }
    });

    // Trích xuất số tiền
    orderIdElements.forEach(box => {
      const label = box.querySelector('h4');
      if (label && label.textContent.includes('Số tiền')) {
        const value = box.querySelector('h3');
        if (value) {
          const amountText = value.textContent.trim().replace(/[đ,\.]/g, '');
          data.amount = parseInt(amountText) || amountText;
        }
      }
    });

    // Trích xuất thời gian đếm ngược
    const countdownElement = document.querySelector('span[name="expiredAt"]');
    if (countdownElement) {
      const timeBoxes = countdownElement.querySelectorAll('.time-box');
      if (timeBoxes.length >= 2) {
        const minutes = parseInt(timeBoxes[0].textContent.trim()) || 0;
        const seconds = parseInt(timeBoxes[1].textContent.trim()) || 0;
        data.countdown = minutes * 60 + seconds;
      }
    }

    // Trích xuất từ meta tags
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      const content = ogDescription.getAttribute('content');
      if (content && !data.merchant) {
        const merchantMatch = content.match(/Nhà cung cấp:\s*([^\n\.]+)/);
        if (merchantMatch) data.merchant = merchantMatch[1].trim();
      }
      if (content && !data.orderId) {
        const orderMatch = content.match(/Mã đơn hàng:\s*([^\n\.]+)/);
        if (orderMatch) data.orderId = orderMatch[1].trim();
      }
      if (content && !data.amount) {
        const amountMatch = content.match(/Số tiền:\s*([\d,\.]+)/);
        if (amountMatch) {
          const amountText = amountMatch[1].replace(/[,\.]/g, '');
          data.amount = parseInt(amountText) || amountText;
        }
      }
      if (content && !data.description) {
        const descMatch = content.match(/Mô tả:\s*([^\n]+)/);
        if (descMatch) data.description = descMatch[1].trim();
      }
    }

    const dataKeys = Object.keys(data);
    console.log('Extracted payment data keys:', dataKeys);
    console.log('Extracted payment data:', data);
    console.log('Data is empty?', dataKeys.length === 0);
    
    return data;
  } catch (error) {
    console.error('Error extracting payment data:', error);
    return null;
  }
}

// Hàm gửi dữ liệu qua WebSocket Server
async function sendDataToServer(token, data) {
  try {
    // Get latest config
    const config = await loadConfig();
    const serverUrl = config.SERVER_URL;
    
    const response = await fetch(`${serverUrl}/api/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, data })
    });
    
    const result = await response.json();
    console.log('Data sent to server:', result);
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error);
    return null;
  }
}

// Hàm quan sát thay đổi DOM để cập nhật countdown
function observeCountdown(token) {
  const countdownElement = document.querySelector('span[name="expiredAt"]');
  if (!countdownElement) return;

  const observer = new MutationObserver(() => {
    const data = extractPaymentData();
    if (data) {
      sendDataToServer(token, data);
    }
  });

  observer.observe(countdownElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  console.log('Countdown observer started for token:', token);
}

// Khởi động khi trang load xong
function init() {
  console.log('MoMo Payment Extractor ready. Click extension icon to extract data.');
}

// Lắng nghe message từ background script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_DATA') {
    console.log('Manual extraction requested...');
    
    // Generate token hoặc nhận token từ background
    chrome.runtime.sendMessage({ type: 'GENERATE_TOKEN' }, async (response) => {
      if (response && response.token) {
        const token = response.token;
        const reactUrl = response.url;
        
        console.log('Using token:', token);
        console.log('React URL:', reactUrl);
        
        const data = extractPaymentData();
        
        if (data && Object.keys(data).length > 0) {
          // Gửi dữ liệu qua server
          const result = await sendDataToServer(token, data);
          
          if (result && result.success) {
            // Bắt đầu quan sát countdown
            observeCountdown(token);
            
            // Cập nhật định kỳ mỗi 5 giây
            if (window.momoUpdateInterval) {
              clearInterval(window.momoUpdateInterval);
            }
            
            window.momoUpdateInterval = setInterval(async () => {
              const updatedData = extractPaymentData();
              if (updatedData && Object.keys(updatedData).length > 0) {
                await sendDataToServer(token, updatedData);
              }
            }, 5000);
            
            sendResponse({ 
              success: true, 
              data, 
              token,
              url: reactUrl
            });
          } else {
            sendResponse({ success: false, error: 'Failed to send data to server' });
          }
        } else {
          sendResponse({ success: false, data: null, error: 'No payment data found' });
        }
      } else {
        sendResponse({ success: false, error: 'Failed to generate token' });
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  return true;
});

// Khởi động
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
