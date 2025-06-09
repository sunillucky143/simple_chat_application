/**
 * End-to-End User Flow Tests
 * 
 * Tests complete user journeys including signup, login, and profile management.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(15000);

describe('End-to-End User Flow Tests', () => {
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

  describe('Complete User Journey', () => {
    test('should complete full signup, login, and profile access flow', async () => {
      // Generate test user data
      const email = generateTestData('email');
      const password = generateTestData('password');
      
      // Step 1: Signup
      const signupResponse = await axios.post(`${TEST_SERVER_URL}/api/signup`, {
        email,
        password
      });
      
      // Verify signup response
      expect(signupResponse.status).toBe(200);
      expect(signupResponse.data).toHaveProperty('user');
      expect(signupResponse.data).toHaveProperty('token');
      expect(signupResponse.data.user).toHaveProperty('email', email);
      
      // Store token from signup
      const signupToken = signupResponse.data.token;
      
      // Step 2: Access profile with signup token
      const signupAuthClient = createAuthClient(signupToken);
      const profileResponse1 = await signupAuthClient.get('/api/user');
      
      // Verify profile response
      expect(profileResponse1.status).toBe(200);
      expect(profileResponse1.data).toHaveProperty('email', email);
      
      // Step 3: Logout (simulated by discarding token)
      
      // Step 4: Login
      const loginResponse = await axios.post(`${TEST_SERVER_URL}/api/login`, {
        email,
        password
      });
      
      // Verify login response
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('user');
      expect(loginResponse.data).toHaveProperty('token');
      expect(loginResponse.data.user).toHaveProperty('email', email);
      
      // Store token from login
      const loginToken = loginResponse.data.token;
      
      // Step 5: Access profile with login token
      const loginAuthClient = createAuthClient(loginToken);
      const profileResponse2 = await loginAuthClient.get('/api/user');
      
      // Verify profile response
      expect(profileResponse2.status).toBe(200);
      expect(profileResponse2.data).toHaveProperty('email', email);
      
      // Verify both profile responses match
      expect(profileResponse1.data).toEqual(profileResponse2.data);
    });
  });

  describe('Form Submission Flow', () => {
    test('should complete form submission and retrieval flow', async () => {
      // Generate test user data and create user
      const email = generateTestData('email');
      const password = generateTestData('password');
      
      const signupResponse = await axios.post(`${TEST_SERVER_URL}/api/signup`, {
        email,
        password
      });
      
      const token = signupResponse.data.token;
      const authClient = createAuthClient(token);
      
      // Step 1: Submit form data
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: generateTestData('message'),
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };
      
      const submitResponse = await authClient.post('/api/data', formData);
      
      // Verify submission response
      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data).toHaveProperty('id');
      expect(submitResponse.data).toHaveProperty('success', true);
      
      const dataId = submitResponse.data.id;
      
      // Step 2: Retrieve all form data
      const allDataResponse = await authClient.get('/api/data');
      
      // Verify all data response
      expect(allDataResponse.status).toBe(200);
      expect(Array.isArray(allDataResponse.data)).toBe(true);
      
      // Find submitted data in response
      const foundData = allDataResponse.data.find(item => item.id === dataId);
      expect(foundData).toBeDefined();
      
      // Step 3: Retrieve specific form data
      const specificDataResponse = await authClient.get(`/api/data/${dataId}`);
      
      // Verify specific data response
      expect(specificDataResponse.status).toBe(200);
      expect(specificDataResponse.data).toHaveProperty('id', dataId);
      expect(specificDataResponse.data).toHaveProperty('name', formData.name);
      expect(specificDataResponse.data).toHaveProperty('email', formData.email);
      expect(specificDataResponse.data).toHaveProperty('message', formData.message);
      
      // Verify preferences were stored correctly
      expect(specificDataResponse.data).toHaveProperty('preferences');
      expect(specificDataResponse.data.preferences).toHaveProperty('theme', formData.preferences.theme);
      expect(specificDataResponse.data.preferences).toHaveProperty('notifications', formData.preferences.notifications);
    });
  });

  describe('Error Recovery Flow', () => {
    test('should handle and recover from authentication errors', async () => {
      // Generate test user data
      const email = generateTestData('email');
      const password = generateTestData('password');
      
      // Step 1: Try to login with non-existent user
      try {
        await axios.post(`${TEST_SERVER_URL}/api/login`, {
          email,
          password
        });
        
        // If we get here, login succeeded unexpectedly
        fail('Login should have failed for non-existent user');
      } catch (error) {
        // Verify error response
        expect(error.response.status).toBe(401);
      }
      
      // Step 2: Signup
      const signupResponse = await axios.post(`${TEST_SERVER_URL}/api/signup`, {
        email,
        password
      });
      
      // Verify signup response
      expect(signupResponse.status).toBe(200);
      expect(signupResponse.data).toHaveProperty('token');
      
      // Step 3: Try to access protected route with invalid token
      const invalidAuthClient = createAuthClient('invalid-token');
      
      try {
        await invalidAuthClient.get('/api/user');
        
        // If we get here, access succeeded unexpectedly
        fail('Access should have failed with invalid token');
      } catch (error) {
        // Verify error response
        expect(error.response.status).toBe(401);
      }
      
      // Step 4: Access protected route with valid token
      const validAuthClient = createAuthClient(signupResponse.data.token);
      const profileResponse = await validAuthClient.get('/api/user');
      
      // Verify profile response
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.data).toHaveProperty('email', email);
    });
  });

  describe('Multiple Device Flow', () => {
    test('should support user accessing from multiple clients', async () => {
      // Generate test user data
      const email = generateTestData('email');
      const password = generateTestData('password');
      
      // Step 1: Signup
      const signupResponse = await axios.post(`${TEST_SERVER_URL}/api/signup`, {
        email,
        password
      });
      
      const token = signupResponse.data.token;
      
      // Step 2: Create multiple auth clients (simulating different devices)
      const client1 = createAuthClient(token);
      const client2 = createAuthClient(token);
      const client3 = createAuthClient(token);
      
      // Step 3: Access profile from all clients
      const profileResponse1 = await client1.get('/api/user');
      const profileResponse2 = await client2.get('/api/user');
      const profileResponse3 = await client3.get('/api/user');
      
      // Verify all profile responses
      expect(profileResponse1.status).toBe(200);
      expect(profileResponse2.status).toBe(200);
      expect(profileResponse3.status).toBe(200);
      
      // Verify all responses contain the same user data
      expect(profileResponse1.data).toEqual(profileResponse2.data);
      expect(profileResponse1.data).toEqual(profileResponse3.data);
      
      // Step 4: Submit form data from one client
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: generateTestData('message')
      };
      
      const submitResponse = await client1.post('/api/data', formData);
      const dataId = submitResponse.data.id;
      
      // Step 5: Retrieve submitted data from another client
      const dataResponse = await client2.get(`/api/data/${dataId}`);
      
      // Verify data response
      expect(dataResponse.status).toBe(200);
      expect(dataResponse.data).toHaveProperty('id', dataId);
      expect(dataResponse.data).toHaveProperty('name', formData.name);
    });
  });
});