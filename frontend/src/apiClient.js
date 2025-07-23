import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Request interceptor to automatically add the Authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.debug('[API Request]', config.method?.toUpperCase(), config.url, config.data || '');
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => {
    console.debug('[API Response]', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    if (status === 401) {
      console.warn('[API] Unauthorized, redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export { apiClient };
