/**
 * Messages API Integration Tests
 * 
 * Tests the message API endpoints for retrieving and creating messages.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, createTestUser, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('Messages API Integration Tests', () => {
  let authClient;
  let testUser;
  let token;

  // Setup before all tests
  beforeAll(async () => {
    await startTestServer();
  });

  // Setup before each test
  beforeEach(async () => {
    // Create a test user and get authentication token
    const userData = await createTestUser();
    testUser = userData.user;
    token = userData.token;
    authClient = createAuthClient(token);
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardown();
  });

  // Cleanup after each test
  afterEach(() => {
    cleanupTestData();
  });

  describe('Message Retrieval', () => {
    test('should retrieve message history', async () => {
      // Get message history
      const response = await authClient.get('/api/messages');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should reject message history request without authentication', async () => {
      // Try to get message history without authentication
      await expect(
        axios.get(`${TEST_SERVER_URL}/api/messages`)
      ).rejects.toThrow();
    });
  });

  describe('Message Creation', () => {
    test('should create a new message', async () => {
      // Create message data
      const messageData = {
        text: generateTestData('message')
      };
      
      // Send message creation request
      const response = await authClient.post('/api/messages', messageData);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('text', messageData.text);
      expect(response.data).toHaveProperty('sender');
      expect(response.data).toHaveProperty('timestamp');
    });

    test('should reject message creation without text', async () => {
      // Try to create message without text
      await expect(
        authClient.post('/api/messages', {})
      ).rejects.toThrow();
    });

    test('should reject message creation with empty text', async () => {
      // Try to create message with empty text
      await expect(
        authClient.post('/api/messages', { text: '' })
      ).rejects.toThrow();
    });

    test('should reject message creation without authentication', async () => {
      // Try to create message without authentication
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/messages`, { text: generateTestData('message') })
      ).rejects.toThrow();
    });
  });

  describe('Message Filtering', () => {
    test('should retrieve messages with pagination', async () => {
      // Create multiple messages
      for (let i = 0; i < 5; i++) {
        await authClient.post('/api/messages', { text: generateTestData('message') });
      }
      
      // Get messages with pagination
      const response = await authClient.get('/api/messages?limit=3&page=1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(3);
    });

    test('should retrieve messages by sender', async () => {
      // Create a message
      const messageResponse = await authClient.post('/api/messages', { text: generateTestData('message') });
      const senderId = messageResponse.data.sender;
      
      // Get messages by sender
      const response = await authClient.get(`/api/messages?sender=${senderId}`);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // All messages should be from the specified sender
      response.data.forEach(message => {
        expect(message.sender).toBe(senderId);
      });
    });
  });

  describe('Message Integration', () => {
    test('should create and then retrieve the same message', async () => {
      // Create a unique message
      const uniqueText = `Unique test message ${Date.now()}`;
      const createResponse = await authClient.post('/api/messages', { text: uniqueText });
      const createdMessageId = createResponse.data.id;
      
      // Get all messages
      const getResponse = await authClient.get('/api/messages');
      
      // Find the created message in the retrieved messages
      const foundMessage = getResponse.data.find(msg => msg.id === createdMessageId);
      
      // Assertions
      expect(foundMessage).toBeDefined();
      expect(foundMessage.text).toBe(uniqueText);
    });
  });
});