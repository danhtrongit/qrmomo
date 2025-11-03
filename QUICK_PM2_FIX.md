# 🚀 HƯỚNG DẪN FIX LỖI PM2 NHANH

## Lỗi bạn đang gặp:
```
[PM2][ERROR] Process 2 not found
[PM2][ERROR] Process 3 not found
TypeError: Cannot read properties of undefined (reading 'pm2_env')
```

---

## ✅ GIẢI PHÁP - Chạy trên server production

### Bước 1: SSH vào server
```bash
ssh root@your-server
```

### Bước 2: Di chuyển vào thư mục project
```bash
cd /www/wwwroot/momo.danhtrong.io.vn/qrmomo
```

### Bước 3: Pull code mới nhất
```bash
git pull origin main
```

### Bước 4: Chạy script fix (CHỌN 1 TRONG 2 CÁCH)

**CÁCH 1: Script fix đầy đủ (Khuyến nghị)**
```bash
chmod +x fix-pm2.sh
./fix-pm2.sh
```

**CÁCH 2: Script restart nhanh**
```bash
chmod +x restart-pm2.sh
./restart-pm2.sh
```

---

## 📋 Hoặc làm thủ công (5 lệnh)

```bash
# 1. Update PM2
pm2 update

# 2. Kill daemon
pm2 kill

# 3. Start lại
pm2 start ecosystem.config.js

# 4. Lưu config
pm2 save --force

# 5. Kiểm tra
pm2 list
```

---

## ✅ Kiểm tra kết quả

Sau khi chạy xong, bạn sẽ thấy:

```
┌─────┬────────────────────────────┬─────────┬─────────┐
│ id  │ name                       │ status  │ cpu     │
├─────┼────────────────────────────┼─────────┼─────────┤
│ 0   │ momo-websocket-server      │ online  │ 0%      │
│ 1   │ momo-react-app             │ online  │ 0%      │
└─────┴────────────────────────────┴─────────┴─────────┘
```

**Status phải là "online"** ✅

---

## 🧪 Test services

```bash
# Test WebSocket server (Port 4105)
curl http://localhost:4105

# Test React app (Port 4104)
curl http://localhost:4104

# Xem logs
pm2 logs --lines 20
```

---

## ❓ Nếu vẫn gặp lỗi

Xem file `PM2_TROUBLESHOOTING.md` để có hướng dẫn chi tiết hơn.

Hoặc liên hệ để được hỗ trợ!

