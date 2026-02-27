import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Check if it's not a login attempt
            if (!error.config.url.includes('/login') && !error.config.url.includes('/register')) {
                // Clear storage and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                localStorage.removeItem('sessionExpiry');
                localStorage.removeItem('lastActivity');
                
                // Redirect to login
                globalThis.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
