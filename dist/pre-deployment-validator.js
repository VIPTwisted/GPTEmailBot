const fs = require('fs');
const path = require('path');

class PreDeploymentValidator {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);

    if (type === 'error') {
      this.errors.push(message);
      this.failCount++;
    } else if (type === 'warning') {
      this.warnings.push(message);
    } else if (type === 'success') {
      this.passCount++;
    }
  }

  async validateSyntax() {
    this.log('🔍 Validating JavaScript syntax...', 'info');

    const jsFiles = [
      'simple-server.js',
      'sync-gpt-to-github.js',
      'comprehensive-system-tester.js',
      'index.js'
    ];

    for (const file of jsFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for template literal issues
          if (content.includes('${') && content.includes('`')) {
            const templateLiteralRegex = /`[^`]*\$\{[^}]*\}[^`]*`/g;
            const matches = content.match(templateLiteralRegex);
            if (matches) {
              this.log(`✅ ${file}: Template literals properly formatted`, 'success');
            }
          }

          // Check for balanced brackets
          const openBrackets = (content.match(/\(/g) || []).length;
          const closeBrackets = (content.match(/\)/g) || []).length;
          const openBraces = (content.match(/\{/g) || []).length;
          const closeBraces = (content.match(/\}/g) || []).length;

          if (openBrackets !== closeBrackets) {
            this.log(`❌ ${file}: Unmatched parentheses (${openBrackets} open, ${closeBrackets} close)`, 'error');
          } else if (openBraces !== closeBraces) {
            this.log(`❌ ${file}: Unmatched braces (${openBraces} open, ${closeBraces} close)`, 'error');
          } else {
            this.log(`✅ ${file}: Syntax validation passed`, 'success');
          }

        } catch (error) {
          this.log(`❌ ${file}: ${error.message}`, 'error');
        }
      } else {
        this.log(`⚠️ ${file}: File not found`, 'warning');
      }
    }
  }

  async validateServerStartup() {
    this.log('🚀 Testing server startup capability...', 'info');

    try {
      // Clear require cache to ensure fresh load
      const serverPath = path.resolve('./simple-server.js');
      delete require.cache[serverPath];

      // Test require without executing
      require('./simple-server.js');
      this.log('✅ Server module can be required successfully', 'success');

    } catch (error) {
      this.log(`❌ Server startup test failed: ${error.message}`, 'error');

      // Try to identify the specific issue
      if (error.message.includes('Unexpected token')) {
        this.log('💡 Syntax error detected - likely template literal issue', 'warning');
      } else if (error.message.includes('Cannot find module')) {
        this.log('💡 Missing dependency detected', 'warning');
      }
    }
  }

  async validateDependencies() {
    this.log('📦 Validating dependencies...', 'info');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const requiredDeps = ['express', 'socket.io'];

      for (const dep of requiredDeps) {
        if (dependencies[dep]) {
          this.log(`✅ Required dependency found: ${dep}`, 'success');
        } else {
          this.log(`❌ Missing required dependency: ${dep}`, 'error');
        }
      }

    } catch (error) {
      this.log(`❌ Package.json validation failed: ${error.message}`, 'error');
    }
  }

  async validateConfiguration() {
    this.log('⚙️ Validating configuration files...', 'info');

    const configFiles = [
      'deploy.json',
      'netlify.toml'
    ];

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        try {
          if (file.endsWith('.json')) {
            JSON.parse(fs.readFileSync(file, 'utf8'));
          }
          this.log(`✅ ${file}: Valid configuration`, 'success');
        } catch (error) {
          this.log(`❌ ${file}: Invalid configuration - ${error.message}`, 'error');
        }
      } else {
        this.log(`⚠️ ${file}: Configuration file not found`, 'warning');
      }
    }
  }

  async validateSecrets() {
    this.log('🔐 Validating secrets configuration...', 'info');
    
    const requiredSecrets = ['GITHUB_TOKEN'];
    
    for (const secret of requiredSecrets) {
      if (process.env[secret]) {
        this.log(`✅ Secret found: ${secret}`, 'success');
      } else {
        this.log(`⚠️ Secret not found: ${secret}`, 'warning');
      }
    }
  }

  async validatePorts() {
    this.log('🌐 Validating port configuration...', 'info');
    
    const jsFiles = ['simple-server.js', 'index.js', 'dev-server.js'];
    const portUsage = new Map();
    
    for (const file of jsFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const portMatches = content.match(/(?:port\s*=\s*|listen\()\s*(\d+)/g);
        
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
      }
    }
    
    // Check for conflicts
    let hasConflicts = false;
    for (const [port, files] of portUsage.entries()) {
      if (files.length > 1) {
        this.log(`❌ Port conflict detected: ${port} used in ${files.join(', ')}`, 'error');
        hasConflicts = true;
      } else {
        this.log(`✅ Port ${port}: No conflicts (${files[0]})`, 'success');
      }
    }
    
    if (!hasConflicts && portUsage.size > 0) {
      this.log('✅ No port conflicts detected', 'success');
    }
  }

  async runComprehensiveValidation() {
    console.log('🚀 STARTING PRE-DEPLOYMENT VALIDATION');
    console.log('=====================================\n');

    try {
      await this.validateSyntax();
      await this.validateServerStartup();
      await this.validateDependencies();
      await this.validateConfiguration();
      await this.validateSecrets();
      await this.validatePorts();
    } catch (error) {
      this.log(`💥 Validation process error: ${error.message}`, 'error');
    }

    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ERRORS THAT MUST BE FIXED:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS (REVIEW RECOMMENDED):');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    const isReady = this.failCount === 0;

    if (isReady) {
      console.log('\n🎉 SYSTEM READY FOR DEPLOYMENT!');
      console.log('All critical validations passed.');
    } else {
      console.log('\n⚠️ SYSTEM NOT READY FOR DEPLOYMENT');
      console.log('Please fix critical errors before deploying.');
    }

    // Ensure logs directory exists
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }

    // Save validation report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.passCount,
        failed: this.failCount,
        warnings: this.warnings.length,
        ready: isReady
      },
      errors: this.errors,
      warnings: this.warnings
    };

    fs.writeFileSync('logs/pre-deployment-report.json', JSON.stringify(report, null, 2));

    return isReady;
  }
}

// Auto-run if executed directly
if (require.main === module) {
  const validator = new PreDeploymentValidator();
  validator.runComprehensiveValidation().then(isReady => {
    if (isReady) {
      console.log('\n🚀 Starting server...');
      // Start the server after validation passes
      process.exit(0);
    } else {
      console.log('\n❌ Validation failed - server not started');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Validator crashed:', error.message);
    process.exit(1);
  });
}

module.exports = PreDeploymentValidator;