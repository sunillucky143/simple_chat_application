const messageService = require('../services/messageService');
const logger = require('../utils/logger');

/**
 * Get all messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllMessages = (req, res, next) => {
  try {
    const messages = messageService.getAllMessages();
    res.status(200).json(messages);
  } catch (error) {
    logger.error(`Error getting messages: ${error.message}`);
    next(error);
  }
};

/**
 * Get message by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMessageById = (req, res, next) => {
  try {
    const { id } = req.params;
    const message = messageService.getMessageById(id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json(message);
  } catch (error) {
    logger.error(`Error getting message by ID: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createMessage = (req, res, next) => {
  try {
    const { text, sender, userId } = req.body;
    
    // Validate request body
    if (!text || !sender) {
      return res.status(400).json({ message: 'Text and sender are required' });
    }
    
    const message = messageService.createMessage({ text, sender, userId });
    res.status(201).json(message);
  } catch (error) {
    logger.error(`Error creating message: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getAllMessages,
  getMessageById,
  createMessage
};