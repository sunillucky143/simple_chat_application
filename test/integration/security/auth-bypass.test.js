/**
 * Authentication Bypass Security Tests
 * 
 * Tests for authentication bypass vulnerabilities including token manipulation,
 * session handling, and unauthorized access attempts.
 */

const axios = require('axios');
const crypto = require('crypto');
const { startTestServer, TEST_SERVER_URL, createTestUser, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('Authentication Bypass Security Tests', () => {
  let validToken;
  let testUser;

  // Setup before all tests
  beforeAll(async () => {
    await startTestServer();
    
    // Create a test user and get a valid token
    const userData = await createTestUser();
    testUser = userData.user;
    validToken = userData.token;
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardown();
  });

  describe('Token Manipulation Tests', () => {
    test('should reject access with modified token header', async () => {
      // Get token parts
      const [header, payload, signature] = validToken.split('.');
      
      // Decode header
      const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString());
      
      // Modify algorithm to 'none'
      decodedHeader.alg = 'none';
      
      // Encode modified header
      const modifiedHeader = Buffer.from(JSON.stringify(decodedHeader)).toString('base64').replace(/=/g, '');
      
      // Create modified token
      const modifiedToken = `${modifiedHeader}.${payload}.${signature}`;
      
      // Create client with modified token
      const authClient = createAuthClient(modifiedToken);
      
      // Try to access protected route with modified token
      await expect(
        authClient.get('/api/user')
      ).rejects.toThrow();
    });

    test('should reject access with modified token payload', async () => {
      // Get token parts
      const [header, payload, signature] = validToken.split('.');
      
      // Decode payload
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      // Modify user ID to attempt privilege escalation
      decodedPayload.userId = 'admin';
      
      // Encode modified payload
      const modifiedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64').replace(/=/g, '');
      
      // Create modified token
      const modifiedToken = `${header}.${modifiedPayload}.${signature}`;
      
      // Create client with modified token
      const authClient = createAuthClient(modifiedToken);
      
      // Try to access protected route with modified token
      await expect(
        authClient.get('/api/user')
      ).rejects.toThrow();
    });

    test('should reject access with invalid signature', async () => {
      // Get token parts
      const [header, payload] = validToken.split('.');
      
      // Create invalid signature
      const invalidSignature = crypto
        .createHash('sha256')
        .update('invalid')
        .digest('base64')
        .replace(/=/g, '');
      
      // Create token with invalid signature
      const invalidToken = `${header}.${payload}.${invalidSignature}`;
      
      // Create client with invalid token
      const authClient = createAuthClient(invalidToken);
      
      // Try to access protected route with invalid token
      await expect(
        authClient.get('/api/user')
      ).rejects.toThrow();
    });

    test('should reject access with empty signature', async () => {
      // Get token parts
      const [header, payload] = validToken.split('.');
      
      // Create token with empty signature
      const invalidToken = `${header}.${payload}.`;
      
      // Create client with invalid token
      const authClient = createAuthClient(invalidToken);
      
      // Try to access protected route with invalid token
      await expect(
        authClient.get('/api/user')
      ).rejects.toThrow();
    });
  });

  describe('Authorization Header Manipulation Tests', () => {
    test('should reject access with malformed Authorization header', async () => {
      // Create client with malformed Authorization header
      const client = axios.create({
        baseURL: TEST_SERVER_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': validToken // Missing 'Bearer ' prefix
        }
      });
      
      // Try to access protected route
      await expect(
        client.get('/api/user')
      ).rejects.toThrow();
    });

    test('should reject access with Basic authentication instead of Bearer', async () => {
      // Create client with Basic auth instead of Bearer
      const client = axios.create({
        baseURL: TEST_SERVER_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${validToken}`
        }
      });
      
      // Try to access protected route
      await expect(
        client.get('/api/user')
      ).rejects.toThrow();
    });
  });

  describe('Session Handling Tests', () => {
    test('should maintain session across multiple requests with same token', async () => {
      // Create authenticated client
      const authClient = createAuthClient(validToken);
      
      // Make first request
      const response1 = await authClient.get('/api/user');
      expect(response1.status).toBe(200);
      
      // Make second request
      const response2 = await authClient.get('/api/user');
      expect(response2.status).toBe(200);
      
      // Both responses should have the same user data
      expect(response1.data).toEqual(response2.data);
    });
  });

  describe('Protected Route Access Tests', () => {
    test('should protect all sensitive routes from unauthenticated access', async () => {
      // List of protected routes to test
      const protectedRoutes = [
        '/api/user',
        '/api/messages',
        '/api/data'
      ];
      
      // Try to access each protected route without authentication
      for (const route of protectedRoutes) {
        await expect(
          axios.get(`${TEST_SERVER_URL}${route}`)
        ).rejects.toThrow();
      }
    });

    test('should allow access to public routes without authentication', async () => {
      // List of public routes to test
      const publicRoutes = [
        '/api',
        '/health'
      ];
      
      // Try to access each public route without authentication
      for (const route of publicRoutes) {
        const response = await axios.get(`${TEST_SERVER_URL}${route}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Authentication Brute Force Protection', () => {
    test('should handle multiple failed login attempts', async () => {
      // Generate test user data
      const email = generateTestData('email');
      const password = generateTestData('password');
      
      // Create a new user
      await createTestUser({ email, password });
      
      // Attempt multiple failed logins
      const attempts = 5;
      for (let i = 0; i < attempts; i++) {
        await expect(
          axios.post(`${TEST_SERVER_URL}/api/login`, {
            email,
            password: 'wrong-password'
          })
        ).rejects.toThrow();
      }
      
      // Verify that legitimate login still works after failed attempts
      const loginResponse = await axios.post(`${TEST_SERVER_URL}/api/login`, {
        email,
        password
      });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('token');
    });
  });
});