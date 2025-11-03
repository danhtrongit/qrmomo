# 🚀 Hướng dẫn Deploy Production

## ⚠️ Lỗi Mixed Content (HTTPS vs WS)

### Vấn đề

```
Mixed Content: The page at 'https://momo.danhtrong.io.vn' was loaded over HTTPS, 
but attempted to connect to the insecure WebSocket endpoint 'ws://server.danhtrong.io.vn'.
This request has been blocked.
```

### Nguyên nhân

- React App chạy trên **HTTPS** (https://momo.danhtrong.io.vn)
- WebSocket Server dùng **WS** (ws://server.danhtrong.io.vn)
- Browser **chặn** kết nối không mã hóa từ trang HTTPS

### Giải pháp

**Phải dùng WSS (WebSocket Secure) thay vì WS**

## 📋 Các bước Deploy

### 1. Cài đặt SSL Certificate cho Server

#### Option A: Sử dụng Let's Encrypt (Miễn phí)

```bash
# Cài đặt certbot
sudo apt-get update
sudo apt-get install certbot

# Tạo certificate cho domain
sudo certbot certonly --standalone -d server.danhtrong.io.vn
```

Certificate sẽ được lưu tại:
- Certificate: `/etc/letsencrypt/live/server.danhtrong.io.vn/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/server.danhtrong.io.vn/privkey.pem`

#### Option B: Sử dụng Nginx Reverse Proxy (Khuyến nghị)

Nginx sẽ xử lý SSL và forward request đến Node.js server.

### 2. Cấu hình WebSocket Server với SSL

#### Cách 1: Thêm HTTPS vào Node.js Server

Cập nhật `server/server.js`:

```javascript
const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();

// Load SSL certificates
const serverOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/server.danhtrong.io.vn/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/server.danhtrong.io.vn/fullchain.pem')
};

// Create HTTPS server
const server = https.createServer(serverOptions, app);

// WebSocket server (sẽ tự động dùng WSS vì base server là HTTPS)
const wss = new WebSocket.Server({ server });

// ... rest of your code ...

const PORT = process.env.PORT || 4105;
server.listen(PORT, () => {
  console.log(`🔒 HTTPS/WSS Server running on port ${PORT}`);
});
```

#### Cách 2: Sử dụng Nginx Reverse Proxy (Khuyến nghị hơn)

**Tại sao dùng Nginx?**
- Nginx xử lý SSL tốt hơn Node.js
- Auto-renew SSL certificates dễ dàng
- Load balancing nếu scale
- Caching static files

**Cấu hình Nginx:**

```nginx
# /etc/nginx/sites-available/momo-payment

# WebSocket Server (Backend)
upstream websocket_backend {
    server 127.0.0.1:4105;
}

# React App (Frontend)
upstream react_frontend {
    server 127.0.0.1:4104;
}

# Server block cho WebSocket Server
server {
    listen 443 ssl http2;
    server_name server.danhtrong.io.vn;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/server.danhtrong.io.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/server.danhtrong.io.vn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # WebSocket Configuration
    location / {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}

# Server block cho React App
server {
    listen 443 ssl http2;
    server_name momo.danhtrong.io.vn;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/momo.danhtrong.io.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/momo.danhtrong.io.vn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/momo-payment/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name server.danhtrong.io.vn momo.danhtrong.io.vn;
    return 301 https://$server_name$request_uri;
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/momo-payment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Build React App cho Production

```bash
cd /Users/danhtrong.it/Documents/projects/momo-qr

# Set environment variables cho production
export REACT_APP_WS_URL=wss://server.danhtrong.io.vn
export REACT_APP_API_URL=https://server.danhtrong.io.vn

# Build
npm run build
```

### 4. Deploy React Build

```bash
# Copy build folder đến server
scp -r build/* user@server:/var/www/momo-payment/build/

# Hoặc dùng rsync
rsync -avz build/ user@server:/var/www/momo-payment/build/
```

### 5. Cấu hình Extension cho Production

**Mở Extension Popup → Click "⚙️ Cấu hình":**

```
Server URL: https://server.danhtrong.io.vn
React App URL: https://momo.danhtrong.io.vn
```

**Hoặc sửa `extension/config.js`:**

```javascript
const DEFAULT_CONFIG = {
  SERVER_URL: 'https://server.danhtrong.io.vn',
  WS_URL: 'wss://server.danhtrong.io.vn',
  REACT_APP_URL: 'https://momo.danhtrong.io.vn',
};
```

### 6. Update manifest.json permissions

```json
{
  "host_permissions": [
    "https://payment.momo.vn/*",
    "https://momo.danhtrong.io.vn/*",
    "https://server.danhtrong.io.vn/*",
    "file:///*"
  ]
}
```

### 7. PM2 cho Production

```bash
# On server
cd /path/to/momo-qr
npm run pm2:start

# Enable startup script
pm2 startup
pm2 save

# Monitor
pm2 monit
```

## ✅ Checklist Deploy

- [ ] SSL Certificate được cài đặt cho cả 2 domains
- [ ] Nginx configured với WSS proxy
- [ ] React app built với REACT_APP_WS_URL=wss://...
- [ ] Extension configured với https:// và wss://
- [ ] manifest.json có permissions cho production domains
- [ ] PM2 đang chạy WebSocket server
- [ ] Test WebSocket connection: `wscat -c wss://server.danhtrong.io.vn`

## 🧪 Test Production Setup

### 1. Test SSL Certificate

```bash
# Check certificate
openssl s_client -connect server.danhtrong.io.vn:443

# Check expiry
echo | openssl s_client -connect server.danhtrong.io.vn:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. Test WebSocket Connection

```bash
# Install wscat
npm install -g wscat

# Test WSS connection
wscat -c "wss://server.danhtrong.io.vn?token=test123"
```

### 3. Test từ Browser

```javascript
// Open browser console
const ws = new WebSocket('wss://server.danhtrong.io.vn?token=test123');
ws.onopen = () => console.log('Connected!');
ws.onerror = (error) => console.error('Error:', error);
```

## 🐛 Troubleshooting

### Lỗi: Mixed Content vẫn xuất hiện

**Giải pháp:**
1. Clear browser cache
2. Hard reload (Ctrl + Shift + R)
3. Check `src/config.js` - phải dùng `wss://` không phải `ws://`
4. Verify extension config đã lưu đúng URL

### Lỗi: WebSocket connection failed

**Kiểm tra:**
```bash
# Check server đang chạy
curl https://server.danhtrong.io.vn/health

# Check WebSocket port
sudo netstat -tlnp | grep 4105

# Check Nginx logs
sudo tail -f /var/nginx/error.log
```

### Lỗi: Certificate not valid

**Auto-renew Let's Encrypt:**
```bash
# Add to crontab
sudo crontab -e

# Add line:
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

## 📊 Monitoring Production

### PM2 Dashboard

```bash
pm2 monit
pm2 logs
pm2 status
```

### Nginx Logs

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### WebSocket Connections

```bash
# Check active connections
pm2 logs momo-websocket-server | grep "connected"
```

## 🔐 Security Best Practices

1. **Firewall Rules:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw deny 4104/tcp  # Block direct access
   sudo ufw deny 4105/tcp  # Block direct access
   sudo ufw enable
   ```

2. **Rate Limiting (Nginx):**
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   
   location /api/ {
       limit_req zone=api burst=20;
   }
   ```

3. **CORS Settings (Server):**
   ```javascript
   app.use(cors({
     origin: 'https://momo.danhtrong.io.vn',
     credentials: true
   }));
   ```

## 🚀 Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying MoMo Payment Extractor..."

# Build React app
echo "📦 Building React app..."
export REACT_APP_WS_URL=wss://server.danhtrong.io.vn
export REACT_APP_API_URL=https://server.danhtrong.io.vn
npm run build

# Deploy to server
echo "📤 Uploading to server..."
rsync -avz build/ user@server:/var/www/momo-payment/build/

# Restart PM2
echo "🔄 Restarting services..."
ssh user@server "cd /path/to/momo-qr && pm2 restart ecosystem.config.js"

# Reload Nginx
ssh user@server "sudo systemctl reload nginx"

echo "✅ Deploy completed!"
```

---

## 📝 Summary

**Để sửa lỗi Mixed Content:**

1. ✅ Cài SSL certificate
2. ✅ Dùng **wss://** thay vì **ws://**
3. ✅ Dùng **https://** thay vì **http://**
4. ✅ Cấu hình Nginx làm SSL proxy
5. ✅ Update Extension config qua UI hoặc file
6. ✅ Build React app với env variables đúng

**Không thể dùng WS (không mã hóa) với trang HTTPS!**

