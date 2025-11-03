// Popup Script
// Config is already loaded via popup.html
document.addEventListener('DOMContentLoaded', async () => {
  // Load config first
  await loadConfig();
  
  const extractBtn = document.getElementById('extractBtn');
  const emulateMobileBtn = document.getElementById('emulateMobileBtn');
  const configBtn = document.getElementById('configBtn');
  const momoStatus = document.getElementById('momoStatus');
  const momoStatusText = document.getElementById('momoStatusText');
  const reactStatus = document.getElementById('reactStatus');
  const reactStatusText = document.getElementById('reactStatusText');
  const messageEl = document.getElementById('message');
  const configPanel = document.getElementById('configPanel');
  const serverUrlInput = document.getElementById('serverUrl');
  const reactAppUrlInput = document.getElementById('reactAppUrl');
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  const cancelConfigBtn = document.getElementById('cancelConfigBtn');
  const resetConfigBtn = document.getElementById('resetConfigBtn');

  // Hàm hiển thị message
  function showMessage(text, duration = 3000) {
    messageEl.textContent = text;
    messageEl.classList.add('show');
    setTimeout(() => {
      messageEl.classList.remove('show');
    }, duration);
  }

  // Kiểm tra trạng thái
  async function checkStatus() {
    try {
      // Kiểm tra tab hiện tại có phải MoMo không
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (currentTab.url && currentTab.url.includes('payment.momo.vn')) {
        momoStatus.classList.add('active');
        momoStatus.classList.remove('inactive');
        momoStatusText.textContent = '✅ Đang ở trang MoMo';
        extractBtn.disabled = false;
      } else {
        momoStatus.classList.add('inactive');
        momoStatus.classList.remove('active');
        momoStatusText.textContent = '❌ Không phải trang MoMo';
        extractBtn.disabled = true;
      }

      // Kiểm tra React App
      const tabs = await chrome.tabs.query({});
      const reactTab = tabs.find(tab => tab.url && tab.url.startsWith(CONFIG.REACT_APP_URL));
      
      if (reactTab) {
        reactStatus.classList.add('active');
        reactStatus.classList.remove('inactive');
        reactStatusText.textContent = '✅ React App đang chạy';
      } else {
        reactStatus.classList.add('inactive');
        reactStatus.classList.remove('active');
        reactStatusText.textContent = '⚠️ React App chưa mở';
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Emulate Mobile Device
  emulateMobileBtn.addEventListener('click', async () => {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!currentTab.url || !currentTab.url.includes('payment.momo.vn')) {
        showMessage('⚠️ Vui lòng mở trang thanh toán MoMo!');
        return;
      }

      emulateMobileBtn.textContent = '⏳ Đang emulate...';
      emulateMobileBtn.disabled = true;

      // Gửi message đến background để emulate
      chrome.runtime.sendMessage({ 
        type: 'EMULATE_MOBILE',
        tabId: currentTab.id,
        url: currentTab.url
      }, (response) => {
        emulateMobileBtn.textContent = '📱 Emulate Mobile (Auto)';
        emulateMobileBtn.disabled = false;

        if (chrome.runtime.lastError) {
          showMessage('❌ Lỗi: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          showMessage('✅ Emulation thành công! Trang đang reload...', 3000);
        } else {
          showMessage('⚠️ ' + (response?.error || response?.message || 'Không thể emulate'));
        }
      });
    } catch (error) {
      showMessage('❌ Có lỗi xảy ra: ' + error.message);
      emulateMobileBtn.textContent = '📱 Emulate Mobile (Auto)';
      emulateMobileBtn.disabled = false;
    }
  });

  // Trích xuất thông tin
  extractBtn.addEventListener('click', async () => {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!currentTab.url || !currentTab.url.includes('payment.momo.vn')) {
        showMessage('⚠️ Vui lòng mở trang thanh toán MoMo!');
        return;
      }

      extractBtn.textContent = '⏳ Đang trích xuất...';
      extractBtn.disabled = true;

      // Gửi message đến content script
      chrome.tabs.sendMessage(currentTab.id, { type: 'EXTRACT_DATA' }, (response) => {
        extractBtn.textContent = '🔍 Trích xuất thông tin';
        extractBtn.disabled = false;

        if (chrome.runtime.lastError) {
          showMessage('❌ Lỗi: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          showMessage('✅ Trích xuất thành công! Đang mở React App...');
          
          // TỰ ĐỘNG mở React App với URL có token
          if (response.url) {
            chrome.tabs.create({ 
              url: response.url, 
              active: true // Focus vào tab mới
            });
          }
        } else {
          showMessage('⚠️ Không tìm thấy thông tin thanh toán');
        }
      });
    } catch (error) {
      showMessage('❌ Có lỗi xảy ra: ' + error.message);
      extractBtn.textContent = '🔍 Trích xuất thông tin';
      extractBtn.disabled = false;
    }
  });

  // Toggle config panel
  configBtn.addEventListener('click', () => {
    if (configPanel.style.display === 'none') {
      // Show config panel and load current values
      const currentConfig = getConfig();
      serverUrlInput.value = currentConfig.SERVER_URL;
      reactAppUrlInput.value = currentConfig.REACT_APP_URL;
      configPanel.style.display = 'block';
      configBtn.textContent = '❌ Đóng cấu hình';
    } else {
      // Hide config panel
      configPanel.style.display = 'none';
      configBtn.textContent = '⚙️ Cấu hình';
    }
  });

  // Save config
  saveConfigBtn.addEventListener('click', async () => {
    const newConfig = {
      SERVER_URL: serverUrlInput.value.trim(),
      REACT_APP_URL: reactAppUrlInput.value.trim(),
    };

    // Validate URLs
    if (!newConfig.SERVER_URL || !newConfig.REACT_APP_URL) {
      showMessage('⚠️ Vui lòng nhập đầy đủ URL!');
      return;
    }

    // Validate URL format
    try {
      new URL(newConfig.SERVER_URL);
      new URL(newConfig.REACT_APP_URL);
    } catch (error) {
      showMessage('⚠️ URL không hợp lệ!');
      return;
    }

    // Save config
    const saved = await saveConfig(newConfig);
    if (saved) {
      showMessage('✅ Đã lưu cấu hình! Đang reload extension...');
      
      // Reload extension after 1 second
      setTimeout(() => {
        chrome.runtime.reload();
      }, 1000);
    } else {
      showMessage('❌ Lỗi khi lưu cấu hình!');
    }
  });

  // Cancel config
  cancelConfigBtn.addEventListener('click', () => {
    configPanel.style.display = 'none';
    configBtn.textContent = '⚙️ Cấu hình';
  });

  // Reset config
  resetConfigBtn.addEventListener('click', async () => {
    if (confirm('Bạn có chắc muốn reset về cấu hình mặc định?')) {
      const reset = await resetConfig();
      if (reset) {
        showMessage('✅ Đã reset cấu hình! Đang reload extension...');
        
        // Reload extension after 1 second
        setTimeout(() => {
          chrome.runtime.reload();
        }, 1000);
      } else {
        showMessage('❌ Lỗi khi reset cấu hình!');
      }
    }
  });

  // Kiểm tra trạng thái khi mở popup
  await checkStatus();

  // Refresh trạng thái mỗi 2 giây
  setInterval(checkStatus, 2000);
});

