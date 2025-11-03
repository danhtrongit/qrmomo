const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Lưu trữ sessions: token -> { ws: WebSocket, data: PaymentData, createdAt: Date }
const sessions = new Map();

// Cleanup old sessions (> 30 phút)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 phút
  
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > timeout) {
      console.log(`Cleaning up expired session: ${token}`);
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.close();
      }
      sessions.delete(token);
    }
  }
}, 5 * 60 * 1000); // Check mỗi 5 phút

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  console.log(`WebSocket connection attempt with token: ${token}`);
  
  if (!token) {
    console.log('Connection rejected: No token provided');
    ws.close(1008, 'Token required');
    return;
  }
  
  // Lưu WebSocket connection với token
  const session = sessions.get(token) || { 
    data: null, 
    createdAt: Date.now(),
    clients: []
  };
  
  session.clients.push(ws);
  sessions.set(token, session);
  
  console.log(`Client connected for token: ${token}. Total clients: ${session.clients.length}`);
  
  // Gửi data hiện có nếu có
  if (session.data) {
    ws.send(JSON.stringify({
      type: 'PAYMENT_DATA',
      payload: session.data
    }));
  }
  
  // Gửi thông tin session
  ws.send(JSON.stringify({
    type: 'SESSION_INFO',
    payload: {
      token,
      connectedAt: new Date().toISOString(),
      hasData: !!session.data
    }
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message for token ${token}:`, data.type);
      
      // Handle different message types
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`Client disconnected from token: ${token}`);
    const session = sessions.get(token);
    if (session) {
      session.clients = session.clients.filter(client => client !== ws);
      if (session.clients.length === 0) {
        // Giữ session data trong 5 phút sau khi tất cả clients disconnect
        setTimeout(() => {
          const currentSession = sessions.get(token);
          if (currentSession && currentSession.clients.length === 0) {
            console.log(`Removing session: ${token}`);
            sessions.delete(token);
          }
        }, 5 * 60 * 1000);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for token ${token}:`, error);
  });
});

// REST API để extension gửi data
app.post('/api/payment', (req, res) => {
  const { token, data } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  if (!data) {
    return res.status(400).json({ error: 'Payment data required' });
  }
  
  console.log(`Received payment data for token: ${token}`);
  
  // Lưu hoặc cập nhật session
  const session = sessions.get(token) || { 
    clients: [], 
    createdAt: Date.now() 
  };
  
  session.data = data;
  session.updatedAt = Date.now();
  sessions.set(token, session);
  
  // Broadcast đến tất cả clients đang kết nối với token này
  let sentCount = 0;
  session.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'PAYMENT_DATA',
        payload: data
      }));
      sentCount++;
    }
  });
  
  console.log(`Broadcasted to ${sentCount} clients for token: ${token}`);
  
  res.json({ 
    success: true, 
    token,
    clientsNotified: sentCount,
    message: 'Payment data received and broadcasted'
  });
});

// API để tạo token mới
app.post('/api/token/generate', (req, res) => {
  const token = uuidv4();
  
  sessions.set(token, {
    clients: [],
    data: null,
    createdAt: Date.now()
  });
  
  console.log(`Generated new token: ${token}`);
  
  res.json({ 
    token,
    url: `http://localhost:3000/qr/${token}`,
    wsUrl: `ws://localhost:3001?token=${token}`
  });
});

// API để lấy thông tin session
app.get('/api/session/:token', (req, res) => {
  const { token } = req.params;
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    token,
    hasData: !!session.data,
    connectedClients: session.clients.length,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : null
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = {
    totalSessions: sessions.size,
    sessions: []
  };
  
  sessions.forEach((session, token) => {
    stats.sessions.push({
      token: token.substring(0, 8) + '...',
      clients: session.clients.length,
      hasData: !!session.data,
      age: Math.floor((Date.now() - session.createdAt) / 1000) + 's'
    });
  });
  
  res.json(stats);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MoMo Payment WebSocket Server Started');
  console.log('='.repeat(60));
  console.log(`📡 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

