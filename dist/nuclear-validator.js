
const fs = require('fs');

class NuclearValidator {
  constructor() {
    this.validationResults = {
      syntax: [],
      environment: [],
      integration: [],
      security: []
    };
  }

  async validateEverything() {
    console.log('🔬 NUCLEAR VALIDATION STARTING...');
    console.log('=' .repeat(60));

    // 1. Validate all JavaScript syntax
    await this.validateSyntax();
    
    // 2. Validate environment variables
    await this.validateEnvironment();
    
    // 3. Validate integrations
    await this.validateIntegrations();
    
    // 4. Validate security
    await this.validateSecurity();

    // 5. Generate comprehensive report
    this.generateReport();

    return this.validationResults;
  }

  async validateSyntax() {
    console.log('\n🔍 VALIDATING JAVASCRIPT SYNTAX...');
    
    const jsFiles = fs.readdirSync('.')
      .filter(file => file.endsWith('.js') && !file.includes('nuclear-validator'));

    for (const file of jsFiles) {
      try {
        delete require.cache[require.resolve(`./${file}`)];
        require(`./${file}`);
        this.validationResults.syntax.push({
          file,
          status: 'PASS',
          message: 'Syntax valid'
        });
        console.log(`✅ ${file} - Syntax OK`);
      } catch (error) {
        this.validationResults.syntax.push({
          file,
          status: 'FAIL',
          message: error.message
        });
        console.log(`❌ ${file} - ${error.message}`);
      }
    }
  }

  async validateEnvironment() {
    console.log('\n🔍 VALIDATING ENVIRONMENT VARIABLES...');
    
    const requiredVars = {
      'GITHUB_TOKEN': 'GitHub integration',
      'NETLIFY_ACCESS_TOKEN': 'Netlify deployment',
      'NETLIFY_SITE_ID': 'Netlify site identification'
    };

    for (const [varName, purpose] of Object.entries(requiredVars)) {
      const value = process.env[varName];
      
      if (!value) {
        this.validationResults.environment.push({
          variable: varName,
          status: 'MISSING',
          purpose
        });
        console.log(`❌ ${varName} - MISSING (needed for ${purpose})`);
      } else {
        this.validationResults.environment.push({
          variable: varName,
          status: 'PRESENT',
          purpose,
          length: value.length
        });
        console.log(`✅ ${varName} - Present (${value.length} chars)`);
      }
    }
  }

  async validateIntegrations() {
    console.log('\n🔍 VALIDATING INTEGRATIONS...');
    
    // Test GitHub API
    await this.testGitHubAPI();
    
    // Test Netlify API
    await this.testNetlifyAPI();
  }

  async testGitHubAPI() {
    const https = require('https');
    
    return new Promise((resolve) => {
      if (!process.env.GITHUB_TOKEN) {
        this.validationResults.integration.push({
          service: 'GitHub',
          status: 'SKIP',
          message: 'No token available'
        });
        console.log('⏭️ GitHub API - Skipped (no token)');
        resolve();
        return;
      }

      const options = {
        hostname: 'api.github.com',
        path: '/user',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'Replit-Nuclear-Validator'
        }
      };

      const req = https.get(options, (res) => {
        if (res.statusCode === 200) {
          this.validationResults.integration.push({
            service: 'GitHub',
            status: 'PASS',
            message: 'API accessible'
          });
          console.log('✅ GitHub API - Connected');
        } else {
          this.validationResults.integration.push({
            service: 'GitHub',
            status: 'FAIL',
            message: `HTTP ${res.statusCode}`
          });
          console.log(`❌ GitHub API - Failed (${res.statusCode})`);
        }
        resolve();
      });

      req.on('error', () => {
        this.validationResults.integration.push({
          service: 'GitHub',
          status: 'FAIL',
          message: 'Network error'
        });
        console.log('❌ GitHub API - Network error');
        resolve();
      });

      req.setTimeout(5000, () => {
        this.validationResults.integration.push({
          service: 'GitHub',
          status: 'FAIL',
          message: 'Timeout'
        });
        console.log('❌ GitHub API - Timeout');
        resolve();
      });
    });
  }

  async testNetlifyAPI() {
    const https = require('https');
    
    return new Promise((resolve) => {
      if (!process.env.NETLIFY_ACCESS_TOKEN || !process.env.NETLIFY_SITE_ID) {
        this.validationResults.integration.push({
          service: 'Netlify',
          status: 'SKIP',
          message: 'Missing token or site ID'
        });
        console.log('⏭️ Netlify API - Skipped (missing credentials)');
        resolve();
        return;
      }

      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${process.env.NETLIFY_SITE_ID}`,
        headers: {
          'Authorization': `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`
        }
      };

      const req = https.get(options, (res) => {
        if (res.statusCode === 200) {
          this.validationResults.integration.push({
            service: 'Netlify',
            status: 'PASS',
            message: 'Site accessible'
          });
          console.log('✅ Netlify API - Site found');
        } else {
          this.validationResults.integration.push({
            service: 'Netlify',
            status: 'FAIL',
            message: `HTTP ${res.statusCode}`
          });
          console.log(`❌ Netlify API - Failed (${res.statusCode})`);
        }
        resolve();
      });

      req.on('error', () => {
        this.validationResults.integration.push({
          service: 'Netlify',
          status: 'FAIL',
          message: 'Network error'
        });
        console.log('❌ Netlify API - Network error');
        resolve();
      });

      req.setTimeout(5000, () => {
        this.validationResults.integration.push({
          service: 'Netlify',
          status: 'FAIL',
          message: 'Timeout'
        });
        console.log('❌ Netlify API - Timeout');
        resolve();
      });
    });
  }

  async validateSecurity() {
    console.log('\n🔍 VALIDATING SECURITY...');
    
    const jsFiles = fs.readdirSync('.')
      .filter(file => file.endsWith('.js'));

    const sensitivePatterns = [
      { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
      { pattern: /nfp_[a-zA-Z0-9]+/, name: 'Netlify token' },
      { pattern: /Bearer\s+[a-zA-Z0-9]{20,}/, name: '[REDACTED]' }
    ];

    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, name } of sensitivePatterns) {
          if (pattern.test(content)) {
            this.validationResults.security.push({
              file,
              issue: `Exposed ${name}`,
              status: 'FAIL'
            });
            console.log(`❌ ${file} - Contains exposed ${name}`);
          }
        }
      } catch (error) {
        console.log(`⏭️ ${file} - Cannot read for security check`);
      }
    }

    if (this.validationResults.security.length === 0) {
      console.log('✅ No exposed secrets found');
    }
  }

  generateReport() {
    console.log('\n📊 NUCLEAR VALIDATION REPORT');
    console.log('=' .repeat(60));

    // Syntax Report
    const syntaxPassed = this.validationResults.syntax.filter(r => r.status === 'PASS').length;
    const syntaxTotal = this.validationResults.syntax.length;
    console.log(`🔧 SYNTAX: ${syntaxPassed}/${syntaxTotal} files passed`);

    // Environment Report
    const envPresent = this.validationResults.environment.filter(r => r.status === 'PRESENT').length;
    const envTotal = this.validationResults.environment.length;
    console.log(`🌍 ENVIRONMENT: ${envPresent}/${envTotal} variables present`);

    // Integration Report
    const intPassed = this.validationResults.integration.filter(r => r.status === 'PASS').length;
    const intTotal = this.validationResults.integration.filter(r => r.status !== 'SKIP').length;
    console.log(`🔗 INTEGRATIONS: ${intPassed}/${intTotal} working`);

    // Security Report
    const securityIssues = this.validationResults.security.length;
    console.log(`🔐 SECURITY: ${securityIssues} issues found`);

    console.log('=' .repeat(60));

    // Overall Status
    const allSyntaxGood = syntaxPassed === syntaxTotal;
    const allEnvGood = envPresent === envTotal;
    const allIntGood = intPassed === intTotal || intTotal === 0;
    const allSecGood = securityIssues === 0;

    if (allSyntaxGood && allEnvGood && allIntGood && allSecGood) {
      console.log('🎉 ALL SYSTEMS GREEN - NUCLEAR VALIDATION PASSED!');
    } else {
      console.log('⚠️ ISSUES DETECTED - REVIEW REQUIRED');
    }
  }
}

module.exports = NuclearValidator;

// Auto-run if executed directly
if (require.main === module) {
  const validator = new NuclearValidator();
  validator.validateEverything();
}
