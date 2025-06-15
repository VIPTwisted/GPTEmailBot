
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getGitHubToken } = require('./universal-secret-loader.js');

class AdvancedMultiProjectManager {
  constructor() {
    this.projects = new Map();
    this.deployConfig = this.loadDeployConfig();
    this.githubToken = getGitHubToken();
    this.projectTypes = {
      'web': { ports: [3000, 5000, 8080], frameworks: ['react', 'vue', 'angular', 'vanilla'] },
      'api': { ports: [3001, 4000, 8081], frameworks: ['express', 'fastapi', 'django', 'flask'] },
      'mobile': { ports: [3002, 19000], frameworks: ['react-native', 'ionic', 'cordova'] },
      'desktop': { ports: [3003], frameworks: ['electron', 'tauri', 'flutter'] },
      'ai': { ports: [3004, 8888], frameworks: ['tensorflow', 'pytorch', 'huggingface'] },
      'blockchain': { ports: [3005, 8545], frameworks: ['web3', 'ethers', 'hardhat'] },
      'game': { ports: [3006, 7777], frameworks: ['unity', 'godot', 'phaser'] },
      'iot': { ports: [3007, 1883], frameworks: ['arduino', 'raspberry-pi', 'mqtt'] }
    };
  }

  loadDeployConfig() {
    if (fs.existsSync('deploy.json')) {
      return JSON.parse(fs.readFileSync('deploy.json', 'utf8'));
    }
    return { repos: [], default_repo: null, auto_create_repos: true };
  }

  // 🔍 AUTO-DISCOVER ALL POSSIBLE PROJECTS
  async discoverAllProjects() {
    console.log('🔍 DISCOVERING ALL PROJECTS IN WORKSPACE...');
    
    const discoveredProjects = [];
    
    // Scan current directory and subdirectories
    const projectIndicators = [
      { file: 'package.json', type: 'web', language: 'javascript' },
      { file: 'requirements.txt', type: 'api', language: 'python' },
      { file: 'pom.xml', type: 'api', language: 'java' },
      { file: 'Cargo.toml', type: 'api', language: 'rust' },
      { file: 'go.mod', type: 'api', language: 'go' },
      { file: 'composer.json', type: 'web', language: 'php' },
      { file: 'Gemfile', type: 'web', language: 'ruby' },
      { file: 'setup.py', type: 'api', language: 'python' },
      { file: 'index.html', type: 'web', language: 'html' },
      { file: 'main.py', type: 'api', language: 'python' },
      { file: 'index.js', type: 'web', language: 'javascript' },
      { file: 'app.py', type: 'api', language: 'python' },
      { file: 'server.js', type: 'api', language: 'javascript' },
      { file: 'main.js', type: 'web', language: 'javascript' }
    ];

    const directories = this.scanDirectories();
    
    for (const dir of directories) {
      for (const indicator of projectIndicators) {
        const filePath = path.join(dir, indicator.file);
        if (fs.existsSync(filePath)) {
          const projectName = this.generateProjectName(dir, indicator);
          
          discoveredProjects.push({
            name: projectName,
            path: dir,
            type: indicator.type,
            language: indicator.language,
            mainFile: indicator.file,
            repo_owner: 'VIPTwisted',
            repo_name: projectName,
            branch: 'main',
            username: 'VIPTwisted',
            gpt_id: this.generateGptId(projectName),
            aliases: this.generateAliases(projectName, indicator.type),
            port: this.assignPort(indicator.type),
            discovered: true,
            auto_created: true
          });
          break; // Only one indicator per directory
        }
      }
    }

    // Add domain-specific projects
    const domainProjects = this.generateDomainProjects();
    discoveredProjects.push(...domainProjects);

    console.log(`✅ DISCOVERED ${discoveredProjects.length} PROJECTS`);
    return discoveredProjects;
  }

  scanDirectories() {
    const directories = ['.'];
    const excludeDirs = ['.git', 'node_modules', '.cache', '.replit', 'logs', 'attached_assets'];
    
    function scanRecursive(dir, depth = 0) {
      if (depth > 3) return; // Limit recursion depth
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          if (item.isDirectory() && !excludeDirs.includes(item.name) && !item.name.startsWith('.')) {
            const fullPath = path.join(dir, item.name);
            directories.push(fullPath);
            scanRecursive(fullPath, depth + 1);
          }
        }
      } catch (err) {
        // Ignore access errors
      }
    }
    
    scanRecursive('.');
    return directories;
  }

  generateDomainProjects() {
    const domains = [
      // E-commerce & Business
      { name: 'EcommerceStore', type: 'web', language: 'javascript', description: 'Main e-commerce storefront' },
      { name: 'AdminDashboard', type: 'web', language: 'javascript', description: 'Business admin panel' },
      { name: 'InventoryAPI', type: 'api', language: 'python', description: 'Inventory management API' },
      { name: 'PaymentProcessor', type: 'api', language: 'javascript', description: 'Payment processing service' },
      
      // Marketing & SEO
      { name: 'SEOAnalyzer', type: 'web', language: 'javascript', description: 'SEO analysis tool' },
      { name: 'ContentGenerator', type: 'api', language: 'python', description: 'AI content generation' },
      { name: 'SocialMediaBot', type: 'api', language: 'python', description: 'Social media automation' },
      { name: 'MarketingAutomation', type: 'web', language: 'javascript', description: 'Marketing campaign manager' },
      
      // AI & Analytics
      { name: 'AIAssistant', type: 'ai', language: 'python', description: 'AI assistant service' },
      { name: 'AnalyticsDashboard', type: 'web', language: 'javascript', description: 'Business analytics' },
      { name: 'DataProcessor', type: 'api', language: 'python', description: 'Data processing pipeline' },
      { name: 'MLModelAPI', type: 'ai', language: 'python', description: 'Machine learning models' },
      
      // Mobile & Desktop
      { name: 'MobileApp', type: 'mobile', language: 'javascript', description: 'Mobile application' },
      { name: 'DesktopClient', type: 'desktop', language: 'javascript', description: 'Desktop application' },
      
      // Gaming & Entertainment
      { name: 'GamePlatform', type: 'game', language: 'javascript', description: 'Gaming platform' },
      { name: 'StreamingService', type: 'web', language: 'javascript', description: 'Video streaming' },
      
      // IoT & Hardware
      { name: 'IoTDashboard', type: 'iot', language: 'python', description: 'IoT device management' },
      { name: 'HardwareAPI', type: 'api', language: 'python', description: 'Hardware control API' },
      
      // Blockchain & Crypto
      { name: 'CryptoTrader', type: 'blockchain', language: 'javascript', description: 'Cryptocurrency trading' },
      { name: 'NFTMarketplace', type: 'web', language: 'javascript', description: 'NFT trading platform' }
    ];

    return domains.map(domain => ({
      name: domain.name,
      path: './projects/' + domain.name.toLowerCase(),
      type: domain.type,
      language: domain.language,
      description: domain.description,
      repo_owner: 'VIPTwisted',
      repo_name: domain.name,
      branch: 'main',
      username: 'VIPTwisted',
      gpt_id: domain.name,
      aliases: this.generateAliases(domain.name, domain.type),
      port: this.assignPort(domain.type),
      domain: true,
      auto_created: true
    }));
  }

  generateProjectName(dir, indicator) {
    const baseName = dir === '.' ? 'MainProject' : path.basename(dir);
    const cleaned = baseName.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  generateGptId(projectName) {
    return projectName.replace(/[^a-zA-Z0-9]/g, '');
  }

  generateAliases(projectName, type) {
    const aliases = [projectName.toLowerCase()];
    
    // Add type-based aliases
    const typeAliases = {
      'web': ['frontend', 'ui', 'website', 'client'],
      'api': ['backend', 'server', 'service', 'api'],
      'mobile': ['app', 'mobile', 'ios', 'android'],
      'desktop': ['desktop', 'electron', 'native'],
      'ai': ['ai', 'ml', 'artificial', 'intelligence'],
      'blockchain': ['crypto', 'blockchain', 'web3', 'defi'],
      'game': ['game', 'gaming', 'entertainment'],
      'iot': ['iot', 'hardware', 'sensors', 'devices']
    };

    if (typeAliases[type]) {
      aliases.push(...typeAliases[type]);
    }

    return [...new Set(aliases)];
  }

  assignPort(type) {
    const typeConfig = this.projectTypes[type];
    if (typeConfig && typeConfig.ports.length > 0) {
      return typeConfig.ports[0];
    }
    return 3000; // Default port
  }

  // 🚀 CREATE MISSING PROJECT REPOSITORIES
  async createMissingRepositories(projects) {
    console.log('🚀 CREATING MISSING REPOSITORIES...');
    
    const createdRepos = [];
    
    for (const project of projects) {
      try {
        const exists = await this.checkRepositoryExists(project.repo_name);
        
        if (!exists) {
          const created = await this.createRepository(project);
          if (created) {
            createdRepos.push(project);
            console.log(`✅ Created repository: ${project.repo_name}`);
          }
        } else {
          console.log(`⚠️  Repository already exists: ${project.repo_name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create repository ${project.repo_name}:`, error.message);
      }
    }
    
    return createdRepos;
  }

  async checkRepositoryExists(repoName) {
    try {
      const result = execSync(`curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token ${this.githubToken}" https://api.github.com/repos/VIPTwisted/${repoName}`, { encoding: 'utf8' });
      return result.trim() === '200';
    } catch (error) {
      return false;
    }
  }

  async createRepository(project) {
    try {
      const repoData = {
        name: project.repo_name,
        description: `${project.type.toUpperCase()} project: ${project.description || project.name}`,
        private: false,
        auto_init: true,
        gitignore_template: this.getGitignoreTemplate(project.language),
        license_template: 'mit'
      };

      const command = `curl -X POST -H "Authorization: token ${this.githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(repoData)}' https://api.github.com/user/repos`;
      const result = execSync(command, { encoding: 'utf8' });
      
      const response = JSON.parse(result);
      return response.id ? true : false;
    } catch (error) {
      console.error(`❌ Repository creation failed:`, error.message);
      return false;
    }
  }

  getGitignoreTemplate(language) {
    const templates = {
      'javascript': 'Node',
      'python': 'Python',
      'java': 'Java',
      'rust': 'Rust',
      'go': 'Go',
      'php': 'PHP',
      'ruby': 'Ruby',
      'html': 'Web'
    };
    return templates[language] || 'Node';
  }

  // 🔄 UPDATE DEPLOY CONFIGURATION
  async updateDeployConfiguration(allProjects) {
    console.log('🔄 UPDATING DEPLOY CONFIGURATION...');
    
    const updatedConfig = {
      repos: allProjects.map(project => ({
        repo_owner: project.repo_owner,
        repo_name: project.repo_name,
        branch: project.branch,
        username: project.username,
        gpt_id: project.gpt_id,
        aliases: project.aliases,
        type: project.type,
        language: project.language,
        port: project.port,
        path: project.path,
        auto_created: project.auto_created || false,
        description: project.description || `${project.type} project`
      })),
      default_repo: allProjects[0]?.repo_name || 'ToyParty',
      auto_create_repos: true,
      total_projects: allProjects.length,
      project_types: Object.keys(this.projectTypes),
      last_updated: new Date().toISOString(),
      multi_project_support: {
        enabled: true,
        auto_discovery: true,
        max_projects: 'unlimited',
        supported_languages: ['javascript', 'python', 'java', 'rust', 'go', 'php', 'ruby', 'html'],
        supported_types: Object.keys(this.projectTypes)
      }
    };

    fs.writeFileSync('deploy.json', JSON.stringify(updatedConfig, null, 2));
    console.log(`✅ Updated deploy.json with ${allProjects.length} projects`);
  }

  // 🎯 SMART PROJECT FINDER
  findProject(searchTerm) {
    const projects = this.deployConfig.repos || [];
    const term = searchTerm.toLowerCase();
    
    // Try exact match first
    let project = projects.find(p => p.repo_name.toLowerCase() === term || p.gpt_id?.toLowerCase() === term);
    if (project) return project;
    
    // Try alias match
    project = projects.find(p => p.aliases?.some(alias => alias.toLowerCase() === term));
    if (project) return project;
    
    // Try partial match
    project = projects.find(p => 
      p.repo_name.toLowerCase().includes(term) || 
      term.includes(p.repo_name.toLowerCase()) ||
      p.type?.toLowerCase() === term ||
      p.language?.toLowerCase() === term
    );
    
    return project;
  }

  // 🚀 DEPLOY SPECIFIC PROJECT
  async deployProject(projectName) {
    const project = this.findProject(projectName);
    
    if (!project) {
      throw new Error(`Project '${projectName}' not found. Available projects: ${this.deployConfig.repos?.map(r => r.repo_name).join(', ')}`);
    }

    const { syncSpecificRepo } = require('./sync-gpt-to-github');
    const result = await syncSpecificRepo(project.repo_name);
    
    return {
      success: result.success,
      project: project.repo_name,
      type: project.type,
      language: project.language,
      error: result.error
    };
  }

  // 🔄 DEPLOY ALL PROJECTS
  async deployAllProjects() {
    const projects = this.deployConfig.repos || [];
    const results = [];
    
    console.log(`🚀 DEPLOYING ${projects.length} PROJECTS...`);
    
    for (const project of projects) {
      try {
        const result = await this.deployProject(project.repo_name);
        results.push(result);
        console.log(`${result.success ? '✅' : '❌'} ${project.repo_name}: ${result.success ? 'SUCCESS' : result.error}`);
      } catch (error) {
        results.push({ success: false, project: project.repo_name, error: error.message });
        console.error(`❌ ${project.repo_name}: ${error.message}`);
      }
      
      // Delay between deployments
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n🎯 DEPLOYMENT COMPLETE: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, results };
  }

  // 🎛️ GENERATE PROJECT DASHBOARD
  generateProjectDashboard() {
    const projects = this.deployConfig.repos || [];
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Multi-Project Manager</title>
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
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }
        .project-card {
            background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s ease;
        }
        .project-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            border-color: #ff6b35;
        }
        .project-type {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .type-web { background: #00ff88; color: #000; }
        .type-api { background: #ff6b35; color: #fff; }
        .type-mobile { background: #667eea; color: #fff; }
        .type-ai { background: #f093fb; color: #000; }
        .type-game { background: #4facfe; color: #fff; }
        .type-blockchain { background: #ffd700; color: #000; }
        .project-name { font-size: 1.4em; font-weight: bold; margin-bottom: 10px; }
        .project-details { opacity: 0.8; margin-bottom: 15px; }
        .deploy-button {
            background: linear-gradient(45deg, #00ff88, #00cc66);
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            margin: 5px;
        }
        .deploy-button:hover { transform: scale(1.05); }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .stat-card {
            background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-value { font-size: 2em; font-weight: bold; color: #00ff88; }
        .actions { text-align: center; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 MULTI-PROJECT MANAGER</h1>
        <p>Advanced project management for unlimited repositories</p>
    </div>

    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${projects.length}</div>
                <div>Total Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${[...new Set(projects.map(p => p.type))].length}</div>
                <div>Project Types</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${[...new Set(projects.map(p => p.language))].length}</div>
                <div>Languages</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">∞</div>
                <div>Max Capacity</div>
            </div>
        </div>

        <div class="actions">
            <button class="deploy-button" onclick="deployAll()">🚀 Deploy All Projects</button>
            <button class="deploy-button" onclick="discoverNew()">🔍 Discover New Projects</button>
            <button class="deploy-button" onclick="createProject()">➕ Create New Project</button>
        </div>

        <div class="projects-grid">
            ${projects.map(project => `
                <div class="project-card">
                    <div class="project-type type-${project.type}">${project.type?.toUpperCase() || 'UNKNOWN'}</div>
                    <div class="project-name">${project.repo_name}</div>
                    <div class="project-details">
                        <div>Language: ${project.language?.toUpperCase() || 'N/A'}</div>
                        <div>Port: ${project.port || 'Auto'}</div>
                        <div>Aliases: ${project.aliases?.join(', ') || 'None'}</div>
                    </div>
                    <button class="deploy-button" onclick="deployProject('${project.repo_name}')">
                        🚀 Deploy ${project.repo_name}
                    </button>
                    <button class="deploy-button" onclick="viewProject('${project.repo_name}')">
                        👁️ View Repository
                    </button>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        async function deployProject(projectName) {
            console.log('Deploying project:', projectName);
            try {
                const response = await fetch('/api/deploy/' + projectName, { method: 'POST' });
                const result = await response.json();
                alert(result.success ? 'Deployment successful!' : 'Deployment failed: ' + result.error);
            } catch (error) {
                alert('Deployment error: ' + error.message);
            }
        }

        async function deployAll() {
            if (confirm('Deploy all ${projects.length} projects? This may take a while.')) {
                console.log('Deploying all projects...');
                try {
                    const response = await fetch('/api/deploy-all', { method: 'POST' });
                    const result = await response.json();
                    alert(\`Deployment complete: \${result.successful} successful, \${result.failed} failed\`);
                } catch (error) {
                    alert('Deployment error: ' + error.message);
                }
            }
        }

        async function discoverNew() {
            console.log('Discovering new projects...');
            try {
                const response = await fetch('/api/discover', { method: 'POST' });
                const result = await response.json();
                alert(\`Discovery complete: \${result.discovered} new projects found\`);
                location.reload();
            } catch (error) {
                alert('Discovery error: ' + error.message);
            }
        }

        function createProject() {
            const name = prompt('Enter project name:');
            const type = prompt('Enter project type (web/api/mobile/ai/game/blockchain):');
            if (name && type) {
                fetch('/api/create-project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type })
                }).then(response => response.json())
                  .then(result => {
                      alert(result.success ? 'Project created!' : 'Error: ' + result.error);
                      if (result.success) location.reload();
                  });
            }
        }

        function viewProject(projectName) {
            window.open(\`https://github.com/VIPTwisted/\${projectName}\`, '_blank');
        }
    </script>
</body>
</html>
    `;
  }

  // 🎯 MAIN EXECUTION METHOD
  async executeFullMultiProjectSetup() {
    console.log('\n🚀 ═══ ADVANCED MULTI-PROJECT SETUP ═══');
    
    try {
      // Step 1: Discover all projects
      const discoveredProjects = await this.discoverAllProjects();
      
      // Step 2: Create missing repositories
      const createdRepos = await this.createMissingRepositories(discoveredProjects);
      
      // Step 3: Update deploy configuration
      await this.updateDeployConfiguration(discoveredProjects);
      
      // Step 4: Generate project dashboard
      const dashboard = this.generateProjectDashboard();
      fs.writeFileSync('public/multi-project-dashboard.html', dashboard);
      
      console.log('\n✅ ═══ MULTI-PROJECT SETUP COMPLETE ═══');
      console.log(`📊 Total Projects: ${discoveredProjects.length}`);
      console.log(`🆕 New Repositories: ${createdRepos.length}`);
      console.log(`🌐 Dashboard: /multi-project-dashboard.html`);
      
      return {
        success: true,
        totalProjects: discoveredProjects.length,
        newRepositories: createdRepos.length,
        projectTypes: [...new Set(discoveredProjects.map(p => p.type))],
        languages: [...new Set(discoveredProjects.map(p => p.language))]
      };
      
    } catch (error) {
      console.error('❌ Multi-project setup failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AdvancedMultiProjectManager;

// 🚀 AUTO-EXECUTE: Set up multi-project management
if (require.main === module) {
  const manager = new AdvancedMultiProjectManager();
  
  manager.executeFullMultiProjectSetup()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 MULTI-PROJECT SYSTEM READY!');
        console.log(`🚀 Managing ${result.totalProjects} projects across ${result.projectTypes.length} types`);
        console.log('💪 System can handle UNLIMITED projects of ANY type!');
      } else {
        console.error('\n❌ Setup failed:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Critical error:', error.message);
      process.exit(1);
    });
}
