# PM2 Troubleshooting Guide

## Lỗi phổ biến và cách khắc phục

### Lỗi: "Process not found" và PM2 version mismatch

**Triệu chứng:**
```
In-memory PM2 is out-of-date
[PM2][ERROR] Process 2 not found
TypeError: Cannot read properties of undefined (reading 'pm2_env')
```

**Nguyên nhân:**
- PM2 daemon đang chạy phiên bản cũ trong memory
- Process IDs không tồn tại trong PM2 list
- Xung đột version giữa global PM2 và local PM2

---

## Giải pháp nhanh

### Cách 1: Sử dụng script tự động (Khuyến nghị)

```bash
# Trên server production
cd /www/wwwroot/momo.danhtrong.io.vn/qrmomo

# Chạy script fix
chmod +x fix-pm2.sh
./fix-pm2.sh
```

### Cách 2: Sử dụng script restart đơn giản

```bash
chmod +x restart-pm2.sh
./restart-pm2.sh
```

### Cách 3: Thực hiện thủ công

```bash
# Bước 1: Update PM2
pm2 update

# Bước 2: Kill PM2 daemon
pm2 kill

# Bước 3: Xóa tất cả processes cũ
pm2 delete all

# Bước 4: Start lại với ecosystem config
pm2 start ecosystem.config.js

# Bước 5: Lưu configuration
pm2 save --force

# Bước 6: Kiểm tra status
pm2 list
```

---

## Lệnh hữu ích

### Kiểm tra trạng thái
```bash
pm2 list                    # Liệt kê tất cả processes
pm2 status                  # Tương tự pm2 list
pm2 describe <app-name>     # Chi tiết về một app
```

### Xem logs
```bash
pm2 logs                    # Tất cả logs
pm2 logs momo-websocket-server
pm2 logs momo-react-app
pm2 flush                   # Xóa logs cũ
```

### Quản lý processes
```bash
pm2 restart all             # Restart tất cả
pm2 restart <app-name>      # Restart một app cụ thể
pm2 stop all                # Stop tất cả
pm2 stop <app-name>         # Stop một app
pm2 delete all              # Xóa tất cả
```

### Monitoring
```bash
pm2 monit                   # Real-time monitoring
pm2 info <app-name>         # Thông tin chi tiết
```

---

## Khi nào cần restart PM2?

1. **Sau khi deploy code mới**
   ```bash
   ./restart-pm2.sh
   ```

2. **Khi gặp lỗi "Process not found"**
   ```bash
   ./fix-pm2.sh
   ```

3. **Khi cập nhật environment variables**
   ```bash
   pm2 restart all --update-env
   ```

4. **Khi server restart**
   - PM2 sẽ tự động start nếu đã setup `pm2 startup`
   - Nếu không, chạy: `pm2 resurrect`

---

## Setup PM2 Startup (Chỉ cần làm 1 lần)

Để PM2 tự động start khi server reboot:

```bash
# Tạo startup script
pm2 startup

# Sau đó copy và chạy lệnh mà PM2 đưa ra
# Ví dụ:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Lưu danh sách processes hiện tại
pm2 save
```

---

## Cấu trúc Ecosystem Config

File `ecosystem.config.js` hiện tại:

```javascript
{
  apps: [
    {
      name: 'momo-websocket-server',
      script: './server/server.js',
      port: 4105
    },
    {
      name: 'momo-react-app',
      script: 'react-scripts start',
      port: 4104
    }
  ]
}
```

**Lưu ý quan trọng:**
- WebSocket server: Port 4105
- React app: Port 4104
- Logs được lưu trong folder `./logs/`

---

## Kiểm tra sau khi fix

```bash
# 1. Kiểm tra processes đang chạy
pm2 list

# Kết quả mong muốn:
# ┌─────┬────────────────────────────┬─────────┬─────────┐
# │ id  │ name                       │ status  │ cpu     │
# ├─────┼────────────────────────────┼─────────┼─────────┤
# │ 0   │ momo-websocket-server      │ online  │ 0%      │
# │ 1   │ momo-react-app             │ online  │ 0%      │
# └─────┴────────────────────────────┴─────────┴─────────┘

# 2. Test WebSocket server
curl http://localhost:4105

# 3. Test React app
curl http://localhost:4104

# 4. Kiểm tra logs
pm2 logs --lines 20
```

---

## Nếu vẫn gặp vấn đề

1. **Kiểm tra port đã được sử dụng chưa**
   ```bash
   netstat -tulpn | grep 4105
   netstat -tulpn | grep 4104
   ```

2. **Kiểm tra PM2 version**
   ```bash
   pm2 --version
   node --version
   ```

3. **Reinstall PM2 (Giải pháp cuối cùng)**
   ```bash
   npm uninstall -g pm2
   npm install -g pm2@latest
   pm2 update
   ```

4. **Kiểm tra logs chi tiết**
   ```bash
   cat logs/websocket-error.log
   cat logs/react-error.log
   ```

---

## Contact & Support

Nếu cần hỗ trợ thêm, vui lòng cung cấp:
- Output của `pm2 list`
- Output của `pm2 logs --lines 50`
- Nội dung file logs trong folder `./logs/`

