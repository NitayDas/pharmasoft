import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const fallbackBaseUrl = 'http://127.0.0.1:8000/api/';
const baseurl = isDevelopment
  ? import.meta.env.VITE_API_BASE_URL_LOCAL || fallbackBaseUrl
  : import.meta.env.VITE_API_BASE_URL_PROD || fallbackBaseUrl;

const csrfToken = document.cookie.match(/csrftoken=([\w-]+)/)?.[1];

const AxiosInstance = axios.create({
  baseURL: baseurl,
  timeout: 10000,
  headers: {
    accept: 'application/json',
    'X-CSRFToken': csrfToken ?? '',
  },
});

AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh-token interceptor — retry once on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return AxiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      isRefreshing = false;
      localStorage.removeItem('access_token');
      window.location.href = '/';
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${baseurl}accounts/token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess = data.access;
      localStorage.setItem('access_token', newAccess);
      AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
      processQueue(null, newAccess);
      originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
      return AxiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default AxiosInstance;
