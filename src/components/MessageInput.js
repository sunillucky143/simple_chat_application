import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

function MessageInput() {
  const [message, setMessage] = useState('');
  const { sendMessage, updateTypingStatus, connectionStatus } = useChat();
  const isConnected = connectionStatus === 'connected';

  // Handle typing status
  useEffect(() => {
    let typingTimeout;
    
    if (message && isConnected) {
      updateTypingStatus(true);
      
      // Clear typing status after 2 seconds of inactivity
      typingTimeout = setTimeout(() => {
        updateTypingStatus(false);
      }, 2000);
    }
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      updateTypingStatus(false);
    };
  }, [message, updateTypingStatus, isConnected]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      sendMessage(message);
      setMessage('');
      updateTypingStatus(false);
    }
  };

  return (
    <div className="border-t border-gray-300 p-4 bg-white shadow-lg" data-testid="message-input-container">
      <form onSubmit={handleSubmit} className="flex space-x-2" data-testid="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="message-input"
          disabled={!isConnected}
        />
        <button
          type="submit"
          className={`${
            isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          } text-white rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          data-testid="send-button"
          disabled={!isConnected}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageInput;