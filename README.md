# 🎫 MoMo Payment Extractor

> Chrome Extension + React App để trích xuất và hiển thị thông tin thanh toán MoMo theo thời gian thực

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.x-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Tổng quan

Hệ thống bao gồm 3 phần:

1. **Chrome Extension** - Trích xuất thông tin từ trang thanh toán MoMo
2. **WebSocket Server** (Node.js + Express) - Xử lý và phân phối dữ liệu real-time
3. **React App** - Hiển thị thông tin thanh toán với giao diện đẹp mắt

### ✨ Tính năng

- ✅ Trích xuất tự động thông tin thanh toán từ trang MoMo
- ✅ Hiển thị real-time qua WebSocket
- ✅ Hỗ trợ nhiều trang thanh toán đồng thời với token riêng biệt
- ✅ Giao diện đẹp mắt, giống trang MoMo
- ✅ Countdown timer tự động cập nhật
- ✅ Quản lý process với PM2
- ✅ Cấu hình linh hoạt cho port/domain

## 🚀 Quick Start

### 1. Cài đặt Dependencies

```bash
cd /Users/danhtrong.it/Documents/projects/momo-qr
npm run install:all
```

### 2. Khởi động ứng dụng với PM2

```bash
npm run pm2:start
```

Hoặc development mode:

```bash
npm run dev
```

### 3. Load Extension vào Chrome

1. Mở Chrome, gõ: `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked"
4. Chọn thư mục: `extension/`
5. Bật "Allow access to file URLs"

### 4. Sử dụng

1. Mở trang thanh toán MoMo (hoặc file `momo.html`)
2. Click icon extension trên toolbar
3. Click "🔍 Trích xuất thông tin"
4. React app sẽ tự động mở với thông tin thanh toán

## 📦 Cấu trúc Project

```
momo-qr/
├── extension/              # Chrome Extension
│   ├── manifest.json       # Extension manifest
│   ├── config.js          # 🔧 Cấu hình URL/Port
│   ├── background.js      # Background service worker
│   ├── content.js         # Content script (extract data)
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   └── CONFIG.md          # Hướng dẫn cấu hình
│
├── server/                # WebSocket Server
│   ├── server.js          # Main server file
│   ├── package.json       # Server dependencies
│   └── README.md          # Server docs
│
├── src/                   # React App
│   ├── config.js          # 🔧 React config
│   ├── App.js             # Main app (routing)
│   ├── components/        # React components
│   │   ├── PaymentCard.js # Payment info card
│   │   └── PaymentCard.css
│   └── pages/             # React pages
│       ├── HomePage.js    # Landing page
│       └── QRPage.js      # QR/Payment display page
│
├── logs/                  # PM2 logs (auto-created)
├── ecosystem.config.js    # 🔧 PM2 configuration
├── package.json           # Main package.json
├── START.md              # 📖 Hướng dẫn khởi động
└── README.md             # This file
```

## ⚙️ Cấu hình

### Ports Mặc định

- **React App**: `http://localhost:4104`
- **WebSocket Server**: `http://localhost:4105` / `ws://localhost:4105`

### Thay đổi Port/Domain

Xem chi tiết: [`extension/CONFIG.md`](extension/CONFIG.md)

**Các file cần sửa:**

1. **Extension**: `extension/config.js`
   ```javascript
   const CONFIG = {
     SERVER_URL: 'http://localhost:4105',
     WS_URL: 'ws://localhost:4105',
     REACT_APP_URL: 'http://localhost:4104',
   };
   ```

2. **PM2**: `ecosystem.config.js`
   ```javascript
   env: {
     PORT: 4105  // WebSocket Server
     PORT: 4104  // React App
   }
   ```

3. **React**: `src/config.js`
   ```javascript
   WS_URL: 'ws://localhost:4105'
   ```

4. **Permissions**: `extension/manifest.json`
   ```json
   "host_permissions": [
     "http://localhost:4104/*",
     "http://localhost:4105/*"
   ]
   ```

## 🎮 Sử dụng PM2

### Các lệnh cơ bản

```bash
# Khởi động
npm run pm2:start

# Xem trạng thái
pm2 status

# Xem logs real-time
npm run pm2:logs

# Monitor dashboard
npm run pm2:monit

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop

# Xóa khỏi PM2
npm run pm2:delete
```

### Logs

Logs được lưu trong `logs/`:
- `websocket-out.log` - WebSocket server output
- `websocket-error.log` - WebSocket server errors
- `react-out.log` - React app output
- `react-error.log` - React app errors

Xem logs:
```bash
# Real-time
pm2 logs

# Hoặc
tail -f logs/websocket-out.log
tail -f logs/react-out.log
```

## 🔍 API Endpoints

### WebSocket Server

- **Health Check**: `GET http://localhost:4105/health`
  ```json
  {"status":"ok","activeSessions":0,"timestamp":"..."}
  ```

- **Generate Token**: `POST http://localhost:4105/api/token/generate`
  ```json
  {"token":"uuid","url":"http://localhost:4104/#/qr/uuid"}
  ```

- **Submit Payment**: `POST http://localhost:4105/api/payment`
  ```json
  {"token":"uuid","data":{...}}
  ```

- **Get Session**: `GET http://localhost:4105/api/session/:token`

- **Stats**: `GET http://localhost:4105/api/stats`

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:4105?token=YOUR_TOKEN');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // message.type: 'PAYMENT_DATA' | 'SESSION_INFO'
  // message.payload: { ... }
};
```

## 🏗️ Kiến trúc

```
┌─────────────────┐
│  MoMo Page      │
│  (HTML)         │
└────────┬────────┘
         │
         │ (1) Extract data
         ▼
┌─────────────────┐
│  Content Script │
│  (Extension)    │
└────────┬────────┘
         │
         │ (2) Send to Background
         ▼
┌─────────────────┐      (3) Generate Token
│  Background     │◄─────────────────────────┐
│  (Extension)    │                          │
└────────┬────────┘                          │
         │                                   │
         │ (4) POST /api/payment             │
         ▼                                   │
┌─────────────────┐                          │
│  WebSocket      │                          │
│  Server         │                          │
│  (Node.js)      │                          │
└────────┬────────┘                          │
         │                                   │
         │ (5) Broadcast via WebSocket       │
         ▼                                   │
┌─────────────────┐                          │
│  React App      │                          │
│  QRPage         │──────────────────────────┘
│  (Display)      │     (6) Display data
└─────────────────┘
```

### Flow chi tiết:

1. Extension Content Script trích xuất data từ trang MoMo
2. Gửi message đến Background Script
3. Background Script gọi API để tạo token mới
4. Gửi data + token đến Server qua REST API
5. Server broadcast data qua WebSocket đến React App
6. React App hiển thị thông tin real-time

## 🧪 Testing

### Test WebSocket Server
```bash
curl http://localhost:4105/health
```

### Test React App
Mở browser: `http://localhost:4104`

### Test Extension
1. Mở `momo.html` trong Chrome
2. Click extension icon
3. Click "Trích xuất thông tin"
4. Kiểm tra:
   - Extension popup: Thông báo thành công
   - Browser: Tab mới mở với React App
   - React App: Hiển thị thông tin thanh toán

### Test PM2
```bash
pm2 status
# Cả 2 apps phải "online"
```

## 🐛 Troubleshooting

### Port đã được sử dụng

```bash
# Kill port 4105 (WebSocket Server)
lsof -ti:4105 | xargs kill -9

# Kill port 4104 (React App)
lsof -ti:4104 | xargs kill -9
```

### Extension không hoạt động

1. Check console: `chrome://extensions/` → "Inspect views: background page"
2. Reload extension
3. Kiểm tra "Allow access to file URLs" đã bật
4. Verify config trong `extension/config.js`

### WebSocket connection failed

1. Kiểm tra server đang chạy: `curl http://localhost:4105/health`
2. Check PM2 logs: `npm run pm2:logs`
3. Verify WebSocket URL trong `src/config.js`

### React App không nhận data

1. Mở DevTools Console trong React App
2. Check WebSocket connection status
3. Verify token trong URL: `/#/qr/[token]`
4. Check server logs: `tail -f logs/websocket-out.log`

## 📚 Documentation

- **[START.md](START.md)** - Hướng dẫn khởi động chi tiết
- **[extension/CONFIG.md](extension/CONFIG.md)** - Hướng dẫn cấu hình Extension
- **[server/README.md](server/README.md)** - WebSocket Server docs

## 🔐 Security

⚠️ **Chỉ dùng cho Development/Local**

Ứng dụng này không an toàn cho production vì:
- Không có authentication
- WebSocket không mã hóa (ws:// thay vì wss://)
- CORS được mở rộng
- React dev server không an toàn

Để deploy production:
- Dùng `https://` và `wss://`
- Thêm authentication/authorization
- Cấu hình CORS đúng
- Build React app: `npm run build`
- Dùng reverse proxy (nginx)
- Cấu hình SSL certificate

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router
- **Backend**: Node.js, Express, WebSocket (ws)
- **Process Manager**: PM2
- **Extension**: Chrome Extension Manifest V3
- **Tools**: Concurrently, UUID, CORS

## 📝 License

MIT License - Free to use

## 👨‍💻 Development

### Install dependencies
```bash
npm run install:all
```

### Run development mode
```bash
npm run dev
```

### Build React app
```bash
npm run build
```

### Run server only
```bash
npm run server
```

## 🎯 Roadmap

- [ ] Thêm authentication
- [ ] Deploy production với SSL
- [ ] Dark mode
- [ ] Export payment data
- [ ] Payment history
- [ ] Multi-language support
- [ ] Docker support
- [ ] Auto-update extension

## 💡 Tips

### Auto-start PM2 sau reboot
```bash
pm2 startup
pm2 save
```

### Clear PM2 logs
```bash
pm2 flush
```

### Monitor resources
```bash
pm2 monit
```

---

**Made with ❤️ for MoMo Payment tracking**

📧 Questions? Check [START.md](START.md) or [extension/CONFIG.md](extension/CONFIG.md)

# qrmomo
