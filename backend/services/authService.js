const crypto = require('crypto');
const userModel = require('../models/userModel');

// Secret key for JWT (in a real app, this would be in environment variables)
const JWT_SECRET = 'your_jwt_secret_key';

/**
 * Generate a JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  // Simple JWT implementation (for demonstration purposes only)
  // In a real app, use a proper JWT library
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Object} User and token
 */
const registerUser = (userData) => {
  const user = userModel.createUser(userData);
  const token = generateToken({ userId: user.id, email: user.email });
  
  return { user, token };
};

/**
 * Login a user
 * @param {Object} credentials - User credentials
 * @returns {Object} User and token
 */
const loginUser = (credentials) => {
  const { email, password } = credentials;
  
  const user = userModel.findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken({ userId: user.id, email: user.email });
  return { user: { ...user, password: undefined }, token };
};

/**
 * Get user from token
 * @param {string} token - JWT token
 * @returns {Object|null} User or null if token is invalid
 */
const getUserFromToken = (token) => {
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }
  
  const user = userModel.findUserById(payload.userId);
  if (!user) {
    return null;
  }
  
  return { ...user, password: undefined };
};

module.exports = {
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserFromToken
};