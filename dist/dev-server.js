const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const AdvancedMultiProjectManager = require('./advanced-multi-project-manager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;
const projectManager = new AdvancedMultiProjectManager();

// Serve static files from current directory
app.use(express.static('.'));

// Serve HTML files
app.get('/', (req, res) => {
  if (fs.existsSync('./index.html')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.send(`
      <h1>🚀 ToyParty Development Server</h1>
      <h2>Your live site: <a href="https://toyparty.netlify.app" target="_blank">https://toyparty.netlify.app</a></h2>
      <h3>Available Files:</h3>
      <ul>
        ${fs.readdirSync('.').filter(f => f.endsWith('.html')).map(f => 
          `<li><a href="/${f}">${f}</a></li>`
        ).join('')}
      </ul>
      <h3>Public Files:</h3>
      <ul>
        ${fs.existsSync('./public') ? fs.readdirSync('./public').map(f => 
          `<li><a href="/public/${f}">${f}</a></li>`
        ).join('') : '<li>No public directory</li>'}
      </ul>
    `);
  }
});

// Multi-project dashboard
app.get('/multi-project-dashboard', (req, res) => {
  const dashboard = projectManager.generateProjectDashboard();
  res.send(dashboard);
});

// API endpoints for multi-project management
app.post('/api/deploy/:project', async (req, res) => {
  try {
    const result = await projectManager.deployProject(req.params.project);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/deploy-all', async (req, res) => {
  try {
    const result = await projectManager.deployAllProjects();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start workflow endpoint
app.post('/api/start-workflow', async (req, res) => {
  try {
    const { workflow } = req.body;
    console.log(`🚀 Starting workflow: ${workflow}`);

    // Execute workflow based on name
    const { spawn } = require('child_process');
    let command;

    switch(workflow) {
      case '🔐 Start Admin System':
        command = 'node admin-auth-system.js';
        break;
      case '🚀 Optimized Dashboard':
        command = 'node optimized-dashboard.js';
        break;
      default:
        return res.json({ success: false, error: 'Workflow not found' });
    }

    const child = spawn('node', command.split(' ').slice(1), {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    res.json({ success: true, message: `Started ${workflow}`, command });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/discover', async (req, res) => {
  try {
    const projects = await projectManager.discoverAllProjects();
    await projectManager.updateDeployConfiguration(projects);
    res.json({ success: true, discovered: projects.length, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/create-project', async (req, res) => {
  try {
    const { name, type } = req.body;
    // Create project logic here
    res.json({ success: true, message: `Project ${name} of type ${type} created` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/projects', (req, res) => {
  const config = projectManager.loadDeployConfig();
  res.json({ projects: config.repos || [], total: config.repos?.length || 0 });
});

// Serve static files
app.use(express.static('public'));

app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Development server running at http://0.0.0.0:${port}`);
  console.log(`🚀 Live site: https://toyparty.netlify.app`);
  console.log(`✅ Edit files here - they auto-sync to GitHub and redeploy!`);
});
```The code fixes a module not found error and changes the default port to 3000.