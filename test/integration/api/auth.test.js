/**
 * Authentication API Integration Tests
 * 
 * Tests the authentication flow including signup, login, and token validation.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('Authentication API Integration Tests', () => {
  // Setup before all tests
  beforeAll(async () => {
    await startTestServer();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardown();
  });

  // Cleanup after each test
  afterEach(() => {
    cleanupTestData();
  });

  describe('User Registration', () => {
    test('should successfully register a new user', async () => {
      // Generate test user data
      const userData = generateTestData('user');
      
      // Send signup request
      const response = await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('token');
      expect(response.data.user).toHaveProperty('email', userData.email);
      expect(response.data.user).not.toHaveProperty('password');
    });

    test('should reject registration with invalid email format', async () => {
      // Generate test user data with invalid email
      const userData = {
        email: 'invalid-email',
        password: generateTestData('password')
      };
      
      // Send signup request and expect error
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/signup`, userData)
      ).rejects.toThrow();
    });

    test('should reject registration with weak password', async () => {
      // Generate test user data with weak password
      const userData = {
        email: generateTestData('email'),
        password: '123'
      };
      
      // Send signup request and expect error
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/signup`, userData)
      ).rejects.toThrow();
    });

    test('should reject duplicate email registration', async () => {
      // Generate test user data
      const userData = generateTestData('user');
      
      // Register first user
      await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
      
      // Try to register with same email and expect error
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/signup`, userData)
      ).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    test('should successfully login with valid credentials', async () => {
      // Generate and register test user
      const userData = generateTestData('user');
      await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
      
      // Login with same credentials
      const loginResponse = await axios.post(`${TEST_SERVER_URL}/api/login`, {
        email: userData.email,
        password: userData.password
      });
      
      // Assertions
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('user');
      expect(loginResponse.data).toHaveProperty('token');
      expect(loginResponse.data.user).toHaveProperty('email', userData.email);
    });

    test('should reject login with invalid email', async () => {
      // Generate and register test user
      const userData = generateTestData('user');
      await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
      
      // Try to login with wrong email
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/login`, {
          email: 'wrong-' + userData.email,
          password: userData.password
        })
      ).rejects.toThrow();
    });

    test('should reject login with invalid password', async () => {
      // Generate and register test user
      const userData = generateTestData('user');
      await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
      
      // Try to login with wrong password
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/login`, {
          email: userData.email,
          password: 'wrong-' + userData.password
        })
      ).rejects.toThrow();
    });
  });

  describe('Token Authentication', () => {
    test('should access protected route with valid token', async () => {
      // Generate and register test user
      const userData = generateTestData('user');
      const signupResponse = await axios.post(`${TEST_SERVER_URL}/api/signup`, userData);
      const { token } = signupResponse.data;
      
      // Create authenticated client
      const authClient = createAuthClient(token);
      
      // Access protected route
      const response = await authClient.get('/api/user');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('email', userData.email);
    });

    test('should reject access to protected route without token', async () => {
      // Try to access protected route without token
      await expect(
        axios.get(`${TEST_SERVER_URL}/api/user`)
      ).rejects.toThrow();
    });

    test('should reject access to protected route with invalid token', async () => {
      // Try to access protected route with invalid token
      const authClient = createAuthClient('invalid-token');
      
      await expect(
        authClient.get('/api/user')
      ).rejects.toThrow();
    });

    test('should reject access to protected route with malformed token', async () => {
      // Try to access protected route with malformed token
      const authClient = axios.create({
        baseURL: TEST_SERVER_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'NotBearer token'
        }
      });
      
      await expect(
        authClient.get('/api/user')
      ).rejects.toThrow();
    });
  });
});