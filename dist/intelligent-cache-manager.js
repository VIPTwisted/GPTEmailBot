
const fs = require('fs');
const crypto = require('crypto');

class IntelligentCacheManager {
  constructor() {
    this.cacheDir = '.cache';
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
    this.defaultTTL = 24 * 60 * 60 * 1000; // 24 hours
    this.memoryCache = new Map();
    this.accessLog = new Map();
    
    this.ensureCacheDir();
  }

  // Ensure cache directory exists
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // Generate cache key
  generateKey(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Get cache file path
  getCacheFilePath(key) {
    return `${this.cacheDir}/${key}.json`;
  }

  // Store data in cache
  async set(key, data, ttl = this.defaultTTL) {
    try {
      const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        ttl: ttl,
        accessCount: 0
      };

      // Store in memory cache for fast access
      this.memoryCache.set(cacheKey, cacheData);

      // Store in file cache for persistence
      const filePath = this.getCacheFilePath(cacheKey);
      fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));

      console.log(`📦 Cached data with key: ${cacheKey.substring(0, 8)}...`);
      
      // Clean up old cache entries
      await this.cleanup();
    } catch (error) {
      console.error('❌ Cache set error:', error.message);
    }
  }

  // Get data from cache
  async get(key) {
    try {
      const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
      
      // Try memory cache first
      let cacheData = this.memoryCache.get(cacheKey);
      
      // Try file cache if not in memory
      if (!cacheData) {
        const filePath = this.getCacheFilePath(cacheKey);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          cacheData = JSON.parse(fileContent);
          
          // Restore to memory cache
          this.memoryCache.set(cacheKey, cacheData);
        }
      }

      if (!cacheData) {
        return null;
      }

      // Check if expired
      const now = Date.now();
      if (now - cacheData.timestamp > cacheData.ttl) {
        await this.delete(cacheKey);
        return null;
      }

      // Update access log
      cacheData.accessCount++;
      this.accessLog.set(cacheKey, now);

      console.log(`🎯 Cache hit for key: ${cacheKey.substring(0, 8)}... (accessed ${cacheData.accessCount} times)`);
      return cacheData.data;
    } catch (error) {
      console.error('❌ Cache get error:', error.message);
      return null;
    }
  }

  // Delete from cache
  async delete(key) {
    try {
      const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
      
      // Remove from memory
      this.memoryCache.delete(cacheKey);
      this.accessLog.delete(cacheKey);
      
      // Remove file
      const filePath = this.getCacheFilePath(cacheKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(`🗑️ Deleted cache entry: ${cacheKey.substring(0, 8)}...`);
    } catch (error) {
      console.error('❌ Cache delete error:', error.message);
    }
  }

  // Check if key exists in cache
  async has(key) {
    const data = await this.get(key);
    return data !== null;
  }

  // Cache GitHub API responses
  async cacheGitHubResponse(endpoint, data, ttl = 5 * 60 * 1000) { // 5 minutes
    const key = `github:${endpoint}`;
    await this.set(key, data, ttl);
  }

  // Get cached GitHub response
  async getCachedGitHubResponse(endpoint) {
    const key = `github:${endpoint}`;
    return await this.get(key);
  }

  // Cache repository metadata
  async cacheRepoMetadata(repoName, metadata) {
    const key = `repo:${repoName}`;
    await this.set(key, metadata, this.defaultTTL);
  }

  // Get cached repository metadata
  async getCachedRepoMetadata(repoName) {
    const key = `repo:${repoName}`;
    return await this.get(key);
  }

  // Cache sync results
  async cacheSyncResult(repoName, result) {
    const key = `sync:${repoName}:${Date.now()}`;
    await this.set(key, result, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Cache file discovery results
  async cacheFileDiscovery(hash, files) {
    const key = `files:${hash}`;
    await this.set(key, files, 60 * 60 * 1000); // 1 hour
  }

  // Get cached file discovery
  async getCachedFileDiscovery(hash) {
    const key = `files:${hash}`;
    return await this.get(key);
  }

  // Intelligent cleanup based on access patterns
  async cleanup() {
    try {
      const cacheFiles = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
      
      if (cacheFiles.length === 0) return;

      // Calculate total cache size
      let totalSize = 0;
      const fileStats = [];

      for (const file of cacheFiles) {
        const filePath = `${this.cacheDir}/${file}`;
        const stats = fs.statSync(filePath);
        const key = file.replace('.json', '');
        
        totalSize += stats.size;
        fileStats.push({
          key,
          filePath,
          size: stats.size,
          mtime: stats.mtime,
          accessCount: this.memoryCache.get(key)?.accessCount || 0,
          lastAccess: this.accessLog.get(key) || 0
        });
      }

      // If cache is too large, remove least accessed files
      if (totalSize > this.maxCacheSize) {
        console.log(`🧹 Cache cleanup: ${totalSize} bytes > ${this.maxCacheSize} bytes`);
        
        // Sort by access pattern (least used first)
        fileStats.sort((a, b) => {
          // Prioritize by access count, then by last access time
          if (a.accessCount !== b.accessCount) {
            return a.accessCount - b.accessCount;
          }
          return a.lastAccess - b.lastAccess;
        });

        // Remove files until under limit
        let removedSize = 0;
        let removedCount = 0;
        
        for (const file of fileStats) {
          if (totalSize - removedSize <= this.maxCacheSize * 0.8) { // Leave 20% buffer
            break;
          }
          
          fs.unlinkSync(file.filePath);
          this.memoryCache.delete(file.key);
          this.accessLog.delete(file.key);
          
          removedSize += file.size;
          removedCount++;
        }

        console.log(`🗑️ Removed ${removedCount} cache files (${removedSize} bytes)`);
      }

      // Remove expired entries
      const now = Date.now();
      let expiredCount = 0;

      for (const [key, cacheData] of this.memoryCache.entries()) {
        if (now - cacheData.timestamp > cacheData.ttl) {
          await this.delete(key);
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        console.log(`⏰ Removed ${expiredCount} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ Cache cleanup error:', error.message);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      memoryEntries: this.memoryCache.size,
      fileEntries: 0,
      totalSize: 0,
      accessCounts: {},
      oldestEntry: null,
      newestEntry: null
    };

    try {
      const cacheFiles = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
      stats.fileEntries = cacheFiles.length;

      for (const file of cacheFiles) {
        const filePath = `${this.cacheDir}/${file}`;
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;

        if (!stats.oldestEntry || fileStats.mtime < stats.oldestEntry) {
          stats.oldestEntry = fileStats.mtime;
        }
        if (!stats.newestEntry || fileStats.mtime > stats.newestEntry) {
          stats.newestEntry = fileStats.mtime;
        }
      }

      // Access count statistics
      for (const [key, data] of this.memoryCache.entries()) {
        const count = data.accessCount || 0;
        stats.accessCounts[count] = (stats.accessCounts[count] || 0) + 1;
      }
    } catch (error) {
      console.error('❌ Error getting cache stats:', error.message);
    }

    return stats;
  }

  // Clear entire cache
  async clearAll() {
    try {
      this.memoryCache.clear();
      this.accessLog.clear();
      
      const cacheFiles = fs.readdirSync(this.cacheDir);
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(`${this.cacheDir}/${file}`);
        }
      }

      console.log('🧹 Cache cleared completely');
    } catch (error) {
      console.error('❌ Error clearing cache:', error.message);
    }
  }
}

module.exports = IntelligentCacheManager;

// Test if run directly
if (require.main === module) {
  const cache = new IntelligentCacheManager();
  
  async function testCache() {
    console.log('🧪 Testing intelligent cache...');
    
    // Test basic operations
    await cache.set('test-key', { data: 'test-value', timestamp: Date.now() });
    const retrieved = await cache.get('test-key');
    console.log('📦 Retrieved:', retrieved);
    
    // Test stats
    const stats = cache.getCacheStats();
    console.log('📊 Cache stats:', stats);
    
    console.log('✅ Cache test completed');
  }
  
  testCache();
}
