import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './QRPage.css';
import PaymentCard from '../components/PaymentCard';
import CONFIG from '../config';
import { createDeviceInfoForExtension, onDeviceChange } from '../utils/deviceDetector';

const WS_URL = CONFIG.WS_URL;

function QRPage() {
  const { token } = useParams();
  const [paymentData, setPaymentData] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting, connected, disconnected, error
  const [sessionInfo, setSessionInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Detect device và lưu vào localStorage cho extension
  useEffect(() => {
    const updateDeviceInfo = () => {
      const info = createDeviceInfoForExtension();
      setDeviceInfo(info);
      
      // Lưu vào localStorage để extension có thể đọc
      localStorage.setItem('momo_device_info', JSON.stringify(info));
      
      // Determine if mobile device
      const isMobile = info.current.deviceType === 'mobile' || 
                      info.current.deviceType === 'ios' || 
                      info.current.deviceType === 'android';
      
      // Try to notify extension about device type (if extension is installed)
      if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage(
            {
              type: 'DEVICE_INFO_UPDATE',
              data: {
                deviceType: info.current.deviceType,
                isMobile: isMobile,
                viewport: info.current.viewport
              }
            },
            (response) => {
              // Ignore errors if extension not installed
              if (chrome.runtime.lastError) return;
            }
          );
        } catch (error) {
          // Extension not available - ignore
        }
      }
    };

    // Update immediately
    updateDeviceInfo();

    // Listen for resize
    const cleanup = onDeviceChange(updateDeviceInfo);

    return cleanup;
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token]);

  const connectWebSocket = () => {
    try {
      console.log(`Connecting to WebSocket with token: ${token}`);
      console.log(`WebSocket URL: ${WS_URL}`);
      setWsStatus('connecting');

      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsStatus('connected');
        
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message.type);

          if (message.type === 'PAYMENT_DATA') {
            setPaymentData(message.payload);
          } else if (message.type === 'SESSION_INFO') {
            setSessionInfo(message.payload);
          } else if (message.type === 'PONG') {
            // Server responded to ping
            console.log('Ping OK');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setWsStatus('disconnected');

        // Chỉ reconnect nếu không phải do close bình thường
        if (event.code !== 1000 && event.code !== 1001) {
          // Tự động reconnect sau 3 giây
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        }
      };

      // Ping every 25 seconds để keep connection alive (trước timeout 30s)
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'PING' }));
          } catch (error) {
            console.error('Error sending ping:', error);
          }
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);

      ws.addEventListener('close', () => {
        clearInterval(pingInterval);
      });

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setWsStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (wsStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (wsStatus) {
      case 'connected': return '🟢 Đã kết nối';
      case 'connecting': return '🟡 Đang kết nối...';
      case 'disconnected': return '🔴 Mất kết nối';
      case 'error': return '❌ Lỗi kết nối';
      default: return '⚪ Không xác định';
    }
  };

  return (
    <div className="qr-page">
      <header className="qr-header">
        <div className="header-content">
          <div className="logo-section">
            <svg className="momo-logo-small" fill="#fff" height="40" viewBox="0 0 96 87" width="40" xmlns="http://www.w3.org/2000/svg">
              <path d="M75.5326 0C64.2284 0 55.0651 8.74843 55.0651 19.5409C55.0651 30.3333 64.2284 39.0818 75.5326 39.0818C86.8368 39.0818 96 30.3333 96 19.5409C96 8.74843 86.8368 0 75.5326 0ZM75.5326 27.8805C70.7368 27.8805 66.8403 24.1604 66.8403 19.5818C66.8403 15.0031 70.7368 11.283 75.5326 11.283C80.3283 11.283 84.2248 15.0031 84.2248 19.5818C84.2248 24.1604 80.3283 27.8805 75.5326 27.8805ZM49.1561 14.6761V39.1226H37.3809V14.5535C37.3809 12.7138 35.8394 11.2421 33.9126 11.2421C31.9857 11.2421 30.4442 12.7138 30.4442 14.5535V39.1226H18.669V14.5535C18.669 12.7138 17.1276 11.2421 15.2007 11.2421C13.2739 11.2421 11.7324 12.7138 11.7324 14.5535V39.1226H0V14.6761C0 6.58176 6.89385 0 15.372 0C18.8403 0 22.0089 1.10377 24.5781 2.9434C27.1472 1.10377 30.3586 0 33.7841 0C42.2623 0 49.1561 6.58176 49.1561 14.6761ZM75.5326 47.544C64.2284 47.544 55.0651 56.2925 55.0651 67.0849C55.0651 77.8774 64.2284 86.6258 75.5326 86.6258C86.8368 86.6258 96 77.8774 96 67.0849C96 56.2925 86.8368 47.544 75.5326 47.544ZM75.5326 75.4245C70.7368 75.4245 66.8403 71.7044 66.8403 67.1258C66.8403 62.5472 70.7368 58.827 75.5326 58.827C80.3283 58.827 84.2248 62.5472 84.2248 67.1258C84.2248 71.7044 80.3283 75.4245 75.5326 75.4245ZM49.1561 62.2201V86.6667H37.3809V62.0975C37.3809 60.2579 35.8394 58.7862 33.9126 58.7862C31.9857 58.7862 30.4442 60.2579 30.4442 62.0975V86.6667H18.669V62.0975C18.669 60.2579 17.1276 58.7862 15.2007 58.7862C13.2739 58.7862 11.7324 60.2579 11.7324 62.0975V86.6667H0V62.2201C0 54.1258 6.89385 47.544 15.372 47.544C18.8403 47.544 22.0089 48.6478 24.5781 50.4874C27.1472 48.6478 30.3158 47.544 33.7841 47.544C42.2623 47.544 49.1561 54.1258 49.1561 62.2201Z" />
            </svg>
            <h2>MoMo Payment</h2>
          </div>
          
          <div className="status-section">
            <div className="status-badge" style={{ background: getStatusColor() }}>
              {getStatusText()}
            </div>
            <div className="token-display">
              <span className="token-label">Token:</span>
              <code className="token-code">{token.substring(0, 8)}...</code>
            </div>
          </div>
        </div>
      </header>

      <main className="qr-main">
        {wsStatus === 'error' && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h3>Không thể kết nối WebSocket Server</h3>
            <p>Vui lòng đảm bảo WebSocket server đang chạy tại <code>{WS_URL}</code></p>
            <button onClick={connectWebSocket} className="retry-button">
              🔄 Thử lại
            </button>
          </div>
        )}

        {wsStatus !== 'error' && !paymentData && (
          <div className="waiting-container">
            <div className="spinner"></div>
            <h3>Đang chờ dữ liệu thanh toán...</h3>
            <p>Session đã sẵn sàng. Vui lòng trích xuất thông tin từ trang MoMo.</p>
            {sessionInfo && (
              <div className="session-info">
                <p>📅 Kết nối lúc: {new Date(sessionInfo.connectedAt).toLocaleTimeString('vi-VN')}</p>
              </div>
            )}
          </div>
        )}

        {paymentData && <PaymentCard data={paymentData} />}
      </main>

      <footer className="qr-footer">
        <p>Real-time via WebSocket • Session: {token.substring(0, 12)}...</p>
      </footer>
    </div>
  );
}

export default QRPage;

