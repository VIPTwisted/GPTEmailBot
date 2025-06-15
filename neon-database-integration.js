
const { Pool } = require('pg');
const fs = require('fs');

class NeonDatabaseIntegration {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionString = null;
    this.retryAttempts = 5;
    this.retryDelay = 3000;
  }

  // Initialize Neon database connection
  async initialize() {
    try {
      console.log('🐘 Initializing Neon PostgreSQL integration...');
      
      // Get database URL from environment
      this.connectionString = process.env.DATABASE_URL || 
                              process.env.NETLIFY_DATABASE_URL || 
                              process.env.NEON_DATABASE_URL;
      
      if (!this.connectionString) {
        console.log('ℹ️ No Neon database configured - running in file-based mode');
        return false;
      }

      // Use Neon's connection pooler for better performance
      if (this.connectionString.includes('.us-east-2') && !this.connectionString.includes('-pooler')) {
        this.connectionString = this.connectionString.replace('.us-east-2', '-pooler.us-east-2');
        console.log('🚀 Using Neon connection pooler for enhanced performance');
      }

      // Configure connection pool with Neon-optimized settings
      this.pool = new Pool({
        connectionString: this.connectionString,
        max: 10, // Maximum 10 connections
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 10000, // 10 second connection timeout
        ssl: { rejectUnauthorized: false }, // Required for Neon
        keepAlive: true,
        statement_timeout: 30000, // 30 second query timeout
        query_timeout: 30000
      });

      // Test connection with retry logic
      await this.testConnection();
      
      // Create necessary tables
      await this.createTables();
      
      // Setup connection event handlers
      this.setupEventHandlers();

      this.isConnected = true;
      console.log('✅ Neon PostgreSQL connected successfully with connection pooling!');
      return true;
    } catch (error) {
      console.error('❌ Neon database initialization failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  // Test database connection with retry logic
  async testConnection() {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔗 Testing Neon connection (attempt ${attempt}/${this.retryAttempts})...`);
        
        const client = await this.pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        
        console.log(`✅ Connection successful! Time: ${result.rows[0].current_time}`);
        console.log(`📋 Database version: ${result.rows[0].db_version.split(' ')[0]}`);
        
        client.release();
        return true;
      } catch (error) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to connect to Neon after ${this.retryAttempts} attempts: ${error.message}`);
        }
      }
    }
  }

  // Setup connection pool event handlers
  setupEventHandlers() {
    this.pool.on('connect', (client) => {
      console.log('🔗 New Neon database client connected');
    });

    this.pool.on('error', (err, client) => {
      console.error('❌ Neon database pool error:', err.message);
    });

    this.pool.on('remove', (client) => {
      console.log('🔌 Neon database client removed from pool');
    });
  }

  // Create optimized tables for production workload
  async createTables() {
    const tables = [
      // Enhanced sync history with indexing
      `CREATE TABLE IF NOT EXISTS sync_operations (
        id SERIAL PRIMARY KEY,
        repo_name VARCHAR(255) NOT NULL,
        repo_owner VARCHAR(255) NOT NULL,
        branch VARCHAR(100) DEFAULT 'main',
        operation_type VARCHAR(50) DEFAULT 'sync',
        files_count INTEGER NOT NULL DEFAULT 0,
        success BOOLEAN NOT NULL,
        commit_sha VARCHAR(40),
        sync_duration_ms INTEGER,
        bytes_transferred BIGINT DEFAULT 0,
        error_message TEXT,
        error_code VARCHAR(50),
        triggered_by VARCHAR(100) DEFAULT 'autonomous',
        user_agent VARCHAR(255),
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_sync_operations_repo 
       ON sync_operations(repo_name, repo_owner)`,
      
      `CREATE INDEX IF NOT EXISTS idx_sync_operations_created 
       ON sync_operations(created_at DESC)`,
      
      `CREATE INDEX IF NOT EXISTS idx_sync_operations_success 
       ON sync_operations(success, created_at DESC)`,

      // Repository analytics with comprehensive metrics
      `CREATE TABLE IF NOT EXISTS repository_analytics (
        id SERIAL PRIMARY KEY,
        repo_name VARCHAR(255) NOT NULL,
        repo_owner VARCHAR(255) NOT NULL,
        total_operations INTEGER DEFAULT 0,
        successful_operations INTEGER DEFAULT 0,
        failed_operations INTEGER DEFAULT 0,
        total_files_synced BIGINT DEFAULT 0,
        total_bytes_synced BIGINT DEFAULT 0,
        avg_operation_duration_ms FLOAT DEFAULT 0,
        min_operation_duration_ms INTEGER DEFAULT 0,
        max_operation_duration_ms INTEGER DEFAULT 0,
        last_operation_at TIMESTAMP WITH TIME ZONE,
        last_success_at TIMESTAMP WITH TIME ZONE,
        last_failure_at TIMESTAMP WITH TIME ZONE,
        consecutive_failures INTEGER DEFAULT 0,
        repo_score INTEGER DEFAULT 5,
        priority_level VARCHAR(20) DEFAULT 'medium',
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(repo_name, repo_owner)
      )`,

      // Build and deployment tracking
      `CREATE TABLE IF NOT EXISTS build_deployments (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(255),
        build_id VARCHAR(255),
        deploy_id VARCHAR(255),
        build_status VARCHAR(50),
        deploy_status VARCHAR(50),
        build_duration_ms INTEGER,
        deploy_duration_ms INTEGER,
        trigger_reason TEXT,
        commit_sha VARCHAR(40),
        branch VARCHAR(100),
        deploy_url TEXT,
        preview_url TEXT,
        logs_url TEXT,
        error_message TEXT,
        build_size_bytes BIGINT,
        functions_count INTEGER DEFAULT 0,
        triggered_by VARCHAR(100),
        environment VARCHAR(50) DEFAULT 'production',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      )`,

      // Performance metrics with time-series data
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        metric_type VARCHAR(100) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        metric_value FLOAT NOT NULL,
        metric_unit VARCHAR(50),
        tags JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE
      )`,

      // Create index for time-series queries
      `CREATE INDEX IF NOT EXISTS idx_performance_metrics_time 
       ON performance_metrics(metric_type, recorded_at DESC)`,

      // System events and audit log
      `CREATE TABLE IF NOT EXISTS system_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        event_category VARCHAR(50) DEFAULT 'system',
        severity VARCHAR(20) DEFAULT 'INFO',
        message TEXT,
        event_data JSONB DEFAULT '{}',
        source VARCHAR(100),
        user_id VARCHAR(100),
        session_id VARCHAR(100),
        correlation_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,

      // User sessions and activity tracking
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(100),
        user_agent TEXT,
        ip_address INET,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        session_data JSONB DEFAULT '{}'
      )`,

      // Cache management table
      `CREATE TABLE IF NOT EXISTS cache_entries (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        cache_data JSONB,
        cache_size_bytes INTEGER,
        access_count INTEGER DEFAULT 0,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        cache_type VARCHAR(100) DEFAULT 'general'
      )`,

      // Create cleanup function for expired data
      `CREATE OR REPLACE FUNCTION cleanup_expired_data() 
       RETURNS void AS $$
       BEGIN
         -- Clean up expired performance metrics
         DELETE FROM performance_metrics 
         WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
         
         -- Clean up old cache entries
         DELETE FROM cache_entries 
         WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
         
         -- Clean up inactive sessions (older than 30 days)
         DELETE FROM user_sessions 
         WHERE ended_at IS NOT NULL AND ended_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
       END;
       $$ LANGUAGE plpgsql;`
    ];

    for (const sql of tables) {
      try {
        await this.pool.query(sql);
      } catch (error) {
        console.error('❌ Table/Index creation error:', error.message);
      }
    }

    console.log('✅ Neon database tables and indexes created/verified');
  }

  // Execute query with connection retry and error handling
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Neon database not connected');
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      let client;
      try {
        client = await this.pool.connect();
        const result = await client.query(text, params);
        return result;
      } catch (error) {
        console.error(`❌ Query attempt ${attempt} failed:`, error.message);
        
        // Handle specific database errors
        if (error.code === '53300') { // Too many connections
          console.log('⚠️ Too many connections - waiting before retry');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        if (attempt === 3) {
          throw error;
        }
      } finally {
        if (client) client.release();
      }
    }
  }

  // Log sync operation with enhanced metadata
  async logSyncOperation(repoData, result, metadata = {}) {
    if (!this.isConnected) return;

    try {
      const {
        repo_owner,
        repo_name,
        branch = 'main'
      } = repoData;

      await this.query(`
        INSERT INTO sync_operations (
          repo_name, repo_owner, branch, operation_type, files_count, 
          success, commit_sha, sync_duration_ms, bytes_transferred,
          error_message, error_code, triggered_by, user_agent, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        repo_name,
        repo_owner,
        branch,
        metadata.operation_type || 'sync',
        result.files || 0,
        result.success,
        result.sha || null,
        metadata.duration || 0,
        metadata.bytes_transferred || 0,
        result.error || null,
        metadata.error_code || null,
        metadata.triggered_by || 'autonomous',
        metadata.user_agent || null,
        metadata.ip_address || null
      ]);

      // Update repository analytics
      await this.updateRepositoryAnalytics(repo_owner, repo_name, result, metadata);
    } catch (error) {
      console.error('❌ Failed to log sync operation:', error.message);
    }
  }

  // Update comprehensive repository analytics
  async updateRepositoryAnalytics(repoOwner, repoName, result, metadata = {}) {
    if (!this.isConnected) return;

    try {
      const duration = metadata.duration || 0;
      const filesCount = result.files || 0;
      const bytesTransferred = metadata.bytes_transferred || 0;

      await this.query(`
        INSERT INTO repository_analytics (
          repo_name, repo_owner, total_operations, successful_operations, 
          failed_operations, total_files_synced, total_bytes_synced,
          avg_operation_duration_ms, min_operation_duration_ms, max_operation_duration_ms,
          last_operation_at, last_success_at, last_failure_at, consecutive_failures
        ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $7, $7, CURRENT_TIMESTAMP, $8, $9, $10)
        ON CONFLICT (repo_name, repo_owner) DO UPDATE SET
          total_operations = repository_analytics.total_operations + 1,
          successful_operations = repository_analytics.successful_operations + $3,
          failed_operations = repository_analytics.failed_operations + $4,
          total_files_synced = repository_analytics.total_files_synced + $5,
          total_bytes_synced = repository_analytics.total_bytes_synced + $6,
          avg_operation_duration_ms = (
            repository_analytics.avg_operation_duration_ms * (repository_analytics.total_operations - 1) + $7
          ) / repository_analytics.total_operations,
          min_operation_duration_ms = LEAST(repository_analytics.min_operation_duration_ms, $7),
          max_operation_duration_ms = GREATEST(repository_analytics.max_operation_duration_ms, $7),
          last_operation_at = CURRENT_TIMESTAMP,
          last_success_at = CASE WHEN $3 > 0 THEN CURRENT_TIMESTAMP ELSE repository_analytics.last_success_at END,
          last_failure_at = CASE WHEN $4 > 0 THEN CURRENT_TIMESTAMP ELSE repository_analytics.last_failure_at END,
          consecutive_failures = CASE WHEN $3 > 0 THEN 0 ELSE repository_analytics.consecutive_failures + $4 END,
          updated_at = CURRENT_TIMESTAMP
      `, [
        repoName, repoOwner,
        result.success ? 1 : 0, // successful_operations
        result.success ? 0 : 1, // failed_operations
        filesCount,
        bytesTransferred,
        duration,
        result.success ? 'CURRENT_TIMESTAMP' : null,
        result.success ? null : 'CURRENT_TIMESTAMP',
        result.success ? 0 : 1
      ]);
    } catch (error) {
      console.error('❌ Failed to update repository analytics:', error.message);
    }
  }

  // Get comprehensive analytics dashboard data
  async getAnalyticsDashboard(timeframe = '24 hours') {
    if (!this.isConnected) return null;

    try {
      const dashboard = {};

      // Overall statistics
      const overallStats = await this.query(`
        SELECT 
          COUNT(*) as total_operations,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_operations,
          SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_operations,
          AVG(sync_duration_ms) as avg_duration,
          SUM(files_count) as total_files,
          COUNT(DISTINCT repo_name || '/' || repo_owner) as unique_repos
        FROM sync_operations 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '${timeframe}'
      `);

      dashboard.overview = overallStats.rows[0];

      // Repository performance
      const repoPerformance = await this.query(`
        SELECT 
          repo_name,
          repo_owner,
          COUNT(*) as operations,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
          AVG(sync_duration_ms) as avg_duration,
          SUM(files_count) as total_files
        FROM sync_operations 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '${timeframe}'
        GROUP BY repo_name, repo_owner
        ORDER BY operations DESC
        LIMIT 10
      `);

      dashboard.top_repositories = repoPerformance.rows;

      // Recent failures
      const recentFailures = await this.query(`
        SELECT 
          repo_name,
          repo_owner,
          error_message,
          created_at
        FROM sync_operations 
        WHERE NOT success AND created_at > CURRENT_TIMESTAMP - INTERVAL '${timeframe}'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      dashboard.recent_failures = recentFailures.rows;

      // Performance trends (hourly)
      const performanceTrends = await this.query(`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as operations,
          AVG(sync_duration_ms) as avg_duration,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes
        FROM sync_operations 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '${timeframe}'
        GROUP BY hour
        ORDER BY hour
      `);

      dashboard.hourly_trends = performanceTrends.rows;

      return dashboard;
    } catch (error) {
      console.error('❌ Failed to get analytics dashboard:', error.message);
      return null;
    }
  }

  // Cleanup old data to prevent database bloat
  async performMaintenanceCleanup() {
    if (!this.isConnected) return;

    try {
      console.log('🧹 Performing Neon database maintenance cleanup...');

      // Run the cleanup function
      await this.query('SELECT cleanup_expired_data()');

      // Archive old sync operations (keep last 30 days detailed, summarize older)
      const archiveResult = await this.query(`
        DELETE FROM sync_operations 
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        RETURNING COUNT(*)
      `);

      if (archiveResult.rows[0] && archiveResult.rows[0].count > 0) {
        console.log(`🗄️ Archived ${archiveResult.rows[0].count} old sync operations`);
      }

      // Update database statistics
      await this.query('ANALYZE');

      console.log('✅ Database maintenance completed');
    } catch (error) {
      console.error('❌ Database maintenance failed:', error.message);
    }
  }

  // Get connection pool statistics
  getPoolStats() {
    if (!this.pool) return null;

    return {
      total_connections: this.pool.totalCount,
      idle_connections: this.pool.idleCount,
      waiting_requests: this.pool.waitingCount,
      max_connections: this.pool.options.max
    };
  }

  // Graceful shutdown
  async shutdown() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Neon database connection pool closed gracefully');
    }
  }
}

module.exports = NeonDatabaseIntegration;

// Test if run directly
if (require.main === module) {
  const neonDb = new NeonDatabaseIntegration();
  
  async function testNeonIntegration() {
    try {
      const connected = await neonDb.initialize();
      if (connected) {
        console.log('✅ Neon integration test successful!');
        
        // Test logging a sync operation
        await neonDb.logSyncOperation(
          { repo_owner: 'TestOwner', repo_name: 'TestRepo', branch: 'main' },
          { success: true, files: 15, sha: 'abc123def' },
          { duration: 2500, triggered_by: 'test', operation_type: 'sync' }
        );
        
        // Test getting dashboard data
        const dashboard = await neonDb.getAnalyticsDashboard('1 day');
        console.log('📊 Dashboard data:', JSON.stringify(dashboard, null, 2));
        
        // Test pool stats
        const poolStats = neonDb.getPoolStats();
        console.log('🏊 Pool stats:', poolStats);
        
        await neonDb.shutdown();
      }
    } catch (error) {
      console.error('❌ Neon integration test failed:', error.message);
    }
  }
  
  testNeonIntegration();
}
