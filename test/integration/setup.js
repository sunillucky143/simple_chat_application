/**
 * Integration Test Setup
 * 
 * This file contains setup code that runs before all integration tests.
 * It initializes the test environment, starts the server in test mode,
 * and provides utility functions for testing.
 */

const { app, server } = require('../../backend/server');
const http = require('http');
const io = require('socket.io-client');
const axios = require('axios');

// Test server configuration
const TEST_PORT = process.env.TEST_PORT || 5001;
const TEST_SERVER_URL = `http://localhost:${TEST_PORT}`;
const TEST_WS_URL = `ws://localhost:${TEST_PORT}`;

// Store for test data
const testData = {
  users: [],
  messages: [],
  tokens: {},
  sockets: {}
};

/**
 * Start the test server
 */
const startTestServer = async () => {
  return new Promise((resolve) => {
    // Close the existing server if it's running
    if (server.listening) {
      server.close(() => {
        // Start a new server on the test port
        server.listen(TEST_PORT, () => {
          console.log(`Test server running on port ${TEST_PORT}`);
          resolve();
        });
      });
    } else {
      // Start the server on the test port
      server.listen(TEST_PORT, () => {
        console.log(`Test server running on port ${TEST_PORT}`);
        resolve();
      });
    }
  });
};

/**
 * Create a test user
 * @param {Object} userData - User data
 * @returns {Object} Created user and token
 */
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!'
  };
  
  const user = { ...defaultUser, ...userData };
  
  try {
    const response = await axios.post(`${TEST_SERVER_URL}/api/signup`, user);
    const { token } = response.data;
    
    // Store user and token for later use
    testData.users.push(response.data.user);
    testData.tokens[response.data.user.id] = token;
    
    return response.data;
  } catch (error) {
    console.error('Error creating test user:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a socket connection for testing
 * @param {string} token - Authentication token
 * @returns {Object} Socket.io client
 */
const createTestSocketConnection = (token) => {
  const socket = io(TEST_WS_URL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined
  });
  
  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      testData.sockets[socket.id] = socket;
      resolve(socket);
    });
    
    socket.on('connect_error', (err) => {
      reject(err);
    });
    
    // Set a timeout in case connection hangs
    setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, 5000);
  });
};

/**
 * Clean up test data
 */
const cleanupTestData = () => {
  // Close all socket connections
  Object.values(testData.sockets).forEach(socket => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });
  
  // Reset test data
  testData.users = [];
  testData.messages = [];
  testData.tokens = {};
  testData.sockets = {};
};

// Export test utilities
module.exports = {
  app,
  server,
  TEST_SERVER_URL,
  TEST_WS_URL,
  testData,
  startTestServer,
  createTestUser,
  createTestSocketConnection,
  cleanupTestData
};