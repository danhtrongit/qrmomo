// Content Script - Chạy trên trang MoMo Payment
console.log('MoMo Payment Extractor: Content script loaded');

// Config is already loaded via manifest.json
let SERVER_URL = CONFIG.SERVER_URL;

// Load config from storage
loadConfig().then((config) => {
  SERVER_URL = config.SERVER_URL;
  console.log('Content: Config loaded', config);
});

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
      
      // Tìm URL applinks.momo.vn (cho cả mobile và desktop)
      const appLinksMatch = pageContent.match(/https:\\\/\\\/applinks\.momo\.vn\\\/payment\\\/v2\?[^"]+/);
      if (appLinksMatch) {
        // Decode escaped characters
        data.momoAppLink = appLinksMatch[0].replace(/\\\//g, '/');
        console.log('MoMo App Link found:', data.momoAppLink);
      }
      
      // Tìm deep link scheme momo://
      const deepLinkMatch = pageContent.match(/momo:\\\/\\\/app\?[^"]+/);
      if (deepLinkMatch) {
        data.momoDeepLink = deepLinkMatch[0].replace(/\\\//g, '/');
        console.log('MoMo Deep Link found:', data.momoDeepLink);
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
