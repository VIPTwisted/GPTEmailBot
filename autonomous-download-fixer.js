
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

class AutonomousDownloadFixer {
  constructor() {
    this.downloadedFiles = [];
    this.installedPackages = [];
    this.fixedDependencies = [];
    this.errors = [];
    
    console.log('⬇️ AUTONOMOUS DOWNLOAD FIXER INITIATED');
    console.log('🔄 INTELLIGENT DEPENDENCY MANAGEMENT SYSTEM');
    console.log('=' .repeat(70));
  }

  async executeAutonomousDownloadFix() {
    console.log('\n🚀 EXECUTING AUTONOMOUS DOWNLOAD & FIX SYSTEM...');
    
    const fixSequence = [
      () => this.scanForMissingDependencies(),
      () => this.downloadEssentialPackages(),
      () => this.fixPackageJson(),
      () => this.installMissingNodeModules(),
      () => this.downloadMissingAssets(),
      () => this.fixDownloadErrors(),
      () => this.createDownloadRecoverySystem(),
      () => this.validateAllDownloads()
    ];

    for (const fix of fixSequence) {
      try {
        await fix();
        console.log(`✅ Completed: ${fix.name}`);
      } catch (error) {
        console.error(`❌ Failed: ${fix.name} - ${error.message}`);
        this.errors.push({
          step: fix.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return this.generateDownloadReport();
  }

  async scanForMissingDependencies() {
    console.log('\n🔍 SCANNING FOR MISSING DEPENDENCIES...');
    
    const packageJsonPath = 'package.json';
    let packageData = {};
    
    if (fs.existsSync(packageJsonPath)) {
      packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } else {
      console.log('📦 No package.json found, creating one...');
      packageData = {
        name: 'autonomous-system',
        version: '1.0.0',
        dependencies: {},
        devDependencies: {}
      };
    }

    // Scan all JS files for missing dependencies
    const jsFiles = this.getAllJavaScriptFiles();
    const requiredPackages = new Set();

    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Extract require statements
        const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
        requireMatches.forEach(match => {
          const packageName = match.match(/require\(['"`]([^'"`]+)['"`]\)/)[1];
          if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
            requiredPackages.add(packageName);
          }
        });

        // Extract import statements
        const importMatches = content.match(/import .+ from ['"`]([^'"`]+)['"`]/g) || [];
        importMatches.forEach(match => {
          const packageName = match.match(/from ['"`]([^'"`]+)['"`]/)[1];
          if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
            requiredPackages.add(packageName);
          }
        });
      } catch (error) {
        console.log(`⚠️ Could not scan ${file}: ${error.message}`);
      }
    }

    console.log(`📋 Found ${requiredPackages.size} required packages`);
    this.requiredPackages = Array.from(requiredPackages);
    return this.requiredPackages;
  }

  async downloadEssentialPackages() {
    console.log('\n📦 DOWNLOADING ESSENTIAL PACKAGES...');
    
    const essentialPackages = [
      'express', 'cors', 'helmet', 'dotenv', 'fs-extra',
      'axios', 'lodash', 'moment', 'uuid', 'chalk',
      'glob', 'commander', 'inquirer', 'morgan',
      'compression', 'multer', 'jsonwebtoken', 'bcrypt',
      'nodemailer', 'socket.io', 'sharp', 'jimp'
    ];

    const allPackages = [...new Set([...this.requiredPackages, ...essentialPackages])];
    
    // Create package groups for faster installation
    const packageGroups = [];
    for (let i = 0; i < allPackages.length; i += 10) {
      packageGroups.push(allPackages.slice(i, i + 10));
    }

    for (const group of packageGroups) {
      try {
        console.log(`📦 Installing package group: ${group.join(', ')}`);
        
        const installCommand = `npm install ${group.join(' ')} --save`;
        execSync(installCommand, { 
          stdio: 'pipe',
          timeout: 60000 
        });
        
        this.installedPackages.push(...group);
        console.log(`✅ Successfully installed: ${group.join(', ')}`);
        
      } catch (error) {
        console.log(`❌ Group installation failed, trying individual packages...`);
        
        // Try installing packages individually
        for (const packageName of group) {
          try {
            execSync(`npm install ${packageName} --save`, { 
              stdio: 'pipe',
              timeout: 30000 
            });
            this.installedPackages.push(packageName);
            console.log(`✅ Individual install: ${packageName}`);
          } catch (individualError) {
            console.log(`❌ Failed to install ${packageName}: ${individualError.message}`);
            this.errors.push({
              type: 'package_install',
              package: packageName,
              error: individualError.message
            });
          }
        }
      }
    }

    console.log(`🎯 Successfully installed ${this.installedPackages.length} packages`);
  }

  async fixPackageJson() {
    console.log('\n📝 FIXING PACKAGE.JSON...');
    
    const packageJsonPath = 'package.json';
    let packageData;

    if (fs.existsSync(packageJsonPath)) {
      packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } else {
      packageData = {
        name: 'autonomous-system',
        version: '1.0.0'
      };
    }

    // Ensure essential scripts exist
    packageData.scripts = packageData.scripts || {};
    packageData.scripts.start = packageData.scripts.start || 'node index.js';
    packageData.scripts.dev = packageData.scripts.dev || 'node dev-server.js';
    packageData.scripts.test = packageData.scripts.test || 'node comprehensive-system-tester.js';
    packageData.scripts.build = packageData.scripts.build || 'node build.js';
    packageData.scripts.deploy = packageData.scripts.deploy || 'node sync-gpt-to-github.js --sync';

    // Add essential dependencies if missing
    packageData.dependencies = packageData.dependencies || {};
    packageData.devDependencies = packageData.devDependencies || {};

    // Add Node.js engine specification
    packageData.engines = packageData.engines || {};
    packageData.engines.node = packageData.engines.node || '>=18.0.0';
    packageData.engines.npm = packageData.engines.npm || '>=8.0.0';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
    console.log('✅ Fixed and updated package.json');
    
    this.fixedDependencies.push('package.json configuration');
  }

  async installMissingNodeModules() {
    console.log('\n📂 INSTALLING MISSING NODE_MODULES...');
    
    // Remove corrupted node_modules if exists
    if (fs.existsSync('node_modules')) {
      try {
        const stats = fs.statSync('node_modules');
        const isOld = Date.now() - stats.mtime.getTime() > 24 * 60 * 60 * 1000; // 24 hours
        
        if (isOld) {
          console.log('🗑️ Removing old node_modules...');
          execSync('rm -rf node_modules package-lock.json', { stdio: 'pipe' });
        }
      } catch (error) {
        console.log('⚠️ Could not check node_modules age');
      }
    }

    // Clean npm cache
    try {
      execSync('npm cache clean --force', { stdio: 'pipe' });
      console.log('✅ Cleaned npm cache');
    } catch (error) {
      console.log('⚠️ Could not clean npm cache');
    }

    // Install all dependencies
    try {
      console.log('📦 Running npm install...');
      execSync('npm install', { 
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 180000  // 3 minutes timeout
      });
      console.log('✅ npm install completed successfully');
      
      this.fixedDependencies.push('node_modules installation');
      
    } catch (error) {
      console.log('❌ npm install failed, trying yarn...');
      
      try {
        execSync('yarn install', { 
          stdio: 'pipe',
          timeout: 180000 
        });
        console.log('✅ yarn install completed successfully');
        this.fixedDependencies.push('node_modules installation (via yarn)');
      } catch (yarnError) {
        console.log('❌ Both npm and yarn failed');
        this.errors.push({
          type: 'dependency_install',
          npmError: error.message,
          yarnError: yarnError.message
        });
      }
    }
  }

  async downloadMissingAssets() {
    console.log('\n🖼️ DOWNLOADING MISSING ASSETS...');
    
    const assetsToDownload = [
      {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        path: 'public/css/bootstrap.min.css'
      },
      {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        path: 'public/js/bootstrap.bundle.min.js'
      },
      {
        url: 'https://code.jquery.com/jquery-3.7.1.min.js',
        path: 'public/js/jquery.min.js'
      },
      {
        url: 'https://cdn.jsdelivr.net/npm/chart.js',
        path: 'public/js/chart.min.js'
      }
    ];

    // Ensure directories exist
    ['public', 'public/css', 'public/js', 'public/images'].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    for (const asset of assetsToDownload) {
      try {
        if (!fs.existsSync(asset.path)) {
          console.log(`⬇️ Downloading ${asset.url}...`);
          await this.downloadFile(asset.url, asset.path);
          this.downloadedFiles.push(asset.path);
          console.log(`✅ Downloaded: ${asset.path}`);
        } else {
          console.log(`✅ Already exists: ${asset.path}`);
        }
      } catch (error) {
        console.log(`❌ Failed to download ${asset.url}: ${error.message}`);
        this.errors.push({
          type: 'asset_download',
          url: asset.url,
          path: asset.path,
          error: error.message
        });
      }
    }

    console.log(`🎯 Downloaded ${this.downloadedFiles.length} assets`);
  }

  async downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            resolve();
          });
          
          file.on('error', (error) => {
            fs.unlink(filePath, () => {}); // Delete partial file
            reject(error);
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  async fixDownloadErrors() {
    console.log('\n🔧 FIXING DOWNLOAD ERRORS...');
    
    // Retry failed downloads
    const failedDownloads = this.errors.filter(e => e.type === 'asset_download');
    
    for (const failedDownload of failedDownloads) {
      try {
        console.log(`🔄 Retrying download: ${failedDownload.url}`);
        await this.downloadFile(failedDownload.url, failedDownload.path);
        this.downloadedFiles.push(failedDownload.path);
        console.log(`✅ Retry successful: ${failedDownload.path}`);
        
        // Remove from errors array
        const errorIndex = this.errors.indexOf(failedDownload);
        this.errors.splice(errorIndex, 1);
        
      } catch (error) {
        console.log(`❌ Retry failed: ${failedDownload.url}`);
      }
    }

    // Create fallback files for critical missing assets
    const criticalFiles = [
      'public/css/bootstrap.min.css',
      'public/js/bootstrap.bundle.min.js',
      'public/js/jquery.min.js'
    ];

    for (const criticalFile of criticalFiles) {
      if (!fs.existsSync(criticalFile)) {
        console.log(`🔧 Creating fallback for: ${criticalFile}`);
        
        const fallbackContent = criticalFile.endsWith('.css') ? 
          '/* Fallback CSS file */' : 
          '/* Fallback JS file */';
          
        fs.writeFileSync(criticalFile, fallbackContent);
        this.fixedDependencies.push(`Fallback created: ${criticalFile}`);
      }
    }
  }

  async createDownloadRecoverySystem() {
    console.log('\n🛡️ CREATING DOWNLOAD RECOVERY SYSTEM...');
    
    const recoveryScript = `#!/usr/bin/env node
// Autonomous Download Recovery System
const fs = require('fs');
const https = require('https');

class DownloadRecovery {
  static async checkAndRecover() {
    console.log('🔍 Checking for missing downloads...');
    
    const criticalAssets = [
      'public/css/bootstrap.min.css',
      'public/js/bootstrap.bundle.min.js',
      'public/js/jquery.min.js',
      'node_modules'
    ];

    let missingAssets = [];
    
    for (const asset of criticalAssets) {
      if (!fs.existsSync(asset)) {
        missingAssets.push(asset);
        console.log(\`❌ Missing: \${asset}\`);
      }
    }

    if (missingAssets.length > 0) {
      console.log('🚨 Missing assets detected, initiating recovery...');
      const { execSync } = require('child_process');
      
      try {
        execSync('node autonomous-download-fixer.js', { stdio: 'inherit' });
        console.log('✅ Download recovery completed');
      } catch (error) {
        console.error('❌ Download recovery failed:', error.message);
      }
    } else {
      console.log('✅ All critical assets present');
    }
  }

  static startMonitoring() {
    console.log('👁️ Starting download monitoring...');
    
    setInterval(() => {
      this.checkAndRecover();
    }, 60000); // Check every minute
  }
}

if (require.main === module) {
  DownloadRecovery.checkAndRecover().then(() => {
    DownloadRecovery.startMonitoring();
  });
}

module.exports = DownloadRecovery;`;

    fs.writeFileSync('download-recovery-system.js', recoveryScript);
    console.log('✅ Created download recovery system');
    
    this.fixedDependencies.push('Download recovery system');
  }

  async validateAllDownloads() {
    console.log('\n✅ VALIDATING ALL DOWNLOADS...');
    
    let validAssets = 0;
    let invalidAssets = 0;

    // Check downloaded files
    for (const filePath of this.downloadedFiles) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          validAssets++;
          console.log(`✅ Valid: ${filePath} (${stats.size} bytes)`);
        } else {
          invalidAssets++;
          console.log(`❌ Empty file: ${filePath}`);
        }
      } else {
        invalidAssets++;
        console.log(`❌ Missing: ${filePath}`);
      }
    }

    // Check installed packages
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = Object.keys(packageData.dependencies || {});
      
      console.log(`📦 Dependencies in package.json: ${dependencies.length}`);
      console.log(`📦 Packages installed: ${this.installedPackages.length}`);
    }

    console.log(`\n🎯 VALIDATION RESULTS:`);
    console.log(`✅ Valid assets: ${validAssets}`);
    console.log(`❌ Invalid assets: ${invalidAssets}`);
    
    return { valid: validAssets, invalid: invalidAssets };
  }

  generateDownloadReport() {
    console.log('\n📊 GENERATING DOWNLOAD REPORT...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        packages_installed: this.installedPackages.length,
        files_downloaded: this.downloadedFiles.length,
        dependencies_fixed: this.fixedDependencies.length,
        errors_encountered: this.errors.length
      },
      installed_packages: this.installedPackages,
      downloaded_files: this.downloadedFiles,
      fixed_dependencies: this.fixedDependencies,
      errors: this.errors
    };

    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }

    fs.writeFileSync('logs/autonomous-download-report.json', 
      JSON.stringify(report, null, 2));
    
    console.log('\n🎉 AUTONOMOUS DOWNLOAD FIX COMPLETE!');
    console.log('=' .repeat(70));
    console.log(`📦 Packages Installed: ${this.installedPackages.length}`);
    console.log(`⬇️ Files Downloaded: ${this.downloadedFiles.length}`);
    console.log(`🔧 Dependencies Fixed: ${this.fixedDependencies.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    return {
      success: this.errors.length === 0,
      report: report
    };
  }

  getAllJavaScriptFiles() {
    const files = [];
    const excludeDirs = ['.git', 'node_modules', '.cache', 'logs'];
    
    function scanDir(dir) {
      if (!fs.existsSync(dir)) return;
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory() && !excludeDirs.includes(item.name)) {
            scanDir(fullPath);
          } else if (item.isFile() && item.name.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }
    
    scanDir('.');
    return files;
  }
}

// Execute autonomous download fix if run directly
if (require.main === module) {
  const fixer = new AutonomousDownloadFixer();
  
  fixer.executeAutonomousDownloadFix().then(result => {
    if (result.success) {
      console.log('\n🚀 ALL DOWNLOADS AND DEPENDENCIES FIXED!');
      process.exit(0);
    } else {
      console.log('\n⚠️ SOME DOWNLOAD ISSUES REMAIN - CHECK REPORT');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Autonomous download fix failed:', error.message);
    process.exit(1);
  });
}

module.exports = AutonomousDownloadFixer;
