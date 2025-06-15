
const https = require('https');
const { runNetworkDiagnostics } = require('./network-diagnostics');

class GitHubAPIHelper {
  constructor(options = {}) {
    this.baseURL = 'api.github.com';
    this.timeout = options.timeout || 15000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.token = (process.env.GITHUB_TOKEN || "").trim();
  }

  // Make HTTPS request with retry logic
  async makeRequest(path, options = {}) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌐 Attempt ${attempt}/${this.retryAttempts}: Fetching ${path}`);
        
        const result = await this._httpRequest(path, options);
        console.log(`✅ GitHub API request successful on attempt ${attempt}`);
        return result;
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        // If it's a DNS error and this is not the last attempt
        if (error.code === 'ENOTFOUND' && attempt < this.retryAttempts) {
          console.log('🔧 DNS error detected, running network diagnostics...');
          await runNetworkDiagnostics();
          
          // Wait before retry
          if (attempt < this.retryAttempts) {
            console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
        } else if (attempt < this.retryAttempts) {
          // Wait before retry for other errors
          console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          // Last attempt failed
          throw new Error(`GitHub API request failed after ${this.retryAttempts} attempts: ${error.message}`);
        }
      }
    }
  }

  // Internal HTTP request method
  _httpRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const headers = {
        'User-Agent': 'Replit-GitHub-Sync/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
      };

      // Add authorization header if token is available
      if (this.token) {
        headers['Authorization'] = `token ${this.token}`;
      }

      const requestOptions = {
        hostname: this.baseURL,
        path: path,
        method: options.method || 'GET',
        headers: headers
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(this.timeout, () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      });

      if (options.data) {
        req.write(JSON.stringify(options.data));
      }

      req.end();
    });
  }

  // Get latest commits for a repository
  async getLatestCommits(owner, repo, options = {}) {
    const path = `/repos/${owner}/${repo}/commits`;
    const queryParams = new URLSearchParams();
    
    if (options.per_page) queryParams.append('per_page', options.per_page);
    if (options.page) queryParams.append('page', options.page);
    if (options.sha) queryParams.append('sha', options.sha);
    
    const fullPath = queryParams.toString() ? `${path}?${queryParams}` : path;
    
    return this.makeRequest(fullPath);
  }

  // Get repository information
  async getRepository(owner, repo) {
    const path = `/repos/${owner}/${repo}`;
    return this.makeRequest(path);
  }

  // Test connectivity to GitHub API
  async testConnectivity() {
    try {
      const result = await this.makeRequest('/rate_limit');
      console.log('✅ GitHub API connectivity test passed');
      console.log(`📊 Rate limit: ${result.rate.remaining}/${result.rate.limit}`);
      return true;
    } catch (error) {
      console.error('❌ GitHub API connectivity test failed:', error.message);
      return false;
    }
  }
}

module.exports = GitHubAPIHelper;

// Example usage if run directly
if (require.main === module) {
  const gitHub = new GitHubAPIHelper();
  
  async function testGitHubAPI() {
    try {
      // Test basic connectivity
      await gitHub.testConnectivity();
      
      // Test getting commits for your repository
      const commits = await gitHub.getLatestCommits('VIPTwisted', 'ToyParty', { per_page: 5 });
      console.log(`✅ Retrieved ${commits.length} commits from ToyParty repository`);
      
      commits.forEach((commit, index) => {
        console.log(`${index + 1}. ${commit.sha.substring(0, 7)} - ${commit.commit.message.split('\n')[0]}`);
      });
      
    } catch (error) {
      console.error('❌ GitHub API test failed:', error.message);
    }
  }
  
  testGitHubAPI();
}
