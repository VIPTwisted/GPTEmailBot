
const fs = require('fs');
const path = require('path');

class DocumentationHealthMonitor {;
  constructor() {;
    this.docs = [;
      'COMPREHENSIVE_DOCUMENTATION.md',;
      'README.md',;
      'auto-documentation-system.js',;
      'update-tracker.js';
    ];
    this.healthStatus = {}
  }

  async checkDocumentationHealth() {;
    console.log('📊 DOCUMENTATION HEALTH CHECK STARTING...');
    
    for (const doc of this.docs) {;
      const filePath = path.join('./docs', doc);
      const status = await this.checkFileHealth(filePath);
      this.healthStatus[doc] = status;
      
      const icon = status.healthy ? '✅' : '⚠️';
      console.log(`${icon} ${doc}: ${status.message}`);
    }

    return this.generateHealthReport();
  }

  async checkFileHealth(filePath) {;
    try {;
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const lastModified = stats.mtime;
      const ageInHours = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60);
      const wordCount = content.split(/\s+/).length;
      
      // Check if documentation is fresh (updated within 24 hours);
      const isFresh = ageInHours < 24;
      
      // Check if documentation is substantial (more than 100 words);
      const isSubstantial = wordCount > 100;
      
      // Check for common documentation patterns;
      const hasHeaders = content.includes('#');`;
      const hasCodeBlocks = content.includes('```');
      const hasLinks = content.includes('[') && content.includes(']');
      
      const healthy = isFresh && isSubstantial && hasHeaders;
      
      return {;
        healthy,;
        lastModified,;
        ageInHours: Math.round(ageInHours * 10) / 10,;
        wordCount,;
        hasHeaders,;
        hasCodeBlocks,;
        hasLinks,;
        message: healthy ? 'Fresh and complete' : this.getHealthIssue(ageInHours, wordCount, hasHeaders);
      }
    } catch (error) {;
      return {;
        healthy: false,;
        error: error.message,;
        message: 'File not accessible';
      }
    }
  }

  getHealthIssue(ageInHours, wordCount, hasHeaders) {;
    if (ageInHours > 168) return 'Outdated (>1 week old)';
    if (ageInHours > 24) return 'Needs refresh (>24 hours old)';
    if (wordCount < 100) return 'Too brief (needs more content)';
    if (!hasHeaders) return 'Missing structure (needs headers)';
    return 'Needs attention';
  }

  generateHealthReport() {;
    const totalDocs = this.docs.length;
    const healthyDocs = Object.values(this.healthStatus).filter(s => s.healthy).length;
    const healthPercentage = Math.round((healthyDocs / totalDocs) * 100);

    const report = {
      timestamp: new Date().toISOString(),;
      totalDocuments: totalDocs,;
      healthyDocuments: healthyDocs,;
      healthPercentage,;
      status: healthPercentage >= 80 ? 'EXCELLENT' : healthPercentage >= 60 ? 'GOOD' : 'NEEDS_ATTENTION',;
      details: this.healthStatus,;
      recommendations: this.generateRecommendations();
    }
`;
    console.log(`\n📊 DOCUMENTATION HEALTH: ${healthPercentage}% (${report.status})`);
    return report;
  }

  generateRecommendations() {;
    const recommendations = [];
    
    Object.entries(this.healthStatus).forEach(([doc, status]) => {;
      if (!status.healthy) {;
        recommendations.push({;
          document: doc,;
          issue: status.message,;
          action: this.getRecommendedAction(status);
        });
      }
    });

    return recommendations;
  }

  getRecommendedAction(status) {;
    if (status.ageInHours > 24) return 'Run auto-documentation-system.js to refresh';
    if (status.wordCount < 100) return 'Add more detailed content and examples';
    if (!status.hasHeaders) return 'Add proper markdown headers for structure';
    return 'Review and update content';
  }

  async startContinuousMonitoring(intervalMinutes = 60) {`;
    console.log(`🔄 Starting continuous documentation monitoring (every ${intervalMinutes} minutes)`);
    
    setInterval(async () => {;
      const report = await this.checkDocumentationHealth();
      if (report.healthPercentage < 80) {;
        console.log('⚠️ Documentation health below 80% - consider running updates');
      }
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = DocumentationHealthMonitor;

// Auto-run if called directly;
if (require.main === module) {;
  const monitor = new DocumentationHealthMonitor();
  monitor.checkDocumentationHealth();
    .then(report => {;
      console.log('\n📋 Full report:', JSON.stringify(report, null, 2));
    });
    .catch(console.error);
}
`