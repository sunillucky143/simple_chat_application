import React, { createContext, useContext, useState, useEffect } from 'react';
import { signup as apiSignup, login as apiLogin, getCurrentUser } from '../services/apiService';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Signup function
  const signup = async (email, password) => {
    try {
      setError(null);
      const { user, token } = await apiSignup({ email, password });
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Signup failed');
      throw err;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const { user, token } = await apiLogin({ email, password });
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;