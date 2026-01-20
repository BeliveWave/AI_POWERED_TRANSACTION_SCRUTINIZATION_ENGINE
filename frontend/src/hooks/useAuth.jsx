import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
        username_or_email: email,
        password: password,
      });

      if (response.status === 200) {
        const { access_token } = response.data;
        const userData = {
          email: email,
          name: email.split('@')[0], // Placeholder name
          role: 'user'
        };

        setIsLoggedIn(true);
        setUser(userData);
        localStorage.setItem('authToken', access_token);
        localStorage.setItem('userData', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return false;
    }
  };

  const register = async (email, username, fullName, password) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/register', {
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