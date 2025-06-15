const fs = require('fs');
const https = require('https');

class DynamicRepoManager {
  constructor(githubToken) {
    this.token = githubToken;
    this.baseURL = 'api.github.com';
  }

  // 🔍 Auto-discover all user repositories
  async discoverAllRepos(username = 'VIPTwisted') {
    try {
      console.log(`🔍 Auto-discovering repositories for ${username}...`);

      const repos = await this.makeGitHubRequest(`/users/${username}/repos?per_page=100&sort=updated`);

      const discoveredRepos = repos.map(repo => ({
        repo_owner: repo.owner.login,
        repo_name: repo.name,
        branch: repo.default_branch || 'main',
        username: username,
        gpt_id: this.generateGptId(repo.name),
        aliases: this.generateAliases(repo.name),
        last_updated: repo.updated_at,
        size: repo.size,
        language: repo.language,
        private: repo.private
      }));

      console.log(`✅ Discovered ${discoveredRepos.length} repositories`);
      return discoveredRepos;
    } catch (error) {
      console.error('❌ Failed to discover repositories:', error.message);
      return [];
    }
  }

  // 🧠 Generate GPT ID from repo name
  generateGptId(repoName) {
    return repoName
      .replace(/^GPT/i, '')
      .replace(/^VIP/, '')
      .replace(/Party$/, '')
      .replace(/Bot$/, '')
      .trim() || repoName;
  }

  // 🏷️ Generate intelligent aliases
  generateAliases(repoName) {
    const aliases = [];
    const lowerName = repoName.toLowerCase();

    // Add variations
    aliases.push(lowerName);
    aliases.push(lowerName.replace('gpt', ''));
    aliases.push(lowerName.replace('vip', ''));

    // Add keyword-based aliases
    const keywords = {
      'toy': ['toy', 'party', 'fun'],
      'email': ['email', 'mail', 'message'],
      'chat': ['chat', 'conversation', 'talk'],
      'data': ['data', 'process', 'analytics'],
      'bot': ['bot', 'assistant', 'ai']
    };

    for (const [key, values] of Object.entries(keywords)) {
      if (lowerName.includes(key)) {
        aliases.push(...values);
      }
    }

    return [...new Set(aliases)]; // Remove duplicates
  }

  // 🔄 Auto-update deploy.json with discovered repos
  async updateDeployConfig(discoveredRepos) {
    const deployConfig = {
      repos: discoveredRepos,
      default_repo: discoveredRepos[0]?.repo_name || 'ToyParty',
      auto_create_repos: true,
      last_auto_update: new Date().toISOString(),
      total_repos: discoveredRepos.length,
      discovery_settings: {
        auto_discover: true,
        discovery_interval_hours: 24,
        include_private: false,
        min_size_kb: 0
      }
    };

    fs.writeFileSync('deploy.json', JSON.stringify(deployConfig, null, 2));
    console.log(`✅ Updated deploy.json with ${discoveredRepos.length} repositories`);
  }

  // 🌐 Make GitHub API request
  makeGitHubRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        path: path,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'Dynamic-Repo-Manager/1.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // 🎯 Smart repo selection with ML-like scoring
  findBestRepoMatch(searchTerm, repos) {
    const scores = repos.map(repo => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      const repoName = repo.repo_name.toLowerCase();
      const gptId = repo.gpt_id?.toLowerCase() || '';

      // Exact matches get highest score
      if (repoName === term || gptId === term) score += 100;

      // Partial matches
      if (repoName.includes(term) || term.includes(repoName)) score += 50;
      if (gptId.includes(term) || term.includes(gptId)) score += 75;

      // Alias matches
      if (repo.aliases?.some(alias => alias === term)) score += 90;
      if (repo.aliases?.some(alias => alias.includes(term))) score += 40;

      // Recent activity bonus
      const daysSinceUpdate = (Date.now() - new Date(repo.last_updated)) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 10;

      // Language bonus
      if (repo.language && term.includes(repo.language.toLowerCase())) score += 20;

      return { repo, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.score > 0 ? scores[0].repo : null;
  }
}

module.exports = DynamicRepoManager;

// 🚀 Auto-discovery on module load
if (require.main === module) {
  const manager = new DynamicRepoManager(process.env.GITHUB_TOKEN);

  async function runAutoDiscovery() {
    try {
      const discoveredRepos = await manager.discoverAllRepos();
      await manager.updateDeployConfig(discoveredRepos);
      console.log('🎉 Auto-discovery completed successfully!');
    } catch (error) {
      console.error('❌ Auto-discovery failed:', error.message);
    }
  }

  runAutoDiscovery();
}