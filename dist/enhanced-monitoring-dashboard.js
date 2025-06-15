
const express = require('express');
const fs = require('fs');

class EnhancedMonitoringDashboard {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.analytics = null;
    this.cache = null;
    this.setupRoutes();
  }

  // Set analytics and cache instances
  setComponents(analytics, cache) {
    this.analytics = analytics;
    this.cache = cache;
  }

  // Setup dashboard routes
  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Real-time metrics API
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = this.analytics ? this.analytics.getRealTimeMetrics() : this.getBasicMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Analytics report API
    this.app.get('/api/report/:timeframe?', async (req, res) => {
      try {
        const timeframe = req.params.timeframe || '24h';
        const report = this.analytics ? await this.analytics.generateReport(timeframe) : null;
        res.json(report || { error: 'Analytics not available' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Cache statistics API
    this.app.get('/api/cache/stats', (req, res) => {
      try {
        const stats = this.cache ? this.cache.getCacheStats() : { error: 'Cache not available' };
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // System health API
    this.app.get('/api/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          analytics: !!this.analytics,
          cache: !!this.cache,
          database: this.analytics ? this.analytics.db.isConnected : false
        },
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          platform: process.platform,
          node_version: process.version
        }
      };

      res.json(health);
    });

    // Export data API
    this.app.get('/api/export/:type', async (req, res) => {
      try {
        const type = req.params.type;
        let exportPath = null;

        switch (type) {
          case 'metrics':
            exportPath = this.analytics ? await this.analytics.exportMetrics() : null;
            break;
          case 'cache':
            exportPath = await this.exportCacheData();
            break;
          default:
            return res.status(400).json({ error: 'Invalid export type' });
        }

        if (exportPath && fs.existsSync(exportPath)) {
          res.download(exportPath);
        } else {
          res.status(404).json({ error: 'Export failed or file not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Enhanced dashboard HTML
    this.app.get('/dashboard', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // Root redirect to dashboard
    this.app.get('/monitor', (req, res) => {
      res.redirect('/dashboard');
    });
  }

  // Get basic metrics when analytics is not available
  getBasicMetrics() {
    return {
      timestamp: Date.now(),
      status: 'limited',
      message: 'Advanced analytics not available',
      basic_stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform
      }
    };
  }

  // Export cache data
  async exportCacheData() {
    if (!this.cache) return null;

    const exportData = {
      exported_at: new Date().toISOString(),
      cache_stats: this.cache.getCacheStats(),
      cache_type: 'intelligent_cache_manager'
    };

    const exportPath = `cache-export-${Date.now()}.json`;
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    return exportPath;
  }

  // Generate enhanced dashboard HTML
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Enhanced Monitoring Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
            color: white;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card h3 { 
            color: #4a5568; 
            margin-bottom: 15px; 
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-value { 
            font-weight: bold; 
            color: #2d3748; 
        }
        .status-good { color: #48bb78; }
        .status-warning { color: #ed8936; }
        .status-error { color: #f56565; }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            transition: width 0.3s ease;
        }
        .loading { 
            text-align: center; 
            color: #666; 
            padding: 20px;
        }
        .chart-container {
            height: 200px;
            background: #f7fafc;
            border-radius: 8px;
            margin: 15px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
        }
        .error { 
            color: #f56565; 
            background: #fed7d7; 
            padding: 10px; 
            border-radius: 8px; 
            margin: 10px 0;
        }
        .export-section {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }
        .last-updated {
            font-size: 0.9em;
            color: #666;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Enhanced Monitoring Dashboard</h1>
            <p>Real-time analytics and system monitoring</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Real-time Metrics</h3>
                <div id="realtime-metrics" class="loading">Loading metrics...</div>
            </div>

            <div class="card">
                <h3>💾 Cache Statistics</h3>
                <div id="cache-stats" class="loading">Loading cache data...</div>
            </div>

            <div class="card">
                <h3>🏥 System Health</h3>
                <div id="system-health" class="loading">Loading health data...</div>
            </div>

            <div class="card">
                <h3>📈 Performance Trends</h3>
                <div id="performance-trends">
                    <div class="chart-container">Performance chart placeholder</div>
                </div>
            </div>
        </div>

        <div class="export-section">
            <h3>📤 Data Export</h3>
            <button class="btn" onclick="exportData('metrics')">Export Analytics</button>
            <button class="btn" onclick="exportData('cache')">Export Cache Data</button>
            <button class="btn" onclick="generateReport()">Generate Report</button>
            <button class="btn" onclick="refreshDashboard()">🔄 Refresh</button>
        </div>

        <div class="last-updated" id="last-updated">
            Last updated: Never
        </div>
    </div>

    <script>
        let refreshInterval;
        
        // Load dashboard data
        async function loadDashboard() {
            await Promise.all([
                loadRealTimeMetrics(),
                loadCacheStats(),
                loadSystemHealth()
            ]);
            
            document.getElementById('last-updated').textContent = 
                'Last updated: ' + new Date().toLocaleString();
        }

        // Load real-time metrics
        async function loadRealTimeMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                let html = '';
                if (data.metrics) {
                    html += '<div class="metric"><span>Total Syncs:</span><span class="metric-value">' + data.metrics.syncs.total + '</span></div>';
                    html += '<div class="metric"><span>Success Rate:</span><span class="metric-value status-good">' + 
                        (data.metrics.syncs.total > 0 ? ((data.metrics.syncs.successful / data.metrics.syncs.total) * 100).toFixed(1) + '%' : '0%') + '</span></div>';
                    html += '<div class="metric"><span>Avg Sync Time:</span><span class="metric-value">' + 
                        (data.performance ? data.performance.avg_sync_time + 'ms' : 'N/A') + '</span></div>';
                    html += '<div class="metric"><span>Uptime:</span><span class="metric-value">' + (data.uptime || 'N/A') + '</span></div>';
                } else {
                    html = '<div class="error">Limited metrics available</div>';
                }
                
                document.getElementById('realtime-metrics').innerHTML = html;
            } catch (error) {
                document.getElementById('realtime-metrics').innerHTML = 
                    '<div class="error">Failed to load metrics: ' + error.message + '</div>';
            }
        }

        // Load cache statistics
        async function loadCacheStats() {
            try {
                const response = await fetch('/api/cache/stats');
                const data = await response.json();
                
                let html = '';
                if (data.error) {
                    html = '<div class="error">' + data.error + '</div>';
                } else {
                    html += '<div class="metric"><span>Memory Entries:</span><span class="metric-value">' + data.memoryEntries + '</span></div>';
                    html += '<div class="metric"><span>File Entries:</span><span class="metric-value">' + data.fileEntries + '</span></div>';
                    html += '<div class="metric"><span>Total Size:</span><span class="metric-value">' + 
                        (data.totalSize ? (data.totalSize / 1024 / 1024).toFixed(2) + ' MB' : '0 MB') + '</span></div>';
                }
                
                document.getElementById('cache-stats').innerHTML = html;
            } catch (error) {
                document.getElementById('cache-stats').innerHTML = 
                    '<div class="error">Failed to load cache stats: ' + error.message + '</div>';
            }
        }

        // Load system health
        async function loadSystemHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                let html = '';
                html += '<div class="metric"><span>Status:</span><span class="metric-value status-good">' + data.status + '</span></div>';
                html += '<div class="metric"><span>Analytics:</span><span class="metric-value ' + 
                    (data.components.analytics ? 'status-good">✅ Active' : 'status-warning">⚠️ Limited') + '</span></div>';
                html += '<div class="metric"><span>Database:</span><span class="metric-value ' + 
                    (data.components.database ? 'status-good">✅ Connected' : 'status-warning">⚠️ Offline') + '</span></div>';
                html += '<div class="metric"><span>Memory Usage:</span><span class="metric-value">' + 
                    (data.system.memory.heapUsed / 1024 / 1024).toFixed(2) + ' MB</span></div>';
                
                document.getElementById('system-health').innerHTML = html;
            } catch (error) {
                document.getElementById('system-health').innerHTML = 
                    '<div class="error">Failed to load health data: ' + error.message + '</div>';
            }
        }

        // Export data
        async function exportData(type) {
            try {
                const response = await fetch('/api/export/' + type);
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = type + '-export-' + Date.now() + '.json';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                } else {
                    alert('Export failed');
                }
            } catch (error) {
                alert('Export error: ' + error.message);
            }
        }

        // Generate report
        async function generateReport() {
            try {
                const response = await fetch('/api/report/24h');
                const data = await response.json();
                
                if (data.error) {
                    alert('Report generation failed: ' + data.error);
                    return;
                }
                
                const reportWindow = window.open('', '_blank');
                reportWindow.document.write('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
            } catch (error) {
                alert('Report error: ' + error.message);
            }
        }

        // Refresh dashboard
        function refreshDashboard() {
            loadDashboard();
        }

        // Auto-refresh
        function startAutoRefresh() {
            refreshInterval = setInterval(loadDashboard, 30000); // 30 seconds
        }

        function stopAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadDashboard();
            startAutoRefresh();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', stopAutoRefresh);
    </script>
</body>
</html>`;
  }

  // Start dashboard server
  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(8080, '0.0.0.0', '0.0.0.0', () => {
        console.log(`📊 Enhanced Monitoring Dashboard running at http://0.0.0.0:${this.port}`);
        console.log(`🎯 Dashboard URL: http://0.0.0.0:${this.port}/dashboard`);
        resolve();
      });
    });
  }

  // Stop dashboard server
  async stop() {
    if (this.server) {
      this.server.close();
      console.log('📊 Enhanced Monitoring Dashboard stopped');
    }
  }
}

module.exports = EnhancedMonitoringDashboard;

// Test if run directly
if (require.main === module) {
  const dashboard = new EnhancedMonitoringDashboard();
  dashboard.start();
}
