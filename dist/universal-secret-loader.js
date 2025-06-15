
const fs = require('fs');

function getGitHubToken() {
  // Try environment variables first
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  
  // Try Replit secrets
  if (process.env.REPLIT_DB_URL) {
    // In Replit environment
    return process.env.GITHUB_TOKEN || null;
  }
  
  return null;
}

function validateAllSecrets() {
  const requiredSecrets = ['GITHUB_TOKEN'];
  const missing = [];
  
  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      missing.push(secret);
    }
  }
  
  if (missing.length > 0) {
    console.log(`⚠️ Missing secrets: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required secrets found');
  return true;
}

module.exports = {
  getGitHubToken,
  validateAllSecrets
};
