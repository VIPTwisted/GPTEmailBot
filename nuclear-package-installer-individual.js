
/**
 * NUCLEAR INDIVIDUAL PACKAGE INSTALLER
 * Installs packages one by one with maximum error recovery
 */

const { execSync } = require('child_process');
const fs = require('fs');

class NuclearIndividualPackageInstaller {
  constructor() {
    this.installedPackages = [];
    this.failedPackages = [];
    this.retryAttempts = {};
    this.maxRetries = 3;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔧';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async installPackageIndividually(packageName) {
    this.log(`Starting installation of: ${packageName}`);
    
    const installCommands = [
      `npm install ${packageName} --save`,
      `npm install ${packageName} --save --force`,
      `npm install ${packageName} --save --legacy-peer-deps`,
      `yarn add ${packageName}`,
      `npm install ${packageName} --save --no-optional`
    ];

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      for (const command of installCommands) {
        try {
          this.log(`Attempt ${attempt}/${this.maxRetries}: ${command}`, 'info');
          
          const result = execSync(command, { 
            stdio: 'pipe',
            timeout: 120000, // 2 minutes per package
            encoding: 'utf8'
          });

          this.log(`Successfully installed: ${packageName}`, 'success');
          this.installedPackages.push(packageName);
          return true;

        } catch (error) {
          this.log(`Command failed: ${error.message.slice(0, 200)}`, 'error');
          
          // Try next command
          continue;
        }
      }
      
      // Wait before retry
      if (attempt < this.maxRetries) {
        this.log(`Waiting 5 seconds before retry...`);
        await this.sleep(5000);
      }
    }

    this.log(`Failed to install: ${packageName} after all attempts`, 'error');
    this.failedPackages.push(packageName);
    return false;
  }

  async installAllPackagesIndividually() {
    this.log('🚀 STARTING NUCLEAR INDIVIDUAL PACKAGE INSTALLATION');
    
    const essentialPackages = [
      'express',
      'cors',
      'dotenv',
      'fs-extra',
      'axios',
      'lodash',
      'moment',
      'chalk',
      'bcrypt',
      'jsonwebtoken',
      'helmet',
      'morgan',
      'compression',
      'body-parser',
      'uuid',
      'glob',
      'commander',
      'winston',
      'nodemailer',
      'multer',
      'sharp',
      'socket.io',
      'react',
      'react-dom',
      'styled-components',
      'framer-motion',
      'react-responsive'
    ];

    this.log(`📦 Installing ${essentialPackages.length} packages individually...`);

    for (const packageName of essentialPackages) {
      await this.installPackageIndividually(packageName);
      
      // Small delay between packages to prevent overwhelming
      await this.sleep(2000);
    }

    this.generateReport();
  }

  generateReport() {
    this.log('\n📊 NUCLEAR INDIVIDUAL INSTALLATION REPORT');
    this.log('==========================================');
    this.log(`✅ Successfully installed: ${this.installedPackages.length} packages`);
    this.log(`❌ Failed installations: ${this.failedPackages.length} packages`);
    
    if (this.installedPackages.length > 0) {
      this.log('\n✅ INSTALLED PACKAGES:');
      this.installedPackages.forEach(pkg => this.log(`  - ${pkg}`));
    }

    if (this.failedPackages.length > 0) {
      this.log('\n❌ FAILED PACKAGES:');
      this.failedPackages.forEach(pkg => this.log(`  - ${pkg}`));
    }

    const successRate = Math.round((this.installedPackages.length / (this.installedPackages.length + this.failedPackages.length)) * 100);
    this.log(`\n🎯 SUCCESS RATE: ${successRate}%`);

    if (successRate >= 80) {
      this.log('🚀 INSTALLATION SUCCESSFUL - SYSTEM READY!', 'success');
    } else {
      this.log('⚠️ PARTIAL SUCCESS - SOME PACKAGES FAILED', 'error');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if run directly
if (require.main === module) {
  const installer = new NuclearIndividualPackageInstaller();
  
  installer.installAllPackagesIndividually().then(() => {
    console.log('\n🎉 NUCLEAR INDIVIDUAL PACKAGE INSTALLATION COMPLETE!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Nuclear individual installation failed:', error.message);
    process.exit(1);
  });
}

module.exports = NuclearIndividualPackageInstaller;
