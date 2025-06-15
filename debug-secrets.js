
console.log('🔍 SECRET DETECTION DEBUG');
console.log('========================');

// Check all possible token variations
const tokenChecks = [
  'NETLIFY_TOKEN',
  'NETLIFY_ACCESS_TOKEN', 
  'Replit_Deploy_Token',
  'REPLIT_DEPLOY_TOKEN',
  'netlify_token',
  'replit_deploy_token'
];

tokenChecks.forEach(key => {
  const value = process.env[key];
  console.log(`${key}: ${value ? `Found (${value.substring(0,8)}...)` : 'Missing'}`);
});

console.log('\n📋 Site ID Check:');
console.log(`NETLIFY_SITE_ID: ${process.env.NETLIFY_SITE_ID || 'Missing'}`);

console.log('\n🔧 All Environment Variables containing "NETLIFY" or "TOKEN":');
Object.keys(process.env)
  .filter(key => key.includes('NETLIFY') || key.includes('TOKEN') || key.includes('REPLIT'))
  .forEach(key => {
    const value = process.env[key];
    console.log(`${key}: ${value ? (value.length > 20 ? `${value.substring(0,8)}...` : value) : 'Empty'}`);
  });
