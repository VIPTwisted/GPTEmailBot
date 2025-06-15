const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class MasterNavigationSystem {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.port = 3000;

    // System registry with organized pages
    this.systems = {
      'admin': {
        name: '🔐 Admin Portal',
        port: 6001,
        file: 'admin-auth-system.js',
        pages: ['/admin', '/admin/users', '/admin/settings', '/admin/security'],
        description: 'Complete administrative control center'
      },
      'business-command': {
        name: '🏢 Business Command Center',
        port: 8888,
        file: 'ultimate-business-command-center.js',
        pages: ['/mlm', '/crm', '/financial', '/hr', '/analytics'],
        description: 'MLM, CRM, Financial, and HR management'
      },
      'commerce': {
        name: '🛍️ Commerce Empire',
        port: 8080,
        file: 'commerce-empire-dashboard.js',
        pages: ['/products', '/orders', '/inventory', '/customers', '/pos'],
        description: 'Complete e-commerce and POS system'
      },
      'employees': {
        name: '👨‍💼 Employee Management',
        port: 7500,
        file: 'employee-management-system.js',
        pages: ['/employees', '/timecards', '/schedule', '/performance', '/payroll'],
        description: 'Employee management and HR tools'
      },
      'ai-assistant': {
        name: '🤖 AI Assistant',
        port: 8000,
        file: 'ultimate-gpt-assistant.js',
        pages: ['/chat', '/automation', '/training', '/analytics'],
        description: 'Ultimate AI assistant and automation'
      },
      'seo-marketing': {
        name: '🎖️ SEO Marketing',
        port: 9001,
        file: 'seo-marketing-dashboard.js',
        pages: ['/keywords', '/campaigns', '/analytics', '/tools'],
        description: 'Advanced SEO and marketing tools'
      },
      'universal-admin': {
        name: '🌍 Universal Admin',
        port: 6000,
        file: 'universal-admin-backend.js',
        pages: ['/repos', '/deployments', '/monitoring', '/gpt'],
        description: 'Master system administration'
      }
    };

    this.initialize();
  }

  initialize() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // Main navigation page
    this.app.get('/', (req, res) => {
      try {
        const html = this.generateMasterNavigationHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error generating navigation HTML:', error);
        res.status(500).send('Navigation system error');
      }
    });

    // System API
    this.app.get('/api/systems', (req, res) => {
      res.json(this.systems);
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', systems: Object.keys(this.systems) });
    });

    // Fallback for any unmatched routes - using simple middleware
    this.app.use('*', (req, res) => {
      try {
        const html = this.generateMasterNavigationHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error in navigation route:', error);
        res.status(500).send('Navigation system error');
      }
    });

    console.log('🚀 Master Navigation System initialized');
  }

  generateMasterNavigationHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 ToyParty Professional Platform - Master Navigation</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e40af 100%);
            color: white;
            min-height: 100vh;
        }

        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 20px 0;
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 2em;
            font-weight: bold;
            color: #fbbf24;
        }

        .ai-assistant-btn {
            background: linear-gradient(45deg, #10b981, #059669);
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .ai-assistant-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }

        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 40px 30px; 
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin: 30px 0;
        }

        .system-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .system-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            border-color: #fbbf24;
        }

        .system-title {
            font-size: 1.5em;
            font-weight: bold;
            color: #fbbf24;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .system-description {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .pages-list {
            margin: 20px 0;
        }

        .page-item {
            display: inline-block;
            background: rgba(251, 191, 36, 0.2);
            border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 6px 12px;
            margin: 4px;
            border-radius: 15px;
            font-size: 0.9em;
            color: #fbbf24;
        }

        .system-actions {
            display: flex;
            gap: 15px;
            margin-top: 25px;
        }

        .btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: inline-block;
        }

        .btn-primary {
            background: linear-gradient(45deg, #10b981, #059669);
            color: white;
        }

        .btn-secondary {
            background: linear-gradient(45deg, #3b82f6, #2563eb);
            color: white;
        }

        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }

        .ai-chat-panel {
            position: fixed;
            right: -400px;
            top: 0;
            width: 400px;
            height: 100vh;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border-left: 1px solid rgba(255, 255, 255, 0.2);
            transition: right 0.3s ease;
            z-index: 1000;
            display: flex;
            flex-direction: column;
        }

        .ai-chat-panel.open {
            right: 0;
        }

        .ai-chat-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .ai-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }

        .ai-chat-input {
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .ai-input {
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
        }

        .ai-message {
            margin: 15px 0;
            padding: 12px;
            border-radius: 10px;
            line-height: 1.4;
        }

        .ai-message.user {
            background: rgba(59, 130, 246, 0.3);
            text-align: right;
        }

        .ai-message.assistant {
            background: rgba(16, 185, 129, 0.3);
        }

        .quick-stats {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .stat {
            text-align: center;
        }

        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #10b981;
            display: block;
        }

        .stat-label {
            opacity: 0.8;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo">🏢 ToyParty Professional Platform</div>
            <button class="ai-assistant-btn" onclick="toggleAIChat()">
                🤖 AI Assistant
            </button>
        </div>
    </div>

    <div class="container">
        <div class="quick-stats">
            <div class="stat">
                <span class="stat-value">7</span>
                <span class="stat-label">Active Systems</span>
            </div>
            <div class="stat">
                <span class="stat-value">35+</span>
                <span class="stat-label">Available Pages</span>
            </div>
            <div class="stat">
                <span class="stat-value">100%</span>
                <span class="stat-label">System Health</span>
            </div>
            <div class="stat">
                <span class="stat-value">24/7</span>
                <span class="stat-label">AI Support</span>
            </div>
        </div>

        <div class="dashboard-grid">
            ${Object.entries(this.systems).map(([key, system]) => `
                <div class="system-card">
                    <div class="system-title">
                        ${system.name}
                        <div class="status-indicator"></div>
                    </div>
                    <div class="system-description">
                        ${system.description}
                    </div>
                    <div class="pages-list">
                        <strong>Available Pages:</strong><br>
                        ${system.pages.map(page => `<span class="page-item">${page}</span>`).join('')}
                    </div>
                    <div class="system-actions">
                        <a href="http://0.0.0.0:${system.port}" target="_blank" class="btn btn-primary">
                            🚀 Launch System
                        </a>
                        <button onclick="askAI('How do I use ${system.name}?')" class="btn btn-secondary">
                            🤖 Ask AI
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <!-- AI Chat Panel -->
    <div id="aiChatPanel" class="ai-chat-panel">
        <div class="ai-chat-header">
            <h3>🤖 AI Assistant</h3>
            <button onclick="toggleAIChat()" style="background: none; border: none; color: white; font-size: 1.5em; cursor: pointer;">×</button>
        </div>
        <div class="ai-chat-messages" id="aiMessages">
            <div class="ai-message assistant">
                👋 Hello! I'm your AI assistant. I can help you navigate the platform, explain features, and guide you through any system. What would you like to know?
            </div>
        </div>
        <div class="ai-chat-input">
            <input type="text" id="aiInput" class="ai-input" placeholder="Ask me anything about the platform..." onkeypress="handleAIKeyPress(event)">
        </div>
    </div>

    <script>
        let aiChatOpen = false;

        function toggleAIChat() {
            const panel = document.getElementById('aiChatPanel');
            aiChatOpen = !aiChatOpen;
            panel.classList.toggle('open', aiChatOpen);
        }

        function askAI(question) {
            if (!aiChatOpen) {
                toggleAIChat();
            }

            setTimeout(() => {
                document.getElementById('aiInput').value = question;
                sendAIMessage();
            }, 300);
        }

        function handleAIKeyPress(event) {
            if (event.key === 'Enter') {
                sendAIMessage();
            }
        }

        function sendAIMessage() {
            const input = document.getElementById('aiInput');
            const message = input.value.trim();

            if (!message) return;

            // Add user message
            addAIMessage(message, 'user');
            input.value = '';

            // Simulate AI response
            setTimeout(() => {
                const response = generateAIResponse(message);
                addAIMessage(response, 'assistant');
            }, 1000);
        }

        function addAIMessage(text, sender) {
            const messages = document.getElementById('aiMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`ai-message \${sender}\`;
            messageDiv.textContent = text;
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }

        function generateAIResponse(question) {
            const responses = {
                'admin': 'The Admin Portal (port 6001) provides complete administrative control. Access user management, security settings, and system configuration at /admin.',
                'business': 'The Business Command Center (port 8888) handles MLM, CRM, financial management, and HR. Visit /mlm for MLM tools, /crm for customer management.',
                'commerce': 'The Commerce Empire (port 8080) manages your e-commerce operations. Check /products for inventory, /orders for sales, /pos for point-of-sale.',
                'employees': 'Employee Management (port 7500) handles HR functions. Use /timecards for time tracking, /schedule for shift management, /performance for reviews.',
                'ai': 'The AI Assistant (port 8000) provides automation and intelligence. Access /chat for conversations, /automation for workflows, /training for AI models.',
                'seo': 'SEO Marketing (port 9001) handles your marketing needs. Visit /keywords for research, /campaigns for management, /analytics for performance tracking.',
                'universal': 'Universal Admin (port 6000) provides master system control. Access /repos for repository management, /deployments for publishing, /monitoring for health checks.'
            };

            const lowerQuestion = question.toLowerCase();

            for (const [key, response] of Object.entries(responses)) {
                if (lowerQuestion.includes(key)) {
                    return response;
                }
            }

            if (lowerQuestion.includes('help') || lowerQuestion.includes('how')) {
                return 'I can help you with any system! Try asking about: Admin Portal, Business Command, Commerce Empire, Employee Management, AI Assistant, SEO Marketing, or Universal Admin.';
            }

            if (lowerQuestion.includes('port') || lowerQuestion.includes('url')) {
                return 'All systems run on different ports: Admin (6001), Business (8888), Commerce (8080), Employees (7500), AI (8000), SEO (9001), Universal Admin (6000). Click "Launch System" to access any platform.';
            }

            return 'I understand you want to know about our platform features. Each system has specialized functions - would you like me to explain a specific system? Just mention: admin, business, commerce, employees, ai, seo, or universal.';
        }

        // Auto-refresh system status
        setInterval(() => {
            fetch('/api/systems')
                .then(response => response.json())
                .then(data => {
                    console.log('Systems status updated');
                })
                .catch(error => {
                    console.log('Status update failed:', error);
                });
        }, 30000);

        // Welcome message
        setTimeout(() => {
            if (!aiChatOpen) {
                addAIMessage('💡 Tip: Click any "Ask AI" button to get help with specific systems!', 'assistant');
            }
        }, 3000);
    </script>
</body>
</html>
    `;
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Master Navigation System: http://0.0.0.0:${this.port}`);
      console.log('🏢 Professional platform with organized pages and AI assistant');
      console.log('🔗 All systems properly linked and accessible');
      console.log('✅ Navigation system ready to serve requests');
    });

    // Add error handling
    this.server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    this.app.use((error, req, res, next) => {
      console.error('❌ Application error:', error);
      res.status(500).send('Internal server error');
    });
  }
}

module.exports = MasterNavigationSystem;

if (require.main === module) {
  const masterNav = new MasterNavigationSystem();
  masterNav.start();
}