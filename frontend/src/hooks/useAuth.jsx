import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define fetchUser first to avoid hoisting issues (though technically fine with function, const triggers TDZ checks sometimes)
  const fetchUser = async () => {
      try {
          const res = await api.get('/auth/me');
          setUser(res.data);
      } catch (err) {
          console.error("Failed to fetch user", err);
      }
  };

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (token) {
      setIsLoggedIn(true);
      fetchUser();
    }
    setLoading(false);
  }, []);

  const login = async (username, password, otpCode = null) => {
    try {
      const response = await api.post("/auth/login", { 
        username_or_email: username, 
        password,
        otp_code: otpCode 
      });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      setIsLoggedIn(true);
      await fetchUser(); // Ensure we fetch user data after login
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      // Return error object to handle 2FA 403 in UI
      if (error.response?.status === 403 && error.response?.data?.detail === "2FA Required") {
          return { success: false, requires2FA: true };
      }
      return { success: false, error: error.response?.data?.detail || "Login failed" };
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
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const data = error.response.data;
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg).join('\n');
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "Network error. Unable to connect to server.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Redirect to login page
    window.location.href = '/login';
  };

  const value = {
    isLoggedIn,
    user,
    login,
    register,
    logout,
    loading
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