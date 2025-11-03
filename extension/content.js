// Content Script - Chạy trên trang MoMo Payment

// Config is already loaded via manifest.json
let SERVER_URL = CONFIG.SERVER_URL;

// Load config from storage
loadConfig().then((config) => {
  SERVER_URL = config.SERVER_URL;
});

// Initialize device emulation ASAP
// This must run before page renders to get mobile version
(function initDeviceEmulation() {
  // Detect page version after load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const mobileButton = document.getElementById('openMoMoApp');
      const qrMobileUI = document.getElementById('qr-mobile-ui');
      const isMobileVersion = !!(mobileButton || (qrMobileUI && qrMobileUI.style.display !== 'none'));
      
      console.log('📱 Detected page version:', isMobileVersion ? 'Mobile' : 'Desktop');
      
      // Detect current device type from browser
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTablet = /ipad|tablet/i.test(userAgent.toLowerCase());
      
      console.log('📱 Browser User-Agent indicates:', isMobileDevice ? 'Mobile' : 'Desktop');
      console.log('📱 Screen width:', window.innerWidth);
      
      // Auto-enable mobile UA if user is on mobile device but seeing desktop version
      if (isMobileDevice && !isMobileVersion) {
        console.log('⚠️ Mobile device but desktop version detected!');
        console.log('🔄 Auto-enabling Mobile UA rules...');
        
        // Ask background to enable mobile UA
        chrome.runtime.sendMessage({ 
          type: 'ENABLE_MOBILE_UA',
          auto: true 
        }, (response) => {
          if (response && response.success) {
            console.log('✅ Mobile UA enabled, reloading page...');
            // Reload to apply mobile UA
            setTimeout(() => location.reload(), 500);
          }
        });
      } else if (isMobileVersion) {
        // Mobile version detected - auto-extract after a delay
        console.log('✅ Mobile version loaded, auto-extracting in 3 seconds...');
        setTimeout(() => {
          autoExtractAndSend();
        }, 3000);
      }
    }, 1000);
  });
})();

// Auto-extract and send data when page is ready
async function autoExtractAndSend() {
  console.log('🤖 AUTO-EXTRACT: Starting...');
  
  // Check if already extracted recently (avoid duplicate)
  const lastExtractTime = localStorage.getItem('momo_last_extract_time');
  const currentTime = Date.now();
  if (lastExtractTime && (currentTime - parseInt(lastExtractTime)) < 10000) {
    console.log('⏭️ AUTO-EXTRACT: Recently extracted, skipping...');
    return;
  }
  
  // Mark as extracted
  localStorage.setItem('momo_last_extract_time', currentTime.toString());
  
  // Generate token
  chrome.runtime.sendMessage({ type: 'GENERATE_TOKEN' }, async (response) => {
    if (!response || !response.token) {
      console.error('❌ AUTO-EXTRACT: Failed to generate token');
      return;
    }
    
    console.log('🎫 AUTO-EXTRACT: Token generated:', response.token);
    const token = response.token;
    const reactUrl = response.url;
    
    // Extract data
    const data = extractPaymentData();
    
    if (!data || Object.keys(data).length === 0) {
      console.error('❌ AUTO-EXTRACT: No payment data found');
      return;
    }
    
    console.log('✅ AUTO-EXTRACT: Data extracted successfully');
    
    // Send to server
    const result = await sendDataToServer(token, data);
    
    if (result && result.success) {
      console.log('✅ AUTO-EXTRACT: Data sent to server');
      
      // Start countdown observer
      observeCountdown(token);
      
      // Auto-update every 5 seconds
      if (window.momoUpdateInterval) {
        clearInterval(window.momoUpdateInterval);
      }
      
      window.momoUpdateInterval = setInterval(async () => {
        const updatedData = extractPaymentData();
        if (updatedData && Object.keys(updatedData).length > 0) {
          await sendDataToServer(token, updatedData);
        }
      }, 5000);
      
      // Show notification
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title: '✅ Tự động trích xuất thành công',
        message: 'Dữ liệu đã được gửi đến React App'
      });
      
      // Auto-open React app in new tab (if not already open)
      chrome.runtime.sendMessage({
        type: 'AUTO_OPEN_REACT_APP',
        url: reactUrl
      });
      
    } else {
      console.error('❌ AUTO-EXTRACT: Failed to send data to server');
    }
  });
}

// Hàm trích xuất thông tin từ trang MoMo
function extractPaymentData() {
  try {
    console.log('🔍 Starting extraction...');
    console.log('📄 Page URL:', window.location.href);
    console.log('📄 Page title:', document.title);
    
    const data = {};

    // Trích xuất QR Code
    const qrCodeImg = document.querySelector('.image-qr-code, img[alt="paymentcode"]');
    console.log('🖼️ QR Code element:', qrCodeImg);
    if (qrCodeImg) {
      data.qrCode = qrCodeImg.src;
      console.log('✅ QR Code found:', data.qrCode.substring(0, 50));
    } else {
      console.log('❌ QR Code NOT found');
    }

    // Trích xuất Payment URL (từ current URL hoặc data attribute)
    data.paymentUrl = window.location.href;
    
    // Trích xuất MoMo App Links từ script trong page
    try {
      const pageContent = document.documentElement.innerHTML;
      
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
      }
      
    } catch (error) {
      // Silent error handling
    }

    // Trích xuất thông tin nhà cung cấp
    const merchantName = document.querySelector('.merchant-name');
    console.log('🏪 Merchant element:', merchantName);
    if (merchantName) {
      data.merchant = merchantName.textContent.trim();
      console.log('✅ Merchant:', data.merchant);
    } else {
      console.log('❌ Merchant NOT found');
    }

    // Trích xuất logo nhà cung cấp
    const merchantLogo = document.querySelector('.merchant-logo');
    if (merchantLogo) {
      data.merchantLogo = merchantLogo.src;
    }

    // Trích xuất mã đơn hàng
    const orderIdElements = document.querySelectorAll('.box-detail');
    console.log('📦 Box detail elements:', orderIdElements.length);
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
    
    console.log('📊 Final extracted data:', data);
    console.log('📊 Data keys:', Object.keys(data));
    console.log('📊 Data empty?', Object.keys(data).length === 0);
    
    return data;
  } catch (error) {
    console.error('❌ Extraction error:', error);
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
    return result;
  } catch (error) {
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
}

// Khởi động khi trang load xong
function init() {
  // Silent initialization
}

// Lắng nghe message từ background script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_DATA') {
    console.log('📨 Received EXTRACT_DATA message');
    console.log('📄 Current URL:', window.location.href);
    console.log('📄 Document ready state:', document.readyState);
    
    // Generate token hoặc nhận token từ background
    chrome.runtime.sendMessage({ type: 'GENERATE_TOKEN' }, async (response) => {
      console.log('🎫 Token response:', response);
      if (response && response.token) {
        const token = response.token;
        const reactUrl = response.url;
        
        const data = extractPaymentData();
        console.log('📊 Extracted data:', data);
        console.log('📊 Data has keys?', data && Object.keys(data).length > 0);
        
        if (data && Object.keys(data).length > 0) {
          console.log('✅ Data is valid, sending to server...');
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
            console.log('❌ Failed to send data to server');
            sendResponse({ success: false, error: 'Failed to send data to server' });
          }
        } else {
          console.log('❌ No payment data found - data:', data);
          console.log('❌ Possible reasons:');
          console.log('   1. Not on MoMo payment page');
          console.log('   2. Page structure changed');
          console.log('   3. Page not fully loaded');
          console.log('   4. Content script not injected properly');
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
