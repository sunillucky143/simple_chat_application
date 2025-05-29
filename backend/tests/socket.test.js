const { setupSocketHandlers } = require('../socket');
const messageService = require('../services/messageService');
const aiService = require('../services/aiService');

// Mock dependencies
jest.mock('../services/messageService');
jest.mock('../services/aiService');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Socket Handlers', () => {
  let io, socket, mockEmit, mockBroadcast;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock socket.io
    mockEmit = jest.fn();
    mockBroadcast = {
      emit: jest.fn()
    };
    
    socket = {
      id: 'test-socket-id',
      emit: mockEmit,
      broadcast: mockBroadcast,
      on: jest.fn((event, callback) => {
        // Store callbacks for testing
        socket.callbacks = socket.callbacks || {};
        socket.callbacks[event] = callback;
      })
    };
    
    io = {
      on: jest.fn((event, callback) => {
        // Call the connection callback with our mock socket
        if (event === 'connection') {
          callback(socket);
        }
      }),
      emit: jest.fn()
    };
    
    // Mock messageService
    messageService.getAllMessages.mockReturnValue([
      { id: 1, text: 'Welcome message', sender: 'bot', userId: 'bot', timestamp: new Date() }
    ]);
    messageService.createMessage.mockImplementation((data) => ({
      id: Math.floor(Math.random() * 1000),
      ...data,
      timestamp: new Date()
    }));
    
    // Mock aiService
    aiService.generateResponse.mockResolvedValue('AI response');
    
    // Setup socket handlers
    setupSocketHandlers(io);
  });
  
  test('should handle new connections', () => {
    // Check if socket.on was called for connection
    expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
    
    // Check if socket emitted connection_ack
    expect(mockEmit).toHaveBeenCalledWith('connection_ack', expect.objectContaining({
      status: 'connected',
      userId: 'test-socket-id',
      botEnabled: true
    }));
    
    // Check if message history was sent
    expect(mockEmit).toHaveBeenCalledWith('message_history', expect.any(Array));
  });
  
  test('should handle send_message event', async () => {
    // Trigger send_message event
    const messageData = { text: 'Test message' };
    await socket.callbacks.send_message(messageData);
    
    // Check if message was created
    expect(messageService.createMessage).toHaveBeenCalledWith({
      text: 'Test message',
      sender: 'user',
      userId: 'test-socket-id'
    });
    
    // Check if message was broadcast
    expect(io.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
    
    // Check if AI service was called
    expect(aiService.generateResponse).toHaveBeenCalledWith('test-socket-id', 'Test message');
    
    // Check if bot typing indicator was shown
    expect(mockEmit).toHaveBeenCalledWith('user_typing', {
      userId: 'bot',
      isTyping: true
    });
    
    // Fast-forward timers to trigger bot response
    jest.advanceTimersByTime(1000);
    
    // Check if bot message was created and broadcast
    expect(messageService.createMessage).toHaveBeenCalledWith({
      text: expect.any(String),
      sender: 'bot',
      userId: 'bot'
    });
  });
  
  test('should handle toggle_bot event', () => {
    // Trigger toggle_bot event to disable bot
    socket.callbacks.toggle_bot({ enabled: false });
    
    // Check if bot status was updated
    expect(mockEmit).toHaveBeenCalledWith('bot_status', { enabled: false });
    
    // Send a message with bot disabled
    const messageData = { text: 'Test with bot disabled' };
    socket.callbacks.send_message(messageData);
    
    // Check that AI service was not called
    expect(aiService.generateResponse).not.toHaveBeenCalled();
    
    // Re-enable bot
    socket.callbacks.toggle_bot({ enabled: true });
    
    // Check if bot status was updated
    expect(mockEmit).toHaveBeenCalledWith('bot_status', { enabled: true });
    
    // Send another message
    const messageData2 = { text: 'Test with bot enabled' };
    socket.callbacks.send_message(messageData2);
    
    // Check that AI service was called this time
    expect(aiService.generateResponse).toHaveBeenCalled();
  });
  
  test('should handle typing event', () => {
    // Trigger typing event
    socket.callbacks.typing({ isTyping: true });
    
    // Check if typing status was broadcast
    expect(mockBroadcast.emit).toHaveBeenCalledWith('user_typing', {
      userId: 'test-socket-id',
      isTyping: true
    });
  });
  
  test('should handle disconnect event', () => {
    // Trigger disconnect event
    socket.callbacks.disconnect();
    
    // Check if user disconnected was broadcast
    expect(io.emit).toHaveBeenCalledWith('user_disconnected', { userId: 'test-socket-id' });
  });
});