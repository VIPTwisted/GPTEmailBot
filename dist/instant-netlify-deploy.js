
const https = require('https');

async function instantDeploy() {
  console.log('🚀 INSTANT NETLIFY DEPLOYMENT');
  console.log('=' .repeat(50));
  
  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_ACCESS_TOKEN;
  
  if (!siteId || !token) {
    console.log('❌ Missing credentials');
    return;
  }

  // Skip validation - just trigger build immediately
  const postData = JSON.stringify({ clear_cache: true });
  
  const options = {
    hostname: 'api.netlify.com',
    path: `/api/v1/sites/${siteId}/builds`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  console.log('🚀 Triggering immediate build...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ BUILD TRIGGERED!');
        console.log('🌐 Your site is deploying to: https://toyparty.netlify.app');
        console.log('✅ Check your site in 2-3 minutes!');
      } else {
        console.log(`❌ Build failed: ${res.statusCode}`);
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Request failed: ${error.message}`);
  });

  req.write(postData);
  req.end();
}

instantDeploy();
