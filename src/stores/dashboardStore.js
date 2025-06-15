
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // Dashboard state
      activeTab: 'overview',
      deployments: [],
      alerts: [],
      loading: false,
      error: null,
      
      // User preferences
      theme: 'dark',
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30000,
      
      // Site management
      sites: [],
      selectedSite: null,
      
      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => {
        set({ error });
        if (error) {
          toast.error(error);
        }
      },
      
      addDeployment: (deployment) => set((state) => ({
        deployments: [deployment, ...state.deployments].slice(0, 50) // Keep last 50
      })),
      
      addAlert: (alert) => {
        const newAlert = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...alert
        };
        set((state) => ({
          alerts: [newAlert, ...state.alerts].slice(0, 100) // Keep last 100
        }));
        
        // Show toast notification
        if (alert.type === 'error') {
          toast.error(alert.message);
        } else if (alert.type === 'success') {
          toast.success(alert.message);
        } else {
          toast(alert.message);
        }
      },
      
      clearAlerts: () => set({ alerts: [] }),
      
      updateSites: (sites) => set({ sites }),
      
      selectSite: (site) => set({ selectedSite: site }),
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),
      
      updateSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      })),
      
      // Real-time updates
      startRealTimeUpdates: () => {
        const { autoRefresh, refreshInterval } = get();
        if (autoRefresh) {
          const interval = setInterval(() => {
            // Refresh deployments and alerts
            get().refreshData();
          }, refreshInterval);
          
          set({ refreshIntervalId: interval });
        }
      },
      
      stopRealTimeUpdates: () => {
        const { refreshIntervalId } = get();
        if (refreshIntervalId) {
          clearInterval(refreshIntervalId);
          set({ refreshIntervalId: null });
        }
      },
      
      refreshData: async () => {
        try {
          set({ loading: true });
          
          // Fetch latest data from your APIs
          const response = await fetch('/api/dashboard-data');
          const data = await response.json();
          
          set({
            deployments: data.deployments || [],
            alerts: data.alerts || [],
            sites: data.sites || [],
            loading: false
          });
          
        } catch (error) {
          set({ 
            error: 'Failed to refresh data',
            loading: false 
          });
        }
      }
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        theme: state.theme,
        notifications: state.notifications,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        selectedSite: state.selectedSite
      })
    }
  )
);

export default useDashboardStore;
