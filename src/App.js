import React, { useRef, useEffect } from 'react';
import Header from './components/Header';
import MessageDisplay from './components/MessageDisplay';
import MessageInput from './components/MessageInput';
import ConnectionStatus from './components/ConnectionStatus';
import { useChat } from './context/ChatContext';

function App() {
  const { messages, connectionStatus, error } = useChat();
  const messageDisplayRef = useRef(null);

  // Auto-scroll to the latest message when messages change
  useEffect(() => {
    if (messageDisplayRef.current) {
      messageDisplayRef.current.scrollTop = messageDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100" data-testid="app-container">
      <Header />
      <ConnectionStatus status={connectionStatus} error={error} />
      <MessageDisplay 
        messages={messages} 
        ref={messageDisplayRef}
      />
      <MessageInput />
    </div>
  );
}

export default App;