// src/data/mockPlaybookData.js

export const mockPlaybooks = {
  'ai-001': {
    title: 'Database Query Optimization Playbook v2.1',
    author: 'AI Operations Bot',
    version: '2.1.0',
    estimatedDuration: '2 hours',
    riskLevel: 'Medium',
    dataSource: 'Performance monitoring, Query analyzer, User analytics table',
    steps: [
      {
        id: 'step-1',
        title: 'Acknowledge & Lock Action',
        description: 'Prevent other automated systems from interfering with database operations.',
        status: 'Completed',
        type: 'System',
        executingUser: 'System',
        timestamp: '2025-06-15T13:45:10Z',
      },
      {
        id: 'step-2',
        title: 'Create Database Index',
        description: 'Execute CREATE INDEX `idx_user_analytics_timestamp` ON user_analytics(created_at, user_id);',
        status: 'In Progress',
        type: 'System',
        executingUser: 'System',
        timestamp: null,
      },
      {
        id: 'step-3',
        title: 'Optimize Query Execution Plan',
        description: 'Rewrite inefficient queries identified in the analytics table scan.',
        status: 'Pending',
        type: 'System',
        executingUser: null,
        timestamp: null,
      },
      {
        id: 'step-4',
        title: 'Monitor Performance Impact',
        description: 'Observe query response times and system load for 30 minutes post-execution.',
        status: 'Pending',
        type: 'Human',
        assignedTo: 'Database Administrator',
        executingUser: null,
        timestamp: null,
      },
      {
        id: 'step-5',
        title: 'Validate Performance Improvement',
        description: 'Confirm 15% response time improvement target has been achieved.',
        status: 'Pending',
        type: 'Approval',
        assignedTo: 'Operations Lead',
        executingUser: null,
        timestamp: null,
      },
    ],
  },
  'ai-002': {
    title: 'Proactive Server Scaling Playbook v1.3',
    author: 'AI Infrastructure Bot',
    version: '1.3.0',
    estimatedDuration: '30 minutes',
    riskLevel: 'Low',
    dataSource: 'Traffic prediction model, Server metrics, Load balancer data',
    steps: [
      {
        id: 'step-1',
        title: 'Traffic Pattern Analysis',
        description: 'Analyze current traffic patterns and confirm 40% increase prediction.',
        status: 'Completed',
        type: 'System',
        executingUser: 'System',
        timestamp: '2025-06-15T13:30:00Z',
      },
      {
        id: 'step-2',
        title: 'Auto-Scaling Configuration',
        description: 'Update auto-scaling group to handle predicted load increase.',
        status: 'Pending',
        type: 'System',
        executingUser: null,
        timestamp: null,
      },
      {
        id: 'step-3',
        title: 'Load Balancer Adjustment',
        description: 'Configure load balancer for optimal traffic distribution.',
        status: 'Pending',
        type: 'System',
        executingUser: null,
        timestamp: null,
      },
    ],
  },
  'ai-003': {
    title: 'Critical Security Patch Deployment v1.0',
    author: 'AI Security Bot',
    version: '1.0.0',
    estimatedDuration: '1 hour',
    riskLevel: 'High',
    dataSource: 'Security vulnerability scanner, Dependency audit, CVE database',
    steps: [
      {
        id: 'step-1',
        title: 'Security Assessment',
        description: 'Validate critical security vulnerabilities in Node.js dependencies.',
        status: 'Completed',
        type: 'System',
        executingUser: 'System',
        timestamp: '2025-06-15T13:25:00Z',
      },
      {
        id: 'step-2',
        title: 'Emergency Change Approval',
        description: 'Fast-track security patch approval due to critical nature.',
        status: 'Completed',
        type: 'Approval',
        assignedTo: 'Security Lead',
        executingUser: 'Security Lead',
        timestamp: '2025-06-15T13:26:30Z',
      },
      {
        id: 'step-3',
        title: 'Deploy Security Patches',
        description: 'Execute automated security patch deployment across all environments.',
        status: 'In Progress',
        type: 'System',
        executingUser: 'System',
        timestamp: null,
      },
      {
        id: 'step-4',
        title: 'Security Validation',
        description: 'Run security scans to confirm vulnerabilities are resolved.',
        status: 'Pending',
        type: 'System',
        executingUser: null,
        timestamp: null,
      },
    ],
  },
  'ai-004': {
    title: 'Cost Optimization Initiative Playbook v2.0',
    author: 'AI Financial Bot',
    version: '2.0.0',
    estimatedDuration: '4 hours',
    riskLevel: 'Low',
    dataSource: 'Cloud billing analysis, Resource utilization metrics, Service usage patterns',
    steps: [
      {
        id: 'step-1',
        title: 'Resource Utilization Analysis',
        description: 'Identify underutilized resources and unused services across cloud infrastructure.',
        status: 'Completed',
        type: 'System',
        executingUser: 'System',
        timestamp: '2025-06-15T12:00:00Z',
      },
      {
        id: 'step-2',
        title: 'Finance Team Review',
        description: 'Review proposed cost optimizations with finance team for approval.',
        status: 'Pending',
        type: 'Approval',
        assignedTo: 'Finance Manager',
        executingUser: null,
        timestamp: null,
      },
      {
        id: 'step-3',
        title: 'Right-size Resources',
        description: 'Automatically resize overprovisioned cloud resources to optimal specifications.',
        status: 'Pending',
        type: 'System',
        executingUser: null,
        timestamp: null,
      },
      {
        id: 'step-4',
        title: 'Terminate Unused Services',
        description: 'Safely terminate identified unused services and resources.',
        status: 'Pending',
        type: 'System',
        executingUser: null,
        timestamp: null,
      },
    ],
  },
  'weekly-performance-review': {
    title: '📊 Weekly Performance Review',
    description: 'Comprehensive weekly analysis and recommendations',
    steps: [
      { title: 'Generate Performance Report', type: 'System' },
      { title: 'Review Key Metrics', type: 'Approval' },
      { title: 'Send Executive Summary', type: 'System' }
    ]
  },
  'redeploy-api-core': {
    title: 'Redeploy Core API',
    description: 'Autonomous API redeployment with health checks',
    steps: [
      { title: 'Trigger Netlify Build', type: 'System' },
      { title: 'Ping /status endpoint', type: 'System' },
      { title: 'Confirm Health Response', type: 'Approval' }
    ]
  },
  'flush-cache-recovery': {
    title: '🔄 Cache Flush Recovery',
    description: 'Clear system cache and verify performance',
    steps: [
      { title: 'Flush Redis Cache', type: 'System' },
      { title: 'Clear Browser Cache', type: 'System' },
      { title: 'Verify Response Times', type: 'System' }
    ]
  },
  'restart-gpt-agent': {
    title: '🤖 Restart GPT Agent',
    description: 'Restart AI agent with health verification',
    steps: [
      { title: 'Stop Current Agent', type: 'System' },
      { title: 'Initialize New Instance', type: 'System' },
      { title: 'Run Agent Health Check', type: 'System' }
    ]
  }
}