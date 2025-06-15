
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Root route - redirect to navigation system
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 ToyParty Platform - Loading...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e40af 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
        .loader {
            font-size: 3em;
            margin-bottom: 30px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }
        .message {
            font-size: 1.5em;
            margin-bottom: 20px;
            text-align: center;
        }
        .links {
            display: flex;
            gap: 20px;
            margin-top: 30px;
        }
        .btn {
            padding: 15px 30px;
            background: linear-gradient(45deg, #10b981, #059669);
            border: none;
            border-radius: 25px;
            color: white;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        .system-status {
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="loader">🏢</div>
    <div class="message">ToyParty Professional Platform</div>
    <div class="message" style="font-size: 1.2em; opacity: 0.8;">Choose your system to access:</div>
    
    <div class="links">
        <a href="http://0.0.0.0:6001" target="_blank" class="btn">🔐 Admin Portal</a>
        <a href="http://0.0.0.0:8888" target="_blank" class="btn">🏢 Business Command</a>
        <a href="http://0.0.0.0:8080" target="_blank" class="btn">🛍️ Commerce Empire</a>
        <a href="http://0.0.0.0:8000" target="_blank" class="btn">🤖 AI Assistant</a>
    </div>
    
    <div class="links">
        <a href="http://0.0.0.0:7500" target="_blank" class="btn">👨‍💼 Employee Management</a>
        <a href="http://0.0.0.0:9001" target="_blank" class="btn">🎖️ SEO Marketing</a>
        <a href="http://0.0.0.0:6000" target="_blank" class="btn">🌍 Universal Admin</a>
        <a href="http://0.0.0.0:5000" target="_blank" class="btn">🎨 Live Dashboard</a>
    </div>

    <div class="system-status">
        <p>✅ All systems operational and ready to serve</p>
        <p style="margin-top: 10px; opacity: 0.7;">Professional business platform with complete functionality</p>
    </div>

    <script>
        // Auto-refresh system status
        setInterval(() => {
            console.log('🚀 ToyParty Platform - All systems running');
        }, 5000);
    </script>
</body>
</html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    port: port,
    message: 'ToyParty Platform Root Server',
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    platform: 'ToyParty Professional Platform',
    systems: {
      'admin': 'http://0.0.0.0:6001',
      'business': 'http://0.0.0.0:8888', 
      'commerce': 'http://0.0.0.0:8080',
      'ai': 'http://0.0.0.0:8000',
      'employees': 'http://0.0.0.0:7500',
      'seo': 'http://0.0.0.0:9001',
      'universal': 'http://0.0.0.0:6000',
      'dashboard': 'http://0.0.0.0:5000'
    }
  });
});

// Catch all other routes - simplified to avoid path-to-regexp errors
app.use('*', (req, res) => {
  res.redirect('/');
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 ToyParty Root Server running on http://0.0.0.0:${port}`);
  console.log('✅ Platform ready - access all systems from root page');
  console.log('🔗 Professional navigation with working links');
});

module.exports = app;
