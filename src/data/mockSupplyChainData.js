
// src/data/mockSupplyChainData.js
export const mockInventoryForecast = [
  { sku: 'SKU-101', product: 'Tease Me Gel', location: 'Hartford', stock: 120, forecast: -30 },
  { sku: 'SKU-205', product: 'Velvet Vibe', location: 'Southington', stock: 35, forecast: -45 },
  { sku: 'SKU-318', product: 'Glow Lube', location: 'Warehouse', stock: 400, forecast: +80 },
  { sku: 'SKU-442', product: 'Silky Touch', location: 'Orange', stock: 15, forecast: -25 },
  { sku: 'SKU-567', product: 'Premium Kit', location: 'Hartford', stock: 200, forecast: +10 }
];

export const mockRouteOptimization = [
  { from: 'Warehouse', to: 'Hartford', eta: '45min', method: 'Truck 7A', suggestion: 'Delay 20min for traffic window' },
  { from: 'Hartford', to: 'Orange', eta: '60min', method: 'Courier', suggestion: 'Switch to Truck 5D (saves 18min)' },
  { from: 'Southington', to: 'Warehouse', eta: '35min', method: 'Van 3B', suggestion: 'Combine with Route 4 for efficiency' },
  { from: 'Orange', to: 'Southington', eta: '50min', method: 'Express', suggestion: 'Use Route 95 bypass (saves 12min)' }
];

export const mockSupplierMetrics = [
  { name: 'SoftSkin Co.', leadTime: 7, defectRate: 0.02, costAdherence: 0.95, rating: 'A+' },
  { name: 'VibeFlow Inc.', leadTime: 11, defectRate: 0.06, costAdherence: 0.89, rating: 'B' },
  { name: 'ThermaTouch', leadTime: 5, defectRate: 0.01, costAdherence: 0.98, rating: 'A+' },
  { name: 'LuxeCraft Ltd.', leadTime: 14, defectRate: 0.08, costAdherence: 0.85, rating: 'C+' },
  { name: 'PremiumSource', leadTime: 6, defectRate: 0.03, costAdherence: 0.92, rating: 'A' }
];

export const mockStockHealth = [
  { category: 'Lubricants', totalValue: 45000, turnoverRate: 2.4, healthScore: 85 },
  { category: 'Toys', totalValue: 78000, turnoverRate: 1.8, healthScore: 72 },
  { category: 'Accessories', totalValue: 23000, turnoverRate: 3.1, healthScore: 91 },
  { category: 'Premium Kits', totalValue: 156000, turnoverRate: 1.2, healthScore: 68 }
];

export const mockGlobalSupplyFlow = [
  { origin: 'Asia Pacific', destination: 'US East Coast', volume: 2400, status: 'In Transit', eta: '2024-01-28' },
  { origin: 'Europe', destination: 'Distribution Center', volume: 1800, status: 'Customs', eta: '2024-01-25' },
  { origin: 'Local Suppliers', destination: 'Retail Locations', volume: 3200, status: 'Delivered', eta: 'Completed' }
];
