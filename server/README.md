# WebSocket Server cho MoMo Payment System

## 🎯 Mục đích

Server WebSocket để kết nối Chrome Extension và React App, hỗ trợ nhiều trang thanh toán đồng thời qua token riêng biệt.

## 📦 Cài đặt

```bash
cd server
npm install
```

## 🚀 Chạy server

```bash
# Development với auto-reload
npm run dev

# Production
npm start
```

Server sẽ chạy tại:
- **WebSocket:** `ws://localhost:3001`
- **HTTP API:** `http://localhost:3001`

## 🔌 API Endpoints

### 1. Generate Token
```http
POST http://localhost:3001/api/token/generate
```

Response:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "url": "http://localhost:3000/qr/550e8400-e29b-41d4-a716-446655440000",
  "wsUrl": "ws://localhost:3001?token=550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Send Payment Data
```http
POST http://localhost:3001/api/payment
Content-Type: application/json

{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "qrCode": "data:image/png;base64,...",
    "merchant": "Tiki",
    "amount": 300000,
    ...
  }
}
```

### 3. Get Session Info
```http
GET http://localhost:3001/api/session/:token
```

### 4. Stats
```http
GET http://localhost:3001/api/stats
```

### 5. Health Check
```http
GET http://localhost:3001/health
```

## 🔗 WebSocket Connection

### Connect
```javascript
const ws = new WebSocket('ws://localhost:3001?token=YOUR_TOKEN');
```

### Messages từ Server

**Session Info:**
```json
{
  "type": "SESSION_INFO",
  "payload": {
    "token": "550e8400...",
    "connectedAt": "2025-01-03T10:00:00.000Z",
    "hasData": false
  }
}
```

**Payment Data:**
```json
{
  "type": "PAYMENT_DATA",
  "payload": {
    "qrCode": "...",
    "merchant": "Tiki",
    "amount": 300000,
    ...
  }
}
```

### Messages từ Client

**Ping:**
```json
{
  "type": "PING"
}
```

Response: `{ "type": "PONG" }`

## 💾 Session Management

- Sessions tự động expire sau **30 phút**
- Data được giữ **5 phút** sau khi tất cả clients disconnect
- Cleanup chạy mỗi **5 phút**

## 🏗️ Kiến trúc

```
┌─────────────────┐
│  Chrome         │
│  Extension      │
└────────┬────────┘
         │ (1) Extract data
         │ (2) POST /api/payment
         ↓
┌─────────────────┐
│  WebSocket      │
│  Server         │──────┐
│  (Port 3001)    │      │ (3) Broadcast
└────────┬────────┘      │
         │               ↓
         └──────→ ┌─────────────────┐
                  │  React App      │
                  │  localhost:3000 │
                  │  /qr/:token     │
                  └─────────────────┘
```

## 📊 Features

✅ Multi-session support với unique tokens
✅ Real-time data broadcast qua WebSocket
✅ Auto-cleanup expired sessions
✅ Health monitoring
✅ CORS enabled
✅ Error handling

## 🔒 Security Notes

- Production: Thêm authentication
- Production: Validate data input
- Production: Rate limiting
- Production: HTTPS/WSS

