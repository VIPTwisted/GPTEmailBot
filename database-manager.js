
const { Pool } = require('pg');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.retryAttempts = 3;
    this.retryDelay = 2000;
  }

  // Initialize database connection with pooling
  async initialize() {
    try {
      console.log('🔌 Initializing PostgreSQL database connection...');
      
      let databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
      
      if (!databaseUrl) {
        console.log('⚠️ No PostgreSQL database found - running without database features');
        return false;
      }

      // Use Neon connection pooler for better performance
      if (databaseUrl.includes('.us-east-2')) {
        databaseUrl = databaseUrl.replace('.us-east-2', '-pooler.us-east-2');
        console.log('🚀 Using Neon connection pooler for enhanced performance');
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false }
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('✅ PostgreSQL database connected successfully!');
      
      await this.createTables();
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  // Create necessary tables for analytics and monitoring
  async createTables() {
    const tables = [
      // Sync history tracking
      `CREATE TABLE IF NOT EXISTS sync_history (
        id SERIAL PRIMARY KEY,
        repo_name VARCHAR(255) NOT NULL,
        branch VARCHAR(100) DEFAULT 'main',
        files_count INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        commit_sha VARCHAR(40),
        sync_duration_ms INTEGER,
        error_message TEXT,
        triggered_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Repository analytics
      `CREATE TABLE IF NOT EXISTS repo_analytics (
        id SERIAL PRIMARY KEY,
        repo_name VARCHAR(255) NOT NULL,
        total_syncs INTEGER DEFAULT 0,
        successful_syncs INTEGER DEFAULT 0,
        failed_syncs INTEGER DEFAULT 0,
        last_sync_at TIMESTAMP,
        avg_sync_duration_ms FLOAT,
        total_files_synced INTEGER DEFAULT 0,
        repo_score INTEGER DEFAULT 5,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(repo_name)
      )`,
      
      // Build deployment logs
      `CREATE TABLE IF NOT EXISTS build_logs (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(255),
        build_id VARCHAR(255),
        deploy_id VARCHAR(255),
        status VARCHAR(50),
        trigger_reason TEXT,
        build_duration_ms INTEGER,
        deploy_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Performance metrics
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        metric_type VARCHAR(100) NOT NULL,
        metric_value FLOAT NOT NULL,
        metadata JSONB,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // System events
      `CREATE TABLE IF NOT EXISTS system_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        severity VARCHAR(20) DEFAULT 'INFO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      try {
        await this.query(table);
      } catch (error) {
        console.error('❌ Table creation error:', error.message);
      }
    }

    console.log('✅ Database tables initialized');
  }

  // Execute query with retry logic
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.pool.query(text, params);
        return result;
      } catch (error) {
        console.error(`❌ Query attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw error;
        }
      }
    }
  }

  // Log sync operation
  async logSync(repoName, result, triggeredBy = 'autonomous', duration = 0) {
    if (!this.isConnected) return;

    try {
      await this.query(`
        INSERT INTO sync_history (repo_name, files_count, success, commit_sha, sync_duration_ms, error_message, triggered_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        repoName,
        result.files || 0,
        result.success,
        result.sha || null,
        duration,
        result.error || null,
        triggeredBy
      ]);

      // Update repo analytics
      await this.updateRepoAnalytics(repoName, result.success, duration, result.files || 0);
    } catch (error) {
      console.error('❌ Failed to log sync:', error.message);
    }
  }

  // Update repository analytics
  async updateRepoAnalytics(repoName, success, duration, filesCount) {
    if (!this.isConnected) return;

    try {
      await this.query(`
        INSERT INTO repo_analytics (repo_name, total_syncs, successful_syncs, failed_syncs, last_sync_at, total_files_synced)
        VALUES ($1, 1, $2, $3, CURRENT_TIMESTAMP, $4)
        ON CONFLICT (repo_name) DO UPDATE SET
          total_syncs = repo_analytics.total_syncs + 1,
          successful_syncs = repo_analytics.successful_syncs + $2,
          failed_syncs = repo_analytics.failed_syncs + $3,
          last_sync_at = CURRENT_TIMESTAMP,
          total_files_synced = repo_analytics.total_files_synced + $4,
          avg_sync_duration_ms = (
            COALESCE(repo_analytics.avg_sync_duration_ms * (repo_analytics.total_syncs - 1), 0) + $5
          ) / repo_analytics.total_syncs
      `, [repoName, success ? 1 : 0, success ? 0 : 1, filesCount, duration]);
    } catch (error) {
      console.error('❌ Failed to update repo analytics:', error.message);
    }
  }

  // Log build deployment
  async logBuild(siteId, buildData) {
    if (!this.isConnected) return;

    try {
      await this.query(`
        INSERT INTO build_logs (site_id, build_id, deploy_id, status, trigger_reason, deploy_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        siteId,
        buildData.id || null,
        buildData.deploy_id || null,
        buildData.deploy_state || 'unknown',
        buildData.trigger_reason || 'sync',
        buildData.url || null
      ]);
    } catch (error) {
      console.error('❌ Failed to log build:', error.message);
    }
  }

  // Get repository analytics
  async getRepoAnalytics(repoName = null) {
    if (!this.isConnected) return [];

    try {
      if (repoName) {
        const result = await this.query(
          'SELECT * FROM repo_analytics WHERE repo_name = $1',
          [repoName]
        );
        return result.rows[0] || null;
      } else {
        const result = await this.query(`
          SELECT * FROM repo_analytics 
          ORDER BY repo_score DESC, successful_syncs DESC
        `);
        return result.rows;
      }
    } catch (error) {
      console.error('❌ Failed to get repo analytics:', error.message);
      return [];
    }
  }

  // Get sync history
  async getSyncHistory(limit = 50, repoName = null) {
    if (!this.isConnected) return [];

    try {
      let query = `
        SELECT * FROM sync_history 
        ${repoName ? 'WHERE repo_name = $2' : ''} 
        ORDER BY created_at DESC 
        LIMIT $1
      `;
      
      const params = repoName ? [limit, repoName] : [limit];
      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get sync history:', error.message);
      return [];
    }
  }

  // Record performance metric
  async recordMetric(type, value, metadata = {}) {
    if (!this.isConnected) return;

    try {
      await this.query(`
        INSERT INTO performance_metrics (metric_type, metric_value, metadata)
        VALUES ($1, $2, $3)
      `, [type, value, JSON.stringify(metadata)]);
    } catch (error) {
      console.error('❌ Failed to record metric:', error.message);
    }
  }

  // Log system event
  async logEvent(type, data = {}, severity = 'INFO') {
    if (!this.isConnected) return;

    try {
      await this.query(`
        INSERT INTO system_events (event_type, event_data, severity)
        VALUES ($1, $2, $3)
      `, [type, JSON.stringify(data), severity]);
    } catch (error) {
      console.error('❌ Failed to log event:', error.message);
    }
  }

  // Get system insights
  async getInsights() {
    if (!this.isConnected) return {};

    try {
      const insights = {};

      // Sync success rate
      const syncStats = await this.query(`
        SELECT 
          COUNT(*) as total_syncs,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_syncs,
          AVG(sync_duration_ms) as avg_duration
        FROM sync_history 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      insights.sync_stats = syncStats.rows[0];

      // Top performing repos
      const topRepos = await this.query(`
        SELECT repo_name, successful_syncs, total_syncs, repo_score
        FROM repo_analytics 
        ORDER BY repo_score DESC, successful_syncs DESC 
        LIMIT 5
      `);

      insights.top_repos = topRepos.rows;

      // Recent failures
      const recentFailures = await this.query(`
        SELECT repo_name, error_message, created_at
        FROM sync_history 
        WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      insights.recent_failures = recentFailures.rows;

      return insights;
    } catch (error) {
      console.error('❌ Failed to get insights:', error.message);
      return {};
    }
  }

  // Close database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }
}

module.exports = DatabaseManager;

// Test if run directly
if (require.main === module) {
  const db = new DatabaseManager();
  
  async function testDatabase() {
    try {
      const connected = await db.initialize();
      if (connected) {
        console.log('✅ Database test successful!');
        
        // Test logging a sync
        await db.logSync('TestRepo', { success: true, files: 10, sha: 'abc123' }, 'test');
        
        // Test getting analytics
        const analytics = await db.getRepoAnalytics();
        console.log('📊 Analytics:', analytics);
        
        await db.close();
      }
    } catch (error) {
      console.error('❌ Database test failed:', error.message);
    }
  }
  
  testDatabase();
}
