import axios from 'axios';

let BASE_URL = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";
if (BASE_URL.endsWith("/")) BASE_URL = BASE_URL.slice(0, -1);

const api = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
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

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't logout if we are already on the home page or auth callback
      const isAuthPath = window.location.pathname === '/' || window.location.pathname.includes('/auth/callback');
      
      if (!isAuthPath) {
        console.warn("API 401: Clearing tokens and redirecting to home. Path:", window.location.pathname);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      } else {
        console.log("API 401 on auth path: Not clearing tokens. Path:", window.location.pathname);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
