import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Request interceptor to automatically add the Authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    // You can add logic here to auto-logout on 401 errors if needed
    return Promise.reject(new Error(message));
  }
);

export { apiClient };
