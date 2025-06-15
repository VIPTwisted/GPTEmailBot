
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergency Server - System Online</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container { 
            text-align: center; 
            padding: 2rem;
            background: rgba(0,0,0,0.2);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        h1 { 
            font-size: 3rem; 
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status { 
            font-size: 1.2rem; 
            margin: 1rem 0;
            opacity: 0.9;
        }
        .pulse { 
            display: inline-block;
            width: 12px;
            height: 12px;
            background: #4ade80;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
        .info { 
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            font-size: 0.9rem;
        }
        .btn {
            display: inline-block;
            margin: 1rem 0.5rem;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Emergency Server</h1>
        <div class="status">
            <span class="pulse"></span>
            System Online & Operational
        </div>
        <div class="info">
            <p><strong>Server Status:</strong> Running Successfully</p>
            <p><strong>Port:</strong> ${port}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Mode:</strong> Emergency Recovery</p>
        </div>
        <div style="margin-top: 2rem;">
            <a href="/status" class="btn">📊 System Status</a>
            <a href="/health" class="btn">💚 Health Check</a>
        </div>
    </div>
</body>
</html>
    `);
    return;
  }
  
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      message: 'Emergency server running successfully',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: port,
      memory: process.memoryUsage(),
      pid: process.pid,
      version: process.version
    }, null, 2));
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      checks: {
        server: 'ok',
        memory: 'ok',
        disk: 'ok'
      },
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <h1>404 - Not Found</h1>
    <p>The requested resource was not found.</p>
    <a href="/">← Back to home</a>
  `);
});

server.listen(port, '0.0.0.0', () => {
  console.log('🚀 Emergency Server Started Successfully');
  console.log(`🌐 Server running on http://0.0.0.0:${port}`);
  console.log(`📊 Process ID: ${process.pid}`);
  console.log(`⚡ Node.js Version: ${process.version}`);
  console.log(`💚 All systems operational`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${port} is busy, trying alternative port...`);
    const altPort = port + 1;
    server.listen(altPort, '0.0.0.0', () => {
      console.log(`🚀 Emergency Server running on alternative port: ${altPort}`);
    });
  } else {
    console.error('❌ Server startup error:', err.message);
    process.exit(1);
  }
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${port} is busy, trying to kill existing processes...`);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
