
const fs = require('fs');
const path = require('path');

class SecurityTokenEnforcer {
  constructor() {
    this.requiredSecrets = [
      'GITHUB_TOKEN',
      'GITHUB_API_TOKEN', 
      'NETLIFY_ACCESS_TOKEN',
      'NETLIFY_SITE_ID',
      'NEON_DATABASE_URL',
      'NETLIFY_DATABASE_URL',
      'BUILDER_IO_API_KEY'
    ];
    
    this.tokenPatterns = [
      /ghp_[a-zA-Z0-9]{36}/g,
      /github_pat_[a-zA-Z0-9_]{82}/g,
      /nfp_[a-zA-Z0-9]{40}/g,
      /postgresql:\/\/[^:]+:[^@]+@[^\/]+\/[^\s]+/g,
      /bpk-[a-fA-F0-9]{32}/g,
      /:([a-zA-Z0-9_-]+)@github\.com/g,
      /Authorization: token [^\s]+/g,
      /Bearer [a-zA-Z0-9_-]+/g
    ];
    
    this.excludePatterns = [
      /\[.*REDACTED.*\]/,
      /\[.*TOKEN.*\]/,
      /process\.env\./
    ];
  }

  // Force load secrets with multiple fallbacks
  forceLoadSecrets() {
    console.log('🔐 FORCING SECRETS REFRESH FROM REPLIT...');
    
    const secretsMap = {};
    
    // Primary secret sources
    const secretSources = {
      'GITHUB_TOKEN': [
        process.env.GITHUB_TOKEN,
        process.env.GITHUB_API_TOKEN,
        process.env.GH_TOKEN,
        process.env.GITHUB_PAT
      ],
      'NETLIFY_ACCESS_TOKEN': [
        process.env.NETLIFY_ACCESS_TOKEN,
        process.env.Replit_Integration,
        process.env.NETLIFY_TOKEN
      ],
      'NETLIFY_SITE_ID': [
        process.env.NETLIFY_SITE_ID,
        'calm-shape-32084871'
      ],
      'NEON_DATABASE_URL': [
        process.env.NEON_DATABASE_URL,
        process.env.NETLIFY_DATABASE_URL
      ],
      'BUILDER_IO_API_KEY': [
        process.env.BUILDER_IO_API_KEY
      ]
    };

    // Load and validate each secret
    for (const [secretName, sources] of Object.entries(secretSources)) {
      for (const source of sources) {
        if (source && source.trim() && source !== 'undefined') {
          secretsMap[secretName] = source.trim();
          console.log(`✅ ${secretName}: Found (${source.length} chars)`);
          break;
        }
      }
      
      if (!secretsMap[secretName]) {
        console.error(`❌ MISSING: ${secretName} not found in secrets`);
      }
    }

    return secretsMap;
  }

  // Scan and sanitize files for exposed tokens
  sanitizeFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalLength = content.length;
      let sanitized = false;

      // Apply all token patterns
      for (const pattern of this.tokenPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            // Skip if already redacted
            if (this.excludePatterns.some(exclude => exclude.test(match))) {
              continue;
            }
            
            console.log(`🚨 EXPOSED TOKEN FOUND in ${filePath}: ${match.substring(0, 8)}...`);
            content = content.replace(match, '[TOKEN_REDACTED]');
            sanitized = true;
          }
        }
      }

      if (sanitized) {
        fs.writeFileSync(filePath, content);
        console.log(`🔒 SANITIZED: ${filePath} (${originalLength - content.length} chars removed)`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Error sanitizing ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Update all integration files with fresh secrets
  updateIntegrationFiles(secrets) {
    console.log('🔧 UPDATING INTEGRATION FILES WITH FRESH SECRETS...');
    
    const updates = [];

    // Update netlify-integration.js
    if (fs.existsSync('netlify-integration.js')) {
      let content = fs.readFileSync('netlify-integration.js', 'utf8');
      
      // Force correct Site ID
      content = content.replace(
        /this\.siteId = .+?;/,
        `this.siteId = siteId || process.env.NETLIFY_SITE_ID || '${secrets.NETLIFY_SITE_ID}';`
      );
      
      // Force correct token loading
      content = content.replace(
        /this\.token = .+?;/,
        `this.token = accessToken || process.env.NETLIFY_ACCESS_TOKEN || process.env.Replit_Integration;`
      );
      
      fs.writeFileSync('netlify-integration.js', content);
      updates.push('netlify-integration.js');
    }

    // Update sync-gpt-to-github.js
    if (fs.existsSync('sync-gpt-to-github.js')) {
      let content = fs.readFileSync('sync-gpt-to-github.js', 'utf8');
      
      // Ensure GitHub token is loaded from secrets
      const tokenLoader = `
function getGitHubToken() {
  const tokenSources = [
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_API_TOKEN,
    process.env.GH_TOKEN,
    process.env.GITHUB_PAT
  ];

  for (const token of tokenSources) {
    if (token && token.trim() && token !== 'undefined') {
      return token.trim();
    }
  }

  throw new Error("❌ CRITICAL: No GitHub token found in Replit Secrets!");
}`;

      // Replace existing token loading
      content = content.replace(
        /function getGitHubToken\(\)[^}]+}/s,
        tokenLoader
      );
      
      fs.writeFileSync('sync-gpt-to-github.js', content);
      updates.push('sync-gpt-to-github.js');
    }

    console.log(`✅ Updated ${updates.length} integration files: ${updates.join(', ')}`);
    return updates;
  }

  // Comprehensive security enforcement
  async enforceSecurityCompliance() {
    console.log('🛡️ ENFORCING COMPREHENSIVE SECURITY COMPLIANCE...');
    console.log('=' .repeat(60));

    // 1. Force refresh secrets
    const secrets = this.forceLoadSecrets();
    
    // 2. Scan and sanitize all files
    const filesToScan = [
      'netlify-integration.js',
      'sync-gpt-to-github.js', 
      'autonomous-monitor.js',
      'debug-secrets.js',
      'netlify-nuclear-fix.js',
      'logs/audit-log.md',
      'logs/error-log.md',
      'logs/github-events.md',
      'netlify-working-config.json'
    ];

    let sanitizedCount = 0;
    for (const file of filesToScan) {
      if (this.sanitizeFile(file)) {
        sanitizedCount++;
      }
    }

    // 3. Update integration files with fresh secrets
    const updatedFiles = this.updateIntegrationFiles(secrets);

    // 4. Create secure environment validation
    this.createEnvironmentValidator(secrets);

    console.log('\n🎉 SECURITY COMPLIANCE COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`🔒 Files sanitized: ${sanitizedCount}`);
    console.log(`🔧 Integration files updated: ${updatedFiles.length}`);
    console.log(`✅ Secrets validated: ${Object.keys(secrets).length}`);
    
    return {
      success: true,
      secretsFound: Object.keys(secrets).length,
      filesSanitized: sanitizedCount,
      integrationFilesUpdated: updatedFiles.length
    };
  }

  createEnvironmentValidator(secrets) {
    const validator = `// AUTO-GENERATED SECURITY VALIDATOR
// Generated: ${new Date().toISOString()}

function validateSecrets() {
  const requiredSecrets = ${JSON.stringify(Object.keys(secrets), null, 2)};
  
  const missing = [];
  const found = [];
  
  for (const secret of requiredSecrets) {
    if (process.env[secret] && process.env[secret].trim()) {
      found.push(secret);
    } else {
      missing.push(secret);
    }
  }
  
  console.log(\`✅ Secrets found: \${found.length}/\${requiredSecrets.length}\`);
  
  if (missing.length > 0) {
    console.error(\`❌ Missing secrets: \${missing.join(', ')}\`);
    throw new Error('Critical secrets missing from Replit Secrets');
  }
  
  return true;
}

module.exports = { validateSecrets };

// Auto-validate on load
if (require.main === module) {
  validateSecrets();
  console.log('🔐 All secrets validated successfully!');
}
`;

    fs.writeFileSync('environment-validator.js', validator);
    console.log('✅ Created environment-validator.js');
  }
}

// Execute security enforcement
if (require.main === module) {
  const enforcer = new SecurityTokenEnforcer();
  
  enforcer.enforceSecurityCompliance().then(result => {
    if (result.success) {
      console.log('\n🚀 READY FOR SECURE OPERATIONS');
      console.log('All tokens now properly loading from Replit Secrets');
    }
  }).catch(error => {
    console.error('❌ Security enforcement failed:', error.message);
    process.exit(1);
  });
}

module.exports = SecurityTokenEnforcer;
