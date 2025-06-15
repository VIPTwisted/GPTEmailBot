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
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || "").trim();
const AUTHOR_NAME = "GPT Autobot";
const AUTHOR_EMAIL = "gpt@autobot.ai";
const COMMIT_MESSAGE_BASE = "🚀 GPT WEBHOOK SYNC #gpt:hooked";
const AUDIT_LOG = "logs/audit-log.md";

// === VALIDATION ===
function validateEnvironment() {
  if (!GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN environment variable is required");
    process.exit(1);
  }
  console.log("✅ GitHub token found");
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

    for (const repo of config.repos) {
      if (!repo.repo_owner || !repo.repo_name || !repo.username) {
        console.error(
          "❌ Each repo must have repo_owner, repo_name, and username",
        );
        return false;
      }
    }

    console.log(`✅ deploy.json validated with ${config.repos.length} repo(s)`);
    return true;
  } catch (err) {
    console.error(`❌ Invalid JSON in ${DEPLOY_CONFIG}: ${err.message}`);
    return false;
  }
}

// === IMPROVED ERROR HANDLING ===
function run(cmd) {
  try {
    console.log(`🔧 Running: ${cmd}`);
    const result = execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    return result;
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    console.error(`❌ Error: ${err.message}`);
    if (err.stdout) console.error(`❌ Stdout: ${err.stdout}`);
    if (err.stderr) console.error(`❌ Stderr: ${err.stderr}`);
    throw new Error(`Command execution failed: ${cmd}`);
  }
}

function getCommitSHA() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "UNKNOWN";
  }
}

function discoverFiles() {
  const baseDirs = ["src", "logs"];
  const files = [];
  baseDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
      const filePath = path.join(dir, file.name);
      if (file.isFile()) files.push(filePath);
    });
  });
  return files;
}

function writeAuditLog(commitSHA, files) {
  fs.mkdirSync("logs", { recursive: true });
  fs.appendFileSync(
    AUDIT_LOG,
    `\n## ${new Date().toISOString()} – GPT WEBHOOK COMMIT\n- Files: ${files.join(", ")}\n- SHA: ${commitSHA}\n- Author: ${AUTHOR_NAME}`,
  );
}

function syncRepo(repoConfig) {
  const {
    repo_owner,
    repo_name,
    branch = DEFAULT_BRANCH,
    username,
  } = repoConfig;

  try {
    const filesToPush = discoverFiles();
    if (!filesToPush.length) {
      console.error("❌ No files to push.");
      return { success: false, error: "No files found" };
    }

    const COMMIT_MESSAGE = `${COMMIT_MESSAGE_BASE}\n- ${filesToPush.length} files`;

    console.log(`🌐 SYNCING: ${repo_owner}/${repo_name} (${branch})`);

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
    const sha = getCommitSHA();
    writeAuditLog(sha, filesToPush);
    run(`git add -f ${AUDIT_LOG}`);
    run(`git commit -m "🧾 Audit log via Webhook – ${sha}"`);
    run(`git push -u origin ${branch} --force`);

    console.log(`✅ PUSH SUCCESS: ${repo_owner}/${repo_name}`);
    return { success: true, sha, files: filesToPush.length };
  } catch (error) {
    console.error(
      `❌ SYNC FAILED for ${repo_owner}/${repo_name}: ${error.message}`,
    );
    return { success: false, error: error.message };
  }
}

// === SYNC MULTIPLE FROM CONFIG
function syncAllRepos() {
  if (!validateDeployConfig()) {
    return { success: false, error: "Invalid deploy.json configuration" };
  }

  const config = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, "utf8"));
  const results = [];

  for (const repo of config.repos) {
    const result = syncRepo(repo);
    results.push({ repo: `${repo.repo_owner}/${repo.repo_name}`, ...result });
  }

  return { success: true, results };
}

// === SECURE ENDPOINTS ===

// GET /gpt - Manual trigger endpoint
app.get("/gpt", (req, res) => {
  console.log("🌐 GET /gpt → Manual sync triggered");

  const syncResult = syncAllRepos();

  if (!syncResult.success) {
    return res.status(500).json({
      success: false,
      message: "Sync failed",
      error: syncResult.error,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: "GPT sync completed successfully",
    results: syncResult.results,
    timestamp: new Date().toISOString(),
  });
});

// POST /sync - Webhook endpoint
app.post("/sync", (req, res) => {
  console.log("📡 POST /sync → Webhook triggered");

  const syncResult = syncAllRepos();

  if (!syncResult.success) {
    return res.status(500).json({
      success: false,
      message: "Webhook sync failed",
      error: syncResult.error,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: "Webhook sync completed",
    results: syncResult.results,
    timestamp: new Date().toISOString(),
  });
});

// POST /github - GitHub webhook endpoint
app.post("/github", (req, res) => {
  const event = req.headers["x-github-event"] || "unknown";
  console.log(`📦 GitHub Webhook Event: ${event}`);

  // Log webhook events
  try {
    fs.mkdirSync("logs", { recursive: true });
    fs.appendFileSync(
      "logs/github-events.md",
      `\n---\n${new Date().toISOString()} – ${event}\n${JSON.stringify(req.body, null, 2)}`,
    );
  } catch (err) {
    console.error("❌ Failed to log GitHub event:", err.message);
  }

  if (event === "push") {
    const syncResult = syncAllRepos();

    if (!syncResult.success) {
      return res.status(500).json({
        success: false,
        message: "GitHub push sync failed",
        error: syncResult.error,
        event: event,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: "GitHub push sync completed",
      results: syncResult.results,
      event: event,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      success: true,
      message: `Event '${event}' received but ignored (not a push)`,
      event: event,
      timestamp: new Date().toISOString(),
    });
  }
});

// === ROOT ENDPOINT ===
app.get("/", (req, res) => {
  res.json({
    message: "✅ GPT Sync Webhook Server Ready",
    endpoints: {
      "GET /": "Server status",
      "GET /gpt": "Manual sync trigger",
      "POST /sync": "Generic webhook",
      "POST /github": "GitHub webhook",
    },
    timestamp: new Date().toISOString(),
  });
});

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// === STARTUP VALIDATION & SERVER START ===
console.log("🚀 Starting GPT Sync Webhook Server...");
validateEnvironment();

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Webhook server listening at http://0.0.0.0:${port}`);
  console.log(`🌐 Available endpoints:`);
  console.log(`   GET  / - Server status`);
  console.log(`   GET  /gpt - Manual sync trigger`);
  console.log(`   POST /sync - Generic webhook`);
  console.log(`   POST /github - GitHub webhook`);
});

console.log("✅ Routes available:");
app._router && app._router.stack
  .filter((r) => r.route)
  .forEach((r) =>
    console.log(
      `${Object.keys(r.route.methods)[0].toUpperCase()}  ${r.route.path}`
    )
  );

// === AUTO-TRIGGER SYNC ON STARTUP
console.log("⚙️ GPT Auto Sync: Running initial sync...");
syncAllRepos();
