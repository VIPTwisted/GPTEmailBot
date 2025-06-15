
const fs = require('fs');
const path = require('path');

function sanitizeFileContent(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;
    
    // Remove various token patterns
    content = content
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '[GITHUB_TOKEN_REDACTED]')
      .replace(/github_pat_[a-zA-Z0-9_]{82}/g, '[GITHUB_PAT_REDACTED]')
      .replace(/:([a-zA-Z0-9_-]+)@github\.com/g, ':[TOKEN_REDACTED]@github.com')
      .replace(/Authorization: token [^\s]+/g, 'Authorization: token [REDACTED]')
      .replace(/Bearer [a-zA-Z0-9_-]+/g, 'Bearer [REDACTED]');
    
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Sanitized: ${filePath} (removed ${originalLength - content.length} chars)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error sanitizing ${filePath}: ${error.message}`);
    return false;
  }
}

function cleanAllFiles() {
  const filesToClean = [
    'logs/error-log.md',
    'logs/audit-log.md', 
    'logs/github-events.md',
    'logs/failed-repos.json'
  ];
  
  let cleaned = 0;
  
  for (const file of filesToClean) {
    if (sanitizeFileContent(file)) {
      cleaned++;
    }
  }
  
  console.log(`🧹 Token cleanup complete: ${cleaned} files sanitized`);
  return cleaned;
}

if (require.main === module) {
  cleanAllFiles();
}

module.exports = { sanitizeFileContent, cleanAllFiles };iles };
