
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class FrontendMonitor {
  constructor(syncFunction) {
    this.syncFunction = syncFunction;
    this.watchedDirs = ['/frontend', '/builder', '/src'];
    this.debounceTimeout = null;
  }

  startWatching() {
    console.log('👀 Starting frontend monitoring...');
    
    const watcher = chokidar.watch(this.watchedDirs, {
      ignored: /node_modules|\.git|\.cache/,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', (filePath) => {
      console.log(`📝 Frontend change detected: ${filePath}`);
      this.debouncedSync(filePath);
    });

    watcher.on('add', (filePath) => {
      console.log(`➕ New frontend file: ${filePath}`);
      this.debouncedSync(filePath);
    });
  }

  debouncedSync(filePath) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.performTargetedSync(filePath);
    }, 2000); // 2 second debounce
  }

  async performTargetedSync(filePath) {
    const filename = path.basename(filePath);
    const commitMessage = `🔁 Auto-sync: ${filename}`;
    
    console.log(`🚀 Triggering auto-sync for: ${filename}`);
    
    // Use existing sync system but with custom commit message
    await this.syncFunction('ToyParty', commitMessage);
  }
}

module.exports = FrontendMonitor;
