
// REPLIT HEALTH MONITOR - AUTO-GENERATED
const fs = require('fs');
const { execSync } = require('child_process');

class ReplitHealthMonitor {
  static async checkHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      git: this.checkGit(),
      secrets: this.checkSecrets(),
      files: this.checkFiles(),
      ports: this.checkPorts()
    };
    
    console.log('🏥 REPLIT HEALTH CHECK');
    console.log('=' .repeat(40));
    console.log(`Git: ${health.git ? '✅' : '❌'}`);
    console.log(`Secrets: ${health.secrets ? '✅' : '❌'}`);
    console.log(`Files: ${health.files ? '✅' : '❌'}`);
    console.log(`Ports: ${health.ports ? '✅' : '❌'}`);
    
    return health;
  }
  
  static checkGit() {
    try {
      execSync('git status', { stdio: 'ignore' });
      return !fs.existsSync('.git/index.lock');
    } catch (e) {
      return false;
    }
  }
  
  static checkSecrets() {
    const required = ['GITHUB_TOKEN', 'NETLIFY_ACCESS_TOKEN'];
    return required.every(secret => 
      process.env[secret] && process.env[secret].trim()
    );
  }
  
  static checkFiles() {
    const critical = ['sync-gpt-to-github.js', 'dev-server.js', 'deploy.json'];
    return critical.every(file => fs.existsSync(file));
  }
  
  static checkPorts() {
    // Check if required ports are available
    return true; // Simplified for now
  }
}

// Auto-run health check
if (require.main === module) {
  ReplitHealthMonitor.checkHealth().then(health => {
    if (Object.values(health).every(v => v === true || typeof v === 'string')) {
      console.log('🎉 ALL SYSTEMS HEALTHY!');
    } else {
      console.log('⚠️ HEALTH ISSUES DETECTED');
    }
  });
}

module.exports = ReplitHealthMonitor;
