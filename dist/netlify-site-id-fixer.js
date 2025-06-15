
const fs = require('fs');
const https = require('https');

class NetlifySiteIdFixer {
  constructor() {
    this.currentSiteId = process.env.NETLIFY_SITE_ID;
    this.token = process.env.NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    this.wrongSiteIds = [
      'calm-shape-32084871',
      '502e465d-e030-4d5e-9ef9-31ec93a2308d'
    ];
    
    console.log('🔧 NETLIFY SITE ID FIXER');
    console.log(`📋 Current NETLIFY_SITE_ID: ${this.currentSiteId || 'NOT SET'}`);
    console.log(`🔑 Token available: ${this.token ? 'Yes' : 'No'}`);
  }

  async validateSiteId(siteId) {
    if (!siteId || !this.token) return false;
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${siteId}`,
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const site = JSON.parse(data);
              console.log(`✅ Site ID ${siteId} is VALID:`);
              console.log(`   📁 Name: ${site.name}`);
              console.log(`   🌐 URL: ${site.ssl_url}`);
              resolve(true);
            } catch (error) {
              resolve(false);
            }
          } else {
            console.log(`❌ Site ID ${siteId} is INVALID (${res.statusCode})`);
            resolve(false);
          }
        });
      }).on('error', () => resolve(false))
        .on('timeout', () => resolve(false));
    });
  }

  async fixAllFiles() {
    console.log('\n🔧 FIXING ALL NETLIFY INTEGRATION FILES...');
    
    // Validate current Site ID first
    if (this.currentSiteId) {
      const isValid = await this.validateSiteId(this.currentSiteId);
      if (!isValid) {
        console.log(`❌ Your current NETLIFY_SITE_ID "${this.currentSiteId}" is invalid!`);
        console.log('🛠️ Please check your Replit Secrets and update NETLIFY_SITE_ID');
        return false;
      }
    } else {
      console.log('❌ NETLIFY_SITE_ID not found in Replit Secrets!');
      console.log('🛠️ Please add NETLIFY_SITE_ID to your Replit Secrets');
      return false;
    }

    const filesToFix = [
      'netlify-integration.js',
      'autonomous-monitor.js', 
      'netlify-status-checker.js',
      'netlify-nuclear-fix.js'
    ];

    let fixed = 0;

    for (const file of filesToFix) {
      if (fs.existsSync(file)) {
        try {
          let content = fs.readFileSync(file, 'utf8');
          let changed = false;

          // Remove hardcoded wrong Site IDs
          for (const wrongId of this.wrongSiteIds) {
            const patterns = [
              new RegExp(`'${wrongId}'`, 'g'),
              new RegExp(`"${wrongId}"`, 'g'),
              new RegExp(`\\|\\|\\s*'${wrongId}'`, 'g'),
              new RegExp(`\\|\\|\\s*"${wrongId}"`, 'g')
            ];

            patterns.forEach(pattern => {
              if (pattern.test(content)) {
                content = content.replace(pattern, '');
                changed = true;
                console.log(`🗑️ Removed hardcoded Site ID ${wrongId} from ${file}`);
              }
            });
          }

          // Fix Site ID assignments to use only environment variables
          const siteIdPatterns = [
            /this\.siteId = .+?;/g,
            /this\.deploySiteId = .+?;/g,
            /siteId \|\| .+?;/g
          ];

          siteIdPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              content = content.replace(pattern, (match) => {
                if (match.includes('this.siteId')) {
                  return 'this.siteId = siteId || process.env.NETLIFY_SITE_ID;';
                } else if (match.includes('this.deploySiteId')) {
                  return 'this.deploySiteId = deploySiteId || process.env.NETLIFY_SITE_ID;';
                }
                return match;
              });
              changed = true;
            }
          });

          // Clean up possible site ID arrays
          const arrayPattern = /this\.possibleSiteIds = \[[\s\S]*?\];/g;
          if (arrayPattern.test(content)) {
            content = content.replace(arrayPattern, 
              'this.possibleSiteIds = [process.env.NETLIFY_SITE_ID].filter(Boolean);'
            );
            changed = true;
            console.log(`🧹 Cleaned Site ID array in ${file}`);
          }

          if (changed) {
            fs.writeFileSync(file, content);
            console.log(`✅ Fixed ${file}`);
            fixed++;
          } else {
            console.log(`⏭️ ${file} - no changes needed`);
          }
        } catch (error) {
          console.log(`❌ Failed to fix ${file}: ${error.message}`);
        }
      } else {
        console.log(`⏭️ ${file} - file not found`);
      }
    }

    console.log(`\n🎯 SUMMARY: Fixed ${fixed} files`);
    console.log(`✅ All files now use NETLIFY_SITE_ID from Replit Secrets: ${this.currentSiteId}`);
    
    return true;
  }

  async testNetlifyConnection() {
    console.log('\n🧪 TESTING NETLIFY CONNECTION...');
    
    if (!this.currentSiteId) {
      console.log('❌ Cannot test - NETLIFY_SITE_ID missing');
      return false;
    }

    if (!this.token) {
      console.log('❌ Cannot test - NETLIFY_ACCESS_TOKEN missing');
      return false;
    }

    // Test site access
    const siteValid = await this.validateSiteId(this.currentSiteId);
    
    if (siteValid) {
      // Test build trigger
      console.log('🚀 Testing build trigger...');
      return new Promise((resolve) => {
        const postData = JSON.stringify({ clear_cache: true });
        
        const options = {
          hostname: 'api.netlify.com',
          path: `/api/v1/sites/${this.currentSiteId}/builds`,
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
            if (res.statusCode === 201) {
              try {
                const build = JSON.parse(data);
                console.log('✅ BUILD TRIGGER SUCCESS!');
                console.log(`   🆔 Build ID: ${build.id}`);
                console.log(`   📊 State: ${build.state}`);
                resolve(true);
              } catch (error) {
                console.log('❌ Build trigger response parse error');
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
    
    return false;
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new NetlifySiteIdFixer();
  
  fixer.fixAllFiles().then(success => {
    if (success) {
      console.log('\n🧪 Running connection test...');
      return fixer.testNetlifyConnection();
    }
    return false;
  }).then(testSuccess => {
    if (testSuccess) {
      console.log('\n🎉 NETLIFY INTEGRATION FULLY FIXED!');
      console.log('✅ All files updated to use correct Site ID from secrets');
      console.log('✅ Netlify connection test passed');
      console.log('🚀 Your deployments should now work correctly!');
    } else {
      console.log('\n⚠️ Files fixed but connection test failed');
      console.log('🛠️ Check your NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN in Replit Secrets');
    }
  }).catch(error => {
    console.error('❌ Fixer failed:', error.message);
  });
}

module.exports = NetlifySiteIdFixer;
