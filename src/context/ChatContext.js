import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initSocket, getSocket, disconnectSocket, sendMessage as socketSendMessage } from '../services/socketService';

// Create context
const ChatContext = createContext();

// Custom hook to use the chat context
export const useChat = () => useContext(ChatContext);

// Chat provider component
export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const socket = useRef(null);
  
  // Initialize socket connection
  useEffect(() => {
    // Initialize socket
    socket.current = initSocket();
    
    // Connection event handlers
    socket.current.on('connect', () => {
      setConnectionStatus('connected');
      setError(null);
      console.log('Connected to server');
    });
    
    socket.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Disconnected from server');
    });
    
    socket.current.on('connect_error', (err) => {
      setConnectionStatus('error');
      setError(`Connection error: ${err.message}`);
      console.error('Connection error:', err);
    });
    
    // Message event handlers
    socket.current.on('connection_ack', (data) => {
      console.log('Connection acknowledged:', data);
    });
    
    socket.current.on('message_history', (data) => {
      setMessages(data);
    });
    
    socket.current.on('new_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    
    socket.current.on('error', (data) => {
      setError(data.message);
      console.error('Socket error:', data.message);
    });
    
    // Typing status handler
    socket.current.on('user_typing', (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
    });
    
    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);
  
  // Send a message
  const sendMessage = (text) => {
    if (text.trim() === '') return;
    
    // Send message through socket
    const success = socketSendMessage(text);
    
    if (!success) {
      setError('Failed to send message. Please check your connection.');
    }
  };
  
  // Update typing status
  const updateTypingStatus = (isTyping) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('typing', { isTyping });
    }
  };
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  // Context value
  const value = {
    messages,
    connectionStatus,
    error,
    typingUsers,
    sendMessage,
    updateTypingStatus,
    clearError
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;