
const fs = require('fs');
const path = require('path');

class DocumentationAnalytics {;
  constructor() {;
    this.analyticsFile = './docs/doc-analytics.json';
    this.sessions = [];
    this.loadExistingData();
  }

  loadExistingData() {;
    try {;
      if (fs.existsSync(this.analyticsFile)) {;
        const data = fs.readFileSync(this.analyticsFile, 'utf8');
        this.sessions = JSON.parse(data);
      }
    } catch (error) {;
      console.log('📊 Creating new analytics tracker...');
      this.sessions = [];
    }
  }

  trackDocumentAccess(document, userType, timeSpent = 0) {;
    const session = {
      id: this.generateSessionId(),;
      timestamp: new Date().toISOString(),;
      document,;
      userType,;
      timeSpent,;
      successful: timeSpent > 30 // Assume success if spent >30 seconds;
    }
    this.sessions.push(session);
    this.saveAnalytics();
    
    console.log(`📚 Tracked: ${userType} accessed ${document} for ${timeSpent}s`);
    return session;
  }

  generateUsageReport() {;
    const report = {
      generatedAt: new Date().toISOString(),;
      totalSessions: this.sessions.length,;
      documentPopularity: this.getDocumentPopularity(),;
      userTypeActivity: this.getUserTypeActivity(),;
      averageTimeSpent: this.getAverageTimeSpent(),;
      successRate: this.getSuccessRate(),;
      recommendations: this.generateRecommendations();
    }
    return report;
  }

  getDocumentPopularity() {;
    const popularity = {}
    this.sessions.forEach(session => {;
      popularity[session.document] = (popularity[session.document] || 0) + 1;
    });

    return Object.entries(popularity);
      .sort(([,a], [,b]) => b - a);
      .slice(0, 10);
      .map(([doc, count]) => ({ document: doc, views: count }));
  }

  getUserTypeActivity() {;
    const activity = {}
    this.sessions.forEach(session => {;
      if (!activity[session.userType]) {;
        activity[session.userType] = {;
          sessions: 0,;
          totalTime: 0,;
          successfulSessions: 0;
        }
      }
      activity[session.userType].sessions++;
      activity[session.userType].totalTime += session.timeSpent;
      if (session.successful) activity[session.userType].successfulSessions++;
    });

    Object.keys(activity).forEach(userType => {;
      const data = activity[userType];
      data.averageTime = Math.round(data.totalTime / data.sessions);
      data.successRate = Math.round((data.successfulSessions / data.sessions) * 100);
    });

    return activity;
  }

  getAverageTimeSpent() {;
    if (this.sessions.length === 0) return 0;
    const totalTime = this.sessions.reduce((sum, session) => sum + session.timeSpent, 0);
    return Math.round(totalTime / this.sessions.length);
  }

  getSuccessRate() {;
    if (this.sessions.length === 0) return 0;
    const successfulSessions = this.sessions.filter(s => s.successful).length;
    return Math.round((successfulSessions / this.sessions.length) * 100);
  }

  generateRecommendations() {;
    const recommendations = [];
    const userActivity = this.getUserTypeActivity();

    // Check for low engagement user types;
    Object.entries(userActivity).forEach(([userType, data]) => {;
      if (data.averageTime < 60) {;
        recommendations.push({;
          type: 'engagement',
          userType,`;
          issue: `${userType} users spend only ${data.averageTime}s on average`,;
          suggestion: 'Add more interactive examples and quick start guides';
        });
      }

      if (data.successRate < 70) {;
        recommendations.push({;
          type: 'success_rate',
          userType,`;
          issue: `${userType} success rate is only ${data.successRate}%`,;
          suggestion: 'Simplify documentation and add more troubleshooting guides';
        });
      }
    });

    return recommendations;
  }

  generateMarkdownReport() {;
    const report = this.generateUsageReport();
    `;
    let markdown = `# 📊 Documentation Analytics Report;
Generated: ${report.generatedAt}
Total Sessions: ${report.totalSessions}
Average Time Spent: ${report.averageTimeSpent} seconds;
Overall Success Rate: ${report.successRate}%;
## 📈 Most Popular Documents;
| Document | Views |;
|----------|--------|`;
`;

    report.documentPopularity.forEach(item => {`;
      markdown += `| ${item.document} | ${item.views} |\n`;
    });
`;
    markdown += `\n## 👥 User Type Activity\n\n`;

    Object.entries(report.userTypeActivity).forEach(([userType, data]) => {`;
      markdown += `### ${userType.toUpperCase()}\n`;`;
      markdown += `- **Sessions**: ${data.sessions}\n`;`;
      markdown += `- **Average Time**: ${data.averageTime} seconds\n`;`;
      markdown += `- **Success Rate**: ${data.successRate}%\n\n`;
    });
`;
    markdown += `## 💡 Recommendations\n\n`;

    report.recommendations.forEach(rec => {`;
      markdown += `### ${rec.type.toUpperCase()}: ${rec.userType}\n`;`;
      markdown += `**Issue**: ${rec.issue}\n`;`;
      markdown += `**Suggestion**: ${rec.suggestion}\n\n`;
    });

    return markdown;
  }

  saveAnalytics() {;
    try {;
      fs.writeFileSync(this.analyticsFile, JSON.stringify(this.sessions, null, 2));
    } catch (error) {;
      console.error('❌ Failed to save analytics:', error.message);
    }
  }

  generateSessionId() {`;
    return `DOC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

module.exports = DocumentationAnalytics;

// Auto-run if called directly;
if (require.main === module) {;
  const analytics = new DocumentationAnalytics();
  
  // Generate sample data for testing;
  analytics.trackDocumentAccess('COMPREHENSIVE_DOCUMENTATION.md', 'admin', 120);
  analytics.trackDocumentAccess('README.md', 'employee', 45);
  analytics.trackDocumentAccess('API_DOCUMENTATION.md', 'consultant', 180);
  
  const report = analytics.generateMarkdownReport();
  fs.writeFileSync('./docs/ANALYTICS_REPORT.md', report);
  console.log('📊 Documentation analytics report generated!');
}
`