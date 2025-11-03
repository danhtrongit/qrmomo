import React from 'react';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="logo-container">
          <svg className="momo-logo" fill="#fff" height="80" viewBox="0 0 96 87" width="80" xmlns="http://www.w3.org/2000/svg">
            <path d="M75.5326 0C64.2284 0 55.0651 8.74843 55.0651 19.5409C55.0651 30.3333 64.2284 39.0818 75.5326 39.0818C86.8368 39.0818 96 30.3333 96 19.5409C96 8.74843 86.8368 0 75.5326 0ZM75.5326 27.8805C70.7368 27.8805 66.8403 24.1604 66.8403 19.5818C66.8403 15.0031 70.7368 11.283 75.5326 11.283C80.3283 11.283 84.2248 15.0031 84.2248 19.5818C84.2248 24.1604 80.3283 27.8805 75.5326 27.8805ZM49.1561 14.6761V39.1226H37.3809V14.5535C37.3809 12.7138 35.8394 11.2421 33.9126 11.2421C31.9857 11.2421 30.4442 12.7138 30.4442 14.5535V39.1226H18.669V14.5535C18.669 12.7138 17.1276 11.2421 15.2007 11.2421C13.2739 11.2421 11.7324 12.7138 11.7324 14.5535V39.1226H0V14.6761C0 6.58176 6.89385 0 15.372 0C18.8403 0 22.0089 1.10377 24.5781 2.9434C27.1472 1.10377 30.3586 0 33.7841 0C42.2623 0 49.1561 6.58176 49.1561 14.6761ZM75.5326 47.544C64.2284 47.544 55.0651 56.2925 55.0651 67.0849C55.0651 77.8774 64.2284 86.6258 75.5326 86.6258C86.8368 86.6258 96 77.8774 96 67.0849C96 56.2925 86.8368 47.544 75.5326 47.544ZM75.5326 75.4245C70.7368 75.4245 66.8403 71.7044 66.8403 67.1258C66.8403 62.5472 70.7368 58.827 75.5326 58.827C80.3283 58.827 84.2248 62.5472 84.2248 67.1258C84.2248 71.7044 80.3283 75.4245 75.5326 75.4245ZM49.1561 62.2201V86.6667H37.3809V62.0975C37.3809 60.2579 35.8394 58.7862 33.9126 58.7862C31.9857 58.7862 30.4442 60.2579 30.4442 62.0975V86.6667H18.669V62.0975C18.669 60.2579 17.1276 58.7862 15.2007 58.7862C13.2739 58.7862 11.7324 60.2579 11.7324 62.0975V86.6667H0V62.2201C0 54.1258 6.89385 47.544 15.372 47.544C18.8403 47.544 22.0089 48.6478 24.5781 50.4874C27.1472 48.6478 30.3158 47.544 33.7841 47.544C42.2623 47.544 49.1561 54.1258 49.1561 62.2201Z" />
          </svg>
          <h1>MoMo Payment Viewer</h1>
        </div>
        <p className="subtitle">Hệ thống xem thông tin thanh toán MoMo</p>
      </header>

      <main className="home-main">
        <div className="info-card">
          <div className="icon-large">🔌</div>
          <h2>Sẵn sàng nhận dữ liệu</h2>
          <p>Mỗi trang thanh toán sẽ có URL riêng với token unique</p>
          
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <h3>Multi-Session</h3>
                <p>Hỗ trợ nhiều trang thanh toán đồng thời</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div>
                <h3>Real-time</h3>
                <p>Cập nhật tức thời qua WebSocket</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <div>
                <h3>Secure Token</h3>
                <p>Mỗi session có token riêng biệt</p>
              </div>
            </div>
          </div>

          <div className="how-to">
            <h3>📖 Cách sử dụng:</h3>
            <ol>
              <li>Mở trang thanh toán MoMo</li>
              <li>Click Extension icon → "Trích xuất thông tin"</li>
              <li>Trang mới sẽ tự động mở với URL: <code>/qr/[token]</code></li>
              <li>Xem thông tin thanh toán real-time</li>
            </ol>
          </div>

          <div className="tech-stack">
            <h4>Công nghệ:</h4>
            <div className="tech-badges">
              <span className="badge">React Router</span>
              <span className="badge">WebSocket</span>
              <span className="badge">Chrome Extension</span>
              <span className="badge">Node.js Server</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2025 - MoMo Payment Viewer v2.0 • WebSocket Edition</p>
      </footer>
    </div>
  );
}

export default HomePage;

