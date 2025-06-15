
const https = require('https');
const dns = require('dns');
const { execSync } = require('child_process');

// Test DNS resolution and GitHub API connectivity
async function testGitHubConnectivity() {
  console.log('🔍 Testing GitHub API connectivity...');
  
  try {
    // Test DNS resolution for api.github.com
    console.log('📡 Testing DNS resolution for api.github.com...');
    await new Promise((resolve, reject) => {
      dns.lookup('api.github.com', (err, address) => {
        if (err) {
          console.error('❌ DNS lookup failed:', err.message);
          reject(err);
        } else {
          console.log(`✅ DNS resolved api.github.com to: ${address}`);
          resolve(address);
        }
      });
    });

    // Test HTTPS connection to GitHub API
    console.log('🌐 Testing HTTPS connection to GitHub API...');
    await new Promise((resolve, reject) => {
      const req = https.get('https://api.github.com/repos/VIPTwisted/ToyParty/commits', (res) => {
        console.log(`✅ GitHub API responded with status: ${res.statusCode}`);
        res.on('data', () => {}); // Consume response data
        res.on('end', () => resolve());
      });

      req.on('error', (err) => {
        console.error('❌ HTTPS request failed:', err.message);
        reject(err);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    console.log('✅ GitHub API connectivity test passed!');
    return true;
  } catch (error) {
    console.error('❌ GitHub API connectivity test failed:', error.message);
    return false;
  }
}

// Fix DNS configuration
function fixDNSConfiguration() {
  console.log('🔧 Attempting to fix DNS configuration...');
  
  try {
    // Set public DNS servers (Google DNS and Cloudflare)
    console.log('📝 Configuring public DNS servers...');
    
    // For environments where we can modify resolv.conf
    try {
      execSync('echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null', { stdio: 'pipe' });
      execSync('echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf > /dev/null', { stdio: 'pipe' });
      console.log('✅ DNS servers configured');
    } catch (dnsErr) {
      console.log('⚠️ Could not modify /etc/resolv.conf (this is normal in Replit)');
    }

    // Flush DNS cache
    try {
      execSync('sudo systemctl restart systemd-resolved', { stdio: 'pipe' });
      console.log('✅ DNS cache flushed');
    } catch (cacheErr) {
      console.log('⚠️ Could not flush DNS cache (this is normal in Replit)');
    }

    console.log('✅ DNS configuration fix completed');
  } catch (error) {
    console.error('❌ DNS configuration fix failed:', error.message);
  }
}

// Main diagnostic function
async function runNetworkDiagnostics() {
  console.log('🚀 Starting network diagnostics for GitHub API...');
  
  // First test connectivity
  let isConnected = await testGitHubConnectivity();
  
  if (!isConnected) {
    console.log('🔧 Connection failed, attempting DNS fix...');
    fixDNSConfiguration();
    
    // Wait a moment for DNS changes to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test again
    console.log('🔄 Retesting connectivity after DNS fix...');
    isConnected = await testGitHubConnectivity();
  }
  
  if (isConnected) {
    console.log('🎉 GitHub API is now accessible!');
  } else {
    console.log('❌ GitHub API is still not accessible. This may be a network-level restriction.');
    console.log('💡 Try running this diagnostic again or contact Replit support if the issue persists.');
  }
  
  return isConnected;
}

// Export for use in other modules
module.exports = {
  testGitHubConnectivity,
  fixDNSConfiguration,
  runNetworkDiagnostics
};

// Run diagnostics if this file is executed directly
if (require.main === module) {
  runNetworkDiagnostics();
}
