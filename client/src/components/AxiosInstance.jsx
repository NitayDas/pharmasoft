import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const fallbackBaseUrl = isDevelopment
  ? 'http://127.0.0.1:8000/api/'
  : 'http://127.0.0.1:8000/api/';
const baseurl = isDevelopment
  ? import.meta.env.VITE_API_BASE_URL_LOCAL || fallbackBaseUrl
  : import.meta.env.VITE_API_BASE_URL_PROD || fallbackBaseUrl;

//Extract CSRF token from cookies
const csrfToken = document.cookie.match(/csrftoken=([\w-]+)/)?.[1];

const AxiosInstance = axios.create({
  baseURL: baseurl,
  timeout: 10000,
  headers: {
    accept: "application/json",
    "X-CSRFToken": csrfToken ? csrfToken : "", 
  },
});

// Interceptor to add 'multipart/form-data' if needed
AxiosInstance.interceptors.request.use(
(config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
 },
 (error) => {
   return Promise.reject(error);
 }
 );

export default AxiosInstance;
