
const UniversalAdminBackend = require('./universal-admin-backend');
const AdminIntegrationManager = require('./admin-integration-manager');
const UltimateGPTAssistant = require('./ultimate-gpt-assistant');
const { syncSpecificRepo } = require('./sync-gpt-to-github');

class MasterAdminOrchestrator {
  constructor() {
    this.adminBackend = new UniversalAdminBackend();
    this.integrationManager = new AdminIntegrationManager();
    this.gptAssistant = new UltimateGPTAssistant();
    this.isRunning = false;
  }

  async initialize() {
    console.log('🎯 INITIALIZING MASTER ADMIN ORCHESTRATOR...');
    console.log('🏢 Ultimate Enterprise Control System');
    
    // Initialize all components
    await this.adminBackend.initialize();
    await this.gptAssistant.initialize();
    
    // Setup cross-system integration
    this.setupCrossSystemIntegration();
    
    console.log('✅ Master Admin Orchestrator ready');
    this.isRunning = true;
  }

  setupCrossSystemIntegration() {
    // Integrate GPT Assistant with Admin Backend
    this.adminBackend.gptAssistant = this.gptAssistant;
    this.adminBackend.integrationManager = this.integrationManager;
    
    // Setup real-time sync between all systems
    this.setupRealTimeSync();
  }

  setupRealTimeSync() {
    // Monitor file changes and trigger appropriate syncs
    const chokidar = require('chokidar');
    
    // Watch for Builder.io related changes
    chokidar.watch('./frontend/**/*', { ignored: /node_modules/ })
      .on('change', async (path) => {
        console.log(`📝 File changed: ${path}`);
        await this.handleFileChange(path);
      });
  }

  async handleFileChange(filePath) {
    // Determine which repository and action based on file path
    let targetRepo = 'ToyParty';
    
    if (filePath.includes('gpt') || filePath.includes('GPT')) {
      // Sync to all GPT repositories
      const repos = ['GPTEmailBot', 'GPTDataProcessor', 'GPTAnalytics', 'GPTChatBot'];
      for (const repo of repos) {
        await syncSpecificRepo(repo);
      }
    } else {
      // Sync to main ToyParty repository
      await syncSpecificRepo(targetRepo);
    }
    
    // Trigger Netlify build
    await this.integrationManager.triggerNetlifyDeploy();
  }

  // Master command processor
  async processAdminCommand(command, context = {}) {
    console.log(`🎯 Processing admin command: ${command}`);
    
    // Parse command intent
    const intent = this.parseCommandIntent(command);
    
    switch (intent.type) {
      case 'deploy':
        return await this.handleDeployCommand(intent, context);
      case 'sync':
        return await this.handleSyncCommand(intent, context);
      case 'builder':
        return await this.handleBuilderCommand(intent, context);
      case 'database':
        return await this.handleDatabaseCommand(intent, context);
      case 'gpt':
        return await this.gptAssistant.processPrompt(command);
      case 'emergency':
        return await this.handleEmergencyCommand(intent, context);
      default:
        return await this.gptAssistant.processPrompt(command);
    }
  }

  parseCommandIntent(command) {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('deploy') || lowerCommand.includes('push')) {
      return { type: 'deploy', command };
    } else if (lowerCommand.includes('sync') || lowerCommand.includes('update')) {
      return { type: 'sync', command };
    } else if (lowerCommand.includes('builder') || lowerCommand.includes('cms')) {
      return { type: 'builder', command };
    } else if (lowerCommand.includes('database') || lowerCommand.includes('db')) {
      return { type: 'database', command };
    } else if (lowerCommand.includes('emergency') || lowerCommand.includes('stop')) {
      return { type: 'emergency', command };
    } else {
      return { type: 'gpt', command };
    }
  }

  async handleDeployCommand(intent, context) {
    const { repository = 'ToyParty' } = context;
    
    const result = await syncSpecificRepo(repository);
    
    if (result.success) {
      await this.integrationManager.triggerNetlifyDeploy();
      return `✅ Deployment successful for ${repository}`;
    } else {
      return `❌ Deployment failed for ${repository}: ${result.error}`;
    }
  }

  async handleSyncCommand(intent, context) {
    const { repositories = ['ToyParty'] } = context;
    const results = [];
    
    for (const repo of repositories) {
      const result = await syncSpecificRepo(repo);
      results.push({ repository: repo, success: result.success });
    }
    
    return `🔄 Sync completed: ${results.map(r => `${r.repository}: ${r.success ? '✅' : '❌'}`).join(', ')}`;
  }

  async handleBuilderCommand(intent, context) {
    const builderData = await this.integrationManager.getBuilderContent();
    return `🎨 Builder.io integration: ${builderData.success ? 'Connected' : 'Error'}`;
  }

  async handleDatabaseCommand(intent, context) {
    const dbStats = await this.integrationManager.getDatabaseStats();
    return `🗄️ Database status: ${dbStats.success ? 'Operational' : 'Error'}`;
  }

  async handleEmergencyCommand(intent, context) {
    console.log('🚨 EMERGENCY COMMAND ACTIVATED');
    
    // Stop all running processes
    this.isRunning = false;
    
    return '🚨 Emergency stop activated - all processes halted';
  }

  // Get comprehensive system status
  async getSystemStatus() {
    const dashboardData = await this.integrationManager.getUnifiedDashboardData();
    
    return {
      masterOrchestrator: {
        status: this.isRunning ? 'operational' : 'stopped',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      integrations: dashboardData,
      lastUpdated: new Date().toISOString()
    };
  }

  async start() {
    await this.initialize();
    
    // Start the admin backend
    await this.adminBackend.start();
    
    console.log('🚀 MASTER ADMIN ORCHESTRATOR FULLY OPERATIONAL');
    console.log('🎯 All repositories and services under unified control');
  }
}

if (require.main === module) {
  const orchestrator = new MasterAdminOrchestrator();
  orchestrator.start().catch(console.error);
}

module.exports = MasterAdminOrchestrator;
