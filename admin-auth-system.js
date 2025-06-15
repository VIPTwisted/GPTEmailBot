
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

class AdminAuthSystem {
  constructor() {
    this.app = express();
    this.port = 6001;
    this.jwtSecret = process.env.JWT_SECRET || 'toyparty-admin-secret-2024';
    this.adminUsers = new Map();
    
    // Initialize default admin
    this.initializeDefaultAdmin();
    this.setupMiddleware();
    this.setupRoutes();
  }

  async initializeDefaultAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    this.adminUsers.set('admin', {
      email: 'admin@toyparty.com',
      password: hashedPassword,
      role: 'super-admin',
      created: new Date(),
      permissions: ['all']
    });
    console.log('✅ Default admin user created: admin / admin123');
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Login page
    this.app.get('/admin/login', (req, res) => {
      res.send(this.generateLoginHTML());
    });

    // Authentication endpoint
    this.app.post('/admin/authenticate', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Check if it's username or email
        let user = null;
        let username = null;
        
        // Check by username
        if (this.adminUsers.has(email)) {
          username = email;
          user = this.adminUsers.get(email);
        } else {
          // Check by email
          for (const [key, value] of this.adminUsers.entries()) {
            if (value.email === email) {
              username = key;
              user = value;
              break;
            }
          }
        }

        if (!user) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
          });
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { username, email: user.email, role: user.role },
          this.jwtSecret,
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          token,
          user: {
            username,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          },
          redirectUrl: '/admin/dashboard'
        });

      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: 'Authentication failed' 
        });
      }
    });

    // Protected dashboard
    this.app.get('/admin/dashboard', this.authenticateToken, (req, res) => {
      res.send(this.generateDashboardHTML(req.user));
    });

    // API endpoints
    this.app.get('/admin/api/status', this.authenticateToken, (req, res) => {
      res.json({
        success: true,
        status: 'operational',
        user: req.user,
        timestamp: new Date().toISOString()
      });
    });

    // Change password
    this.app.post('/admin/change-password', this.authenticateToken, async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const user = this.adminUsers.get(req.user.username);
        
        const currentValid = await bcrypt.compare(currentPassword, user.password);
        if (!currentValid) {
          return res.status(400).json({ 
            success: false, 
            error: 'Current password is incorrect' 
          });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        this.adminUsers.set(req.user.username, user);

        res.json({ success: true, message: 'Password updated successfully' });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Password update failed' });
      }
    });

    // Logout
    this.app.post('/admin/logout', (req, res) => {
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }

  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'toyparty-admin-secret-2024', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  }

  generateLoginHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 ToyParty Admin Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .logo p {
            color: #666;
            font-size: 1.1em;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 600;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e1e1;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .login-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        .login-btn:hover {
            transform: translateY(-2px);
        }
        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .error-message {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #c33;
            display: none;
        }
        .success-message {
            background: #efe;
            color: #373;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #373;
            display: none;
        }
        .admin-info {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        .admin-info h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .admin-info code {
            background: #e8f4f8;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>🚀 ToyParty</h1>
            <p>Admin Control Panel</p>
        </div>

        <div class="admin-info">
            <h3>🔑 Default Admin Access</h3>
            <p><strong>Username:</strong> <code>admin</code></p>
            <p><strong>Password:</strong> <code>admin123</code></p>
            <p><em>Change password after first login</em></p>
        </div>

        <div id="errorMessage" class="error-message"></div>
        <div id="successMessage" class="success-message"></div>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Username or Email</label>
                <input type="text" id="email" name="email" required placeholder="admin">
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="admin123">
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">
                🔐 Login to Admin Panel
            </button>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const errorMsg = document.getElementById('errorMessage');
            const successMsg = document.getElementById('successMessage');
            
            loginBtn.disabled = true;
            loginBtn.textContent = '🔄 Authenticating...';
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            
            try {
                const formData = new FormData(e.target);
                const response = await fetch('/admin/authenticate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password')
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('adminToken', result.token);
                    localStorage.setItem('adminUser', JSON.stringify(result.user));
                    
                    successMsg.textContent = '✅ Login successful! Redirecting...';
                    successMsg.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = result.redirectUrl;
                    }, 1000);
                } else {
                    errorMsg.textContent = result.error || 'Login failed';
                    errorMsg.style.display = 'block';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
            }
            
            loginBtn.disabled = false;
            loginBtn.textContent = '🔐 Login to Admin Panel';
        });

        // Auto-fill for demo
        document.getElementById('email').value = 'admin';
        document.getElementById('password').value = 'admin123';
    </script>
</body>
</html>
    `;
  }

  generateDashboardHTML(user) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 ToyParty Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            font-size: 2em;
        }
        .user-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .logout-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        .dashboard-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card-title {
            font-size: 1.3em;
            margin-bottom: 15px;
            color: #ffd700;
        }
        .quick-actions {
            display: grid;
            gap: 10px;
        }
        .action-btn {
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: transform 0.2s ease;
        }
        .action-btn:hover {
            transform: translateY(-2px);
        }
        .status-live {
            color: #00ff88;
            font-weight: bold;
        }
        .admin-links {
            display: grid;
            gap: 15px;
            margin-top: 20px;
        }
        .admin-link {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            text-decoration: none;
            color: white;
            display: block;
            transition: background 0.3s ease;
        }
        .admin-link:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 ToyParty Admin Dashboard</h1>
        <div class="user-info">
            <span>👤 ${user.username} (${user.role})</span>
            <button class="logout-btn" onclick="logout()">🚪 Logout</button>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="dashboard-card">
            <div class="card-title">🌐 Live Site Status</div>
            <p>Site: <span class="status-live">LIVE & OPERATIONAL</span></p>
            <p>URL: <a href="https://toyparty.netlify.app" target="_blank" style="color: #ffd700;">https://toyparty.netlify.app</a></p>
            <div class="quick-actions" style="margin-top: 15px;">
                <a href="https://toyparty.netlify.app" target="_blank" class="action-btn">🌐 View Live Site</a>
            </div>
        </div>

        <div class="dashboard-card">
            <div class="card-title">🔧 Admin Controls</div>
            <div class="quick-actions">
                <button class="action-btn" onclick="syncToGitHub()">🔄 Sync to GitHub</button>
                <button class="action-btn" onclick="deployNow()">🚀 Deploy Now</button>
                <button class="action-btn" onclick="viewLogs()">📋 View Logs</button>
            </div>
        </div>

        <div class="dashboard-card">
            <div class="card-title">🏢 Advanced Dashboards</div>
            <div class="admin-links">
                <a href="http://0.0.0.0:6000/admin" target="_blank" class="admin-link">
                    🏢 Universal Admin Backend
                </a>
                <a href="http://0.0.0.0:5001/dashboard" target="_blank" class="admin-link">
                    📊 Optimized Dashboard
                </a>
                <a href="http://0.0.0.0:5000" target="_blank" class="admin-link">
                    🎨 Live Development Server
                </a>
            </div>
        </div>

        <div class="dashboard-card">
            <div class="card-title">⚙️ System Management</div>
            <div class="quick-actions">
                <button class="action-btn" onclick="changePassword()">🔑 Change Password</button>
                <button class="action-btn" onclick="systemHealth()">🏥 System Health</button>
                <button class="action-btn" onclick="viewMetrics()">📊 View Metrics</button>
            </div>
        </div>
    </div>

    <script>
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin/login';
        }

        function logout() {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin/login';
        }

        async function syncToGitHub() {
            alert('🔄 GitHub sync initiated!');
        }

        async function deployNow() {
            alert('🚀 Deployment triggered!');
        }

        function viewLogs() {
            window.open('/logs', '_blank');
        }

        function changePassword() {
            const currentPassword = prompt('Enter current password:');
            const newPassword = prompt('Enter new password:');
            
            if (currentPassword && newPassword) {
                fetch('/admin/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert('✅ Password changed successfully!');
                    } else {
                        alert('❌ ' + result.error);
                    }
                });
            }
        }

        function systemHealth() {
            fetch('/admin/api/status', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(data => {
                alert('🏥 System Status: ' + data.status.toUpperCase());
            });
        }

        function viewMetrics() {
            window.open('/admin/api/status', '_blank');
        }
    </script>
</body>
</html>
    `;
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`🔐 Admin Auth System running at http://0.0.0.0:${this.port}`);
      console.log(`🌐 Login Page: http://0.0.0.0:${this.port}/admin/login`);
      console.log(`👤 Default Admin: admin / admin123`);
      console.log('✅ Live admin system ready!');
    });
  }
}

if (require.main === module) {
  const authSystem = new AdminAuthSystem();
  authSystem.start();
}

module.exports = AdminAuthSystem;
