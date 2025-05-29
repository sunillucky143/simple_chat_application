const logger = require('./utils/logger');
const messageService = require('./services/messageService');

/**
 * Sets up Socket.io event handlers
 * @param {Object} io - Socket.io server instance
 */
function setupSocketHandlers(io) {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    
    // Add user to connected users
    connectedUsers.set(socket.id, { id: socket.id, connected: true });
    
    // Send connection acknowledgment
    socket.emit('connection_ack', { 
      status: 'connected',
      userId: socket.id,
      message: 'Connected to chat server'
    });
    
    // Send current messages to newly connected client
    const messages = messageService.getAllMessages();
    socket.emit('message_history', messages);
    
    // Handle new message
    socket.on('send_message', (data) => {
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
        
        // Simulate bot response after a short delay
        setTimeout(() => {
          const botMessage = messageService.createMessage({
            text: `I received your message: "${data.text}"`,
            sender: 'bot',
            userId: 'bot'
          });
          
          io.emit('new_message', botMessage);
        }, 1000);
      } catch (error) {
        logger.error(`Error handling message: ${error.message}`);
        socket.emit('error', { message: 'Error processing your message' });
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
      io.emit('user_disconnected', { userId: socket.id });
    });
  });
}

module.exports = { setupSocketHandlers };