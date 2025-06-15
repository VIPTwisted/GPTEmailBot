
const express = require('express');
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const { getNetlifySecrets, getGitHubToken } = require('./universal-secret-loader.js');

class AutonomousNetlifyManager {
  constructor() {
    this.app = express();
    this.port = 4000;
    this.projects = new Map();
    this.deploymentQueue = [];
    this.monitoring = new Map();
    
    // Load secrets
    const netlifySecrets = getNetlifySecrets();
    this.netlifyToken = netlifySecrets.token;
    this.githubToken = getGitHubToken();
    
    if (!this.netlifyToken || !this.githubToken) {
      throw new Error('Missing required secrets: NETLIFY_ACCESS_TOKEN and GITHUB_TOKEN');
    }
    
    console.log('🚀 AUTONOMOUS NETLIFY MANAGER INITIALIZED');
    console.log(`✅ GitHub Token: Found (${this.githubToken.substring(0, 8)}...)`);
    console.log(`✅ Netlify Token: Found (${this.netlifyToken.substring(0, 8)}...)`);
    
    this.setupRoutes();
    this.loadExistingProjects();
    this.startMonitoring();
  }

  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboard());
    });

    // API Routes
    this.app.post('/api/add-project', async (req, res) => {
      try {
        const { name, type, repo_url, domain } = req.body;
        const result = await this.addProject(name, type, repo_url, domain);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/projects', (req, res) => {
      const projectsList = Array.from(this.projects.values());
      res.json({ projects: projectsList, total: projectsList.length });
    });

    this.app.post('/api/deploy/:projectId', async (req, res) => {
      try {
        const result = await this.deployProject(req.params.projectId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/status/:projectId', async (req, res) => {
      try {
        const status = await this.getProjectStatus(req.params.projectId);
        res.json(status);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/auto-scale/:projectId', async (req, res) => {
      try {
        const result = await this.autoScaleProject(req.params.projectId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/analytics/:projectId', async (req, res) => {
      try {
        const analytics = await this.getProjectAnalytics(req.params.projectId);
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.delete('/api/project/:projectId', async (req, res) => {
      try {
        const result = await this.removeProject(req.params.projectId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  async addProject(name, type, repoUrl, customDomain = null) {
    console.log(`🆕 Adding new project: ${name}`);
    
    const projectId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    
    // Step 1: Create Netlify site
    const site = await this.createNetlifySite(name, projectId);
    if (!site.success) {
      throw new Error(`Failed to create Netlify site: ${site.error}`);
    }

    // Step 2: Setup GitHub repository connection
    const repoConnection = await this.connectGitHubRepo(site.data.id, repoUrl);
    if (!repoConnection.success) {
      throw new Error(`Failed to connect GitHub repo: ${repoConnection.error}`);
    }

    // Step 3: Configure build settings
    const buildConfig = await this.configureBuildSettings(site.data.id, type);
    
    // Step 4: Setup custom domain if provided
    if (customDomain) {
      await this.setupCustomDomain(site.data.id, customDomain);
    }

    // Step 5: Initial deployment
    const deployment = await this.triggerDeployment(site.data.id);

    const project = {
      id: projectId,
      name: name,
      type: type,
      siteId: site.data.id,
      repoUrl: repoUrl,
      customDomain: customDomain,
      netlifyUrl: site.data.ssl_url || site.data.url,
      status: 'deploying',
      createdAt: new Date().toISOString(),
      deployments: [deployment.data],
      monitoring: {
        enabled: true,
        lastCheck: new Date().toISOString(),
        uptime: 100,
        responseTime: 0
      }
    };

    this.projects.set(projectId, project);
    this.saveProjects();
    
    // Start monitoring this project
    this.startProjectMonitoring(projectId);

    console.log(`✅ Project ${name} added successfully!`);
    console.log(`🌐 Live URL: ${project.netlifyUrl}`);
    
    return {
      success: true,
      project: project,
      message: `Project ${name} created and deploying!`
    };
  }

  async createNetlifySite(name, projectId) {
    console.log(`🏗️ Creating Netlify site for ${name}...`);
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        name: projectId,
        custom_domain: null,
        force_ssl: true,
        processing_settings: {
          css: { bundle: true, minify: true },
          js: { bundle: true, minify: true },
          images: { optimize: true },
          html: { pretty_urls: true }
        }
      });

      const options = {
        hostname: 'api.netlify.com',
        path: '/api/v1/sites',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            try {
              const site = JSON.parse(data);
              console.log(`✅ Netlify site created: ${site.ssl_url}`);
              resolve({ success: true, data: site });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            console.error(`❌ Site creation failed: ${res.statusCode}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  async connectGitHubRepo(siteId, repoUrl) {
    console.log(`🔗 Connecting GitHub repository...`);
    
    // Extract owner and repo from URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
    if (!repoMatch) {
      return { success: false, error: 'Invalid GitHub URL' };
    }

    const [, owner, repo] = repoMatch;
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        repo: {
          provider: 'github',
          repo: `${owner}/${repo}`,
          branch: 'main',
          cmd: 'npm run build',
          dir: 'dist'
        }
      });

      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${siteId}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ GitHub repository connected`);
            resolve({ success: true });
          } else {
            console.error(`❌ Repo connection failed: ${res.statusCode}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  async configureBuildSettings(siteId, projectType) {
    console.log(`⚙️ Configuring build settings for ${projectType}...`);
    
    const buildCommands = {
      'react': 'npm ci && npm run build',
      'vue': 'npm ci && npm run build',
      'angular': 'npm ci && npm run build',
      'svelte': 'npm ci && npm run build',
      'nextjs': 'npm ci && npm run build && npm run export',
      'gatsby': 'npm ci && npm run build',
      'static': 'echo "Static site - no build needed"',
      'node': 'npm ci && npm start'
    };

    const publishDirs = {
      'react': 'build',
      'vue': 'dist',
      'angular': 'dist',
      'svelte': 'build',
      'nextjs': 'out',
      'gatsby': 'public',
      'static': '.',
      'node': 'dist'
    };

    const buildCommand = buildCommands[projectType] || buildCommands['static'];
    const publishDir = publishDirs[projectType] || '.';

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        build_settings: {
          cmd: buildCommand,
          dir: publishDir,
          env: {
            NODE_VERSION: '20',
            NPM_VERSION: '10'
          }
        }
      });

      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${siteId}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ Build settings configured`);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  async triggerDeployment(siteId) {
    console.log(`🚀 Triggering deployment...`);
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        clear_cache: true,
        force_rebuild: true
      });

      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${siteId}/builds`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201 || res.statusCode === 200) {
            try {
              const deployment = JSON.parse(data);
              console.log(`✅ Deployment triggered: ${deployment.id}`);
              resolve({ success: true, data: deployment });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  async deployProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    console.log(`🚀 Deploying project: ${project.name}`);
    
    const deployment = await this.triggerDeployment(project.siteId);
    if (deployment.success) {
      project.status = 'deploying';
      project.deployments.unshift(deployment.data);
      this.projects.set(projectId, project);
      this.saveProjects();
    }

    return deployment;
  }

  async getProjectStatus(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${project.siteId}`,
        headers: { 'Authorization': `Bearer ${this.netlifyToken}` }
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const siteData = JSON.parse(data);
              const status = {
                projectId: projectId,
                name: project.name,
                status: siteData.published_deploy?.state || 'unknown',
                url: siteData.ssl_url,
                lastDeploy: siteData.published_deploy?.created_at,
                buildTime: siteData.published_deploy?.deploy_time,
                monitoring: project.monitoring
              };
              resolve({ success: true, data: status });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  }

  async getProjectAnalytics(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Get basic analytics from Netlify
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${project.siteId}/analytics`,
        headers: { 'Authorization': `Bearer ${this.netlifyToken}` }
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const analytics = JSON.parse(data);
              resolve({ success: true, data: analytics });
            } catch (error) {
              resolve({ success: true, data: { message: 'Analytics not available' } });
            }
          } else {
            resolve({ success: true, data: { message: 'Analytics not available' } });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: true, data: { message: 'Analytics not available' } });
      });
    });
  }

  startProjectMonitoring(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return;

    // Monitor every 2 minutes
    const monitorInterval = setInterval(async () => {
      try {
        const start = Date.now();
        const response = await this.checkProjectHealth(project.netlifyUrl);
        const responseTime = Date.now() - start;

        project.monitoring.lastCheck = new Date().toISOString();
        project.monitoring.responseTime = responseTime;
        
        if (response.success) {
          project.monitoring.uptime = Math.min(100, (project.monitoring.uptime * 0.99) + 1);
          project.status = 'live';
        } else {
          project.monitoring.uptime = Math.max(0, project.monitoring.uptime * 0.95);
          if (project.monitoring.uptime < 80) {
            console.log(`⚠️ Project ${project.name} health degraded - triggering auto-recovery`);
            await this.autoRecoverProject(projectId);
          }
        }

        this.projects.set(projectId, project);
      } catch (error) {
        console.error(`❌ Monitoring error for ${project.name}:`, error.message);
      }
    }, 120000); // 2 minutes

    this.monitoring.set(projectId, monitorInterval);
  }

  async checkProjectHealth(url) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        timeout: 10000
      };

      const req = https.get(options, (res) => {
        resolve({ 
          success: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode 
        });
      });

      req.on('error', () => resolve({ success: false }));
      req.on('timeout', () => resolve({ success: false }));
      req.setTimeout(10000);
    });
  }

  async autoRecoverProject(projectId) {
    console.log(`🔧 Auto-recovering project: ${projectId}`);
    
    const project = this.projects.get(projectId);
    if (!project) return;

    // Trigger a new deployment to recover
    await this.deployProject(projectId);
    
    // Clear any caches
    await this.clearProjectCache(project.siteId);
    
    console.log(`✅ Auto-recovery initiated for ${project.name}`);
  }

  async clearProjectCache(siteId) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${siteId}/purge_cache`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.netlifyToken}` }
      };

      const req = https.request(options, (res) => {
        resolve({ success: res.statusCode === 200 });
      });

      req.on('error', () => resolve({ success: false }));
      req.end();
    });
  }

  loadExistingProjects() {
    if (fs.existsSync('netlify-projects.json')) {
      try {
        const data = JSON.parse(fs.readFileSync('netlify-projects.json', 'utf8'));
        data.forEach(project => {
          this.projects.set(project.id, project);
          this.startProjectMonitoring(project.id);
        });
        console.log(`✅ Loaded ${this.projects.size} existing projects`);
      } catch (error) {
        console.error('❌ Failed to load existing projects:', error.message);
      }
    }
  }

  saveProjects() {
    const projectsArray = Array.from(this.projects.values());
    fs.writeFileSync('netlify-projects.json', JSON.stringify(projectsArray, null, 2));
  }

  startMonitoring() {
    console.log('📊 Starting global monitoring system...');
    
    // Global health check every 5 minutes
    setInterval(async () => {
      console.log(`🔍 Global health check - monitoring ${this.projects.size} projects`);
      
      for (const [projectId, project] of this.projects) {
        const status = await this.getProjectStatus(projectId);
        if (status.success) {
          project.lastHealthCheck = new Date().toISOString();
          project.status = status.data.status;
        }
      }
      
      this.saveProjects();
    }, 300000); // 5 minutes
  }

  generateDashboard() {
    const projectsArray = Array.from(this.projects.values());
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Autonomous Netlify Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(90deg, #ff6b35, #f7931e);
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stat-value { font-size: 2.5em; font-weight: bold; color: #00ff88; margin-bottom: 10px; }
        .stat-label { opacity: 0.9; }
        .add-project {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.9);
            color: #333;
            font-size: 16px;
        }
        .btn {
            background: linear-gradient(45deg, #00ff88, #00cc66);
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
            transition: transform 0.2s;
        }
        .btn:hover { transform: scale(1.05); }
        .btn-danger { background: linear-gradient(45deg, #ff4757, #ff3838); }
        .btn-warning { background: linear-gradient(45deg, #ffa726, #ff9800); }
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }
        .project-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s;
        }
        .project-card:hover { transform: translateY(-10px); }
        .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .project-name { font-size: 1.5em; font-weight: bold; }
        .project-status {
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status-live { background: #00ff88; color: #000; }
        .status-deploying { background: #ffa726; color: #000; }
        .status-error { background: #ff4757; color: #fff; }
        .project-details { margin: 15px 0; }
        .project-metric { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .project-actions { margin-top: 20px; }
        .loading { text-align: center; padding: 40px; opacity: 0.7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 AUTONOMOUS NETLIFY MANAGER</h1>
        <p>Fully automated server building, deployment, and monitoring</p>
    </div>

    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${projectsArray.length}</div>
                <div class="stat-label">Total Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${projectsArray.filter(p => p.status === 'live').length}</div>
                <div class="stat-label">Live Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${projectsArray.filter(p => p.status === 'deploying').length}</div>
                <div class="stat-label">Deploying</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(projectsArray.reduce((acc, p) => acc + (p.monitoring?.uptime || 0), 0) / Math.max(projectsArray.length, 1))}%</div>
                <div class="stat-label">Avg Uptime</div>
            </div>
        </div>

        <div class="add-project">
            <h2>➕ Add New Project</h2>
            <p>Automatically builds, deploys, and monitors your project on Netlify</p>
            
            <div class="form-group">
                <label for="projectName">Project Name:</label>
                <input type="text" id="projectName" placeholder="My Awesome Project" required>
            </div>
            
            <div class="form-group">
                <label for="projectType">Project Type:</label>
                <select id="projectType" required>
                    <option value="">Select project type...</option>
                    <option value="react">React App</option>
                    <option value="vue">Vue.js App</option>
                    <option value="angular">Angular App</option>
                    <option value="svelte">Svelte App</option>
                    <option value="nextjs">Next.js App</option>
                    <option value="gatsby">Gatsby Site</option>
                    <option value="static">Static HTML/CSS/JS</option>
                    <option value="node">Node.js App</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="repoUrl">GitHub Repository URL:</label>
                <input type="url" id="repoUrl" placeholder="https://github.com/username/repo" required>
            </div>
            
            <div class="form-group">
                <label for="customDomain">Custom Domain (optional):</label>
                <input type="text" id="customDomain" placeholder="myproject.com">
            </div>
            
            <button class="btn" onclick="addProject()">🚀 Create & Deploy Project</button>
        </div>

        <div class="projects-grid" id="projects-grid">
            ${projectsArray.map(project => `
                <div class="project-card">
                    <div class="project-header">
                        <div class="project-name">${project.name}</div>
                        <div class="project-status status-${project.status}">${project.status.toUpperCase()}</div>
                    </div>
                    
                    <div class="project-details">
                        <div class="project-metric">
                            <span>Type:</span>
                            <span>${project.type.toUpperCase()}</span>
                        </div>
                        <div class="project-metric">
                            <span>Uptime:</span>
                            <span>${Math.round(project.monitoring?.uptime || 0)}%</span>
                        </div>
                        <div class="project-metric">
                            <span>Response Time:</span>
                            <span>${project.monitoring?.responseTime || 0}ms</span>
                        </div>
                        <div class="project-metric">
                            <span>Last Check:</span>
                            <span>${project.monitoring?.lastCheck ? new Date(project.monitoring.lastCheck).toLocaleTimeString() : 'Never'}</span>
                        </div>
                        <div class="project-metric">
                            <span>Live URL:</span>
                            <span><a href="${project.netlifyUrl}" target="_blank" style="color: #00ff88; text-decoration: none;">Visit Site</a></span>
                        </div>
                    </div>
                    
                    <div class="project-actions">
                        <button class="btn" onclick="deployProject('${project.id}')">🚀 Deploy</button>
                        <button class="btn btn-warning" onclick="viewAnalytics('${project.id}')">📊 Analytics</button>
                        <button class="btn btn-danger" onclick="removeProject('${project.id}')">🗑️ Remove</button>
                    </div>
                </div>
            `).join('')}
        </div>

        ${projectsArray.length === 0 ? '<div class="loading">🚀 No projects yet. Add your first project above!</div>' : ''}
    </div>

    <script>
        async function addProject() {
            const name = document.getElementById('projectName').value;
            const type = document.getElementById('projectType').value;
            const repoUrl = document.getElementById('repoUrl').value;
            const customDomain = document.getElementById('customDomain').value;

            if (!name || !type || !repoUrl) {
                alert('Please fill in all required fields');
                return;
            }

            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '🚀 Creating...';

            try {
                const response = await fetch('/api/add-project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type, repo_url: repoUrl, domain: customDomain })
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('🎉 Project created successfully! Deployment in progress...');
                    location.reload();
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } catch (error) {
                alert('❌ Network error: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = '🚀 Create & Deploy Project';
            }
        }

        async function deployProject(projectId) {
            try {
                const response = await fetch('/api/deploy/' + projectId, { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('🚀 Deployment triggered!');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    alert('❌ Deployment failed: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function viewAnalytics(projectId) {
            try {
                const response = await fetch('/api/analytics/' + projectId);
                const result = await response.json();
                
                if (result.success) {
                    const analytics = result.data;
                    const info = Object.keys(analytics).length > 1 ? 
                        JSON.stringify(analytics, null, 2) : 
                        'Analytics data will be available after your site receives traffic.';
                    
                    const newWindow = window.open('', '_blank');
                    newWindow.document.write('<pre>' + info + '</pre>');
                } else {
                    alert('❌ Analytics unavailable: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function removeProject(projectId) {
            if (confirm('Are you sure you want to remove this project? This cannot be undone.')) {
                try {
                    const response = await fetch('/api/project/' + projectId, { method: 'DELETE' });
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('🗑️ Project removed successfully');
                        location.reload();
                    } else {
                        alert('❌ Removal failed: ' + result.error);
                    }
                } catch (error) {
                    alert('❌ Error: ' + error.message);
                }
            }
        }

        // Auto-refresh every 30 seconds
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>`;
  }

  async removeProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Stop monitoring
    if (this.monitoring.has(projectId)) {
      clearInterval(this.monitoring.get(projectId));
      this.monitoring.delete(projectId);
    }

    // Remove from Netlify (optional - commented out to preserve sites)
    // await this.deleteNetlifySite(project.siteId);

    // Remove from local storage
    this.projects.delete(projectId);
    this.saveProjects();

    console.log(`🗑️ Project ${project.name} removed`);
    return { success: true, message: `Project ${project.name} removed` };
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`\n🚀 AUTONOMOUS NETLIFY MANAGER RUNNING`);
        console.log(`🌐 Dashboard: http://0.0.0.0:${this.port}`);
        console.log(`📊 Managing ${this.projects.size} projects`);
        console.log(`✅ Auto-monitoring enabled`);
        console.log(`🔧 Auto-recovery enabled`);
        resolve();
      });
    });
  }
}

module.exports = AutonomousNetlifyManager;

// Auto-start if run directly
if (require.main === module) {
  const manager = new AutonomousNetlifyManager();
  manager.start().catch(error => {
    console.error('❌ Failed to start Autonomous Netlify Manager:', error.message);
    process.exit(1);
  });
}
