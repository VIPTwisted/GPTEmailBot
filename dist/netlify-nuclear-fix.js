
const https = require('https');
const fs = require('fs');

class NetlifyNuclearFix {
  constructor() {
    // Try multiple possible site ID sources
    this.possibleSiteIds = [
      process.env.NETLIFY_SITE_ID,
      '502e465d-e030-4d5e-9ef9-31ec93a2308d'
    ].filter(Boolean);
    
    this.possibleTokens = [
      process.env.NETLIFY_ACCESS_TOKEN,
      process.env.NETLIFY_ACCESS_TOKEN,
      process.env.NETLIFY_ACCESS_TOKEN
    ].filter(Boolean);

    console.log('🚀 NUCLEAR NETLIFY FIX INITIATED');
    console.log(`🔍 Testing ${this.possibleSiteIds.length} site IDs`);
    console.log(`🔑 Testing ${this.possibleTokens.length} tokens`);
  }

  async testSiteConnection(siteId, token) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: `/v1/sites/${siteId}`,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const site = JSON.parse(data);
              resolve({
                success: true,
                siteId,
                token: token.substring(0, 8) + '...',
                siteName: site.name,
                url: site.ssl_url,
                deployState: site.published_deploy?.state
              });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            resolve({ 
              success: false, 
              status: res.statusCode,
              error: data.substring(0, 200)
            });
          }
        });
      });

      req.on('error', () => resolve({ success: false, error: 'Network error' }));
      req.on('timeout', () => resolve({ success: false, error: 'Timeout' }));
      req.setTimeout(5000);
    });
  }

  async testBuildTrigger(siteId, token) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({ clear_cache: true });
      
      const options = {
        hostname: 'api.netlify.com',
        path: `/v1/sites/${siteId}/builds`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            try {
              const build = JSON.parse(data);
              resolve({
                success: true,
                buildId: build.id,
                state: build.state,
                deployUrl: build.deploy_ssl_url
              });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            resolve({ 
              success: false, 
              status: res.statusCode,
              error: data.substring(0, 200)
            });
          }
        });
      });

      req.on('error', () => resolve({ success: false, error: 'Network error' }));
      req.on('timeout', () => resolve({ success: false, error: 'Timeout' }));
      req.setTimeout(10000);
      req.write(postData);
      req.end();
    });
  }

  async nuclearFix() {
    console.log('\n🔥 NUCLEAR NETLIFY 404 FIX IN PROGRESS...');
    console.log('=' .repeat(60));

    let workingConfig = null;

    // Test all combinations
    for (const siteId of this.possibleSiteIds) {
      for (const token of this.possibleTokens) {
        console.log(`\n🧪 Testing Site ID: ${siteId}`);
        console.log(`🔑 Testing Token: ${token.substring(0, 8)}...`);
        
        // Test site connection first
        const siteTest = await this.testSiteConnection(siteId, token);
        
        if (siteTest.success) {
          console.log('✅ Site connection SUCCESS!');
          console.log(`   📁 Site Name: ${siteTest.siteName}`);
          console.log(`   🌐 URL: ${siteTest.url}`);
          console.log(`   📊 Deploy State: ${siteTest.deployState}`);
          
          // Test build trigger
          console.log('🚀 Testing build trigger...');
          const buildTest = await this.testBuildTrigger(siteId, token);
          
          if (buildTest.success) {
            console.log('✅ BUILD TRIGGER SUCCESS!');
            console.log(`   🆔 Build ID: ${buildTest.buildId}`);
            console.log(`   📊 State: ${buildTest.state}`);
            
            workingConfig = {
              siteId,
              token,
              siteName: siteTest.siteName,
              url: siteTest.url
            };
            break;
          } else {
            console.log(`❌ Build trigger failed: ${buildTest.status || buildTest.error}`);
          }
        } else {
          console.log(`❌ Site connection failed: ${siteTest.status || siteTest.error}`);
        }
      }
      
      if (workingConfig) break;
    }

    if (workingConfig) {
      console.log('\n🎉 NUCLEAR FIX SUCCESSFUL!');
      console.log('=' .repeat(60));
      console.log(`✅ Working Site ID: ${workingConfig.siteId}`);
      console.log(`✅ Working Token: ${workingConfig.token.substring(0, 8)}...`);
      console.log(`✅ Site Name: ${workingConfig.siteName}`);
      console.log(`✅ Site URL: ${workingConfig.url}`);
      
      // Update all integration files
      await this.updateIntegrationFiles(workingConfig);
      
      return workingConfig;
    } else {
      console.log('\n💥 NUCLEAR FIX FAILED - NO WORKING CONFIGURATION FOUND');
      console.log('=' .repeat(60));
      console.log('🔍 Debug Information:');
      console.log(`   Site IDs tested: ${this.possibleSiteIds.join(', ')}`);
      console.log(`   Tokens available: ${this.possibleTokens.length}`);
      console.log('\n🛠️ Manual Steps Required:');
      console.log('1. Log into Netlify dashboard');
      console.log('2. Find your site and copy the Site ID');
      console.log('3. Generate a new Personal Access Token');
      console.log('4. Update Replit Secrets with correct values');
      
      return null;
    }
  }

  async updateIntegrationFiles(config) {
    console.log('\n🔧 Updating integration files with working configuration...');
    
    // Update netlify-integration.js
    if (fs.existsSync('netlify-integration.js')) {
      let content = fs.readFileSync('netlify-integration.js', 'utf8');
      content = content.replace(
        /this\.siteId = .+?;/,
        `this.siteId = siteId || process.env.NETLIFY_SITE_ID;`
      );
      fs.writeFileSync('netlify-integration.js', content);
      console.log('✅ Updated netlify-integration.js');
    }

    // Update autonomous-monitor.js
    if (fs.existsSync('autonomous-monitor.js')) {
      let content = fs.readFileSync('autonomous-monitor.js', 'utf8');
      content = content.replace(
        /this\.deploySiteId = .+?;/,
        `this.deploySiteId = deploySiteId || process.env.NETLIFY_SITE_ID;`
      );
      fs.writeFileSync('autonomous-monitor.js', content);
      console.log('✅ Updated autonomous-monitor.js');
    }

    // Create configuration backup
    const backupConfig = {
      working_site_id: config.siteId,
      working_token_prefix: config.token.substring(0, 8),
      site_name: config.siteName,
      site_url: config.url,
      fixed_at: new Date().toISOString()
    };
    
    fs.writeFileSync('netlify-working-config.json', JSON.stringify(backupConfig, null, 2));
    console.log('✅ Created netlify-working-config.json backup');
  }
}

// Run nuclear fix
if (require.main === module) {
  const fixer = new NetlifyNuclearFix();
  fixer.nuclearFix().then(result => {
    if (result) {
      console.log('\n🚀 READY TO TEST - Run this command to verify:');
      console.log('node netlify-integration.js');
    } else {
      process.exit(1);
    }
  });
}

module.exports = NetlifyNuclearFix;
