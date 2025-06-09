/**
 * User model
 * Simple in-memory user storage for demonstration purposes
 */

// In-memory user storage
const users = [];
let nextId = 1;

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
const createUser = (userData) => {
  const { email, password } = userData;
  
  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Create new user
  const newUser = {
    id: nextId++,
    email,
    password, // In a real app, this would be hashed
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  return { ...newUser, password: undefined }; // Don't return password
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Object|null} User object or null if not found
 */
const findUserByEmail = (email) => {
  return users.find(user => user.email === email) || null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Object|null} User object or null if not found
 */
const findUserById = (id) => {
  return users.find(user => user.id === Number(id)) || null;
};

/**
 * Get all users (without passwords)
 * @returns {Array} Array of users
 */
const getAllUsers = () => {
  return users.map(user => ({ ...user, password: undefined }));
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers
};