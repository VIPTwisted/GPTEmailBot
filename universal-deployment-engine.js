
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class UniversalDeploymentEngine {
  constructor() {
    this.baseDir = process.cwd();
    this.githubToken = this.getGitHubToken();
    this.config = this.initializeUniversalConfig();
    this.deploymentLog = [];
  }

  getGitHubToken() {
    const tokenSources = [
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_API_TOKEN,
      process.env.GH_TOKEN,
      process.env.GITHUB_PAT
    ];

    for (const token of tokenSources) {
      if (token && token.trim() && token !== 'undefined') {
        return token.trim();
      }
    }

    throw new Error("❌ CRITICAL: No GitHub token found in environment variables!");
  }

  initializeUniversalConfig() {
    // Detect current repository or create universal config
    const defaultConfig = {
      auto_discovery: true,
      universal_mode: true,
      deployment_rules: {
        sync_all_files: true,
        exclude_patterns: [
          'node_modules/**',
          '.git/**',
          '*.log',
          '.cache/**',
          '.tmp/**',
          'logs/**'
        ],
        auto_create_repos: true,
        force_sync: true
      },
      netlify_integration: {
        auto_deploy: true,
        clear_cache: true,
        premium_features: true
      }
    };

    // Try to load existing config or create new one
    const configPath = path.join(this.baseDir, 'deploy.json');
    if (fs.existsSync(configPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...existing };
      } catch (error) {
        console.log('⚠️ Invalid deploy.json, using universal config');
      }
    }

    return defaultConfig;
  }

  async discoverRepositoryContext() {
    console.log('🔍 DISCOVERING REPOSITORY CONTEXT...');
    
    const context = {
      repoName: null,
      repoOwner: null,
      branch: 'main',
      isGitRepo: false,
      hasNetlify: false,
      projectType: 'unknown'
    };

    // Check if we're in a git repository
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remoteUrl.match(/github\.com[/:](.*?)\/(.*?)(?:\.git)?$/);
      if (match) {
        context.repoOwner = match[1];
        context.repoName = match[2];
        context.isGitRepo = true;
      }
    } catch (error) {
      console.log('📁 Not a git repository, will initialize');
    }

    // Detect branch
    try {
      context.branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim() || 'main';
    } catch (error) {
      context.branch = 'main';
    }

    // Auto-detect repo name from directory if not git repo
    if (!context.repoName) {
      context.repoName = path.basename(this.baseDir);
      context.repoOwner = 'VIPTwisted'; // Default owner
    }

    // Detect project type
    if (fs.existsSync('package.json')) context.projectType = 'nodejs';
    if (fs.existsSync('requirements.txt')) context.projectType = 'python';
    if (fs.existsSync('index.html')) context.projectType = 'static';

    // Check for Netlify
    context.hasNetlify = fs.existsSync('netlify.toml') || process.env.NETLIFY_SITE_ID;

    console.log(`✅ Context: ${context.repoOwner}/${context.repoName} (${context.projectType})`);
    return context;
  }

  sanitizeForLogs(text) {
    if (!text) return text;
    return text
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '[GITHUB_TOKEN_REDACTED]')
      .replace(/github_pat_[a-zA-Z0-9_]{82}/g, '[GITHUB_PAT_REDACTED]')
      .replace(/:([a-zA-Z0-9_-]+)@github\.com/g, ':[TOKEN_REDACTED]@github.com');
  }

  run(cmd, options = {}) {
    try {
      const sanitizedCmd = this.sanitizeForLogs(cmd);
      console.log(`🔧 Running: ${sanitizedCmd}`);
      
      const result = execSync(cmd, { 
        stdio: "pipe", 
        encoding: "utf8",
        cwd: this.baseDir,
        ...options
      });
      return result;
    } catch (err) {
      const sanitizedCmd = this.sanitizeForLogs(cmd);
      const sanitizedError = this.sanitizeForLogs(err.message);
      console.error(`❌ Command failed: ${sanitizedCmd}`);
      console.error(`❌ Error: ${sanitizedError}`);
      throw new Error(`Command execution failed: ${sanitizedCmd}`);
    }
  }

  discoverFiles() {
    const files = [];
    const excludePatterns = this.config.deployment_rules.exclude_patterns;
    
    function shouldExclude(filePath) {
      return excludePatterns.some(pattern => {
        const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        return new RegExp(regexPattern).test(filePath);
      });
    }

    function scanDirectory(dir, depth = 0) {
      if (depth > 20) return; // Prevent infinite recursion
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          const relativePath = path.relative(process.cwd(), fullPath);
          
          if (item.isDirectory() && !shouldExclude(relativePath + '/')) {
            scanDirectory(fullPath, depth + 1);
          } else if (item.isFile() && !shouldExclude(relativePath)) {
            // Check file size (skip very large files)
            try {
              const stats = fs.statSync(fullPath);
              if (stats.size < 10 * 1024 * 1024) { // 10MB limit
                files.push(relativePath);
              }
            } catch (err) {
              console.log(`⚠️ Skipping ${relativePath}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Error scanning ${dir}: ${err.message}`);
      }
    }

    scanDirectory(this.baseDir);
    console.log(`📁 Discovered ${files.length} files for deployment`);
    return files;
  }

  async ensureRepository(context) {
    console.log(`🔧 ENSURING REPOSITORY: ${context.repoOwner}/${context.repoName}`);
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const checkResponse = await fetch(`https://api.github.com/repos/${context.repoOwner}/${context.repoName}`, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (checkResponse.status === 200) {
          console.log(`✅ Repository ${context.repoOwner}/${context.repoName} exists`);
          return true;
        }

        if (checkResponse.status === 404) {
          console.log(`📝 Creating repository ${context.repoOwner}/${context.repoName}...`);
          
          const createResponse = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
              'Authorization': `token ${this.githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: context.repoName,
              description: `🤖 Universal GPT Deployment: ${context.repoName}`,
              private: false,
              auto_init: false
            })
          });

          if (createResponse.ok) {
            console.log(`🎉 Repository created successfully!`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
          }
        }

        if (attempt < 3) {
          console.log(`⏳ Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} error: ${error.message}`);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw new Error(`Failed to ensure repository ${context.repoOwner}/${context.repoName}`);
  }

  async universalSync(context) {
    const startTime = Date.now();
    
    try {
      // Clean up any existing git locks
      this.cleanupGitLocks();
      
      // Discover files to sync
      const files = this.discoverFiles();
      if (!files.length) {
        throw new Error('No files found to sync');
      }

      // Ensure repository exists
      await this.ensureRepository(context);

      // Prepare git repository
      this.run('rm -rf .git');
      this.run(`git init --initial-branch=${context.branch}`);
      this.run(`git config user.email "gpt@autobot.ai"`);
      this.run(`git config user.name "Universal GPT Deployer"`);

      const remote = `https://${context.repoOwner}:${this.githubToken}@github.com/${context.repoOwner}/${context.repoName}.git`;
      this.run(`git remote add origin ${remote}`);

      // Add files in batches
      const batchSize = 100;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const existingFiles = batch.filter(file => fs.existsSync(file));
        
        if (existingFiles.length > 0) {
          const fileList = existingFiles.map(f => `"${f}"`).join(' ');
          this.run(`git add -f ${fileList}`);
          console.log(`📦 Added batch ${Math.floor(i/batchSize) + 1}: ${existingFiles.length} files`);
        }
      }

      // Create commit message
      const commitMessage = `🚀 UNIVERSAL GPT DEPLOYMENT

📊 DEPLOYMENT DETAILS:
- Files synchronized: ${files.length}
- Repository: ${context.repoOwner}/${context.repoName}
- Branch: ${context.branch}
- Project Type: ${context.projectType}
- Timestamp: ${new Date().toISOString()}
- Universal Deployment Engine v2.0

🔧 CHANGES INCLUDED:
${files.slice(0, 10).map(file => `- ${file}`).join('\n')}${files.length > 10 ? `\n- ... and ${files.length - 10} more files` : ''}

✅ 100% Universal - Works on any repository!`;

      this.run(`git commit -m "${commitMessage}"`);
      
      // Get commit SHA
      const sha = this.run('git rev-parse HEAD').trim();
      
      // Push to repository
      this.run(`git push -u origin ${context.branch} --force`);

      const duration = Date.now() - startTime;
      console.log(`✅ UNIVERSAL SYNC SUCCESS: ${context.repoOwner}/${context.repoName} (${duration}ms)`);

      return {
        success: true,
        sha: sha,
        files: files.length,
        duration: duration,
        repo: `${context.repoOwner}/${context.repoName}`
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ UNIVERSAL SYNC FAILED: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        duration: duration,
        repo: `${context.repoOwner}/${context.repoName}`
      };
    }
  }

  cleanupGitLocks() {
    const lockFiles = ['.git/index.lock', '.git/config.lock', '.git/HEAD.lock'];
    lockFiles.forEach(lockFile => {
      if (fs.existsSync(lockFile)) {
        try {
          fs.unlinkSync(lockFile);
          console.log(`🧹 Removed git lock: ${lockFile}`);
        } catch (error) {
          console.log(`⚠️ Could not remove ${lockFile}: ${error.message}`);
        }
      }
    });
  }

  async triggerNetlifyDeploy(context, sha) {
    if (!context.hasNetlify) return;

    try {
      const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
      const netlifySiteId = process.env.NETLIFY_SITE_ID;
      
      if (!netlifyToken || !netlifySiteId) {
        console.log('⚠️ Netlify credentials not found, skipping deploy');
        return;
      }

      console.log('🚀 Triggering Netlify deployment...');

      const response = await fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}/builds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clear_cache: true
        })
      });

      if (response.ok) {
        const buildData = await response.json();
        console.log(`✅ Netlify build triggered: ${buildData.id}`);
      } else {
        console.log(`❌ Netlify deployment failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Netlify deployment error: ${error.message}`);
    }
  }

  async deployUniversal() {
    console.log('\n🚀 UNIVERSAL DEPLOYMENT ENGINE STARTING...');
    console.log('=' .repeat(60));
    
    try {
      // Discover repository context
      const context = await this.discoverRepositoryContext();
      
      // Perform universal sync
      const syncResult = await this.universalSync(context);
      
      if (syncResult.success) {
        // Trigger Netlify if available
        if (context.hasNetlify) {
          setTimeout(() => this.triggerNetlifyDeploy(context, syncResult.sha), 3000);
        }
        
        console.log('\n🎉 UNIVERSAL DEPLOYMENT COMPLETED!');
        console.log('=' .repeat(60));
        console.log(`✅ Repository: ${syncResult.repo}`);
        console.log(`✅ Files: ${syncResult.files}`);
        console.log(`✅ SHA: ${syncResult.sha.substring(0, 7)}`);
        console.log(`✅ Duration: ${syncResult.duration}ms`);
        console.log('✅ Ready for any repository!');
        
        return syncResult;
      } else {
        throw new Error(syncResult.error);
      }
      
    } catch (error) {
      console.error('\n❌ UNIVERSAL DEPLOYMENT FAILED!');
      console.error('=' .repeat(60));
      console.error(`❌ Error: ${error.message}`);
      throw error;
    }
  }
}

// Universal CLI interface
if (require.main === module) {
  const engine = new UniversalDeploymentEngine();
  
  engine.deployUniversal()
    .then(result => {
      console.log('\n🎯 MISSION ACCOMPLISHED!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 MISSION FAILED!');
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = UniversalDeploymentEngine;
