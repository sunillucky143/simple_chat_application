import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * User signup
 * @param {Object} userData - User data
 * @returns {Promise} Promise with response data
 */
export const signup = async (userData) => {
  try {
    const response = await api.post('/signup', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred during signup' };
  }
};

/**
 * User login
 * @param {Object} credentials - User credentials
 * @returns {Promise} Promise with response data
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred during login' };
  }
};

/**
 * Get current user profile
 * @returns {Promise} Promise with response data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user profile' };
  }
};

/**
 * Submit form data
 * @param {Object} formData - Form data
 * @returns {Promise} Promise with response data
 */
export const submitFormData = async (formData) => {
  try {
    const response = await api.post('/data', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit form data' };
  }
};

export default {
  signup,
  login,
  getCurrentUser,
  submitFormData,
};