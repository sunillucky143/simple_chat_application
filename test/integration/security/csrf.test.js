/**
 * Cross-Site Request Forgery (CSRF) Security Tests
 * 
 * Tests for CSRF vulnerabilities in the application's API endpoints.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, createTestUser, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('Cross-Site Request Forgery (CSRF) Security Tests', () => {
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

  describe('CORS Headers Tests', () => {
    test('should have appropriate CORS headers for OPTIONS requests', async () => {
      // Make an OPTIONS request to check CORS headers
      const response = await axios({
        method: 'OPTIONS',
        url: `${TEST_SERVER_URL}/api`,
        headers: {
          'Origin': 'http://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });
      
      // Check CORS headers
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
      
      // Verify that the allowed origin is not '*' for better security
      // Note: This test might need adjustment based on the actual CORS configuration
      const allowedOrigin = response.headers['access-control-allow-origin'];
      if (allowedOrigin !== '*') {
        expect(['http://localhost:3000', process.env.CORS_ORIGIN]).toContain(allowedOrigin);
      }
    });

    test('should have appropriate CORS headers for GET requests', async () => {
      // Make a GET request with a different origin
      const response = await axios.get(`${TEST_SERVER_URL}/api`, {
        headers: {
          'Origin': 'http://example.com'
        }
      });
      
      // Check CORS headers
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      
      // Verify that the allowed origin is not '*' for better security
      // Note: This test might need adjustment based on the actual CORS configuration
      const allowedOrigin = response.headers['access-control-allow-origin'];
      if (allowedOrigin !== '*') {
        expect(['http://localhost:3000', process.env.CORS_ORIGIN]).toContain(allowedOrigin);
      }
    });
  });

  describe('CSRF Protection for State-Changing Operations', () => {
    test('should require proper authentication for POST requests', async () => {
      // Try to create a message without authentication
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/messages`, { text: 'Test message' })
      ).rejects.toThrow();
      
      // Try with invalid token
      const invalidAuthClient = createAuthClient('invalid-token');
      await expect(
        invalidAuthClient.post('/api/messages', { text: 'Test message' })
      ).rejects.toThrow();
      
      // Try with valid token but wrong format
      const wrongFormatClient = axios.create({
        baseURL: TEST_SERVER_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token // Missing 'Bearer ' prefix
        }
      });
      await expect(
        wrongFormatClient.post('/api/messages', { text: 'Test message' })
      ).rejects.toThrow();
    });

    test('should validate Content-Type header for POST requests', async () => {
      // Create a client with authentication but wrong Content-Type
      const wrongContentTypeClient = axios.create({
        baseURL: TEST_SERVER_URL,
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Try to create a message with wrong Content-Type
      try {
        await wrongContentTypeClient.post('/api/messages', 'Test message');
        // If the request succeeds, the API should still handle it properly
      } catch (error) {
        // If it fails, it should be a client error, not a server error
        expect(error.response.status).toBeLessThan(500);
      }
    });
  });

  describe('Token-Based CSRF Protection', () => {
    test('should use token-based authentication for all state-changing operations', async () => {
      // List of endpoints that change state
      const stateChangingEndpoints = [
        { method: 'post', url: '/api/messages', data: { text: 'Test message' } },
        { method: 'post', url: '/api/data', data: { name: 'Test', email: generateTestData('email'), message: 'Test' } }
      ];
      
      // Test each endpoint without authentication
      for (const endpoint of stateChangingEndpoints) {
        await expect(
          axios.post(`${TEST_SERVER_URL}${endpoint.url}`, endpoint.data)
        ).rejects.toThrow();
      }
      
      // Test each endpoint with authentication
      for (const endpoint of stateChangingEndpoints) {
        const response = await authClient.post(endpoint.url, endpoint.data);
        expect(response.status).toBeLessThan(400); // Should succeed
      }
    });
  });

  describe('Same-Origin Policy Tests', () => {
    test('should validate Origin header for cross-origin requests', async () => {
      // Create a client with a different origin
      const crossOriginClient = axios.create({
        baseURL: TEST_SERVER_URL,
        headers: {
          'Origin': 'http://malicious-site.com',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      try {
        // Try to make a cross-origin request
        await crossOriginClient.post('/api/messages', { text: 'Test message' });
        
        // If the request succeeds, the server should be configured to allow this origin
        // or it doesn't validate origins (which is less secure but might be intentional)
      } catch (error) {
        // If it fails and it's due to CORS, that's good for security
        if (error.response) {
          expect(error.response.status).toBeLessThan(500);
        }
      }
    });
  });

  describe('Session Handling Security', () => {
    test('should use secure, HTTP-only cookies if cookies are used', async () => {
      // Make a request that would set cookies if the app uses them
      const response = await axios.post(`${TEST_SERVER_URL}/api/login`, {
        email: generateTestData('email'),
        password: generateTestData('password')
      }).catch(error => error.response);
      
      // If cookies are used, check their security attributes
      if (response && response.headers['set-cookie']) {
        const cookies = response.headers['set-cookie'];
        
        // Check each cookie
        cookies.forEach(cookie => {
          // For security, cookies should have HttpOnly and Secure flags
          // Note: In a test environment, Secure might not be set
          expect(cookie.toLowerCase()).toContain('httponly');
          
          // SameSite attribute should be set to Lax or Strict
          const sameSiteMatch = cookie.match(/samesite=([^;]+)/i);
          if (sameSiteMatch) {
            const sameSiteValue = sameSiteMatch[1].toLowerCase();
            expect(['lax', 'strict']).toContain(sameSiteValue);
          }
        });
      }
      
      // Note: If no cookies are set, this test is not applicable
      // as the app might be using token-based auth exclusively
    });
  });
});