
const fs = require('fs');
const path = require('path');

console.log('🏗️ Building ToyParty for production...');

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy main HTML file
if (fs.existsSync('index.html')) {
  fs.copyFileSync('index.html', 'dist/index.html');
  console.log('✅ Copied index.html');
}

// Copy all CSS files
const cssFiles = fs.readdirSync('.').filter(file => file.endsWith('.css'));
cssFiles.forEach(file => {
  fs.copyFileSync(file, `dist/${file}`);
  console.log(`✅ Copied ${file}`);
});

// Copy all JS files (excluding node modules and build files)
const jsFiles = fs.readdirSync('.').filter(file => 
  file.endsWith('.js') && 
  !file.includes('node_modules') && 
  file !== 'build.js'
);
jsFiles.forEach(file => {
  fs.copyFileSync(file, `dist/${file}`);
  console.log(`✅ Copied ${file}`);
});

// Copy public directory if it exists
if (fs.existsSync('public')) {
  const publicFiles = fs.readdirSync('public');
  publicFiles.forEach(file => {
    fs.copyFileSync(`public/${file}`, `dist/${file}`);
  });
  console.log(`✅ Copied ${publicFiles.length} public assets`);
}

// Copy branding assets
if (fs.existsSync('branding')) {
  if (!fs.existsSync('dist/branding')) {
    fs.mkdirSync('dist/branding');
  }
  const brandingFiles = fs.readdirSync('branding');
  brandingFiles.forEach(file => {
    if (file !== 'README.md') {
      fs.copyFileSync(`branding/${file}`, `dist/branding/${file}`);
    }
  });
  console.log(`✅ Copied branding assets`);
}

// Create production config
const prodConfig = {
  environment: 'production',
  version: '2.0',
  buildTime: new Date().toISOString(),
  features: {
    dashboards: true,
    monitoring: true,
    analytics: true,
    ai: true,
    seo: true,
    commerce: true
  }
};

fs.writeFileSync('dist/config.json', JSON.stringify(prodConfig, null, 2));
console.log('✅ Created production config');

console.log('🎉 Build complete! Ready for deployment');
