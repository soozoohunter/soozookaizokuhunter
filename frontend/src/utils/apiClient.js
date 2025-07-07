import axios from 'axios';

const apiClient = axios.create({
  // baseURL can be set if needed
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
        logout();
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

export default apiClient;
