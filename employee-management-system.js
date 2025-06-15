
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const DatabaseManager = require('./database-manager');

class EmployeeManagementSystem {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.port = 5000;
    this.db = new DatabaseManager();
    
    // Core modules
    this.modules = {
      employees: new EmployeeManager(),
      crm: new CRMManager(),
      training: new TrainingManager(),
      timeClock: new TimeClockManager(),
      reporting: new ReportingManager(),
      permissions: new PermissionsManager()
    };
    
    // Real-time data
    this.liveData = {
      activeEmployees: new Map(),
      clockedInEmployees: new Set(),
      activeTrainings: new Map(),
      realtimeMetrics: {}
    };
  }

  async initialize() {
    console.log('👥 INITIALIZING EMPLOYEE MANAGEMENT SYSTEM...');
    
    this.app.use(express.static('public'));
    this.app.use(express.json());
    
    await this.db.initialize();
    await this.createEmployeeTables();
    
    // Initialize all modules
    for (const [name, module] of Object.entries(this.modules)) {
      await module.initialize(this.db);
      console.log(`✅ ${name.toUpperCase()} module initialized`);
    }
    
    this.setupRoutes();
    this.setupWebSocketConnections();
    
    console.log('✅ Employee Management System ready');
  }

  async createEmployeeTables() {
    const tables = [
      // Employees table
      `CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        position VARCHAR(100),
        hire_date DATE NOT NULL,
        salary DECIMAL(12,2),
        hourly_rate DECIMAL(8,2),
        employment_type VARCHAR(50) DEFAULT 'full-time',
        status VARCHAR(50) DEFAULT 'active',
        manager_id INTEGER REFERENCES employees(id),
        profile_image VARCHAR(500),
        address JSONB,
        emergency_contact JSONB,
        benefits JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Departments table
      `CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        manager_id INTEGER REFERENCES employees(id),
        budget DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Time tracking
      `CREATE TABLE IF NOT EXISTS time_entries (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        clock_in TIMESTAMP NOT NULL,
        clock_out TIMESTAMP,
        break_start TIMESTAMP,
        break_end TIMESTAMP,
        total_hours DECIMAL(8,2),
        overtime_hours DECIMAL(8,2),
        location VARCHAR(255),
        ip_address INET,
        notes TEXT,
        approved_by INTEGER REFERENCES employees(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Training system
      `CREATE TABLE IF NOT EXISTS training_courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        difficulty_level VARCHAR(50),
        duration_hours DECIMAL(5,2),
        instructor VARCHAR(255),
        max_participants INTEGER,
        prerequisites JSONB,
        materials JSONB,
        certification_required BOOLEAN DEFAULT FALSE,
        expiry_months INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Training enrollments
      `CREATE TABLE IF NOT EXISTS training_enrollments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        course_id INTEGER NOT NULL REFERENCES training_courses(id),
        enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        start_date TIMESTAMP,
        completion_date TIMESTAMP,
        score DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'enrolled',
        certificate_issued BOOLEAN DEFAULT FALSE,
        certificate_url VARCHAR(500),
        feedback TEXT
      )`,
      
      // Performance reviews
      `CREATE TABLE IF NOT EXISTS performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        reviewer_id INTEGER NOT NULL REFERENCES employees(id),
        review_period_start DATE,
        review_period_end DATE,
        overall_rating DECIMAL(3,2),
        goals_achievement DECIMAL(3,2),
        communication_rating DECIMAL(3,2),
        teamwork_rating DECIMAL(3,2),
        technical_skills DECIMAL(3,2),
        strengths TEXT,
        improvement_areas TEXT,
        goals_next_period TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // CRM customers
      `CREATE TABLE IF NOT EXISTS crm_customers (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR(50) UNIQUE NOT NULL,
        company_name VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        address JSONB,
        industry VARCHAR(100),
        company_size VARCHAR(50),
        lead_source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'lead',
        assigned_to INTEGER REFERENCES employees(id),
        value DECIMAL(12,2),
        probability DECIMAL(5,2),
        expected_close_date DATE,
        last_contact TIMESTAMP,
        notes TEXT,
        tags JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // CRM interactions
      `CREATE TABLE IF NOT EXISTS crm_interactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES crm_customers(id),
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        interaction_type VARCHAR(50),
        subject VARCHAR(255),
        description TEXT,
        outcome VARCHAR(100),
        follow_up_date DATE,
        duration_minutes INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Permissions system
      `CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        permissions JSONB,
        level INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS employee_roles (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        role_id INTEGER NOT NULL REFERENCES roles(id),
        assigned_by INTEGER REFERENCES employees(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )`,
      
      // Payroll
      `CREATE TABLE IF NOT EXISTS payroll_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        pay_period_start DATE,
        pay_period_end DATE,
        regular_hours DECIMAL(8,2),
        overtime_hours DECIMAL(8,2),
        gross_pay DECIMAL(12,2),
        taxes DECIMAL(12,2),
        deductions DECIMAL(12,2),
        net_pay DECIMAL(12,2),
        processed_at TIMESTAMP,
        processed_by INTEGER REFERENCES employees(id),
        status VARCHAR(50) DEFAULT 'pending'
      )`
    ];

    for (const table of tables) {
      await this.db.query(table);
    }
    
    console.log('✅ Employee database tables created');
  }

  setupRoutes() {
    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // Employee management
    this.app.get('/api/employees', async (req, res) => {
      const employees = await this.modules.employees.getAllEmployees();
      res.json(employees);
    });

    this.app.post('/api/employees', async (req, res) => {
      const employee = await this.modules.employees.createEmployee(req.body);
      res.json(employee);
    });

    this.app.put('/api/employees/:id', async (req, res) => {
      const employee = await this.modules.employees.updateEmployee(req.params.id, req.body);
      res.json(employee);
    });

    // Time clock
    this.app.post('/api/time/clock-in', async (req, res) => {
      const result = await this.modules.timeClock.clockIn(req.body.employeeId, req.ip);
      res.json(result);
    });

    this.app.post('/api/time/clock-out', async (req, res) => {
      const result = await this.modules.timeClock.clockOut(req.body.employeeId);
      res.json(result);
    });

    this.app.get('/api/time/entries/:employeeId', async (req, res) => {
      const entries = await this.modules.timeClock.getTimeEntries(req.params.employeeId);
      res.json(entries);
    });

    // Training
    this.app.get('/api/training/courses', async (req, res) => {
      const courses = await this.modules.training.getAllCourses();
      res.json(courses);
    });

    this.app.post('/api/training/enroll', async (req, res) => {
      const enrollment = await this.modules.training.enrollEmployee(req.body);
      res.json(enrollment);
    });

    // CRM
    this.app.get('/api/crm/customers', async (req, res) => {
      const customers = await this.modules.crm.getAllCustomers();
      res.json(customers);
    });

    this.app.post('/api/crm/customers', async (req, res) => {
      const customer = await this.modules.crm.createCustomer(req.body);
      res.json(customer);
    });

    // Reporting
    this.app.get('/api/reports/:type', async (req, res) => {
      const report = await this.modules.reporting.generateReport(req.params.type);
      res.json(report);
    });

    // Permissions
    this.app.get('/api/permissions/check/:employeeId/:action', async (req, res) => {
      const hasPermission = await this.modules.permissions.checkPermission(
        req.params.employeeId, 
        req.params.action
      );
      res.json({ hasPermission });
    });
  }

  setupWebSocketConnections() {
    this.io.on('connection', (socket) => {
      console.log('👤 Employee client connected:', socket.id);

      socket.on('employee-login', (data) => {
        this.liveData.activeEmployees.set(data.employeeId, {
          socketId: socket.id,
          loginTime: new Date(),
          lastActivity: new Date()
        });
        
        socket.emit('login-confirmed', { success: true });
        this.broadcastLiveMetrics();
      });

      socket.on('request-live-data', () => {
        socket.emit('live-data-update', this.getLiveMetrics());
      });

      socket.on('clock-status-update', (data) => {
        if (data.status === 'in') {
          this.liveData.clockedInEmployees.add(data.employeeId);
        } else {
          this.liveData.clockedInEmployees.delete(data.employeeId);
        }
        this.broadcastLiveMetrics();
      });

      socket.on('disconnect', () => {
        // Remove from active employees
        for (const [employeeId, data] of this.liveData.activeEmployees.entries()) {
          if (data.socketId === socket.id) {
            this.liveData.activeEmployees.delete(employeeId);
            break;
          }
        }
        this.broadcastLiveMetrics();
      });
    });
  }

  getLiveMetrics() {
    return {
      activeEmployees: this.liveData.activeEmployees.size,
      clockedInEmployees: this.liveData.clockedInEmployees.size,
      onlineUsers: this.io.engine.clientsCount,
      timestamp: new Date().toISOString()
    };
  }

  broadcastLiveMetrics() {
    this.io.emit('metrics-update', this.getLiveMetrics());
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👥 Employee Management System</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            text-align: center;
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .nav-tabs {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
        }
        
        .nav-tab {
            padding: 12px 24px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .nav-tab:hover, .nav-tab.active {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .container {
            max-width: 1400px;
            margin: 30px auto;
            padding: 0 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
        }
        
        .metric-title {
            font-size: 1.1em;
            color: #667eea;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
        }
        
        .metric-subtitle {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        
        .content-area {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            min-height: 500px;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .data-table th {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
        }
        
        .data-table tr:hover {
            background: rgba(102, 126, 234, 0.1);
        }
        
        .action-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            margin: 2px;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
        }
        
        .btn-success {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
        }
        
        .btn-warning {
            background: linear-gradient(45deg, #ff9800, #f57c00);
            color: white;
        }
        
        .btn-danger {
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
        }
        
        .action-btn:hover {
            transform: scale(1.05);
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-active { background: #4CAF50; color: white; }
        .status-inactive { background: #f44336; color: white; }
        .status-pending { background: #ff9800; color: white; }
        .status-completed { background: #2196F3; color: white; }
        
        .live-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
        }
        
        .clock-widget {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin: 20px 0;
        }
        
        .clock-time {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .clock-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>👥 Employee Management System</h1>
        <p style="text-align: center; color: #666;">Complete HR, CRM, Training & Time Management Solution</p>
        
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('dashboard')">📊 Dashboard</button>
            <button class="nav-tab" onclick="showTab('employees')">👥 Employees</button>
            <button class="nav-tab" onclick="showTab('timeclock')">⏰ Time Clock</button>
            <button class="nav-tab" onclick="showTab('training')">🎓 Training</button>
            <button class="nav-tab" onclick="showTab('crm')">📞 CRM</button>
            <button class="nav-tab" onclick="showTab('reports')">📈 Reports</button>
            <button class="nav-tab" onclick="showTab('permissions')">🔒 Permissions</button>
        </div>
    </div>

    <div class="live-indicator" id="liveIndicator">
        🟢 LIVE - 0 Active Users
    </div>

    <div class="container">
        <!-- Dashboard Tab -->
        <div id="dashboard-tab" class="tab-content active">
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">👥 Total Employees</div>
                    <div class="metric-value" id="total-employees">0</div>
                    <div class="metric-subtitle">Active workforce</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">⏰ Clocked In</div>
                    <div class="metric-value" id="clocked-in">0</div>
                    <div class="metric-subtitle">Currently working</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">🎓 Training Progress</div>
                    <div class="metric-value" id="training-progress">0%</div>
                    <div class="metric-subtitle">Completion rate</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">📞 CRM Leads</div>
                    <div class="metric-value" id="crm-leads">0</div>
                    <div class="metric-subtitle">Active prospects</div>
                </div>
            </div>
            
            <div class="content-area">
                <h2>📊 Real-Time Dashboard</h2>
                <div id="dashboard-content">
                    <p>Welcome to the Employee Management System. Use the tabs above to navigate to different modules.</p>
                    
                    <div class="clock-widget">
                        <div class="clock-time" id="current-time">00:00:00</div>
                        <div>Current Time</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Employees Tab -->
        <div id="employees-tab" class="tab-content">
            <div class="content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>👥 Employee Management</h2>
                    <button class="action-btn btn-primary" onclick="showAddEmployeeForm()">➕ Add Employee</button>
                </div>
                
                <table class="data-table" id="employees-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Employee data will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Time Clock Tab -->
        <div id="timeclock-tab" class="tab-content">
            <div class="content-area">
                <h2>⏰ Time Clock Management</h2>
                
                <div class="form-grid">
                    <div>
                        <h3>Quick Clock In/Out</h3>
                        <div class="form-group">
                            <label>Employee ID</label>
                            <input type="text" id="clock-employee-id" placeholder="Enter employee ID">
                        </div>
                        <div class="clock-actions">
                            <button class="action-btn btn-success" onclick="clockIn()">⏰ Clock In</button>
                            <button class="action-btn btn-warning" onclick="clockOut()">🏃 Clock Out</button>
                        </div>
                    </div>
                    
                    <div>
                        <h3>Today's Summary</h3>
                        <div id="time-summary">
                            <p>Clocked In: <span id="total-clocked-in">0</span></p>
                            <p>Total Hours: <span id="total-hours">0.0</span></p>
                            <p>Overtime: <span id="overtime-hours">0.0</span></p>
                        </div>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Hours</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="time-entries">
                        <!-- Time entries will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Training Tab -->
        <div id="training-tab" class="tab-content">
            <div class="content-area">
                <h2>🎓 Training Management</h2>
                
                <div class="form-grid">
                    <div>
                        <h3>Course Enrollment</h3>
                        <div class="form-group">
                            <label>Employee</label>
                            <select id="training-employee">
                                <option value="">Select Employee</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Course</label>
                            <select id="training-course">
                                <option value="">Select Course</option>
                            </select>
                        </div>
                        <button class="action-btn btn-primary" onclick="enrollInTraining()">📚 Enroll</button>
                    </div>
                    
                    <div>
                        <h3>Training Progress</h3>
                        <div id="training-stats">
                            <p>Active Courses: <span id="active-courses">0</span></p>
                            <p>Completions This Month: <span id="monthly-completions">0</span></p>
                            <p>Average Score: <span id="average-score">0%</span></p>
                        </div>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Course</th>
                            <th>Progress</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="training-enrollments">
                        <!-- Training data will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- CRM Tab -->
        <div id="crm-tab" class="tab-content">
            <div class="content-area">
                <h2>📞 Customer Relationship Management</h2>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <button class="action-btn btn-primary" onclick="showAddCustomerForm()">➕ Add Customer</button>
                        <button class="action-btn btn-success" onclick="importCustomers()">📤 Import</button>
                    </div>
                    <div>
                        <input type="search" placeholder="Search customers..." style="padding: 8px; border-radius: 20px; border: 2px solid #ddd;">
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Value</th>
                            <th>Assigned To</th>
                            <th>Last Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="crm-customers">
                        <!-- Customer data will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Reports Tab -->
        <div id="reports-tab" class="tab-content">
            <div class="content-area">
                <h2>📈 Reports & Analytics</h2>
                
                <div class="form-grid">
                    <div>
                        <h3>Generate Report</h3>
                        <div class="form-group">
                            <label>Report Type</label>
                            <select id="report-type">
                                <option value="employee-summary">Employee Summary</option>
                                <option value="time-tracking">Time Tracking</option>
                                <option value="training-progress">Training Progress</option>
                                <option value="performance-review">Performance Reviews</option>
                                <option value="crm-pipeline">CRM Pipeline</option>
                                <option value="payroll">Payroll Report</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date Range</label>
                            <input type="date" id="report-start">
                            <input type="date" id="report-end">
                        </div>
                        <button class="action-btn btn-primary" onclick="generateReport()">📊 Generate</button>
                    </div>
                    
                    <div>
                        <h3>Quick Stats</h3>
                        <div id="quick-stats">
                            <p>Employee Turnover: <span id="turnover-rate">2.3%</span></p>
                            <p>Average Training Score: <span id="avg-training-score">87%</span></p>
                            <p>Customer Satisfaction: <span id="customer-satisfaction">4.2/5</span></p>
                            <p>Revenue Per Employee: <span id="revenue-per-employee">$85K</span></p>
                        </div>
                    </div>
                </div>
                
                <div id="report-results" style="margin-top: 30px;">
                    <!-- Generated reports will appear here -->
                </div>
            </div>
        </div>

        <!-- Permissions Tab -->
        <div id="permissions-tab" class="tab-content">
            <div class="content-area">
                <h2>🔒 Permissions & Roles</h2>
                
                <div class="form-grid">
                    <div>
                        <h3>Role Management</h3>
                        <div class="form-group">
                            <label>Role Name</label>
                            <input type="text" id="role-name" placeholder="Enter role name">
                        </div>
                        <div class="form-group">
                            <label>Permissions</label>
                            <div id="permissions-list">
                                <label><input type="checkbox" value="view_employees"> View Employees</label><br>
                                <label><input type="checkbox" value="edit_employees"> Edit Employees</label><br>
                                <label><input type="checkbox" value="view_payroll"> View Payroll</label><br>
                                <label><input type="checkbox" value="edit_payroll"> Edit Payroll</label><br>
                                <label><input type="checkbox" value="view_reports"> View Reports</label><br>
                                <label><input type="checkbox" value="admin_access"> Admin Access</label><br>
                            </div>
                        </div>
                        <button class="action-btn btn-primary" onclick="createRole()">🔒 Create Role</button>
                    </div>
                    
                    <div>
                        <h3>Assign Roles</h3>
                        <div class="form-group">
                            <label>Employee</label>
                            <select id="permission-employee">
                                <option value="">Select Employee</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="permission-role">
                                <option value="">Select Role</option>
                            </select>
                        </div>
                        <button class="action-btn btn-success" onclick="assignRole()">✅ Assign</button>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Permissions</th>
                            <th>Assigned Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="role-assignments">
                        <!-- Role assignments will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentTab = 'dashboard';
        
        // Tab management
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
            currentTab = tabName;
            
            // Load tab data
            loadTabData(tabName);
        }
        
        // Load data based on current tab
        function loadTabData(tabName) {
            switch(tabName) {
                case 'employees':
                    loadEmployees();
                    break;
                case 'timeclock':
                    loadTimeEntries();
                    break;
                case 'training':
                    loadTrainingData();
                    break;
                case 'crm':
                    loadCRMData();
                    break;
                case 'reports':
                    loadReportData();
                    break;
                case 'permissions':
                    loadPermissionsData();
                    break;
            }
        }
        
        // Clock functionality
        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            document.getElementById('current-time').textContent = timeString;
        }
        
        function clockIn() {
            const employeeId = document.getElementById('clock-employee-id').value;
            if (!employeeId) {
                alert('Please enter employee ID');
                return;
            }
            
            fetch('/api/time/clock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Clocked in successfully');
                    socket.emit('clock-status-update', { employeeId, status: 'in' });
                    loadTimeEntries();
                } else {
                    alert('Clock in failed: ' + data.error);
                }
            });
        }
        
        function clockOut() {
            const employeeId = document.getElementById('clock-employee-id').value;
            if (!employeeId) {
                alert('Please enter employee ID');
                return;
            }
            
            fetch('/api/time/clock-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Clocked out successfully');
                    socket.emit('clock-status-update', { employeeId, status: 'out' });
                    loadTimeEntries();
                } else {
                    alert('Clock out failed: ' + data.error);
                }
            });
        }
        
        // Data loading functions
        function loadEmployees() {
            fetch('/api/employees')
                .then(response => response.json())
                .then(employees => {
                    const tbody = document.querySelector('#employees-table tbody');
                    tbody.innerHTML = employees.map(emp => `
                        <tr>
                            <td>${emp.employee_id}</td>
                            <td>${emp.first_name} ${emp.last_name}</td>
                            <td>${emp.department || 'N/A'}</td>
                            <td>${emp.position || 'N/A'}</td>
                            <td><span class="status-badge status-${emp.status}">${emp.status}</span></td>
                            <td>
                                <button class="action-btn btn-primary" onclick="editEmployee(${emp.id})">✏️ Edit</button>
                                <button class="action-btn btn-warning" onclick="viewEmployee(${emp.id})">👁️ View</button>
                            </td>
                        </tr>
                    `).join('');
                    
                    document.getElementById('total-employees').textContent = employees.length;
                });
        }
        
        function loadTimeEntries() {
            // Load today's time entries
            fetch('/api/time/entries/all')
                .then(response => response.json())
                .then(entries => {
                    const tbody = document.getElementById('time-entries');
                    tbody.innerHTML = entries.map(entry => `
                        <tr>
                            <td>${entry.employee_name}</td>
                            <td>${entry.clock_in ? new Date(entry.clock_in).toLocaleTimeString() : 'N/A'}</td>
                            <td>${entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString() : 'In Progress'}</td>
                            <td>${entry.total_hours || '0.0'}</td>
                            <td><span class="status-badge status-${entry.clock_out ? 'completed' : 'active'}">${entry.clock_out ? 'Completed' : 'Active'}</span></td>
                            <td>
                                <button class="action-btn btn-primary" onclick="editTimeEntry(${entry.id})">✏️ Edit</button>
                            </td>
                        </tr>
                    `).join('');
                });
        }
        
        function loadTrainingData() {
            // Load training courses and enrollments
            Promise.all([
                fetch('/api/training/courses').then(r => r.json()),
                fetch('/api/training/enrollments').then(r => r.json())
            ]).then(([courses, enrollments]) => {
                // Populate course dropdown
                const courseSelect = document.getElementById('training-course');
                courseSelect.innerHTML = '<option value="">Select Course</option>' +
                    courses.map(course => `<option value="${course.id}">${course.title}</option>`).join('');
                
                // Display enrollments
                const tbody = document.getElementById('training-enrollments');
                tbody.innerHTML = enrollments.map(enrollment => `
                    <tr>
                        <td>${enrollment.employee_name}</td>
                        <td>${enrollment.course_title}</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${enrollment.progress || 0}%"></div>
                            </div>
                            ${enrollment.progress || 0}%
                        </td>
                        <td>${enrollment.score || 'N/A'}</td>
                        <td><span class="status-badge status-${enrollment.status}">${enrollment.status}</span></td>
                        <td>
                            <button class="action-btn btn-primary" onclick="viewTrainingProgress(${enrollment.id})">📊 Progress</button>
                        </td>
                    </tr>
                `).join('');
            });
        }
        
        function loadCRMData() {
            fetch('/api/crm/customers')
                .then(response => response.json())
                .then(customers => {
                    const tbody = document.getElementById('crm-customers');
                    tbody.innerHTML = customers.map(customer => `
                        <tr>
                            <td>${customer.first_name} ${customer.last_name}</td>
                            <td>${customer.company_name || 'N/A'}</td>
                            <td><span class="status-badge status-${customer.status}">${customer.status}</span></td>
                            <td>$${customer.value || '0'}</td>
                            <td>${customer.assigned_to_name || 'Unassigned'}</td>
                            <td>${customer.last_contact ? new Date(customer.last_contact).toLocaleDateString() : 'Never'}</td>
                            <td>
                                <button class="action-btn btn-primary" onclick="editCustomer(${customer.id})">✏️ Edit</button>
                                <button class="action-btn btn-success" onclick="contactCustomer(${customer.id})">📞 Contact</button>
                            </td>
                        </tr>
                    `).join('');
                    
                    document.getElementById('crm-leads').textContent = customers.filter(c => c.status === 'lead').length;
                });
        }
        
        function loadReportData() {
            // Load quick stats
            fetch('/api/reports/quick-stats')
                .then(response => response.json())
                .then(stats => {
                    if (stats.turnover_rate) document.getElementById('turnover-rate').textContent = stats.turnover_rate + '%';
                    if (stats.avg_training_score) document.getElementById('avg-training-score').textContent = stats.avg_training_score + '%';
                    if (stats.customer_satisfaction) document.getElementById('customer-satisfaction').textContent = stats.customer_satisfaction + '/5';
                    if (stats.revenue_per_employee) document.getElementById('revenue-per-employee').textContent = '$' + stats.revenue_per_employee;
                });
        }
        
        function loadPermissionsData() {
            // Load roles and assignments
            Promise.all([
                fetch('/api/permissions/roles').then(r => r.json()),
                fetch('/api/permissions/assignments').then(r => r.json())
            ]).then(([roles, assignments]) => {
                // Populate role dropdown
                const roleSelect = document.getElementById('permission-role');
                roleSelect.innerHTML = '<option value="">Select Role</option>' +
                    roles.map(role => `<option value="${role.id}">${role.name}</option>`).join('');
                
                // Display assignments
                const tbody = document.getElementById('role-assignments');
                tbody.innerHTML = assignments.map(assignment => `
                    <tr>
                        <td>${assignment.employee_name}</td>
                        <td>${assignment.role_name}</td>
                        <td>${assignment.permissions_count} permissions</td>
                        <td>${new Date(assignment.assigned_at).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn btn-danger" onclick="revokeRole(${assignment.id})">❌ Revoke</button>
                        </td>
                    </tr>
                `).join('');
            });
        }
        
        // Generate reports
        function generateReport() {
            const type = document.getElementById('report-type').value;
            const startDate = document.getElementById('report-start').value;
            const endDate = document.getElementById('report-end').value;
            
            if (!type) {
                alert('Please select a report type');
                return;
            }
            
            fetch('/api/reports/' + type + '?start=' + startDate + '&end=' + endDate)
                .then(response => response.json())
                .then(report => {
                    document.getElementById('report-results').innerHTML = `
                        <h3>📊 ${report.title}</h3>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-top: 15px;">
                            ${report.html || '<p>Report generated successfully. Data: ' + JSON.stringify(report.data, null, 2) + '</p>'}
                        </div>
                    `;
                });
        }
        
        // Socket event handlers
        socket.on('connect', () => {
            console.log('Connected to Employee Management System');
            socket.emit('employee-login', { employeeId: 'admin' });
        });
        
        socket.on('metrics-update', (metrics) => {
            document.getElementById('liveIndicator').textContent = 
                '🟢 LIVE - ' + metrics.activeEmployees + ' Active Users';
            document.getElementById('clocked-in').textContent = metrics.clockedInEmployees;
        });
        
        socket.on('live-data-update', (data) => {
            // Update dashboard with live data
            console.log('Live data update:', data);
        });
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            updateClock();
            setInterval(updateClock, 1000);
            loadTabData('dashboard');
            
            // Load employees for dropdowns
            fetch('/api/employees')
                .then(response => response.json())
                .then(employees => {
                    const selects = ['training-employee', 'permission-employee'];
                    selects.forEach(selectId => {
                        const select = document.getElementById(selectId);
                        if (select) {
                            select.innerHTML = '<option value="">Select Employee</option>' +
                                employees.map(emp => `<option value="${emp.id}">${emp.first_name} ${emp.last_name}</option>`).join('');
                        }
                    });
                });
        });
    </script>
</body>
</html>
    `;
  }

  async start() {
    await this.initialize();
    
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`👥 Employee Management System: http://0.0.0.0:${this.port}`);
      console.log('🎯 Features: HR, CRM, Training, Time Clock, Reporting, Permissions');
      console.log('✅ READY FOR ENTERPRISE WORKFORCE MANAGEMENT');
    });
  }
}

// Supporting Classes
class EmployeeManager {
  async initialize(db) {
    this.db = db;
    console.log('👤 Employee manager initialized');
  }

  async getAllEmployees() {
    const result = await this.db.query(`
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department = d.name 
      ORDER BY e.created_at DESC
    `);
    return result.rows;
  }

  async createEmployee(data) {
    const result = await this.db.query(`
      INSERT INTO employees (employee_id, first_name, last_name, email, phone, department, position, hire_date, salary, hourly_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [data.employee_id, data.first_name, data.last_name, data.email, data.phone, data.department, data.position, data.hire_date, data.salary, data.hourly_rate]);
    return result.rows[0];
  }

  async updateEmployee(id, data) {
    const result = await this.db.query(`
      UPDATE employees 
      SET first_name = $1, last_name = $2, email = $3, department = $4, position = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [data.first_name, data.last_name, data.email, data.department, data.position, id]);
    return result.rows[0];
  }
}

class TimeClockManager {
  async initialize(db) {
    this.db = db;
    console.log('⏰ Time clock manager initialized');
  }

  async clockIn(employeeId, ipAddress) {
    try {
      const result = await this.db.query(`
        INSERT INTO time_entries (employee_id, clock_in, ip_address)
        VALUES ($1, CURRENT_TIMESTAMP, $2)
        RETURNING *
      `, [employeeId, ipAddress]);
      return { success: true, entry: result.rows[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clockOut(employeeId) {
    try {
      const result = await this.db.query(`
        UPDATE time_entries 
        SET clock_out = CURRENT_TIMESTAMP,
            total_hours = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - clock_in)) / 3600
        WHERE employee_id = $1 AND clock_out IS NULL
        RETURNING *
      `, [employeeId]);
      return { success: true, entry: result.rows[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTimeEntries(employeeId) {
    const result = await this.db.query(`
      SELECT te.*, e.first_name, e.last_name,
             (e.first_name || ' ' || e.last_name) as employee_name
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE te.employee_id = $1
      ORDER BY te.clock_in DESC
      LIMIT 30
    `, [employeeId]);
    return result.rows;
  }
}

class TrainingManager {
  async initialize(db) {
    this.db = db;
    console.log('🎓 Training manager initialized');
  }

  async getAllCourses() {
    const result = await this.db.query('SELECT * FROM training_courses ORDER BY created_at DESC');
    return result.rows;
  }

  async enrollEmployee(data) {
    const result = await this.db.query(`
      INSERT INTO training_enrollments (employee_id, course_id, start_date)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `, [data.employeeId, data.courseId]);
    return result.rows[0];
  }
}

class CRMManager {
  async initialize(db) {
    this.db = db;
    console.log('📞 CRM manager initialized');
  }

  async getAllCustomers() {
    const result = await this.db.query(`
      SELECT c.*, e.first_name || ' ' || e.last_name as assigned_to_name
      FROM crm_customers c
      LEFT JOIN employees e ON c.assigned_to = e.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  async createCustomer(data) {
    const result = await this.db.query(`
      INSERT INTO crm_customers (customer_id, company_name, first_name, last_name, email, phone, status, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [data.customer_id, data.company_name, data.first_name, data.last_name, data.email, data.phone, data.status, data.assigned_to]);
    return result.rows[0];
  }
}

class ReportingManager {
  async initialize(db) {
    this.db = db;
    console.log('📊 Reporting manager initialized');
  }

  async generateReport(type) {
    switch (type) {
      case 'employee-summary':
        return await this.generateEmployeeSummary();
      case 'time-tracking':
        return await this.generateTimeTrackingReport();
      case 'training-progress':
        return await this.generateTrainingReport();
      default:
        return { title: 'Report', data: { message: 'Report type not implemented' } };
    }
  }

  async generateEmployeeSummary() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        AVG(salary) as average_salary
      FROM employees
    `);
    return {
      title: 'Employee Summary Report',
      data: result.rows[0],
      html: `<p><strong>Total Employees:</strong> ${result.rows[0].total_employees}</p>
             <p><strong>Active Employees:</strong> ${result.rows[0].active_employees}</p>
             <p><strong>Average Salary:</strong> $${parseFloat(result.rows[0].average_salary || 0).toFixed(2)}</p>`
    };
  }

  async generateTimeTrackingReport() {
    const result = await this.db.query(`
      SELECT 
        SUM(total_hours) as total_hours_worked,
        AVG(total_hours) as average_hours_per_entry,
        COUNT(*) as total_entries
      FROM time_entries
      WHERE clock_in >= CURRENT_DATE - INTERVAL '30 days'
    `);
    return {
      title: 'Time Tracking Report (Last 30 Days)',
      data: result.rows[0]
    };
  }

  async generateTrainingReport() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_enrollments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trainings,
        AVG(score) as average_score
      FROM training_enrollments
    `);
    return {
      title: 'Training Progress Report',
      data: result.rows[0]
    };
  }
}

class PermissionsManager {
  async initialize(db) {
    this.db = db;
    console.log('🔒 Permissions manager initialized');
    await this.createDefaultRoles();
  }

  async createDefaultRoles() {
    const defaultRoles = [
      { name: 'Administrator', permissions: ['*'], level: 10 },
      { name: 'HR Manager', permissions: ['view_employees', 'edit_employees', 'view_payroll'], level: 8 },
      { name: 'Team Lead', permissions: ['view_employees', 'view_reports'], level: 5 },
      { name: 'Employee', permissions: ['view_own_data'], level: 1 }
    ];

    for (const role of defaultRoles) {
      await this.db.query(`
        INSERT INTO roles (name, description, permissions, level)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `, [role.name, `Default ${role.name} role`, JSON.stringify(role.permissions), role.level]);
    }
  }

  async checkPermission(employeeId, action) {
    const result = await this.db.query(`
      SELECT r.permissions
      FROM employee_roles er
      JOIN roles r ON er.role_id = r.id
      WHERE er.employee_id = $1
      AND (er.expires_at IS NULL OR er.expires_at > CURRENT_TIMESTAMP)
    `, [employeeId]);

    for (const row of result.rows) {
      const permissions = row.permissions;
      if (permissions.includes('*') || permissions.includes(action)) {
        return true;
      }
    }
    return false;
  }
}

module.exports = EmployeeManagementSystem;

if (require.main === module) {
  const system = new EmployeeManagementSystem();
  system.start().catch(console.error);
}
