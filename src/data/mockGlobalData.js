// src/data/mockGlobalData.js

// Utility functions
export const getStatusColor = (status) => {
  switch (status) {
    case 'GREEN':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'YELLOW':
    case 'ORANGE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'RED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Critical':
      return 'text-red-600 dark:text-red-400';
    case 'High':
      return 'text-orange-600 dark:text-orange-400';
    case 'Medium':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}
export const getStatusIcon = (status) => {
  switch (status) {
    case 'GREEN':
      return '✅';
    case 'YELLOW':
    case 'ORANGE':
      return '⚠️';
    case 'RED':
      return '🚨';
    default:
      return '❓';
  }
}
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
// Mock data for Global Health Card
export const mockGlobalHealth = {
  status: 'GREEN',
  description: 'All systems operational',
  predictedStatus: 'GREEN',
  predictionConfidence: 0.95,
  performanceMetrics: {
    uptime: 99.7,
    response_time_avg: 145,
    error_rate: 0.3
  },
  trendData: [
    { value: 99.5 },
    { value: 99.2 },
    { value: 99.8 },
    { value: 99.6 },
    { value: 99.9 },
    { value: 99.7 },
    { value: 99.7 }
  ]
}
// Mock data for AI Prescriptive Actions
export const mockAIPrescriptiveActions = [
  {
    id: 'ai-001',
    title: 'Optimize Database Query Performance',
    description: 'AI detected 15% response time degradation due to inefficient queries on user_analytics table. Recommended index creation and query optimization.',
    priority: 'High',
    status: 'Ready to Execute',
    eta: '2 hours',
    confidence: 0.92
  },
  {
    id: 'ai-002',
    title: 'Proactive Server Scaling',
    description: 'Predictive model indicates 40% traffic increase expected in next 6 hours. Auto-scaling recommended.',
    priority: 'Medium',
    status: 'Pending Approval',
    eta: '30 minutes',
    confidence: 0.87
  },
  {
    id: 'ai-003',
    title: 'Security Vulnerability Mitigation',
    description: 'Critical security patches detected for Node.js dependencies. Immediate deployment recommended.',
    priority: 'Critical',
    status: 'Urgent',
    eta: '1 hour',
    confidence: 0.98
  },
  {
    id: 'ai-004',
    title: 'Cost Optimization Initiative',
    description: 'AI identified $2,400/month savings opportunity through resource rightsizing and unused service elimination.',
    priority: 'Medium',
    status: 'Analysis Complete',
    eta: '4 hours',
    confidence: 0.84
  }
];

// Mock data for Financial Pulse Card
export const mockFinancialPulse = {
  netProfit: 847000,
  cashFlow: 234000,
  budgetAdherenceScore: 0.96,
  budgetVariance: -0.04,
  trends: {
    netProfit: [780000, 820000, 795000, 830000, 847000],
    cashFlow: [220000, 210000, 240000, 230000, 234000]
  }
}
// Original mock data (keeping for backward compatibility)
export const mockGlobalData = {
  globalHealth: {
    status: 'GREEN',
    uptime: 99.7,
    responseTime: 145,
    errorRate: 0.3,
    lastUpdated: '2 minutes ago'
  },

  aiRecommendations: [
    {
      icon: '🔧',
      title: 'Optimize Database Queries',
      description: 'Detected slow queries affecting response time by 15%',
      priority: 'High',
      eta: '2 hours'
    },
    {
      icon: '📈',
      title: 'Scale Server Resources',
      description: 'CPU usage trending upward, recommend increasing capacity',
      priority: 'Medium',
      eta: '4 hours'
    },
    {
      icon: '🛡️',
      title: 'Update Security Patches',
      description: 'Critical security updates available for deployment',
      priority: 'High',
      eta: '1 hour'
    }
  ],

  financialMetrics: {
    monthlyRevenue: 250000,
    growthRate: 12.5,
    burnRate: 45000,
    runway: 18
  },

  geospatialData: {
    activeRegions: ['North America', 'Europe', 'Asia-Pacific'],
    totalUsers: 125000,
    activeDeployments: 47
  },

  recentActivity: [
    {
      timestamp: '2 min ago',
      action: 'Deployment completed successfully',
      details: 'Production release v2.1.4',
      status: 'success'
    },
    {
      timestamp: '5 min ago',
      action: 'Alert resolved',
      details: 'High memory usage on server-03',
      status: 'resolved'
    },
    {
      timestamp: '12 min ago',
      action: 'New user registration spike',
      details: '+150 users in the last hour',
      status: 'info'
    }
  ],

  resourceMetrics: {
    cpu: { current: 67, max: 85, trend: 'up' },
    memory: { current: 72, max: 90, trend: 'stable' },
    storage: { current: 45, max: 80, trend: 'up' },
    network: { current: 23, max: 100, trend: 'down' }
  }
}
// --- Geospatial Data (Simplified Mock for Map Widget) ---
export const mockGeospatialData = [
  { id: 'hartford', name: 'Hartford HQ', type: 'Office', status: 'GREEN', lat: 41.7658, lng: -72.6734 },
  { id: 'orange', name: 'Orange Facility', type: 'Warehouse', status: 'YELLOW', lat: 41.2787, lng: -73.0259 },
  { id: 'manchester', name: 'Manchester Data Center', type: 'Data Center', status: 'GREEN', lat: 41.7761, lng: -72.5214 },
  { id: 'southington', name: 'Southington Plant', type: 'Manufacturing', status: 'ORANGE', lat: 41.5959, lng: -72.8881 },
  { id: 'warehouse', name: 'Central Warehouse', type: 'Warehouse', status: 'GREEN', lat: 41.6032, lng: -72.7281 },
  { id: 'cloud-east', name: 'AWS East', type: 'Cloud', status: 'GREEN', lat: 39.0458, lng: -76.6413 },
  { id: 'cloud-west', name: 'GCP West', type: 'Cloud', status: 'YELLOW', lat: 37.4419, lng: -122.1430 }
];

export const mockOverlayLayers = {
  salesHeat: {
    label: 'Live Sales Heatmap',
    data: [
      { id: 'hartford', intensity: 0.8 },
      { id: 'orange', intensity: 0.5 },
      { id: 'southington', intensity: 0.3 },
      { id: 'manchester', intensity: 0.7 },
      { id: 'warehouse', intensity: 0.4 }
    ]
  },
  predictiveRisk: {
    label: 'Predicted Regional Disruption',
    data: [
      { id: 'southington', reason: 'Storm Front', risk: 0.6 },
      { id: 'cloud-west', reason: 'Latency Spike', risk: 0.7 },
      { id: 'orange', reason: 'Supply Chain', risk: 0.4 }
    ]
  }
}
// --- Global Activity & Anomaly Stream ---
export const mockGlobalActivityStream = [
  { id: 'act-1', type: 'Deployment', message: 'E-commerce Frontend v2.3 deployed to Production.', timestamp: '2025-06-15T13:45:00Z', severity: 'Info' },
  { id: 'act-2', type: 'Sales Anomaly', message: 'Unusual low sales detected at Southington Retail (13:30-13:45).', timestamp: '2025-06-15T13:40:00Z', severity: 'Warning', location: 'Southington' },
  { id: 'act-3', type: 'HR Alert', message: 'New Hire John Doe missed clock-in at Orange Retail.', timestamp: '2025-06-15T13:35:00Z', severity: 'Critical', location: 'Orange' },
  { id: 'act-4', type: 'AI Insight', message: 'AI suggests optimizing warehouse picking routes for next 2 hours.', timestamp: '2025-06-15T13:30:00Z', severity: 'Info' },
  { id: 'act-5', type: 'Security Alert', message: 'Multiple failed login attempts on Admin Panel.', timestamp: '2025-06-15T13:25:00Z', severity: 'Critical' },
  { id: 'act-6', type: 'Customer Service', message: 'New high-priority ticket: "Website checkout broken."', timestamp: '2025-06-15T13:20:00Z', severity: 'Critical' },
];

// --- Global Resource Metrics ---
export const mockResourceMetrics = {
  cpuUsage: 75, // %
  memoryUsage: 60, // %
  networkBandwidth: 85, // %
  cloudSpendEfficiency: 0.92, // 0-1, 1 is perfect
  dailyTrend: [
    { time: '00:00', cpu: 50, mem: 45, net: 60 },
    { time: '04:00', cpu: 60, mem: 50, net: 70 },
    { time: '08:00', cpu: 70, mem: 55, net: 80 },
    { time: '12:00', cpu: 75, mem: 60, net: 85 },
    { time: '16:00', cpu: 80, mem: 65, net: 90 },
    { time: '20:00', cpu: 70, mem: 58, net: 75 },
  ]
}
export const mockRealTimeMetrics = [
  { timestamp: Date.now() - 60000, value: 85 },
  { timestamp: Date.now() - 45000, value: 92 },
  { timestamp: Date.now() - 30000, value: 78 },
  { timestamp: Date.now() - 15000, value: 94 },
  { timestamp: Date.now(), value: 88 }
];

export const mockPerformanceData = {
  overallLatency: 120, // in ms
  errorRate: 0.8,     // in percentage
  transactionsPerSecond: 1500,
}
export const mockRecentActivities = [
  {
    type: 'alert',
    description: 'High latency detected in US-East data center.',
    timestamp: '2025-06-15T13:50:00Z',
    status: 'critical',
  },
  {
    type: 'maintenance',
    description: 'Scheduled database upgrade completed in EU-West-1.',
    timestamp: '2025-06-15T13:30:00Z',
    status: 'resolved',
  },
  {
    type: 'incident',
    description: 'Partial service disruption in APAC region due to network issue.',
    timestamp: '2025-06-15T13:15:00Z',
    status: 'warning',
  },
  {
    type: 'alert',
    description: 'CPU utilization spike on primary authentication server.',
    timestamp: '2025-06-15T13:05:00Z',
    status: 'warning',
  },
  {
    type: 'security',
    description: 'New security patch applied to all edge locations.',
    timestamp: '2025-06-15T12:45:00Z',
    status: 'info',
  },
  {
    type: 'deployment',
    description: 'New feature deployed to production environment (v2.1).',
    timestamp: '2025-06-15T12:00:00Z',
    status: 'info',
  },
];

export const mockComplianceData = {
  overallStatus: 'Partial Compliance', // or 'Fully Compliant', 'At Risk'
  overallScore: 78, // Percentage
  standards: [
    {
      standard: 'GDPR',
      status: 'compliant',
      progress: 100,
    },
    {
      standard: 'ISO 27001',
      status: 'partially-compliant',
      progress: 85,
    },
    {
      standard: 'HIPAA',
      status: 'non-compliant',
      progress: 40,
    },
    {
      standard: 'SOC 2 Type II',
      status: 'auditing',
      progress: 60,
    },
  ],
}