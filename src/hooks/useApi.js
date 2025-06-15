
import { useState, useEffect, useCallback } from 'react';
import useDashboardStore from '../stores/dashboardStore';
import toast from 'react-hot-toast';

const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const addAlert = useDashboardStore(state => state.addAlert);

  const fetchData = useCallback(async (fetchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...fetchOptions.headers
        },
        ...options,
        ...fetchOptions
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      
      if (fetchOptions.successMessage) {
        addAlert({
          type: 'success',
          message: fetchOptions.successMessage
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      addAlert({
        type: 'error',
        message: fetchOptions.errorMessage || errorMessage
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options, addAlert]);

  const mutate = useCallback((newData) => {
    setData(newData);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  };
};

export default useApi;
