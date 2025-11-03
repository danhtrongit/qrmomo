import React from 'react';
import './PaymentCard.css';

function PaymentCard({ data }) {
  if (!data) return null;

  const formatCurrency = (amount) => {
    return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  const formatTime = (countdown) => {
    if (!countdown || countdown < 0) return { minutes: 0, seconds: 0 };
    
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    
    return { minutes, seconds };
  };

  const handleOpenApp = () => {
    // Extract QR data from the QR code image if available
    // For now, we'll use the qrCode data URL directly
    // In production, you might want to extract the actual MoMo deep link
    const momoDeepLink = data.qrCode; // This should be the actual MoMo deep link
    
    // Try to open MoMo app with deep link
    window.location.href = `momo://app`;
    
    // Fallback: If app is not installed, redirect to app store after a delay
    setTimeout(() => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      if (/android/i.test(userAgent)) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.momo.platform';
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = 'https://apps.apple.com/vn/app/momo-chuy%E1%BB%83n-ti%E1%BB%81n-thanh-to%C3%A1n/id918751511';
      }
    }, 1500);
  };

  const { minutes, seconds } = formatTime(data.countdown);

  return (
    <div className="payment-card">
      {/* Left Side - Order Information */}
      <div className="order-info-section">
        <h1 className="order-info-title">Thông tin đơn hàng</h1>

        {/* Merchant */}
        {data.merchant && (
          <div className="detail-row">
            <div className="detail-label">Nhà cung cấp</div>
            <div className="detail-value">
              <div className="merchant-info">
                {data.merchantLogo && (
                  <img src={data.merchantLogo} alt={data.merchant} className="merchant-logo" />
                )}
                <span className="merchant-name">{data.merchant}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order ID */}
        {data.orderId && (
          <div className="detail-row">
            <div className="detail-label">Mã đơn hàng</div>
            <div className="detail-value">
              <code>{data.orderId}</code>
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="detail-row">
            <div className="detail-label">Mô tả</div>
            <div className="detail-value">
              {data.description}
            </div>
          </div>
        )}

        {/* Amount */}
        {data.amount && (
          <div className="detail-row">
            <div className="detail-label">Số tiền</div>
            <div className="detail-value">
              <div className="amount-value">{formatCurrency(data.amount)}</div>
            </div>
          </div>
        )}

        {/* Countdown */}
        {data.countdown !== undefined && (
          <div className="countdown-inline">
            <div className="countdown-label-inline">Đơn hàng sẽ hết hạn sau:</div>
            <div className="time-boxes">
              <div className="time-box">
                <span className="time-number">{String(minutes).padStart(2, '0')}</span>
                <span className="time-label">Phút</span>
              </div>
              <div className="time-box">
                <span className="time-number">{String(seconds).padStart(2, '0')}</span>
                <span className="time-label">Giây</span>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="back-button">
          <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>
            Quay về
          </a>
        </div>
      </div>

      {/* Right Side - QR Code */}
      <div className="qr-code-section">
        <h2 className="qr-title">Quét mã QR để thanh toán</h2>
        
        {data.qrCode && (
          <div className="qr-container">
            <div className="qr-frame">
              <div className="qr-frame-corner top-left"></div>
              <div className="qr-frame-corner top-right"></div>
              <div className="qr-frame-corner bottom-left"></div>
              <div className="qr-frame-corner bottom-right"></div>
            </div>
            <img src={data.qrCode} alt="QR Code" className="qr-image" />
          </div>
        )}

        {/* Open App Button - Only visible on mobile */}
        <button className="open-app-button" onClick={handleOpenApp}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Mở bằng App MoMo
        </button>

        <div className="qr-instruction">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Sử dụng <strong>App MoMo</strong> hoặc ứng dụng camera hỗ trợ QR code để quét mã
        </div>

        <div className="qr-help">
          Gặp khó khăn khi thanh toán? <a href="#">Xem Hướng dẫn</a>
        </div>
      </div>
    </div>
  );
}

export default PaymentCard;
