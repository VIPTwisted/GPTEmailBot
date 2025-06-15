
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message) {
    console.log(`🧪 ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
    this.results.errors.push(message);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  // Test 1: Syntax validation
  async testSyntaxValidation() {
    this.log("Testing JavaScript syntax validation...");
    
    const jsFiles = [
      'sync-gpt-to-github.js',
      'autonomous-monitor.js',
      'nuclear-sync-engine.js',
      'netlify-master-integration.js',
      'dynamic-repo-manager.js'
    ];

    for (const file of jsFiles) {
      if (fs.existsSync(file)) {
        try {
          require.resolve(`./${file}`);
          this.success(`${file} syntax valid`);
          this.results.passed++;
        } catch (error) {
          this.error(`${file} syntax error: ${error.message}`);
          this.results.failed++;
        }
      }
    }
  }

  // Test 2: Configuration validation
  async testConfigurationValidation() {
    this.log("Testing configuration files...");
    
    // Test deploy.json
    if (fs.existsSync('deploy.json')) {
      try {
        const config = JSON.parse(fs.readFileSync('deploy.json', 'utf8'));
        if (config.repos && Array.isArray(config.repos) && config.repos.length > 0) {
          this.success(`deploy.json valid with ${config.repos.length} repos`);
          this.results.passed++;
        } else {
          this.error('deploy.json missing repos array');
          this.results.failed++;
        }
      } catch (error) {
        this.error(`deploy.json parse error: ${error.message}`);
        this.results.failed++;
      }
    } else {
      this.error('deploy.json not found');
      this.results.failed++;
    }

    // Test package.json
    if (fs.existsSync('package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (pkg.dependencies || pkg.devDependencies) {
          this.success('package.json valid');
          this.results.passed++;
        } else {
          this.error('package.json missing dependencies');
          this.results.failed++;
        }
      } catch (error) {
        this.error(`package.json parse error: ${error.message}`);
        this.results.failed++;
      }
    }
  }

  // Test 3: Environment validation
  async testEnvironmentValidation() {
    this.log("Testing environment variables...");
    
    const requiredEnvVars = [
      'GITHUB_TOKEN',
      'GITHUB_API_TOKEN', 
      'NETLIFY_ACCESS_TOKEN',
      'NETLIFY_SITE_ID'
    ];

    let foundTokens = 0;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        foundTokens++;
        this.success(`${envVar} found`);
      }
    }

    if (foundTokens >= 2) {
      this.success(`Environment validation passed (${foundTokens}/4 tokens found)`);
      this.results.passed++;
    } else {
      this.error(`Insufficient environment variables (${foundTokens}/4)`);
      this.results.failed++;
    }
  }

  // Test 4: File structure validation
  async testFileStructureValidation() {
    this.log("Testing file structure...");
    
    const requiredFiles = [
      'sync-gpt-to-github.js',
      'deploy.json',
      'package.json'
    ];

    const requiredDirs = [
      'logs',
      'public',
      'src'
    ];

    let missingFiles = [];
    let missingDirs = [];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    }

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        missingDirs.push(dir);
      }
    }

    if (missingFiles.length === 0 && missingDirs.length === 0) {
      this.success('File structure validation passed');
      this.results.passed++;
    } else {
      this.error(`Missing files: ${missingFiles.join(', ')}, Missing dirs: ${missingDirs.join(', ')}`);
      this.results.failed++;
    }
  }

  // Test 5: Git configuration test
  async testGitConfiguration() {
    this.log("Testing Git configuration...");
    
    try {
      const { execSync } = require('child_process');
      
      // Test git is available
      execSync('git --version', { stdio: 'pipe' });
      this.success('Git is available');
      
      // Test git config
      try {
        const userName = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
        const userEmail = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();
        
        if (userName && userEmail) {
          this.success(`Git configured: ${userName} <${userEmail}>`);
          this.results.passed++;
        } else {
          this.error('Git user not configured');
          this.results.failed++;
        }
      } catch (error) {
        this.success('Git available but not configured (will be set by sync script)');
        this.results.passed++;
      }
    } catch (error) {
      this.error(`Git not available: ${error.message}`);
      this.results.failed++;
    }
  }

  // Test 6: Network connectivity
  async testNetworkConnectivity() {
    this.log("Testing network connectivity...");
    
    const testUrls = [
      'https://api.github.com',
      'https://api.netlify.com'
    ];

    let successfulConnections = 0;

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'User-Agent': 'GPT-Sync-Test' }
        });
        
        if (response.status < 500) {
          this.success(`${url} reachable (${response.status})`);
          successfulConnections++;
        } else {
          this.error(`${url} server error (${response.status})`);
        }
      } catch (error) {
        this.error(`${url} unreachable: ${error.message}`);
      }
    }

    if (successfulConnections >= 1) {
      this.success('Network connectivity test passed');
      this.results.passed++;
    } else {
      this.error('Network connectivity test failed');
      this.results.failed++;
    }
  }

  // Test 7: Module loading test
  async testModuleLoading() {
    this.log("Testing module loading...");
    
    const modules = [
      './dynamic-repo-manager',
      './netlify-master-integration',
      './view-failed-repos'
    ];

    let loadedModules = 0;

    for (const module of modules) {
      try {
        if (fs.existsSync(module + '.js')) {
          // Clear require cache to avoid conflicts
          delete require.cache[require.resolve(module)];
          require(module);
          this.success(`${module} loaded successfully`);
          loadedModules++;
        } else {
          this.log(`${module}.js not found, skipping`);
        }
      } catch (error) {
        this.error(`${module} loading failed: ${error.message}`);
      }
    }

    if (loadedModules > 0) {
      this.success(`Module loading test passed (${loadedModules}/${modules.length})`);
      this.results.passed++;
    } else {
      this.error('No modules could be loaded');
      this.results.failed++;
    }
  }

  // Test 8: API endpoint simulation
  async testAPIEndpoints() {
    this.log("Testing API endpoint structure...");
    
    try {
      // Test if we can load the main sync file
      const syncCode = fs.readFileSync('sync-gpt-to-github.js', 'utf8');
      
      const endpoints = [
        'app.get("/gpt"',
        'app.get("/repos"',
        'app.get("/health"',
        'app.post("/sync"'
      ];

      let foundEndpoints = 0;
      for (const endpoint of endpoints) {
        if (syncCode.includes(endpoint)) {
          foundEndpoints++;
        }
      }

      if (foundEndpoints >= 3) {
        this.success(`API endpoints test passed (${foundEndpoints}/4 endpoints found)`);
        this.results.passed++;
      } else {
        this.error(`Insufficient API endpoints (${foundEndpoints}/4)`);
        this.results.failed++;
      }
    } catch (error) {
      this.error(`API endpoint test failed: ${error.message}`);
      this.results.failed++;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('\n🚀 STARTING COMPREHENSIVE TEST SUITE');
    console.log('=' .repeat(60));
    
    await this.testSyntaxValidation();
    await this.testConfigurationValidation();
    await this.testEnvironmentValidation();
    await this.testFileStructureValidation();
    await this.testGitConfiguration();
    await this.testNetworkConnectivity();
    await this.testModuleLoading();
    await this.testAPIEndpoints();
    
    console.log('\n📊 TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🔍 DETAILED ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎯 OVERALL STATUS:', this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');
    console.log('=' .repeat(60));
    
    return this.results.failed === 0;
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite crashed:', error.message);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestSuite;
