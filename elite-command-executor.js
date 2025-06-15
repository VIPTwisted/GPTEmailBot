
const { spawn } = require('child_process');
const fs = require('fs');

class EliteCommandExecutor {
  constructor() {
    this.executionHistory = [];
    this.runningProcesses = new Map();
    this.maxConcurrentProcesses = 5;
    this.defaultTimeout = 60000; // 60 seconds
    
    console.log('⚡ ELITE COMMAND EXECUTOR INITIALIZED');
    console.log('🛡️ BULLETPROOF SHELL EXECUTION ENGINE');
  }

  async executeCommand(command, options = {}) {
    const {
      timeout = this.defaultTimeout,
      retries = 3,
      killOnTimeout = true,
      workingDirectory = process.cwd(),
      environment = process.env
    } = options;

    console.log(`🔧 ELITE EXEC: ${command}`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.runSingleCommand(command, {
          timeout,
          killOnTimeout,
          workingDirectory,
          environment,
          attempt
        });

        this.recordExecution(command, result, attempt, true);
        return result;

      } catch (error) {
        console.log(`⚠️ Attempt ${attempt}/${retries} failed: ${error.message}`);
        
        if (attempt === retries) {
          this.recordExecution(command, { error: error.message }, attempt, false);
          throw error;
        }

        // Exponential backoff between retries
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
      }
    }
  }

  async runSingleCommand(command, options) {
    return new Promise((resolve, reject) => {
      const { timeout, killOnTimeout, workingDirectory, environment, attempt } = options;
      
      console.log(`🎯 Attempt ${attempt}: ${command}`);

      const child = spawn('sh', ['-c', command], {
        cwd: workingDirectory,
        env: environment,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      const processId = Date.now() + Math.random();
      this.runningProcesses.set(processId, child);

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`📤 ${data.toString().trim()}`);
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`📥 ${data.toString().trim()}`);
      });

      child.on('close', (code, signal) => {
        this.runningProcesses.delete(processId);
        
        if (isResolved) return;
        isResolved = true;

        if (signal) {
          reject(new Error(`Process killed with signal: ${signal}`));
        } else if (code === 0) {
          resolve({ stdout, stderr, code, signal });
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        this.runningProcesses.delete(processId);
        
        if (isResolved) return;
        isResolved = true;
        
        reject(new Error(`Process error: ${error.message}`));
      });

      // Timeout handling
      const timeoutId = setTimeout(() => {
        if (isResolved) return;
        
        console.log(`⏰ Command timeout after ${timeout}ms: ${command}`);
        
        if (killOnTimeout) {
          try {
            // Kill the process group to ensure all child processes are killed
            process.kill(-child.pid, 'SIGKILL');
          } catch (killError) {
            console.log(`⚠️ Could not kill process: ${killError.message}`);
          }
        }

        this.runningProcesses.delete(processId);
        isResolved = true;
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      child.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  async executeBatch(commands, options = {}) {
    const { 
      concurrent = false, 
      stopOnError = true,
      maxConcurrent = this.maxConcurrentProcesses 
    } = options;

    console.log(`🚀 ELITE BATCH EXECUTION: ${commands.length} commands`);
    const results = [];

    if (concurrent) {
      // Execute commands concurrently with limit
      const semaphore = new Semaphore(maxConcurrent);
      
      const promises = commands.map(async (command) => {
        await semaphore.acquire();
        try {
          const result = await this.executeCommand(command, options);
          return { command, success: true, result };
        } catch (error) {
          if (stopOnError) {
            throw error;
          }
          return { command, success: false, error: error.message };
        } finally {
          semaphore.release();
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

    } else {
      // Execute commands sequentially
      for (const command of commands) {
        try {
          const result = await this.executeCommand(command, options);
          results.push({ command, success: true, result });
        } catch (error) {
          const failureResult = { command, success: false, error: error.message };
          results.push(failureResult);
          
          if (stopOnError) {
            console.log(`❌ Stopping batch execution due to error: ${error.message}`);
            break;
          }
        }
      }
    }

    return results;
  }

  killAllRunningProcesses() {
    console.log(`💀 Killing ${this.runningProcesses.size} running processes...`);
    
    for (const [processId, child] of this.runningProcesses) {
      try {
        process.kill(-child.pid, 'SIGKILL');
        console.log(`💀 Killed process: ${processId}`);
      } catch (error) {
        console.log(`⚠️ Could not kill process ${processId}: ${error.message}`);
      }
    }
    
    this.runningProcesses.clear();
  }

  recordExecution(command, result, attempt, success) {
    this.executionHistory.push({
      command,
      result,
      attempt,
      success,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }
  }

  getExecutionReport() {
    const successful = this.executionHistory.filter(e => e.success).length;
    const failed = this.executionHistory.filter(e => !e.success).length;

    return {
      total: this.executionHistory.length,
      successful,
      failed,
      successRate: this.executionHistory.length ? (successful / this.executionHistory.length * 100).toFixed(2) : 0,
      history: this.executionHistory.slice(-10) // Last 10 executions
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentConcurrency < this.maxConcurrency) {
        this.currentConcurrency++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.currentConcurrency--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.currentConcurrency++;
      next();
    }
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 ELITE EXECUTOR SHUTDOWN INITIATED');
  if (global.eliteExecutor) {
    global.eliteExecutor.killAllRunningProcesses();
  }
  process.exit(0);
});

module.exports = EliteCommandExecutor;

// Auto-run example if executed directly
if (require.main === module) {
  const executor = new EliteCommandExecutor();
  global.eliteExecutor = executor;

  // Test commands
  const testCommands = [
    'echo "Elite Executor Test 1"',
    'echo "Elite Executor Test 2"',
    'sleep 2 && echo "Delayed command completed"'
  ];

  executor.executeBatch(testCommands, { concurrent: true })
    .then(results => {
      console.log('\n📊 ELITE EXECUTION REPORT:');
      console.log(JSON.stringify(executor.getExecutionReport(), null, 2));
    })
    .catch(error => {
      console.error('❌ Batch execution failed:', error.message);
    });
}
