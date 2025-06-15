const https = require('https');

class NetlifyStatusChecker {
  constructor() {
    this.siteId = process.env.NETLIFY_SITE_ID ;
    this.token = process.env.NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    this.baseURL = 'api.netlify.com';

    // Debug logging for secrets
    console.log(`🔑 NETLIFY_SITE_ID: ${this.siteId ? 'Found' : 'Missing'} (${this.siteId})`);
    console.log(`🔑 NETLIFY_TOKEN: ${this.token ? 'Found' : 'Missing'} (${this.token ? this.token.substring(0, 8) + '...' : 'N/A'})`);

    // Validate site ID format
    if (this.siteId && !this.siteId.match(/^[a-zA-Z0-9-]{8,}$/)) {
      console.log(`⚠️ WARNING: Site ID "${this.siteId}" doesn't match expected format (should be like: calm-shape-32084871)`);
    }
  }

  async checkNetlifyConfiguration() {
    console.log('🔍 CHECKING NETLIFY CONFIGURATION...');

    // Check environment variables
    console.log(`📋 Site ID: ${this.siteId ? '✅ Found' : '❌ Missing'}`);
    console.log(`🔑 Access Token: ${this.token ? '✅ Found' : '❌ Missing'}`);

    if (!this.siteId || !this.token) {
      console.log('❌ Missing required Netlify credentials!');
      console.log('🛠️ Add these to your Replit Secrets:');
      console.log('   • NETLIFY_SITE_ID (your site ID)');
      console.log('   • NETLIFY_ACCESS_TOKEN (your personal access token)');
      return false;
    }

    return true;
  }

  async checkSiteStatus() {
    if (!await this.checkNetlifyConfiguration()) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        path: `/v1/sites/${this.siteId}`,
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🌐 Checking Netlify site status...');

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const site = JSON.parse(data);
              console.log('✅ Netlify site found:');
              console.log(`   📁 Name: ${site.name}`);
              console.log(`   🌐 URL: ${site.ssl_url}`);
              console.log(`   📊 Deploy State: ${site.published_deploy?.state }`);
              console.log(`   🕐 Last Deploy: ${site.published_deploy?.created_at }`);
              resolve(site);
            } else {
              console.error(`❌ Netlify API error: ${res.statusCode}`);
              console.error(`📋 Response: ${data}`);
              resolve(null);
            }
          } catch (error) {
            console.error('❌ Failed to parse Netlify response:', error.message);
            resolve(null);
          }
        });
      }).on('error', (error) => {
        console.error('❌ Network error connecting to Netlify:', error.message);
        resolve(null);
      });
    });
  }

  async triggerTestBuild() {
    if (!await this.checkNetlifyConfiguration()) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ clear_cache: true });

      const options = {
        hostname: this.baseURL,
        path: `/v1/sites/${this.siteId}/builds`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      console.log('🚀 Triggering test Netlify build...');

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 201) {
              const build = JSON.parse(data);
              console.log('✅ Build triggered successfully!');
              console.log(`   🆔 Build ID: ${build.id}`);
              console.log(`   📊 State: ${build.state}`);
              console.log(`   🌐 Deploy URL: ${build.deploy_ssl_url }`);
              resolve(build);
            } else {
              console.error(`❌ Build trigger failed: ${res.statusCode}`);
              console.error(`📋 Response: ${data}`);
              resolve(null);
            }
          } catch (error) {
            console.error('❌ Failed to parse build response:', error.message);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Network error triggering build:', error.message);
        resolve(null);
      });

      req.write(postData);
      req.end();
    });
  }

  async runFullDiagnostics() {
    console.log('🔧 RUNNING FULL NETLIFY DIAGNOSTICS...');
    console.log('=' .repeat(50));

    const errors = [];
    const skipped = [];

    const siteStatus = await this.checkSiteStatus();

    if (siteStatus) {
      console.log('\n🚀 Testing build trigger...');
      const buildResult = await this.triggerTestBuild();

      if (buildResult) {
        console.log('\n✅ NETLIFY INTEGRATION WORKING!');
        console.log(`🎉 Your ToyParty site should rebuild at: ${siteStatus.ssl_url}`);
      } else {
        console.log('\n❌ BUILD TRIGGER FAILED');
        console.log('🛠️ Check your Netlify access token permissions');
        errors.push('Build trigger failed - check access token permissions');
      }
    } else {
      console.log('\n❌ NETLIFY SITE ACCESS FAILED');
      console.log('🛠️ Verify your NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN');
      errors.push('Site access failed - check NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN');
    }

    // Log all tracked errors and skipped items
    console.log('\n📋 NETLIFY ERROR/SKIP TRACKING:');
    if (errors.length > 0) {
      console.log('❌ ERRORS ENCOUNTERED:');
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
    if (skipped.length > 0) {
      console.log('⏭️ ITEMS SKIPPED:');
      skipped.forEach((skip, i) => console.log(`   ${i + 1}. ${skip}`));
    }
    if (errors.length === 0 && skipped.length === 0) {
      console.log('✅ No errors or skipped items detected');
    }

    console.log('=' .repeat(50));

    return { errors, skipped, siteStatus };
  }
}

// Run diagnostics if executed directly
if (require.main === module) {
  const checker = new NetlifyStatusChecker();
  checker.runFullDiagnostics();
}

module.exports = NetlifyStatusChecker;