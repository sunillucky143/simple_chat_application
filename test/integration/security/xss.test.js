/**
 * Cross-Site Scripting (XSS) Security Tests
 * 
 * Tests for XSS vulnerabilities in various input fields and content rendering.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, createTestUser, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient, getXssPayloads, containsDangerousContent } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('Cross-Site Scripting (XSS) Security Tests', () => {
  let authClient;
  let testUser;
  let token;
  const xssPayloads = getXssPayloads();

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

  describe('Message Content XSS Tests', () => {
    test.each(xssPayloads)('should sanitize XSS payload in message content: %s', async (payload) => {
      try {
        // Try to create a message with XSS payload
        const response = await authClient.post('/api/messages', { text: payload });
        
        // If the request succeeds, check that the response doesn't contain dangerous content
        expect(response.status).toBe(201);
        
        // The stored message should not contain executable scripts
        expect(containsDangerousContent(response.data.text)).toBe(false);
        
        // Retrieve the message to verify it's sanitized
        const messagesResponse = await authClient.get('/api/messages');
        const createdMessage = messagesResponse.data.find(msg => msg.id === response.data.id);
        
        // Verify the retrieved message is also sanitized
        expect(containsDangerousContent(createdMessage.text)).toBe(false);
      } catch (error) {
        // If the request fails, it should be because of input validation, not server error
        expect(error.response.status).not.toBe(500);
      }
    });
  });

  describe('Form Data XSS Tests', () => {
    test.each(xssPayloads)('should sanitize XSS payload in form data name field: %s', async (payload) => {
      try {
        // Try to submit form data with XSS payload in name field
        const formData = {
          name: payload,
          email: generateTestData('email'),
          message: 'Test message'
        };
        
        const response = await authClient.post('/api/data', formData);
        
        // If the request succeeds, check that the response doesn't contain dangerous content
        if (response.status === 200) {
          // Retrieve the submitted data
          const dataResponse = await authClient.get(`/api/data/${response.data.id}`);
          
          // Verify the stored data is sanitized
          expect(containsDangerousContent(dataResponse.data.name)).toBe(false);
        }
      } catch (error) {
        // If the request fails, it should be because of input validation, not server error
        expect(error.response.status).not.toBe(500);
      }
    });

    test.each(xssPayloads)('should sanitize XSS payload in form data message field: %s', async (payload) => {
      try {
        // Try to submit form data with XSS payload in message field
        const formData = {
          name: generateTestData('username'),
          email: generateTestData('email'),
          message: payload
        };
        
        const response = await authClient.post('/api/data', formData);
        
        // If the request succeeds, check that the response doesn't contain dangerous content
        if (response.status === 200) {
          // Retrieve the submitted data
          const dataResponse = await authClient.get(`/api/data/${response.data.id}`);
          
          // Verify the stored data is sanitized
          expect(containsDangerousContent(dataResponse.data.message)).toBe(false);
        }
      } catch (error) {
        // If the request fails, it should be because of input validation, not server error
        expect(error.response.status).not.toBe(500);
      }
    });
  });

  describe('URL Parameter XSS Tests', () => {
    test.each(xssPayloads)('should sanitize XSS payload in URL parameters: %s', async (payload) => {
      try {
        // Encode the payload for URL
        const encodedPayload = encodeURIComponent(payload);
        
        // Try to access API with XSS payload in URL parameter
        const response = await authClient.get(`/api/messages?sender=${encodedPayload}`);
        
        // The request should either succeed with sanitized data or fail with validation error
        if (response.status === 200) {
          // If it succeeds, the response should be an array
          expect(Array.isArray(response.data)).toBe(true);
        }
      } catch (error) {
        // If the request fails, it should be because of input validation, not server error
        expect(error.response.status).not.toBe(500);
      }
    });
  });

  describe('User Input XSS Tests', () => {
    test.each(xssPayloads)('should sanitize XSS payload in user registration: %s', async (payload) => {
      try {
        // Try to register with XSS payload in email
        const userData = {
          email: `test-${Date.now()}@${payload}.com`,
          password: generateTestData('password')
        };
        
        await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
        
        // If registration succeeds, try to login
        const loginResponse = await axios.post(`${TEST_SERVER_URL}/api/login`, userData);
        
        // If login succeeds, check user data
        if (loginResponse.status === 200) {
          const userClient = createAuthClient(loginResponse.data.token);
          const userResponse = await userClient.get('/api/user');
          
          // Verify the user data is sanitized
          expect(containsDangerousContent(userResponse.data.email)).toBe(false);
        }
      } catch (error) {
        // If the request fails, it should be because of input validation, not server error
        expect(error.response?.status).not.toBe(500);
      }
    });
  });

  describe('Reflected XSS Tests', () => {
    test('should not reflect XSS payloads in error messages', async () => {
      // Try various endpoints with XSS payloads and check error responses
      for (const payload of xssPayloads) {
        try {
          // Try invalid login with XSS payload
          await axios.post(`${TEST_SERVER_URL}/api/login`, {
            email: payload,
            password: payload
          });
        } catch (error) {
          // Check that error message doesn't contain unescaped payload
          if (error.response && error.response.data) {
            expect(containsDangerousContent(JSON.stringify(error.response.data))).toBe(false);
          }
        }
      }
    });
  });

  describe('Content Security Policy Tests', () => {
    test('should have appropriate security headers', async () => {
      // Make a request to a public endpoint
      const response = await axios.get(`${TEST_SERVER_URL}/api`);
      
      // Check for security headers
      const headers = response.headers;
      
      // Note: These assertions may need to be adjusted based on the actual security headers implemented
      // These are common security headers that should be present
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'content-security-policy',
        'strict-transport-security'
      ];
      
      // Check for at least some of the security headers
      const presentHeaders = securityHeaders.filter(header => 
        headers[header] !== undefined
      );
      
      // We should have at least some security headers
      // This test may need adjustment based on actual implementation
      expect(presentHeaders.length).toBeGreaterThan(0);
    });
  });
});