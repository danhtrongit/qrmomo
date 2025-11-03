# 🔧 Quick Fix: WebSocket Connection Error

## ❌ Lỗi bạn đang gặp

```
WebSocket connection to 'wss://momo.danhtrong.io.vn:4104/ws' failed
```

## ⚠️ Nguyên nhân

WebSocket đang kết nối đến **SAI DOMAIN và SAI PORT**:
- ❌ `wss://momo.danhtrong.io.vn:4104` - **Frontend URL** (React App)
- ✅ `wss://server.danhtrong.io.vn` - **Backend URL** (WebSocket Server)

## ✅ Giải pháp Nhanh

### Bước 1: Kiểm tra Extension Config

Mở Extension Popup → Click "⚙️ Cấu hình" → Nhập:

```
Server URL: https://server.danhtrong.io.vn
React App URL: https://momo.danhtrong.io.vn
```

**Lưu ý:** KHÔNG có port `:4104` hoặc `:4105` trong production URLs!

### Bước 2: Rebuild React App với Environment Variables đúng

```bash
cd /Users/danhtrong.it/Documents/projects/momo-qr

# Set environment variables
export REACT_APP_WS_URL=wss://server.danhtrong.io.vn
export REACT_APP_API_URL=https://server.danhtrong.io.vn

# Build
npm run build
```

### Bước 3: Deploy build folder mới

```bash
# Upload lên server
scp -r build/* user@your-server:/var/www/momo-payment/build/
```

## 📋 Checklist

- [ ] Extension config có `SERVER_URL = https://server.danhtrong.io.vn` (không có port)
- [ ] Build React app với `REACT_APP_WS_URL=wss://server.danhtrong.io.vn`
- [ ] Nginx đang proxy port 443 → 4105 cho WebSocket
- [ ] Server đang chạy trên port 4105 (internal)
- [ ] Không expose port 4104, 4105 ra ngoài (chỉ qua Nginx)

## 🔍 Debug

### 1. Kiểm tra React App đang dùng URL nào

Mở DevTools Console trong React App:

```javascript
// Check config
console.log(window.location.href);

// In QRPage, check WS_URL
// Nó phải là: wss://server.danhtrong.io.vn
// KHÔNG phải: wss://momo.danhtrong.io.vn:4104
```

### 2. Kiểm tra build đã có env variables chưa

```bash
# Sau khi build, search trong build files
grep -r "REACT_APP_WS_URL" build/

# Hoặc check main.*.js
grep "wss://" build/static/js/main.*.js
```

### 3. Test WebSocket Server

```bash
# Test từ command line
curl https://server.danhtrong.io.vn/health

# Test WebSocket
npm install -g wscat
wscat -c "wss://server.danhtrong.io.vn?token=test123"
```

## 🎯 Đúng Architecture

```
Browser (HTTPS)
    ↓
React App: https://momo.danhtrong.io.vn
    ↓ WebSocket Connection
    ↓
WebSocket: wss://server.danhtrong.io.vn (Nginx :443 → Node.js :4105)
```

## 🚫 SAI Architecture (Đang gặp lỗi)

```
Browser (HTTPS)
    ↓
React App: https://momo.danhtrong.io.vn
    ↓ WebSocket Connection
    ↓
❌ WebSocket: wss://momo.danhtrong.io.vn:4104  ← SAI!
```

## 💡 Tóm tắt

**2 Domains riêng biệt:**

1. **Frontend (React App):**
   - URL: `https://momo.danhtrong.io.vn`
   - Port internal: 4104
   - Nginx phục vụ static files

2. **Backend (WebSocket Server):**
   - URL: `https://server.danhtrong.io.vn` hoặc `wss://server.danhtrong.io.vn`
   - Port internal: 4105
   - Nginx proxy WebSocket connections

**Extension cần biết CẢ 2:**
- `SERVER_URL`: https://server.danhtrong.io.vn
- `REACT_APP_URL`: https://momo.danhtrong.io.vn

**React App chỉ cần biết Backend:**
- `REACT_APP_WS_URL`: wss://server.danhtrong.io.vn
- `REACT_APP_API_URL`: https://server.danhtrong.io.vn

---

## 🛠️ Script Build Tự động

Tạo file `build-production.sh`:

```bash
#!/bin/bash

echo "🏗️  Building for Production..."

# Set environment
export REACT_APP_WS_URL=wss://server.danhtrong.io.vn
export REACT_APP_API_URL=https://server.danhtrong.io.vn
export FAST_REFRESH=false

# Clean old build
rm -rf build/

# Build
npm run build

echo "✅ Build complete!"
echo ""
echo "📦 Deploy với:"
echo "scp -r build/* user@server:/var/www/momo-payment/build/"
```

Chạy:
```bash
chmod +x build-production.sh
./build-production.sh
```

---

**Sau khi fix, reload trang React App và kiểm tra Console không còn lỗi WebSocket!**

