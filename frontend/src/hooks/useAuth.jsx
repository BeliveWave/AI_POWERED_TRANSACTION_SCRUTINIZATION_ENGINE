import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Session timeout duration: 15 minutes in milliseconds
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const AuthProvider = ({ children, onLogout }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const timeoutCheckIntervalRef = useRef(null);

  // Define fetchUser first to avoid hoisting issues
  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
      // If user fetch fails, logout
      performLogout();
    }
  };

  // Perform logout and cleanup
  const performLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('lastActivity');
    
    if (timeoutCheckIntervalRef.current) {
      clearInterval(timeoutCheckIntervalRef.current);
    }
    
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  // Check if session is still valid
  const isSessionValid = useCallback(() => {
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    if (!sessionExpiry) return false;
    
    const now = Date.now();
    return now < parseInt(sessionExpiry);
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem('lastActivity', now.toString());
    localStorage.setItem('sessionExpiry', (now + SESSION_TIMEOUT).toString());
  }, []);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      if (isLoggedIn) {
        updateActivity();
      }
    };

    // Listen to various user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isLoggedIn, updateActivity]);

  // Periodically check for session timeout
  useEffect(() => {
    if (isLoggedIn) {
      timeoutCheckIntervalRef.current = setInterval(() => {
        if (!isSessionValid()) {
          console.log('Auto-logout due to inactivity or session expiry');
          performLogout();
          window.location.href = '/login';
        }
      }, ACTIVITY_CHECK_INTERVAL);
    }

    return () => {
      if (timeoutCheckIntervalRef.current) {
        clearInterval(timeoutCheckIntervalRef.current);
      }
    };
  }, [isLoggedIn, isSessionValid, performLogout]);

  useEffect(() => {
    // Check for existing session on app start
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (token && isSessionValid()) {
      setIsLoggedIn(true);
      updateActivity(); // Update activity on app start
      fetchUser();
    } else {
      // Session invalid or expired, clear everything
      performLogout();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        username_or_email: email,
        password: password,
      });

      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem("token", access_token);
      
      // Set session timestamps
      const now = Date.now();
      localStorage.setItem('lastActivity', now.toString());
      localStorage.setItem('sessionExpiry', (now + SESSION_TIMEOUT).toString());
      
      setIsLoggedIn(true);
      updateActivity(); // Initialize activity tracking
      await fetchUser(); // Ensure we fetch user data after login
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      // Return error object to handle 2FA 403 in UI
      if (error.response?.status === 403 && error.response?.data?.detail === "2FA Required") {
        return { success: false, requires2FA: true };
      }
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, username, fullName, password) => {
    try {
      const response = await api.post('/auth/register', {
        email: email,
        username: username,
        full_name: fullName,
        password: password,
      });

      if (response.status === 201) {
        return { success: true };
      } else {
        return { success: false, error: "Unexpected response status: " + response.status };
      }
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = "An unexpected error occurred during registration.";

      if (error.response) {
        const data = error.response.data;
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg).join('\n');
          }
        }
      } else if (error.request) {
        errorMessage = "Network error. Unable to connect to server.";
      } else {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    performLogout();
    window.location.href = '/login';
  };

  const value = {
    isLoggedIn,
    user,
    login,
    register,
    logout,
    loading,
    updateActivity, // Export for SessionTimeout component
    isSessionValid, // Export for SessionTimeout component
    SESSION_TIMEOUT, // Export for SessionTimeout component
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};