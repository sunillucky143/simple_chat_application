/**
 * Integration Test Helpers
 * 
 * This file contains helper functions for integration tests.
 */

const axios = require('axios');
const { TEST_SERVER_URL, testData } = require('./setup');

/**
 * Create an authenticated API client
 * @param {string} token - Authentication token
 * @returns {Object} Axios instance with authentication headers
 */
const createAuthClient = (token) => {
  return axios.create({
    baseURL: TEST_SERVER_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

/**
 * Generate random test data
 * @param {string} type - Type of data to generate
 * @returns {string|Object} Generated test data
 */
const generateTestData = (type) => {
  const timestamp = Date.now();
  
  switch (type) {
    case 'email':
      return `test-${timestamp}@example.com`;
    case 'username':
      return `testuser-${timestamp}`;
    case 'password':
      return `Password${timestamp}!`;
    case 'message':
      return `Test message ${timestamp}`;
    case 'user':
      return {
        email: `test-${timestamp}@example.com`,
        password: `Password${timestamp}!`
      };
    default:
      return `test-${timestamp}`;
  }
};

/**
 * Wait for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a promise that resolves when a specific socket event is received
 * @param {Object} socket - Socket.io client
 * @param {string} event - Event name to wait for
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves with the event data
 */
const waitForSocketEvent = (socket, event, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for socket event: ${event}`));
    }, timeout);
    
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

/**
 * Generate XSS test payloads
 * @returns {Array} Array of XSS test payloads
 */
const getXssPayloads = () => [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  'javascript:alert("XSS")',
  '<div style="background:url(javascript:alert(\'XSS\'))">',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>'
];

/**
 * Generate SQL injection test payloads
 * @returns {Array} Array of SQL injection test payloads
 */
const getSqlInjectionPayloads = () => [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users; --",
  "' OR '1'='1' --",
  "admin'--",
  "1'; SELECT * FROM users WHERE 't'='t"
];

/**
 * Check if a string contains potentially dangerous content
 * @param {string} content - Content to check
 * @returns {boolean} True if content contains dangerous elements
 */
const containsDangerousContent = (content) => {
  if (typeof content !== 'string') return false;
  
  // Check for script tags
  if (/<script\b[^>]*>(.*?)<\/script>/i.test(content)) return true;
  
  // Check for event handlers
  if (/\bon\w+\s*=/i.test(content)) return true;
  
  // Check for javascript: protocol
  if (/javascript:/i.test(content)) return true;
  
  // Check for data: protocol
  if (/data:text\/html/i.test(content)) return true;
  
  return false;
};

module.exports = {
  createAuthClient,
  generateTestData,
  wait,
  waitForSocketEvent,
  getXssPayloads,
  getSqlInjectionPayloads,
  containsDangerousContent
};