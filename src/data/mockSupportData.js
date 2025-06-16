
// src/data/mockSupportData.js
export const mockTicketForecast = [
  { day: 'Mon', expected: 120 },
  { day: 'Tue', expected: 150 },
  { day: 'Wed', expected: 210 },
  { day: 'Thu', expected: 180 },
  { day: 'Fri', expected: 260 }, // Campaign impact
  { day: 'Sat', expected: 140 },
  { day: 'Sun', expected: 90 }
];

export const mockSentimentStream = [
  { id: 'ts-1', channel: 'Chat', message: 'This product saved my weekend!', sentiment: 'Positive' },
  { id: 'ts-2', channel: 'Email', message: 'Delivery was late again...', sentiment: 'Negative' },
  { id: 'ts-3', channel: 'Twitter', message: 'Shoutout to your support rep Alice!', sentiment: 'Positive' },
  { id: 'ts-4', channel: 'Phone', message: 'Frustrating wait times lately.', sentiment: 'Negative' },
  { id: 'ts-5', channel: 'Facebook', message: 'Great service during my return!', sentiment: 'Positive' },
];

export const mockAgentPerformance = [
  { name: 'Alice Zhang', tickets: 120, avgTime: 5.2, rating: 4.8 },
  { name: 'Brian Patel', tickets: 100, avgTime: 6.8, rating: 4.2 },
  { name: 'Carmen Ruiz', tickets: 85, avgTime: 4.9, rating: 4.5 },
];

export const mockEscalationAlerts = [
  { ticketId: 'TK-4782', customer: 'Jordan Smith', issue: 'Billing dispute - 3rd contact', priority: 'High' },
  { ticketId: 'TK-4901', customer: 'Taylor Kim', issue: 'Product defect complaint', priority: 'Critical' },
];

export const mockChurnRiskCustomers = [
  { id: 'C-291', name: 'Morgan Davis', lastContact: '3 days ago', riskScore: 0.78 },
  { id: 'C-456', name: 'Casey Brown', lastContact: '5 days ago', riskScore: 0.65 },
];
