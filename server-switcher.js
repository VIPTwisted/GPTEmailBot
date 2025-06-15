
const express = require('express');
const { spawn, exec } = require('child_process');
const app = express();
const PORT = 4444;

class ServerSwitcher {
  constructor() {
    this.activeServers = new Map();
    this.serverConfigs = {
      'netlify-dashboard': {
        name: 'Professional Netlify Dashboard',
        file: 'simple-server.js',
        port: 3000,
        description: 'Main Professional Netlify Management Dashboard'
      },
      'admin-system': {
        name: 'Admin Authentication System',
        file: 'admin-auth-system.js',
        port: 6001,
        description: 'Admin login and control panel'
      },
      'business-command': {
        name: 'Business Command Center',
        file: 'ultimate-business-command-center.js',
        port: 8888,
        description: 'MLM, CRM, Financial, and HR management'
      },
      'commerce-empire': {
        name: 'Commerce Empire Dashboard',
        file: 'commerce-empire-dashboard.js',
        port: 8080,
        description: 'Complete e-commerce and POS system'
      },
      'employee-management': {
        name: 'Employee Management System',
        file: 'employee-management-system.js',
        port: 7500,
        description: 'Employee management and HR tools'
      },
      'ai-assistant': {
        name: 'Ultimate AI Assistant',
        file: 'ultimate-gpt-assistant.js',
        port: 8000,
        description: 'AI assistant and automation'
      },
      'seo-marketing': {
        name: 'SEO Marketing Platform',
        file: 'seo-marketing-dashboard.js',
        port: 9001,
        description: 'Advanced SEO and marketing tools'
      },
      'universal-admin': {
        name: 'Universal Admin Backend',
        file: 'universal-admin-backend.js',
        port: 6000,
        description: 'Master system administration'
      },
      'master-navigation': {
        name: 'Master Navigation System',
        file: 'master-navigation-system.js',
        port: 3000,
        description: 'Professional platform navigation'
      },
      'dev-server': {
        name: 'Development Server',
        file: 'dev-server.js',
        port: 5000,
        description: 'Live development server'
      }
    };
  }

  async startServer(serverId) {
    const config = this.serverConfigs[serverId];
    if (!config) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Kill any existing process on this port
    await this.killPortProcess(config.port);
    
    // Wait for port to be free
    await this.sleep(2000);

    console.log(`🚀 Starting ${config.name} on port ${config.port}`);
    
    const child = spawn('node', [config.file], {
      stdio: 'pipe',
      env: { ...process.env, PORT: config.port }
    });

    child.stdout.on('data', (data) => {
      console.log(`[${serverId}] ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`[${serverId}] ERROR: ${data.toString()}`);
    });

    this.activeServers.set(serverId, {
      process: child,
      config: config,
      startTime: Date.now()
    });

    return {
      success: true,
      serverId,
      name: config.name,
      port: config.port,
      url: `http://0.0.0.0:${config.port}`
    };
  }

  async stopServer(serverId) {
    const server = this.activeServers.get(serverId);
    if (!server) {
      return { success: false, message: 'Server not running' };
    }

    server.process.kill();
    this.activeServers.delete(serverId);
    
    return { success: true, message: `${server.config.name} stopped` };
  }

  async killPortProcess(port) {
    try {
      // Kill any process using the port
      await this.execPromise(`pkill -f "node.*${port}" || true`);
      await this.execPromise(`lsof -ti:${port} | xargs kill -9 || true`);
    } catch (error) {
      console.log(`Port ${port} cleanup: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  getServerStatus() {
    const status = [];
    for (const [id, server] of this.activeServers) {
      status.push({
        id,
        name: server.config.name,
        port: server.config.port,
        url: `http://0.0.0.0:${server.config.port}`,
        uptime: Math.floor((Date.now() - server.startTime) / 1000),
        status: 'running'
      });
    }
    return status;
  }
}

const serverSwitcher = new ServerSwitcher();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Main server switcher dashboard
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Server Switcher - Professional Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e40af 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            text-align: center;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 30px; }
        .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }
        .server-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .server-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        .server-name { font-size: 1.3em; font-weight: bold; margin-bottom: 10px; color: #fbbf24; }
        .server-description { opacity: 0.8; margin-bottom: 15px; }
        .server-port { font-family: monospace; background: rgba(0, 0, 0, 0.3); padding: 5px 10px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
            transition: all 0.2s ease;
        }
        .btn-start { background: #10b981; color: white; }
        .btn-stop { background: #ef4444; color: white; }
        .btn-visit { background: #3b82f6; color: white; }
        .btn:hover { transform: scale(1.05); }
        .status-section {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 20px;
            margin: 30px 0;
        }
        .running-server {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.5);
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .quick-actions {
            display: flex;
            gap: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Professional Server Switcher</h1>
        <p>Manage and switch between all your professional platforms</p>
    </div>

    <div class="container">
        <div class="quick-actions">
            <button class="btn btn-start" onclick="startAllEssential()">🚀 Start Essential Servers</button>
            <button class="btn btn-stop" onclick="stopAllServers()">🛑 Stop All Servers</button>
            <button class="btn btn-visit" onclick="refreshStatus()">🔄 Refresh Status</button>
        </div>

        <div class="status-section">
            <h2>🟢 Running Servers</h2>
            <div id="runningServers">Loading...</div>
        </div>

        <div class="servers-grid">
            ${Object.entries(serverSwitcher.serverConfigs).map(([id, config]) => `
                <div class="server-card">
                    <div class="server-name">${config.name}</div>
                    <div class="server-description">${config.description}</div>
                    <div class="server-port">Port: ${config.port}</div>
                    <div>
                        <button class="btn btn-start" onclick="startServer('${id}')">🚀 Start</button>
                        <button class="btn btn-stop" onclick="stopServer('${id}')">🛑 Stop</button>
                        <button class="btn btn-visit" onclick="visitServer('${id}', ${config.port})">👁️ Visit</button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        async function startServer(serverId) {
            try {
                const response = await fetch('/api/start/' + serverId, { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    alert(\`✅ \${result.name} started successfully on port \${result.port}\`);
                    refreshStatus();
                } else {
                    alert('❌ Failed to start server: ' + result.message);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function stopServer(serverId) {
            try {
                const response = await fetch('/api/stop/' + serverId, { method: 'POST' });
                const result = await response.json();
                alert(result.success ? '✅ Server stopped' : '❌ ' + result.message);
                refreshStatus();
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        function visitServer(serverId, port) {
            window.open(\`http://0.0.0.0:\${port}\`, '_blank');
        }

        async function startAllEssential() {
            const essential = ['netlify-dashboard', 'admin-system', 'dev-server'];
            for (const serverId of essential) {
                await startServer(serverId);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between starts
            }
        }

        async function stopAllServers() {
            if (confirm('Stop all running servers?')) {
                const response = await fetch('/api/stop-all', { method: 'POST' });
                const result = await response.json();
                alert(\`Stopped \${result.stopped} servers\`);
                refreshStatus();
            }
        }

        async function refreshStatus() {
            try {
                const response = await fetch('/api/status');
                const servers = await response.json();
                
                const container = document.getElementById('runningServers');
                if (servers.length === 0) {
                    container.innerHTML = '<p>No servers currently running</p>';
                } else {
                    container.innerHTML = servers.map(server => \`
                        <div class="running-server">
                            <div>
                                <strong>\${server.name}</strong><br>
                                <span style="opacity: 0.8;">Port \${server.port} • Uptime: \${server.uptime}s</span>
                            </div>
                            <div>
                                <button class="btn btn-visit" onclick="window.open('\${server.url}', '_blank')">Visit</button>
                                <button class="btn btn-stop" onclick="stopServer('\${server.id}')">Stop</button>
                            </div>
                        </div>
                    \`).join('');
                }
            } catch (error) {
                console.error('Failed to refresh status:', error);
            }
        }

        // Auto-refresh every 10 seconds
        setInterval(refreshStatus, 10000);
        refreshStatus();
    </script>
</body>
</html>
  `;
  res.send(html);
});

// API Routes
app.post('/api/start/:serverId', async (req, res) => {
  try {
    const result = await serverSwitcher.startServer(req.params.serverId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/stop/:serverId', async (req, res) => {
  try {
    const result = await serverSwitcher.stopServer(req.params.serverId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/stop-all', async (req, res) => {
  try {
    let stopped = 0;
    for (const [serverId] of serverSwitcher.activeServers) {
      await serverSwitcher.stopServer(serverId);
      stopped++;
    }
    res.json({ success: true, stopped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json(serverSwitcher.getServerStatus());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server Switcher running at http://0.0.0.0:${PORT}`);
  console.log('🎯 Manage all your professional servers from one dashboard');
});

module.exports = { ServerSwitcher, app };
