# 🎨 Hướng dẫn Cấu hình qua Giao diện Extension

## 📋 Tổng quan

Bạn có thể cấu hình URL/Port của Server và React App **ngay trong Extension Popup** mà không cần sửa file `config.js`.

## 🚀 Cách sử dụng

### 1. Mở Extension Popup

Click vào icon Extension trên thanh toolbar của Chrome.

### 2. Mở Panel Cấu hình

Click nút **"⚙️ Cấu hình"** để mở panel cấu hình.

### 3. Nhập URL

Panel cấu hình có 2 trường:

#### 🌐 Server URL (Backend)
- Nhập URL của WebSocket Server
- Ví dụ: `http://localhost:4105`
- Hoặc production: `https://api.yourdomain.com`

#### 💻 React App URL (Frontend)  
- Nhập URL của React Application
- Ví dụ: `http://localhost:4104`
- Hoặc production: `https://app.yourdomain.com`

### 4. Lưu Cấu hình

Click nút **"💾 Lưu"**.

Extension sẽ:
1. Validate URLs (kiểm tra định dạng hợp lệ)
2. Lưu cấu hình vào `chrome.storage.local`
3. Tự động reload extension sau 1 giây

### 5. Hủy hoặc Reset

- **"❌ Hủy"**: Đóng panel mà không lưu
- **"🔄 Reset mặc định"**: Về lại cấu hình ban đầu
  - Server: `http://localhost:4105`
  - React App: `http://localhost:4104`

## ✨ Tính năng

### ✅ Ưu điểm

1. **Không cần sửa code**: Cấu hình qua UI, không phải mở file
2. **Tự động lưu**: Config được lưu vĩnh viễn trong Extension Storage
3. **Validation**: Tự động kiểm tra URL hợp lệ
4. **Auto-reload**: Extension tự động reload sau khi lưu
5. **Reset dễ dàng**: 1 click để về cấu hình mặc định

### 🔧 Hoạt động

Khi bạn lưu cấu hình:
```
User Input
    ↓
Validate URLs
    ↓
Save to chrome.storage.local
    ↓
Reload Extension
    ↓
Load config from storage
    ↓
Apply to all scripts (background, content, popup)
```

## 📂 Dữ liệu được lưu ở đâu?

Cấu hình được lưu trong **Chrome Extension Storage** (`chrome.storage.local`):

```javascript
{
  "userConfig": {
    "SERVER_URL": "http://localhost:4105",
    "REACT_APP_URL": "http://localhost:4104",
    "WS_URL": "ws://localhost:4105"  // Auto-generated
  }
}
```

**Lưu ý**: 
- `WS_URL` được tự động tạo từ `SERVER_URL` (http → ws, https → wss)
- Dữ liệu được lưu local trên máy bạn, không sync giữa các máy

## 🔍 Kiểm tra Config hiện tại

### Cách 1: Qua Extension Console

1. Mở `chrome://extensions/`
2. Tìm "MoMo Payment Extractor"
3. Click "Inspect views: background page"
4. Trong Console, gõ:
   ```javascript
   chrome.storage.local.get(['userConfig'], (result) => {
     console.log(result.userConfig);
   });
   ```

### Cách 2: Mở Config Panel

Click "⚙️ Cấu hình" trong popup, giá trị hiện tại sẽ được hiển thị.

## ⚠️ Lưu ý Quan trọng

### 1. URL phải hợp lệ

✅ Đúng:
- `http://localhost:4105`
- `https://api.example.com`
- `http://192.168.1.100:8080`

❌ Sai:
- `localhost:4105` (thiếu protocol)
- `http//localhost:4105` (thiếu `:`)
- `api.example.com` (thiếu protocol)

### 2. CORS & Permissions

Khi đổi URL, cần kiểm tra:
- Server có enable CORS không
- `manifest.json` có permission cho domain mới không

Nếu dùng domain mới, cần thêm vào `manifest.json`:
```json
{
  "host_permissions": [
    "https://your-new-domain.com/*"
  ]
}
```

### 3. Production URLs

Khi deploy production, đảm bảo:
- ✅ Dùng `https://` thay vì `http://`
- ✅ Server có SSL certificate
- ✅ WebSocket dùng `wss://` (tự động từ `https://`)

## 🐛 Troubleshooting

### Config không lưu

1. Check Console logs
2. Verify extension có permission `storage`
3. Reload extension: `chrome://extensions/` → Click reload

### Extension không reload

Reload thủ công:
1. Mở `chrome://extensions/`
2. Click nút reload trên Extension

### URL không hoạt động

1. Kiểm tra Server đang chạy: `curl http://your-url/health`
2. Kiểm tra CORS settings
3. Xem Console logs trong extension

### Reset về mặc định

Nếu gặp vấn đề, click **"🔄 Reset mặc định"** để về config ban đầu.

Hoặc xóa config thủ công:
```javascript
// Trong Extension Console
chrome.storage.local.remove(['userConfig'], () => {
  console.log('Config cleared');
  chrome.runtime.reload();
});
```

## 📝 Examples

### Local Development
```
Server URL: http://localhost:4105
React App URL: http://localhost:4104
```

### Production
```
Server URL: https://api.momo-payment.com
React App URL: https://app.momo-payment.com
```

### Custom Ports
```
Server URL: http://localhost:8888
React App URL: http://localhost:9999
```

### LAN Network
```
Server URL: http://192.168.1.50:4105
React App URL: http://192.168.1.50:4104
```

## 🎯 Best Practices

1. **Test trước khi lưu**: Verify Server đang chạy
2. **Backup config**: Note lại URL trước khi thay đổi
3. **Reset nếu cần**: Đừng ngần ngại reset về mặc định
4. **Check logs**: Xem Console để debug

## 💡 Tips

- Config được lưu **vĩnh viễn**, không mất khi đóng browser
- Mỗi profile Chrome có config riêng
- Config **không sync** giữa các máy (dùng chrome.storage.local, không phải sync)
- Sau khi save, extension **tự động reload**, không cần reload thủ công

---

✅ **Đã xong!** Bây giờ bạn có thể cấu hình Extension dễ dàng qua UI mà không cần sửa code!

