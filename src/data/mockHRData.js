
// src/data/mockHRData.js
export const mockAttritionRisk = [
  { id: 'E101', name: 'Kira Lane', role: 'Sales Rep', location: 'Orange', risk: 0.78, reason: 'Missed 3 shifts' },
  { id: 'E128', name: 'Marcus Lee', role: 'Support Agent', location: 'Southington', risk: 0.68, reason: 'Low CSAT, delayed tickets' },
  { id: 'E201', name: 'Nina Patel', role: 'Retail Lead', location: 'Hartford', risk: 0.55, reason: 'Recent pay dispute' }
];

export const mockOnboardingProgress = [
  { name: 'Aliyah Soto', trainer: 'Sam W.', station: 'POS Reg 2', percent: 60 },
  { name: 'Devin Moore', trainer: 'Tamika L.', station: 'Warehouse Aisle 4', percent: 35 },
  { name: 'Kai Torres', trainer: 'Carlos J.', station: 'Returns Desk', percent: 80 }
];

export const mockSkillMatrix = [
  { name: 'Dominic R.', sales: 5, support: 3, tech: 1 },
  { name: 'Jules K.', sales: 4, support: 2, tech: 4 },
  { name: 'Isha N.', sales: 2, support: 5, tech: 3 },
];

export const mockCoachingFlags = [
  { name: 'Brianna C.', issue: 'Slow checkout speed', suggestion: 'POS refresh session', severity: 'Medium' },
  { name: 'Leo T.', issue: 'Missed compliance cert.', suggestion: 'Auto-enroll LMS course', severity: 'High' },
];
