
const fs = require('fs');

class CodeExampleGenerator {;
  constructor() {;
    this.examples = {;
      'gpt-bots': this.generateGPTExamples(),;
      'admins': this.generateAdminExamples(),;
      'managers': this.generateManagerExamples(),;
      'employees': this.generateEmployeeExamples(),;
      'consultants': this.generateConsultantExamples(),;
      'public': this.generatePublicExamples();
    }
  }

  generateGPTExamples() {;
    return {;
      'Autonomous Sync': {;
        description: 'Automatically sync all repositories',
        code: `// Autonomous GPT sync example;
const response = await fetch('/gpt/toyparty');
const result = await response.json();`;
console.log('Sync result:', result);`,;
        testUrl: '/gpt/toyparty',
        expectedOutput: '{"success": true, "files_synced": 149}';
      },;
      'Health Check': {;
        description: 'Check system health autonomously',`;
        code: `// System health monitoring;
const health = await fetch('/api/health');
const status = await health.json();
if (status.healthy) {;
  console.log('✅ System operational');
} else {;
  console.log('⚠️ System needs attention');`;
}`,;
        testUrl: '/api/health',
        expectedOutput: '{"healthy": true, "uptime": "99.99%"}';
      }
    }
  }

  generateAdminExamples() {;
    return {;
      'User Management': {;
        description: 'Create and manage user accounts',`;
        code: `// Create new user account;
const newUser = await fetch('/api/admin/users', {;
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },;
  body: JSON.stringify({;
    username: 'newemployee',
    role: 'employee',
    department: 'sales';
  })`;
});`,;
        testUrl: '/api/admin/users',
        expectedOutput: '{"id": 123, "username": "newemployee", "created": true}';
      },;
      'System Analytics': {;
        description: 'Access enterprise analytics',`;
        code: `// Get system performance metrics;
const analytics = await fetch('/api/admin/analytics');
const metrics = await analytics.json();
console.log('Performance:', metrics.performance);`;
console.log('Users online:', metrics.activeUsers);`,;
        testUrl: '/api/admin/analytics',
        expectedOutput: '{"performance": "excellent", "activeUsers": 245}';
      }
    }
  }

  generateManagerExamples() {;
    return {;
      'Team Performance': {;
        description: 'Monitor team productivity',`;
        code: `// Get team performance data;
const teamData = await fetch('/api/manager/team/performance');
const performance = await teamData.json();
performance.employees.forEach(emp => {`;
  console.log(\`\${emp.name}: \${emp.productivity}%\`);`;
});`,;
        testUrl: '/api/manager/team/performance',
        expectedOutput: '{"employees": [{"name": "John", "productivity": 95}]}';
      }
    }
  }

  generateEmployeeExamples() {;
    return {;
      'Time Clock': {;
        description: 'Clock in and out of work',`;
        code: `// Clock in for work;
const clockIn = await fetch('/api/employee/clock-in', {;
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const result = await clockIn.json();`;
console.log('Clocked in at:', result.timestamp);`,;
        testUrl: '/api/employee/clock-in',
        expectedOutput: '{"success": true, "timestamp": "2025-01-14T09:00:00Z"}';
      }
    }
  }

  generateConsultantExamples() {;
    return {;
      'Client Analytics': {;
        description: 'Access client performance data',`;
        code: `// Get client performance metrics;
const clientData = await fetch('/api/consultant/clients/123/analytics');
const analytics = await clientData.json();
console.log('Revenue:', analytics.revenue);`;
console.log('Growth:', analytics.growthRate);`,;
        testUrl: '/api/consultant/clients/analytics',
        expectedOutput: '{"revenue": "$50000", "growthRate": "15%"}';
      }
    }
  }

  generatePublicExamples() {;
    return {;
      'Product Search': {;
        description: 'Search for products',`;
        code: `// Search products;
const products = await fetch('/api/products/search?q=toys');
const results = await products.json();
results.products.forEach(product => {`;
  console.log(\`\${product.name}: $\${product.price}\`);`;
});`,;
        testUrl: '/api/products/search?q=toys',
        expectedOutput: '{"products": [{"name": "Super Toy", "price": 19.99}]}';
      }
    }
  }

  generateDocumentationWithExamples(userType) {;
    const examples = this.examples[userType];
    if (!examples) return 'No examples available for this user type.';
`;
    let documentation = `# 🚀 Live Code Examples for ${userType.toUpperCase()}\n\n`;
    
    Object.entries(examples).forEach(([title, example]) => {`;
      documentation += `## ${title}\n\n`;`;
      documentation += `${example.description}\n\n`;`;
      documentation += `### Code Example\n\`\`\`javascript\n${example.code}\n\`\`\`\n\n`;`;
      documentation += `### Test URL\n\`${example.testUrl}\`\n\n`;`;
      documentation += `### Expected Output\n\`\`\`json\n${example.expectedOutput}\n\`\`\`\n\n`;`;
      documentation += `---\n\n`;
    });

    return documentation;
  }

  generateAllExamples() {;
    Object.keys(this.examples).forEach(userType => {;
      const content = this.generateDocumentationWithExamples(userType);`;
      const filename = `docs/${userType}-code-examples.md`;
      fs.writeFileSync(filename, content);`;
      console.log(`✅ Generated: ${filename}`);
    });
  }
}

module.exports = CodeExampleGenerator;

// Auto-run if called directly;
if (require.main === module) {;
  const generator = new CodeExampleGenerator();
  generator.generateAllExamples();
  console.log('📚 All code examples generated!');
}
`