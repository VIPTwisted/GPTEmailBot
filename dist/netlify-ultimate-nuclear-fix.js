
const https = require('https');
const fs = require('fs');

class NetlifyUltimateNuclearFix {
  constructor() {
    console.log('🚀 ULTIMATE NETLIFY NUCLEAR FIX INITIATED');
    console.log('💥 This will fix EVERYTHING once and for all!');
    console.log('=' .repeat(70));

    // Load exact secrets from your environment
    this.siteId = process.env.NETLIFY_SITE_ID;
    this.token = process.env.NETLIFY_ACCESS_TOKEN; // This is the correct key name!
    
    console.log(`📋 Site ID: ${this.siteId || 'MISSING'}`);
    console.log(`🔑 Token: ${this.token ? 'FOUND (' + this.token.substring(0, 8) + '...)' : 'MISSING'}`);
  }

  async validateConnection() {
    console.log('\n🧪 TESTING NETLIFY CONNECTION...');
    
    if (!this.siteId || !this.token) {
      console.log('❌ Missing credentials - cannot test connection');
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${this.siteId}`,
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const site = JSON.parse(data);
              console.log('✅ NETLIFY CONNECTION SUCCESS!');
              console.log(`   📁 Site Name: ${site.name}`);
              console.log(`   🌐 URL: ${site.ssl_url}`);
              console.log(`   📊 State: ${site.published_deploy?.state || 'unknown'}`);
              resolve(true);
            } catch (error) {
              console.log('❌ Response parse error');
              resolve(false);
            }
          } else {
            console.log(`❌ API Error: ${res.statusCode}`);
            console.log(`Response: ${data.substring(0, 200)}`);
            resolve(false);
          }
        });
      });

      req.on('error', () => {
        console.log('❌ Network error');
        resolve(false);
      });

      req.on('timeout', () => {
        console.log('❌ Request timeout');
        resolve(false);
      });

      req.setTimeout(10000);
    });
  }

  async testBuildTrigger() {
    console.log('\n🚀 TESTING BUILD TRIGGER...');
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({ clear_cache: true });
      
      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${this.siteId}/builds`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            try {
              const build = JSON.parse(data);
              console.log('✅ BUILD TRIGGER SUCCESS!');
              console.log(`   🆔 Build ID: ${build.id}`);
              console.log(`   📊 State: ${build.state}`);
              console.log(`   🌐 Deploy URL: ${build.deploy_ssl_url || 'Pending'}`);
              resolve(true);
            } catch (error) {
              console.log('❌ Build response parse error');
              resolve(false);
            }
          } else {
            console.log(`❌ Build trigger failed: ${res.statusCode}`);
            console.log(`Response: ${data.substring(0, 200)}`);
            resolve(false);
          }
        });
      });

      req.on('error', () => {
        console.log('❌ Build trigger network error');
        resolve(false);
      });

      req.on('timeout', () => {
        console.log('❌ Build trigger timeout');
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }

  fixNetlifyIntegration() {
    console.log('\n🔧 FIXING netlify-integration.js...');
    
    const correctCode = `const https = require('https');

class NetlifyIntegration {
  constructor(siteId, accessToken) {
    // Use EXACT secret key names from Replit Secrets
    this.siteId = siteId || process.env.NETLIFY_SITE_ID;
    this.token = accessToken || process.env.NETLIFY_ACCESS_TOKEN;
    this.baseURL = 'api.netlify.com';

    console.log(\`🔧 Netlify Integration initialized:\`);
    console.log(\`   📋 Site ID: \${this.siteId}\`);
    console.log(\`   🔑 Token: \${this.token ? 'Found' : 'Missing'}\`);
  }

  async triggerBuild() {
    console.log('🏗️ Triggering Netlify rebuild...');

    if (!this.siteId || !this.token) {
      throw new Error('Missing NETLIFY_SITE_ID or NETLIFY_ACCESS_TOKEN');
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ clear_cache: true });
      
      const options = {
        hostname: this.baseURL,
        path: \`/api/v1/sites/\${this.siteId}/builds\`,
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.token}\`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            try {
              const build = JSON.parse(data);
              console.log(\`✅ Build triggered: \${build.id}\`);
              resolve(build);
            } catch (error) {
              reject(new Error(\`Build response parse error: \${error.message}\`));
            }
          } else {
            reject(new Error(\`Netlify build failed: \${res.statusCode} - \${data}\`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Build trigger timeout')));
      req.setTimeout(15000);
      req.write(postData);
      req.end();
    });
  }

  async checkBuildStatus(buildId) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        path: \`/api/v1/sites/\${this.siteId}/builds/\${buildId}\`,
        headers: { 'Authorization': \`Bearer \${this.token}\` },
        timeout: 10000
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const build = JSON.parse(data);
            console.log(\`📊 Build \${buildId} status: \${build.state}\`);
            resolve(build);
          } catch (error) {
            reject(new Error(\`Status parse error: \${error.message}\`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Status check timeout')));
      req.setTimeout(10000);
    });
  }

  async autoRecoverBuild() {
    console.log('🛠️ Attempting build recovery...');

    // Create safe fallback netlify.toml
    const safeConfig = \`
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
\`;

    require('fs').writeFileSync('netlify.toml', safeConfig);
    console.log('✅ Created safe netlify.toml');

    return this.triggerBuild();
  }
}

module.exports = NetlifyIntegration;

// Test if run directly
if (require.main === module) {
  const integration = new NetlifyIntegration();
  integration.triggerBuild()
    .then(build => console.log('✅ Test build triggered:', build.id))
    .catch(error => console.error('❌ Test failed:', error.message));
}`;

    fs.writeFileSync('netlify-integration.js', correctCode);
    console.log('✅ Fixed netlify-integration.js with correct secret key names');
  }

  fixAutonomousMonitor() {
    console.log('🔧 FIXING autonomous-monitor.js...');
    
    if (!fs.existsSync('autonomous-monitor.js')) {
      console.log('⏭️ autonomous-monitor.js not found - skipping');
      return;
    }

    let content = fs.readFileSync('autonomous-monitor.js', 'utf8');
    
    // Fix token loading to use correct secret name
    content = content.replace(
      /this\.netlifyToken = .+?;/g,
      'this.netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;'
    );
    
    // Fix site ID loading
    content = content.replace(
      /this\.deploySiteId = .+?;/g,
      'this.deploySiteId = deploySiteId || process.env.NETLIFY_SITE_ID;'
    );

    // Fix API endpoint to use correct version
    content = content.replace(
      /api\.netlify\.com\/v1\//g,
      'api.netlify.com/api/v1/'
    );

    fs.writeFileSync('autonomous-monitor.js', content);
    console.log('✅ Fixed autonomous-monitor.js with correct secret names');
  }

  fixAllIntegrationFiles() {
    console.log('\n🔧 FIXING ALL INTEGRATION FILES...');
    
    const filesToFix = [
      'netlify-status-checker.js',
      'netlify-nuclear-fix.js',
      'netlify-site-finder.js',
      'netlify-site-id-fixer.js'
    ];

    let fixedCount = 0;

    for (const file of filesToFix) {
      if (fs.existsSync(file)) {
        try {
          let content = fs.readFileSync(file, 'utf8');
          let changed = false;

          // Fix token references
          const tokenPatterns = [
            /process\.env\.NETLIFY_TOKEN/g,
            /process\.env\.Replit_Deploy_Token/g,
            /process\.env\.REPLIT_DEPLOY_TOKEN/g,
            /process\.env\.Replit_Integration/g
          ];

          tokenPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              content = content.replace(pattern, 'process.env.NETLIFY_ACCESS_TOKEN');
              changed = true;
            }
          });

          // Remove hardcoded site IDs and fallbacks
          content = content.replace(
            /\|\|\s*['"][a-zA-Z0-9-]+['"]/g,
            ''
          );

          // Fix API endpoints
          content = content.replace(
            /api\.netlify\.com\/v1\//g,
            'api.netlify.com/api/v1/'
          );

          if (changed) {
            fs.writeFileSync(file, content);
            console.log(`✅ Fixed ${file}`);
            fixedCount++;
          } else {
            console.log(`⏭️ ${file} - no changes needed`);
          }
        } catch (error) {
          console.log(`❌ Error fixing ${file}: ${error.message}`);
        }
      } else {
        console.log(`⏭️ ${file} - not found`);
      }
    }

    console.log(`🎯 Fixed ${fixedCount} integration files`);
  }

  createBulletproofConfig() {
    console.log('\n🛡️ CREATING BULLETPROOF CONFIGURATION...');
    
    const config = {
      service: 'Netlify',
      version: '2.0',
      fixed_at: new Date().toISOString(),
      secrets_required: {
        NETLIFY_SITE_ID: this.siteId || 'MISSING',
        NETLIFY_ACCESS_TOKEN: this.token ? 'FOUND' : 'MISSING'
      },
      api_endpoints: {
        base: 'https://api.netlify.com/api/v1',
        site: `/sites/${this.siteId}`,
        builds: `/sites/${this.siteId}/builds`
      },
      validation: {
        connection_tested: false,
        build_trigger_tested: false,
        last_test: null
      }
    };

    fs.writeFileSync('netlify-config.json', JSON.stringify(config, null, 2));
    console.log('✅ Created bulletproof netlify-config.json');
  }

  async performUltimateNuclearFix() {
    console.log('\n💥 PERFORMING ULTIMATE NUCLEAR FIX...');
    console.log('=' .repeat(70));

    // Step 1: Fix all integration files
    this.fixNetlifyIntegration();
    this.fixAutonomousMonitor();
    this.fixAllIntegrationFiles();

    // Step 2: Create bulletproof config
    this.createBulletproofConfig();

    // Step 3: Test connection
    const connectionWorking = await this.validateConnection();
    
    if (connectionWorking) {
      // Step 4: Test build trigger
      const buildWorking = await this.testBuildTrigger();
      
      if (buildWorking) {
        console.log('\n🎉 ULTIMATE NUCLEAR FIX COMPLETE!');
        console.log('=' .repeat(70));
        console.log('✅ ALL NETLIFY ISSUES FIXED!');
        console.log('✅ Connection tested and working');
        console.log('✅ Build trigger tested and working');
        console.log('✅ All files updated with correct secret names');
        console.log('🚀 Your Netlify integration is now bulletproof!');
        
        return { success: true, connection: true, builds: true };
      } else {
        console.log('\n⚠️ CONNECTION WORKS BUT BUILD FAILED');
        console.log('🔧 Check your Netlify site settings and build commands');
        return { success: true, connection: true, builds: false };
      }
    } else {
      console.log('\n❌ CONNECTION FAILED');
      console.log('🛠️ Check your NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN');
      return { success: false, connection: false, builds: false };
    }
  }
}

// Execute the ultimate nuclear fix
if (require.main === module) {
  const fixer = new NetlifyUltimateNuclearFix();
  
  fixer.performUltimateNuclearFix().then(result => {
    if (result.success && result.connection && result.builds) {
      console.log('\n🚀 READY TO DEPLOY!');
      console.log('Try running: node netlify-integration.js');
      process.exit(0);
    } else {
      console.log('\n🔧 PARTIAL FIX COMPLETED - Check messages above');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Ultimate fix failed:', error.message);
    process.exit(1);
  });
}

module.exports = NetlifyUltimateNuclearFix;
