
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DEPLOY_CONFIG = "deploy.json";
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || "").trim();
const AUTHOR_NAME = "GPT Autobot - FIXING WRONG SYNC";
const AUTHOR_EMAIL = "gpt@autobot.ai";

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
  const excludeDirs = ['.git', 'node_modules', '.replit'];
  const excludeFiles = ['.gitignore', 'package-lock.json', '.replit'];

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    fs.readdirSync(dir, { withFileTypes: true }).forEach((item) => {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !excludeDirs.includes(item.name)) {
        scanDirectory(fullPath);
      } else if (item.isFile() && !excludeFiles.includes(item.name)) {
        files.push(fullPath);
      }
    });
  }

  scanDirectory('.');
  console.log(`📁 Discovered ${files.length} files to sync`);
  return files;
}

function fixSyncToRepo(repoConfig, reason = "") {
  const { repo_owner, repo_name, branch = "main", username } = repoConfig;

  try {
    const filesToPush = discoverFiles();
    if (!filesToPush.length) {
      console.error("❌ No files to push.");
      return { success: false, error: "No files found" };
    }

    const COMMIT_MESSAGE = `🔧 FIXING WRONG SYNC - Correcting repo targeting
${reason}
- ${filesToPush.length} files synced to correct repo
- Fixed: ${repo_owner}/${repo_name}`;

    console.log(`🛠️ FIXING SYNC: ${repo_owner}/${repo_name} (${branch})`);
    console.log(`📝 Reason: ${reason}`);

    run("rm -rf .git");
    run(`git init --initial-branch=${branch}`);
    run(`git config user.email "${AUTHOR_EMAIL}"`);
    run(`git config user.name "${AUTHOR_NAME}"`);

    const remote = `https://${username}:${GITHUB_TOKEN}@github.com/${repo_owner}/${repo_name}.git`;
    run(`git remote add origin ${remote}`);

    filesToPush.forEach((file) => {
      if (fs.existsSync(file)) {
        run(`git add -f ${file}`);
      }
    });

    run(`git commit -m "${COMMIT_MESSAGE}"`);
    run(`git push -u origin ${branch} --force`);

    console.log(`✅ FIX COMPLETED: ${repo_owner}/${repo_name}`);
    return { success: true, files: filesToPush.length, repo: `${repo_owner}/${repo_name}` };
  } catch (error) {
    console.error(`❌ FIX FAILED for ${repo_owner}/${repo_name}: ${error.message}`);
    return { success: false, error: error.message, repo: `${repo_owner}/${repo_name}` };
  }
}

function fixAllRepos() {
  if (!fs.existsSync(DEPLOY_CONFIG)) {
    console.error(`❌ ${DEPLOY_CONFIG} not found`);
    return;
  }

  const config = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, "utf8"));
  const results = [];

  console.log(`🛠️ FIXING WRONG SYNCS FOR ALL REPOSITORIES`);
  console.log(`🎯 Will sync current code to ALL ${config.repos.length} repos`);
  console.log(`🔧 This will ensure all repos have the latest correct content\n`);

  for (const repo of config.repos) {
    const reason = `Ensuring ${repo.repo_name} has correct content (was auto-synced on startup)`;
    const result = fixSyncToRepo(repo, reason);
    results.push(result);
  }

  // Report summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n🛠️ ═══════════════════════════════════════════════════════`);
  console.log(`🎉 FIX SYNC SUMMARY`);
  console.log(`🛠️ ═══════════════════════════════════════════════════════`);
  console.log(`✅ Successfully fixed: ${successful}/${config.repos.length} repositories`);
  console.log(`❌ Failed fixes: ${failed}/${config.repos.length} repositories`);
  console.log(`🛠️ ═══════════════════════════════════════════════════════`);

  results.forEach(result => {
    if (result.success) {
      console.log(`   ✅ ${result.repo}: ${result.files} files synced correctly`);
    } else {
      console.log(`   ❌ ${result.repo}: ${result.error}`);
    }
  });

  console.log(`\n🎉 All repositories should now have the correct content!`);
  return results;
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    fixAllRepos();
  } else {
    console.log("Usage: node fix-wrong-syncs.js");
    console.log("This will sync the current code to ALL repositories in deploy.json");
  }
}

module.exports = { fixAllRepos, fixSyncToRepo };
