import { io } from 'socket.io-client';

// Get WebSocket URL from environment variables or use default
const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

// Create a socket instance
let socket;

/**
 * Initialize the socket connection
 * @returns {Object} Socket instance
 */
export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    console.log('Socket initialized');
  }
  return socket;
};

/**
 * Get the current socket instance
 * @returns {Object|null} Socket instance or null if not initialized
 */
export const getSocket = () => socket;

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

/**
 * Send a message through the socket
 * @param {string} text - Message text
 * @returns {boolean} True if message was sent, false otherwise
 */
export const sendMessage = (text) => {
  if (!socket) return false;
  
  socket.emit('send_message', { text });
  return true;
};

/**
 * Send typing status through the socket
 * @param {boolean} isTyping - Whether the user is typing
 */
export const sendTypingStatus = (isTyping) => {
  if (!socket) return;
  
  socket.emit('typing', { isTyping });
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  sendMessage,
  sendTypingStatus
};