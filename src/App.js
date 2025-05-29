import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import MessageDisplay from './components/MessageDisplay';
import MessageInput from './components/MessageInput';

// Helper function to generate unique IDs
const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

function App() {
  const [messages, setMessages] = useState([
    { id: generateId(), text: 'Hello! How can I help you today?', sender: 'bot', timestamp: new Date() },
  ]);
  
  const messageDisplayRef = useRef(null);

  // Auto-scroll to the latest message when messages change
  useEffect(() => {
    if (messageDisplayRef.current) {
      messageDisplayRef.current.scrollTop = messageDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (text) => {
    if (text.trim() === '') return;
    
    // Add user message using functional update to ensure we're working with the latest state
    setMessages(prevMessages => [
      ...prevMessages, 
      {
        id: generateId(),
        text,
        sender: 'user',
        timestamp: new Date()
      }
    ]);
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: generateId(),
          text: `I received your message: "${text}"`,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100" data-testid="app-container">
      <Header />
      <MessageDisplay 
        messages={messages} 
        ref={messageDisplayRef}
      />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}

export default App;