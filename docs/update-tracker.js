
const fs = require('fs');
const path = require('path');

class DocumentationUpdateTracker {
  constructor() {
    this.updatesFile = './docs/updates-tracker.json';
    this.updates = [];
    this.loadExistingUpdates();
  }

  loadExistingUpdates() {
    try {
      if (fs.existsSync(this.updatesFile)) {
        const data = fs.readFileSync(this.updatesFile, 'utf8');
        this.updates = JSON.parse(data);
      }
    } catch (error) {
      console.log('📚 Creating new updates tracker...');
      this.updates = [];
    }
  }

  trackUpdate(type, description, files = [], userTypes = []) {
    const update = {
      id: this.generateUpdateId(),
      timestamp: new Date().toISOString(),
      type: type,
      description: description,
      filesAffected: files,
      userTypesAffected: userTypes,
      status: 'completed',
      version: this.getNextVersion()
    };

    this.updates.unshift(update); // Add to beginning
    this.saveUpdates();
    
    console.log(`📝 Tracked update: ${update.id} - ${description}`);
    return update;
  }

  trackFeatureAddition(featureName, description, files, userTypes) {
    return this.trackUpdate('feature_addition', 
      `Added ${featureName}: ${description}`, files, userTypes);
  }

  trackBugFix(issue, description, files) {
    return this.trackUpdate('bug_fix', 
      `Fixed ${issue}: ${description}`, files, ['all']);
  }

  trackPerformanceImprovement(improvement, files) {
    return this.trackUpdate('performance', 
      `Performance improvement: ${improvement}`, files, ['all']);
  }

  trackSecurityUpdate(securityFix, files) {
    return this.trackUpdate('security', 
      `Security update: ${securityFix}`, files, ['admins', 'managers']);
  }

  trackDocumentationUpdate(docType, description) {
    return this.trackUpdate('documentation', 
      `Documentation update: ${description}`, [`docs/${docType}`], ['all']);
  }

  generateUpdateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `UPD_${timestamp}_${random}`;
  }

  getNextVersion() {
    if (this.updates.length === 0) {
      return '1.0.0';
    }
    
    const lastVersion = this.updates[0].version || '1.0.0';
    const parts = lastVersion.split('.').map(Number);
    parts[2]++; // Increment patch version
    
    if (parts[2] >= 100) {
      parts[1]++;
      parts[2] = 0;
    }
    if (parts[1] >= 10) {
      parts[0]++;
      parts[1] = 0;
    }
    
    return parts.join('.');
  }

  saveUpdates() {
    try {
      fs.writeFileSync(this.updatesFile, JSON.stringify(this.updates, null, 2));
    } catch (error) {
      console.error('❌ Failed to save updates:', error.message);
    }
  }

  getRecentUpdates(limit = 10) {
    return this.updates.slice(0, limit);
  }

  getUpdatesByType(type) {
    return this.updates.filter(update => update.type === type);
  }

  getUpdatesByUserType(userType) {
    return this.updates.filter(update => 
      update.userTypesAffected.includes(userType) || 
      update.userTypesAffected.includes('all')
    );
  }

  generateUpdateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      totalUpdates: this.updates.length,
      recentUpdates: this.getRecentUpdates(20),
      updatesByType: {
        features: this.getUpdatesByType('feature_addition').length,
        bugFixes: this.getUpdatesByType('bug_fix').length,
        performance: this.getUpdatesByType('performance').length,
        security: this.getUpdatesByType('security').length,
        documentation: this.getUpdatesByType('documentation').length
      },
      latestVersion: this.updates[0]?.version || '1.0.0'
    };

    return report;
  }

  generateMarkdownReport() {
    const report = this.generateUpdateReport();
    
    let markdown = `# 📊 System Updates Report

Generated: ${report.generatedAt}
Current Version: ${report.latestVersion}
Total Updates: ${report.totalUpdates}

## 📈 Update Statistics

| Type | Count |
|------|-------|
| 🚀 Features | ${report.updatesByType.features} |
| 🐛 Bug Fixes | ${report.updatesByType.bugFixes} |
| ⚡ Performance | ${report.updatesByType.performance} |
| 🔒 Security | ${report.updatesByType.security} |
| 📚 Documentation | ${report.updatesByType.documentation} |

## 🕒 Recent Updates

`;

    report.recentUpdates.forEach(update => {
      const icon = this.getUpdateIcon(update.type);
      markdown += `### ${icon} ${update.description}
**ID**: ${update.id}  
**Date**: ${update.timestamp}  
**Version**: ${update.version}  
**Files**: ${update.filesAffected.join(', ')}  
**Affects**: ${update.userTypesAffected.join(', ')}

`;
    });

    return markdown;
  }

  getUpdateIcon(type) {
    const icons = {
      'feature_addition': '🚀',
      'bug_fix': '🐛',
      'performance': '⚡',
      'security': '🔒',
      'documentation': '📚'
    };
    return icons[type] || '🔧';
  }

  saveMarkdownReport() {
    const markdown = this.generateMarkdownReport();
    const reportPath = './docs/UPDATES_REPORT.md';
    
    fs.writeFileSync(reportPath, markdown);
    console.log(`📊 Update report saved: ${reportPath}`);
  }
}

module.exports = DocumentationUpdateTracker;

// Auto-run if called directly
if (require.main === module) {
  const tracker = new DocumentationUpdateTracker();
  
  // Generate initial report
  tracker.saveMarkdownReport();
  
  console.log('📊 Documentation Update Tracker initialized');
}
