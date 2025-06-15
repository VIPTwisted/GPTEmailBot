
const fs = require('fs');

const FAILED_REPOS_LOG = "logs/failed-repos.json";

function viewFailedRepos() {
  if (!fs.existsSync(FAILED_REPOS_LOG)) {
    console.log("✅ No failed repositories found!");
    return;
  }

  try {
    const failedRepos = JSON.parse(fs.readFileSync(FAILED_REPOS_LOG, "utf8"));
    
    if (failedRepos.failed_repos.length === 0) {
      console.log("✅ No failed repositories found!");
      return;
    }

    console.log(`\n🚨 FAILED REPOSITORIES REPORT`);
    console.log(`📊 Total failures: ${failedRepos.total_failures}`);
    console.log(`🕐 Last updated: ${failedRepos.last_updated}`);
    console.log(`📋 Failed repos (${failedRepos.failed_repos.length}):\n`);

    failedRepos.failed_repos.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.repo}`);
      console.log(`   🌿 Branch: ${repo.branch}`);
      console.log(`   ❌ Error: ${repo.error || repo.last_error}`);
      console.log(`   🔄 Attempts: ${repo.attempts}`);
      console.log(`   ⏰ Last attempt: ${repo.last_attempt || repo.timestamp}`);
      console.log();
    });

    // Recommendations
    console.log("💡 RECOMMENDATIONS:");
    failedRepos.failed_repos.forEach(repo => {
      if (repo.error && repo.error.includes("Repository not found")) {
        console.log(`   • Create repository: ${repo.repo}`);
      } else if (repo.error && repo.error.includes("Permission denied")) {
        console.log(`   • Check GitHub token permissions for: ${repo.repo}`);
      }
    });

  } catch (error) {
    console.error("❌ Error reading failed repos log:", error.message);
  }
}

function clearFailedRepos() {
  if (!fs.existsSync(FAILED_REPOS_LOG)) {
    console.log("✅ No failed repositories to clear!");
    return;
  }

  try {
    // Reset the failed repos file
    const emptyFailedRepos = {
      failed_repos: [],
      last_updated: new Date().toISOString(),
      total_failures: 0
    };
    
    fs.writeFileSync(FAILED_REPOS_LOG, JSON.stringify(emptyFailedRepos, null, 2));
    console.log("✅ Failed repositories cleared! All repos will be attempted on next sync.");
    
  } catch (error) {
    console.error("❌ Error clearing failed repos:", error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--clear')) {
    clearFailedRepos();
  } else {
    viewFailedRepos();
  }
}

module.exports = { viewFailedRepos, clearFailedRepos };
