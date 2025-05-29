const logger = require('../utils/logger');

// In-memory message store
let messages = [
  {
    id: generateId(),
    text: 'Welcome to SimpleChat! How can I help you today?',
    sender: 'bot',
    userId: 'bot',
    timestamp: new Date()
  }
];

/**
 * Generate a unique ID for messages
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Get all messages
 * @returns {Array} Array of messages
 */
function getAllMessages() {
  return messages;
}

/**
 * Get message by ID
 * @param {string} id - Message ID
 * @returns {Object|null} Message object or null if not found
 */
function getMessageById(id) {
  const messageId = parseInt(id, 10);
  return messages.find(message => message.id === messageId) || null;
}

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @param {string} messageData.text - Message text
 * @param {string} messageData.sender - Message sender (user/bot)
 * @param {string} messageData.userId - User ID
 * @returns {Object} Created message
 */
function createMessage({ text, sender, userId }) {
  const newMessage = {
    id: generateId(),
    text,
    sender,
    userId,
    timestamp: new Date()
  };
  
  messages.push(newMessage);
  logger.info(`New message created: ${JSON.stringify(newMessage)}`);
  
  return newMessage;
}

/**
 * Delete all messages (for testing purposes)
 */
function clearMessages() {
  messages = [];
  logger.info('All messages cleared');
}

module.exports = {
  getAllMessages,
  getMessageById,
  createMessage,
  clearMessages
};