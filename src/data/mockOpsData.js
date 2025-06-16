
// src/data/mockOpsData.js
export const mockSystemComponents = [
  { id: 'api-gateway', name: 'API Gateway', status: 'GREEN', latency: 85, errorRate: 0.01 },
  { id: 'auth-service', name: 'Auth Service', status: 'YELLOW', latency: 180, errorRate: 0.03 },
  { id: 'database', name: 'Primary DB', status: 'GREEN', latency: 50, errorRate: 0.00 },
  { id: 'cdn-edge', name: 'CDN Edge', status: 'ORANGE', latency: 300, errorRate: 0.12 },
  { id: 'ml-engine', name: 'ML Inference Engine', status: 'GREEN', latency: 100, errorRate: 0.02 }
];

export const mockOutageForecasts = [
  { component: 'Auth Service', riskScore: 0.72 },
  { component: 'CDN Edge', riskScore: 0.65 },
  { component: 'ML Engine', riskScore: 0.3 }
];

export const mockRootCauseChain = [
  { from: 'CDN Edge', to: 'Auth Service', reason: 'High packet loss from CDN impacting login success' },
  { from: 'Auth Service', to: 'API Gateway', reason: 'Elevated auth latency cascading to API failures' }
];

export const mockSecurityEvents = [
  { id: 'sec-1', type: 'Threat Detected', message: 'Botnet traffic on API endpoint /checkout', severity: 'Critical' },
  { id: 'sec-2', type: 'Patch Missing', message: 'SSL patch not applied on CDN Edge - CVE-2025-2212', severity: 'High' },
];
