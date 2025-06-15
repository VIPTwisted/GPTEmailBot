const https = require('https');

class NetlifyIntegration {
  constructor(siteId, accessToken) {
    // Use EXACT secret key names from Replit Secrets
    this.siteId = siteId || process.env.NETLIFY_SITE_ID || '502e465d-e030-4d5e-9ef9-31ec93a2308d';
    this.token = accessToken || process.env.NETLIFY_ACCESS_TOKEN || process.env.Replit_Integration;
    this.baseURL = 'api.netlify.com';

    console.log(`🔧 Netlify Integration initialized:`);
    console.log(`   📋 Site ID: ${this.siteId}`);
    console.log(`   🔑 Token: ${this.token ? 'Found' : 'Missing'}`);
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
              console.log(`✅ Build triggered: ${build.id}`);
              resolve(build);
            } catch (error) {
              reject(new Error(`Build response parse error: ${error.message}`));
            }
          } else {
            reject(new Error(`Netlify build failed: ${res.statusCode} - ${data}`));
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
        path: `/api/v1/sites/${this.siteId}/builds/${buildId}`,
        headers: { 'Authorization': `Bearer ${this.token}` },
        timeout: 10000
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const build = JSON.parse(data);
            console.log(`📊 Build ${buildId} status: ${build.state}`);
            resolve(build);
          } catch (error) {
            reject(new Error(`Status parse error: ${error.message}`));
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
    const safeConfig = `
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
`;

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
}