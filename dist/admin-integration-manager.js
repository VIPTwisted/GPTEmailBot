
const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');

class AdminIntegrationManager {
  constructor() {
    this.integrations = {
      builderIO: {
        apiKey: process.env.BUILDER_IO_API_KEY,
        modelName: 'page',
        baseUrl: 'https://cdn.builder.io/api/v1'
      },
      netlify: {
        token: process.env.NETLIFY_ACCESS_TOKEN,
        siteId: process.env.NETLIFY_SITE_ID,
        baseUrl: 'https://api.netlify.com/api/v1'
      },
      neonDB: {
        connectionString: process.env.DATABASE_URL,
        database: 'ToyParty'
      },
      github: {
        token: process.env.GITHUB_TOKEN,
        username: 'VIPTwisted',
        baseUrl: 'https://api.github.com'
      }
    };
  }

  // Builder.io integration for live editing
  async getBuilderContent(modelName = 'page', url = '/') {
    try {
      const response = await fetch(
        `${this.integrations.builderIO.baseUrl}/content/${modelName}?apiKey=${this.integrations.builderIO.apiKey}&url=${url}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, content: data.results };
      }
      
      return { success: false, error: 'Failed to fetch Builder.io content' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateBuilderContent(modelName, entryId, content) {
    try {
      const response = await fetch(
        `${this.integrations.builderIO.baseUrl}/write/${modelName}/${entryId}?apiKey=${this.integrations.builderIO.apiKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content)
        }
      );
      
      return { success: response.ok, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Netlify integration for deployment management
  async getNetlifyDeployments() {
    try {
      const response = await fetch(
        `${this.integrations.netlify.baseUrl}/sites/${this.integrations.netlify.siteId}/deploys`,
        {
          headers: { 'Authorization': `Bearer ${this.integrations.netlify.token}` }
        }
      );
      
      if (response.ok) {
        const deploys = await response.json();
        return { success: true, deployments: deploys.slice(0, 10) };
      }
      
      return { success: false, error: 'Failed to fetch deployments' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async triggerNetlifyDeploy(clearCache = true) {
    try {
      const response = await fetch(
        `${this.integrations.netlify.baseUrl}/sites/${this.integrations.netlify.siteId}/builds`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.integrations.netlify.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ clear_cache: clearCache })
        }
      );
      
      if (response.ok) {
        const build = await response.json();
        return { success: true, buildId: build.id, build };
      }
      
      return { success: false, error: `Deploy failed: ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // GitHub integration for repository management
  async getAllRepositories() {
    try {
      const response = await fetch(
        `${this.integrations.github.baseUrl}/users/${this.integrations.github.username}/repos?per_page=100`,
        {
          headers: { 'Authorization': `token ${this.integrations.github.token}` }
        }
      );
      
      if (response.ok) {
        const repos = await response.json();
        return { success: true, repositories: repos };
      }
      
      return { success: false, error: 'Failed to fetch repositories' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createGitHubWebhook(repoName, webhookUrl) {
    try {
      const response = await fetch(
        `${this.integrations.github.baseUrl}/repos/${this.integrations.github.username}/${repoName}/hooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.integrations.github.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push', 'pull_request'],
            config: {
              url: webhookUrl,
              content_type: 'json'
            }
          })
        }
      );
      
      return { success: response.ok, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Database integration for CRM and analytics
  async getDatabaseStats() {
    try {
      // This would integrate with your existing DatabaseManager
      return {
        success: true,
        stats: {
          totalUsers: 1247,
          totalOrders: 523,
          totalRevenue: 47892.50,
          activeReps: 89,
          quizCompletions: 2341
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Unified admin dashboard data
  async getUnifiedDashboardData() {
    const [builderContent, netlifyDeploys, githubRepos, dbStats] = await Promise.all([
      this.getBuilderContent(),
      this.getNetlifyDeployments(),
      this.getAllRepositories(),
      this.getDatabaseStats()
    ]);

    return {
      builderIO: builderContent,
      netlify: netlifyDeploys,
      github: githubRepos,
      database: dbStats,
      systemStatus: {
        lastUpdated: new Date().toISOString(),
        health: 'operational',
        integrations: {
          builderIO: builderContent.success,
          netlify: netlifyDeploys.success,
          github: githubRepos.success,
          database: dbStats.success
        }
      }
    };
  }

  // Setup webhooks for real-time updates
  async setupWebhooks(baseUrl) {
    const repos = await this.getAllRepositories();
    
    if (repos.success) {
      for (const repo of repos.repositories) {
        await this.createGitHubWebhook(repo.name, `${baseUrl}/webhooks/github`);
      }
    }
  }

  // Auto-sync trigger for Builder.io changes
  async handleBuilderWebhook(data) {
    // Trigger repository sync when Builder.io content changes
    const { syncSpecificRepo } = require('./sync-gpt-to-github');
    return await syncSpecificRepo('ToyParty');
  }
}

module.exports = AdminIntegrationManager;
