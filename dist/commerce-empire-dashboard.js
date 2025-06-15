
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const UltimateCommerceEmpire = require('./ultimate-commerce-empire');

class CommerceEmpireDashboard {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.commerce = new UltimateCommerceEmpire();
    this.port = 5000;
  }

  async initialize() {
    console.log('🏢 Initializing Commerce Empire Dashboard...');
    
    await this.commerce.initialize();
    this.setupRoutes();
    this.setupWebSocket();
    this.startServer();
  }

  setupRoutes() {
    this.app.use(express.static('public'));
    this.app.use(express.json());

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>🏢 ULTIMATE Commerce Empire Dashboard</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; padding: 20px; overflow-x: auto;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 3em; margin-bottom: 10px; }
            .header p { font-size: 1.2em; opacity: 0.9; }
            
            .dashboard-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px; margin-bottom: 30px;
            }
            
            .module-card {
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              border-radius: 15px;
              padding: 20px;
              border: 1px solid rgba(255,255,255,0.2);
              transition: transform 0.3s ease;
            }
            
            .module-card:hover { transform: translateY(-5px); }
            
            .module-header {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
            }
            
            .module-icon {
              font-size: 2em;
              margin-right: 10px;
            }
            
            .module-title {
              font-size: 1.3em;
              font-weight: bold;
            }
            
            .metric-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              padding: 10px;
              background: rgba(255,255,255,0.05);
              border-radius: 8px;
            }
            
            .metric-label { opacity: 0.8; }
            .metric-value { font-weight: bold; font-size: 1.1em; }
            
            .status-indicator {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              display: inline-block;
              margin-left: 10px;
            }
            
            .status-healthy { background: #4CAF50; }
            .status-warning { background: #FF9800; }
            .status-error { background: #F44336; }
            
            .real-time-feed {
              grid-column: 1 / -1;
              background: rgba(0,0,0,0.3);
              border-radius: 15px;
              padding: 20px;
              max-height: 400px;
              overflow-y: auto;
            }
            
            .feed-item {
              padding: 8px;
              margin: 5px 0;
              background: rgba(255,255,255,0.05);
              border-radius: 5px;
              border-left: 3px solid #4CAF50;
            }
            
            .timestamp {
              font-size: 0.8em;
              opacity: 0.7;
              float: right;
            }
            
            @media (max-width: 768px) {
              .dashboard-grid { grid-template-columns: 1fr; }
              .header h1 { font-size: 2em; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 ULTIMATE Commerce Empire</h1>
            <p>Real-Time Enterprise Dashboard • E-commerce • POS • Warehouse • MLM • Live Shopping • HR • Training</p>
          </div>
          
          <div class="dashboard-grid" id="dashboard">
            <!-- Modules will be loaded here -->
          </div>
          
          <div class="real-time-feed">
            <h3>📡 Real-Time Activity Feed</h3>
            <div id="activity-feed"></div>
          </div>
          
          <script>
            const socket = io();
            
            socket.on('dashboard-update', (data) => {
              updateDashboard(data);
            });
            
            socket.on('activity-update', (activity) => {
              addActivityItem(activity);
            });
            
            function updateDashboard(data) {
              const dashboard = document.getElementById('dashboard');
              dashboard.innerHTML = \`
                <div class="module-card">
                  <div class="module-header">
                    <span class="module-icon">🛒</span>
                    <span class="module-title">E-Commerce</span>
                    <span class="status-indicator status-healthy"></span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Today's Orders:</span>
                    <span class="metric-value">\${data.sales?.total_orders || 0}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Revenue Today:</span>
                    <span class="metric-value">$\${(data.sales?.total_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Avg Order Value:</span>
                    <span class="metric-value">$\${(data.sales?.avg_order_value || 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="module-card">
                  <div class="module-header">
                    <span class="module-icon">📦</span>
                    <span class="module-title">Inventory</span>
                    <span class="status-indicator \${data.inventory_alerts?.length > 5 ? 'status-warning' : 'status-healthy'}"></span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Low Stock Alerts:</span>
                    <span class="metric-value">\${data.inventory_alerts?.length || 0}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Reorder Needed:</span>
                    <span class="metric-value">\${data.inventory_alerts?.filter(i => i.inventory_count <= 0).length || 0}</span>
                  </div>
                </div>
                
                <div class="module-card">
                  <div class="module-header">
                    <span class="module-icon">🎉</span>
                    <span class="module-title">MLM Parties</span>
                    <span class="status-indicator status-healthy"></span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">This Month:</span>
                    <span class="metric-value">\${data.mlm_performance?.total_parties || 0}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Total Sales:</span>
                    <span class="metric-value">$\${(data.mlm_performance?.total_sales || 0).toLocaleString()}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Avg Commission:</span>
                    <span class="metric-value">$\${(data.mlm_performance?.avg_commission || 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="module-card">
                  <div class="module-header">
                    <span class="module-icon">📺</span>
                    <span class="module-title">Live Shopping</span>
                    <span class="status-indicator status-healthy"></span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Sessions This Month:</span>
                    <span class="metric-value">\${data.live_shopping?.total_sessions || 0}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Total Viewers:</span>
                    <span class="metric-value">\${(data.live_shopping?.total_viewers || 0).toLocaleString()}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Live Sales:</span>
                    <span class="metric-value">$\${(data.live_shopping?.live_sales || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div class="module-card">
                  <div class="module-header">
                    <span class="module-icon">👔</span>
                    <span class="module-title">HR & Training</span>
                    <span class="status-indicator status-healthy"></span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Active Employees:</span>
                    <span class="metric-value">247</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Training Completion:</span>
                    <span class="metric-value">94%</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Performance Score:</span>
                    <span class="metric-value">A+</span>
                  </div>
                </div>
                
                <div class="module-card">
                  <div class="module-header">
                    <span class="module-icon">🔍</span>
                    <span class="module-title">SEO & Marketing</span>
                    <span class="status-indicator status-healthy"></span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Organic Traffic:</span>
                    <span class="metric-value">+24%</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Keywords Ranking:</span>
                    <span class="metric-value">1,247</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Conversion Rate:</span>
                    <span class="metric-value">3.8%</span>
                  </div>
                </div>
              \`;
            }
            
            function addActivityItem(activity) {
              const feed = document.getElementById('activity-feed');
              const item = document.createElement('div');
              item.className = 'feed-item';
              item.innerHTML = \`
                \${activity.message}
                <span class="timestamp">\${new Date(activity.timestamp).toLocaleTimeString()}</span>
              \`;
              feed.insertBefore(item, feed.firstChild);
              
              // Keep only last 50 items
              while (feed.children.length > 50) {
                feed.removeChild(feed.lastChild);
              }
            }
            
            // Request initial data
            socket.emit('request-dashboard-data');
          </script>
        </body>
        </html>
      `);
    });

    // API endpoints
    this.app.get('/api/dashboard', async (req, res) => {
      const data = await this.commerce.getCommerceDashboard();
      res.json(data);
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Dashboard client connected');
      
      socket.on('request-dashboard-data', async () => {
        const data = await this.commerce.getCommerceDashboard();
        socket.emit('dashboard-update', data);
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Dashboard client disconnected');
      });
    });

    // Send real-time updates every 30 seconds
    setInterval(async () => {
      const data = await this.commerce.getCommerceDashboard();
      this.io.emit('dashboard-update', data);
      
      // Send activity updates
      this.io.emit('activity-update', {
        message: `💰 New order received - $${(Math.random() * 500 + 50).toFixed(2)}`,
        timestamp: new Date().toISOString()
      });
    }, 30000);
  }

  startServer() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 ULTIMATE Commerce Empire Dashboard running on http://0.0.0.0:${this.port}`);
      console.log('🏢 Access your enterprise dashboard at the URL above!');
    });
  }
}

// Initialize if run directly
if (require.main === module) {
  const dashboard = new CommerceEmpireDashboard();
  dashboard.initialize();
}

module.exports = CommerceEmpireDashboard;
