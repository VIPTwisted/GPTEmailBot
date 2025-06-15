
const fs = require('fs');
const path = require('path');

class DynamicLinkBuilder {
  constructor() {
    this.linkRegistry = new Map();
    this.pageRegistry = new Map();
    this.featureRegistry = new Map();
    this.systemPorts = new Map();
    
    this.initializeRegistry();
  }

  initializeRegistry() {
    // Register all system ports and endpoints
    const systems = {
      'main': { port: 5000, base: '', endpoints: ['/', '/dashboard', '/preview'] },
      'admin': { port: 6001, base: '/admin', endpoints: ['/login', '/dashboard', '/users', '/settings'] },
      'enterprise': { port: 4000, base: '/enterprise', endpoints: ['/analytics', '/reports', '/management'] },
      'commerce': { port: 8080, base: '/commerce', endpoints: ['/products', '/orders', '/inventory', '/customers'] },
      'ai': { port: 9000, base: '/ai', endpoints: ['/dashboard', '/models', '/predictions', '/training'] },
      'seo': { port: 9001, base: '/seo', endpoints: ['/keywords', '/analysis', '/campaigns', '/reports'] },
      'business': { port: 8888, base: '/business', endpoints: ['/mlm', '/crm', '/financial', '/hr'] },
      'employees': { port: 7500, base: '/employees', endpoints: ['/directory', '/timecards', '/schedule', '/performance'] },
      'gpt': { port: 8000, base: '/gpt', endpoints: ['/chat', '/assistant', '/automation', '/training'] }
    };

    for (const [key, system] of Object.entries(systems)) {
      this.systemPorts.set(key, system);
      
      system.endpoints.forEach(endpoint => {
        const fullPath = `${system.base}${endpoint}`.replace('//', '/');
        this.linkRegistry.set(fullPath, {
          system: key,
          port: system.port,
          endpoint: endpoint,
          url: `http://0.0.0.0:${system.port}${fullPath}`
        });
      });
    }

    console.log(`✅ Dynamic Link Builder: ${this.linkRegistry.size} links registered`);
  }

  generateNavigation() {
    const navigation = {
      main: [],
      admin: [],
      business: [],
      tools: []
    };

    // Main navigation
    navigation.main = [
      { name: '🏠 Home', url: this.getLink('/'), active: true },
      { name: '📊 Dashboard', url: this.getLink('/dashboard') },
      { name: '🛍️ Commerce', url: this.getLink('/commerce') },
      { name: '👥 CRM', url: this.getLink('/business/crm') }
    ];

    // Admin navigation
    navigation.admin = [
      { name: '🔐 Admin Login', url: this.getLink('/admin/login') },
      { name: '👨‍💼 User Management', url: this.getLink('/admin/users') },
      { name: '⚙️ Settings', url: this.getLink('/admin/settings') },
      { name: '📊 Analytics', url: this.getLink('/enterprise/analytics') }
    ];

    // Business navigation
    navigation.business = [
      { name: '💎 MLM System', url: this.getLink('/business/mlm') },
      { name: '👥 CRM Platform', url: this.getLink('/business/crm') },
      { name: '💰 Financial', url: this.getLink('/business/financial') },
      { name: '👨‍💼 HR Management', url: this.getLink('/business/hr') }
    ];

    // Tools navigation
    navigation.tools = [
      { name: '🤖 AI Assistant', url: this.getLink('/gpt/chat') },
      { name: '🎖️ SEO Tools', url: this.getLink('/seo/keywords') },
      { name: '👨‍💼 Employees', url: this.getLink('/employees/directory') },
      { name: '📈 Predictions', url: this.getLink('/ai/predictions') }
    ];

    return navigation;
  }

  getLink(path) {
    const linkData = this.linkRegistry.get(path);
    if (linkData) {
      return linkData.url;
    }
    
    // Fallback to main system
    console.warn(`⚠️ Link not found: ${path}, using fallback`);
    return `http://0.0.0.0:5000${path}`;
  }

  generateNavigationHTML() {
    const nav = this.generateNavigation();
    
    return `
<nav class="dynamic-navigation">
    <div class="nav-section">
        <h3>🏠 Main Platform</h3>
        <ul>
            ${nav.main.map(item => `
                <li><a href="${item.url}" ${item.active ? 'class="active"' : ''}>${item.name}</a></li>
            `).join('')}
        </ul>
    </div>
    
    <div class="nav-section">
        <h3>🔐 Administration</h3>
        <ul>
            ${nav.admin.map(item => `
                <li><a href="${item.url}">${item.name}</a></li>
            `).join('')}
        </ul>
    </div>
    
    <div class="nav-section">
        <h3>🏢 Business Systems</h3>
        <ul>
            ${nav.business.map(item => `
                <li><a href="${item.url}">${item.name}</a></li>
            `).join('')}
        </ul>
    </div>
    
    <div class="nav-section">
        <h3>🛠️ Tools & AI</h3>
        <ul>
            ${nav.tools.map(item => `
                <li><a href="${item.url}">${item.name}</a></li>
            `).join('')}
        </ul>
    </div>
</nav>

<style>
.dynamic-navigation {
    background: rgba(0, 0, 0, 0.1);
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
}
.nav-section {
    margin-bottom: 25px;
}
.nav-section h3 {
    color: #ffd700;
    margin-bottom: 10px;
    font-size: 1.1em;
}
.nav-section ul {
    list-style: none;
    padding-left: 20px;
}
.nav-section li {
    margin: 8px 0;
}
.nav-section a {
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
    padding: 5px 10px;
    border-radius: 5px;
    display: inline-block;
}
.nav-section a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #00ff88;
}
.nav-section a.active {
    background: linear-gradient(45deg, #00ff88, #00cc66);
    color: white;
    font-weight: bold;
}
</style>
    `;
  }

  async validateAllLinks() {
    console.log('🔍 Validating all dynamic links...');
    const results = { valid: 0, broken: 0, errors: [] };

    for (const [path, linkData] of this.linkRegistry) {
      try {
        const response = await fetch(linkData.url, { 
          method: 'HEAD',
          timeout: 5000 
        });
        
        if (response.ok) {
          results.valid++;
        } else {
          results.broken++;
          results.errors.push(`${path} - Status: ${response.status}`);
        }
      } catch (error) {
        results.broken++;
        results.errors.push(`${path} - Error: ${error.message}`);
      }
    }

    console.log(`✅ Link validation: ${results.valid} valid, ${results.broken} broken`);
    return results;
  }

  generateSitemap() {
    const sitemap = Array.from(this.linkRegistry.entries()).map(([path, linkData]) => ({
      path,
      url: linkData.url,
      system: linkData.system,
      port: linkData.port
    }));

    return sitemap;
  }

  generateLinkReport() {
    const report = {
      totalLinks: this.linkRegistry.size,
      systems: Array.from(this.systemPorts.keys()),
      linksBySystem: {},
      sitemap: this.generateSitemap()
    };

    for (const [system, data] of this.systemPorts) {
      const systemLinks = Array.from(this.linkRegistry.values()).filter(link => link.system === system);
      report.linksBySystem[system] = {
        count: systemLinks.length,
        port: data.port,
        links: systemLinks.map(link => link.url)
      };
    }

    return report;
  }
}

module.exports = DynamicLinkBuilder;

if (require.main === module) {
  const linkBuilder = new DynamicLinkBuilder();
  const report = linkBuilder.generateLinkReport();
  console.log('📊 Dynamic Link Report:', JSON.stringify(report, null, 2));
}
