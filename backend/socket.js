const logger = require('./utils/logger');
const messageService = require('./services/messageService');
const aiService = require('./services/aiService');

/**
 * Sets up Socket.io event handlers
 * @param {Object} io - Socket.io server instance
 */
function setupSocketHandlers(io) {
  // Store connected users
  const connectedUsers = new Map();
  // Store bot enabled status for each user
  const botEnabledStatus = new Map();

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    
    // Add user to connected users
    connectedUsers.set(socket.id, { id: socket.id, connected: true });
    
    // Set default bot status to enabled
    botEnabledStatus.set(socket.id, true);
    
    // Send connection acknowledgment
    socket.emit('connection_ack', { 
      status: 'connected',
      userId: socket.id,
      message: 'Connected to chat server',
      botEnabled: true
    });
    
    // Send current messages to newly connected client
    const messages = messageService.getAllMessages();
    socket.emit('message_history', messages);
    
    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        logger.info(`Message received from ${socket.id}: ${JSON.stringify(data)}`);
        
        // Validate message data
        if (!data.text || typeof data.text !== 'string') {
          socket.emit('error', { message: 'Invalid message format' });
          return;
        }
        
        // Create new message
        const message = messageService.createMessage({
          text: data.text,
          sender: 'user',
          userId: socket.id
        });
        
        // Broadcast to all clients
        io.emit('new_message', message);
        
        // Check if bot is enabled for this user
        const botEnabled = botEnabledStatus.get(socket.id);
        
        if (botEnabled) {
          // Show typing indicator for bot
          socket.emit('user_typing', {
            userId: 'bot',
            isTyping: true
          });
          
          // Generate AI response after a short delay
          setTimeout(async () => {
            try {
              // Get AI response
              const aiResponse = await aiService.generateResponse(socket.id, data.text);
              
              // Create bot message
              const botMessage = messageService.createMessage({
                text: aiResponse,
                sender: 'bot',
                userId: 'bot'
              });
              
              // Hide typing indicator
              socket.emit('user_typing', {
                userId: 'bot',
                isTyping: false
              });
              
              // Broadcast bot message to all clients
              io.emit('new_message', botMessage);
            } catch (error) {
              logger.error(`Error generating AI response: ${error.message}`);
              socket.emit('error', { message: 'Error generating AI response' });
            }
          }, 1000);
        }
      } catch (error) {
        logger.error(`Error handling message: ${error.message}`);
        socket.emit('error', { message: 'Error processing your message' });
      }
    });
    
    // Handle bot toggle
    socket.on('toggle_bot', (data) => {
      try {
        const enabled = !!data.enabled;
        botEnabledStatus.set(socket.id, enabled);
        socket.emit('bot_status', { enabled });
        logger.info(`Bot ${enabled ? 'enabled' : 'disabled'} for user ${socket.id}`);
      } catch (error) {
        logger.error(`Error toggling bot: ${error.message}`);
        socket.emit('error', { message: 'Error toggling bot status' });
      }
    });
    
    // Handle typing status
    socket.on('typing', (data) => {
      socket.broadcast.emit('user_typing', {
        userId: socket.id,
        isTyping: data.isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      connectedUsers.delete(socket.id);
      botEnabledStatus.delete(socket.id);
      io.emit('user_disconnected', { userId: socket.id });
    });
  });
}

module.exports = { setupSocketHandlers };