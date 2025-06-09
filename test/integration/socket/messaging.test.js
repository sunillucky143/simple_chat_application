/**
 * Socket.io Messaging Integration Tests
 * 
 * Tests for Socket.io messaging functionality including sending, receiving,
 * typing indicators, and bot responses.
 */

const { startTestServer, createTestUser, createTestSocketConnection, cleanupTestData } = require('../setup');
const { generateTestData, waitForSocketEvent, wait } = require('../helpers');
const { teardown } = require('../teardown');

// Test configuration
jest.setTimeout(15000);

describe('Socket.io Messaging Integration Tests', () => {
  let testUser;
  let token;
  let socket;

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
    
    // Connect to socket server
    socket = await createTestSocketConnection(token);
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardown();
  });

  // Cleanup after each test
  afterEach(() => {
    // Disconnect socket if connected
    if (socket && socket.connected) {
      socket.disconnect();
    }
    
    cleanupTestData();
  });

  describe('Message Sending Tests', () => {
    test('should successfully send and receive a message', async () => {
      // Generate a unique message
      const messageText = generateTestData('message');
      
      // Set up listener for new_message event
      const messagePromise = waitForSocketEvent(socket, 'new_message');
      
      // Send message
      socket.emit('send_message', { text: messageText });
      
      // Wait for message event
      const receivedMessage = await messagePromise;
      
      // Verify received message
      expect(receivedMessage).toHaveProperty('text', messageText);
      expect(receivedMessage).toHaveProperty('sender', 'user');
      expect(receivedMessage).toHaveProperty('userId');
      expect(receivedMessage).toHaveProperty('timestamp');
      expect(receivedMessage).toHaveProperty('id');
    });

    test('should reject empty messages', async () => {
      // Set up listener for error event
      const errorPromise = waitForSocketEvent(socket, 'error');
      
      // Send empty message
      socket.emit('send_message', { text: '' });
      
      // Wait for error event
      const error = await errorPromise;
      
      // Verify error
      expect(error).toHaveProperty('message');
    });

    test('should reject messages with invalid format', async () => {
      // Set up listener for error event
      const errorPromise = waitForSocketEvent(socket, 'error');
      
      // Send message with invalid format
      socket.emit('send_message', { invalidField: 'test' });
      
      // Wait for error event
      const error = await errorPromise;
      
      // Verify error
      expect(error).toHaveProperty('message');
    });
  });

  describe('Bot Response Tests', () => {
    test('should receive bot response after sending a message', async () => {
      // Generate a unique message
      const messageText = generateTestData('message');
      
      // Set up listener for typing indicator
      const typingPromise = waitForSocketEvent(socket, 'user_typing');
      
      // Set up listener for bot message
      const botMessagePromise = new Promise((resolve) => {
        let messageCount = 0;
        
        socket.on('new_message', (message) => {
          messageCount++;
          
          // The second message should be from the bot
          if (messageCount === 2) {
            resolve(message);
          }
        });
        
        // Set timeout in case bot doesn't respond
        setTimeout(() => {
          resolve(null);
        }, 5000);
      });
      
      // Send message
      socket.emit('send_message', { text: messageText });
      
      // Wait for typing indicator
      const typingData = await typingPromise;
      
      // Verify typing indicator
      expect(typingData).toHaveProperty('userId', 'bot');
      expect(typingData).toHaveProperty('isTyping', true);
      
      // Wait for bot message
      const botMessage = await botMessagePromise;
      
      // Verify bot message
      expect(botMessage).not.toBeNull();
      expect(botMessage).toHaveProperty('sender', 'bot');
      expect(botMessage).toHaveProperty('userId', 'bot');
      expect(botMessage).toHaveProperty('text');
      expect(botMessage).toHaveProperty('timestamp');
      expect(botMessage).toHaveProperty('id');
    });

    test('should toggle bot responses on/off', async () => {
      // First, ensure bot is enabled
      socket.emit('toggle_bot', { enabled: true });
      
      // Wait for bot status confirmation
      const enabledStatus = await waitForSocketEvent(socket, 'bot_status');
      expect(enabledStatus).toHaveProperty('enabled', true);
      
      // Send a message and verify bot responds
      socket.emit('send_message', { text: generateTestData('message') });
      
      // Wait for bot typing indicator
      const typingData = await waitForSocketEvent(socket, 'user_typing');
      expect(typingData).toHaveProperty('userId', 'bot');
      
      // Now disable the bot
      socket.emit('toggle_bot', { enabled: false });
      
      // Wait for bot status confirmation
      const disabledStatus = await waitForSocketEvent(socket, 'bot_status');
      expect(disabledStatus).toHaveProperty('enabled', false);
      
      // Set up a flag to check if bot responds
      let botResponded = false;
      socket.on('user_typing', (data) => {
        if (data.userId === 'bot') {
          botResponded = true;
        }
      });
      
      // Send another message
      socket.emit('send_message', { text: generateTestData('message') });
      
      // Wait a moment to see if bot responds
      await wait(2000);
      
      // Verify bot did not respond
      expect(botResponded).toBe(false);
    });
  });

  describe('Typing Indicator Tests', () => {
    test('should broadcast typing status to other clients', async () => {
      // Connect second client
      const socket2 = await createTestSocketConnection(token);
      
      // Set up listener for typing event on second client
      const typingPromise = waitForSocketEvent(socket2, 'user_typing');
      
      // Send typing indicator from first client
      socket.emit('typing', { isTyping: true });
      
      // Wait for typing event on second client
      const typingData = await typingPromise;
      
      // Clean up
      socket2.disconnect();
      
      // Verify typing data
      expect(typingData).toHaveProperty('userId');
      expect(typingData).toHaveProperty('isTyping', true);
    });

    test('should handle typing status changes', async () => {
      // Connect second client
      const socket2 = await createTestSocketConnection(token);
      
      // Set up listener for first typing event (typing started)
      const typingStartedPromise = waitForSocketEvent(socket2, 'user_typing');
      
      // Send typing started indicator
      socket.emit('typing', { isTyping: true });
      
      // Wait for typing started event
      const typingStartedData = await typingStartedPromise;
      expect(typingStartedData).toHaveProperty('isTyping', true);
      
      // Set up listener for second typing event (typing stopped)
      const typingStoppedPromise = waitForSocketEvent(socket2, 'user_typing');
      
      // Send typing stopped indicator
      socket.emit('typing', { isTyping: false });
      
      // Wait for typing stopped event
      const typingStoppedData = await typingStoppedPromise;
      
      // Clean up
      socket2.disconnect();
      
      // Verify typing data
      expect(typingStoppedData).toHaveProperty('isTyping', false);
    });
  });

  describe('Multiple Client Tests', () => {
    test('should broadcast messages to all connected clients', async () => {
      // Connect second and third clients
      const socket2 = await createTestSocketConnection(token);
      const socket3 = await createTestSocketConnection(token);
      
      // Generate a unique message
      const messageText = `Broadcast test ${Date.now()}`;
      
      // Set up listeners for new_message event on all clients
      const messagePromise1 = waitForSocketEvent(socket, 'new_message');
      const messagePromise2 = waitForSocketEvent(socket2, 'new_message');
      const messagePromise3 = waitForSocketEvent(socket3, 'new_message');
      
      // Send message from first client
      socket.emit('send_message', { text: messageText });
      
      // Wait for message events on all clients
      const message1 = await messagePromise1;
      const message2 = await messagePromise2;
      const message3 = await messagePromise3;
      
      // Clean up
      socket2.disconnect();
      socket3.disconnect();
      
      // Verify all clients received the same message
      expect(message1.id).toBe(message2.id);
      expect(message1.id).toBe(message3.id);
      expect(message1.text).toBe(messageText);
      expect(message2.text).toBe(messageText);
      expect(message3.text).toBe(messageText);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle errors gracefully', async () => {
      // Set up listener for error event
      const errorPromise = waitForSocketEvent(socket, 'error');
      
      // Send invalid data to trigger an error
      socket.emit('send_message', null);
      
      // Wait for error event
      const error = await errorPromise;
      
      // Verify error
      expect(error).toHaveProperty('message');
      
      // Verify connection is still alive
      expect(socket.connected).toBe(true);
    });
  });
});