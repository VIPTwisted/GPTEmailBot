
# 🚀 GPT QUICK REFERENCE GUIDE

## ⚡ IMMEDIATE ACTION COMMANDS

### 🔥 Emergency Deployment
```bash
# Full system sync to all repositories
curl http://0.0.0.0:5000/gpt/toyparty
curl http://0.0.0.0:5000/gpt/emailbot
curl http://0.0.0.0:5000/gpt/dataprocessor
curl http://0.0.0.0:5000/gpt/analytics
curl http://0.0.0.0:5000/gpt/chatbot
```

### 📊 System Status Check
```bash
# Quick health verification
curl http://0.0.0.0:6000/admin/health
curl http://0.0.0.0:5000/sync/status
curl http://0.0.0.0:5000/monitor/repos
```

### 🚨 Emergency Recovery
```bash
# Emergency system recovery
node universal-error-recovery.js
node nuclear-sync-engine.js --force
node comprehensive-test-suite.js
```

## 🎯 KEY ENDPOINTS REFERENCE

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/gpt/{repo}` | Sync to specific repository | `{"success": true, "files": 158}` |
| `/admin/health` | System health check | `{"status": "healthy", "uptime": "99.9%"}` |
| `/sync/status` | Deployment status | `{"repositories": 5, "synced": 5, "failed": 0}` |
| `/monitor/failed` | Failed deployments | `{"failed_repos": [], "total_failures": 0}` |
| `/netlify/status` | Netlify deployment | `{"status": "success", "url": "https://toyparty.netlify.app"}` |

## 🛠️ COMMON WORKFLOWS

### 🔄 Standard Deployment Workflow
1. **Health Check** → `curl /admin/health`
2. **Sync All Repos** → `curl /gpt/{repo}` for each repo
3. **Verify Success** → `curl /sync/status`
4. **Check Netlify** → `curl /netlify/status`
5. **Report Results** → Generate status summary

### 🚨 Error Recovery Workflow
1. **Identify Errors** → `curl /monitor/failed`
2. **Execute Recovery** → `node universal-error-recovery.js`
3. **Force Sync** → `node nuclear-sync-engine.js --force`
4. **Verify Recovery** → `curl /sync/status`
5. **Document Issues** → Update audit log

## ⚠️ CRITICAL RULES REMINDER

### ❌ NEVER DO
- Ask users to download files
- Request manual deployment
- Require human intervention
- Suggest external tools

### ✅ ALWAYS DO
- Complete all tasks autonomously
- Use provided endpoints
- Handle errors automatically
- Report final status
- Maintain audit trails

## 📱 MOBILE-FRIENDLY COMMANDS

```bash
# One-line full deployment
node sync-gpt-to-github.js --sync

# Quick status check
node view-failed-repos.js

# Emergency nuclear option
node nuclear-sync-engine.js --force --all
```

## 🎓 SUCCESS CRITERIA

- **100% Autonomous Operation**
- **Zero Human Intervention Required**
- **Complete Error Recovery**
- **Comprehensive Status Reporting**
- **Continuous System Optimization**
