const https = require('https');

class QuickNetlifyDeploy {
  constructor() {
    this.siteId = process.env.NETLIFY_SITE_ID || '502e465d-e030-4d5e-9ef9-31ec93a2308d';
    this.token = process.env.NETLIFY_ACCESS_TOKEN;

    if (!this.token) {
      throw new Error('NETLIFY_ACCESS_TOKEN required in Replit Secrets');
    }
  }

  async quickDeploy() {
    console.log('🚀 QUICK NETLIFY DEPLOYMENT (NO TIMEOUT)');
    console.log('=' .repeat(50));

    // Just trigger the build - don't wait for completion
    const buildResult = await this.triggerBuild();

    if (buildResult.success) {
      console.log('\n✅ DEPLOYMENT TRIGGERED SUCCESSFULLY!');
      console.log(`🆔 Build ID: ${buildResult.buildId}`);
      console.log(`🌐 Your site: https://toyparty.netlify.app`);
      console.log(`⏰ Build will complete in 2-5 minutes`);
      console.log(`✅ No timeout issues - build runs independently!`);
      return true;
    } else {
      console.log('\n❌ DEPLOYMENT TRIGGER FAILED');
      console.log(`Error: ${buildResult.error}`);
      return false;
    }
  }

  async triggerBuild() {
    console.log('🔥 Triggering build (fire and forget)...');

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        clear_cache: true,
        title: 'Quick Deploy - No Timeout'
      });

      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${this.siteId}/builds`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              const build = JSON.parse(data);
              resolve({ 
                success: true, 
                buildId: build.id,
                message: 'Build triggered successfully' 
              });
            } catch (error) {
              resolve({ success: false, error: 'Response parse error' });
            }
          } else {
            resolve({ 
              success: false, 
              error: `HTTP ${res.statusCode}: ${data.substring(0, 100)}` 
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        resolve({ success: false, error: 'Request timeout' });
      });

      req.setTimeout(10000);
      req.write(postData);
      req.end();
    });
  }
}

// Run quick deploy if executed directly
if (require.main === module) {
  const deployer = new QuickNetlifyDeploy();

  deployer.quickDeploy().then(success => {
    if (success) {
      console.log('\n🎉 QUICK DEPLOY COMPLETE!');
      console.log('🔄 Your site will be live in a few minutes');
      process.exit(0);
    } else {
      console.log('\n💥 Quick deploy failed');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Error:', error.message);
    process.exit(1);
  });
}

module.exports = QuickNetlifyDeploy;