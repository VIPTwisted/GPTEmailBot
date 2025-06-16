
// src/data/mockSocialData.js
export const mockBrandMentions = [
  { id: 1, platform: 'Twitter', user: '@glowgal', sentiment: 'Positive', message: 'ToyParty live show was 🔥🔥🔥' },
  { id: 2, platform: 'Instagram', user: '@vixenreviews', sentiment: 'Negative', message: 'Not impressed with shipping time.' },
  { id: 3, platform: 'Reddit', user: 'anonymous123', sentiment: 'Neutral', message: 'Anyone try the gift box builder?' },
  { id: 4, platform: 'YouTube', user: 'SpicyDiva', sentiment: 'Positive', message: 'Unboxing the ToyParty Romance Kit — obsessed!' }
];

export const mockStaffSocialFeed = [
  { id: 1, employee: 'Nico V.', handle: '@nico_partypro', content: 'Join my next ToyMatch Live this Friday 🧠💋', reach: 1800 },
  { id: 2, employee: 'Jada R.', handle: '@jada_twistedreps', content: 'ToyParty glow-up deals now live! #affiliate', reach: 2400 },
  { id: 3, employee: 'Maya L.', handle: '@maya_luxelive', content: 'Behind the scenes at ToyParty HQ! Amazing team vibes 💜', reach: 3200 },
  { id: 4, employee: 'Alex K.', handle: '@alex_toyexpert', content: 'New arrivals drop tomorrow! You won\'t want to miss these ✨', reach: 2800 }
];

export const mockInfluencerImpact = [
  { name: 'Kiki Flame', platform: 'TikTok', reach: 12000, conversions: 190, engagement: '8.2%' },
  { name: 'TheLuxeLover', platform: 'YouTube', reach: 9500, conversions: 140, engagement: '12.4%' },
  { name: 'SensualQueen', platform: 'Instagram', reach: 18700, conversions: 270, engagement: '6.8%' },
  { name: 'VelvetVibes', platform: 'Twitter', reach: 7300, conversions: 85, engagement: '11.1%' }
];

export const mockCrisisSignals = [
  { type: 'Bot Activity Spike', detail: 'High-volume identical comments on Twitter mentioning ToyParty', severity: 'High', timestamp: '2 hours ago' },
  { type: 'Negativity Surge', detail: 'Reddit thread gaining upvotes on negative customer service', severity: 'Medium', timestamp: '4 hours ago' },
  { type: 'Review Bombing Alert', detail: 'Unusual pattern of 1-star reviews within 30 minutes', severity: 'High', timestamp: '6 hours ago' }
];

export const mockSentimentTrends = [
  { time: '9 AM', positive: 65, neutral: 25, negative: 10 },
  { time: '12 PM', positive: 72, neutral: 20, negative: 8 },
  { time: '3 PM', positive: 58, neutral: 30, negative: 12 },
  { time: '6 PM', positive: 80, neutral: 15, negative: 5 },
  { time: '9 PM', positive: 75, neutral: 18, negative: 7 }
];

export const mockViralityPredictions = [
  { content: 'New Valentine\'s Collection Launch', platform: 'Instagram', viralityScore: 8.7, predictedReach: '45K-65K' },
  { content: 'Behind-the-scenes TikTok series', platform: 'TikTok', viralityScore: 9.2, predictedReach: '80K-120K' },
  { content: 'Customer testimonial video', platform: 'YouTube', viralityScore: 6.4, predictedReach: '15K-25K' }
];
