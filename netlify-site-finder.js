
const https = require('https');

class NetlifySiteFinder {
  constructor() {
    this.token = process.env.NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    console.log(`🔑 Token available: ${this.token ? 'Yes' : 'No'}`);
  }

  async findAllSites() {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: '/api/v1/sites',
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🔍 Searching all your Netlify sites...');

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const sites = JSON.parse(data);
              console.log(`✅ Found ${sites.length} Netlify sites in your account`);
              
              sites.forEach((site, index) => {
                console.log(`\n📱 Site ${index + 1}:`);
                console.log(`   📋 Site ID: ${site.id}`);
                console.log(`   📁 Name: ${site.name}`);
                console.log(`   🌐 URL: ${site.ssl_url || site.url}`);
                console.log(`   🏷️ Custom Domain: ${site.custom_domain }`);
                console.log(`   📊 State: ${site.state}`);
                console.log(`   🕐 Created: ${site.created_at}`);
              });

              // Find the most likely ToyParty site
              const toyPartySite = sites.find(site => 
                site.name.toLowerCase().includes('toy') || 
                site.name.toLowerCase().includes('party') ||
                site.ssl_url.includes('toy') ||
                site.ssl_url.includes('party')
              );

              if (toyPartySite) {
                console.log(`\n🎯 FOUND LIKELY TOYPARTY SITE:`);
                console.log(`   📋 Correct Site ID: ${toyPartySite.id}`);
                console.log(`   📁 Name: ${toyPartySite.name}`);
                console.log(`   🌐 URL: ${toyPartySite.ssl_url}`);
                
                this.updateAllFiles(toyPartySite.id);
              } else {
                console.log(`\n⚠️ No obvious ToyParty site found. Use any of the Site IDs above.`);
              }

              resolve(sites);
            } catch (error) {
              console.error('❌ Failed to parse sites:', error.message);
              resolve([]);
            }
          } else {
            console.error(`❌ API Error: ${res.statusCode}`);
            console.error(`Response: ${data}`);
            resolve([]);
          }
        });
      }).on('error', (error) => {
        console.error('❌ Network error:', error.message);
        resolve([]);
      });
    });
  }

  updateAllFiles(correctSiteId) {
    const fs = require('fs');
    
    console.log(`\n🔧 UPDATING ALL FILES WITH CORRECT SITE ID: ${correctSiteId}`);
    
    // Update netlify-integration.js
    if (fs.existsSync('netlify-integration.js')) {
      let content = fs.readFileSync('netlify-integration.js', 'utf8');
      content = content.replace(
        /this\.siteId = .+?;/,
        `this.siteId = siteId || process.env.NETLIFY_SITE_ID || '${correctSiteId}';`
      );
      fs.writeFileSync('netlify-integration.js', content);
      console.log('✅ Updated netlify-integration.js');
    }

    // Update autonomous-monitor.js
    if (fs.existsSync('autonomous-monitor.js')) {
      let content = fs.readFileSync('autonomous-monitor.js', 'utf8');
      content = content.replace(
        /this\.deploySiteId = .+?;/,
        `this.deploySiteId = deploySiteId || process.env.NETLIFY_SITE_ID || '${correctSiteId}';`
      );
      fs.writeFileSync('autonomous-monitor.js', content);
      console.log('✅ Updated autonomous-monitor.js');
    }

    // Update netlify-status-checker.js
    if (fs.existsSync('netlify-status-checker.js')) {
      let content = fs.readFileSync('netlify-status-checker.js', 'utf8');
      content = content.replace(
        /this\.siteId = .+?;/,
        `this.siteId = process.env.NETLIFY_SITE_ID || '${correctSiteId}';`
      );
      fs.writeFileSync('netlify-status-checker.js', content);
      console.log('✅ Updated netlify-status-checker.js');
    }

    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Copy this Site ID: ${correctSiteId}`);
    console.log(`2. Go to Replit Secrets`);
    console.log(`3. Update NETLIFY_SITE_ID with: ${correctSiteId}`);
    console.log(`4. Run the sync again`);
  }
}

// Run the site finder
if (require.main === module) {
  const finder = new NetlifySiteFinder();
  finder.findAllSites();
}

module.exports = NetlifySiteFinder;
