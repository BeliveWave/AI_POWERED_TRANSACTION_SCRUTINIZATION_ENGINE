import axios from 'axios';

// Ensure base URL is trimmed and does not have trailing slashes or erroneous subpaths
let rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').trim();
rawBase = rawBase.replace(/\/+$/, '');
if (rawBase.endsWith('/login')) {
  rawBase = rawBase.slice(0, -6).replace(/\/+$/, '');
}
if (rawBase.endsWith('/api')) {
  rawBase = rawBase.slice(0, -4).replace(/\/+$/, '');
}
export const API_BASE_URL = rawBase;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expirations
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/login') || url.includes('/register') || url.includes('/forgot-password') || url.includes('/reset-password');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
