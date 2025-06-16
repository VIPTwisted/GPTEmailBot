
// src/data/mockEcommerceData.js
export const mockCartFunnel = [
  { stage: 'Browse', count: 8200 },
  { stage: 'Add to Cart', count: 4100 },
  { stage: 'Begin Checkout', count: 2700 },
  { stage: 'Payment Attempted', count: 2000 },
  { stage: 'Order Completed', count: 1600 }
];

export const mockChurnRisk = [
  { customerId: 'C-101', name: 'Alex Rivera', risk: 0.85, lastOrder: 'May 10' },
  { customerId: 'C-237', name: 'Jordan Liu', risk: 0.72, lastOrder: 'Apr 22' },
  { customerId: 'C-392', name: 'Taylor Gomez', risk: 0.66, lastOrder: 'Mar 29' }
];

export const mockProductPerformance = [
  { sku: 'PR-X1', name: 'Product X', sales: 9200, returns: 300, rating: 4.6 },
  { sku: 'PR-Y2', name: 'Product Y', sales: 7100, returns: 820, rating: 3.9 },
  { sku: 'PR-Z3', name: 'Product Z', sales: 3800, returns: 120, rating: 4.2 },
];

export const mockMLMGrowth = [
  { month: 'Jan', newLeads: 180, churned: 15 },
  { month: 'Feb', newLeads: 260, churned: 30 },
  { month: 'Mar', newLeads: 340, churned: 40 },
  { month: 'Apr', newLeads: 380, churned: 55 },
  { month: 'May', newLeads: 290, churned: 45 },
];
