const logger = require('../utils/logger');

/**
 * AI Service for generating contextually relevant responses
 * 
 * This is a simple implementation that can be extended to use external AI APIs
 * like OpenAI, Hugging Face, etc. by adding the appropriate dependencies and API keys.
 */

// Store conversation history for context
const conversationHistory = new Map();

// Maximum number of messages to keep in history per user
const MAX_HISTORY_LENGTH = 10;

/**
 * Initialize conversation history for a user
 * @param {string} userId - User ID
 */
function initUserHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
}

console.log(MAX_HISTORY_LENGTH)
/**
 * Add a message to the conversation history
 * @param {string} userId - User ID
 * @param {Object} message - Message object
 */
function addToHistory(userId, message) {
  initUserHistory(userId);
  
  const history = conversationHistory.get(userId);
  history.push({
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.text
  });
  
  // Keep history within size limit
  if (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }
  
  conversationHistory.set(userId, history);
}

/**
 * Get conversation history for a user
 * @param {string} userId - User ID
 * @returns {Array} Conversation history
 */
function getUserHistory(userId) {
  initUserHistory(userId);
  return conversationHistory.get(userId);
}

/**
 * Clear conversation history for a user
 * @param {string} userId - User ID
 */
function clearHistory(userId) {
  conversationHistory.set(userId, []);
}

/**
 * Generate a response based on user input and conversation history
 * @param {string} userId - User ID
 * @param {string} userMessage - User message text
 * @returns {Promise<string>} AI-generated response
 */
async function generateResponse(userId, userMessage) {
  try {
    // Add user message to history
    addToHistory(userId, { sender: 'user', text: userMessage });
    
    // Get conversation history
    const history = getUserHistory(userId);
    
    // In a real implementation, this would call an external AI API
    // For now, we'll use a simple rule-based approach
    const response = await simulateAIResponse(userMessage, history);
    
    // Add AI response to history
    addToHistory(userId, { sender: 'bot', text: response });
    
    return response;
  } catch (error) {
    logger.error(`Error generating AI response: ${error.message}`);
    return "I'm sorry, I'm having trouble processing your request right now.";
  }
}

/**
 * Simulate AI response generation
 * This is a placeholder for an actual AI API call
 * @param {string} userMessage - User message text
 * @param {Array} history - Conversation history
 * @returns {Promise<string>} Simulated AI response
 */
async function simulateAIResponse(userMessage, history) {
  // Simple keyword-based responses
  const message = userMessage.toLowerCase();
  
  // Greeting patterns
  if (message.match(/^(hi|hello|hey|greetings).*/i)) {
    return "Hello there! How can I assist you today?";
  }
  
  // Questions about the bot
  if (message.includes("who are you") || message.includes("what are you")) {
    return "I'm an AI assistant designed to help with your questions and have conversations.";
  }
  
  // Help requests
  if (message.includes("help") || message.includes("assist")) {
    return "I'd be happy to help! Could you provide more details about what you need assistance with?";
  }
  
  // Thank you responses
  if (message.includes("thank you") || message.includes("thanks")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  // Questions
  if (message.includes("?")) {
    if (message.includes("how are you")) {
      return "I'm functioning well, thank you for asking! How are you doing today?";
    }
    if (message.includes("weather")) {
      return "I don't have access to real-time weather data, but I'd recommend checking a weather service for the most accurate information.";
    }
    if (message.includes("time")) {
      return `I don't have access to your local time, but I can tell you it's currently ${new Date().toUTCString()} in UTC.`;
    }
    return "That's an interesting question. Could you provide more details so I can give you a better answer?";
  }
  
  // Check for previous context in history
  let contextResponse = checkContextForResponse(history);
  if (contextResponse) {
    return contextResponse;
  }
  
  // Default responses with follow-up questions to encourage engagement
  const defaultResponses = [
    "That's interesting! Could you tell me more about that?",
    "I understand. What would you like to know about this topic?",
    "Thanks for sharing. How can I help you with this?",
    "I see. Would you like me to provide more information on this subject?",
    "Interesting point! What are your thoughts on this matter?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * Check conversation history for context to generate a more relevant response
 * @param {Array} history - Conversation history
 * @returns {string|null} Contextual response or null if no context match
 */
function checkContextForResponse(history) {
  if (history.length < 3) return null;
  
  // Get the last few exchanges
  const recentHistory = history.slice(-3);
  
  // Check for repeated questions or topics
  const userMessages = recentHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase());
  
  // If user is repeating similar questions, acknowledge it
  if (userMessages.length >= 2) {
    const lastMessage = userMessages[userMessages.length - 1];
    const previousMessage = userMessages[userMessages.length - 2];
    
    if (stringSimilarity(lastMessage, previousMessage) > 0.7) {
      return "I notice you're asking about this again. Let me try to provide a clearer answer. " +
        "Could you specify what part of my previous response wasn't helpful?";
    }
  }
  
  return null;
}

/**
 * Simple string similarity check (very basic implementation)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function stringSimilarity(str1, str2) {
  // Very simple implementation - in a real app, use a proper algorithm
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  let commonWords = 0;
  for (const word of words1) {
    if (words2.has(word)) commonWords++;
  }
  
  return commonWords / Math.max(words1.size, words2.size);
}

module.exports = {
  generateResponse,
  addToHistory,
  getUserHistory,
  clearHistory
};