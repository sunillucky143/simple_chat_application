const dataService = require('../services/dataService');
const logger = require('../utils/logger');

/**
 * Submit form data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const submitFormData = (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    
    // Validate request body
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Process form data
    const processedData = dataService.processFormData({ title, content }, userId);
    
    res.status(200).json({
      id: processedData.id,
      title: processedData.title,
      status: processedData.status
    });
  } catch (error) {
    logger.error(`Error submitting form data: ${error.message}`);
    next(error);
  }
};

/**
 * Get user's data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserData = (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = dataService.getUserData(userId);
    
    res.status(200).json(data);
  } catch (error) {
    logger.error(`Error getting user data: ${error.message}`);
    next(error);
  }
};

module.exports = {
  submitFormData,
  getUserData
};