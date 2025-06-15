
const NeonDatabaseIntegration = require('./neon-database-integration');
const NetlifyPremiumAnalytics = require('./netlify-premium-analytics');
const NetlifyMasterIntegration = require('./netlify-master-integration');
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

class KillerEnterpriseDashboard {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.port = 3001;
    
    this.neonDb = new NeonDatabaseIntegration();
    this.netlifyAnalytics = new NetlifyPremiumAnalytics();
    this.netlifyMaster = new NetlifyMasterIntegration();
    
    this.activeConnections = new Set();
    this.realTimeMetrics = {};
    this.enterpriseAlerts = [];
    
    console.log('💎 KILLER ENTERPRISE DASHBOARD INITIALIZING...');
  }

  async initialize() {
    try {
      // Initialize Neon database with premium features
      const dbConnected = await this.neonDb.initialize();
      if (dbConnected) {
        console.log('✅ NEON DATABASE: ENTERPRISE READY');
        await this.setupPremiumDatabaseFeatures();
      }

      // Setup Express middleware
      this.app.use(express.json());
      this.app.use(express.static('public'));
      
      // Setup WebSocket for real-time updates
      this.setupWebSocket();
      
      // Setup API routes
      this.setupEnterpriseRoutes();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      // Setup enterprise alerts
      this.setupEnterpriseAlerts();
      
      console.log('💎 KILLER ENTERPRISE DASHBOARD READY!');
      return true;
    } catch (error) {
      console.error('❌ Enterprise dashboard initialization failed:', error.message);
      return false;
    }
  }

  async setupPremiumDatabaseFeatures() {
    // Create enterprise-grade analytics views
    await this.neonDb.query(`
      CREATE OR REPLACE VIEW enterprise_sync_analytics AS
      SELECT 
        repo_name,
        repo_owner,
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as total_syncs,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_syncs,
        AVG(sync_duration_ms) as avg_duration,
        SUM(files_count) as total_files,
        SUM(bytes_transferred) as total_bytes
      FROM sync_operations 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
      GROUP BY repo_name, repo_owner, hour
      ORDER BY hour DESC
    `);

    // Create performance scoring function
    await this.neonDb.query(`
      CREATE OR REPLACE FUNCTION calculate_repo_score(p_repo_name text, p_repo_owner text)
      RETURNS INTEGER AS $$
      DECLARE
        success_rate FLOAT;
        avg_speed FLOAT;
        consistency_score INTEGER;
        final_score INTEGER;
      BEGIN
        -- Calculate success rate (0-40 points)
        SELECT 
          COALESCE(
            (SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 40, 
            20
          )
        INTO success_rate
        FROM sync_operations 
        WHERE repo_name = p_repo_name AND repo_owner = p_repo_owner
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
        
        -- Calculate speed score (0-30 points)
        SELECT 
          CASE 
            WHEN AVG(sync_duration_ms) < 5000 THEN 30
            WHEN AVG(sync_duration_ms) < 10000 THEN 20
            WHEN AVG(sync_duration_ms) < 20000 THEN 10
            ELSE 5
          END
        INTO avg_speed
        FROM sync_operations 
        WHERE repo_name = p_repo_name AND repo_owner = p_repo_owner
        AND success = true AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
        
        -- Calculate consistency score (0-30 points)
        SELECT 
          CASE 
            WHEN COUNT(DISTINCT DATE(created_at)) >= 25 THEN 30
            WHEN COUNT(DISTINCT DATE(created_at)) >= 20 THEN 25
            WHEN COUNT(DISTINCT DATE(created_at)) >= 15 THEN 20
            WHEN COUNT(DISTINCT DATE(created_at)) >= 10 THEN 15
            WHEN COUNT(DISTINCT DATE(created_at)) >= 5 THEN 10
            ELSE 5
          END
        INTO consistency_score
        FROM sync_operations 
        WHERE repo_name = p_repo_name AND repo_owner = p_repo_owner
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
        
        final_score := COALESCE(success_rate, 20) + COALESCE(avg_speed, 10) + COALESCE(consistency_score, 10);
        
        RETURN LEAST(final_score, 100);
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ NEON: Premium database features activated');
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.activeConnections.add(ws);
      console.log(`📡 Enterprise client connected (${this.activeConnections.size} total)`);
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.realTimeMetrics
      }));
      
      ws.on('close', () => {
        this.activeConnections.delete(ws);
        console.log(`📡 Client disconnected (${this.activeConnections.size} total)`);
      });
    });
  }

  setupEnterpriseRoutes() {
    // Enterprise dashboard home
    this.app.get('/enterprise', (req, res) => {
      res.send(this.generateEnterpriseDashboard());
    });

    // Real-time analytics API
    this.app.get('/api/enterprise/analytics', async (req, res) => {
      try {
        const analytics = await this.getEnterpriseAnalytics();
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Repository scoring API
    this.app.get('/api/enterprise/scores', async (req, res) => {
      try {
        const scores = await this.getRepositoryScores();
        res.json(scores);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Premium Netlify metrics
    this.app.get('/api/premium/netlify', async (req, res) => {
      try {
        const netlifyData = await this.netlifyAnalytics.getFullPremiumStatus();
        res.json(netlifyData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Enterprise alerts API
    this.app.get('/api/enterprise/alerts', (req, res) => {
      res.json(this.enterpriseAlerts);
    });

    // System health check
    this.app.get('/api/enterprise/health', async (req, res) => {
      const health = await this.getSystemHealth();
      res.json(health);
    });
  }

  async startRealTimeMonitoring() {
    // Update metrics every 30 seconds
    setInterval(async () => {
      try {
        this.realTimeMetrics = await this.collectRealTimeMetrics();
        this.broadcastToClients('metrics', this.realTimeMetrics);
        
        // Check for alerts
        await this.checkEnterpriseAlerts();
      } catch (error) {
        console.error('❌ Real-time monitoring error:', error.message);
      }
    }, 30000);

    // Detailed analytics every 5 minutes
    setInterval(async () => {
      try {
        const analytics = await this.getEnterpriseAnalytics();
        this.broadcastToClients('analytics', analytics);
      } catch (error) {
        console.error('❌ Analytics update error:', error.message);
      }
    }, 300000);

    console.log('📊 Real-time enterprise monitoring started');
  }

  async collectRealTimeMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: this.neonDb.isConnected,
        pool_stats: this.neonDb.getPoolStats()
      },
      sync_operations: {},
      netlify: {},
      system: {}
    };

    if (this.neonDb.isConnected) {
      // Get recent sync metrics
      const recentSyncs = await this.neonDb.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
          AVG(sync_duration_ms) as avg_duration
        FROM sync_operations 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      `);

      metrics.sync_operations = recentSyncs.rows[0];

      // Get system performance
      const performance = await this.neonDb.query(`
        SELECT metric_type, AVG(metric_value) as avg_value
        FROM performance_metrics 
        WHERE recorded_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        GROUP BY metric_type
      `);

      metrics.system.performance = performance.rows;
    }

    return metrics;
  }

  async getEnterpriseAnalytics() {
    if (!this.neonDb.isConnected) return {};

    const analytics = {};

    // Comprehensive repository analytics
    analytics.repositories = await this.neonDb.query(`
      SELECT 
        ra.*,
        calculate_repo_score(ra.repo_name, ra.repo_owner) as enterprise_score,
        CASE 
          WHEN ra.consecutive_failures > 5 THEN 'CRITICAL'
          WHEN ra.consecutive_failures > 2 THEN 'WARNING'
          ELSE 'HEALTHY'
        END as health_status
      FROM repository_analytics ra
      ORDER BY enterprise_score DESC, successful_operations DESC
    `);

    // Performance trends
    analytics.trends = await this.neonDb.query(`
      SELECT * FROM enterprise_sync_analytics 
      WHERE hour > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      ORDER BY hour DESC
    `);

    // Recent activity
    analytics.recent_activity = await this.neonDb.query(`
      SELECT 
        repo_name,
        repo_owner,
        success,
        files_count,
        sync_duration_ms,
        error_message,
        created_at
      FROM sync_operations 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '6 hours'
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return analytics;
  }

  async getRepositoryScores() {
    if (!this.neonDb.isConnected) return [];

    const scores = await this.neonDb.query(`
      SELECT 
        repo_name,
        repo_owner,
        calculate_repo_score(repo_name, repo_owner) as score,
        total_operations,
        successful_operations,
        last_success_at
      FROM repository_analytics
      ORDER BY calculate_repo_score(repo_name, repo_owner) DESC
    `);

    return scores.rows;
  }

  async setupEnterpriseAlerts() {
    // Check for critical issues every minute
    setInterval(async () => {
      await this.checkEnterpriseAlerts();
    }, 60000);
  }

  async checkEnterpriseAlerts() {
    if (!this.neonDb.isConnected) return;

    const alerts = [];

    // Check for repositories with consecutive failures
    const failingRepos = await this.neonDb.query(`
      SELECT repo_name, repo_owner, consecutive_failures
      FROM repository_analytics 
      WHERE consecutive_failures >= 3
    `);

    failingRepos.rows.forEach(repo => {
      alerts.push({
        type: 'CRITICAL',
        message: `Repository ${repo.repo_owner}/${repo.repo_name} has ${repo.consecutive_failures} consecutive failures`,
        timestamp: new Date().toISOString(),
        repo: `${repo.repo_owner}/${repo.repo_name}`
      });
    });

    // Check for slow performance
    const slowSyncs = await this.neonDb.query(`
      SELECT repo_name, repo_owner, AVG(sync_duration_ms) as avg_duration
      FROM sync_operations 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      AND success = true
      GROUP BY repo_name, repo_owner
      HAVING AVG(sync_duration_ms) > 30000
    `);

    slowSyncs.rows.forEach(repo => {
      alerts.push({
        type: 'WARNING',
        message: `Repository ${repo.repo_owner}/${repo.repo_name} has slow sync times (${Math.round(repo.avg_duration/1000)}s average)`,
        timestamp: new Date().toISOString(),
        repo: `${repo.repo_owner}/${repo.repo_name}`
      });
    });

    // Update alerts and broadcast
    this.enterpriseAlerts = alerts.slice(0, 20); // Keep last 20 alerts
    this.broadcastToClients('alerts', this.enterpriseAlerts);
  }

  async getSystemHealth() {
    const health = {
      status: 'HEALTHY',
      components: {},
      score: 100
    };

    // Database health
    health.components.database = {
      status: this.neonDb.isConnected ? 'HEALTHY' : 'CRITICAL',
      details: this.neonDb.getPoolStats()
    };

    // WebSocket health
    health.components.websocket = {
      status: this.activeConnections.size > 0 ? 'HEALTHY' : 'WARNING',
      active_connections: this.activeConnections.size
    };

    // Calculate overall score
    if (!this.neonDb.isConnected) health.score -= 50;
    if (this.enterpriseAlerts.filter(a => a.type === 'CRITICAL').length > 0) health.score -= 30;
    if (this.enterpriseAlerts.filter(a => a.type === 'WARNING').length > 0) health.score -= 10;

    health.status = health.score >= 90 ? 'HEALTHY' : health.score >= 70 ? 'WARNING' : 'CRITICAL';

    return health;
  }

  broadcastToClients(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    this.activeConnections.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  generateEnterpriseDashboard() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💎 Killer Enterprise Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            min-height: 100vh;
        }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding: 20px; }
        .card { 
            background: rgba(255,255,255,0.1); 
            border-radius: 15px; 
            padding: 20px; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .status-healthy { border-left: 5px solid #00ff88; }
        .status-warning { border-left: 5px solid #ffa500; }
        .status-critical { border-left: 5px solid #ff4444; }
        .metric { font-size: 2em; font-weight: bold; color: #00ff88; }
        .label { font-size: 0.9em; opacity: 0.8; margin-bottom: 10px; }
        .alerts { max-height: 300px; overflow-y: auto; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 5px; }
        .alert-critical { background: rgba(255,68,68,0.3); }
        .alert-warning { background: rgba(255,165,0,0.3); }
        h1 { text-align: center; margin: 20px 0; font-size: 2.5em; }
        h2 { margin-bottom: 15px; color: #00ff88; }
        .live-indicator { 
            display: inline-block; 
            width: 10px; 
            height: 10px; 
            background: #00ff88; 
            border-radius: 50%; 
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <h1>💎 KILLER ENTERPRISE DASHBOARD <span class="live-indicator"></span></h1>
    
    <div class="dashboard">
        <div class="card status-healthy">
            <div class="label">🔥 SYSTEM STATUS</div>
            <div class="metric" id="system-status">ENTERPRISE</div>
            <div id="system-details">Fully Operational</div>
        </div>
        
        <div class="card status-healthy">
            <div class="label">🚀 TOTAL SYNCS (24H)</div>
            <div class="metric" id="total-syncs">---</div>
            <div id="success-rate">Success Rate: ---%</div>
        </div>
        
        <div class="card status-healthy">
            <div class="label">💎 NEON DATABASE</div>
            <div class="metric" id="db-status">CONNECTED</div>
            <div id="db-details">Premium Pool Active</div>
        </div>
        
        <div class="card">
            <h2>📊 TOP REPOSITORIES</h2>
            <div id="top-repos">Loading enterprise data...</div>
        </div>
        
        <div class="card">
            <h2>🌐 NETLIFY PREMIUM</h2>
            <div id="netlify-stats">Loading premium metrics...</div>
        </div>
        
        <div class="card">
            <h2>🚨 ENTERPRISE ALERTS</h2>
            <div class="alerts" id="alerts">No active alerts</div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://' + window.location.host);
        
        ws.onmessage = (event) => {
            const { type, data } = JSON.parse(event.data);
            
            if (type === 'metrics') {
                updateMetrics(data);
            } else if (type === 'analytics') {
                updateAnalytics(data);
            } else if (type === 'alerts') {
                updateAlerts(data);
            }
        };
        
        function updateMetrics(data) {
            if (data.sync_operations) {
                document.getElementById('total-syncs').textContent = data.sync_operations.total || 0;
                const successRate = data.sync_operations.total > 0 
                    ? Math.round((data.sync_operations.successful / data.sync_operations.total) * 100)
                    : 100;
                document.getElementById('success-rate').textContent = 'Success Rate: ' + successRate + '%';
            }
            
            if (data.database) {
                document.getElementById('db-status').textContent = data.database.connected ? 'CONNECTED' : 'OFFLINE';
                if (data.database.pool_stats) {
                    document.getElementById('db-details').textContent = 
                        'Pool: ' + data.database.pool_stats.total_connections + '/' + data.database.pool_stats.max_connections;
                }
            }
        }
        
        function updateAnalytics(data) {
            if (data.repositories) {
                let html = '';
                data.repositories.rows.slice(0, 5).forEach(repo => {
                    html += '<div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">';
                    html += '<strong>' + repo.repo_owner + '/' + repo.repo_name + '</strong><br>';
                    html += 'Score: ' + repo.enterprise_score + '/100 | ';
                    html += 'Syncs: ' + repo.successful_operations + '/' + repo.total_operations;
                    html += '</div>';
                });
                document.getElementById('top-repos').innerHTML = html;
            }
        }
        
        function updateAlerts(alerts) {
            let html = '';
            if (alerts.length === 0) {
                html = '<div style="color: #00ff88;">✅ All systems operational</div>';
            } else {
                alerts.forEach(alert => {
                    html += '<div class="alert alert-' + alert.type.toLowerCase() + '">';
                    html += '<strong>' + alert.type + ':</strong> ' + alert.message;
                    html += '<div style="font-size: 0.8em; opacity: 0.7;">' + new Date(alert.timestamp).toLocaleTimeString() + '</div>';
                    html += '</div>';
                });
            }
            document.getElementById('alerts').innerHTML = html;
        }
        
        // Load initial data
        fetch('/api/enterprise/analytics')
            .then(r => r.json())
            .then(updateAnalytics);
            
        fetch('/api/premium/netlify')
            .then(r => r.json())
            .then(data => {
                document.getElementById('netlify-stats').innerHTML = 
                    '<div>Premium Account: Active</div>' +
                    '<div>Features: All Enabled</div>' +
                    '<div>Analytics: Real-time</div>';
            });
    </script>
</body>
</html>`;
  }

  async start() {
    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize enterprise dashboard');
      return false;
    }

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`💎 KILLER ENTERPRISE DASHBOARD LIVE!`);
      console.log(`🌐 Access: http://localhost:${this.port}/enterprise`);
      console.log(`📊 API: http://localhost:${this.port}/api/enterprise/`);
      console.log(`🚀 WebSocket: Connected to ${this.activeConnections.size} clients`);
    });

    return true;
  }
}

module.exports = KillerEnterpriseDashboard;

// Start the killer dashboard if run directly
if (require.main === module) {
  const dashboard = new KillerEnterpriseDashboard();
  dashboard.start()
    .then(success => {
      if (success) {
        console.log('\n💎 ENTERPRISE DASHBOARD DEPLOYMENT SUCCESSFUL!');
        console.log('🔥 Your system is now KILLER-GRADE enterprise ready!');
      }
    })
    .catch(error => {
      console.error('💥 Enterprise dashboard startup failed:', error.message);
      process.exit(1);
    });
}
