# 🚀 Hướng dẫn Khởi động MoMo Payment Extractor

## 📋 Yêu cầu

- Node.js >= 14.x
- npm >= 6.x
- Chrome Browser
- PM2 (sẽ được cài tự động)

## 🔧 Cài đặt Lần Đầu

### Bước 1: Cài đặt tất cả dependencies

```bash
cd /Users/danhtrong.it/Documents/projects/momo-qr
npm run install:all
```

Lệnh này sẽ:
- Cài dependencies cho React app (root folder)
- Cài dependencies cho WebSocket server (server folder)

### Bước 2: Tạo thư mục logs

```bash
mkdir -p logs
```

## 🎯 Các Cách Chạy Ứng Dụng

### Cách 1: Sử dụng PM2 (Khuyến nghị cho Production) ⭐

PM2 sẽ tự động quản lý và restart các process khi cần.

#### Khởi động
```bash
npm run pm2:start
```

Hoặc trực tiếp:
```bash
pm2 start ecosystem.config.js
```

#### Xem trạng thái
```bash
pm2 status
# hoặc
pm2 list
```

#### Xem logs
```bash
# Xem tất cả logs real-time
npm run pm2:logs

# Hoặc xem từng app
pm2 logs momo-websocket-server
pm2 logs momo-react-app

# Xem logs trong file
tail -f logs/websocket-out.log
tail -f logs/react-out.log
```

#### Monitor real-time
```bash
npm run pm2:monit
# hoặc
pm2 monit
```

#### Restart
```bash
npm run pm2:restart
# hoặc
pm2 restart ecosystem.config.js
```

#### Stop
```bash
npm run pm2:stop
# hoặc
pm2 stop ecosystem.config.js
```

#### Xóa khỏi PM2
```bash
npm run pm2:delete
# hoặc
pm2 delete ecosystem.config.js
```

### Cách 2: Chạy Development Mode với Concurrently

Chạy cả 2 servers cùng lúc trong cùng 1 terminal:

```bash
npm run dev
```

Lệnh này sẽ chạy:
- WebSocket Server: `http://localhost:4105`
- React App: `http://localhost:4104`

Để dừng: `Ctrl + C`

### Cách 3: Chạy Thủ Công (2 Terminals)

#### Terminal 1 - WebSocket Server
```bash
cd /Users/danhtrong.it/Documents/projects/momo-qr
npm run server
```

#### Terminal 2 - React App
```bash
cd /Users/danhtrong.it/Documents/projects/momo-qr
npm start
```

## 🔌 Cài đặt Extension

### Bước 1: Load Extension vào Chrome

1. Mở Chrome
2. Gõ: `chrome://extensions/`
3. Bật "Developer mode" (góc trên phải)
4. Click "Load unpacked"
5. Chọn thư mục: `/Users/danhtrong.it/Documents/projects/momo-qr/extension`

### Bước 2: Cấp quyền File URLs

1. Tìm extension "MoMo Payment Extractor"
2. Click "Details"
3. Cuộn xuống
4. **BẬT** "Allow access to file URLs"

## ✅ Kiểm tra Hệ thống

### Kiểm tra WebSocket Server
```bash
curl http://localhost:4105/health
```

Kết quả mong đợi:
```json
{"status":"ok","activeSessions":0,"timestamp":"..."}
```

### Kiểm tra React App
Mở browser: `http://localhost:4104`

Phải thấy trang home với text "Chào mừng đến với MoMo Payment Viewer"

### Kiểm tra PM2 Status
```bash
pm2 status
```

Kết quả:
```
┌────┬─────────────────────────┬─────────┬───────┬────────┬──────────┐
│ id │ name                    │ status  │ ↺     │ cpu    │ memory   │
├────┼─────────────────────────┼─────────┼───────┼────────┼──────────┤
│ 0  │ momo-websocket-server   │ online  │ 0     │ 0%     │ 45.5mb   │
│ 1  │ momo-react-app          │ online  │ 0     │ 0%     │ 125.3mb  │
└────┴─────────────────────────┴─────────┴───────┴────────┴──────────┘
```

## 🎮 Sử dụng

### 1. Mở trang MoMo
Mở file `momo.html` trong Chrome (kéo thả vào browser)

### 2. Trích xuất thông tin
- Click icon extension trên toolbar
- Click "🔍 Trích xuất thông tin"
- Tab mới sẽ tự động mở với thông tin thanh toán

### 3. Xem thông tin
Trang React App sẽ hiển thị:
- QR Code (bên phải - nền hồng)
- Thông tin đơn hàng (bên trái - nền trắng):
  - Nhà cung cấp
  - Mã đơn hàng
  - Mô tả
  - Số tiền
  - Countdown timer

## 📊 Logs và Monitoring

### PM2 Logs

Logs được lưu trong thư mục `logs/`:
- `websocket-out.log` - WebSocket server output
- `websocket-error.log` - WebSocket server errors
- `react-out.log` - React app output
- `react-error.log` - React app errors

### Xem logs real-time
```bash
# Tất cả
pm2 logs

# WebSocket server
pm2 logs momo-websocket-server

# React app
pm2 logs momo-react-app

# Hoặc dùng tail
tail -f logs/websocket-out.log
tail -f logs/react-out.log
```

### Dashboard
```bash
pm2 monit
```

Hiển thị:
- CPU usage
- Memory usage
- Logs real-time
- Process list

## 🔄 Auto-restart

PM2 tự động restart khi:
- Process crash
- Out of memory
- Uncaught exception

Để xem restart count:
```bash
pm2 status
```

## 🛑 Dừng Hệ thống

### Với PM2
```bash
# Dừng tạm thời
pm2 stop all

# Hoặc stop từng app
pm2 stop momo-websocket-server
pm2 stop momo-react-app

# Xóa hoàn toàn khỏi PM2
pm2 delete all
```

### Với Concurrently
```
Ctrl + C
```

### Thủ công
Đóng từng terminal hoặc `Ctrl + C`

## 🐛 Troubleshooting

### Port đã được sử dụng

**Port 4105 (WebSocket Server):**
```bash
# Tìm process
lsof -ti:4105

# Kill process
kill -9 $(lsof -ti:4105)
```

**Port 4104 (React App):**
```bash
# Tìm process
lsof -ti:4104

# Kill process
kill -9 $(lsof -ti:4104)
```

### PM2 không hoạt động

```bash
# Cài lại PM2
npm install -g pm2

# Update PM2
pm2 update

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js
```

### React App không build

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Extension không hoạt động

1. Reload extension: `chrome://extensions/` -> Click reload
2. Kiểm tra "Allow access to file URLs" đã bật
3. Mở Console: `chrome://extensions/` -> "Inspect views: background page"
4. Xem logs trong Console

## 📱 URLs

- **React App**: http://localhost:4104
- **WebSocket Server**: ws://localhost:4105
- **Server API**: http://localhost:4105/api/*
- **Health Check**: http://localhost:4105/health
- **Stats**: http://localhost:4105/api/stats

## ⚙️ Cấu hình Port và Domain

Để thay đổi cổng hoặc domain, xem file: [`extension/CONFIG.md`](extension/CONFIG.md)

Các file cần cấu hình:
- `extension/config.js` - Cấu hình Extension
- `ecosystem.config.js` - Cấu hình PM2 ports
- `src/config.js` - Cấu hình React App
- `extension/manifest.json` - Permissions cho Chrome Extension

## 🔐 Security Notes

⚠️ **Chỉ dùng cho Development/Local**

Ứng dụng này chỉ nên chạy local vì:
- Không có authentication
- WebSocket không mã hóa (ws:// thay vì wss://)
- CORS được mở rộng
- React dev server không an toàn cho production

## 📦 Structure

```
momo-qr/
├── extension/          # Chrome Extension
├── server/            # WebSocket Server
├── src/               # React App Source
├── public/            # React Public Assets
├── logs/              # PM2 Logs
├── ecosystem.config.js # PM2 Config
├── package.json       # Main package.json
└── START.md          # This file
```

## 🎉 Quick Commands Cheat Sheet

```bash
# Khởi động tất cả
npm run pm2:start

# Xem trạng thái
pm2 status

# Xem logs
pm2 logs

# Monitor
pm2 monit

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop

# Xóa
npm run pm2:delete
```

---

## 💡 Tips

1. **Auto-start sau khi reboot:**
   ```bash
   pm2 startup
   pm2 save
   ```

2. **Xem resource usage:**
   ```bash
   pm2 monit
   ```

3. **Clear logs:**
   ```bash
   pm2 flush
   ```

4. **Xem version PM2:**
   ```bash
   pm2 --version
   ```

Enjoy! 🎊

