import axios from 'axios';
import authService from './authService';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    timeout: 60000,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.request.use(
    config => {
        const token = authService.getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const { data } = await axiosInstance.post('/auth/refresh');
                    authService.setAccessToken(data.accessToken);
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
                    processQueue(null, data.accessToken);
                    return axiosInstance(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    authService.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            });
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
