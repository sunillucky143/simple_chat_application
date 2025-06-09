/**
 * SQL Injection Security Tests
 * 
 * Tests for SQL injection vulnerabilities in various input fields and query parameters.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, createTestUser, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient, getSqlInjectionPayloads } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('SQL Injection Security Tests', () => {
  let authClient;
  let testUser;
  let token;
  const sqlInjectionPayloads = getSqlInjectionPayloads();

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

  describe('Authentication SQL Injection Tests', () => {
    test.each(sqlInjectionPayloads)('should prevent SQL injection in login email: %s', async (payload) => {
      try {
        // Try to login with SQL injection payload in email
        await axios.post(`${TEST_SERVER_URL}/api/login`, {
          email: payload,
          password: 'password123'
        });
        
        // If we get here, the request didn't throw an error
        // This is unexpected for invalid credentials, so fail the test
        fail('Login should have failed with invalid credentials');
      } catch (error) {
        // Login should fail with 401 Unauthorized, not 500 Server Error
        expect(error.response.status).not.toBe(500);
        
        // The error should be about invalid credentials, not a database error
        expect(error.response.data).toHaveProperty('message');
        expect(error.response.data.message.toLowerCase()).not.toContain('sql');
        expect(error.response.data.message.toLowerCase()).not.toContain('database');
        expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
      }
    });

    test.each(sqlInjectionPayloads)('should prevent SQL injection in login password: %s', async (payload) => {
      // Create a test user with known credentials
      const email = generateTestData('email');
      const password = generateTestData('password');
      await createTestUser({ email, password });
      
      try {
        // Try to login with valid email but SQL injection payload in password
        await axios.post(`${TEST_SERVER_URL}/api/login`, {
          email,
          password: payload
        });
        
        // If we get here, the request didn't throw an error
        // This is unexpected for invalid credentials, so fail the test
        fail('Login should have failed with invalid credentials');
      } catch (error) {
        // Login should fail with 401 Unauthorized, not 500 Server Error
        expect(error.response.status).not.toBe(500);
        
        // The error should be about invalid credentials, not a database error
        expect(error.response.data).toHaveProperty('message');
        expect(error.response.data.message.toLowerCase()).not.toContain('sql');
        expect(error.response.data.message.toLowerCase()).not.toContain('database');
        expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
      }
    });

    test.each(sqlInjectionPayloads)('should prevent SQL injection in registration email: %s', async (payload) => {
      try {
        // Try to register with SQL injection payload in email
        await axios.post(`${TEST_SERVER_URL}/api/signup`, {
          email: payload,
          password: 'Password123!'
        });
        
        // If registration succeeds, it should not expose database errors
        // This might pass or fail depending on email validation
      } catch (error) {
        // Registration should fail with validation error, not 500 Server Error
        expect(error.response.status).not.toBe(500);
        
        // The error should not reveal database details
        expect(error.response.data).toHaveProperty('message');
        expect(error.response.data.message.toLowerCase()).not.toContain('sql');
        expect(error.response.data.message.toLowerCase()).not.toContain('database');
        expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
      }
    });
  });

  describe('Query Parameter SQL Injection Tests', () => {
    test.each(sqlInjectionPayloads)('should prevent SQL injection in message query parameters: %s', async (payload) => {
      try {
        // Try to query messages with SQL injection payload
        const response = await authClient.get(`/api/messages?sender=${encodeURIComponent(payload)}`);
        
        // If the request succeeds, it should return a valid response
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        // If the request fails, it should not be due to a database error
        expect(error.response.status).not.toBe(500);
        
        // The error should not reveal database details
        if (error.response.data && error.response.data.message) {
          expect(error.response.data.message.toLowerCase()).not.toContain('sql');
          expect(error.response.data.message.toLowerCase()).not.toContain('database');
          expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
        }
      }
    });

    test.each(sqlInjectionPayloads)('should prevent SQL injection in data query parameters: %s', async (payload) => {
      try {
        // Try to query data with SQL injection payload
        const response = await authClient.get(`/api/data?name=${encodeURIComponent(payload)}`);
        
        // If the request succeeds, it should return a valid response
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        // If the request fails, it should not be due to a database error
        expect(error.response.status).not.toBe(500);
        
        // The error should not reveal database details
        if (error.response.data && error.response.data.message) {
          expect(error.response.data.message.toLowerCase()).not.toContain('sql');
          expect(error.response.data.message.toLowerCase()).not.toContain('database');
          expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
        }
      }
    });
  });

  describe('Message Content SQL Injection Tests', () => {
    test.each(sqlInjectionPayloads)('should handle SQL injection attempts in message content: %s', async (payload) => {
      try {
        // Try to create a message with SQL injection payload
        const response = await authClient.post('/api/messages', { text: payload });
        
        // If the request succeeds, the message should be stored safely
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('text', payload); // The text should be stored as-is, not executed
        
        // Retrieve the message to verify it was stored correctly
        const messagesResponse = await authClient.get('/api/messages');
        const createdMessage = messagesResponse.data.find(msg => msg.id === response.data.id);
        
        // Verify the message was stored correctly
        expect(createdMessage).toBeDefined();
        expect(createdMessage.text).toBe(payload);
      } catch (error) {
        // If the request fails, it should not be due to a database error
        expect(error.response.status).not.toBe(500);
        
        // The error should not reveal database details
        if (error.response.data && error.response.data.message) {
          expect(error.response.data.message.toLowerCase()).not.toContain('sql');
          expect(error.response.data.message.toLowerCase()).not.toContain('database');
          expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
        }
      }
    });
  });

  describe('Form Data SQL Injection Tests', () => {
    test.each(sqlInjectionPayloads)('should handle SQL injection attempts in form data: %s', async (payload) => {
      try {
        // Try to submit form data with SQL injection payload in multiple fields
        const formData = {
          name: payload,
          email: generateTestData('email'),
          message: payload
        };
        
        const response = await authClient.post('/api/data', formData);
        
        // If the request succeeds, the data should be stored safely
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        
        // Retrieve the data to verify it was stored correctly
        const dataResponse = await authClient.get(`/api/data/${response.data.id}`);
        
        // Verify the data was stored correctly
        expect(dataResponse.data).toHaveProperty('name', payload);
        expect(dataResponse.data).toHaveProperty('message', payload);
      } catch (error) {
        // If the request fails, it should not be due to a database error
        expect(error.response.status).not.toBe(500);
        
        // The error should not reveal database details
        if (error.response.data && error.response.data.message) {
          expect(error.response.data.message.toLowerCase()).not.toContain('sql');
          expect(error.response.data.message.toLowerCase()).not.toContain('database');
          expect(error.response.data.message.toLowerCase()).not.toContain('syntax');
        }
      }
    });
  });

  describe('Error Handling for SQL Injection', () => {
    test('should not expose database error details', async () => {
      // List of endpoints to test
      const endpoints = [
        { method: 'post', url: '/api/login', data: { email: "' OR '1'='1", password: "' OR '1'='1" } },
        { method: 'post', url: '/api/signup', data: { email: "test@example.com'; DROP TABLE users; --", password: 'password123' } },
        { method: 'get', url: `/api/messages?sender=' OR '1'='1` },
        { method: 'get', url: `/api/data?name=' OR '1'='1` }
      ];
      
      // Test each endpoint
      for (const endpoint of endpoints) {
        try {
          if (endpoint.method === 'get') {
            await authClient.get(endpoint.url);
          } else {
            await axios.post(`${TEST_SERVER_URL}${endpoint.url}`, endpoint.data);
          }
        } catch (error) {
          // Check that error responses don't contain SQL-related information
          if (error.response && error.response.data) {
            const errorJson = JSON.stringify(error.response.data).toLowerCase();
            expect(errorJson).not.toContain('sql');
            expect(errorJson).not.toContain('database error');
            expect(errorJson).not.toContain('syntax');
            expect(errorJson).not.toContain('query');
            expect(errorJson).not.toContain('sqlite');
            expect(errorJson).not.toContain('mysql');
            expect(errorJson).not.toContain('postgres');
            expect(errorJson).not.toContain('mongodb');
          }
        }
      }
    });
  });
});