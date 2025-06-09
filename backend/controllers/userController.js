const authService = require('../services/authService');
const userModel = require('../models/userModel');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const signup = (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Register user
    const { user, token } = authService.registerUser({ email, password });
    
    res.status(201).json({ user, token });
  } catch (error) {
    logger.error(`Error during signup: ${error.message}`);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: error.message });
    }
    
    next(error);
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Login user
    const { user, token } = authService.loginUser({ email, password });
    
    res.status(200).json({ user, token });
  } catch (error) {
    logger.error(`Error during login: ${error.message}`);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }
    
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCurrentUser = (req, res, next) => {
  try {
    // User is attached to request by auth middleware
    res.status(200).json(req.user);
  } catch (error) {
    logger.error(`Error getting current user: ${error.message}`);
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser
};