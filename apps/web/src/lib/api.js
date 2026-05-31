import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://innoworks.onrender.com",
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
