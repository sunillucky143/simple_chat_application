const aiService = require('../services/aiService');

describe('AI Service', () => {
  beforeEach(() => {
    // Clear conversation history before each test
    aiService.clearHistory('test-user');
  });
  
  test('should generate a response for user input', async () => {
    const response = await aiService.generateResponse('test-user', 'Hello there');
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });
  
  test('should maintain conversation history', async () => {
    // Add a message to history
    aiService.addToHistory('test-user', { 
      sender: 'user', 
      text: 'What is your name?' 
    });
    
    // Get history
    const history = aiService.getUserHistory('test-user');
    
    // Check if history contains the message
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('What is your name?');
  });
  
  test('should generate contextually relevant responses', async () => {
    // First message
    const response1 = await aiService.generateResponse('test-user', 'Hello');
    expect(response1).toBeTruthy();
    
    // Second message - greeting response should be different from first
    const response2 = await aiService.generateResponse('test-user', 'How are you?');
    expect(response2).toBeTruthy();
    expect(response2).not.toBe(response1);
  });
  
  test('should handle different types of user inputs', async () => {
    // Test greeting
    const greetingResponse = await aiService.generateResponse('test-user', 'hi there');
    expect(greetingResponse).toContain('Hello');
    
    // Clear history for next test
    aiService.clearHistory('test-user');
    
    // Test question
    const questionResponse = await aiService.generateResponse('test-user', 'who are you?');
    expect(questionResponse).toContain('I\'m an AI');
    
    // Clear history for next test
    aiService.clearHistory('test-user');
    
    // Test thank you
    const thankYouResponse = await aiService.generateResponse('test-user', 'thank you for your help');
    expect(thankYouResponse).toContain('welcome');
  });
  
  test('should clear conversation history', async () => {
    // Add a message to history
    aiService.addToHistory('test-user', { 
      sender: 'user', 
      text: 'Test message' 
    });
    
    // Clear history
    aiService.clearHistory('test-user');
    
    // Check if history is empty
    const history = aiService.getUserHistory('test-user');
    expect(history).toHaveLength(0);
  });
});