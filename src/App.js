import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import MessageDisplay from './components/MessageDisplay';
import MessageInput from './components/MessageInput';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot', timestamp: new Date() },
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
    
    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: `I received your message: "${text}"`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
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