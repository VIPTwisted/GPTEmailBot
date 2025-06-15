
const DatabaseManager = require('./database-manager');
const IntelligentCacheManager = require('./intelligent-cache-manager');
const fs = require('fs');

class EnterpriseAnalytics {
  constructor() {
    this.db = new DatabaseManager();
    this.cache = new IntelligentCacheManager();
    this.metrics = {
      syncs: { total: 0, successful: 0, failed: 0 },
      repos: { active: 0, inactive: 0 },
      performance: { avgSyncTime: 0, maxSyncTime: 0 },
      builds: { triggered: 0, successful: 0, failed: 0 }
    };
    
    this.startTime = Date.now();
    this.performanceLog = [];
  }

  // Initialize analytics system
  async initialize() {
    console.log('📊 Initializing Enterprise Analytics...');
    
    try {
      await this.db.initialize();
      console.log('✅ Analytics database initialized');
      
      // Load cached metrics
      const cachedMetrics = await this.cache.get('analytics:metrics');
      if (cachedMetrics) {
        this.metrics = { ...this.metrics, ...cachedMetrics };
        console.log('📦 Loaded cached analytics metrics');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error.message);
      return false;
    }
  }

  // Record sync operation
  async recordSync(repoName, result, duration = 0, triggeredBy = 'autonomous') {
    const startTime = Date.now();
    
    try {
      // Update metrics
      this.metrics.syncs.total++;
      if (result.success) {
        this.metrics.syncs.successful++;
      } else {
        this.metrics.syncs.failed++;
      }

      // Update performance metrics
      if (duration > 0) {
        this.updatePerformanceMetrics(duration);
      }

      // Log to database
      await this.db.logSync(repoName, result, triggeredBy, duration);

      // Record performance metric
      await this.db.recordMetric('sync_operation', duration, {
        repo: repoName,
        success: result.success,
        files: result.files || 0,
        triggeredBy: triggeredBy
      });

      // Log system event
      await this.db.logEvent('sync_completed', {
        repo: repoName,
        success: result.success,
        duration: duration,
        files: result.files || 0
      }, result.success ? 'INFO' : 'ERROR');

      // Cache updated metrics
      await this.cache.set('analytics:metrics', this.metrics, 60 * 60 * 1000); // 1 hour

      const recordTime = Date.now() - startTime;
      console.log(`📊 Analytics recorded for ${repoName} (${recordTime}ms)`);
    } catch (error) {
      console.error('❌ Failed to record sync analytics:', error.message);
    }
  }

  // Record build deployment
  async recordBuild(buildData, success = true) {
    try {
      this.metrics.builds.triggered++;
      if (success) {
        this.metrics.builds.successful++;
      } else {
        this.metrics.builds.failed++;
      }

      await this.db.logBuild(buildData.site_id, buildData);
      
      await this.db.logEvent('build_triggered', {
        buildId: buildData.id,
        siteId: buildData.site_id,
        success: success
      }, success ? 'INFO' : 'ERROR');

      console.log(`🏗️ Build analytics recorded: ${buildData.id}`);
    } catch (error) {
      console.error('❌ Failed to record build analytics:', error.message);
    }
  }

  // Update performance metrics
  updatePerformanceMetrics(duration) {
    this.performanceLog.push({
      duration: duration,
      timestamp: Date.now()
    });

    // Keep only last 100 performance entries
    if (this.performanceLog.length > 100) {
      this.performanceLog = this.performanceLog.slice(-100);
    }

    // Calculate averages
    const durations = this.performanceLog.map(p => p.duration);
    this.metrics.performance.avgSyncTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    this.metrics.performance.maxSyncTime = Math.max(...durations);
  }

  // Generate comprehensive analytics report
  async generateReport(timeframe = '24h') {
    console.log(`📈 Generating analytics report for ${timeframe}...`);
    
    try {
      const report = {
        generated_at: new Date().toISOString(),
        timeframe: timeframe,
        summary: {},
        details: {},
        insights: {},
        recommendations: []
      };

      // Get database insights
      const dbInsights = await this.db.getInsights();
      
      // Current metrics
      report.summary = {
        total_syncs: this.metrics.syncs.total,
        successful_syncs: this.metrics.syncs.successful,
        failed_syncs: this.metrics.syncs.failed,
        success_rate: this.metrics.syncs.total > 0 ? 
          ((this.metrics.syncs.successful / this.metrics.syncs.total) * 100).toFixed(2) + '%' : '0%',
        avg_sync_time: Math.round(this.metrics.performance.avgSyncTime) + 'ms',
        max_sync_time: Math.round(this.metrics.performance.maxSyncTime) + 'ms',
        total_builds: this.metrics.builds.triggered,
        build_success_rate: this.metrics.builds.triggered > 0 ?
          ((this.metrics.builds.successful / this.metrics.builds.triggered) * 100).toFixed(2) + '%' : '0%',
        uptime: this.getUptimeString()
      };

      // Detailed analytics from database
      if (dbInsights) {
        report.details = {
          top_performing_repos: dbInsights.top_repos || [],
          recent_failures: dbInsights.recent_failures || [],
          sync_statistics: dbInsights.sync_stats || {}
        };
      }

      // Performance insights
      report.insights = {
        performance_trend: this.analyzePerformanceTrend(),
        failure_patterns: await this.analyzeFailurePatterns(),
        optimization_opportunities: await this.identifyOptimizations()
      };

      // Generate recommendations
      report.recommendations = await this.generateRecommendations(report);

      // Cache report
      await this.cache.set(`report:${timeframe}:${Date.now()}`, report, 24 * 60 * 60 * 1000);

      console.log('✅ Analytics report generated successfully');
      return report;
    } catch (error) {
      console.error('❌ Failed to generate analytics report:', error.message);
      return null;
    }
  }

  // Analyze performance trends
  analyzePerformanceTrend() {
    if (this.performanceLog.length < 10) {
      return 'Insufficient data for trend analysis';
    }

    const recent = this.performanceLog.slice(-10);
    const older = this.performanceLog.slice(-20, -10);

    const recentAvg = recent.reduce((a, b) => a + b.duration, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.duration, 0) / older.length;

    const improvement = ((olderAvg - recentAvg) / olderAvg) * 100;

    if (improvement > 10) {
      return `Performance improving (${improvement.toFixed(1)}% faster)`;
    } else if (improvement < -10) {
      return `Performance degrading (${Math.abs(improvement).toFixed(1)}% slower)`;
    } else {
      return 'Performance stable';
    }
  }

  // Analyze failure patterns
  async analyzeFailurePatterns() {
    try {
      const failures = await this.db.getSyncHistory(50);
      const failedSyncs = failures.filter(s => !s.success);

      if (failedSyncs.length === 0) {
        return 'No recent failures to analyze';
      }

      // Group by error type
      const errorTypes = {};
      failedSyncs.forEach(sync => {
        const errorKey = sync.error_message ? sync.error_message.split(':')[0] : 'Unknown';
        errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
      });

      const mostCommonError = Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)[0];

      return {
        total_failures: failedSyncs.length,
        most_common_error: mostCommonError[0],
        error_frequency: mostCommonError[1],
        failure_rate: ((failedSyncs.length / failures.length) * 100).toFixed(2) + '%'
      };
    } catch (error) {
      return 'Failed to analyze failure patterns';
    }
  }

  // Identify optimization opportunities
  async identifyOptimizations() {
    const optimizations = [];

    // Check sync frequency
    if (this.metrics.performance.avgSyncTime > 10000) { // > 10 seconds
      optimizations.push('Consider implementing file change detection to reduce sync overhead');
    }

    // Check failure rate
    const failureRate = this.metrics.syncs.total > 0 ? 
      (this.metrics.syncs.failed / this.metrics.syncs.total) * 100 : 0;
    
    if (failureRate > 5) {
      optimizations.push('High failure rate detected - review error logs and implement better error handling');
    }

    // Check cache efficiency
    const cacheStats = this.cache.getCacheStats();
    if (cacheStats.memoryEntries < 5) {
      optimizations.push('Low cache utilization - consider caching more frequently accessed data');
    }

    return optimizations;
  }

  // Generate actionable recommendations
  async generateRecommendations(report) {
    const recommendations = [];

    // Performance recommendations
    if (report.summary.avg_sync_time && parseInt(report.summary.avg_sync_time) > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Sync Performance',
        description: 'Average sync time is above optimal threshold',
        action: 'Implement incremental sync or reduce file discovery scope'
      });
    }

    // Reliability recommendations
    const successRate = parseFloat(report.summary.success_rate);
    if (successRate < 95) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Improve Sync Reliability',
        description: `Success rate is ${report.summary.success_rate}`,
        action: 'Review error patterns and implement better retry mechanisms'
      });
    }

    // Scaling recommendations
    if (report.details.top_performing_repos && report.details.top_performing_repos.length > 20) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        title: 'Consider Repository Prioritization',
        description: 'Large number of repositories detected',
        action: 'Implement intelligent batching and priority-based syncing'
      });
    }

    return recommendations;
  }

  // Get system uptime
  getUptimeString() {
    const uptime = Date.now() - this.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Export metrics to JSON
  async exportMetrics(filename = null) {
    const exportData = {
      exported_at: new Date().toISOString(),
      system_metrics: this.metrics,
      performance_log: this.performanceLog,
      uptime: this.getUptimeString(),
      cache_stats: this.cache.getCacheStats()
    };

    const exportPath = filename || `analytics-export-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`📊 Analytics exported to: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('❌ Failed to export analytics:', error.message);
      return null;
    }
  }

  // Real-time metrics endpoint data
  getRealTimeMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      uptime: this.getUptimeString(),
      performance: {
        avg_sync_time: Math.round(this.metrics.performance.avgSyncTime),
        max_sync_time: Math.round(this.metrics.performance.maxSyncTime),
        recent_operations: this.performanceLog.slice(-10)
      },
      cache_stats: this.cache.getCacheStats()
    };
  }

  // Cleanup and close connections
  async cleanup() {
    await this.db.close();
    console.log('📊 Enterprise Analytics cleaned up');
  }
}

module.exports = EnterpriseAnalytics;

// Test if run directly
if (require.main === module) {
  const analytics = new EnterpriseAnalytics();
  
  async function testAnalytics() {
    try {
      await analytics.initialize();
      
      // Test recording a sync
      await analytics.recordSync('TestRepo', { 
        success: true, 
        files: 25, 
        sha: 'abc123' 
      }, 2500, 'test');
      
      // Generate a report
      const report = await analytics.generateReport();
      console.log('📈 Test report:', JSON.stringify(report, null, 2));
      
      await analytics.cleanup();
      console.log('✅ Analytics test completed');
    } catch (error) {
      console.error('❌ Analytics test failed:', error.message);
    }
  }
  
  testAnalytics();
}
