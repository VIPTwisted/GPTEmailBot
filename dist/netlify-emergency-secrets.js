
// Emergency secrets validator
const secrets = {
  NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID || '502e465d-e030-4d5e-9ef9-31ec93a2308d',
  NETLIFY_ACCESS_TOKEN: process.env.NETLIFY_ACCESS_TOKEN,
  validated: Date.now()
};

if (!secrets.NETLIFY_ACCESS_TOKEN) {
  throw new Error('NETLIFY_ACCESS_TOKEN required in Replit Secrets');
}

module.exports = secrets;
