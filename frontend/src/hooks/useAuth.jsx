import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes session timeout

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateActivity = useCallback(() => {
    const expiry = Date.now() + SESSION_TIMEOUT_MS;
    localStorage.setItem('sessionExpiry', String(expiry));
  }, []);

  const isSessionValid = useCallback(() => {
    const expiry = localStorage.getItem('sessionExpiry');
    if (!expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.warn("Could not fetch user profile:", err.message);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('sessionExpiry');
  }, []);

  useEffect(() => {
    // Check initial auth state from localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const valid = isSessionValid();

    if (token && valid) {
      setIsLoggedIn(true);
      fetchUser();
    } else if (token && !valid) {
      // Session has expired
      logout();
    }
    setLoading(false);

    // Activity tracking listeners
    const handleUserActivity = () => {
      if (localStorage.getItem('token')) {
        updateActivity();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    // Listen for unauthorized 401 events from Axios interceptor
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchUser, isSessionValid, logout, updateActivity]);

  const login = async (usernameOrEmail, password, otpCode = null) => {
    try {
      const payload = {
        username_or_email: usernameOrEmail.trim(),
        password,
        otp_code: otpCode ? otpCode.trim() : null,
      };

      const response = await api.post('/api/auth/login', payload);
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      updateActivity();
      setIsLoggedIn(true);

      const profile = await fetchUser();
      return { success: true, user: profile };
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 403 && detail === "2FA Required") {
        return { success: false, requires2FA: true };
      }

      const errorMessage = typeof detail === 'string' ? detail : 'Authentication failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, username, fullName, password) => {
    try {
      const response = await api.post('/api/auth/register', {
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim(),
        password,
      });

      if (response.status === 201) {
        return { success: true, data: response.data };
      }
      return { success: false, error: `Unexpected status: ${response.status}` };
    } catch (error) {
      let errorMessage = "Registration failed. Please verify your details.";
      const detail = error.response?.data?.detail;

      if (detail) {
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err) => err.msg || err.message).join(' | ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/api/auth/forgot-password', { email: email.trim() });
      return { success: true, message: res.data?.message };
    } catch (error) {
      const msg = error.response?.data?.detail || "Could not dispatch recovery instructions.";
      return { success: false, error: msg };
    }
  };

  const verifyResetToken = async (email, token) => {
    try {
      const res = await api.post('/api/auth/verify-reset-token', {
        email: email.trim(),
        token: token.trim(),
      });
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.response?.data?.detail || "Invalid or expired reset token.";
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email, token, newPassword, confirmPassword) => {
    try {
      const res = await api.post('/api/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return { success: true, message: res.data?.message };
    } catch (error) {
      const msg = error.response?.data?.detail || "Password reset failed.";
      return { success: false, error: msg };
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const res = await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return { success: true, message: res.data?.message };
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to update password.";
      return { success: false, error: msg };
    }
  };

  const value = {
    isLoggedIn,
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    changePassword,
    updateActivity,
    isSessionValid,
    SESSION_TIMEOUT: SESSION_TIMEOUT_MS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};