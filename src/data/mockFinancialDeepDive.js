
// src/data/mockFinancialDeepDive.js
export const mockFinancialReport = {
  netIncome: 1256789,
  grossRevenue: 5234900,
  operatingExpenses: 2411000,
  projectedCashFlow: [ // next 6 months
    { month: 'Jul', inflow: 800000, outflow: 680000 },
    { month: 'Aug', inflow: 775000, outflow: 690000 },
    { month: 'Sep', inflow: 810000, outflow: 745000 },
    { month: 'Oct', inflow: 850000, outflow: 820000 },
    { month: 'Nov', inflow: 790000, outflow: 870000 }, // ⚠️
    { month: 'Dec', inflow: 920000, outflow: 880000 },
  ],
  budgetTracking: [
    { department: 'Marketing', budget: 300000, actual: 350000 },
    { department: 'Sales', budget: 400000, actual: 420000 },
    { department: 'Tech', budget: 600000, actual: 580000 },
    { department: 'HR', budget: 150000, actual: 120000 },
  ],
  profitabilityByEntity: [
    { name: 'Retail North', profit: 260000 },
    { name: 'Retail South', profit: 180000 },
    { name: 'Ecom Platform', profit: 620000 },
    { name: 'MLM Network', profit: 95000 },
    { name: 'Warehouse Ops', profit: -40000 },
  ]
}