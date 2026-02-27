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

// Add response interceptor to handle 401 logging out?
// Optional but good practice
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if it's not a login attempt
            if (!error.config.url.includes('/login')) {
                // Clear storage and redirect?
                // localStorage.removeItem('token');
                // localStorage.removeItem('authToken');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
