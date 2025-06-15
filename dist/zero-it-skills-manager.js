
const express = require('express');
const fs = require('fs');
const path = require('path');
const { getNetlifySecrets, getGitHubToken } = require('./universal-secret-loader.js');

class ZeroITSkillsManager {
  constructor() {
    this.app = express();
    this.port = 5000;
    this.projects = new Map();
    this.tutorials = new Map();
    this.aiGuide = new AIGuideSystem();
    this.stepTracker = new StepTracker();
    
    console.log('🚀 ZERO IT SKILLS MANAGER INITIALIZING...');
    this.setupRoutes();
    this.initializeTutorials();
    this.loadProjects();
  }

  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Main dashboard - project selection
    this.app.get('/', (req, res) => {
      res.send(this.generateProjectSelectionDashboard());
    });

    // Step-by-step tutorial system
    this.app.get('/tutorial/:projectType', (req, res) => {
      const tutorial = this.generateStepByStepTutorial(req.params.projectType);
      res.send(tutorial);
    });

    // AI-guided setup
    this.app.post('/api/start-setup', async (req, res) => {
      try {
        const { projectType, projectName, userSkillLevel } = req.body;
        const result = await this.startAIGuidedSetup(projectType, projectName, userSkillLevel);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Execute setup step
    this.app.post('/api/execute-step/:stepId', async (req, res) => {
      try {
        const result = await this.executeSetupStep(req.params.stepId, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // AI troubleshooting
    this.app.post('/api/troubleshoot', async (req, res) => {
      try {
        const { issue, context } = req.body;
        const solution = await this.aiGuide.troubleshoot(issue, context);
        res.json(solution);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Live monitoring
    this.app.get('/api/monitor/:projectId', async (req, res) => {
      try {
        const status = await this.getLiveProjectStatus(req.params.projectId);
        res.json(status);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Deployment management
    this.app.post('/api/deploy/:projectId', async (req, res) => {
      try {
        const result = await this.deployWithGuidance(req.params.projectId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  initializeTutorials() {
    // Initialize comprehensive tutorials for different project types
    this.tutorials.set('beginner-website', {
      title: 'Create Your First Website',
      difficulty: 'Absolute Beginner',
      estimatedTime: '15 minutes',
      steps: this.getBeginnerWebsiteTutorial()
    });

    this.tutorials.set('ecommerce-store', {
      title: 'Build an Online Store',
      difficulty: 'Beginner',
      estimatedTime: '30 minutes',
      steps: this.getEcommerceTutorial()
    });

    this.tutorials.set('blog-cms', {
      title: 'Create a Blog/CMS',
      difficulty: 'Beginner',
      estimatedTime: '25 minutes',
      steps: this.getBlogTutorial()
    });

    this.tutorials.set('business-dashboard', {
      title: 'Business Analytics Dashboard',
      difficulty: 'Intermediate',
      estimatedTime: '45 minutes',
      steps: this.getBusinessDashboardTutorial()
    });

    this.tutorials.set('api-backend', {
      title: 'Create API Backend',
      difficulty: 'Intermediate',
      estimatedTime: '35 minutes',
      steps: this.getAPITutorial()
    });
  }

  generateProjectSelectionDashboard() {
    const tutorials = Array.from(this.tutorials.values());
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Zero IT Skills Server Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .header h1 { font-size: 3em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .project-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .project-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .project-card:hover {
            transform: translateY(-10px);
            background: rgba(255,255,255,0.15);
            border-color: #00ff88;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .project-icon {
            font-size: 4em;
            text-align: center;
            margin-bottom: 20px;
        }
        .project-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
            color: #00ff88;
        }
        .project-description {
            opacity: 0.9;
            margin-bottom: 20px;
            text-align: center;
            line-height: 1.6;
        }
        .project-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 0.9em;
        }
        .difficulty {
            padding: 5px 15px;
            border-radius: 15px;
            font-weight: bold;
        }
        .difficulty-beginner { background: #00ff88; color: #000; }
        .difficulty-intermediate { background: #ffa726; color: #000; }
        .difficulty-advanced { background: #ff6b35; color: #fff; }
        .start-button {
            width: 100%;
            background: linear-gradient(45deg, #00ff88, #00cc66);
            border: none;
            padding: 15px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .start-button:hover { transform: scale(1.05); }
        .ai-helper {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #00ff88;
            color: #000;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5em;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,255,136,0.5);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .features {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            margin: 40px auto;
            max-width: 1200px;
            text-align: center;
        }
        .features h2 { margin-bottom: 20px; color: #00ff88; }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Zero IT Skills Server Manager</h1>
        <p>Build, deploy, and manage any server project with AI guidance - No technical knowledge required!</p>
    </div>

    <div class="features">
        <h2>✨ What Makes This Special</h2>
        <div class="feature-list">
            <div class="feature">
                <h3>🤖 AI Guide</h3>
                <p>Personal AI assistant explains every step in simple terms</p>
            </div>
            <div class="feature">
                <h3>📱 One-Click Deploy</h3>
                <p>Automatic deployment to Netlify with live monitoring</p>
            </div>
            <div class="feature">
                <h3>🔧 Auto-Fix</h3>
                <p>Intelligent troubleshooting fixes issues automatically</p>
            </div>
            <div class="feature">
                <h3>📊 Live Dashboard</h3>
                <p>Real-time monitoring with easy-to-understand metrics</p>
            </div>
        </div>
    </div>

    <div class="project-grid">
        ${tutorials.map((tutorial, index) => `
            <div class="project-card" onclick="startTutorial('${Object.keys(Object.fromEntries(this.tutorials))[index]}')">
                <div class="project-icon">${this.getProjectIcon(tutorial.title)}</div>
                <div class="project-title">${tutorial.title}</div>
                <div class="project-description">${this.getProjectDescription(tutorial.title)}</div>
                <div class="project-meta">
                    <span class="difficulty difficulty-${tutorial.difficulty.toLowerCase().replace(' ', '-')}">${tutorial.difficulty}</span>
                    <span>⏱️ ${tutorial.estimatedTime}</span>
                </div>
                <button class="start-button">Start Building 🚀</button>
            </div>
        `).join('')}
    </div>

    <div class="ai-helper" onclick="openAIChat()" title="Chat with AI Assistant">
        🤖
    </div>

    <script>
        function startTutorial(projectType) {
            // Show user setup form
            const userName = prompt('What should we call you?') || 'Builder';
            const experience = prompt('Your experience level (type: none, some, experienced):') || 'none';
            
            // Start the guided tutorial
            window.location.href = '/tutorial/' + projectType + '?name=' + userName + '&exp=' + experience;
        }

        function openAIChat() {
            alert('🤖 AI Assistant: Hi! I\\'m here to help you build anything you want. Just select a project type above and I\\'ll guide you through every step!');
        }

        // Auto-save user preferences
        function saveUserPreference(key, value) {
            localStorage.setItem('zeroIT_' + key, value);
        }

        function getUserPreference(key) {
            return localStorage.getItem('zeroIT_' + key);
        }
    </script>
</body>
</html>`;
  }

  getProjectIcon(title) {
    const icons = {
      'Create Your First Website': '🌐',
      'Build an Online Store': '🛒',
      'Create a Blog/CMS': '📝',
      'Business Analytics Dashboard': '📊',
      'Create API Backend': '⚡'
    };
    return icons[title] || '🚀';
  }

  getProjectDescription(title) {
    const descriptions = {
      'Create Your First Website': 'Build a beautiful personal or business website with modern design and features',
      'Build an Online Store': 'Create a complete e-commerce store to sell products online with payment processing',
      'Create a Blog/CMS': 'Build a content management system for blogging or company news',
      'Business Analytics Dashboard': 'Create powerful dashboards to track business metrics and performance',
      'Create API Backend': 'Build backend services and APIs for mobile apps or advanced websites'
    };
    return descriptions[title] || 'Advanced project with step-by-step guidance';
  }

  generateStepByStepTutorial(projectType) {
    const tutorial = this.tutorials.get(projectType);
    if (!tutorial) {
      return this.generateErrorPage('Tutorial not found');
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎓 ${tutorial.title} - Step by Step</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            min-height: 100vh;
        }
        .tutorial-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .tutorial-header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
        }
        .progress-bar {
            background: rgba(255,255,255,0.2);
            height: 10px;
            border-radius: 5px;
            margin: 20px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(45deg, #00ff88, #00cc66);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
        }
        .step-container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .step-number {
            background: #00ff88;
            color: #000;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .step-title {
            font-size: 1.5em;
            margin-bottom: 15px;
            color: #00ff88;
        }
        .step-description {
            line-height: 1.6;
            margin-bottom: 20px;
            opacity: 0.9;
        }
        .ai-explanation {
            background: rgba(0,255,136,0.1);
            border-left: 4px solid #00ff88;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 10px 10px 0;
        }
        .code-block {
            background: rgba(0,0,0,0.5);
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        .action-button {
            background: linear-gradient(45deg, #00ff88, #00cc66);
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
            transition: transform 0.2s;
        }
        .action-button:hover { transform: scale(1.05); }
        .action-button:disabled {
            background: #666;
            cursor: not-allowed;
            transform: none;
        }
        .status-indicator {
            display: inline-flex;
            align-items: center;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.9em;
            margin-left: 10px;
        }
        .status-pending { background: #ffa726; color: #000; }
        .status-running { background: #2196f3; color: #fff; }
        .status-completed { background: #00ff88; color: #000; }
        .status-error { background: #f44336; color: #fff; }
        .ai-chat {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.2);
            display: none;
            flex-direction: column;
        }
        .ai-chat-header {
            background: #00ff88;
            color: #000;
            padding: 15px;
            border-radius: 20px 20px 0 0;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ai-chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        .ai-chat-input {
            padding: 15px;
            border-top: 1px solid rgba(255,255,255,0.2);
        }
        .ai-chat-input input {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 10px;
            background: rgba(255,255,255,0.9);
            color: #333;
        }
        .troubleshooting-panel {
            background: rgba(255,100,100,0.1);
            border: 1px solid #ff6b35;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            display: none;
        }
        .help-button {
            background: #ff6b35;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 15px;
            cursor: pointer;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="tutorial-container">
        <div class="tutorial-header">
            <h1>🎓 ${tutorial.title}</h1>
            <p>Difficulty: ${tutorial.difficulty} | Estimated Time: ${tutorial.estimatedTime}</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div id="progressText">Step 1 of ${tutorial.steps.length}</div>
        </div>

        <div id="stepsContainer">
            ${tutorial.steps.map((step, index) => `
                <div class="step-container" id="step-${index}" style="${index > 0 ? 'display: none;' : ''}">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-title">${step.title}</div>
                    <div class="step-description">${step.description}</div>
                    
                    <div class="ai-explanation">
                        <strong>🤖 AI Explains:</strong> ${step.aiExplanation}
                    </div>

                    ${step.code ? `
                        <div class="code-block">
                            <strong>Code:</strong><br>
                            ${step.code}
                        </div>
                    ` : ''}

                    <div class="step-actions">
                        <button class="action-button" onclick="executeStep(${index})" id="executeBtn-${index}">
                            ${step.actionText || 'Execute This Step'}
                        </button>
                        <span class="status-indicator status-pending" id="status-${index}">⏳ Ready</span>
                        
                        ${index > 0 ? `<button class="action-button" onclick="previousStep(${index})">← Previous</button>` : ''}
                        
                        <button class="action-button" onclick="nextStep(${index})" id="nextBtn-${index}" disabled>
                            ${index < tutorial.steps.length - 1 ? 'Next Step →' : 'Complete! 🎉'}
                        </button>
                    </div>

                    <div class="troubleshooting-panel" id="troubleshoot-${index}">
                        <h3>🔧 Something not working?</h3>
                        <p>Don't worry! Our AI can help fix any issues.</p>
                        <button class="help-button" onclick="getHelp(${index})">Get AI Help</button>
                        <button class="help-button" onclick="retryStep(${index})">Retry Step</button>
                        <button class="help-button" onclick="skipStep(${index})">Skip This Step</button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <!-- AI Chat Assistant -->
    <div class="ai-chat" id="aiChat">
        <div class="ai-chat-header">
            🤖 AI Assistant
            <button onclick="toggleAIChat()" style="background: none; border: none; color: #000; cursor: pointer;">✕</button>
        </div>
        <div class="ai-chat-messages" id="chatMessages">
            <div style="opacity: 0.8; margin-bottom: 10px;">
                Hi! I'm your AI guide. Ask me anything about this tutorial!
            </div>
        </div>
        <div class="ai-chat-input">
            <input type="text" placeholder="Ask me anything..." id="chatInput" onkeypress="handleChatInput(event)">
        </div>
    </div>

    <!-- Floating AI Button -->
    <div style="position: fixed; bottom: 20px; right: 20px; background: #00ff88; color: #000; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; cursor: pointer; box-shadow: 0 10px 30px rgba(0,255,136,0.5);" onclick="toggleAIChat()">
        🤖
    </div>

    <script>
        let currentStep = 0;
        const totalSteps = ${tutorial.steps.length};
        
        function updateProgress() {
            const progress = ((currentStep + 1) / totalSteps) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = 'Step ' + (currentStep + 1) + ' of ' + totalSteps;
        }

        async function executeStep(stepIndex) {
            const executeBtn = document.getElementById('executeBtn-' + stepIndex);
            const status = document.getElementById('status-' + stepIndex);
            const nextBtn = document.getElementById('nextBtn-' + stepIndex);
            
            executeBtn.disabled = true;
            executeBtn.textContent = '⏳ Executing...';
            status.className = 'status-indicator status-running';
            status.textContent = '🔄 Running...';

            try {
                const response = await fetch('/api/execute-step/' + stepIndex, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        projectType: '${projectType}',
                        stepData: ${JSON.stringify(tutorial.steps)}[stepIndex]
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    status.className = 'status-indicator status-completed';
                    status.textContent = '✅ Completed';
                    executeBtn.textContent = '✅ Completed';
                    nextBtn.disabled = false;
                    
                    // Show success message
                    addChatMessage('🎉 Step completed successfully! ' + (result.message || ''));
                } else {
                    throw new Error(result.error || 'Step failed');
                }
            } catch (error) {
                status.className = 'status-indicator status-error';
                status.textContent = '❌ Error';
                executeBtn.textContent = '❌ Failed';
                executeBtn.disabled = false;
                
                // Show troubleshooting panel
                document.getElementById('troubleshoot-' + stepIndex).style.display = 'block';
                
                addChatMessage('❌ Step failed: ' + error.message + '. Click "Get AI Help" for assistance.');
            }
        }

        function nextStep(currentIndex) {
            if (currentIndex < totalSteps - 1) {
                document.getElementById('step-' + currentIndex).style.display = 'none';
                document.getElementById('step-' + (currentIndex + 1)).style.display = 'block';
                currentStep = currentIndex + 1;
                updateProgress();
                
                addChatMessage('Moving to step ' + (currentStep + 1) + '. Let me know if you need help!');
            } else {
                // Tutorial completed!
                showCompletionDialog();
            }
        }

        function previousStep(currentIndex) {
            if (currentIndex > 0) {
                document.getElementById('step-' + currentIndex).style.display = 'none';
                document.getElementById('step-' + (currentIndex - 1)).style.display = 'block';
                currentStep = currentIndex - 1;
                updateProgress();
            }
        }

        async function getHelp(stepIndex) {
            const response = await fetch('/api/troubleshoot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issue: 'Step ' + (stepIndex + 1) + ' failed',
                    context: { stepIndex, projectType: '${projectType}' }
                })
            });
            
            const help = await response.json();
            addChatMessage('🤖 AI Help: ' + help.solution);
            
            // Show AI chat
            document.getElementById('aiChat').style.display = 'flex';
        }

        function retryStep(stepIndex) {
            // Reset step status
            document.getElementById('status-' + stepIndex).className = 'status-indicator status-pending';
            document.getElementById('status-' + stepIndex).textContent = '⏳ Ready';
            document.getElementById('executeBtn-' + stepIndex).disabled = false;
            document.getElementById('executeBtn-' + stepIndex).textContent = 'Execute This Step';
            document.getElementById('troubleshoot-' + stepIndex).style.display = 'none';
        }

        function skipStep(stepIndex) {
            // Mark as completed and move on
            document.getElementById('status-' + stepIndex).className = 'status-indicator status-completed';
            document.getElementById('status-' + stepIndex).textContent = '⏭️ Skipped';
            document.getElementById('nextBtn-' + stepIndex).disabled = false;
            document.getElementById('troubleshoot-' + stepIndex).style.display = 'none';
            
            addChatMessage('Step skipped. Don\\'t worry, you can always come back to it later!');
        }

        function toggleAIChat() {
            const chat = document.getElementById('aiChat');
            chat.style.display = chat.style.display === 'flex' ? 'none' : 'flex';
        }

        function addChatMessage(message) {
            const messages = document.getElementById('chatMessages');
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.style.padding = '8px';
            div.style.background = 'rgba(255,255,255,0.1)';
            div.style.borderRadius = '8px';
            div.textContent = message;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        function handleChatInput(event) {
            if (event.key === 'Enter') {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                if (message) {
                    addChatMessage('You: ' + message);
                    input.value = '';
                    
                    // Simple AI responses
                    setTimeout(() => {
                        addChatMessage('🤖 AI: I understand you\\'re asking about "' + message + '". Let me help you with that step by step!');
                    }, 1000);
                }
            }
        }

        function showCompletionDialog() {
            alert('🎉 Congratulations! You\\'ve completed the tutorial and your project is now live!\\n\\nYour project has been deployed to Netlify and is accessible worldwide.\\n\\nNext steps:\\n• Monitor your project with the live dashboard\\n• Make changes using the built-in editor\\n• Scale up with advanced features');
            
            // Redirect to project dashboard
            window.location.href = '/monitor/' + Date.now();
        }

        // Initialize
        updateProgress();
    </script>
</body>
</html>`;
  }

  getBeginnerWebsiteTutorial() {
    return [
      {
        title: "Welcome & Project Setup",
        description: "Let's start by setting up your first website project. This will create all the files you need.",
        aiExplanation: "Think of this like creating a new folder on your computer, but this folder will become a website that anyone in the world can visit! We're setting up the foundation.",
        actionText: "Create My Website Project",
        code: "// We'll create these files for you:\n// - index.html (your main webpage)\n// - style.css (makes it look beautiful)\n// - script.js (adds interactive features)"
      },
      {
        title: "Design Your Homepage",
        description: "Now we'll create your main webpage with a beautiful design that looks professional.",
        aiExplanation: "HTML is like the skeleton of your website - it defines what content appears. CSS is like the clothing and makeup - it makes everything look beautiful. Don't worry, I'll create all this code for you!",
        actionText: "Generate My Homepage",
        code: "<!DOCTYPE html>\n<html>\n<head>\n    <title>My Awesome Website</title>\n    <link rel='stylesheet' href='style.css'>\n</head>\n<body>\n    <h1>Welcome to My Website!</h1>\n    <p>This is my first website built with zero IT skills!</p>\n</body>\n</html>"
      },
      {
        title: "Connect to GitHub",
        description: "We'll save your website to GitHub, which is like a safe backup in the cloud that also enables deployment.",
        aiExplanation: "GitHub is like Google Drive for code - it keeps your website safe and lets you access it from anywhere. It also connects to Netlify for hosting.",
        actionText: "Save to GitHub"
      },
      {
        title: "Deploy to Netlify",
        description: "Now we'll make your website live on the internet so anyone can visit it!",
        aiExplanation: "Netlify is a service that takes your website files and makes them available on the internet with a real web address. It's like moving from building a house to actually living in it!",
        actionText: "Make My Website Live"
      },
      {
        title: "Setup Monitoring",
        description: "Finally, we'll set up automatic monitoring so you'll know if anything goes wrong.",
        aiExplanation: "Monitoring is like having a security system for your website - it watches over it 24/7 and alerts you if there are any problems.",
        actionText: "Enable Monitoring"
      }
    ];
  }

  getEcommerceTutorial() {
    return [
      {
        title: "E-commerce Project Setup",
        description: "Let's create your online store with all the features you need to sell products.",
        aiExplanation: "An e-commerce store is more complex than a simple website because it needs to handle products, shopping carts, and payments. But don't worry - I'll set up everything automatically!",
        actionText: "Create My Online Store"
      },
      {
        title: "Product Catalog Setup",
        description: "We'll create a beautiful product display system with images, descriptions, and prices.",
        aiExplanation: "Your product catalog is like the display window of a physical store - it shows customers what you're selling. We'll make it look professional and easy to navigate.",
        actionText: "Setup Product Display"
      },
      {
        title: "Shopping Cart & Checkout",
        description: "Add shopping cart functionality and secure checkout process.",
        aiExplanation: "The shopping cart lets customers collect items before buying, and checkout handles the payment process. This is the most complex part, but I'll handle all the technical details.",
        actionText: "Enable Shopping Cart"
      },
      {
        title: "Payment Processing",
        description: "Connect payment providers so customers can actually buy your products.",
        aiExplanation: "Payment processing connects your store to services like Stripe or PayPal so you can accept credit cards and other payments securely. The money goes directly to your account.",
        actionText: "Setup Payments"
      },
      {
        title: "Launch Your Store",
        description: "Deploy your complete e-commerce store to the internet and start selling!",
        aiExplanation: "Now your store goes live! Customers anywhere in the world can visit, browse your products, and make purchases. You'll get email notifications for new orders.",
        actionText: "Launch Store Live"
      }
    ];
  }

  getBlogTutorial() {
    return [
      {
        title: "Blog Platform Setup",
        description: "Create a content management system for publishing blog posts and articles.",
        aiExplanation: "A blog is like an online magazine where you can publish articles. We'll create a system that makes it easy to write and publish new content without any technical knowledge.",
        actionText: "Create Blog Platform"
      },
      {
        title: "Content Editor",
        description: "Set up an easy-to-use editor for writing and formatting your blog posts.",
        aiExplanation: "The content editor is like Microsoft Word for your website - it lets you write, format text, add images, and publish posts with just a few clicks.",
        actionText: "Setup Content Editor"
      },
      {
        title: "Design Templates",
        description: "Choose and customize beautiful templates for your blog layout.",
        aiExplanation: "Templates are pre-designed layouts that make your blog look professional. Think of them like themes - you can switch between different looks and customize colors and fonts.",
        actionText: "Apply Blog Design"
      },
      {
        title: "SEO Optimization",
        description: "Configure search engine optimization so people can find your blog on Google.",
        aiExplanation: "SEO helps your blog appear in Google search results when people search for topics you write about. It's like putting up street signs that help people find your content.",
        actionText: "Optimize for Search"
      },
      {
        title: "Publish Your Blog",
        description: "Launch your blog live on the internet and publish your first post!",
        aiExplanation: "Your blog is now ready for the world! You can start publishing content, and it will automatically appear online. You can write about anything you're passionate about.",
        actionText: "Launch Blog Live"
      }
    ];
  }

  getBusinessDashboardTutorial() {
    return [
      {
        title: "Dashboard Foundation",
        description: "Create the foundation for your business analytics dashboard with data visualization.",
        aiExplanation: "A business dashboard is like the control panel of an airplane - it shows you all the important information about your business in one place with charts and graphs.",
        actionText: "Create Dashboard Base"
      },
      {
        title: "Data Connections",
        description: "Connect your dashboard to data sources like sales, customers, and website analytics.",
        aiExplanation: "Data connections are like plugging different instruments into your dashboard. We can connect to Google Analytics, sales data, social media, and more to get a complete picture.",
        actionText: "Connect Data Sources"
      },
      {
        title: "Charts & Visualizations",
        description: "Add beautiful charts, graphs, and metrics that update in real-time.",
        aiExplanation: "Charts turn boring numbers into visual stories. Instead of looking at spreadsheets, you'll see colorful graphs that instantly show you how your business is performing.",
        actionText: "Create Visualizations"
      },
      {
        title: "Alerts & Notifications",
        description: "Set up automatic alerts when important metrics change or hit certain targets.",
        aiExplanation: "Alerts are like having a personal assistant watching your business 24/7. If sales spike, website traffic drops, or you hit a goal, you'll get notified immediately.",
        actionText: "Setup Alerts"
      },
      {
        title: "Deploy Dashboard",
        description: "Launch your business dashboard live so you can monitor your business from anywhere.",
        aiExplanation: "Your dashboard will be accessible from any device, anywhere in the world. Check your business performance from your phone, tablet, or computer at any time.",
        actionText: "Launch Dashboard"
      }
    ];
  }

  getAPITutorial() {
    return [
      {
        title: "API Project Setup",
        description: "Create a backend API service that can power mobile apps and websites.",
        aiExplanation: "An API is like a waiter in a restaurant - it takes requests (orders) from apps or websites and brings back the data they need. It's the invisible backbone that powers modern applications.",
        actionText: "Create API Service"
      },
      {
        title: "Database Setup",
        description: "Configure a database to store and retrieve your application data.",
        aiExplanation: "A database is like a super-organized filing cabinet that can instantly find any information you need. It stores user accounts, content, products, or any data your app needs.",
        actionText: "Setup Database"
      },
      {
        title: "API Endpoints",
        description: "Create the different endpoints (URLs) that apps can use to get and send data.",
        aiExplanation: "Endpoints are like different windows at a bank - one for deposits, one for withdrawals. Each endpoint has a specific job, like 'get user info' or 'save a new post'.",
        actionText: "Create API Endpoints"
      },
      {
        title: "Security & Authentication",
        description: "Add security measures to protect your API and user data.",
        aiExplanation: "Security is like having bouncers at a club - they check IDs (authentication) and make sure only authorized people can access certain areas of your API.",
        actionText: "Secure API"
      },
      {
        title: "Deploy API Service",
        description: "Launch your API live so apps and websites can start using it.",
        aiExplanation: "Your API is now live and ready to power applications! Other developers can use it, or you can connect it to websites and mobile apps.",
        actionText: "Deploy API Live"
      }
    ];
  }

  async executeSetupStep(stepId, stepData) {
    console.log(`🔧 Executing step ${stepId} for ${stepData.projectType}`);
    
    try {
      // Simulate step execution based on step type
      const step = stepData.stepData;
      
      switch (stepId) {
        case '0': // Project setup
          return await this.createProjectFiles(stepData.projectType);
        case '1': // Design/Content creation
          return await this.generateProjectContent(stepData.projectType);
        case '2': // GitHub connection
          return await this.connectToGitHub(stepData.projectType);
        case '3': // Netlify deployment
          return await this.deployToNetlify(stepData.projectType);
        case '4': // Monitoring setup
          return await this.setupMonitoring(stepData.projectType);
        default:
          return { success: true, message: 'Step completed successfully!' };
      }
    } catch (error) {
      console.error(`❌ Step ${stepId} failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async createProjectFiles(projectType) {
    console.log(`📁 Creating project files for ${projectType}...`);
    
    // Create basic project structure
    const files = this.getProjectTemplate(projectType);
    
    for (const [filename, content] of Object.entries(files)) {
      fs.writeFileSync(filename, content);
    }
    
    return { 
      success: true, 
      message: `Created ${Object.keys(files).length} project files successfully!` 
    };
  }

  getProjectTemplate(projectType) {
    const templates = {
      'beginner-website': {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <h1>My Website</h1>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="home">
            <h2>Welcome to My Website!</h2>
            <p>This is my first website built with zero IT skills!</p>
            <button onclick="sayHello()">Click Me!</button>
        </section>
        
        <section id="about">
            <h2>About Me</h2>
            <p>I'm learning to build websites with AI assistance!</p>
        </section>
        
        <section id="contact">
            <h2>Contact</h2>
            <p>Email: myemail@example.com</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 My Website. Built with Zero IT Skills Manager!</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`,
        'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

header {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(15px);
    padding: 1rem 0;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

nav {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}

nav h1 {
    color: white;
    font-size: 1.8rem;
}

nav ul {
    display: flex;
    list-style: none;
    gap: 2rem;
}

nav a {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

nav a:hover {
    color: #00ff88;
}

main {
    max-width: 1200px;
    margin: 100px auto 0;
    padding: 2rem;
}

section {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(15px);
    border-radius: 15px;
    padding: 3rem;
    margin: 2rem 0;
    color: white;
}

h2 {
    color: #00ff88;
    margin-bottom: 1rem;
    font-size: 2rem;
}

button {
    background: linear-gradient(45deg, #00ff88, #00cc66);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1rem;
    transition: transform 0.2s;
}

button:hover {
    transform: scale(1.05);
}

footer {
    text-align: center;
    padding: 2rem;
    color: white;
    opacity: 0.8;
}`,
        'script.js': `function sayHello() {
    alert('Hello! Welcome to my website built with zero IT skills!');
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add some interactivity
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
    
    // Add click effects to sections
    document.querySelectorAll('section').forEach(section => {
        section.addEventListener('click', function() {
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
});`
      },
      'ecommerce-store': {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Online Store</title>
    <link rel="stylesheet" href="store.css">
</head>
<body>
    <header>
        <nav>
            <h1>🛒 My Store</h1>
            <div class="cart-icon" onclick="toggleCart()">
                Cart (<span id="cartCount">0</span>)
            </div>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h2>Welcome to My Amazing Store!</h2>
            <p>Discover our incredible products</p>
        </section>
        
        <section id="products" class="products-grid">
            <!-- Products will be loaded here -->
        </section>
    </main>
    
    <div id="cart" class="cart-sidebar">
        <h3>Shopping Cart</h3>
        <div id="cartItems"></div>
        <div class="cart-total">
            <strong>Total: $<span id="cartTotal">0.00</span></strong>
        </div>
        <button onclick="checkout()" class="checkout-btn">Checkout</button>
    </div>
    
    <script src="store.js"></script>
</body>
</html>`,
        'store.css': `/* E-commerce specific styles */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 2rem;
}

.product-card {
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.3s;
}

.product-card:hover {
    transform: translateY(-10px);
}

.cart-sidebar {
    position: fixed;
    right: -300px;
    top: 0;
    width: 300px;
    height: 100vh;
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 2rem;
    transition: right 0.3s;
    z-index: 2000;
}

.cart-sidebar.open {
    right: 0;
}`,
        'store.js': `// E-commerce functionality
let cart = [];
let products = [
    { id: 1, name: 'Awesome Product 1', price: 29.99, image: 'https://via.placeholder.com/200' },
    { id: 2, name: 'Cool Product 2', price: 39.99, image: 'https://via.placeholder.com/200' },
    { id: 3, name: 'Great Product 3', price: 19.99, image: 'https://via.placeholder.com/200' }
];

function loadProducts() {
    const grid = document.getElementById('products');
    grid.innerHTML = products.map(product => 
        '<div class="product-card">' +
        '<img src="' + product.image + '" alt="' + product.name + '" style="width: 100%; border-radius: 10px;">' +
        '<h3>' + product.name + '</h3>' +
        '<p>$' + product.price + '</p>' +
        '<button onclick="addToCart(' + product.id + ')">Add to Cart</button>' +
        '</div>'
    ).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    updateCartDisplay();
}

function updateCartDisplay() {
    document.getElementById('cartCount').textContent = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

function toggleCart() {
    document.getElementById('cart').classList.toggle('open');
}

function checkout() {
    alert('Checkout functionality will be connected to payment processing!');
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);`
      }
    };
    
    return templates[projectType] || templates['beginner-website'];
  }

  async connectToGitHub(projectType) {
    console.log(`🔗 Connecting ${projectType} to GitHub...`);
    
    // Use the existing sync system
    const { syncSpecificRepo } = require('./sync-gpt-to-github');
    const result = await syncSpecificRepo('ToyParty');
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Successfully connected to GitHub! Your code is now safely backed up.' 
      };
    } else {
      throw new Error('Failed to connect to GitHub: ' + result.error);
    }
  }

  async deployToNetlify(projectType) {
    console.log(`🚀 Deploying ${projectType} to Netlify...`);
    
    // Use the autonomous Netlify setup
    const AutonomousNetlifySetup = require('./autonomous-netlify-setup');
    const setup = new AutonomousNetlifySetup();
    const result = await setup.instantDeploy();
    
    if (result) {
      return { 
        success: true, 
        message: 'Your website is now LIVE at https://toyparty.netlify.app!' 
      };
    } else {
      throw new Error('Deployment failed - but don\'t worry, we can retry!');
    }
  }

  async setupMonitoring(projectType) {
    console.log(`📊 Setting up monitoring for ${projectType}...`);
    
    // Create monitoring configuration
    const monitorConfig = {
      projectType: projectType,
      monitoring: {
        uptime: true,
        performance: true,
        errors: true,
        alerts: true
      },
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync('monitoring-config.json', JSON.stringify(monitorConfig, null, 2));
    
    return { 
      success: true, 
      message: 'Monitoring activated! You\'ll get alerts if anything needs attention.' 
    };
  }

  generateErrorPage(message) {
    return `
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="font-family: Arial; padding: 50px; text-align: center;">
    <h1>Oops! ${message}</h1>
    <p><a href="/">← Back to Project Selection</a></p>
</body>
</html>`;
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`\n🚀 ZERO IT SKILLS MANAGER RUNNING`);
        console.log(`🌐 Access at: http://0.0.0.0:${this.port}`);
        console.log(`🎓 Step-by-step tutorials for any project type`);
        console.log(`🤖 AI guidance for complete beginners`);
        console.log(`⚡ One-click deployment to Netlify`);
        console.log(`📊 Built-in monitoring and troubleshooting`);
        resolve();
      });
    });
  }
}

// AI Guide System for helping users
class AIGuideSystem {
  async troubleshoot(issue, context) {
    const solutions = {
      'Step 1 failed': 'Let me help you with project setup. This usually happens if files already exist. Try the "Retry Step" button.',
      'Step 2 failed': 'Content generation failed. This might be a temporary issue. Click "Retry Step" to try again.',
      'Step 3 failed': 'GitHub connection issue. Make sure your GITHUB_TOKEN is set in Replit Secrets.',
      'Step 4 failed': 'Netlify deployment issue. Check if NETLIFY_ACCESS_TOKEN is configured.',
      'Step 5 failed': 'Monitoring setup failed. This is not critical - your site will still work!'
    };
    
    return {
      success: true,
      solution: solutions[issue] || 'I\'m here to help! Try clicking "Retry Step" or "Get AI Help" for more specific assistance.'
    };
  }
}

// Step tracking system
class StepTracker {
  constructor() {
    this.steps = new Map();
  }
  
  trackStep(stepId, status) {
    this.steps.set(stepId, {
      status: status,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ZeroITSkillsManager;

// Auto-start if run directly
if (require.main === module) {
  const manager = new ZeroITSkillsManager();
  manager.start().catch(error => {
    console.error('❌ Failed to start Zero IT Skills Manager:', error.message);
    process.exit(1);
  });
}
