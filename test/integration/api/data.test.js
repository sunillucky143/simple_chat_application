/**
 * Data API Integration Tests
 * 
 * Tests the data submission and retrieval API endpoints.
 */

const axios = require('axios');
const { startTestServer, TEST_SERVER_URL, createTestUser, cleanupTestData } = require('../setup');
const { generateTestData, createAuthClient } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(10000);

describe('Data API Integration Tests', () => {
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

  describe('Data Submission', () => {
    test('should successfully submit form data', async () => {
      // Create form data
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: generateTestData('message'),
        preferences: {
          notifications: true,
          theme: 'dark'
        }
      };
      
      // Submit form data
      const response = await authClient.post('/api/data', formData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('success', true);
    });

    test('should reject data submission without authentication', async () => {
      // Create form data
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: generateTestData('message')
      };
      
      // Try to submit form data without authentication
      await expect(
        axios.post(`${TEST_SERVER_URL}/api/data`, formData)
      ).rejects.toThrow();
    });

    test('should reject data submission with invalid email format', async () => {
      // Create form data with invalid email
      const formData = {
        name: generateTestData('username'),
        email: 'invalid-email',
        message: generateTestData('message')
      };
      
      // Try to submit form data with invalid email
      await expect(
        authClient.post('/api/data', formData)
      ).rejects.toThrow();
    });

    test('should handle large data submissions', async () => {
      // Create large form data
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: 'A'.repeat(5000), // 5KB message
        preferences: {
          notifications: true,
          theme: 'dark',
          language: 'en',
          fontSize: 16,
          colorScheme: 'default',
          accessibility: {
            highContrast: false,
            largeText: true,
            screenReader: false
          },
          advanced: {
            developer: true,
            experimental: false,
            betaFeatures: ['feature1', 'feature2', 'feature3']
          }
        }
      };
      
      // Submit large form data
      const response = await authClient.post('/api/data', formData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('Data Retrieval', () => {
    test('should retrieve submitted data', async () => {
      // Create and submit form data
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: generateTestData('message')
      };
      
      await authClient.post('/api/data', formData);
      
      // Retrieve data
      const response = await authClient.get('/api/data');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Check if submitted data is in the response
      const foundData = response.data.some(item => 
        item.email === formData.email && 
        item.name === formData.name
      );
      
      expect(foundData).toBe(true);
    });

    test('should retrieve specific data by ID', async () => {
      // Create and submit form data
      const formData = {
        name: generateTestData('username'),
        email: generateTestData('email'),
        message: generateTestData('message')
      };
      
      const submitResponse = await authClient.post('/api/data', formData);
      const dataId = submitResponse.data.id;
      
      // Retrieve specific data by ID
      const response = await authClient.get(`/api/data/${dataId}`);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', dataId);
      expect(response.data).toHaveProperty('name', formData.name);
      expect(response.data).toHaveProperty('email', formData.email);
    });

    test('should reject data retrieval without authentication', async () => {
      // Try to retrieve data without authentication
      await expect(
        axios.get(`${TEST_SERVER_URL}/api/data`)
      ).rejects.toThrow();
    });

    test('should handle non-existent data ID', async () => {
      // Try to retrieve data with non-existent ID
      await expect(
        authClient.get('/api/data/non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('Data Integration', () => {
    test('should submit and then retrieve the same data', async () => {
      // Create unique form data
      const uniqueName = `Unique name ${Date.now()}`;
      const formData = {
        name: uniqueName,
        email: generateTestData('email'),
        message: generateTestData('message')
      };
      
      // Submit form data
      const submitResponse = await authClient.post('/api/data', formData);
      const dataId = submitResponse.data.id;
      
      // Retrieve all data
      const getAllResponse = await authClient.get('/api/data');
      
      // Find the submitted data in the retrieved data
      const foundData = getAllResponse.data.find(item => item.id === dataId);
      
      // Assertions
      expect(foundData).toBeDefined();
      expect(foundData.name).toBe(uniqueName);
      
      // Retrieve specific data by ID
      const getByIdResponse = await authClient.get(`/api/data/${dataId}`);
      
      // Assertions
      expect(getByIdResponse.data).toHaveProperty('name', uniqueName);
    });
  });
});