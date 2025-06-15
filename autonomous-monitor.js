
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const FrontendMonitor = require('./frontend-monitor');
const NetlifyIntegration = require('./netlify-integration');
const { syncSpecificRepo } = require('./sync-gpt-to-github');

class AutonomousMonitor {
  constructor(githubToken, netlifyToken, netlifyApiId, deploySiteId) {
    this.githubToken = githubToken || process.env.GITHUB_TOKEN;
    this.netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
    this.netlifyApiId = netlifyApiId;
    this.deploySiteId = deploySiteId || process.env.NETLIFY_SITE_ID;
    this.netlifyErrors = [];
    this.netlifySkipped = [];
    this.isRunning = false;
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
    this.monitoringActive = true;
    this.lastBuildStatus = null;
    this.monitorInterval = 30000; // 30 seconds
    this.logFile = 'logs/autonomous-monitor.log';
    this.buildLogFile = 'logs/netlify-builds.log';

    this.frontendMonitor = new FrontendMonitor(this.performSync.bind(this));
    this.netlify = new NetlifyIntegration();

    this.ensureLogDirectories();
  }

  ensureLogDirectories() {
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    console.log(`🤖 [MONITOR] ${message}`);
    fs.appendFileSync(this.logFile, logEntry);
  }

  logBuild(buildData) {
    const timestamp = new Date().toISOString();
    const buildEntry = `
=== BUILD LOG ${timestamp} ===
Build ID: ${buildData.id || 'N/A'}
Status: ${buildData.state || 'Unknown'}
Site: ${buildData.name || 'ToyParty'}
Deploy URL: ${buildData.deploy_ssl_url || buildData.ssl_url || 'N/A'}
Error: ${buildData.error_message || 'None'}
Duration: ${buildData.deploy_time ? `${buildData.deploy_time}ms` : 'N/A'}
=====================================

`;
    fs.appendFileSync(this.buildLogFile, buildEntry);
  }

  async start() {
    if (this.isRunning) return;

    console.log('🤖 AUTONOMOUS MONITOR STARTING...');
    console.log('🎯 Mode: GPT Engineer + Autonomous DevOps Agent');
    console.log('📁 Watching: /frontend, /builder, /src');
    console.log('🚀 Auto-deploy: Enabled for ToyParty');

    this.isRunning = true;

    // Start frontend file monitoring
    this.frontendMonitor.startWatching();

    // Start periodic health checks
    this.startHealthChecks();
    this.startMonitoring();

    console.log('✅ Autonomous monitoring active - no manual intervention required');
  }

  async performSync(repoName = 'ToyParty', customMessage = null) {
    try {
      console.log(`🔄 Autonomous sync triggered for ${repoName}`);

      const result = await syncSpecificRepo(repoName);

      if (result.success) {
        this.logSyncAction(repoName, 'SUCCESS', customMessage);
        setTimeout(() => this.checkDeployHealth(), 30000);
      } else {
        this.logSyncAction(repoName, 'FAILED', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Autonomous sync error:', error.message);
      this.logSyncAction(repoName, 'ERROR', error.message);
    }
  }

  startHealthChecks() {
    setInterval(async () => {
      await this.checkDeployHealth();
    }, this.healthCheckInterval);
  }

  async checkDeployHealth() {
    try {
      const https = require('https');

      return new Promise((resolve) => {
        https.get('https://toyparty.netlify.app', (res) => {
          if (res.statusCode === 200) {
            console.log('✅ ToyParty site health check passed');
            this.logSyncAction('ToyParty', 'HEALTH_OK', 'Site accessible');
          } else {
            console.log(`⚠️ ToyParty health check warning: ${res.statusCode}`);
            this.logSyncAction('ToyParty', 'HEALTH_WARNING', `HTTP ${res.statusCode}`);
          }
          resolve(res.statusCode);
        }).on('error', (error) => {
          console.log(`❌ ToyParty health check failed: ${error.message}`);
          this.logSyncAction('ToyParty', 'HEALTH_FAILED', error.message);
          resolve(null);
        });
      });
    } catch (error) {
      console.log(`❌ Health check error: ${error.message}`);
    }
  }

  async checkRepoStatus() {
    try {
      const response = await fetch(`https://api.github.com/repos/VIPTwisted/ToyParty/commits/main`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 200 || response.status === 201 || response.ok) {
        const commit = await response.json();
        return {
          success: true,
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date
        };
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } catch (error) {
      this.log(`GitHub check failed: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async triggerNetlifyBuild(reason = 'Autonomous sync detected') {
    const netlifyErrors = [];
    const netlifySkipped = [];

    try {
      if (!this.deploySiteId) {
        const skipMessage = 'NETLIFY_SITE_ID missing - skipping build trigger';
        this.log(`⏭️ ${skipMessage}`, 'SKIP');
        netlifySkipped.push(skipMessage);
        return { success: false, error: skipMessage, skipped: netlifySkipped };
      }

      if (!this.netlifyToken) {
        const skipMessage = 'NETLIFY_ACCESS_TOKEN missing - skipping build trigger';
        this.log(`⏭️ ${skipMessage}`, 'SKIP');
        netlifySkipped.push(skipMessage);
        return { success: false, error: skipMessage, skipped: netlifySkipped };
      }

      const response = await fetch(`https://api.netlify.com/api/v1/sites/${this.deploySiteId}/builds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clear_cache: true
        })
      });

      if (response.status === 200 || response.status === 201 || response.ok) {
        const build = await response.json();
        this.log(`🚀 Netlify build triggered: ${build.id} - ${reason}`, 'SUCCESS');
        this.logBuild(build);
        return { success: true, buildId: build.id, build };
      } else {
        const errorText = await response.text();
        const errorMessage = `Netlify API error: ${response.status} - ${errorText}`;
        netlifyErrors.push(errorMessage);

        if (response.status === 404) {
          const siteIdError = `404 Error: NETLIFY_SITE_ID "${this.deploySiteId}" not found`;
          netlifyErrors.push(siteIdError);
          this.log(`❌ ${siteIdError}`, 'ERROR');
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      const fullError = `Netlify build trigger failed: ${error.message}`;
      netlifyErrors.push(fullError);
      this.log(`❌ ${fullError}`, 'ERROR');

      console.log('\n📋 NETLIFY FAILURE TRACKING:');
      if (netlifyErrors.length > 0) {
        console.log('❌ NETLIFY ERRORS:');
        netlifyErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
      }
      if (netlifySkipped.length > 0) {
        console.log('⏭️ NETLIFY SKIPPED:');
        netlifySkipped.forEach((skip, i) => console.log(`   ${i + 1}. ${skip}`));
      }

      return { success: false, error: error.message, errors: netlifyErrors, skipped: netlifySkipped };
    }
  }

  async autofixBuildIssues() {
    const fixes = [];

    if (!fs.existsSync('netlify.toml')) {
      const netlifyConfig = `[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

      fs.writeFileSync('netlify.toml', netlifyConfig);
      fixes.push('Created netlify.toml with Vite config');
      this.log('🔧 Auto-fix: Created netlify.toml', 'FIX');
    }

    if (fs.existsSync('package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (!pkg.scripts || !pkg.scripts.build) {
          pkg.scripts = pkg.scripts || {};
          pkg.scripts.build = 'vite build';
          fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
          fixes.push('Added build script to package.json');
          this.log('🔧 Auto-fix: Added build script to package.json', 'FIX');
        }
      } catch (error) {
        this.log(`Failed to auto-fix package.json: ${error.message}`, 'ERROR');
      }
    }

    return fixes;
  }

  async runMonitoringCycle() {
    try {
      this.log('🔄 Starting monitoring cycle');

      this.netlifyErrors = [];
      this.netlifySkipped = [];

      const repoStatus = await this.checkRepoStatus();
      const netlifyStatus = await this.checkNetlifyStatus();
      const dirChanges = await this.monitorDirectoryChanges();
      const fixes = await this.autofixBuildIssues();

      const monitorReport = {
        timestamp: new Date().toISOString(),
        github: repoStatus,
        netlify: netlifyStatus,
        directories: dirChanges,
        autoFixes: fixes,
        status: 'healthy'
      };

      fs.writeFileSync('logs/latest-monitor-report.json', JSON.stringify(monitorReport, null, 2));

      if (repoStatus.success && fixes.length > 0) {
        this.log(`🎯 Auto-fixes applied (${fixes.length}), triggering Netlify rebuild`, 'ACTION');
        await this.triggerNetlifyBuild(`Auto-fixes applied: ${fixes.join(', ')}`);
      }

      this.log(`✅ Monitoring cycle completed - GitHub: ${repoStatus.success ? 'OK' : 'FAIL'}, Netlify: ${netlifyStatus.success ? 'OK' : 'FAIL'}`);

      if (this.netlifyErrors.length > 0 || this.netlifySkipped.length > 0) {
        console.log('\n📋 AUTONOMOUS MONITOR - NETLIFY TRACKING:');
        if (this.netlifyErrors.length > 0) {
          console.log('❌ NETLIFY ERRORS:');
          this.netlifyErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
        }
        if (this.netlifySkipped.length > 0) {
          console.log('⏭️ NETLIFY SKIPPED:');
          this.netlifySkipped.forEach((skip, i) => console.log(`   ${i + 1}. ${skip}`));
        }
      }

    } catch (error) {
      this.log(`❌ Monitoring cycle failed: ${error.message}`, 'ERROR');
    }
  }

  startMonitoring() {
    this.log('🚀 Starting autonomous monitoring system');
    this.log(`📊 Monitoring interval: ${this.monitorInterval / 1000} seconds`);
    this.log('🎯 Monitoring: ToyParty → https://toyparty.netlify.app');

    setInterval(() => {
      if (this.monitoringActive) {
        this.runMonitoringCycle();
      }
    }, this.monitorInterval);

    setTimeout(() => this.runMonitoringCycle(), 2000);
  }

  async checkNetlifyStatus() {
    try {
      const response = await fetch(`https://api.netlify.com/api/v1/sites/${this.deploySiteId}`, {
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`
        }
      });

      if (response.status === 200 || response.status === 201 || response.ok) {
        const site = await response.json();
        return {
          success: true,
          name: site.name,
          url: site.ssl_url,
          deployState: site.published_deploy?.state || 'unknown',
          lastDeploy: site.published_deploy?.created_at,
          buildHook: site.build_hook_url
        };
      } else {
        throw new Error(`Netlify status check failed: ${response.status}`);
      }
    } catch (error) {
      this.log(`Netlify status check failed: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async monitorDirectoryChanges() {
    const watchDirs = ['/frontend', '/builder', '/src'];
    const changes = [];

    for (const dir of watchDirs) {
      if (fs.existsSync(`.${dir}`)) {
        try {
          const files = this.getDirectoryFiles(`.${dir}`);
          changes.push({
            directory: dir,
            fileCount: files.length,
            lastModified: this.getLastModified(files)
          });
        } catch (error) {
          this.log(`Error monitoring ${dir}: ${error.message}`, 'WARNING');
        }
      }
    }

    return changes;
  }

  getDirectoryFiles(dirPath) {
    const files = [];
    const scan = (currentPath) => {
      if (fs.existsSync(currentPath)) {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const item of items) {
          const fullPath = `${currentPath}/${item.name}`;
          if (item.isDirectory() && !item.name.startsWith('.')) {
            scan(fullPath);
          } else if (item.isFile()) {
            files.push(fullPath);
          }
        }
      }
    };
    scan(dirPath);
    return files;
  }

  getLastModified(files) {
    let latest = 0;
    for (const file of files) {
      try {
        const stats = fs.statSync(file);
        if (stats.mtime.getTime() > latest) {
          latest = stats.mtime.getTime();
        }
      } catch (error) {
        // Ignore file stat errors
      }
    }
    return latest;
  }

  logSyncAction(repo, status, details) {
    const timestamp = new Date().toISOString();
    const logEntry = `\n## ${timestamp} – AUTONOMOUS ACTION\n- Repo: ${repo}\n- Status: ${status}\n- Details: ${details}\n- Mode: GPT Engineer + DevOps Agent`;

    fs.mkdirSync('logs', { recursive: true });
    fs.appendFileSync('logs/audit-log.md', logEntry);
  }

  async handleRequest(action, params = {}) {
    switch (action) {
      case 'component-sync':
        return this.performSync('ToyParty', `🔁 Component sync: ${params.component}`);

      case 'builder-insert':
        this.logSyncAction('ToyParty', 'BUILDER_INSERT', params.block);
        return this.performSync('ToyParty', `🔁 Builder block: ${params.block}`);

      case 'health-check':
        return this.checkDeployHealth();

      case 'content-patch':
        return this.performSync('ToyParty', `🔁 Content patch: ${params.description}`);

      default:
        console.log(`❓ Unknown request: ${action}`);
        return { success: false, error: 'Unknown action' };
    }
  }

  setupAPI(app) {
    app.get('/monitor/status', (req, res) => {
      const status = {
        active: this.monitoringActive,
        interval: this.monitorInterval,
        lastBuild: this.lastBuildStatus,
        uptime: process.uptime(),
        logFiles: {
          monitor: fs.existsSync(this.logFile),
          builds: fs.existsSync(this.buildLogFile)
        }
      };

      res.json({
        success: true,
        monitoring: status,
        timestamp: new Date().toISOString()
      });
    });

    app.post('/monitor/rebuild', async (req, res) => {
      const reason = req.body.reason || 'Manual trigger via API';
      const result = await this.triggerNetlifyBuild(reason);

      res.json({
        success: result.success,
        message: result.success ? 'Netlify rebuild triggered' : 'Rebuild failed',
        buildId: result.buildId,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    });

    app.get('/monitor/report', (req, res) => {
      try {
        if (fs.existsSync('logs/latest-monitor-report.json')) {
          const report = JSON.parse(fs.readFileSync('logs/latest-monitor-report.json', 'utf8'));
          res.json({ success: true, report });
        } else {
          res.json({ success: false, message: 'No monitor report available yet' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }
}

module.exports = AutonomousMonitor;

// Auto-start if run directly
if (require.main === module) {
  const monitor = new AutonomousMonitor(
    process.env.GITHUB_TOKEN,
    process.env.NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_TOKEN,
    process.env.NETLIFY_API_ID,
    process.env.NETLIFY_SITE_ID
  );

  console.log('🚀 Starting Autonomous Monitor with Netlify integration...');
  console.log(`📊 Netlify Site ID: ${process.env.NETLIFY_SITE_ID ? 'Found' : 'Missing'}`);
  console.log(`🔑 Netlify Token: ${(process.env.NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_TOKEN) ? 'Found' : 'Missing'}`);

  monitor.start();

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Autonomous monitor stopping...');
    process.exit(0);
  });
}
