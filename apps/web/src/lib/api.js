import axios from 'axios';

let BASE_URL = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";
if (BASE_URL.endsWith("/")) BASE_URL = BASE_URL.slice(0, -1);

const api = axios.create({
  baseURL: BASE_URL,
});

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds deduplication window

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request Deduplication / Caching for GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return Promise.reject({
          config,
          message: 'Deduplicated',
          isDeduplicated: true,
          data: cached.data
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Cache successful GET requests
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle deduplicated requests
    if (error.isDeduplicated) {
      return Promise.resolve({ data: error.data, config: error.config, status: 200 });
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthPath = window.location.pathname === '/' || window.location.pathname.includes('/auth/callback');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!isAuthPath && refreshToken) {
        originalRequest._retry = true;
        try {
          // Attempt to refresh token using a separate axios instance to avoid interceptors
          const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { token } = refreshResponse.data;
          
          if (token) {
            localStorage.setItem('token', token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError.message);
          // Refresh failed, clear tokens and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/';
        }
      } else if (!isAuthPath) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
