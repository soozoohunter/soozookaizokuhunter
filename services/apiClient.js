import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// 自動附加 token 的攔截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setupResponseInterceptor = (logout) => {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        console.error('Authentication Error (401). Logging out.');
        if (logout) logout();
      }
      return Promise.reject(error);
    }
  );
};

export default apiClient;
