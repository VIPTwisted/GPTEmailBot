// AUTO-GENERATED SECURITY VALIDATOR
// Generated: 2025-06-14T13:41:30.723Z

function validateSecrets() {
  const requiredSecrets = [
  "GITHUB_TOKEN",
  "NETLIFY_ACCESS_TOKEN",
  "NETLIFY_SITE_ID",
  "NEON_DATABASE_URL",
  "BUILDER_IO_API_KEY"
];
  
  const missing = [];
  const found = [];
  
  for (const secret of requiredSecrets) {
    if (process.env[secret] && process.env[secret].trim()) {
      found.push(secret);
    } else {
      missing.push(secret);
    }
  }
  
  console.log(`✅ Secrets found: ${found.length}/${requiredSecrets.length}`);
  
  if (missing.length > 0) {
    console.error(`❌ Missing secrets: ${missing.join(', ')}`);
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
