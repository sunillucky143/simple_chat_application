const request = require('supertest');
const { app } = require('../server');
const messageService = require('../services/messageService');

// Mock the message service
jest.mock('../services/messageService');

describe('Message Controller', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/messages', () => {
    it('should return all messages', async () => {
      // Mock data
      const mockMessages = [
        { id: 1, text: 'Hello', sender: 'user', timestamp: new Date() },
        { id: 2, text: 'Hi there', sender: 'bot', timestamp: new Date() }
      ];
      
      // Setup mock
      messageService.getAllMessages.mockReturnValue(mockMessages);
      
      // Make request
      const response = await request(app).get('/api/messages');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMessages);
      expect(messageService.getAllMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/messages/:id', () => {
    it('should return a message by ID', async () => {
      // Mock data
      const mockMessage = { id: 1, text: 'Hello', sender: 'user', timestamp: new Date() };
      
      // Setup mock
      messageService.getMessageById.mockReturnValue(mockMessage);
      
      // Make request
      const response = await request(app).get('/api/messages/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMessage);
      expect(messageService.getMessageById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if message not found', async () => {
      // Setup mock
      messageService.getMessageById.mockReturnValue(null);
      
      // Make request
      const response = await request(app).get('/api/messages/999');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Message not found' });
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      // Mock data
      const messageData = { text: 'New message', sender: 'user', userId: '123' };
      const createdMessage = { 
        id: 123, 
        text: 'New message', 
        sender: 'user', 
        userId: '123',
        timestamp: expect.any(Date)
      };
      
      // Setup mock
      messageService.createMessage.mockReturnValue(createdMessage);
      
      // Make request
      const response = await request(app)
        .post('/api/messages')
        .send(messageData);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdMessage);
      expect(messageService.createMessage).toHaveBeenCalledWith(messageData);
    });

    it('should return 400 if required fields are missing', async () => {
      // Make request with missing fields
      const response = await request(app)
        .post('/api/messages')
        .send({ text: 'Incomplete data' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Text and sender are required' });
      expect(messageService.createMessage).not.toHaveBeenCalled();
    });
  });
});