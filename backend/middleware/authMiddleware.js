const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const user = authService.getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = {
  authenticate
};