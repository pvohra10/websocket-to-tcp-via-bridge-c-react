const WebSocket = require('ws');
const net = require('net');

const WS_PORT = 8080;
const TCP_HOST = '127.0.0.1';
const TCP_PORT = 9000;

// Track active WebSocket clients
const clients = new Set();

// 1. Connect to C++ Backend
const tcpClient = new net.Socket();

function connectToCpp() {
  console.log(`[Bridge] Connecting to C++ backend at ${TCP_HOST}:${TCP_PORT}...`);
  tcpClient.connect(TCP_PORT, TCP_HOST, () => {
    console.log('[Bridge] Successfully connected to C++ backend!');
  });
}

connectToCpp();

tcpClient.on('error', (err) => {
  console.error('[Bridge] TCP connection error:', err.message);
  // Add reconnection logic here if needed
});

// 2. Broadcast C++ data to ALL connected React clients safely
tcpClient.on('data', (data) => {
  const messageStr = data.toString();
  console.log(`[Bridge] Forwarding C++ data to ${clients.size} client(s): ${messageStr}`);
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  }
});

// 3. Start WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`[Bridge] WebSocket server listening on ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('[Bridge] React frontend connected');
  clients.add(ws);

  // Forward React -> C++
  ws.on('message', (message) => {
    console.log(`[Bridge] Forwarding React message to C++: ${message}`);
    tcpClient.write(message);
  });

  ws.on('close', () => {
    console.log('[Bridge] React frontend disconnected');
    clients.delete(ws);
  });
});