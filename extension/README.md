# MoMo Payment Extractor - Chrome Extension

Extension này trích xuất thông tin thanh toán từ trang MoMo và gửi đến React App.

## 📦 Cài đặt Extension

### Bước 1: Chuẩn bị Icons

Tạo các icon cho extension (hoặc tải về từ internet):
- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px)
- `icons/icon128.png` (128x128px)

### Bước 2: Load Extension vào Chrome

1. Mở Chrome và truy cập: `chrome://extensions/`
2. Bật **"Developer mode"** (góc trên bên phải)
3. Click **"Load unpacked"**
4. Chọn thư mục `extension` trong project này
5. Extension sẽ xuất hiện trong danh sách

## 🚀 Cách sử dụng

### Cách 1: Tự động (Khuyến nghị)

1. Khởi động React App: `npm start` (sẽ chạy tại http://localhost:3000)
2. Mở trang thanh toán MoMo trong Chrome
3. Extension sẽ **tự động** trích xuất thông tin và gửi đến React App
4. React App sẽ tự động mở và hiển thị thông tin

### Cách 2: Thủ công

1. Khởi động React App: `npm start`
2. Mở trang thanh toán MoMo
3. Click vào icon Extension trên thanh công cụ Chrome
4. Click nút **"Trích xuất thông tin"**
5. React App sẽ mở và hiển thị dữ liệu

## 🔍 Thông tin được trích xuất

Extension sẽ tự động lấy các thông tin sau từ trang MoMo:

- ✅ **QR Code** - Mã QR để thanh toán
- ✅ **Nhà cung cấp** - Tên và logo merchant
- ✅ **Mã đơn hàng** - Order ID
- ✅ **Số tiền** - Amount cần thanh toán
- ✅ **Mô tả** - Description của đơn hàng
- ✅ **Thời gian đếm ngược** - Countdown timer

## 🛠️ Cấu trúc Files

```
extension/
├── manifest.json       # Cấu hình extension
├── content.js         # Script chạy trên trang MoMo
├── background.js      # Service worker xử lý background
├── popup.html         # Giao diện popup
├── popup.js          # Logic popup
├── README.md         # File này
└── icons/            # Thư mục chứa icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🐛 Debug & Troubleshooting

### Kiểm tra logs

1. **Content Script logs:**
   - Mở DevTools trên trang MoMo (F12)
   - Tab Console
   - Tìm messages có prefix "MoMo Payment Extractor"

2. **Background Script logs:**
   - Truy cập `chrome://extensions/`
   - Tìm extension và click "Service Worker"
   - Xem console logs

3. **Popup logs:**
   - Click chuột phải vào icon extension
   - Chọn "Inspect popup"
   - Xem console

### Các vấn đề thường gặp

**1. Extension không hoạt động:**
- Kiểm tra đã bật Developer mode
- Reload extension: `chrome://extensions/` → Click icon reload
- Kiểm tra permissions trong manifest.json

**2. Không gửi được dữ liệu:**
- Kiểm tra React App đang chạy tại localhost:3000
- Xem console logs để tìm lỗi
- Kiểm tra host_permissions trong manifest.json

**3. Không trích xuất được thông tin:**
- Kiểm tra HTML structure của trang MoMo có thay đổi không
- Xem content.js logs để debug
- Cập nhật selectors trong content.js nếu cần

## 📝 Chú ý

- Extension chỉ hoạt động trên domain `payment.momo.vn`
- React App phải chạy tại `http://localhost:3000`
- Cần bật Developer mode để load unpacked extension
- Thông tin được cập nhật tự động mỗi 5 giây

## 🔒 Bảo mật

Extension này:
- Chỉ hoạt động trên trang MoMo Payment
- Không lưu trữ thông tin thanh toán
- Chỉ đọc thông tin hiển thị trên trang
- Không gửi dữ liệu ra ngoài (chỉ gửi local đến React App)

## 📄 License

MIT License - Sử dụng tự do cho mục đích học tập và phát triển.

