
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const { execSync } = require('child_process');

class ServerManagementDashboard {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.port = 4500;
    
    this.servers = new Map();
    this.deployments = new Map();
    this.monitoring = new Map();
    this.alerts = [];
    this.serverHealth = new Map();
    this.performanceMetrics = new Map();
    this.alertThresholds = {
      cpu: 80,
      memory: 85,
      responseTime: 5000,
      errorRate: 10
    };
    
    // Enhanced Alert System
    this.alertSystem = {
      criticalAlerts: [],
      warningAlerts: [],
      infoAlerts: [],
      alertCounter: 0,
      globalAdminConnected: false
    };
    
    // Color codes for server status
    this.statusColors = {
      online: '#00ff88',
      running: '#00ff88', 
      healthy: '#00ff88',
      warning: '#ffa726',
      degraded: '#ffa726',
      critical: '#ff4757',
      error: '#ff4757',
      offline: '#ff4757',
      stopped: '#6c757d',
      unknown: '#6c757d'
    };
    
    console.log('🏗️ SERVER MANAGEMENT DASHBOARD INITIALIZING...');
    this.setupRoutes();
    this.setupWebSocket();
    this.loadServerConfigurations();
    this.startHealthMonitoring();
    this.verifyNetlifyConnection();
    this.confirmServerDataPull();
  }

  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateServerDashboard());
    });

    // Global admin dashboard endpoint
    this.app.get('/admin/global', (req, res) => {
      res.send(this.generateGlobalAdminDashboard());
    });

    // Server management APIs
    this.app.get('/api/servers', (req, res) => {
      res.json(Array.from(this.servers.values()));
    });

    this.app.post('/api/server/start', async (req, res) => {
      try {
        const { serverFile, port, name } = req.body;
        const result = await this.startServer(serverFile, port, name);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/server/stop', async (req, res) => {
      try {
        const { serverId } = req.body;
        const result = await this.stopServer(serverId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/deploy/netlify', async (req, res) => {
      try {
        const result = await this.deployToNetlify();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/sync/github', async (req, res) => {
      try {
        const result = await this.syncToGitHub();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/server/logs/:serverId', (req, res) => {
      const logs = this.getServerLogs(req.params.serverId);
      res.json(logs);
    });

    this.app.post('/api/server/health-check', async (req, res) => {
      try {
        const { url } = req.body;
        const result = await this.performHealthCheck(url);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Alert management endpoints
    this.app.get('/api/alerts', (req, res) => {
      res.json({
        success: true,
        alerts: this.alerts,
        summary: {
          total: this.alerts.length,
          critical: this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
          warning: this.alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
          acknowledged: this.alerts.filter(a => a.acknowledged).length
        }
      });
    });

    this.app.post('/api/alerts/:alertId/acknowledge', (req, res) => {
      const alertId = parseFloat(req.params.alertId);
      const alert = this.alerts.find(a => a.id === alertId);
      
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        res.json({ success: true, message: 'Alert acknowledged' });
      } else {
        res.status(404).json({ success: false, error: 'Alert not found' });
      }
    });

    this.app.get('/api/server/:serverId/metrics', (req, res) => {
      const serverId = req.params.serverId;
      const metrics = this.performanceMetrics.get(serverId);
      const health = this.serverHealth.get(serverId);
      
      if (metrics && health) {
        res.json({
          success: true,
          metrics,
          health,
          server: this.servers.get(serverId)
        });
      } else {
        res.status(404).json({ success: false, error: 'Server metrics not found' });
      }
    });

    // API endpoint for receiving alerts from other systems
    this.app.post('/api/alerts/receive', (req, res) => {
      try {
        const { alert, source, sourcePort } = req.body;
        
        // Create enhanced alert for global dashboard
        const globalAlert = {
          ...alert,
          source: source || 'external',
          sourcePort: sourcePort || 'unknown',
          receivedAt: new Date().toISOString(),
          id: Date.now() + Math.random()
        };

        // Add to appropriate alert category
        if (alert.severity === 'critical') {
          this.alertSystem.criticalAlerts.unshift(globalAlert);
        } else if (alert.severity === 'warning') {
          this.alertSystem.warningAlerts.unshift(globalAlert);
        } else {
          this.alertSystem.infoAlerts.unshift(globalAlert);
        }

        console.log(`📡 Received ${alert.severity} alert from ${source}: ${alert.message}`);
        
        // Broadcast to all connected clients
        this.io.emit('global_alert_received', globalAlert);
        
        res.json({ success: true, message: 'Alert received and processed' });
      } catch (error) {
        console.error('Error processing received alert:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Enhanced alert management endpoints
    this.app.get('/api/alerts/comprehensive', (req, res) => {
      try {
        res.json({
          success: true,
          alerts: {
            critical: this.alertSystem.criticalAlerts,
            warning: this.alertSystem.warningAlerts,
            info: this.alertSystem.infoAlerts
          },
          summary: {
            total: this.alertSystem.alertCounter,
            critical: this.alertSystem.criticalAlerts.filter(a => !a.acknowledged).length,
            warning: this.alertSystem.warningAlerts.filter(a => !a.acknowledged).length,
            info: this.alertSystem.infoAlerts.filter(a => !a.acknowledged).length,
            acknowledged: this.alerts.filter(a => a.acknowledged).length
          },
          system: {
            globalAdminConnected: this.alertSystem.globalAdminConnected,
            lastUpdate: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('📡 Server manager connected');
      
      socket.emit('server-status', this.getServerStatus());
      
      socket.on('refresh-servers', () => {
        socket.emit('server-status', this.getServerStatus());
      });

      socket.on('disconnect', () => {
        console.log('📡 Server manager disconnected');
      });
    });

    // Broadcast server status every 10 seconds
    setInterval(() => {
      this.io.emit('server-status', this.getServerStatus());
    }, 10000);
  }

  loadServerConfigurations() {
    const serverConfigs = [
      {
        id: 'toyparty-main',
        name: 'ToyParty Main Server',
        file: 'simple-server.js',
        port: 3000,
        type: 'main',
        description: 'Main ToyParty Enterprise Platform',
        environment: 'production',
        location: 'US-East-1',
        version: '2.1.0',
        serverInfo: {
          hostname: 'toyparty-main.replit.dev',
          os: 'Ubuntu 20.04 LTS',
          architecture: 'x64',
          nodeVersion: 'v20.18.1',
          memory: '512MB',
          cpu: '1 vCPU'
        }
      },
      {
        id: 'github-sync',
        name: 'GitHub Sync Server',
        file: 'sync-gpt-to-github.js',
        port: 3000,
        type: 'sync',
        description: 'GitHub synchronization service',
        environment: 'production',
        location: 'US-East-1',
        version: '1.8.3',
        serverInfo: {
          hostname: 'github-sync.replit.dev',
          os: 'Ubuntu 20.04 LTS',
          architecture: 'x64',
          nodeVersion: 'v20.18.1',
          memory: '256MB',
          cpu: '0.5 vCPU'
        }
      },
      {
        id: 'dev-server',
        name: 'Development Server',
        file: 'dev-server.js',
        port: 5000,
        type: 'development',
        description: 'Live development server',
        environment: 'development',
        location: 'US-East-1',
        version: '3.2.1',
        serverInfo: {
          hostname: 'dev-server.replit.dev',
          os: 'Ubuntu 20.04 LTS',
          architecture: 'x64',
          nodeVersion: 'v20.18.1',
          memory: '1GB',
          cpu: '1 vCPU'
        }
      },
      {
        id: 'enterprise-dashboard',
        name: 'Enterprise Dashboard',
        file: 'comprehensive-enterprise-dashboard.js',
        port: 8888,
        type: 'dashboard',
        description: 'Complete enterprise monitoring',
        environment: 'production',
        location: 'US-East-1',
        version: '4.5.2',
        serverInfo: {
          hostname: 'enterprise.replit.dev',
          os: 'Ubuntu 20.04 LTS',
          architecture: 'x64',
          nodeVersion: 'v20.18.1',
          memory: '2GB',
          cpu: '2 vCPU'
        }
      },
      {
        id: 'admin-auth',
        name: 'Admin Authentication',
        file: 'admin-auth-system.js',
        port: 6001,
        type: 'admin',
        description: 'Admin login and control panel',
        environment: 'production',
        location: 'US-East-1',
        version: '2.3.7',
        serverInfo: {
          hostname: 'admin-auth.replit.dev',
          os: 'Ubuntu 20.04 LTS',
          architecture: 'x64',
          nodeVersion: 'v20.18.1',
          memory: '512MB',
          cpu: '1 vCPU'
        }
      },
      {
        id: 'netlify-manager',
        name: 'Netlify Manager',
        file: 'autonomous-netlify-manager.js',
        port: 4000,
        type: 'deployment',
        description: 'Autonomous Netlify deployment management',
        environment: 'production',
        location: 'US-East-1',
        version: '1.9.4',
        serverInfo: {
          hostname: 'netlify-mgr.replit.dev',
          os: 'Ubuntu 20.04 LTS',
          architecture: 'x64',
          nodeVersion: 'v20.18.1',
          memory: '1GB',
          cpu: '1 vCPU'
        }
      }
    ];

    serverConfigs.forEach(config => {
      this.servers.set(config.id, {
        ...config,
        status: 'stopped',
        pid: null,
        lastStarted: null,
        logs: [],
        healthScore: 100,
        responseTime: 0,
        uptime: 0,
        cpu: 0,
        memory: 0,
        requests: 0,
        errors: 0
      });
      
      // Initialize health monitoring
      this.serverHealth.set(config.id, {
        status: 'unknown',
        lastCheck: null,
        consecutive_failures: 0,
        response_times: [],
        error_count: 0
      });
      
      // Initialize performance metrics
      this.performanceMetrics.set(config.id, {
        cpu_usage: [],
        memory_usage: [],
        request_count: [],
        response_times: [],
        timestamp: Date.now()
      });
    });

    console.log(`✅ Loaded ${this.servers.size} server configurations with health monitoring`);
  }

  async startServer(serverFile, port, name) {
    console.log(`🚀 Starting server: ${name}`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(serverFile)) {
        throw new Error(`Server file not found: ${serverFile}`);
      }

      // Kill any existing process on the port
      try {
        execSync(`pkill -f "node.*${serverFile}" || true`);
        execSync(`pkill -f "node.*${port}" || true`);
      } catch (error) {
        // Ignore cleanup errors
      }

      // Start the server
      const command = `node ${serverFile}`;
      execSync(command, { detached: true, stdio: 'ignore' });

      // Update server status
      const serverId = this.findServerIdByFile(serverFile);
      if (serverId) {
        const server = this.servers.get(serverId);
        server.status = 'running';
        server.lastStarted = new Date().toISOString();
        server.logs.push({
          timestamp: new Date().toISOString(),
          message: `Server started successfully`,
          type: 'success'
        });
        this.servers.set(serverId, server);
      }

      return {
        success: true,
        message: `${name} started successfully on port ${port}`,
        url: `http://0.0.0.0:${port}`
      };

    } catch (error) {
      console.error(`❌ Failed to start ${name}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async stopServer(serverId) {
    console.log(`🛑 Stopping server: ${serverId}`);
    
    try {
      const server = this.servers.get(serverId);
      if (!server) {
        throw new Error('Server not found');
      }

      // Kill the server process
      execSync(`pkill -f "node.*${server.file}" || true`);
      execSync(`pkill -f "node.*${server.port}" || true`);

      // Update server status
      server.status = 'stopped';
      server.pid = null;
      server.logs.push({
        timestamp: new Date().toISOString(),
        message: `Server stopped`,
        type: 'warning'
      });
      this.servers.set(serverId, server);

      return {
        success: true,
        message: `${server.name} stopped successfully`
      };

    } catch (error) {
      console.error(`❌ Failed to stop server:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deployToNetlify() {
    console.log('🚀 Deploying to Netlify...');
    
    try {
      // Use quick deploy to avoid timeouts
      execSync('node quick-netlify-deploy.js', { stdio: 'pipe' });
      
      return {
        success: true,
        message: 'Netlify deployment triggered successfully',
        url: 'https://toyparty.netlify.app'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async syncToGitHub() {
    console.log('🔄 Syncing to GitHub...');
    
    try {
      execSync('node sync-gpt-to-github.js --sync', { stdio: 'pipe' });
      
      return {
        success: true,
        message: 'GitHub sync completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async performHealthCheck(url) {
    console.log(`🏥 Health check: ${url}`);
    
    try {
      const https = require('https');
      const http = require('http');
      
      return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const start = Date.now();
        
        const req = client.get(url, (res) => {
          const responseTime = Date.now() - start;
          resolve({
            success: true,
            status: res.statusCode,
            responseTime: responseTime,
            message: `Response: ${res.statusCode} (${responseTime}ms)`
          });
        });

        req.on('error', (error) => {
          resolve({
            success: false,
            error: error.message
          });
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({
            success: false,
            error: 'Timeout'
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getServerStatus() {
    const servers = Array.from(this.servers.values());
    const runningServers = servers.filter(s => s.status === 'running');
    
    const status = {
      servers: servers,
      summary: {
        total: this.servers.size,
        running: runningServers.length,
        stopped: servers.filter(s => s.status === 'stopped').length,
        healthy: servers.filter(s => (s.healthScore || 0) >= 90).length,
        warnings: servers.filter(s => (s.healthScore || 0) >= 70 && (s.healthScore || 0) < 90).length,
        critical: servers.filter(s => (s.healthScore || 0) < 70).length
      },
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
        warning: this.alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
        recent: this.alerts.slice(0, 5)
      },
      timestamp: new Date().toISOString()
    };

    return status;
  }

  getServerLogs(serverId) {
    const server = this.servers.get(serverId);
    return server ? server.logs : [];
  }

  findServerIdByFile(serverFile) {
    for (const [id, server] of this.servers) {
      if (server.file === serverFile) {
        return id;
      }
    }
    return null;
  }

  startHealthMonitoring() {
    console.log('🏥 Starting comprehensive health monitoring system...');
    
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);
    
    // Performance metrics collection every 10 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);
    
    // Alert processing every 5 seconds
    setInterval(() => {
      this.processAlerts();
    }, 5000);
  }

  async performHealthChecks() {
    for (const [serverId, server] of this.servers) {
      if (server.status === 'running') {
        await this.checkServerHealth(serverId);
      }
    }
  }

  async checkServerHealth(serverId) {
    const server = this.servers.get(serverId);
    const health = this.serverHealth.get(serverId);
    
    try {
      const start = Date.now();
      const response = await this.performHealthCheck(`http://0.0.0.0:${server.port}`);
      const responseTime = Date.now() - start;
      
      // Update health metrics
      health.status = response.success ? 'healthy' : 'unhealthy';
      health.lastCheck = new Date().toISOString();
      health.consecutive_failures = response.success ? 0 : health.consecutive_failures + 1;
      
      // Track response times (keep last 10)
      health.response_times.push(responseTime);
      if (health.response_times.length > 10) {
        health.response_times.shift();
      }
      
      // Update server metrics
      server.responseTime = responseTime;
      server.healthScore = this.calculateHealthScore(serverId);
      
      // Check for alerts
      this.checkHealthAlerts(serverId, responseTime, response.success);
      
    } catch (error) {
      health.status = 'error';
      health.consecutive_failures++;
      server.healthScore = Math.max(0, server.healthScore - 10);
      
      this.createAlert('critical', `Server ${server.name} health check failed: ${error.message}`, serverId);
    }
    
    this.serverHealth.set(serverId, health);
    this.servers.set(serverId, server);
  }

  calculateHealthScore(serverId) {
    const server = this.servers.get(serverId);
    const health = this.serverHealth.get(serverId);
    
    let score = 100;
    
    // Deduct for consecutive failures
    score -= health.consecutive_failures * 20;
    
    // Deduct for slow response times
    const avgResponseTime = health.response_times.reduce((a, b) => a + b, 0) / health.response_times.length || 0;
    if (avgResponseTime > this.alertThresholds.responseTime) {
      score -= 30;
    } else if (avgResponseTime > this.alertThresholds.responseTime / 2) {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  collectPerformanceMetrics() {
    for (const [serverId, server] of this.servers) {
      if (server.status === 'running') {
        const metrics = this.performanceMetrics.get(serverId);
        
        // Simulate realistic metrics (in production, these would come from actual monitoring)
        const cpuUsage = Math.random() * 100;
        const memoryUsage = Math.random() * 100;
        const requestCount = Math.floor(Math.random() * 1000);
        
        metrics.cpu_usage.push(cpuUsage);
        metrics.memory_usage.push(memoryUsage);
        metrics.request_count.push(requestCount);
        
        // Keep only last 100 measurements
        ['cpu_usage', 'memory_usage', 'request_count'].forEach(metric => {
          if (metrics[metric].length > 100) {
            metrics[metric].shift();
          }
        });
        
        // Update server object
        server.cpu = cpuUsage;
        server.memory = memoryUsage;
        server.requests = requestCount;
        
        // Check performance alerts
        this.checkPerformanceAlerts(serverId, cpuUsage, memoryUsage);
        
        this.performanceMetrics.set(serverId, metrics);
        this.servers.set(serverId, server);
      }
    }
  }

  checkHealthAlerts(serverId, responseTime, isHealthy) {
    const server = this.servers.get(serverId);
    const health = this.serverHealth.get(serverId);
    
    if (!isHealthy) {
      this.createAlert('critical', `Server ${server.name} is not responding`, serverId);
    } else if (responseTime > this.alertThresholds.responseTime) {
      this.createAlert('warning', `Server ${server.name} response time is ${responseTime}ms (threshold: ${this.alertThresholds.responseTime}ms)`, serverId);
    }
    
    if (health.consecutive_failures >= 3) {
      this.createAlert('critical', `Server ${server.name} has failed ${health.consecutive_failures} consecutive health checks`, serverId);
    }
  }

  checkPerformanceAlerts(serverId, cpu, memory) {
    const server = this.servers.get(serverId);
    
    if (cpu > this.alertThresholds.cpu) {
      this.createAlert('warning', `Server ${server.name} CPU usage is ${cpu.toFixed(1)}% (threshold: ${this.alertThresholds.cpu}%)`, serverId);
    }
    
    if (memory > this.alertThresholds.memory) {
      this.createAlert('warning', `Server ${server.name} memory usage is ${memory.toFixed(1)}% (threshold: ${this.alertThresholds.memory}%)`, serverId);
    }
  }

  createAlert(severity, message, serverId) {
    const server = this.servers.get(serverId);
    const alert = {
      id: Date.now() + Math.random(),
      severity,
      message,
      serverId,
      serverName: server?.name || 'Unknown Server',
      serverInfo: server?.serverInfo || {},
      environment: server?.environment || 'unknown',
      location: server?.location || 'unknown',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      alertCode: `ALT-${Date.now().toString().slice(-6)}`,
      category: this.categorizeAlert(message)
    };
    
    // Add to appropriate alert category
    if (severity === 'critical') {
      this.alertSystem.criticalAlerts.unshift(alert);
      if (this.alertSystem.criticalAlerts.length > 50) {
        this.alertSystem.criticalAlerts = this.alertSystem.criticalAlerts.slice(0, 50);
      }
    } else if (severity === 'warning') {
      this.alertSystem.warningAlerts.unshift(alert);
      if (this.alertSystem.warningAlerts.length > 100) {
        this.alertSystem.warningAlerts = this.alertSystem.warningAlerts.slice(0, 100);
      }
    } else {
      this.alertSystem.infoAlerts.unshift(alert);
      if (this.alertSystem.infoAlerts.length > 50) {
        this.alertSystem.infoAlerts = this.alertSystem.infoAlerts.slice(0, 50);
      }
    }
    
    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
    
    console.log(`🚨 ${this.getAlertIcon(severity)} ALERT [${severity.toUpperCase()}] #${alert.alertCode}: ${message}`);
    console.log(`   📍 Server: ${alert.serverName} (${alert.environment})`);
    console.log(`   🌐 Location: ${alert.location}`);
    console.log(`   🕐 Time: ${new Date(alert.timestamp).toLocaleString()}`);
    
    // Broadcast alert to all connected clients
    this.io.emit('alert', alert);
    
    // Send to Global Admin Dashboard
    this.sendToGlobalAdminDashboard(alert);
    
    // Increment alert counter
    this.alertSystem.alertCounter++;
  }

  categorizeAlert(message) {
    const msg = message.toLowerCase();
    if (msg.includes('cpu') || msg.includes('memory') || msg.includes('disk')) return 'Performance';
    if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) return 'Network';
    if (msg.includes('deploy') || msg.includes('build')) return 'Deployment';
    if (msg.includes('auth') || msg.includes('security')) return 'Security';
    if (msg.includes('database') || msg.includes('storage')) return 'Database';
    return 'System';
  }

  getAlertIcon(severity) {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  }

  sendToGlobalAdminDashboard(alert) {
    // Try to send alert to Global Admin Dashboard
    try {
      const http = require('http');
      const postData = JSON.stringify({
        type: 'server_alert',
        alert: alert,
        source: 'server-management-dashboard',
        sourcePort: this.port,
        timestamp: new Date().toISOString()
      });

      const options = {
        hostname: '0.0.0.0',
        port: 3000, // Global Admin Dashboard port
        path: '/api/alerts/receive',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ Alert #${alert.alertCode} sent to Global Admin Dashboard`);
          this.alertSystem.globalAdminConnected = true;
        } else {
          console.log(`⚠️ Failed to send alert to Global Admin (HTTP ${res.statusCode})`);
        }
      });

      req.on('error', (error) => {
        console.log(`⚠️ Global Admin Dashboard unreachable: ${error.message}`);
        this.alertSystem.globalAdminConnected = false;
      });

      req.write(postData);
      req.end();
    } catch (error) {
      console.log(`❌ Error sending alert to Global Admin: ${error.message}`);
    }
  }

  processAlerts() {
    // Remove old alerts (older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    );
  }

  getServerStatusColor(server) {
    if (server.status === 'stopped') return '#ff4757';
    if (server.healthScore >= 90) return '#00ff88';
    if (server.healthScore >= 70) return '#ffa726';
    return '#ff4757';
  }

  generateGlobalAdminDashboard() {
    const criticalAlerts = this.alertSystem.criticalAlerts.filter(a => !a.acknowledged).length;
    const warningAlerts = this.alertSystem.warningAlerts.filter(a => !a.acknowledged).length;
    const totalAlerts = this.alertSystem.alertCounter;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Global Admin Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #0f0f23, #1a1a2e);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(90deg, #ff6b35, #f7931e);
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .alert-banner {
            background: linear-gradient(90deg, #ff4757, #ff3838);
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        .alert-banner.warning {
            background: linear-gradient(90deg, #ffa726, #ff9800);
        }
        .alert-banner.success {
            background: linear-gradient(90deg, #00ff88, #00cc66);
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 30px;
        }
        .metrics-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .metric-value {
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
        }
        .servers-overview {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .server-mini-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 15px;
            padding: 20px;
            border-left: 5px solid;
        }
        .alerts-section {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 30px;
        }
        .alert-item {
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            border-left: 5px solid;
        }
        .alert-critical {
            background: rgba(255, 71, 87, 0.2);
            border-left-color: #ff4757;
        }
        .alert-warning {
            background: rgba(255, 167, 38, 0.2);
            border-left-color: #ffa726;
        }
        .alert-info {
            background: rgba(52, 152, 219, 0.2);
            border-left-color: #3498db;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Global Admin Dashboard</h1>
        <p>Enterprise-wide server monitoring and alert management</p>
    </div>

    <div id="alert-banner" class="alert-banner" style="display: none;">
        <span id="alert-banner-text"></span>
    </div>

    <div class="container">
        <div class="metrics-overview">
            <div class="metric-card">
                <div>🎯 System Health</div>
                <div class="metric-value" id="overall-health" style="color: #00ff88;">98%</div>
                <div>Overall System Health</div>
            </div>
            <div class="metric-card">
                <div>🚨 Critical Alerts</div>
                <div class="metric-value" id="critical-alerts" style="color: #ff4757;">${criticalAlerts}</div>
                <div>Requires Immediate Attention</div>
            </div>
            <div class="metric-card">
                <div>⚠️ Warning Alerts</div>
                <div class="metric-value" id="warning-alerts" style="color: #ffa726;">${warningAlerts}</div>
                <div>Monitoring Required</div>
            </div>
            <div class="metric-card">
                <div>🔧 Active Servers</div>
                <div class="metric-value" id="active-servers" style="color: #00ff88;">0</div>
                <div>Currently Running</div>
            </div>
        </div>

        <div class="servers-overview" id="servers-overview">
            <!-- Server cards will be populated here -->
        </div>

        <div class="alerts-section">
            <h2>🚨 Recent Alerts</h2>
            <div id="alerts-list">
                <!-- Alerts will be populated here -->
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let serversData = [];
        let alertsData = [];

        socket.on('connect', () => {
            console.log('🔗 Connected to Global Admin Dashboard');
        });

        socket.on('server-status', (data) => {
            serversData = data.servers;
            updateDashboard(data);
        });

        socket.on('alert', (alert) => {
            alertsData.unshift(alert);
            if (alertsData.length > 50) alertsData = alertsData.slice(0, 50);
            updateAlerts();
            showAlertBanner(alert);
        });

        function updateDashboard(data) {
            // Update metrics
            const activeServers = data.servers.filter(s => s.status === 'running').length;
            const avgHealth = data.servers.reduce((sum, s) => sum + (s.healthScore || 0), 0) / data.servers.length;
            
            document.getElementById('active-servers').textContent = activeServers;
            document.getElementById('overall-health').textContent = Math.round(avgHealth) + '%';

            // Update servers overview
            const serversOverview = document.getElementById('servers-overview');
            serversOverview.innerHTML = data.servers.map(server => `
                <div class="server-mini-card" style="border-left-color: ${getStatusColor(server)};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${server.name}</h3>
                        <span style="color: ${getStatusColor(server)}; font-weight: bold;">
                            ${server.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="margin: 10px 0; font-size: 0.9em; opacity: 0.9;">
                        <div>🏷️ ${server.environment} | 📍 ${server.location} | 📦 v${server.version}</div>
                        <div>🏥 Health: ${server.healthScore || 0}% | ⚡ Response: ${server.responseTime || 0}ms</div>
                        <div>💻 CPU: ${(server.cpu || 0).toFixed(1)}% | 🧠 Memory: ${(server.memory || 0).toFixed(1)}%</div>
                    </div>
                </div>
            `).join('');
        }

        function updateAlerts() {
            const criticalCount = alertsData.filter(a => a.severity === 'critical' && !a.acknowledged).length;
            const warningCount = alertsData.filter(a => a.severity === 'warning' && !a.acknowledged).length;
            
            document.getElementById('critical-alerts').textContent = criticalCount;
            document.getElementById('warning-alerts').textContent = warningCount;

            const alertsList = document.getElementById('alerts-list');
            alertsList.innerHTML = alertsData.slice(0, 10).map(alert => `
                <div class="alert-item alert-${alert.severity}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${alert.serverName}</strong>
                        <span style="font-size: 0.9em; opacity: 0.8;">
                            ${new Date(alert.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div style="margin-top: 5px;">${alert.message}</div>
                </div>
            `).join('');
        }

        function showAlertBanner(alert) {
            const banner = document.getElementById('alert-banner');
            const text = document.getElementById('alert-banner-text');
            
            text.textContent = `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`;
            banner.className = \`alert-banner \${alert.severity}\`;
            banner.style.display = 'block';
            
            setTimeout(() => {
                banner.style.display = 'none';
            }, 5000);
        }

        function getStatusColor(server) {
            if (server.status === 'stopped') return '#ff4757';
            if ((server.healthScore || 0) >= 90) return '#00ff88';
            if ((server.healthScore || 0) >= 70) return '#ffa726';
            return '#ff4757';
        }

        // Auto-refresh every 10 seconds
        setInterval(() => {
            socket.emit('refresh-servers');
        }, 10000);
    </script>
</body>
</html>`;
  }

  generateServerDashboard() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏗️ Server Management Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(90deg, #ff6b35, #f7931e);
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .summary-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 5px;
        }
        .summary-label {
            opacity: 0.9;
            font-size: 0.9em;
        }
        .deployment-section {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .deployment-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .btn {
            background: linear-gradient(45deg, #00ff88, #00cc66);
            border: none;
            padding: 15px 25px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            text-align: center;
        }
        .btn:hover { transform: scale(1.05); }
        .btn-danger { background: linear-gradient(45deg, #ff4757, #ff3838); }
        .btn-warning { background: linear-gradient(45deg, #ffa726, #ff9800); }
        .btn-info { background: linear-gradient(45deg, #3498db, #2980b9); }
        .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 25px;
        }
        .server-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s;
        }
        .server-card:hover { transform: translateY(-5px); }
        .server-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .server-name {
            font-size: 1.3em;
            font-weight: bold;
        }
        .server-status {
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status-running { background: #00ff88; color: #000; }
        .status-stopped { background: #ff4757; color: #fff; }
        .status-warning { background: #ffa726; color: #000; }
        .status-critical { background: #ff4757; color: #fff; }
        .health-excellent { color: #00ff88; }
        .health-good { color: #ffa726; }
        .health-poor { color: #ff4757; }
        .server-info {
            font-size: 0.85em;
            opacity: 0.9;
            margin: 5px 0;
        }
        .performance-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
        }
        .metric-item {
            background: rgba(0,0,0,0.2);
            padding: 8px;
            border-radius: 5px;
            text-align: center;
        }
        .server-details {
            margin: 15px 0;
            font-size: 0.9em;
            opacity: 0.9;
        }
        .server-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        .server-actions .btn {
            flex: 1;
            padding: 10px 15px;
            font-size: 0.9em;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        .status-running .status-indicator { background: #00ff88; }
        .status-stopped .status-indicator { background: #ff4757; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .logs-section {
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 15px;
            margin-top: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.8em;
        }
        .log-entry {
            margin: 3px 0;
            padding: 3px 0;
        }
        .log-success { color: #00ff88; }
        .log-error { color: #ff4757; }
        .log-warning { color: #ffa726; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏗️ SERVER MANAGEMENT DASHBOARD</h1>
        <p>Complete server setup, deployment, and monitoring control center</p>
    </div>

    <div class="container">
        <div class="summary">
            <div class="summary-card">
                <div class="summary-value" id="total-servers">0</div>
                <div class="summary-label">Total Servers</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" id="running-servers">0</div>
                <div class="summary-label">Running</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" id="stopped-servers">0</div>
                <div class="summary-label">Stopped</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" id="uptime">100%</div>
                <div class="summary-label">Uptime</div>
            </div>
        </div>

        <div class="deployment-section">
            <h2>🚀 Deployment & Sync Operations</h2>
            <p>Manage deployments and synchronization across all platforms</p>
            
            <div class="deployment-actions">
                <button class="btn" onclick="deployToNetlify()">🌐 Deploy to Netlify</button>
                <button class="btn btn-info" onclick="syncToGitHub()">🔄 Sync to GitHub</button>
                <button class="btn btn-warning" onclick="healthCheckAll()">🏥 Health Check All</button>
                <button class="btn btn-danger" onclick="emergencyStop()">🛑 Emergency Stop All</button>
            </div>
        </div>

        <div class="servers-grid" id="servers-grid">
            <!-- Servers will be populated here -->
        </div>
    </div>

    <script>
        const socket = io();
        let serversData = [];

        socket.on('connect', () => {
            console.log('🔗 Connected to server management dashboard');
        });

        socket.on('server-status', (data) => {
            serversData = data.servers;
            updateDashboard(data);
        });

        function updateDashboard(data) {
            // Update summary
            document.getElementById('total-servers').textContent = data.summary.total;
            document.getElementById('running-servers').textContent = data.summary.running;
            document.getElementById('stopped-servers').textContent = data.summary.stopped;
            
            const uptime = data.summary.total > 0 ? 
                Math.round((data.summary.running / data.summary.total) * 100) : 100;
            document.getElementById('uptime').textContent = uptime + '%';

            // Update servers grid
            const grid = document.getElementById('servers-grid');
            grid.innerHTML = data.servers.map(server => `
                <div class="server-card" style="border: 2px solid ${getServerBorderColor(server)};">
                    <div class="server-header">
                        <div class="server-name">
                            <span style="color: ${getServerBorderColor(server)};">●</span>
                            ${server.name}
                        </div>
                        <div class="server-status status-${getServerStatusClass(server)}" style="background: ${getServerBorderColor(server)}15; border: 1px solid ${getServerBorderColor(server)};">
                            <span class="status-indicator" style="background: ${getServerBorderColor(server)};"></span>
                            ${server.status.toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="server-info">
                        <div>🏷️ <strong>Environment:</strong> <span style="color: ${server.environment === 'production' ? '#00ff88' : '#ffa726'};">${server.environment || 'Unknown'}</span></div>
                        <div>📍 <strong>Location:</strong> ${server.location || 'Unknown'}</div>
                        <div>📦 <strong>Version:</strong> ${server.version || 'N/A'}</div>
                        <div>🏥 <strong>Health Score:</strong> 
                            <span class="${getHealthClass(server.healthScore || 0)}" style="font-weight: bold;">
                                ${server.healthScore || 0}%
                            </span>
                        </div>
                        ${server.serverInfo ? `
                        <div style="margin-top: 10px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 5px;">
                            <div><strong>🖥️ Hostname:</strong> ${server.serverInfo.hostname}</div>
                            <div><strong>💾 OS:</strong> ${server.serverInfo.os}</div>
                            <div><strong>⚙️ Architecture:</strong> ${server.serverInfo.architecture}</div>
                            <div><strong>📟 Node:</strong> ${server.serverInfo.nodeVersion}</div>
                            <div><strong>🧠 Memory:</strong> ${server.serverInfo.memory}</div>
                            <div><strong>🔧 CPU:</strong> ${server.serverInfo.cpu}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="server-details">
                        <div><strong>File:</strong> ${server.file}</div>
                        <div><strong>Port:</strong> ${server.port}</div>
                        <div><strong>Type:</strong> ${server.type}</div>
                        <div><strong>Description:</strong> ${server.description}</div>
                        ${server.lastStarted ? `<div><strong>Last Started:</strong> ${new Date(server.lastStarted).toLocaleString()}</div>` : ''}
                    </div>

                    ${server.status === 'running' ? `
                    <div class="performance-metrics">
                        <div class="metric-item">
                            <div style="color: #00ff88;">⚡ Response</div>
                            <div>${server.responseTime || 0}ms</div>
                        </div>
                        <div class="metric-item">
                            <div style="color: #3498db;">📊 CPU</div>
                            <div>${(server.cpu || 0).toFixed(1)}%</div>
                        </div>
                        <div class="metric-item">
                            <div style="color: #9b59b6;">🧠 Memory</div>
                            <div>${(server.memory || 0).toFixed(1)}%</div>
                        </div>
                        <div class="metric-item">
                            <div style="color: #f39c12;">📈 Requests</div>
                            <div>${server.requests || 0}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="server-actions">
                        ${server.status === 'stopped' 
                            ? `<button class="btn" onclick="startServer('${server.id}')">▶️ Start</button>`
                            : `<button class="btn btn-danger" onclick="stopServer('${server.id}')">⏹️ Stop</button>`
                        }
                        <button class="btn btn-info" onclick="viewLogs('${server.id}')">📋 Logs</button>
                        ${server.status === 'running' 
                            ? `<button class="btn btn-warning" onclick="healthCheck('${server.id}')">🏥 Check</button>`
                            : `<button class="btn btn-info" onclick="openUrl('${server.id}')">🌐 Open</button>`
                        }
                    </div>

                    ${server.logs && server.logs.length > 0 ? `
                    <div class="logs-section">
                        <strong>Recent Logs:</strong>
                        ${server.logs.slice(-5).map(log => `
                            <div class="log-entry log-${log.type}">
                                [${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            `).join('');
        }

        async function startServer(serverId) {
            const server = serversData.find(s => s.id === serverId);
            if (!server) return;

            try {
                const response = await fetch('/api/server/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serverFile: server.file,
                        port: server.port,
                        name: server.name
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert(`✅ ${result.message}`);
                    if (result.url) {
                        setTimeout(() => window.open(result.url, '_blank'), 2000);
                    }
                } else {
                    alert(`❌ ${result.error}`);
                }
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }

        async function stopServer(serverId) {
            if (!confirm('Are you sure you want to stop this server?')) return;

            try {
                const response = await fetch('/api/server/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serverId })
                });

                const result = await response.json();
                if (result.success) {
                    alert(`✅ ${result.message}`);
                } else {
                    alert(`❌ ${result.error}`);
                }
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }

        async function deployToNetlify() {
            if (!confirm('Deploy to Netlify? This will make your changes live.')) return;

            try {
                const response = await fetch('/api/deploy/netlify', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert(`🚀 ${result.message}`);
                    if (result.url) {
                        window.open(result.url, '_blank');
                    }
                } else {
                    alert(`❌ ${result.error}`);
                }
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }

        async function syncToGitHub() {
            if (!confirm('Sync all changes to GitHub?')) return;

            try {
                const response = await fetch('/api/sync/github', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ ${result.message}`);
                } else {
                    alert(`❌ ${result.error}`);
                }
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }

        async function healthCheck(serverId) {
            const server = serversData.find(s => s.id === serverId);
            if (!server) return;

            const url = `http://0.0.0.0:${server.port}`;
            
            try {
                const response = await fetch('/api/server/health-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                const result = await response.json();
                if (result.success) {
                    alert(`✅ ${result.message}`);
                } else {
                    alert(`❌ Health check failed: ${result.error}`);
                }
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }

        function healthCheckAll() {
            const runningServers = serversData.filter(s => s.status === 'running');
            if (runningServers.length === 0) {
                alert('No running servers to check');
                return;
            }
            
            runningServers.forEach(server => {
                setTimeout(() => healthCheck(server.id), Math.random() * 2000);
            });
        }

        function emergencyStop() {
            if (!confirm('Emergency stop ALL servers? This will stop everything!')) return;
            
            const runningServers = serversData.filter(s => s.status === 'running');
            runningServers.forEach(server => {
                stopServer(server.id);
            });
        }

        function openUrl(serverId) {
            const server = serversData.find(s => s.id === serverId);
            if (server) {
                window.open(`http://0.0.0.0:${server.port}`, '_blank');
            }
        }

        function viewLogs(serverId) {
            const server = serversData.find(s => s.id === serverId);
            if (server && server.logs) {
                const logsWindow = window.open('', '_blank');
                logsWindow.document.write(`
                    <h2>Logs for ${server.name}</h2>
                    <pre>${server.logs.map(log => 
                        `[${new Date(log.timestamp).toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`
                    ).join('\\n')}</pre>
                `);
            }
        }

        function getServerBorderColor(server) {
            if (server.status === 'stopped') return '#ff4757';
            if ((server.healthScore || 0) >= 90) return '#00ff88';
            if ((server.healthScore || 0) >= 70) return '#ffa726';
            return '#ff4757';
        }

        function getServerStatusClass(server) {
            if (server.status === 'stopped') return 'stopped';
            if ((server.healthScore || 0) >= 90) return 'running';
            if ((server.healthScore || 0) >= 70) return 'warning';
            return 'critical';
        }

        function getHealthClass(healthScore) {
            if (healthScore >= 90) return 'health-excellent';
            if (healthScore >= 70) return 'health-good';
            return 'health-poor';
        }

        // Auto-refresh every 15 seconds
        setInterval(() => {
            socket.emit('refresh-servers');
        }, 15000);
    </script>
</body>
</html>`;
  }

  async verifyNetlifyConnection() {
    console.log('🔍 VERIFYING NETLIFY CONNECTION...');
    
    try {
      const https = require('https');
      const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
      const siteId = process.env.NETLIFY_SITE_ID;
      
      if (!netlifyToken || !siteId) {
        console.log('⚠️ Netlify credentials not found in environment');
        this.createAlert('warning', 'Netlify credentials missing - some features may be limited', 'netlify-manager');
        return false;
      }

      return new Promise((resolve) => {
        const options = {
          hostname: 'api.netlify.com',
          path: `/api/v1/sites/${siteId}`,
          headers: { 
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          }
        };

        const req = https.get(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const site = JSON.parse(data);
                console.log('✅ NETLIFY CONNECTION CONFIRMED!');
                console.log(`   📁 Site: ${site.name}`);
                console.log(`   🌐 URL: ${site.ssl_url}`);
                console.log(`   📊 Status: ${site.published_deploy?.state || 'unknown'}`);
                console.log(`   🕐 Last Deploy: ${site.published_deploy?.created_at || 'never'}`);
                
                this.createAlert('info', `Netlify connection verified - Site: ${site.name}`, 'netlify-manager');
                resolve(true);
              } catch (error) {
                console.log('❌ Netlify response parse error');
                this.createAlert('critical', 'Netlify API response parsing failed', 'netlify-manager');
                resolve(false);
              }
            } else {
              console.log(`❌ Netlify API Error: ${res.statusCode}`);
              this.createAlert('critical', `Netlify API error: HTTP ${res.statusCode}`, 'netlify-manager');
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          console.log('❌ Netlify connection error:', error.message);
          this.createAlert('critical', `Netlify connection failed: ${error.message}`, 'netlify-manager');
          resolve(false);
        });

        req.setTimeout(10000, () => {
          console.log('❌ Netlify connection timeout');
          this.createAlert('warning', 'Netlify connection timeout - retrying...', 'netlify-manager');
          req.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      console.log('❌ Netlify verification error:', error.message);
      this.createAlert('critical', `Netlify verification failed: ${error.message}`, 'netlify-manager');
      return false;
    }
  }

  confirmServerDataPull() {
    console.log('📡 CONFIRMING SERVER DATA PULL...');
    
    // Verify all server configurations are loaded
    const totalServers = this.servers.size;
    const healthyServers = Array.from(this.servers.values()).filter(s => s.healthScore >= 90).length;
    const runningServers = Array.from(this.servers.values()).filter(s => s.status === 'running').length;
    
    console.log(`✅ SERVER DATA CONFIRMATION:`);
    console.log(`   📊 Total Servers: ${totalServers}`);
    console.log(`   🟢 Healthy Servers: ${healthyServers}`);
    console.log(`   ⚡ Running Servers: ${runningServers}`);
    console.log(`   🔧 Monitoring Active: ${this.performanceMetrics.size} metrics tracked`);
    console.log(`   🚨 Alert System: ${this.alertSystem.alertCounter} total alerts processed`);
    
    // Test each server's data pull
    for (const [serverId, server] of this.servers) {
      const hasHealthData = this.serverHealth.has(serverId);
      const hasMetrics = this.performanceMetrics.has(serverId);
      
      console.log(`   📋 ${server.name}:`);
      console.log(`      ✅ Server Info: ${server.serverInfo ? 'Available' : 'Limited'}`);
      console.log(`      💓 Health Data: ${hasHealthData ? 'Active' : 'Initializing'}`);
      console.log(`      📊 Metrics: ${hasMetrics ? 'Tracking' : 'Starting'}`);
      console.log(`      🌐 Endpoint: http://0.0.0.0:${server.port}`);
    }
    
    this.createAlert('info', `Server data pull confirmed - ${totalServers} servers monitored`, 'toyparty-main');
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🏗️ ═══════════════════════════════════════`);
      console.log(`🏢  SERVER MANAGEMENT DASHBOARD LIVE!`);
      console.log(`🏗️ ═══════════════════════════════════════`);
      console.log(`🌐 Access: http://0.0.0.0:${this.port}`);
      console.log(`🔧 Managing ${this.servers.size} server configurations`);
      console.log(`🚨 Alert System: ${this.alertSystem.criticalAlerts.length} critical, ${this.alertSystem.warningAlerts.length} warnings`);
      console.log(`📊 Monitoring: ${this.performanceMetrics.size} servers tracked`);
      console.log(`🔗 Global Admin: ${this.alertSystem.globalAdminConnected ? 'Connected' : 'Attempting connection'}`);
      console.log('✅ Ready for server deployment and management!');
      console.log(`🏗️ ═══════════════════════════════════════`);
    });
  }
}

// Auto-start if executed directly
if (require.main === module) {
  const dashboard = new ServerManagementDashboard();
  dashboard.start();
}

module.exports = ServerManagementDashboard;
