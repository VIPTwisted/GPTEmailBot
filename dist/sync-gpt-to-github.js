const { getGitHubToken, validateAllSecrets } = require('./universal-secret-loader.js');
const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// === CORE SYNC CONFIG ===
const DEPLOY_CONFIG = "deploy.json";
const DEFAULT_BRANCH = "main";

// 🔐 FORCE TOKEN FROM SECRETS
// Token loading handled by universal-secret-loader.js

const GITHUB_TOKEN = getGitHubToken();
const AUTHOR_NAME = "GPT Autobot";
const AUTHOR_EMAIL = "gpt@autobot.ai";
const COMMIT_MESSAGE_BASE = "🚀 GPT AUTONOMOUS SYNC #gpt:hooked";
const AUDIT_LOG = "logs/audit-log.md";

// === VALIDATION ===
function validateEnvironment() {
  console.log("🔐 VALIDATING SECRETS CONFIGURATION...");

  if (!GITHUB_TOKEN) {
    console.error("❌ CRITICAL: GitHub token not found in Secrets!");
    process.exit(1);
  }

  console.log(`✅ GitHub token loaded from Secrets (${GITHUB_TOKEN.length} chars)`);
}

function validateDeployConfig() {
  if (!fs.existsSync(DEPLOY_CONFIG)) {
    console.error(`❌ ${DEPLOY_CONFIG} not found`);
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, "utf8"));

    if (!config.repos || !Array.isArray(config.repos)) {
      console.error("❌ deploy.json must contain 'repos' array");
      return false;
    }

    console.log(`✅ deploy.json validated with ${config.repos.length} repo(s)`);
    return true;
  } catch (err) {
    console.error(`❌ Invalid JSON in ${DEPLOY_CONFIG}: ${err.message}`);
    return false;
  }
}

function run(cmd) {
  try {
    console.log(`🔧 Running: ${cmd}`);
    const result = execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    return result;
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    console.error(`❌ Error: ${err.message}`);
    throw new Error(`Command execution failed: ${cmd}`);
  }
}

function discoverFiles() {
  const files = [];
  const excludeDirs = ['.git', 'node_modules', '.replit', '.cache', 'logs'];
  const excludeFiles = ['.gitignore', 'package-lock.json', '.replit'];

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory() && !excludeDirs.includes(item.name)) {
          scanDirectory(fullPath);
        } else if (item.isFile() && !excludeFiles.includes(item.name)) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`❌ Error scanning directory ${dir}: ${err.message}`);
    }
  }

  scanDirectory('.');
  console.log(`📁 Discovered ${files.length} files`);
  return files;
}

async function syncRepo(repoConfig) {
  const { repo_owner, repo_name, branch = DEFAULT_BRANCH, username } = repoConfig;

  try {
    const filesToPush = discoverFiles();
    if (!filesToPush.length) {
      console.error("❌ No files to push.");
      return { success: false, error: "No files found" };
    }

    const COMMIT_MESSAGE = `${COMMIT_MESSAGE_BASE}

📊 SYNC DETAILS:
- Files synchronized: ${filesToPush.length}
- Repository: ${repo_owner}/${repo_name}
- Branch: ${branch}
- Timestamp: ${new Date().toISOString()}

✅ 100% Autonomous GPT Integration`;

    console.log(`🌐 SYNCING: ${repo_owner}/${repo_name} (${branch})`);

    run("rm -rf .git");
    run(`git init --initial-branch=${branch}`);
    run(`git config user.email "${AUTHOR_EMAIL}"`);
    run(`git config user.name "${AUTHOR_NAME}"`);

    const remote = `https://${username}:${GITHUB_TOKEN}@github.com/${repo_owner}/${repo_name}.git`;
    run(`git remote add origin ${remote}`);

    // Add files
    filesToPush.forEach(file => {
      if (fs.existsSync(file)) {
        run(`git add -f "${file}"`);
      }
    });

    run(`git commit -m "${COMMIT_MESSAGE}"`);
    run(`git push -u origin ${branch} --force`);

    console.log(`✅ PUSH SUCCESS: ${repo_owner}/${repo_name}`);
    return { success: true, files: filesToPush.length };

  } catch (error) {
    console.error(`❌ SYNC FAILED for ${repo_owner}/${repo_name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function findRepoByName(repoName) {
  if (!validateDeployConfig()) return null;

  const config = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, "utf8"));
  const searchTerm = repoName.toLowerCase().trim();

  // Try exact match first
  let repo = config.repos.find(r => r.repo_name.toLowerCase() === searchTerm);
  if (repo) return repo;

  // Try GPT ID match
  repo = config.repos.find(r => r.gpt_id && r.gpt_id.toLowerCase() === searchTerm);
  if (repo) return repo;

  // Try partial match
  repo = config.repos.find(r => 
    r.repo_name.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(r.repo_name.toLowerCase())
  );
  if (repo) return repo;

  return null;
}

async function syncSpecificRepo(repoName) {
  const repoConfig = findRepoByName(repoName);

  if (!repoConfig) {
    console.error(`❌ Repository '${repoName}' not found in deploy.json`);
    return { success: false, error: `Repository '${repoName}' not found` };
  }

  console.log(`🎯 TARGETING: ${repoConfig.repo_owner}/${repoConfig.repo_name}`);
  const result = await syncRepo(repoConfig);

  return { success: result.success, results: [{ repo: `${repoConfig.repo_owner}/${repoConfig.repo_name}`, ...result }] };
}

async function syncAllRepos() {
  if (!validateDeployConfig()) {
    return { success: false, error: "Invalid deploy.json" };
  }

  const config = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, "utf8"));
  const results = [];

  console.log(`🚀 STARTING BULK SYNC: ${config.repos.length} repositories`);

  for (const repoConfig of config.repos) {
    const result = await syncRepo(repoConfig);
    results.push({ repo: `${repoConfig.repo_owner}/${repoConfig.repo_name}`, ...result });

    // Delay between syncs
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n🎯 BULK SYNC COMPLETE:`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  return { success: true, results, summary: { successful, failed } };
}

// === EXPRESS ROUTES ===
app.get('/', (req, res) => {
  res.json({
    status: 'GPT GitHub Sync System',
    version: '2.0',
    endpoints: {
      '/sync': 'Sync all repositories',
      '/sync/:repo': 'Sync specific repository'
    }
  });
});

app.post('/sync', async (req, res) => {
  try {
    const result = await syncAllRepos();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/sync/:repo', async (req, res) => {
  try {
    const result = await syncSpecificRepo(req.params.repo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// === MAIN EXECUTION ===
if (require.main === module) {
  validateEnvironment();

  const args = process.argv.slice(2);

  if (args.includes('--sync')) {
    syncAllRepos().then(result => {
      console.log('\n🎯 SYNC COMPLETE');
      process.exit(result.success ? 0 : 1);
    });
  } else {
    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 GPT GitHub Sync Server running on http://0.0.0.0:${port}`);
      console.log(`🔧 Use --sync flag to run sync directly`);
    });
  }
}

module.exports = { syncRepo, syncSpecificRepo, syncAllRepos, app };