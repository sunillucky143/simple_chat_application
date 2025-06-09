/**
 * Data service for handling form submissions
 */

// In-memory data storage
const dataStore = [];
let nextId = 1;

/**
 * Process and store form data
 * @param {Object} data - Form data
 * @param {number} userId - User ID
 * @returns {Object} Processed data
 */
const processFormData = (data, userId) => {
  const { title, content } = data;
  
  // Validate data
  if (!title || !content) {
    throw new Error('Title and content are required');
  }
  
  // Create new data entry
  const newData = {
    id: nextId++,
    title,
    content,
    userId,
    status: 'processed',
    createdAt: new Date().toISOString()
  };
  
  // Store data
  dataStore.push(newData);
  
  return newData;
};

/**
 * Get all data entries for a user
 * @param {number} userId - User ID
 * @returns {Array} User's data entries
 */
const getUserData = (userId) => {
  return dataStore.filter(data => data.userId === userId);
};

/**
 * Get data entry by ID
 * @param {number} id - Data ID
 * @returns {Object|null} Data entry or null if not found
 */
const getDataById = (id) => {
  return dataStore.find(data => data.id === Number(id)) || null;
};

module.exports = {
  processFormData,
  getUserData,
  getDataById
};