import axios from 'axios';

const apiClient = axios.create({
  // 在生產環境中，baseURL 會是 /api，由 Nginx 代理
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 設定請求攔截器 (Request Interceptor)
// 這會在每一次請求發送前，自動檢查 localStorage 中是否有 token，並將其加入到請求的 header 中
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
