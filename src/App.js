import React, { useEffect, useState } from 'react';
import { Sun, Moon, Server, Activity, Globe, Settings, BarChart3, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useStore } from './store';
import './App.css';

// Main App component
function App() {
  const { 
    activeTab, 
    dashboardData, 
    isLoading, 
    theme, 
    setActiveTab, 
    toggleTheme, 
    initializeDashboard,
    triggerSystemAction 
  } = useStore();

  useEffect(() => {
    setTimeout(() => {
      initializeDashboard();
    }, 1000);
    console.log('🏢 Professional Netlify Management Dashboard initialized!');
    console.log('🔗 Connected to Enterprise Platform');
  }, [initializeDashboard]);

  const handleSystemAccess = (system) => {
    triggerSystemAction('Accessing', system.name);
    setTimeout(() => {
      window.open(system.url, '_blank');
    }, 500);
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">
                  <Server size={24} />
                </div>
                <div className="metric-info">
                  <h3>Total Systems</h3>
                  <span className="metric-value">{dashboardData.metrics.totalSystems}</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">
                  <Activity size={24} />
                </div>
                <div className="metric-info">
                  <h3>Active Systems</h3>
                  <span className="metric-value">{dashboardData.metrics.activeSystems}</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">
                  <Globe size={24} />
                </div>
                <div className="metric-info">
                  <h3>Uptime</h3>
                  <span className="metric-value">{dashboardData.metrics.uptime}</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">
                  <Zap size={24} />
                </div>
                <div className="metric-info">
                  <h3>Performance</h3>
                  <span className="metric-value">{dashboardData.metrics.performance}</span>
                </div>
              </div>
            </div>

            <div className="systems-section">
              <h2>🎯 Enterprise Systems</h2>
              <div className="systems-grid">
                {dashboardData.systems.map((system, index) => (
                  <div key={index} className="system-card">
                    <div className="system-header">
                      <h3>{system.name}</h3>
                      <span className={`system-status ${system.status.toLowerCase()}`}>
                        {system.status}
                      </span>
                    </div>
                    <div className="system-details">
                      <p className="system-port">Port: {system.port}</p>
                      <p className="system-url">URL: {system.url}</p>
                      <p className="system-type">Type: {system.type}</p>
                    </div>
                    <button 
                      className="access-button"
                      onClick={() => handleSystemAccess(system)}
                    >
                      🔗 Access System
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      
      case 'sites':
        return (
          <div className="tab-content-area">
            <h2>🌐 Site Management</h2>
            <div className="site-grid">
              {dashboardData.systems.filter(s => s.type === 'web').map((site, index) => (
                <div key={index} className="site-card">
                  <h3>{site.name}</h3>
                  <p>Status: <span className="status-running">{site.status}</span></p>
                  <p>URL: {site.url}</p>
                  <button onClick={() => handleSystemAccess(site)} className="access-button">
                    🔗 Visit Site
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="tab-content-area">
            <h2>📊 Analytics & Monitoring</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Performance Metrics</h3>
                <div className="metric-row">
                  <span>Response Time:</span>
                  <span className="metric-good">125ms</span>
                </div>
                <div className="metric-row">
                  <span>Throughput:</span>
                  <span className="metric-good">1,250 req/min</span>
                </div>
                <div className="metric-row">
                  <span>Error Rate:</span>
                  <span className="metric-excellent">0.02%</span>
                </div>
              </div>
              <div className="analytics-card">
                <h3>System Health</h3>
                <div className="health-indicators">
                  <div className="health-item">
                    <span className="health-dot green"></span>
                    <span>CPU Usage: 12%</span>
                  </div>
                  <div className="health-item">
                    <span className="health-dot green"></span>
                    <span>Memory: 45%</span>
                  </div>
                  <div className="health-item">
                    <span className="health-dot green"></span>
                    <span>Disk I/O: Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'operations':
        return (
          <div className="tab-content-area">
            <h2>⚡ Operations Center</h2>
            <div className="operations-grid">
              <div className="operation-card">
                <h3>Quick Actions</h3>
                <div className="actions-list">
                  <button className="operation-button">🚀 Deploy All</button>
                  <button className="operation-button">🔄 Restart Services</button>
                  <button className="operation-button">📊 Generate Report</button>
                  <button className="operation-button">🔧 Run Diagnostics</button>
                </div>
              </div>
              <div className="operation-card">
                <h3>System Controls</h3>
                <div className="controls-grid">
                  <button className="control-button">Start All</button>
                  <button className="control-button">Stop All</button>
                  <button className="control-button">Backup</button>
                  <button className="control-button">Monitor</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="tab-content-area"><h2>Coming Soon...</h2></div>;
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        className="app-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="loading-container"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            🚀 Initializing Professional Dashboard...
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Connecting to enterprise systems...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
          },
        }}
      />
      <motion.div 
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Theme Toggle Button */}
        <motion.button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      
      <motion.div 
        className="dashboard-container"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.header 
          className="dashboard-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="header-content">
            <motion.h1
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              🏢 Autonomous Netlify Dashboard
            </motion.h1>
            <motion.div 
              className="status-indicator"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="status-text">{dashboardData.status}</span>
            </motion.div>
          </div>
        </motion.header>

        {/* Top Navigation Tabs */}
        <motion.nav 
          className="top-navigation"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="nav-tabs">
            <motion.button 
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Server size={16} />
              Dashboard
            </button>
            <motion.button 
              className={`nav-tab ${activeTab === 'sites' ? 'active' : ''}`}
              onClick={() => setActiveTab('sites')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Globe size={16} />
              Sites
            </motion.button>
            <motion.button 
              className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BarChart3 size={16} />
              Analytics
            </motion.button>
            <motion.button 
              className={`nav-tab ${activeTab === 'operations' ? 'active' : ''}`}
              onClick={() => setActiveTab('operations')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={16} />
              Operations
            </motion.button>
            <motion.button 
              className={`nav-tab ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users size={16} />
              Team
            </motion.button>
          </div>
        </nav>

        {/* Tab Content */}
        <motion.main 
          className="main-content"
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </motion.main>

        <motion.footer 
          className="dashboard-footer"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p>🚀 Autonomous Netlify Dashboard • Enterprise Grade • Real-time Operations</p>
        </motion.footer>
      </motion.div>
    </motion.div>
    </>)
  );
}

export default App;