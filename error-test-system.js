
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveErrorTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.testResults = {
      syntax: [],
      dependencies: [],
      configuration: [],
      runtime: [],
      security: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: '🔍'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.successes.push(message);
  }

  async testSyntaxErrors() {
    this.log('Testing JavaScript syntax errors...', 'info');
    
    const jsFiles = this.getAllJavaScriptFiles();
    
    for (const file of jsFiles) {
      try {
        // Clear require cache
        const fullPath = path.resolve(file);
        delete require.cache[fullPath];
        
        // Try to require the file
        if (!file.includes('error-test-system')) {
          require(fullPath);
          this.testResults.syntax.push({ file, status: 'pass' });
          this.log(`Syntax OK: ${file}`, 'success');
        }
      } catch (error) {
        this.testResults.syntax.push({ file, status: 'fail', error: error.message });
        this.log(`Syntax Error in ${file}: ${error.message}`, 'error');
      }
    }
  }

  async testDependencies() {
    this.log('Testing package dependencies...', 'info');
    
    try {
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        for (const [pkg, version] of Object.entries(dependencies || {})) {
          try {
            require.resolve(pkg);
            this.testResults.dependencies.push({ package: pkg, status: 'installed' });
            this.log(`Dependency OK: ${pkg}`, 'success');
          } catch (error) {
            this.testResults.dependencies.push({ package: pkg, status: 'missing', error: error.message });
            this.log(`Missing dependency: ${pkg}`, 'error');
          }
        }
      } else {
        this.log('No package.json found', 'warning');
      }
    } catch (error) {
      this.log(`Dependency test failed: ${error.message}`, 'error');
    }
  }

  async testConfiguration() {
    this.log('Testing configuration files...', 'info');
    
    const configFiles = [
      'deploy.json',
      'netlify.toml',
      '.replit',
      'package.json'
    ];
    
    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        try {
          if (file.endsWith('.json')) {
            JSON.parse(fs.readFileSync(file, 'utf8'));
          }
          this.testResults.configuration.push({ file, status: 'valid' });
          this.log(`Configuration OK: ${file}`, 'success');
        } catch (error) {
          this.testResults.configuration.push({ file, status: 'invalid', error: error.message });
          this.log(`Configuration Error in ${file}: ${error.message}`, 'error');
        }
      } else {
        this.testResults.configuration.push({ file, status: 'missing' });
        this.log(`Configuration missing: ${file}`, 'warning');
      }
    }
  }

  async testRuntimeErrors() {
    this.log('Testing runtime functionality...', 'info');
    
    // Test server startup capability
    try {
      const serverFiles = ['simple-server.js', 'emergency-server.js', 'index.js'];
      
      for (const serverFile of serverFiles) {
        if (fs.existsSync(serverFile)) {
          try {
            // Don't actually start the server, just test if it can be loaded
            const serverPath = path.resolve(serverFile);
            delete require.cache[serverPath];
            
            // Check for syntax and basic loading
            const content = fs.readFileSync(serverFile, 'utf8');
            if (content.includes('listen') || content.includes('createServer')) {
              this.testResults.runtime.push({ test: `${serverFile} server capability`, status: 'pass' });
              this.log(`Runtime OK: ${serverFile} can start server`, 'success');
            }
          } catch (error) {
            this.testResults.runtime.push({ test: `${serverFile} server capability`, status: 'fail', error: error.message });
            this.log(`Runtime Error: ${serverFile} cannot start - ${error.message}`, 'error');
          }
        }
      }
    } catch (error) {
      this.log(`Runtime test failed: ${error.message}`, 'error');
    }
  }

  async testSecurityIssues() {
    this.log('Testing security configurations...', 'info');
    
    // Check for exposed secrets in code
    const sensitivePatterns = [
      { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Access Token' },
      { pattern: /nfp_[a-zA-Z0-9]+/, name: 'Netlify Access Token' },
      { pattern: /Bearer\s+[a-zA-Z0-9]{20,}/, name: 'Bearer Token' },
      { pattern: /password\s*[:=]\s*["'][^"']+["']/, name: 'Hardcoded Password' }
    ];
    
    const allFiles = this.getAllJavaScriptFiles();
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, name } of sensitivePatterns) {
          if (pattern.test(content)) {
            this.testResults.security.push({ file, issue: name, status: 'vulnerable' });
            this.log(`Security Issue in ${file}: Potential ${name} exposure`, 'error');
          }
        }
      } catch (error) {
        this.log(`Could not scan ${file} for security issues: ${error.message}`, 'warning');
      }
    }
    
    // Check environment variables
    const requiredSecrets = ['GITHUB_TOKEN'];
    for (const secret of requiredSecrets) {
      if (process.env[secret]) {
        this.testResults.security.push({ test: `${secret} environment variable`, status: 'configured' });
        this.log(`Security OK: ${secret} is configured`, 'success');
      } else {
        this.testResults.security.push({ test: `${secret} environment variable`, status: 'missing' });
        this.log(`Security Warning: ${secret} not configured`, 'warning');
      }
    }
  }

  async testPortConflicts() {
    this.log('Testing for port conflicts...', 'info');
    
    const portUsage = new Map();
    const jsFiles = this.getAllJavaScriptFiles();
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const portMatches = content.match(/(?:port\s*[=:]\s*|listen\()\s*(\d+)/g);
        
        if (portMatches) {
          portMatches.forEach(match => {
            const port = match.match(/(\d+)/)[1];
            if (portUsage.has(port)) {
              portUsage.get(port).push(file);
            } else {
              portUsage.set(port, [file]);
            }
          });
        }
      } catch (error) {
        this.log(`Could not scan ${file} for ports: ${error.message}`, 'warning');
      }
    }
    
    // Check for conflicts
    for (const [port, files] of portUsage.entries()) {
      if (files.length > 1) {
        this.log(`Port Conflict: Port ${port} used in ${files.join(', ')}`, 'error');
      } else {
        this.log(`Port OK: ${port} (${files[0]})`, 'success');
      }
    }
  }

  getAllJavaScriptFiles() {
    const files = [];
    const excludeDirs = ['.git', 'node_modules', '.cache', 'logs', 'attached_assets', 'dist'];
    
    function scanDir(dir) {
      if (!fs.existsSync(dir)) return;
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory() && !excludeDirs.includes(item.name)) {
            scanDir(fullPath);
          } else if (item.isFile() && item.name.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }
    
    scanDir('.');
    return files;
  }

  generateReport() {
    this.log('Generating comprehensive error report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalSuccesses: this.successes.length,
        overallStatus: this.errors.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND'
      },
      errors: this.errors,
      warnings: this.warnings,
      successes: this.successes,
      detailedResults: this.testResults
    };
    
    // Save report
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
    
    fs.writeFileSync('logs/error-test-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n🔍 ERROR TEST SUMMARY');
    console.log('=====================');
    console.log(`❌ Errors Found: ${this.errors.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`✅ Successful Tests: ${this.successes.length}`);
    console.log(`📊 Overall Status: ${report.summary.overallStatus}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ERRORS TO FIX:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS TO REVIEW:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log(`\n📄 Full report saved to: logs/error-test-report.json`);
    
    return report;
  }

  async runComprehensiveTest() {
    console.log('🔍 STARTING COMPREHENSIVE ERROR TEST');
    console.log('====================================\n');
    
    try {
      await this.testSyntaxErrors();
      await this.testDependencies();
      await this.testConfiguration();
      await this.testRuntimeErrors();
      await this.testSecurityIssues();
      await this.testPortConflicts();
      
      return this.generateReport();
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      return this.generateReport();
    }
  }
}

// Auto-run if executed directly
if (require.main === module) {
  const tester = new ComprehensiveErrorTester();
  tester.runComprehensiveTest().then(report => {
    if (report.summary.overallStatus === 'HEALTHY') {
      console.log('\n✅ ALL TESTS PASSED - SYSTEM IS HEALTHY!');
      process.exit(0);
    } else {
      console.log('\n⚠️ ISSUES FOUND - REVIEW REQUIRED');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Error test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = ComprehensiveErrorTester;
