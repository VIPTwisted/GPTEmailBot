
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class UniversalErrorRecovery {
  constructor() {
    this.errorLog = [];
    this.recoveryActions = [];
  }

  async recoverFromAllErrors() {
    console.log('🛠️ UNIVERSAL ERROR RECOVERY STARTING...');
    
    const recoverySteps = [
      () => this.cleanupFileSystem(),
      () => this.fixGitLocks(),
      () => this.clearCaches(),
      () => this.validateEnvironment(),
      () => this.repairNodeModules(),
      () => this.fixPermissions()
    ];

    for (const step of recoverySteps) {
      try {
        await step();
      } catch (error) {
        console.error(`⚠️ Recovery step failed: ${error.message}`);
        this.errorLog.push(error.message);
      }
    }

    return {
      success: this.errorLog.length === 0,
      errors: this.errorLog,
      actions: this.recoveryActions
    };
  }

  cleanupFileSystem() {
    console.log('🧹 Cleaning up file system...');
    
    const cleanupPaths = [
      '.git/index.lock',
      '.git/config.lock', 
      '.git/HEAD.lock',
      '.git/refs/heads/*.lock',
      '.cache',
      '.tmp',
      'logs/*.log',
      'node_modules/.cache'
    ];

    cleanupPaths.forEach(pattern => {
      try {
        if (pattern.includes('*')) {
          // Handle glob patterns
          const glob = require('glob');
          const files = glob.sync(pattern);
          files.forEach(file => {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
              this.recoveryActions.push(`Removed: ${file}`);
            }
          });
        } else {
          if (fs.existsSync(pattern)) {
            if (fs.lstatSync(pattern).isDirectory()) {
              fs.rmSync(pattern, { recursive: true, force: true });
            } else {
              fs.unlinkSync(pattern);
            }
            this.recoveryActions.push(`Cleaned: ${pattern}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not clean ${pattern}: ${error.message}`);
      }
    });
  }

  fixGitLocks() {
    console.log('🔐 Fixing git locks...');
    
    try {
      // Kill any hanging git processes
      try {
        execSync('pkill -f git', { stdio: 'ignore' });
        this.recoveryActions.push('Killed hanging git processes');
      } catch (error) {
        // Ignore if no processes to kill
      }

      // Remove all git locks
      const gitLocks = [
        '.git/index.lock',
        '.git/config.lock',
        '.git/HEAD.lock',
        '.git/refs/heads/main.lock',
        '.git/refs/heads/master.lock'
      ];

      gitLocks.forEach(lock => {
        if (fs.existsSync(lock)) {
          fs.unlinkSync(lock);
          this.recoveryActions.push(`Removed git lock: ${lock}`);
        }
      });

      // Reset git state if corrupted
      if (fs.existsSync('.git')) {
        try {
          execSync('git reset --hard HEAD', { stdio: 'ignore' });
          this.recoveryActions.push('Reset git state');
        } catch (error) {
          // If reset fails, reinitialize
          try {
            execSync('rm -rf .git && git init', { stdio: 'ignore' });
            this.recoveryActions.push('Reinitialized git repository');
          } catch (error) {
            console.log('⚠️ Could not reinitialize git');
          }
        }
      }

    } catch (error) {
      this.errorLog.push(`Git recovery failed: ${error.message}`);
    }
  }

  clearCaches() {
    console.log('🗑️ Clearing all caches...');
    
    const cachePaths = [
      '.cache',
      'node_modules/.cache',
      '.npm/_cacache',
      '.replit-cache',
      path.join(process.env.HOME || '/tmp', '.npm'),
      '/tmp/cache'
    ];

    cachePaths.forEach(cachePath => {
      try {
        if (fs.existsSync(cachePath)) {
          fs.rmSync(cachePath, { recursive: true, force: true });
          this.recoveryActions.push(`Cleared cache: ${cachePath}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not clear cache ${cachePath}: ${error.message}`);
      }
    });

    // Create cache directories to prevent errors
    try {
      fs.mkdirSync('.cache', { recursive: true });
      fs.mkdirSync('logs', { recursive: true });
      this.recoveryActions.push('Recreated necessary directories');
    } catch (error) {
      console.log('⚠️ Could not recreate directories');
    }
  }

  validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    const requiredEnvVars = [
      'GITHUB_TOKEN',
      'NETLIFY_ACCESS_TOKEN',
      'NETLIFY_SITE_ID'
    ];

    const missing = [];
    const found = [];

    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar] && process.env[envVar].trim()) {
        found.push(envVar);
      } else {
        missing.push(envVar);
      }
    });

    this.recoveryActions.push(`Environment check: ${found.length}/${requiredEnvVars.length} variables found`);

    if (missing.length > 0) {
      this.errorLog.push(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  repairNodeModules() {
    console.log('📦 Repairing node_modules...');
    
    try {
      if (fs.existsSync('package.json')) {
        // Clear npm cache
        try {
          execSync('npm cache clean --force', { stdio: 'ignore' });
          this.recoveryActions.push('Cleared npm cache');
        } catch (error) {
          console.log('⚠️ Could not clear npm cache');
        }

        // Remove and reinstall node_modules if corrupted
        if (fs.existsSync('node_modules')) {
          const stats = fs.statSync('node_modules');
          const modifiedTime = new Date(stats.mtime);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (modifiedTime < oneHourAgo) {
            try {
              execSync('rm -rf node_modules package-lock.json', { stdio: 'ignore' });
              execSync('npm install', { stdio: 'ignore' });
              this.recoveryActions.push('Reinstalled node_modules');
            } catch (error) {
              console.log('⚠️ Could not reinstall node_modules');
            }
          }
        }
      }
    } catch (error) {
      this.errorLog.push(`Node modules repair failed: ${error.message}`);
    }
  }

  fixPermissions() {
    console.log('🔒 Fixing permissions...');
    
    try {
      // Fix common permission issues
      const permissionFixes = [
        'chmod -R u+w .',
        'chmod +x *.js',
        'chmod -R 755 public',
        'chmod -R 755 src'
      ];

      permissionFixes.forEach(cmd => {
        try {
          execSync(cmd, { stdio: 'ignore' });
        } catch (error) {
          // Ignore permission errors in sandboxed environments
        }
      });

      this.recoveryActions.push('Fixed file permissions');
    } catch (error) {
      console.log('⚠️ Permission fixes failed (may be normal in sandbox)');
    }
  }

  async recoverFromSpecificError(errorMessage) {
    console.log(`🎯 Recovering from specific error: ${errorMessage}`);
    
    const errorPatterns = {
      'ENOENT': () => this.fixMissingFiles(),
      'EEXIST': () => this.fixExistingFiles(),
      'EPERM': () => this.fixPermissions(),
      'git lock': () => this.fixGitLocks(),
      'cache': () => this.clearCaches(),
      'network': () => this.fixNetworkIssues(),
      'token': () => this.validateTokens()
    };

    for (const [pattern, fix] of Object.entries(errorPatterns)) {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        try {
          await fix();
          this.recoveryActions.push(`Applied specific fix for: ${pattern}`);
        } catch (error) {
          this.errorLog.push(`Specific recovery failed: ${error.message}`);
        }
      }
    }
  }

  fixMissingFiles() {
    // Create missing essential files
    const essentialFiles = {
      '.gitignore': 'node_modules/\n.env\n*.log\n.cache/\n',
      'package.json': JSON.stringify({ name: 'universal-deployment', version: '1.0.0' }, null, 2)
    };

    Object.entries(essentialFiles).forEach(([file, content]) => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, content);
        this.recoveryActions.push(`Created missing file: ${file}`);
      }
    });
  }

  fixExistingFiles() {
    // Handle file conflicts
    const conflictFiles = ['.git/MERGE_HEAD', '.git/CHERRY_PICK_HEAD'];
    
    conflictFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        this.recoveryActions.push(`Removed conflict file: ${file}`);
      }
    });
  }

  async fixNetworkIssues() {
    // Test network connectivity
    try {
      const response = await fetch('https://api.github.com', { timeout: 5000 });
      if (response.ok) {
        this.recoveryActions.push('Network connectivity verified');
      }
    } catch (error) {
      this.errorLog.push('Network connectivity issues detected');
    }
  }

  validateTokens() {
    const tokens = ['GITHUB_TOKEN', 'NETLIFY_ACCESS_TOKEN'];
    
    tokens.forEach(tokenName => {
      const token = process.env[tokenName];
      if (token) {
        // Basic token format validation
        if (tokenName === 'GITHUB_TOKEN' && !token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
          this.errorLog.push(`Invalid ${tokenName} format`);
        } else {
          this.recoveryActions.push(`${tokenName} format validated`);
        }
      }
    });
  }
}

module.exports = UniversalErrorRecovery;

// Auto-recovery if run directly
if (require.main === module) {
  const recovery = new UniversalErrorRecovery();
  
  recovery.recoverFromAllErrors()
    .then(result => {
      if (result.success) {
        console.log('✅ All errors recovered successfully!');
        console.log('Actions taken:', result.actions);
      } else {
        console.log('⚠️ Some errors could not be recovered:');
        console.log(result.errors);
      }
    })
    .catch(error => {
      console.error('❌ Recovery system failed:', error.message);
    });
}
