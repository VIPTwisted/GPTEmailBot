const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NuclearMassPackageInstaller {
  constructor() {
    this.installedPackages = [];
    this.failedPackages = [];
    this.startTime = Date.now();

    console.log('💥 NUCLEAR MASS PACKAGE INSTALLER INITIATED');
    console.log('🚀 ELITE-LEVEL DEPENDENCY INSTALLATION SYSTEM');
    console.log('=' .repeat(80));
  }

  async executeNuclearInstallation() {
    console.log('\n🔥 EXECUTING NUCLEAR MASS PACKAGE INSTALLATION...');

    const installationSequence = [
      () => this.emergencyCleanup(),
      () => this.installCorePackages(),
      () => this.installWebFrameworks(),
      () => this.installDevelopmentTools(),
      () => this.installUtilityPackages(),
      () => this.installDatabasePackages(),
      () => this.installTestingPackages(),
      () => this.installProductionPackages(),
      () => this.validateInstallations(),
      () => this.generateInstallationReport()
    ];

    for (const step of the installationSequence) {
      try {
        await step();
        console.log(`✅ Completed: ${step.name}`);
        await this.sleep(1000);
      } catch (error) {
        console.error(`❌ Failed: ${step.name} - ${error.message}`);
      }
    }

    return this.generateFinalReport();
  }

  async emergencyCleanup() {
    console.log('\n🧹 EMERGENCY CLEANUP...');

    const cleanupCommands = [
      'npm cache clean --force',
      'rm -rf node_modules/.cache',
      'rm -rf package-lock.json'
    ];

    for (const command of cleanupCommands) {
      try {
        this.executeCommand(command);
        console.log(`✅ ${command}`);
      } catch (error) {
        console.log(`⚠️ ${command} - continuing...`);
      }
    }
  }

  async installCorePackages() {
    console.log('\n📦 INSTALLING CORE PACKAGES...');

    const corePackages = [
      'express', 'cors', 'helmet', 'dotenv', 'fs-extra',
      'axios', 'lodash', 'moment', 'uuid', 'chalk'
    ];

    await this.installPackageGroup('Core Packages', corePackages);
  }

  async installWebFrameworks() {
    console.log('\n🌐 INSTALLING WEB FRAMEWORKS...');

    const webPackages = [
      'body-parser', 'morgan', 'compression', 'multer',
      'cookie-parser', 'express-session', 'passport'
    ];

    await this.installPackageGroup('Web Frameworks', webPackages);
  }

  async installDevelopmentTools() {
    console.log('\n🔧 INSTALLING DEVELOPMENT TOOLS...');

    const devPackages = [
      'nodemon', 'concurrently', 'cross-env', 'rimraf',
      'glob', 'commander', 'inquirer', 'debug'
    ];

    await this.installPackageGroup('Development Tools', devPackages);
  }

  async installUtilityPackages() {
    console.log('\n🛠️ INSTALLING UTILITY PACKAGES...');

    const utilityPackages = [
      'bcrypt', 'jsonwebtoken', 'validator', 'sanitize-html',
      'sharp', 'jimp', 'pdf-lib', 'csv-parser'
    ];

    await this.installPackageGroup('Utility Packages', utilityPackages);
  }

  async installDatabasePackages() {
    console.log('\n🗄️ INSTALLING DATABASE PACKAGES...');

    const databasePackages = [
      'mongoose', 'sequelize', 'pg', 'mysql2',
      'redis', 'sqlite3', 'typeorm'
    ];

    await this.installPackageGroup('Database Packages', databasePackages);
  }

  async installTestingPackages() {
    console.log('\n🧪 INSTALLING TESTING PACKAGES...');

    const testingPackages = [
      'jest', 'mocha', 'chai', 'supertest',
      'cypress', 'puppeteer', 'playwright'
    ];

    await this.installPackageGroup('Testing Packages', testingPackages);
  }

  async installProductionPackages() {
    console.log('\n🚀 INSTALLING PRODUCTION PACKAGES...');

    const productionPackages = [
      'pm2', 'winston', 'cluster', 'compression',
      'helmet', 'rate-limiter-flexible', 'express-validator'
    ];

    await this.installPackageGroup('Production Packages', productionPackages);
  }

  async installPackageGroup(groupName, packages) {
    console.log(`\n📋 Installing ${groupName}: ${packages.join(', ')}`);

    // Try batch installation first
    try {
      const batchCommand = `npm install ${packages.join(' ')} --save`;
      this.executeCommand(batchCommand);
      this.installedPackages.push(...packages);
      console.log(`✅ Successfully installed ${groupName} (batch)`);
      return;
    } catch (error) {
      console.log(`⚠️ Batch installation failed for ${groupName}, trying individual...`);
    }

    // Install packages individually if batch fails
    for (const packageName of packages) {
      try {
        console.log(`📦 Installing ${packageName}...`);
        this.executeCommand(`npm install ${packageName} --save`);
        this.installedPackages.push(packageName);
        console.log(`✅ ${packageName} installed successfully`);
      } catch (error) {
        console.log(`❌ Failed to install ${packageName}: ${error.message}`);
        this.failedPackages.push({ name: packageName, error: error.message });
      }
    }
  }

  executeCommand(command) {
    try {
      console.log(`🔧 Executing: ${command}`);
      const result = execSync(command, { 
        stdio: 'pipe', 
        encoding: 'utf8',
        timeout: 60000 
      });
      return result;
    } catch (error) {
      throw new Error(`Command failed: ${command} - ${error.message}`);
    }
  }

  async validateInstallations() {
    console.log('\n✅ VALIDATING INSTALLATIONS...');

    let validPackages = 0;
    let invalidPackages = 0;

    for (const packageName of this.installedPackages) {
      try {
        require.resolve(packageName);
        validPackages++;
        console.log(`✅ ${packageName} - Available`);
      } catch (error) {
        invalidPackages++;
        console.log(`❌ ${packageName} - Not available`);
        this.failedPackages.push({ name: packageName, error: 'Not found after installation' });
      }
    }

    console.log(`\n🎯 VALIDATION RESULTS:`);
    console.log(`✅ Valid packages: ${validPackages}`);
    console.log(`❌ Invalid packages: ${invalidPackages}`);

    return { valid: validPackages, invalid: invalidPackages };
  }

  async generateInstallationReport() {
    console.log('\n📊 GENERATING INSTALLATION REPORT...');

    const report = {
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - this.startTime,
      summary: {
        total_attempted: this.installedPackages.length + this.failedPackages.length,
        successful_installs: this.installedPackages.length,
        failed_installs: this.failedPackages.length,
        success_rate: Math.round((this.installedPackages.length / (this.installedPackages.length + this.failedPackages.length)) * 100)
      },
      installed_packages: this.installedPackages,
      failed_packages: this.failedPackages
    };

    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }

    fs.writeFileSync('logs/nuclear-mass-installation-report.json', 
      JSON.stringify(report, null, 2));

    console.log('✅ Installation report saved to logs/nuclear-mass-installation-report.json');
  }

  generateFinalReport() {
    const executionTime = Math.round((Date.now() - this.startTime) / 1000);

    console.log('\n🎉 NUCLEAR MASS PACKAGE INSTALLATION COMPLETE!');
    console.log('=' .repeat(80));
    console.log(`📦 Total Packages Installed: ${this.installedPackages.length}`);
    console.log(`❌ Failed Installations: ${this.failedPackages.length}`);
    console.log(`⏱️ Execution Time: ${executionTime} seconds`);
    console.log(`📈 Success Rate: ${Math.round((this.installedPackages.length / (this.installedPackages.length + this.failedPackages.length)) * 100)}%`);

    if (this.failedPackages.length === 0) {
      console.log('\n✅ ALL PACKAGES INSTALLED SUCCESSFULLY!');
      console.log('🚀 SYSTEM READY FOR NUCLEAR DEPLOYMENT!');
      return { success: true, message: 'All packages installed successfully' };
    } else {
      console.log('\n⚠️ SOME PACKAGES FAILED TO INSTALL');
      console.log('📋 Check installation report for details');
      return { 
        success: false, 
        message: `${this.failedPackages.length} packages failed to install`,
        failedCount: this.failedPackages.length 
      };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute nuclear mass package installation if run directly
if (require.main === module) {
  const installer = new NuclearMassPackageInstaller();

  installer.executeNuclearInstallation().then(result => {
    if (result.success) {
      console.log('\n🚀 NUCLEAR MASS INSTALLATION SUCCESSFUL!');
      process.exit(0);
    } else {
      console.log('\n⚠️ NUCLEAR MASS INSTALLATION PARTIAL SUCCESS');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Nuclear mass installation failed catastrophically:', error.message);
    process.exit(1);
  });
}

module.exports = NuclearMassPackageInstaller;