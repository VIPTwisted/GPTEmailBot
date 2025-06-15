
const fs = require('fs');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

async function buildCSS() {
  console.log('🎨 Building production CSS...');
  
  try {
    const css = fs.readFileSync('src/index.css', 'utf8');
    
    const result = await postcss([
      tailwindcss,
      autoprefixer
    ]).process(css, { from: 'src/index.css', to: 'public/styles.css' });
    
    // Ensure public directory exists
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }
    
    fs.writeFileSync('public/styles.css', result.css);
    
    if (result.map) {
      fs.writeFileSync('public/styles.css.map', result.map.toString());
    }
    
    console.log('✅ CSS built successfully to public/styles.css');
    
    // Also create a minified version
    const CleanCSS = require('clean-css');
    const minified = new CleanCSS().minify(result.css);
    fs.writeFileSync('public/styles.min.css', minified.styles);
    
    console.log('✅ Minified CSS created at public/styles.min.css');
    
  } catch (error) {
    console.error('❌ CSS build failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildCSS();
}

module.exports = buildCSS;
