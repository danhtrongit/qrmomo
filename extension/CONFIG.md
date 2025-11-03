# 🔧 Cấu hình Extension

## 📍 Tệp cấu hình: `config.js`

File `config.js` chứa tất cả các thiết lập về domain/port cho Extension.

```javascript
const CONFIG = {
  // Server Configuration (Backend/WebSocket)
  SERVER_URL: 'http://localhost:4105',
  WS_URL: 'ws://localhost:4105',
  
  // React App Configuration (Frontend)
  REACT_APP_URL: 'http://localhost:4104',
};
```

## 🎯 Cách Thay Đổi Cổng/Domain

### 1. Chỉnh sửa `extension/config.js`

Mở file và thay đổi các giá trị:

```javascript
const CONFIG = {
  // Ví dụ: Chạy trên port khác
  SERVER_URL: 'http://localhost:8080',
  WS_URL: 'ws://localhost:8080',
  REACT_APP_URL: 'http://localhost:3000',
};
```

### 2. Production/Remote Server

Nếu deploy lên server thực:

```javascript
const CONFIG = {
  SERVER_URL: 'https://api.yourdomain.com',
  WS_URL: 'wss://api.yourdomain.com',
  REACT_APP_URL: 'https://app.yourdomain.com',
};
```

⚠️ **Lưu ý**: Khi deploy production, cần:
- Dùng `wss://` thay vì `ws://` (WebSocket Secure)
- Dùng `https://` thay vì `http://`
- Cấu hình SSL Certificate

### 3. Cập nhật `manifest.json`

Sau khi thay đổi port/domain, cần cập nhật `host_permissions` trong `manifest.json`:

```json
{
  "host_permissions": [
    "https://payment.momo.vn/*",
    "http://localhost:4104/*",
    "http://localhost:4105/*",
    "file:///*"
  ]
}
```

Nếu deploy production:

```json
{
  "host_permissions": [
    "https://payment.momo.vn/*",
    "https://app.yourdomain.com/*",
    "https://api.yourdomain.com/*",
    "file:///*"
  ]
}
```

### 4. Reload Extension

Sau khi thay đổi:
1. Mở `chrome://extensions/`
2. Tìm "MoMo Payment Extractor"
3. Click nút **🔄 Reload**

## 🔍 Files Sử Dụng Config

### Extension Files:
- `config.js` - Main config file
- `background.js` - Uses `CONFIG.SERVER_URL`, `CONFIG.REACT_APP_URL`
- `content.js` - Uses `CONFIG.SERVER_URL`
- `popup.js` - Uses `CONFIG.REACT_APP_URL`

### React App:
- `src/config.js` - React app config (độc lập với extension)
- `src/pages/QRPage.js` - Uses WebSocket URL

## 📋 Checklist Khi Đổi Cổng

- [ ] Cập nhật `extension/config.js`
- [ ] Cập nhật `manifest.json` host_permissions
- [ ] Cập nhật `ecosystem.config.js` (PM2 config)
- [ ] Cập nhật `src/config.js` (React config)
- [ ] Reload Extension trong Chrome
- [ ] Restart PM2: `npm run pm2:restart`
- [ ] Kiểm tra health: `curl http://localhost:[PORT]/health`

## 🚀 Ví dụ: Chuyển từ 3000/3001 sang 4104/4105

### 1. Extension config.js
```javascript
// CŨ
SERVER_URL: 'http://localhost:3001',
REACT_APP_URL: 'http://localhost:3000',

// MỚI
SERVER_URL: 'http://localhost:4105',
REACT_APP_URL: 'http://localhost:4104',
```

### 2. React src/config.js
```javascript
// CŨ
WS_URL: 'ws://localhost:3001',

// MỚI
WS_URL: 'ws://localhost:4105',
```

### 3. PM2 ecosystem.config.js
```javascript
// WebSocket Server
env: {
  PORT: 4105  // Đổi từ 3001
}

// React App
env: {
  PORT: 4104  // Đổi từ 3000
}
```

### 4. Restart
```bash
npm run pm2:restart
```

## 🔐 Security Tips

### Development:
- ✅ `http://` và `ws://` OK
- ✅ `localhost` OK

### Production:
- ❌ **KHÔNG** dùng `http://` hay `ws://`
- ✅ Dùng `https://` và `wss://`
- ✅ Cấu hình CORS đúng
- ✅ Thêm authentication
- ✅ Giới hạn host_permissions

## 📱 Test Sau Khi Đổi Config

1. **Test WebSocket Server:**
   ```bash
   curl http://localhost:4105/health
   ```

2. **Test React App:**
   ```bash
   curl -I http://localhost:4104
   ```

3. **Test Extension:**
   - Mở trang MoMo
   - Click extension icon
   - Click "Trích xuất thông tin"
   - Xem console logs

4. **Test Full Flow:**
   - Load extension
   - Open MoMo payment page
   - Extract data
   - Verify React app opens with correct URL
   - Check data displays correctly

## ❓ Troubleshooting

### Extension không kết nối được Server

1. Kiểm tra `config.js` có đúng URL không
2. Kiểm tra Server đang chạy: `npm run pm2:status`
3. Kiểm tra `manifest.json` có permission đúng không
4. Reload extension

### React App không nhận được data

1. Kiểm tra WebSocket URL trong `src/config.js`
2. Xem Console logs trong browser
3. Kiểm tra PM2 logs: `npm run pm2:logs`
4. Verify health endpoint: `curl http://localhost:4105/health`

### CORS errors

Nếu gặp lỗi CORS:
- Kiểm tra `server/server.js` có `app.use(cors())` không
- Kiểm tra `manifest.json` có permission đúng domain không

---

💡 **Tip**: Sau mỗi lần thay đổi config, nên:
1. Reload Extension
2. Restart PM2
3. Clear browser cache
4. Test lại toàn bộ flow

