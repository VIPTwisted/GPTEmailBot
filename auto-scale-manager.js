
const fs = require('fs');
const DynamicRepoManager = require('./dynamic-repo-manager');

class AutoScaleManager {
  constructor(githubToken) {
    this.token = githubToken;
    this.repoManager = new DynamicRepoManager(githubToken);
    this.scalingConfig = this.loadScalingConfig();
  }

  loadScalingConfig() {
    const defaultConfig = {
      maxReposPerSync: 50,
      batchSize: 5,
      rateLimitDelay: 1000,
      autoDiscoveryInterval: 24 * 60 * 60 * 1000, // 24 hours
      priorityThresholds: {
        high: 8,
        medium: 5,
        low: 2
      },
      fileProcessing: {
        maxFilesPerRepo: 10000,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        excludePatterns: [
          '*.log', '*.tmp', '*.cache', '*.lock',
          'node_modules/**', '.git/**', 'build/**',
          'dist/**', 'coverage/**', '.nyc_output/**'
        ]
      }
    };

    try {
      if (fs.existsSync('config/scaling-config.json')) {
        const loaded = JSON.parse(fs.readFileSync('config/scaling-config.json', 'utf8'));
        return { ...defaultConfig, ...loaded };
      }
    } catch (error) {
      console.error('❌ Failed to load scaling config:', error.message);
    }

    return defaultConfig;
  }

  // Auto-scale based on repository count and activity
  async autoScale() {
    console.log('🔄 Auto-scaling analysis starting...');
    
    try {
      // Discover all repositories
      const allRepos = await this.repoManager.discoverAllRepos();
      console.log(`📊 Discovered ${allRepos.length} total repositories`);
      
      // Categorize by priority and activity
      const categorized = this.categorizeRepos(allRepos);
      
      // Adjust processing strategy based on scale
      const strategy = this.determineProcessingStrategy(allRepos.length);
      
      console.log(`🎯 Auto-scale strategy: ${strategy.name}`);
      console.log(`📊 Repositories by priority: High(${categorized.high.length}) Medium(${categorized.medium.length}) Low(${categorized.low.length})`);
      
      // Update deploy.json with optimized configuration
      await this.updateOptimizedConfig(allRepos, strategy);
      
      return {
        success: true,
        totalRepos: allRepos.length,
        strategy: strategy.name,
        categories: {
          high: categorized.high.length,
          medium: categorized.medium.length,
          low: categorized.low.length
        }
      };
    } catch (error) {
      console.error('❌ Auto-scaling failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  categorizeRepos(repos) {
    const categories = { high: [], medium: [], low: [] };
    
    repos.forEach(repo => {
      const score = this.calculateRepoScore(repo);
      
      if (score >= this.scalingConfig.priorityThresholds.high) {
        categories.high.push(repo);
      } else if (score >= this.scalingConfig.priorityThresholds.medium) {
        categories.medium.push(repo);
      } else {
        categories.low.push(repo);
      }
    });
    
    return categories;
  }

  calculateRepoScore(repo) {
    let score = 5; // Base score
    
    // Recent activity bonus
    const daysSinceUpdate = (Date.now() - new Date(repo.last_updated)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 1) score += 3;
    else if (daysSinceUpdate < 7) score += 2;
    else if (daysSinceUpdate < 30) score += 1;
    
    // Size consideration
    if (repo.size > 10000) score += 2; // Large active repos
    if (repo.size < 100) score -= 1; // Very small repos
    
    // Language popularity
    const popularLanguages = ['JavaScript', 'Python', 'TypeScript', 'Java', 'Go'];
    if (popularLanguages.includes(repo.language)) score += 1;
    
    // Name patterns (GPT, main projects)
    if (repo.repo_name.includes('GPT') || repo.repo_name.includes('Main') || repo.repo_name.includes('Core')) {
      score += 2;
    }
    
    return Math.max(1, Math.min(10, score)); // Clamp between 1-10
  }

  determineProcessingStrategy(repoCount) {
    if (repoCount <= 10) {
      return {
        name: 'Small Scale',
        batchSize: repoCount,
        maxConcurrent: 3,
        rateLimitDelay: 1000
      };
    } else if (repoCount <= 50) {
      return {
        name: 'Medium Scale',
        batchSize: 5,
        maxConcurrent: 5,
        rateLimitDelay: 2000
      };
    } else if (repoCount <= 200) {
      return {
        name: 'Large Scale',
        batchSize: 10,
        maxConcurrent: 3,
        rateLimitDelay: 3000
      };
    } else {
      return {
        name: 'Enterprise Scale',
        batchSize: 20,
        maxConcurrent: 2,
        rateLimitDelay: 5000
      };
    }
  }

  async updateOptimizedConfig(repos, strategy) {
    const optimizedConfig = {
      repos: repos,
      default_repo: repos[0]?.repo_name || 'ToyParty',
      auto_create_repos: true,
      last_auto_update: new Date().toISOString(),
      total_repos: repos.length,
      scaling_strategy: strategy,
      discovery_settings: {
        auto_discover: true,
        discovery_interval_hours: 24,
        include_private: false,
        min_size_kb: 0
      },
      processing_config: {
        batch_processing: true,
        max_concurrent_syncs: strategy.maxConcurrent,
        rate_limit_delay_ms: strategy.rateLimitDelay,
        file_processing: this.scalingConfig.fileProcessing
      }
    };

    fs.writeFileSync('deploy.json', JSON.stringify(optimizedConfig, null, 2));
    console.log(`✅ Updated deploy.json with optimized configuration for ${repos.length} repositories`);
  }
}

module.exports = AutoScaleManager;

// Auto-run if executed directly
if (require.main === module) {
  const manager = new AutoScaleManager(process.env.GITHUB_TOKEN);
  
  manager.autoScale().then(result => {
    if (result.success) {
      console.log('🎉 Auto-scaling completed successfully!');
      console.log(`📊 Total repos: ${result.totalRepos}`);
      console.log(`🎯 Strategy: ${result.strategy}`);
    } else {
      console.error('❌ Auto-scaling failed:', result.error);
    }
  }).catch(error => {
    console.error('❌ Auto-scaling error:', error.message);
  });
}
