# 📱 Hướng Dẫn Device Emulation cho MoMo Extension

## Vấn đề

MoMo Payment Gateway chỉ hiển thị **nút "Thanh toán bằng Ví MoMo"** và **deep links** khi truy cập từ **mobile device**. 

Khi truy cập từ desktop, MoMo chỉ hiển thị QR code mà không có button, dẫn đến extension không thể trích xuất được:
- `momoAppLink` (https://applinks.momo.vn/...)
- `momoDeepLink` (momo://app?...)

## Giải pháp

Sử dụng **Chrome DevTools Device Mode** để giả lập mobile device.

---

## Cách 1: Chrome DevTools Device Mode (Khuyên dùng)

### Bước 1: Mở DevTools
1. Mở trang MoMo Payment Gateway
2. Nhấn **F12** hoặc **Ctrl+Shift+I** (Windows/Linux) hoặc **Cmd+Option+I** (Mac)

### Bước 2: Toggle Device Toolbar
1. Nhấn **Ctrl+Shift+M** (Windows/Linux) hoặc **Cmd+Shift+M** (Mac)
2. Hoặc click icon 📱 **Toggle Device Toolbar** ở góc trên bên trái DevTools

### Bước 3: Chọn Device
1. Trong dropdown "Dimensions", chọn một trong các device:
   - **iPhone 14 Pro** (Recommended cho iOS)
   - **Samsung Galaxy S20 Ultra** (Recommended cho Android)
   - **Pixel 5**
   - **iPhone 12 Pro**

### Bước 4: Reload Page
1. Nhấn **Ctrl+R** (Windows/Linux) hoặc **Cmd+R** (Mac) để reload
2. Hoặc click nút refresh trong browser

### Bước 5: Verify Mobile Version
Sau khi reload, bạn sẽ thấy:
- ✅ Nút **"Thanh toán bằng Ví MoMo"** xuất hiện
- ✅ Layout mobile với logo ở giữa
- ✅ Không còn QR code lớn (chỉ có trên desktop)

### Bước 6: Extract Data
1. Click icon extension
2. Click **"Extract Payment Data"**
3. Extension sẽ trích xuất được đầy đủ thông tin bao gồm deep links

---

## Cách 2: User-Agent Switcher Extension

Nếu không muốn dùng DevTools, bạn có thể cài thêm extension:

### Chrome/Edge
1. Cài [User-Agent Switcher and Manager](https://chrome.google.com/webstore/detail/user-agent-switcher-and-m/bhchdcejhohfmigjafbampogmaanbfkg)
2. Click icon extension → Chọn **"Android - Chrome Mobile"**
3. Reload trang MoMo

### Firefox
1. Cài [User-Agent Switcher](https://addons.mozilla.org/en-US/firefox/addon/uaswitcher/)
2. Click icon extension → Chọn **"Android - Chrome"**
3. Reload trang MoMo

---

## Cách 3: Tự động với React App

React App của bạn đã tự động detect device và lưu thông tin vào `localStorage`:

```javascript
{
  "current": {
    "deviceType": "desktop",
    "platform": "desktop",
    "width": 1920,
    "height": 1080,
    "isMobile": false,
    "isDesktop": true
  },
  "recommended": {
    "userAgent": "Mozilla/5.0 (Linux; Android 14; SM-S918B)...",
    "viewport": {
      "width": 360,
      "height": 800,
      "isMobile": true
    },
    "platform": "android"
  }
}
```

Extension sẽ đọc thông tin này và inject mobile viewport. **Tuy nhiên**, điều này KHÔNG đủ vì:
- User-Agent vẫn là desktop (content script không thể thay đổi User-Agent)
- MoMo server-side detect User-Agent để quyết định hiển thị mobile/desktop version

**Vì vậy, bạn vẫn phải dùng DevTools Device Mode hoặc User-Agent Switcher Extension.**

---

## Debug

### Check Page Version
Mở Console (F12 → Console tab), bạn sẽ thấy:

#### Desktop Version (Không đủ data):
```
🔍 Page version: Desktop ❌
⚠️ Desktop version detected!
💡 Enable Chrome DevTools Device Mode (F12 → Toggle Device Toolbar) and reload
```

#### Mobile Version (Đầy đủ data):
```
🔍 Page version: Mobile ✅
✅ MoMo App Link found: https://applinks.momo.vn/payment/v2?...
✅ MoMo Deep Link found: momo://app?...
```

### Check Extracted Data
Sau khi extract, check console:
```javascript
Extracted payment data: {
  qrCode: "data:image/png;base64,...",
  paymentUrl: "https://payment.momo.vn/v2/gateway/pay?...",
  momoAppLink: "https://applinks.momo.vn/payment/v2?...",  // ← Phải có
  momoDeepLink: "momo://app?...",                           // ← Phải có
  merchant: "Tiki",
  orderId: "...",
  amount: 300000
}
```

Nếu **KHÔNG có** `momoAppLink` và `momoDeepLink` → Bạn đang ở desktop version!

---

## Recommended User-Agents

### iOS (iPhone 14 Pro)
```
Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1
```

### Android (Samsung Galaxy S23)
```
Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36
```

### Android (Google Pixel 7)
```
Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36
```

---

## Troubleshooting

### 1. Extension không extract được deep links
**Nguyên nhân**: Đang ở desktop version  
**Giải pháp**: Enable Device Mode và reload page

### 2. Nút "Thanh toán bằng Ví MoMo" không xuất hiện
**Nguyên nhân**: User-Agent vẫn là desktop  
**Giải pháp**: 
- Check DevTools có toggle device mode chưa
- Hoặc cài User-Agent Switcher extension

### 3. Page layout vỡ khi emulate mobile
**Nguyên nhân**: Viewport quá nhỏ  
**Giải pháp**: Chọn device lớn hơn (iPhone 14 Pro Max, Galaxy S23 Ultra)

### 4. Deep links không work trên React app
**Nguyên nhân**: `momoAppLink` hoặc `momoDeepLink` bị `undefined`  
**Giải pháp**: 
1. Verify extension đã extract được links (check console)
2. Reload React app page
3. Check `PaymentCard.js` console logs

---

## Kết luận

**TL;DR**: 
1. Mở trang MoMo Payment
2. Nhấn **Ctrl+Shift+M** để toggle device mode
3. Chọn **iPhone 14 Pro** hoặc **Galaxy S20 Ultra**
4. Reload page (**Ctrl+R**)
5. Click extension để extract data
6. Done! ✅

**Lưu ý quan trọng**: Chrome extension **KHÔNG THỂ** thay đổi User-Agent của request. Bạn **BẮT BUỘC** phải dùng DevTools Device Mode hoặc User-Agent Switcher extension để MoMo server trả về mobile version.

