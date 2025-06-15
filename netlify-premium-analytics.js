
const https = require('https');

class NetlifyPremiumAnalytics {
  constructor() {
    this.siteId = process.env.NETLIFY_SITE_ID;
    this.token = process.env.NETLIFY_ACCESS_TOKEN;
    this.baseURL = 'api.netlify.com';
    
    console.log('💎 NETLIFY PREMIUM ANALYTICS INITIALIZED');
  }

  async getPremiumAnalytics() {
    console.log('📊 Fetching PREMIUM analytics data...');
    
    return new Promise((resolve) => {
      const options = {
        hostname: this.baseURL,
        path: `/api/v1/sites/${this.siteId}/analytics`,
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const analytics = JSON.parse(data);
              console.log('💎 PREMIUM ANALYTICS RETRIEVED:');
              console.log(`   📈 Page Views: ${analytics.pageviews || 'N/A'}`);
              console.log(`   👥 Unique Visitors: ${analytics.uniques || 'N/A'}`);
              console.log(`   🌍 Top Countries: ${analytics.top_countries?.slice(0,3).join(', ') || 'N/A'}`);
              console.log(`   📱 Device Types: ${analytics.device_types || 'N/A'}`);
              resolve({ success: true, analytics });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => resolve({ success: false, error: error.message }));
      req.setTimeout(10000);
    });
  }

  async getBandwidthUsage() {
    console.log('📊 Checking premium bandwidth usage...');
    
    return new Promise((resolve) => {
      const options = {
        hostname: this.baseURL,
        path: `/api/v1/sites/${this.siteId}/bandwidth`,
        headers: { 'Authorization': `Bearer ${this.token}` }
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const bandwidth = JSON.parse(data);
              console.log('💎 PREMIUM BANDWIDTH STATS:');
              console.log(`   📊 Monthly Usage: ${bandwidth.used}GB / ${bandwidth.included}GB`);
              console.log(`   💰 Overage: $${bandwidth.overage_cost || 0}`);
              console.log(`   📈 Trend: ${bandwidth.trend || 'stable'}`);
              resolve({ success: true, bandwidth });
            } catch (error) {
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => resolve({ success: false, error: error.message }));
    });
  }

  async enablePremiumFeatures() {
    console.log('💎 Enabling ALL premium features...');
    
    const features = [
      'analytics',
      'forms', 
      'identity',
      'large_media',
      'split_testing',
      'background_functions',
      'edge_handlers'
    ];

    const results = [];
    
    for (const feature of features) {
      console.log(`🔧 Enabling ${feature}...`);
      
      const result = await this.enableFeature(feature);
      results.push({ feature, success: result.success });
      
      if (result.success) {
        console.log(`✅ ${feature} enabled`);
      } else {
        console.log(`❌ ${feature} failed: ${result.error}`);
      }
    }
    
    return results;
  }

  async enableFeature(feature) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({ 
        [feature]: { enabled: true }
      });
      
      const options = {
        hostname: this.baseURL,
        path: `/api/v1/sites/${this.siteId}/settings`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ 
            success: res.statusCode === 200,
            error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : null
          });
        });
      });

      req.on('error', (error) => resolve({ success: false, error: error.message }));
      req.write(postData);
      req.end();
    });
  }

  async getFullPremiumStatus() {
    console.log('\n💎 COMPREHENSIVE PREMIUM ACCOUNT STATUS');
    console.log('=' .repeat(60));
    
    const analytics = await this.getPremiumAnalytics();
    const bandwidth = await this.getBandwidthUsage();
    const features = await this.enablePremiumFeatures();
    
    console.log('\n🎯 PREMIUM FEATURE SUMMARY:');
    features.forEach(f => {
      console.log(`   ${f.success ? '✅' : '❌'} ${f.feature}`);
    });
    
    return { analytics, bandwidth, features };
  }
}

module.exports = NetlifyPremiumAnalytics;

// Run premium analytics if executed directly
if (require.main === module) {
  const analytics = new NetlifyPremiumAnalytics();
  analytics.getFullPremiumStatus()
    .then(() => console.log('\n💎 Premium analytics complete!'))
    .catch(error => console.error('❌ Analytics error:', error.message));
}
