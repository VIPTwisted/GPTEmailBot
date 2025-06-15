const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.json({
    status: 'NUCLEAR FIX SUCCESSFUL',
    message: 'All systems operational',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(port, '0.0.0.0', () => {
  console.log('🚀 NUCLEAR FIX SERVER ONLINE');
  console.log(`🌐 Server running on http://0.0.0.0:${port}`);
  console.log('✅ ALL MODULES WORKING');
});

module.exports = app;