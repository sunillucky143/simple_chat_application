/**
 * End-to-End Chat Flow Tests
 * 
 * Tests complete chat flows including authentication, messaging, and bot interactions.
 */

const { startTestServer, createTestUser, createTestSocketConnection, cleanupTestData } = require('../setup');
const { generateTestData, waitForSocketEvent, wait } = require('../helpers');
const { teardown } = require('../teardown');
const axios = require('axios');

// Test configuration
jest.setTimeout(20000);

describe('End-to-End Chat Flow Tests', () => {
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

  describe('Complete Chat Journey', () => {
    test('should complete full authentication and chat flow', async () => {
      // Step 1: Create a user
      const userData = await createTestUser();
      const token = userData.token;
      
      // Step 2: Connect to socket server
      const socket = await createTestSocketConnection(token);
      
      // Step 3: Wait for connection acknowledgment
      const ackData = await waitForSocketEvent(socket, 'connection_ack');
      expect(ackData).toHaveProperty('status', 'connected');
      
      // Step 4: Wait for message history
      const messageHistory = await waitForSocketEvent(socket, 'message_history');
      expect(Array.isArray(messageHistory)).toBe(true);
      
      // Step 5: Send a message
      const messageText = generateTestData('message');
      
      // Set up listener for user message
      const userMessagePromise = waitForSocketEvent(socket, 'new_message');
      
      // Send message
      socket.emit('send_message', { text: messageText });
      
      // Wait for user message
      const userMessage = await userMessagePromise;
      expect(userMessage).toHaveProperty('text', messageText);
      expect(userMessage).toHaveProperty('sender', 'user');
      
      // Step 6: Wait for bot typing indicator
      const typingData = await waitForSocketEvent(socket, 'user_typing');
      expect(typingData).toHaveProperty('userId', 'bot');
      expect(typingData).toHaveProperty('isTyping', true);
      
      // Step 7: Wait for bot response
      const botMessagePromise = new Promise((resolve) => {
        socket.on('new_message', (message) => {
          if (message.sender === 'bot') {
            resolve(message);
          }
        });
        
        // Set timeout in case bot doesn't respond
        setTimeout(() => {
          resolve(null);
        }, 5000);
      });
      
      const botMessage = await botMessagePromise;
      expect(botMessage).not.toBeNull();
      expect(botMessage).toHaveProperty('sender', 'bot');
      expect(botMessage).toHaveProperty('text');
      
      // Step 8: Toggle bot off
      socket.emit('toggle_bot', { enabled: false });
      
      // Wait for bot status confirmation
      const botStatus = await waitForSocketEvent(socket, 'bot_status');
      expect(botStatus).toHaveProperty('enabled', false);
      
      // Step 9: Send another message
      const secondMessageText = generateTestData('message');
      
      // Set up listener for second user message
      const secondUserMessagePromise = waitForSocketEvent(socket, 'new_message');
      
      // Send second message
      socket.emit('send_message', { text: secondMessageText });
      
      // Wait for second user message
      const secondUserMessage = await secondUserMessagePromise;
      expect(secondUserMessage).toHaveProperty('text', secondMessageText);
      
      // Step 10: Verify no bot response
      let botResponded = false;
      socket.on('user_typing', (data) => {
        if (data.userId === 'bot') {
          botResponded = true;
        }
      });
      
      // Wait a moment to see if bot responds
      await wait(2000);
      
      // Verify bot did not respond
      expect(botResponded).toBe(false);
      
      // Step 11: Disconnect
      socket.disconnect();
      
      // Verify disconnection
      expect(socket.connected).toBe(false);
    });
  });

  describe('Multi-User Chat Flow', () => {
    test('should support chat between multiple users', async () => {
      // Step 1: Create two users
      const userData1 = await createTestUser();
      const userData2 = await createTestUser();
      
      // Step 2: Connect both users to socket server
      const socket1 = await createTestSocketConnection(userData1.token);
      const socket2 = await createTestSocketConnection(userData2.token);
      
      // Step 3: Wait for connection acknowledgments
      const ack1 = await waitForSocketEvent(socket1, 'connection_ack');
      const ack2 = await waitForSocketEvent(socket2, 'connection_ack');
      
      expect(ack1).toHaveProperty('status', 'connected');
      expect(ack2).toHaveProperty('status', 'connected');
      
      // Step 4: User 1 sends a message
      const message1Text = `Message from user 1: ${Date.now()}`;
      
      // Set up listeners for message on both sockets
      const message1Promise1 = waitForSocketEvent(socket1, 'new_message');
      const message1Promise2 = waitForSocketEvent(socket2, 'new_message');
      
      // Send message from user 1
      socket1.emit('send_message', { text: message1Text });
      
      // Wait for message on both sockets
      const message1OnSocket1 = await message1Promise1;
      const message1OnSocket2 = await message1Promise2;
      
      // Verify both sockets received the same message
      expect(message1OnSocket1.id).toBe(message1OnSocket2.id);
      expect(message1OnSocket1.text).toBe(message1Text);
      expect(message1OnSocket2.text).toBe(message1Text);
      
      // Step 5: User 2 sends a message
      const message2Text = `Message from user 2: ${Date.now()}`;
      
      // Set up listeners for message on both sockets
      const message2Promise1 = waitForSocketEvent(socket1, 'new_message');
      const message2Promise2 = waitForSocketEvent(socket2, 'new_message');
      
      // Send message from user 2
      socket2.emit('send_message', { text: message2Text });
      
      // Wait for message on both sockets
      const message2OnSocket1 = await message2Promise1;
      const message2OnSocket2 = await message2Promise2;
      
      // Verify both sockets received the same message
      expect(message2OnSocket1.id).toBe(message2OnSocket2.id);
      expect(message2OnSocket1.text).toBe(message2Text);
      expect(message2OnSocket2.text).toBe(message2Text);
      
      // Step 6: User 1 shows typing indicator
      // Set up listener for typing event on socket 2
      const typingPromise = waitForSocketEvent(socket2, 'user_typing');
      
      // Send typing indicator from user 1
      socket1.emit('typing', { isTyping: true });
      
      // Wait for typing event on socket 2
      const typingData = await typingPromise;
      
      // Verify typing data
      expect(typingData).toHaveProperty('userId', socket1.id);
      expect(typingData).toHaveProperty('isTyping', true);
      
      // Step 7: Clean up
      socket1.disconnect();
      socket2.disconnect();
      
      // Verify disconnection
      expect(socket1.connected).toBe(false);
      expect(socket2.connected).toBe(false);
    });
  });

  describe('Chat History Flow', () => {
    test('should provide message history to newly connected users', async () => {
      // Step 1: Create a user and connect
      const userData = await createTestUser();
      const socket1 = await createTestSocketConnection(userData.token);
      
      // Step 2: Send several messages
      const messages = [
        `Test message 1: ${Date.now()}`,
        `Test message 2: ${Date.now() + 1}`,
        `Test message 3: ${Date.now() + 2}`
      ];
      
      // Send messages sequentially
      for (const messageText of messages) {
        // Send message
        socket1.emit('send_message', { text: messageText });
        
        // Wait for message to be processed
        await waitForSocketEvent(socket1, 'new_message');
        
        // Wait a moment between messages
        await wait(500);
      }
      
      // Step 3: Disconnect first socket
      socket1.disconnect();
      
      // Step 4: Connect a new socket with the same user
      const socket2 = await createTestSocketConnection(userData.token);
      
      // Step 5: Wait for message history
      const messageHistory = await waitForSocketEvent(socket2, 'message_history');
      
      // Verify message history
      expect(Array.isArray(messageHistory)).toBe(true);
      
      // Check if all sent messages are in the history
      const foundMessages = messages.map(text => 
        messageHistory.some(msg => msg.text === text)
      );
      
      // All messages should be found
      expect(foundMessages.every(found => found)).toBe(true);
      
      // Step 6: Clean up
      socket2.disconnect();
    });
  });

  describe('Error Recovery in Chat Flow', () => {
    test('should recover from connection errors', async () => {
      // Step 1: Create a user
      const userData = await createTestUser();
      const token = userData.token;
      
      // Step 2: Connect to socket server
      const socket = await createTestSocketConnection(token);
      
      // Step 3: Verify connection
      expect(socket.connected).toBe(true);
      
      // Step 4: Manually disconnect (simulating network issue)
      socket.disconnect();
      
      // Wait a moment
      await wait(1000);
      
      // Verify disconnection
      expect(socket.connected).toBe(false);
      
      // Step 5: Reconnect
      socket.connect();
      
      // Wait for reconnection
      const reconnectPromise = new Promise((resolve) => {
        socket.on('connect', () => {
          resolve(true);
        });
        
        // Set timeout in case reconnection fails
        setTimeout(() => {
          resolve(false);
        }, 5000);
      });
      
      // Wait for reconnection result
      const reconnected = await reconnectPromise;
      
      // Verify reconnection
      expect(reconnected).toBe(true);
      expect(socket.connected).toBe(true);
      
      // Step 6: Verify functionality after reconnection
      // Send a message
      const messageText = generateTestData('message');
      
      // Set up listener for message
      const messagePromise = waitForSocketEvent(socket, 'new_message');
      
      // Send message
      socket.emit('send_message', { text: messageText });
      
      // Wait for message
      const message = await messagePromise;
      
      // Verify message
      expect(message).toHaveProperty('text', messageText);
      
      // Step 7: Clean up
      socket.disconnect();
    });

    test('should handle invalid message formats gracefully', async () => {
      // Step 1: Create a user and connect
      const userData = await createTestUser();
      const socket = await createTestSocketConnection(userData.token);
      
      // Step 2: Send invalid message format
      // Set up listener for error
      const errorPromise = waitForSocketEvent(socket, 'error');
      
      // Send invalid message
      socket.emit('send_message', { invalidField: 'test' });
      
      // Wait for error
      const error = await errorPromise;
      
      // Verify error
      expect(error).toHaveProperty('message');
      
      // Step 3: Verify connection is still alive
      expect(socket.connected).toBe(true);
      
      // Step 4: Send valid message after error
      const messageText = generateTestData('message');
      
      // Set up listener for message
      const messagePromise = waitForSocketEvent(socket, 'new_message');
      
      // Send message
      socket.emit('send_message', { text: messageText });
      
      // Wait for message
      const message = await messagePromise;
      
      // Verify message
      expect(message).toHaveProperty('text', messageText);
      
      // Step 5: Clean up
      socket.disconnect();
    });
  });
});