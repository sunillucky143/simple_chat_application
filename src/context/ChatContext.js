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
  const [botEnabled, setBotEnabled] = useState(true);
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
      if (data.botEnabled !== undefined) {
        setBotEnabled(data.botEnabled);
      }
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
    
    // Bot status handler
    socket.current.on('bot_status', (data) => {
      setBotEnabled(data.enabled);
    });
    
    // Typing status handler
    socket.current.on('user_typing', (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
    });
    
    // Load bot preference from localStorage
    const savedBotEnabled = localStorage.getItem('botEnabled');
    if (savedBotEnabled !== null) {
      const isEnabled = savedBotEnabled === 'true';
      setBotEnabled(isEnabled);
      // Sync with server when connection is established
      if (socket.current && socket.current.connected) {
        socket.current.emit('toggle_bot', { enabled: isEnabled });
      }
    }
    
    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);
  
  // Effect to save bot preference to localStorage
  useEffect(() => {
    localStorage.setItem('botEnabled', botEnabled.toString());
  }, [botEnabled]);
  
  // Send a message
  const sendMessage = (text) => {
    if (text.trim() === '') return;
    
    // Send message through socket
    const success = socketSendMessage(text);
    
    if (!success) {
      setError('Failed to send message. Please check your connection.');
    }
  };
  
  // Toggle bot status
  const toggleBot = () => {
    const newStatus = !botEnabled;
    setBotEnabled(newStatus);
    
    const socket = getSocket();
    if (socket) {
      socket.emit('toggle_bot', { enabled: newStatus });
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
    botEnabled,
    sendMessage,
    toggleBot,
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