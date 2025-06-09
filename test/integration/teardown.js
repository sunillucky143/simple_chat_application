/**
 * Integration Test Teardown
 * 
 * This file contains teardown code that runs after all integration tests.
 * It cleans up resources, closes connections, and resets the test environment.
 */

const { server, cleanupTestData } = require('./setup');

/**
 * Close the test server
 */
const closeTestServer = async () => {
  return new Promise((resolve) => {
    if (server.listening) {
      server.close(() => {
        console.log('Test server closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

/**
 * Perform full test teardown
 */
const teardown = async () => {
  // Clean up test data
  cleanupTestData();
  
  // Close the server
  await closeTestServer();
  
  console.log('Test teardown complete');
};

module.exports = {
  closeTestServer,
  teardown
};